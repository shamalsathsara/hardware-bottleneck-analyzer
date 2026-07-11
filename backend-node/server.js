// --------------------------------------------------------------------------
// EXPRESS.JS SERVER (THE API BRIDGE)
// --------------------------------------------------------------------------
// This file is the main entry point for our Node.js backend. It connects
// the React frontend to the MongoDB database and the Python AI server.

const express  = require('express')  // Framework to create the web server
const mongoose = require('mongoose') // Tool to talk to MongoDB databases
const cors     = require('cors')     // Security middleware to allow frontend requests
const axios    = require('axios')    // HTTP client to send data to the Python AI
require('dotenv').config();          // Loads secret variables from the .env file

const authRouter = require('./routes/auth'); // Import our login/register routes
const userRouter = require('./routes/user'); // Import our user profile/rigs routes
const pricingRouter = require('./routes/pricing'); // Import dynamic Gemini pricing

const app  = express();
const PORT = process.env.PORT || 4000; // Run on port 4000 unless specified otherwise

// --------------------------------------------------------------------------
// MIDDLEWARE CONFIGURATION
// --------------------------------------------------------------------------
app.use(cors()); // Allow our React frontend to talk to this server from any local port (5173, 5174, etc.)
app.use(express.json()); // Tells the server to understand incoming JSON data (like form submissions)

// Auth routes (handles /api/auth/login and /api/auth/register)
app.use('/api/auth', authRouter);

// User profile routes (handles /api/user/rigs)
app.use('/api/user', userRouter);

// Pricing routes
app.use('/api/pricing', pricingRouter);

// --------------------------------------------------------------------------
// DATABASE CONFIGURATION
// --------------------------------------------------------------------------
// We define "loose" schemas (strict: false) because our CSV data has many 
// different columns, and we want MongoDB to accept all of them without complaining.
const cpuSchema = new mongoose.Schema({}, { strict: false });
const gpuSchema = new mongoose.Schema({}, { strict: false });

const CPU = mongoose.model('CPU', cpuSchema);
const GPU = mongoose.model('GPU', gpuSchema);

// Connect to MongoDB Atlas with Retry Logic
// This prevents the server from permanently crashing if the database has a momentary hiccup.
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Successfully connected to MongoDB Atlas!');
    } catch (err) {
        console.error('❌ MongoDB Connection Error. Retrying in 5 seconds...', err.message);
        setTimeout(connectDB, 5000);
    }
};
connectDB();

// --------------------------------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------------------------------

// 1. GET /api/cpus/search -> Searches CPUs by name (limits to 20 to save bandwidth)
app.get('/api/cpus/search', async(req, res) => {
    try{
        const searchQuery = req.query.q || '';
        console.log(`Searching CPUs for: "${searchQuery}"`);
        
        // Use a case-insensitive regular expression to find matches
        const cpus = await CPU.find({ cpuName: { $regex: searchQuery, $options: 'i' } })
                              .select('cpuName cpuMark cores') // Only send what frontend needs
                              .sort({ cpuName: 1 })
                              .limit(20)
                              .lean(); // .lean() makes the query faster by returning plain JSON
        res.json(cpus);
    }catch (error){
        res.status(500).json({ error:"❌ Failed to fetch CPUs"});
    }
});

// 2. GET /api/gpus/search -> Searches GPUs by name (limits to 20 to save bandwidth)
app.get('/api/gpus/search', async (req, res) => {
    try{
        const searchQuery = req.query.q || '';
        console.log(`Searching GPUs for: "${searchQuery}"`);
        
        const gpus = await GPU.find({ Device: { $regex: searchQuery, $options: 'i' } })
                              .select('Device Manufacturer CUDA') // Only send what frontend needs
                              .sort({ Device: 1 })
                              .limit(20)
                              .lean();
        res.json(gpus);
    }catch (error){
        res.status(500).json({ error: "❌ Failed to fetch GPUs" })
    }
});

// 2.5 GET /api/hardware/stats -> Returns the maximum performance scores to allow dynamic tiering
app.get('/api/hardware/stats', async (req, res) => {
    try {
        // Find the absolute highest CPU and GPU score in the database
        // This allows our frontend to dynamically scale hardware tiers without hardcoding!
        const topCpu = await CPU.findOne().sort({ cpuMark: -1 }).select('cpuMark').lean();
        const topGpu = await GPU.findOne().sort({ CUDA: -1 }).select('CUDA').lean();

        res.json({
            maxCpuMark: topCpu ? topCpu.cpuMark : 100000,
            maxGpuCuda: topGpu ? topGpu.CUDA : 500000
        });
    } catch (error) {
        res.status(500).json({ error: "❌ Failed to fetch hardware stats" });
    }
});

// 2.6 GET /api/cpus/all-lightweight -> Lightweight fetch for recommendation engine
app.get('/api/cpus/all-lightweight', async(req, res) => {
    try{
        const cpus = await CPU.find().select('cpuName cpuMark cores').sort({ cpuName: 1 }).lean(); 
        res.json(cpus);
    }catch (error){
        res.status(500).json({ error:"❌ Failed to fetch CPUs"});
    }
});

// 2.7 GET /api/gpus/all-lightweight -> Lightweight fetch for recommendation engine
app.get('/api/gpus/all-lightweight', async(req, res) => {
    try{
        const gpus = await GPU.find().select('Device CUDA').sort({ Device: 1 }).lean(); 
        res.json(gpus);
    }catch (error){
        res.status(500).json({ error:"❌ Failed to fetch GPUs"});
    }
});

// 3. POST /api/predict -> The "Bridge" endpoint
// React sends hardware specs here, and this server forwards it to the Python Flask AI.
app.post('/api/predict', async (req, res) => {
    try{
        console.log("Received Hardware Data from Frontend...")
        
        // Call the Python AI. 
        // We add a 10-second timeout so it doesn't hang forever if Python crashes.
        const pythonAiUrl = process.env.AURA_AI_URL || 'http://127.0.0.1:5000';
        const auraResponse =  await axios.post(`${pythonAiUrl}/predict`, req.body, { timeout: 10000 });

        // Send the AI's predicted FPS back to the React frontend
        res.json(auraResponse.data);
    
    }catch (error){
        console.error("Have an Error with Aura AI!", error.message);
        res.status(500).json({ error: "Failed to get prediction!"});
    }
});

// --------------------------------------------------------------------------
// START SERVER
// --------------------------------------------------------------------------
if (require.main === module) {
    app.listen(PORT, () => {
        console.log('----------------------------------------------')
        console.log(`✅ Node.js Backend is running on port ${PORT}`); 
        console.log('----------------------------------------------')
    });
}

module.exports = app;
