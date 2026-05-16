# The Dad Joke Machine

A goofy two-service web app deployed on [Render](https://render.com). Push the button on the website → a cartoon industrial machine animates for 4 seconds → a random dad joke prints out on simulated tractor-feed paper.

**Live target:** `dadjokesmachine.com`

## Architecture

Two Render services, deployed together as a [Blueprint](https://render.com/docs/blueprint-spec):

```
┌──────────────────────────┐         ┌───────────────────────────────┐
│  Static Site             │  fetch  │  Web Service (Node/Express)   │
│  dad-joke-machine        │  ──→    │  dad-joke-machine-api         │
│  (frontend/)             │         │  (backend/)                   │
│                          │         │                               │
│  HTML, CSS, JS, SVG      │         │  GET /api/joke  → random joke │
│  Static, served from CDN │         │  GET /api/jokes → full list   │
│                          │         │  GET /api/health              │
└──────────────────────────┘         └───────────────────────────────┘
                                                 │
                                                 ▼
                                          jokes.json (744 jokes)
```

The frontend tries the API first. If the API is down or sleeping, it falls back to a bundled `jokes.json` so the site never breaks.

## Project layout

```
.
├── frontend/                 # static site
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── jokes.json            # fallback if the API is unreachable
├── backend/                  # API web service
│   ├── server.js             # tiny Express app
│   ├── package.json
│   └── jokes.json            # primary joke source served by the API
├── scripts/
│   └── refresh-jokes.sh      # re-fetch jokes from icanhazdadjoke.com → both jokes.json files
├── render.yaml               # multi-service Blueprint
├── NOTES.md                  # running notes on the Render customer experience
├── README.md
└── .gitignore
```

## Run it locally

You need **two** terminals (one per service).

### Terminal 1 — backend API

```bash
cd backend
npm install     # first time only
node server.js
```

API now serves at <http://localhost:3000>. Try:
- <http://localhost:3000/api/health>
- <http://localhost:3000/api/joke>

### Terminal 2 — frontend

The repo includes a tiny Node static server at [.claude/serve.js](.claude/serve.js):

```bash
node .claude/serve.js
```

Frontend now at <http://localhost:8765>. Open it in a browser. The frontend auto-detects `localhost` and calls `http://localhost:3000` for jokes.

## Refreshing the joke database

```bash
chmod +x scripts/refresh-jokes.sh   # first time only
./scripts/refresh-jokes.sh
```

This refetches from [icanhazdadjoke.com](https://icanhazdadjoke.com) and writes the result to **both** `backend/jokes.json` (authoritative) and `frontend/jokes.json` (fallback bundle). Commit both.

---

## Deployment to Render

Goal: ship a Static Site (frontend) and a Web Service (backend) using the Blueprint defined in [render.yaml](render.yaml). Walk through each step *and* take notes in [NOTES.md](NOTES.md) as you go — that customer-experience artifact is the most interview-valuable thing here.

### Prerequisites

- A GitHub account
- A Render account (sign up with GitHub for the smoothest path)
- The code pushed to a GitHub repo

### Step 1 — Push the code to GitHub

From this project folder:

```bash
git init
git add .
git commit -m "Initial commit: dad joke machine, two-service app"
git branch -M main
```

Create an empty repo on GitHub (no README), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/dad-joke-machine.git
git push -u origin main
```

### Step 2 — Deploy via Blueprint

1. In the Render dashboard: **New +** → **Blueprint**.
2. Connect your GitHub repo.
3. Render reads [render.yaml](render.yaml) and shows you the two services it's about to create: `dad-joke-machine-api` (web service) and `dad-joke-machine` (static site).
4. Click **Apply**. First deploy takes a few minutes (the backend has to `npm install`).

You'll end up with two URLs:
- Static site: `https://dad-joke-machine.onrender.com` (or similar)
- API: `https://dad-joke-machine-api.onrender.com` (or similar)

### Step 3 — Wire the frontend to the deployed API

After deploy, Render assigns the API service its actual URL. Update [frontend/index.html](frontend/index.html) to match:

```html
<meta name="api-base" content="https://YOUR-ACTUAL-API-URL.onrender.com" />
```

Commit, push, and Render auto-redeploys.

### Step 4 — Configure CORS

The API needs to allow the static site's origin. In the Render dashboard for `dad-joke-machine-api`:

1. **Environment** → edit `ALLOWED_ORIGINS`
2. Set it to your actual static site URL (comma-separated for multiple, e.g., with and without `www`):
   ```
   https://dad-joke-machine.onrender.com,https://dadjokesmachine.com,https://www.dadjokesmachine.com
   ```
3. Save. The API auto-redeploys.

### Step 5 — Test the live `.onrender.com` URL

Open the static site URL. Open browser DevTools → Console. You should see:

```
[jokes] loaded 744 from API in NNNms (https://...onrender.com/api/jokes)
```

**Expect a cold-start delay on first load** (~30s). This is free-tier behavior — the API spins down after 15 minutes of inactivity and wakes up when traffic arrives. This is itself a great talking point about the customer experience of the free tier; capture observations in [NOTES.md](NOTES.md).

### Step 6 — Register the custom domain

Check availability for `dadjokesmachine.com` at:
- [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) — sells at cost (~$10/yr).
- [Namecheap](https://www.namecheap.com) — ~$12/yr.
- [DreamHost](https://panel.dreamhost.com/index.cgi?tree=domain.registration) — ~$15/yr (since you already have an account).

### Step 7 — Point DNS at Render

1. In Render → `dad-joke-machine` static site → **Settings** → **Custom Domains** → **Add Custom Domain**.
2. Enter `dadjokesmachine.com`. Render shows you the DNS records to add.
3. In your registrar's DNS panel, add those records.
4. Render auto-issues a free Let's Encrypt SSL certificate once DNS propagates.

Remember to update `ALLOWED_ORIGINS` on the API to include the new domain.

### Step 8 — Updating

```bash
git add .
git commit -m "describe your change"
git push
```

Render auto-deploys both services on push.

---

## Costs

| Item | Cost |
|---|---|
| Static Site on Render | **Free** |
| Web Service on Render (free tier) | **Free** — but sleeps after 15 min of inactivity |
| Web Service on Render (Starter, no sleep) | $7/mo |
| GitHub repo | **Free** |
| Domain | ~$10–15/yr |
| SSL via Let's Encrypt | **Free** (auto-issued by Render) |

---

## What this project is meant to demonstrate

Built as portfolio context for an HR/Operations interview at Render. The project intentionally touches multiple Render service types so the conversation can go beyond "I made a thing":

- **Static Sites** (the frontend)
- **Web Services** (the backend API)
- **Blueprints / render.yaml** (multi-service infrastructure-as-code)
- **Environment variables** (`ALLOWED_ORIGINS`, `NODE_VERSION`)
- **Health checks** (`/api/health`)
- **Free-tier cold start behavior** (felt firsthand on first load)
- **Custom domains + DNS + Let's Encrypt SSL**

The companion file [NOTES.md](NOTES.md) is a running journal of customer-experience observations captured during the deploy.

---

## Credits

Jokes from the public [icanhazdadjoke.com](https://icanhazdadjoke.com) API. The cartoon-boing sound is synthesized in-browser via the Web Audio API — no audio files needed.
