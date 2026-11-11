import { HeadTTS } from '@met4citizen/headtts';

const VISEME_OPEN = {
  sil: 0.0, PP: 0.05, FF: 0.15, TH: 0.25, DD: 0.25,
  kk: 0.3, nn: 0.2, RR: 0.35, CH: 0.3, SS: 0.15,
  aa: 0.9, E: 0.6, I: 0.35, O: 0.7, U: 0.5,
};

export class SpeechEngine {
  constructor({ onMouth, onStatus }) {
    this.onMouth = onMouth;
    this.onStatus = onStatus;
    this.headtts = null;
    this.ready = false;
    this.fallback = !('gpu' in navigator);
  }

  async init() {
    if (this.ready) return;
    this.onStatus?.('Cargando voz neural…');
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.headtts = new HeadTTS({
        audioCtx,
        endpoints: ['webgpu', 'wasm'],
        voices: ['af_bella'],
        defaultVoice: 'af_bella',
        defaultLanguage: 'en-us',
      });
      await this.headtts.connect();
      await this.headtts.setup({ voice: 'af_bella', language: 'en-us', speed: 1, audioEncoding: 'wav' });
      this.ready = true;
      this.onStatus?.('Voz lista');
    } catch (e) {
      console.warn('HeadTTS init failed, falling back to Web Speech:', e);
      this.headtts = null;
      this.ready = true;
      this.fallback = true;
      this.onStatus?.('Voz básica (Web Speech)');
    }
  }

  async speak(text, { onStart, onEnd } = {}) {
    if (!this.ready) await this.init();
    if (this.headtts) {
      return this._speakNeural(text, { onStart, onEnd });
    }
    return this._speakFallback(text, { onStart, onEnd });
  }

  async _speakNeural(text, { onStart, onEnd }) {
    this.onStatus?.('Hablando…');
    onStart?.();
    try {
      const msgs = await this.headtts.synthesize({ input: text });
      const msg = msgs?.[0];
      const data = msg?.data;
      if (!data?.audio) throw new Error('No audio');
      const ctx = this.headtts.settings.audioCtx;
      const source = ctx.createBufferSource();
      source.buffer = data.audio;
      source.connect(ctx.destination);

      const startAt = ctx.currentTime + 0.05;
      const visemes = data.visemes || [];
      const vtimes = data.vtimes || [];
      const vdurations = data.vdurations || [];
      const timers = [];
      visemes.forEach((v, i) => {
        const t = (vtimes[i] || 0) / 1000;
        const d = (vdurations[i] || 80) / 1000;
        const open = VISEME_OPEN[v] ?? 0.3;
        const id = setTimeout(() => this.onMouth?.(open), Math.max(0, (startAt + t - ctx.currentTime) * 1000));
        timers.push(id);
        const id2 = setTimeout(() => this.onMouth?.(0), Math.max(0, (startAt + t + d - ctx.currentTime) * 1000));
        timers.push(id2);
      });

      source.onended = () => {
        timers.forEach(clearTimeout);
        this.onMouth?.(0);
        onEnd?.();
        this.onStatus?.('Listo');
      };
      source.start(startAt);
    } catch (e) {
      console.warn('Neural speak failed:', e);
      this.onMouth?.(0);
      onEnd?.();
      this.onStatus?.('Error de voz');
    }
  }

  _speakFallback(text, { onStart, onEnd }) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) { onEnd?.(); resolve(); return; }
      this.onStatus?.('Hablando…');
      onStart?.();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 1;
      u.onend = () => { this.onMouth?.(0); onEnd?.(); this.onStatus?.('Listo'); resolve(); };
      u.onerror = () => { this.onMouth?.(0); onEnd?.(); this.onStatus?.('Listo'); resolve(); };
      // simple mouth animation
      let iv = setInterval(() => this.onMouth?.(0.3 + Math.random() * 0.5), 120);
      u.onend = () => { clearInterval(iv); this.onMouth?.(0); onEnd?.(); this.onStatus?.('Listo'); resolve(); };
      window.speechSynthesis.speak(u);
    });
  }
}
