const REPLIES = [
  'Hola, soy tu avatar low-poly. ¿En qué te ayudo?',
  'Me encanta este parque. ¿Cambiamos de estación?',
  'Puedo hablar, escuchar y animar mi boca mientras respondo.',
  'Low-poly significa ligero y rápido. ¡Como yo!',
  'Prueba el micrófono o escribe un mensaje.',
];

const ENV_MAP = {
  env_spring: 'spring',
  env_summer: 'summer',
  env_autumn: 'autumn',
  env_winter: 'winter',
};

export class Chat {
  constructor({ onMessage, onStatus, ai, onEnvChange }) {
    this.onMessage = onMessage;
    this.onStatus = onStatus;
    this.ai = ai;
    this.onEnvChange = onEnvChange;
    this.history = [];
  }

  async respond(text) {
    this.onStatus?.('Pensando…');
    await new Promise((r) => setTimeout(r, 60 + Math.random() * 80));

    let reply = null;
    try {
      if (this.ai && this.ai.trained) {
        const res = await this.ai.predict(text);
        if (res) {
          if (ENV_MAP[res.intent]) {
            this.onEnvChange?.(ENV_MAP[res.intent]);
            reply = `Cambiando a ${ENV_MAP[res.intent]}.`;
          } else {
            reply = this.ai.responseFor(res.intent);
          }
        }
      }
    } catch (e) {
      console.warn('AI predict failed:', e);
    }

    if (!reply) {
      reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    }
    this.history.push({ user: text, bot: reply });
    this.onMessage?.(reply);
    this.onStatus?.('Hablando…');
    return reply;
  }
}
