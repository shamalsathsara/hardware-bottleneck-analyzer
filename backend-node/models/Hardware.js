const mongoose = require('mongoose');

const cpuSchema = new mongoose.Schema({}, { strict: false });
const gpuSchema = new mongoose.Schema({}, { strict: false });

const CPU = mongoose.models.CPU || mongoose.model('CPU', cpuSchema);
const GPU = mongoose.models.GPU || mongoose.model('GPU', gpuSchema);

module.exports = { CPU, GPU };
