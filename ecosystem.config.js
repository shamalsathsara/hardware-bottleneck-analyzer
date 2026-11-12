/**
 * PM2 process file for a single VPS.
 *   pm2 start ecosystem.config.js && pm2 save
 *
 * Both services bind to localhost; nginx is the only public entry point
 * (see deploy/nginx.conf.example). Secrets live in backend-node/.env.
 */
module.exports = {
  apps: [
    {
      name: 'aura-api',
      cwd: './backend-node',
      script: 'server.js',
      instances: 1, // rate limiters are in-memory: keep a single instance
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        AURA_AI_URL: 'http://127.0.0.1:5000',
        MODEL_VERSION: 'v2',
      },
      max_memory_restart: '500M',
      kill_timeout: 10000,
    },
    {
      name: 'aura-ai',
      cwd: './ai-python',
      // --preload loads the models once and shares them between workers.
      script: 'venv/bin/gunicorn',
      args: '--workers 2 --preload --bind 127.0.0.1:5000 --timeout 30 --access-logfile - app:app',
      interpreter: 'none',
      env: {
        MODEL_VERSION: 'v2',
        LOG_LEVEL: 'INFO',
      },
      max_memory_restart: '1G',
    },
  ],
};
