const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  'http://localhost:8765,http://localhost:8000,http://127.0.0.1:8765,http://127.0.0.1:8000'
).split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed: ' + origin));
  },
  methods: ['GET'],
}));

const JOKES_PATH = path.join(__dirname, 'jokes.json');
const jokes = JSON.parse(fs.readFileSync(JOKES_PATH, 'utf8'));
const startedAt = new Date().toISOString();
let totalServed = 0;

console.log(`[dad-joke-api] loaded ${jokes.length} jokes from ${JOKES_PATH}`);

app.get('/', (req, res) => {
  res.json({
    service: 'dad-joke-machine-api',
    endpoints: ['/api/joke', '/api/jokes', '/api/health'],
    jokeCount: jokes.length,
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    jokes: jokes.length,
    served: totalServed,
    startedAt,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.get('/api/jokes', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(jokes);
});

app.get('/api/joke', (req, res) => {
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  totalServed++;
  res.set('Cache-Control', 'no-store');
  res.json(joke);
});

app.listen(PORT, () => {
  console.log(`[dad-joke-api] listening on http://localhost:${PORT}`);
});
