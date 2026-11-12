const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const axios = require('axios');

const config = require('./config/env');
const connectDB = require('./config/db');
const { buildHardwareCatalog } = require('./services/datasetV2/hardwareCatalogIndex');

const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const pricingRouter = require('./routes/pricing');
const hardwareRouter = require('./routes/hardware');
const predictRouter = require('./routes/predict');
const gamesRouter = require('./routes/games');
const hardwareMasterRouter = require('./routes/hardwareMaster');
const benchmarksRouter = require('./routes/benchmarks');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);
app.use(helmet());
app.use(cors({
  // An empty allowlist (development only, enforced in config/env.js) allows any origin.
  origin: config.corsOrigins.length ? config.corsOrigins : true,
}));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (req, res) => {
  const db = mongoose.connection.readyState === 1 ? 'up' : 'down';
  let ai = 'down';
  try {
    await axios.get(`${config.aiUrl}/health`, { timeout: 2000 });
    ai = 'up';
  } catch (_) {
    ai = 'down';
  }
  const healthy = db === 'up' && ai === 'up';
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', db, ai });
});

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/games', gamesRouter);
app.use('/api/hardware', hardwareMasterRouter);
app.use('/api/benchmarks', benchmarksRouter);
app.use('/api', hardwareRouter);
app.use('/api', predictRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  // body-parser errors carry a 4xx status (malformed JSON, payload too large).
  const status = Number(err.status || err.statusCode) || 500;
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: err.type || 'BAD_REQUEST', message: 'Invalid request body.' });
  }
  console.error('Unhandled server error:', err);
  return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Internal Server Error' });
});

async function start() {
  await connectDB(config.mongoUri);
  buildHardwareCatalog(); // warm the synchronous spec catalog before serving traffic

  const server = app.listen(config.port, () => {
    console.log(`Project Aura API listening on port ${config.port} (${config.nodeEnv})`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
}

module.exports = app;
