import * as tf from '@tensorflow/tfjs';

const DATASET = [
  { text: 'hola', intent: 'greeting' },
  { text: 'buenos dias', intent: 'greeting' },
  { text: 'que tal', intent: 'greeting' },
  { text: 'hi', intent: 'greeting' },
  { text: 'hello', intent: 'greeting' },
  { text: 'hey', intent: 'greeting' },
  { text: 'adios', intent: 'farewell' },
  { text: 'hasta luego', intent: 'farewell' },
  { text: 'bye', intent: 'farewell' },
  { text: 'nos vemos', intent: 'farewell' },
  { text: 'gracias', intent: 'thanks' },
  { text: 'muchas gracias', intent: 'thanks' },
  { text: 'thank you', intent: 'thanks' },
  { text: 'te lo agradezco', intent: 'thanks' },
  { text: 'ayuda', intent: 'help' },
  { text: 'que puedes hacer', intent: 'help' },
  { text: 'como funciona', intent: 'help' },
  { text: 'help', intent: 'help' },
  { text: 'cambia a primavera', intent: 'env_spring' },
  { text: 'pon primavera', intent: 'env_spring' },
  { text: 'primavera', intent: 'env_spring' },
  { text: 'verano', intent: 'env_summer' },
  { text: 'pon verano', intent: 'env_summer' },
  { text: 'cambia a verano', intent: 'env_summer' },
  { text: 'otono', intent: 'env_autumn' },
  { text: 'otoño', intent: 'env_autumn' },
  { text: 'pon otono', intent: 'env_autumn' },
  { text: 'invierno', intent: 'env_winter' },
  { text: 'pon invierno', intent: 'env_winter' },
  { text: 'cambia a invierno', intent: 'env_winter' },
  { text: 'quien eres', intent: 'identity' },
  { text: 'como te llamas', intent: 'identity' },
  { text: 'que eres', intent: 'identity' },
];

const INTENT_RESPONSES = {
  greeting: ['¡Hola! Soy tu avatar low-poly. ¿En qué te ayudo?', '¡Hey! Encantado de verte.'],
  farewell: ['¡Hasta pronto! Vuelve cuando quieras.', '¡Adiós! Cuídate.'],
  thanks: ['¡De nada! 😊', 'Un placer ayudarte.'],
  help: ['Puedo conversar, cambiar el entorno del parque y hablar por voz. Prueba los botones de estación o el micrófono.'],
  identity: ['Soy un avatar low-poly creado con Three.js y una red neuronal entrenada en el navegador.'],
  env_spring: null,
  env_summer: null,
  env_autumn: null,
  env_winter: null,
};

function tokenize(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(Boolean);
}

export class IntentAI {
  constructor() {
    this.vocab = [];
    this.intentIndex = {};
    this.intents = [];
    this.model = null;
    this.trained = false;
  }

  buildVocab() {
    const set = new Set();
    for (const d of DATASET) for (const t of tokenize(d.text)) set.add(t);
    this.vocab = [...set].sort();
    this.intents = [...new Set(DATASET.map((d) => d.intent))].sort();
    this.intents.forEach((it, i) => { this.intentIndex[it] = i; });
  }

  encode(text) {
    const tokens = new Set(tokenize(text));
    const vec = new Array(this.vocab.length).fill(0);
    this.vocab.forEach((w, i) => { if (tokens.has(w)) vec[i] = 1; });
    return vec;
  }

  async train(onProgress) {
    this.buildVocab();
    const xs = DATASET.map((d) => this.encode(d.text));
    const ys = DATASET.map((d) => this.intentIndex[d.intent]);
    const xTensor = tf.tensor2d(xs);
    const yTensor = tf.tensor1d(ys, 'int32');

    this.model = tf.sequential();
    this.model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [this.vocab.length] }));
    this.model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    this.model.add(tf.layers.dense({ units: this.intents.length, activation: 'softmax' }));
    this.model.compile({ optimizer: tf.train.adam(0.01), loss: 'sparseCategoricalCrossentropy', metrics: ['accuracy'] });

    const epochs = 80;
    await this.model.fit(xTensor, yTensor, {
      epochs,
      batchSize: 8,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (onProgress) onProgress(epoch + 1, epochs, logs?.acc ?? logs?.accuracy);
        },
      },
    });
    xTensor.dispose();
    yTensor.dispose();
    this.trained = true;
    try { await this.model.save('localstorage://intent-ai'); } catch (e) {}
  }

  async load() {
    this.buildVocab();
    try {
      this.model = await tf.loadLayersModel('localstorage://intent-ai');
      this.trained = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  async predict(text) {
    if (!this.model || !this.trained) return null;
    const vec = this.encode(text);
    const input = tf.tensor2d([vec]);
    const pred = this.model.predict(input);
    const data = await pred.data();
    input.dispose();
    pred.dispose();
    let best = 0, bestScore = -1;
    for (let i = 0; i < data.length; i++) if (data[i] > bestScore) { bestScore = data[i]; best = i; }
    const intent = this.intents[best];
    return { intent, score: bestScore };
  }

  responseFor(intent) {
    const r = INTENT_RESPONSES[intent];
    if (r === null) return null; // handled by caller (env change)
    if (Array.isArray(r)) return r[Math.floor(Math.random() * r.length)];
    return null;
  }
}
