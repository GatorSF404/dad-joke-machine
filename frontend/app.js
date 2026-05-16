(() => {
  'use strict';

  const ANIMATION_MS = 4000;

  const els = {
    button: document.getElementById('bigButton'),
    machine: document.getElementById('machine'),
    jokeText: document.getElementById('jokeText'),
    paper: document.getElementById('readoutPaper'),
    hint: document.getElementById('hint'),
    aboutLink: document.getElementById('aboutLink'),
    status: document.getElementById('statusText'),
  };

  let jokes = [];
  let recent = [];
  let audioCtx = null;
  let isRunning = false;
  let pressCount = 0;
  let jokeSource = 'unknown';
  // If the user presses the button before jokes finish loading (typical during
  // the free-tier API cold start), we queue the press and auto-fire as soon as
  // jokes arrive. Avoids the "I pushed it and nothing happened" UX.
  let pendingPress = false;

  // API base: localhost in dev, the Render Web Service URL in prod (from <meta name="api-base">).
  const API_BASE = (() => {
    const meta = document.querySelector('meta[name="api-base"]')?.content?.trim();
    const host = location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
    return meta || '';
  })();

  // Primary: fetch all jokes from the backend API.
  // Fallback: bundled jokes.json shipped with the static site.
  // The cold-start delay on Render's free tier is felt here on first page load.
  async function loadJokes() {
    const apiUrl = `${API_BASE}/api/jokes`;
    const t0 = performance.now();
    try {
      const res = await fetch(apiUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`API HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error('empty payload');
      jokes = data;
      jokeSource = 'api';
      const ms = Math.round(performance.now() - t0);
      console.log(`[jokes] loaded ${jokes.length} from API in ${ms}ms (${apiUrl})`);
    } catch (apiErr) {
      console.warn(`[jokes] API unavailable (${apiErr.message}); falling back to bundled jokes.json`);
      try {
        const res = await fetch('jokes.json');
        jokes = await res.json();
        jokeSource = 'bundle';
        console.log(`[jokes] loaded ${jokes.length} from bundle`);
      } catch (bundleErr) {
        console.error('[jokes] both API and bundle failed:', bundleErr);
        jokes = [{ id: 'fallback', joke: "Why did the website fail? It lost its connection... emotionally." }];
        jokeSource = 'fallback';
      }
    }
    // Reset waking-state UI if we were showing it
    if (els.status && els.status.textContent === 'WAKING') {
      els.status.textContent = 'READY';
      els.status.setAttribute('fill', '#86efac');
    }
    // If the user pressed the button during the cold start, fire it now
    if (pendingPress && !isRunning) {
      pendingPress = false;
      setTimeout(() => runMachine(), 250);
    }
  }
  loadJokes();

  function pickJoke() {
    if (jokes.length === 0) return "Loading jokes... try again in a sec.";
    // Avoid repeating the last ~50 jokes
    const memory = Math.min(50, Math.floor(jokes.length / 2));
    let candidate;
    let attempts = 0;
    do {
      candidate = jokes[Math.floor(Math.random() * jokes.length)];
      attempts++;
    } while (recent.includes(candidate.id) && attempts < 20);
    recent.push(candidate.id);
    if (recent.length > memory) recent.shift();
    return candidate.joke;
  }

  // ---------- Audio: synthesized cartoon "boing" ----------
  function getCtx() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playBoing() {
    const ctx = getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.45);

    // Vibrato — gives it the wobbly cartoon quality
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 28;
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain).connect(osc.frequency);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 0.6);
    lfo.stop(now + 0.6);
  }

  // tiny "ding" when the joke prints (optional flourish)
  function playDing() {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1760, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.4);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
  }

  // ---------- Machine cycle ----------
  function runMachine() {
    if (isRunning) return;
    if (jokes.length === 0) {
      // Cold-start path: API hasn't responded yet. Queue the press so the
      // machine auto-fires the moment jokes load, and give the user feedback
      // (button click, boing, status change) so it doesn't feel broken.
      pendingPress = true;
      playBoing();
      els.button.classList.add('pressed');
      setTimeout(() => els.button.classList.remove('pressed'), 200);
      els.jokeText.textContent = "Warming up the machine... hold tight.";
      if (els.status) {
        els.status.textContent = 'WAKING';
        els.status.setAttribute('fill', '#fbbf24');
      }
      return;
    }
    isRunning = true;
    pressCount++;
    if (els.hint && pressCount === 1) els.hint.classList.add('hidden');

    playBoing();
    els.button.classList.add('pressed');
    els.button.disabled = true;
    els.machine.classList.add('running');
    if (els.status) {
      els.status.textContent = 'WORKING';
      els.status.setAttribute('fill', '#fbbf24');
    }

    // Show the "printing..." placeholder
    els.paper.classList.remove('revealed');
    els.paper.classList.add('printing');
    els.jokeText.textContent = "...generating...";

    // Pop the button back up after 200ms (springy)
    setTimeout(() => els.button.classList.remove('pressed'), 200);

    // After 4 seconds: reveal joke, stop animation, re-enable
    setTimeout(() => {
      const joke = pickJoke();
      els.jokeText.textContent = joke;
      els.paper.classList.remove('printing');
      els.paper.classList.add('revealed');
      els.machine.classList.remove('running');
      els.button.disabled = false;
      isRunning = false;
      if (els.status) {
        els.status.textContent = 'JOKE OUT';
        els.status.setAttribute('fill', '#86efac');
        setTimeout(() => {
          if (!isRunning && els.status) {
            els.status.textContent = 'READY';
          }
        }, 2500);
      }
      playDing();
    }, ANIMATION_MS);
  }

  // ---------- Wire up ----------
  els.button.addEventListener('click', runMachine);

  // Spacebar / Enter for accessibility
  document.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && document.activeElement !== els.aboutLink) {
      e.preventDefault();
      runMachine();
    }
  });

  // Simple about modal
  els.aboutLink?.addEventListener('click', (e) => {
    e.preventDefault();
    let modal = document.querySelector('.about-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'about-modal open';
      modal.innerHTML = `
        <div class="about-modal-inner">
          <h2>The Dad Joke Machine</h2>
          <p>A wholly unnecessary contraption that delivers ${jokes.length || 'lots of'} dad jokes via a fictional steam-powered process.</p>
          <p style="font-size:0.95rem;opacity:0.8;">Jokes sourced from <a href="https://icanhazdadjoke.com" target="_blank" rel="noopener">icanhazdadjoke.com</a>. Built for groans.</p>
          <button type="button" id="aboutClose">Close</button>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.classList.remove('open'); });
      modal.querySelector('#aboutClose').addEventListener('click', () => modal.classList.remove('open'));
    } else {
      modal.classList.add('open');
    }
  });
})();
