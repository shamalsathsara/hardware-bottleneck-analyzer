//EXPRESS js ( API Bridge )

const express = require('express')  //create server
const mongoose = require('mongoose')
const cors = require('cors')  //allows frontend to connect
const axios = require('axios') //send http request
require('dotenv').config();    //load env variables

const app =  express();
const PORT = process.env.PORT || 4000;

app.use(cors());         //Allow frontend to talk this server
app.use(express.json()); //Tells the server to accept json

app.get('/',(req, res) => {
    res.send('API is running...!') //for checking

})

//CREATE a BRIDGE for sending data to aura AI

app.post('/api/predict', async (req, res) => {
    try{
        console.log("Received Hardware Data from Frontend...") //checking
        const auraResponse =  await axios.post('http://127.0.0.1:5000/predict', req.body);
        console.log("ending Aura's prediction back to frontend...");

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
})