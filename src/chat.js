const REPLIES = [
  'Hola, soy tu avatar low-poly. ¿En qué te ayudo?',
  'Me encanta este parque. ¿Cambiamos de estación?',
  'Puedo hablar, escuchar y animar mi boca mientras respondo.',
  'Low-poly significa ligero y rápido. ¡Como yo!',
  'Prueba el micrófono o escribe un mensaje.',
];

export class Chat {
  constructor({ onMessage, onStatus }) {
    this.onMessage = onMessage;
    this.onStatus = onStatus;
    this.history = [];
  }

  async respond(text) {
    this.onStatus?.('Pensando…');
    await new Promise((r) => setTimeout(r, 80 + Math.random() * 120));
    const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    this.history.push({ user: text, bot: reply });
    this.onMessage?.(reply);
    this.onStatus?.('Hablando…');
    return reply;
  }
}
