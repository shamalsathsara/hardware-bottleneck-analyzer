# Project Aura: Frontend (React + Vite)

```bash
npm install
npm run dev        # http://localhost:5173, talks to the API on http://localhost:4000
npm run lint
npm run build      # production bundle in dist/
npm test           # Cypress E2E (start `npm run dev` first; API calls are stubbed)
```

## Configuration

`VITE_API_URL` is read **at build time** (see `.env.example`):

- **Production behind nginx (recommended):** leave it empty. The app calls `/api/...` on its own domain.
- **API on another host:** set it to that origin, e.g. `VITE_API_URL=https://api.example.com`, and add the frontend origin to the API's `CORS_ORIGINS`.

The app uses client-side routing, so the web server must fall back to `index.html` for unknown paths (`deploy/nginx.conf.example` does this).
