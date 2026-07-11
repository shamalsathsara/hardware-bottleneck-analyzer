//FOR TESTING....... dummy texts

const axios = require('axios');

//  The dummy hardware data 
const dummyHardware = {
    "CPU": "Intel i7-12700F",
    "CPU Cores": 12,
    "CPU Threads": 20,
    "CPU TDP (W)": 65,
    "GPU": "NVIDIA RTX 3060",
    "GPU Series": "RTX 3000",
    "GPU VRAM (GB)": 12,
    "GPU Bandwidth (GB/s)": 360,
    "GPU TDP (W)": 170,
    "RAM (GB)": 16,
    "Resolution": "1080p",
    "Graphics Settings": "High"
};

console.log("Sending data to Node.js on port 4000...");

// 2. Send the request to your Node server
axios.post('http://127.0.0.1:4000/api/predict', dummyHardware)
    .then(response => {
        console.log(`\n✅ Success! Project Aura predicts:`);
        console.log(`🎮 Average FPS: ${response.data.predicted_fps}`);
    })
    .catch(error => {
        console.error("❌ Connection Failed:", error.message);
    });