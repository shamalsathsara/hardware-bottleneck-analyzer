//EXPRESS js ( API Bridge )

const express  = require('express')  //create server
const mongoose = require('mongoose')
const cors     = require('cors')     //allows frontend to connect
const axios    = require('axios')    //send http request
require('dotenv').config();          //load env variables

const authRouter = require('./routes/auth'); //Auth routes

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:5173' }));         //Allow frontend to talk this server
app.use(express.json()); //Tells the server to accept json

//Auth routes
app.use('/api/auth', authRouter);

//DATABASE Blueprints
const cpuSchema = new mongoose.Schema({}, { strict: false });
const gpuSchema = new mongoose.Schema({}, { strict: false });

const CPU = mongoose.model('CPU', cpuSchema);
const GPU = mongoose.model('GPU', gpuSchema);

//Database conn
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Successfully connected to MongoDB Atlas!'))
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

//API Routes 
//get all CPU's for frontend ( react )
app.get('/api/cpus', async(req, res) => {
    try{
        console.log("Fetching CPUs from Database...");
        const cpus = await CPU.find().sort({ CPU:1}); //sort alphabatically order
        res.json(cpus);

    }catch (error){
        res.status(500).json({ error:"❌ Failed to fetch CPUs"});
    }
});

//get all CPU's for frontend ( react )
app.get('/api/gpus', async (req, res) => {
    try{
        console.log('Fetching GPUs fron Database...');
        const gpus = await GPU.find().sort({ GPU:1 });
        res.json(gpus);
    }catch (error){
        res.status(500).json({ error: "❌ Failed to fetch GPUs" })
    }
});


//CREATE a BRIDGE for sending data to aura AI

app.post('/api/predict', async (req, res) => {
    try{
        console.log("Received Hardware Data from Frontend...") //checking
        const auraResponse =  await axios.post('http://127.0.0.1:5000/predict', req.body, { timeout: 10000 });  //Node js called Aura AI

        res.json(auraResponse.data); //send aura's answer to the front end
    
    }catch (error){
        console.error("Have an Error with Aura AI!", error.message);
        res.status(500).json({ error: "Failed to get prediction!"});
    }
    
});

//START the Server...

app.listen(PORT, () => {
    console.log('----------------------------------------------')
     console.log(`✅ Node.js Backend is running on port ${PORT}`); //Testing 
      console.log('----------------------------------------------')
});

