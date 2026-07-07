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

// Connect to MongoDB Atlas (the cloud database)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Successfully connected to MongoDB Atlas!'))
    .catch((err) => {
        // If the database fails to connect, crash the server immediately so we know there's a problem.
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

// --------------------------------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------------------------------

// 1. GET /api/cpus -> Sends the full list of CPUs to the React frontend
app.get('/api/cpus', async(req, res) => {
    try{
        console.log("Fetching CPUs from Database...");
        // Sort alphabetically by the CPU name before sending it back
        const cpus = await CPU.find().sort({ cpuName: 1 }); 
        res.json(cpus);
    }catch (error){
        res.status(500).json({ error:"❌ Failed to fetch CPUs"});
    }
});

// 2. GET /api/gpus -> Sends the full list of GPUs to the React frontend
app.get('/api/gpus', async (req, res) => {
    try{
        console.log('Fetching GPUs from Database...');
        const gpus = await GPU.find().sort({ Device: 1 });
        res.json(gpus);
    }catch (error){
        res.status(500).json({ error: "❌ Failed to fetch GPUs" })
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
app.listen(PORT, () => {
    console.log('----------------------------------------------')
    console.log(`✅ Node.js Backend is running on port ${PORT}`); 
    console.log('----------------------------------------------')
});
