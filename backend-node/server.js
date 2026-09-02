// --------------------------------------------------------------------------
// EXPRESS.JS SERVER (THE API BRIDGE)
// --------------------------------------------------------------------------
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const pricingRouter = require('./routes/pricing');
const hardwareRouter = require('./routes/hardware');
const predictRouter = require('./routes/predict');
const gamesRouter = require('./routes/games');
const hardwareMasterRouter = require('./routes/hardwareMaster');

const app = express();
const PORT = process.env.PORT || 4000;

// --------------------------------------------------------------------------
// MIDDLEWARE CONFIGURATION
// --------------------------------------------------------------------------
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// Connect to MongoDB Atlas
connectDB();

// --------------------------------------------------------------------------
// MOUNT API ROUTERS
// --------------------------------------------------------------------------
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/games', gamesRouter);
app.use('/api/hardware', hardwareMasterRouter);
app.use('/api', hardwareRouter);
app.use('/api', predictRouter);

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error('Unhandled server error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// --------------------------------------------------------------------------
// START SERVER
// --------------------------------------------------------------------------
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('----------------------------------------------');
    console.log(`✅ Node.js Backend is running on port ${PORT}`);
    console.log('----------------------------------------------');
  });
}

module.exports = app;
