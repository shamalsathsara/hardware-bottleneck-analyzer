// --------------------------------------------------------------------------
// DATABASE SEEDING SCRIPT
// --------------------------------------------------------------------------
// This file is used to manually upload the hardware data from our 4 CSV files
// directly into the MongoDB Atlas database. It only needs to be run once 
// (or when the CSV files are updated).

const mongoose = require('mongoose')
const csv = require('csvtojson')  // Converts CSV files into JSON objects that MongoDB understands
require('dotenv').config();       // Loads our secret database URL from .env

// 1. Create flexible blueprints for MongoDB
// We use strict: false so we don't have to manually type out all 30+ columns from the CSVs.
const cpuSchema = new mongoose.Schema({}, { strict: false }); 
const gpuSchema = new mongoose.Schema({}, { strict: false });

const CPU = mongoose.model('CPU', cpuSchema);
const GPU = mongoose.model('GPU', gpuSchema);

// This function runs step-by-step (async/await) so everything happens in the correct order.
async function seedDatabase() {  
    try{
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected!");

        // 2. Read the CPU data from the local computer
        console.log("Reading CPU CSV files...");
        const cpuData1 = await csv().fromFile('./CPU/cpu_data1.csv'); 
        const cpuData2 = await csv().fromFile('./CPU/cpu_data2.csv');
        // Merge the two lists together into one massive array
        const allCpuData = [...cpuData1, ...cpuData2];

        // 3. Read the GPU data from the local computer
        console.log("Reading GPU CSV Files...")
        const gpuData1 = await csv().fromFile('./GPU/gpu_data1.csv');
        const gptData2 = await csv().fromFile('./GPU/gpu_data2.csv');
        // Merge the two lists together
        const allGpuData = [...gpuData1, ...gptData2];

        // 4. Clear out the old data so we don't get duplicates
        console.log("Clearing old data...")
        await CPU.deleteMany({});  
        await GPU.deleteMany({});

        // 5. Upload the new data to the cloud
        console.log(`Uploading ${allCpuData.length} CPUs and ${allGpuData.length} GPUs to the cloud `);
        await CPU.insertMany(allCpuData);
        await GPU.insertMany(allGpuData);

        console.log("✅ SUCCESS! Database is fully populated with all 4 files.");
        
        // Shut down this script since the job is done
        process.exit(); 

    }catch (error){  
        // Error handling if file paths are wrong or internet drops
        console.error("❌ Error uploading data. Check your file paths!", error.message);
        process.exit(1);
    }
}

seedDatabase();
