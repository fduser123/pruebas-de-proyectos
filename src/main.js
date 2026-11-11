import './styles.css';
import { createScene } from './scene.js';
import { Chat } from './chat.js';
import { SpeechEngine } from './speech.js';
import { appendMessage, setStatus, bindEnvSelector } from './ui.js';

const heroCanvas = document.getElementById('hero-canvas');
const demoCanvas = document.getElementById('demo-canvas');
const poster = document.getElementById('canvas-poster');

const hero = createScene(heroCanvas);
const demo = createScene(demoCanvas);

hero.update();
demo.update();

// Hide poster once first frame rendered
requestAnimationFrame(() => { if (poster) poster.classList.add('hidden'); });

const chatLog = document.getElementById('chat-log');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const statusEl = document.getElementById('status');
const trainBtn = document.getElementById('train-btn');
const aiStatus = document.getElementById('ai-status');

const ai = { trained: false };

const speech = new SpeechEngine({
  onMouth: (v) => { hero.setMouth(v); demo.setMouth(v); },
  onStatus: (t) => setStatus(statusEl, t),
});

const chat = new Chat({
  onMessage: (reply) => {
    appendMessage(chatLog, reply, 'bot');
    speech.speak(reply, {
      onStart: () => { /* speaking */ },
      onEnd: () => {},
    });
  },
  onStatus: (t) => setStatus(statusEl, t),
  ai,
  onEnvChange: (key) => {
    hero.applyEnvironment(key);
    demo.applyEnvironment(key);
    const btn = [...document.querySelectorAll('.env-btn')].find((b) => b.dataset.env === key);
    if (btn) {
      document.querySelectorAll('.env-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    }
  },
});

async function trainAI(instance) {
  const target = instance || ai;
  setStatus(statusEl, 'Entrenando IA…');
  if (aiStatus) aiStatus.textContent = 'IA: entrenando…';
  trainBtn.disabled = true;
  try {
    await target.train((epoch, total, acc) => {
      if (aiStatus) aiStatus.textContent = `IA: época ${epoch}/${total}`;
    });
    if (aiStatus) aiStatus.textContent = 'IA: entrenada ✓';
    setStatus(statusEl, 'IA entrenada');
  } catch (e) {
    console.error(e);
    if (aiStatus) aiStatus.textContent = 'IA: error';
    setStatus(statusEl, 'Error al entrenar');
  } finally {
    trainBtn.disabled = false;
  }
}
trainBtn?.addEventListener('click', () => trainAI());

// Auto-load or train (lazy-load TensorFlow.js)
(async () => {
  try {
    const { IntentAI } = await import('./ai.js');
    const instance = new IntentAI();
    const loaded = await instance.load();
    ai.trained = instance.trained;
    // replace placeholder with real instance
    Object.assign(ai, instance);
    chat.ai = ai;
    if (loaded) {
      if (aiStatus) aiStatus.textContent = 'IA: cargada ✓';
    } else {
      setTimeout(() => { trainAI(instance); }, 1200);
    }
  } catch (e) {
    console.error('AI load failed:', e);
    if (aiStatus) aiStatus.textContent = 'IA: no disponible';
  }
})();

// Env selector
const envButtons = [...document.querySelectorAll('.env-btn')];
bindEnvSelector(envButtons, (key) => {
  hero.applyEnvironment(key);
  demo.applyEnvironment(key);
});

// Chat form
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  appendMessage(chatLog, text, 'user');
  chatInput.value = '';
  chat.respond(text);
});

// Mode switching
const modeTabs = document.getElementById('mode-tabs');
const micMode = document.getElementById('mic-mode');
const micBig = document.getElementById('mic-big');
let currentMode = 'chat';
function setMode(mode) {
  currentMode = mode;
  [...modeTabs.querySelectorAll('.mode-btn')].forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  chatForm.classList.toggle('hidden', mode !== 'chat');
  micMode.hidden = mode !== 'mic';
  setStatus(statusEl, mode === 'chat' ? 'Modo chat' : 'Modo micrófono');
}
modeTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.mode-btn');
  if (!btn) return;
  setMode(btn.dataset.mode);
});
setMode('chat');

// Speech recognition
let recognition = null;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  let finalSent = false;
  recognition.onresult = (ev) => {
    let interim = '';
    let finalText = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const t = ev.results[i][0].transcript;
      if (ev.results[i].isFinal) finalText += t;
      else interim += t;
    }
    if (interim) setStatus(statusEl, `Escuchando: ${interim}`);
    if (finalText && !finalSent) {
      finalSent = true;
      const text = finalText.trim();
      if (text) {
        appendMessage(chatLog, text, 'user');
        chat.respond(text);
      }
    }
  };
  recognition.onstart = () => { finalSent = false; };
  recognition.onspeechend = () => { try { recognition.stop(); } catch (e) {} };
  recognition.onend = () => {
    micBig?.classList.remove('listening');
    setStatus(statusEl, 'Listo');
  };
}
function startListening() {
  if (!recognition) { setStatus(statusEl, 'Micrófono no soportado'); return; }
  setStatus(statusEl, 'Escuchando…');
  micBig?.classList.add('listening');
  try { recognition.start(); } catch (e) { setStatus(statusEl, 'Error de micrófono'); micBig?.classList.remove('listening'); }
}
micBig?.addEventListener('click', startListening);

// Lazy init speech on first interaction
let speechInited = false;
function ensureSpeech() {
  if (speechInited) return;
  speechInited = true;
  speech.init();
}
chatForm.addEventListener('focusin', ensureSpeech, { once: true });
micBig?.addEventListener('click', ensureSpeech, { once: true });

// Pause renders when tab hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hero.stop();
    demo.stop();
  } else {
    hero.update();
    demo.update();
  }
});

// initial greeting
setTimeout(() => {
  appendMessage(chatLog, 'Hola, soy tu avatar low-poly. ¿En qué te ayudo?', 'bot');
}, 600);
