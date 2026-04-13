const mongoose = require('mongoose')
const csv = require('csvtojson')  //Convert csv files to json
require('dotenv').config();  //load env file

//Create blueprints..
const cpuSchema =  new mongoose.Schema({},{ strict: false})  //Accept any data field
const gpuSchema =  new mongoose.Schema({},{ strict: false})

const CPU = mongoose.model('CPU', cpuSchema)  //Create models
const GPU = mongoose.model('GPU', gpuSchema)

async function seedDatabase() {  //This function runs everything step-by-step using async,await
    try{

        console.log("Connectiong to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected!");

        //Clear old test data
        console.log("Clearing old data...")
        await CPU.deleteMany({});  //Deletes ALL existing data
        await GPU.deleteMany({});

        //Read all CPU Files and combine
        console.log("Reading CPU CSV files...");
        const cpuData1 = await csv().fromFile('./CPU/cpu_data1.csv'); //Read CSV Files and convert to Json
        const cpuData2 = await csv().fromFile('./CPU/cpu_data2.csv');
        //Merge All lists
        const allCpuData = [...cpuData1,...cpuData2];

        //Read all GPU Files and combine
        console.log("Reading GPU CSV Files...")
        const gpuData1 = await csv().fromFile('./GPU/gpu_data1.csv');
        const gptData2 = await csv().fromFile('./GPU/gpu_data2.csv');
        const allGpuData = [...gpuData1,...gptData2];

        //Upload to the cloud
        console.log(`Uploading ${allCpuData.length} CPUs and ${allGpuData.length} GPUs to the cloud `);
        await CPU.insertMany(allCpuData);
        await GPU.insertMany(allGpuData);

        console.log("✅ SUCCESS! Database is fully populated with all 4 files.");
        process.exit(); //Stop after done..




    }catch (error){  //Err handling
        console.error("❌ Error uploading data. Check your file paths!", error.message);
        process.exit(1);
    }
    
}

seedDatabase();
