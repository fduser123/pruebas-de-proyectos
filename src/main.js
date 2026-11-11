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
const micBtn = document.getElementById('mic-btn');
const statusEl = document.getElementById('status');

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
});

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

// Mic
let recognition = null;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.onresult = (ev) => {
    const text = ev.results[0][0].transcript;
    chatInput.value = text;
    chatForm.requestSubmit();
  };
  recognition.onend = () => setStatus(statusEl, 'Listo');
}
micBtn.addEventListener('click', () => {
  if (!recognition) { setStatus(statusEl, 'Micrófono no soportado'); return; }
  setStatus(statusEl, 'Escuchando…');
  try { recognition.start(); } catch (e) { setStatus(statusEl, 'Error de micrófono'); }
});

// Lazy init speech on first interaction
let speechInited = false;
function ensureSpeech() {
  if (speechInited) return;
  speechInited = true;
  speech.init();
}
chatForm.addEventListener('focusin', ensureSpeech, { once: true });
micBtn.addEventListener('click', ensureSpeech, { once: true });

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
