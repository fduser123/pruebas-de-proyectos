import * as tf from '@tensorflow/tfjs';
import { pipeline } from '@huggingface/transformers';

const STORAGE_USER = 'ai-user-examples';
const STORAGE_MODEL = 'localstorage://situation-ai';

// ---- Generador de ~12000 ejemplos variados ----
const SEEDS = {
  saludo: ['hola','buenos dias','buenas tardes','buenas noches','que tal','como estas','hi','hello','hey','saludos','buen dia','que onda','que hubo'],
  despedida: ['adios','hasta luego','nos vemos','bye','chao','hasta pronto','me voy','me retiro','hasta la proxima','cuídate'],
  agradecimiento: ['gracias','muchas gracias','te lo agradezco','thank you','gracias por todo','mil gracias','se agradece'],
  ayuda: ['ayuda','que puedes hacer','como funciona','help','necesito ayuda','puedes ayudarme','que haces','para que sirves'],
  identidad: ['quien eres','como te llamas','que eres','cuál es tu nombre','quien eres tu','presentate'],
  emocion_triste: ['estoy triste','me siento mal','estoy decaido','me siento solo','tengo ganas de llorar','estoy deprimido','me siento vacio'],
  emocion_feliz: ['estoy feliz','me siento bien','estoy alegre','me siento genial','que bueno','estoy contento','todo bien'],
  emocion_enojado: ['estoy enojado','me molesta','estoy furioso','me irrita','estoy molesto','me enfada'],
  emocion_cansado: ['estoy cansado','tengo sueño','estoy agotado','me siento cansado','no puedo mas'],
  emergencia: ['hay una emergencia','necesito ayuda urgente','socorro','auxilio','es una emergencia','llama a emergencias'],
  afirmacion: ['si','claro','por supuesto','de acuerdo','correcto','exacto','asi es','ok','vale'],
  negacion: ['no','nunca','jamás','para nada','en absoluto','no quiero','negativo'],
  pregunta: ['que','como','cuando','donde','por que','quien','cual','cuanto','podrias explicar'],
  tiempo: ['que hora es','que dia es hoy','fecha','tiempo','clima de hoy'],
  entorno_primavera: ['primavera','pon primavera','cambia a primavera','quiero primavera','ambiente primavera'],
  entorno_verano: ['verano','pon verano','cambia a verano','quiero verano','ambiente verano'],
  entorno_otonio: ['otono','otoño','pon otono','cambia a otono','quiero otono','ambiente otono'],
  entorno_invierno: ['invierno','pon invierno','cambia a invierno','quiero invierno','ambiente invierno'],
  comida: ['tengo hambre','quiero comer','comida','tengo sed','almuerzo','cena','desayuno'],
  trabajo: ['trabajo','oficina','tengo que trabajar','estoy trabajando','reunion','meeting'],
  familia: ['familia','mis hijos','mis padres','mi esposa','mi esposo','hermanos'],
  salud: ['me duele','estoy enfermo','salud','doctor','medicina','me siento mal del estomago'],
  dinero: ['dinero','plata','costo','precio','cuanto cuesta','pagar'],
  viaje: ['viaje','viajar','vacaciones','destino','aeropuerto','hotel'],
  tecnologia: ['computadora','telefono','internet','app','software','tecnologia'],
  deporte: ['deporte','futbol','gimnasio','correr','ejercicio','entrenar'],
  musica: ['musica','cancion','playlist','cantar','concierto'],
  clima: ['lluvia','sol','nieve','viento','calor','frio','tormenta'],
};

const WRAPPERS = [
  (s) => s,
  (s) => 'por favor ' + s,
  (s) => s + ' por favor',
  (s) => 'oye ' + s,
  (s) => 'hey ' + s,
  (s) => s + ' gracias',
  (s) => 'me puedes decir ' + s,
  (s) => 'quiero ' + s,
  (s) => 'necesito ' + s,
  (s) => s + '!',
  (s) => '¿' + s + '?',
  (s) => 'hmm ' + s,
];

function generateDataset(target = 12000) {
  const out = [];
  const labels = Object.keys(SEEDS);
  // build base variants
  const base = [];
  for (const label of labels) {
    for (const seed of SEEDS[label]) {
      for (const w of WRAPPERS) {
        base.push({ text: w(seed), label });
      }
    }
  }
  // replicate with light noise until target
  if (base.length >= target) return base.slice(0, target);
  const result = [...base];
  let i = 0;
  while (result.length < target) {
    const item = base[i % base.length];
    // small mutation: add trailing space or alternate punctuation
    const mutated = item.text + (Math.random() < 0.5 ? ' ' : '');
    result.push({ text: mutated, label: item.label });
    i++;
    if (i > base.length * 100) break;
  }
  return result.slice(0, target);
}

const DEFAULT_EXAMPLES = generateDataset(12000);

const SITUATION_RESPONSES = {
  saludo: ['¡Hola! Soy tu avatar low-poly. ¿En qué te ayudo?', '¡Hey! Encantado de verte.'],
  despedida: ['¡Hasta pronto! Vuelve cuando quieras.', '¡Adiós! Cuídate.'],
  agradecimiento: ['¡De nada! 😊', 'Un placer ayudarte.'],
  ayuda: ['Puedo conversar, cambiar el entorno del parque y hablar por voz. Prueba los botones de estación o el micrófono.'],
  identidad: ['Soy un avatar low-poly creado con Three.js y una red neuronal entrenada en el navegador.'],
  emocion_triste: ['Lo siento. Estoy aquí para acompañarte. ¿Quieres cambiar a un entorno más cálido?'],
  emocion_feliz: ['¡Me alegra! Disfrutemos del parque.'],
  emergencia: ['Entendido, situación de emergencia. Busca ayuda inmediata si es necesario.'],
  desconocido: ['No estoy seguro de entender. ¿Puedes reformular?'],
};

export class SituationAI {
  constructor() {
    this.extractor = null;
    this.model = null;
    this.trained = false;
    this.labels = [];
    this.labelIndex = {};
    this.examples = this.loadExamples();
  }

  loadExamples() {
    try {
      const raw = localStorage.getItem(STORAGE_EXAMPLES);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [...DEFAULT_EXAMPLES];
  }

  saveExamples() {
    try { localStorage.setItem(STORAGE_EXAMPLES, JSON.stringify(this.examples)); } catch (e) {}
  }

  addExample(text, label) {
    if (!text || !label) return;
    this.examples.push({ text: text.trim(), label: label.trim() });
    this.saveExamples();
  }

  removeLastExample() {
    this.examples.pop();
    this.saveExamples();
  }

  buildLabels() {
    this.labels = [...new Set(this.examples.map((e) => e.label))].sort();
    this.labels.forEach((l, i) => { this.labelIndex[l] = i; });
  }

  async initExtractor(onProgress) {
    if (this.extractor) return;
    this.extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', {
      progress_callback: (p) => { if (onProgress) onProgress(p); },
    });
  }

  async embed(texts) {
    await this.initExtractor();
    const out = await this.extractor(texts, { pooling: 'mean', normalize: true });
    return out.tolist();
  }

  async train(onProgress) {
    this.buildLabels();
    if (this.labels.length < 2) throw new Error('Se necesitan al menos 2 situaciones distintas.');
    await this.initExtractor((p) => { if (onProgress) onProgress({ stage: 'model', progress: p.progress }); });
    if (onProgress) onProgress({ stage: 'embed', progress: 0 });
    const texts = this.examples.map((e) => e.text);
    const vectors = await this.embed(texts);
    const dim = vectors[0].length;
    const xs = vectors;
    const ys = this.examples.map((e) => this.labelIndex[e.label]);

    const xTensor = tf.tensor2d(xs);
    const yTensor = tf.tensor1d(ys, 'int32');

    this.model = tf.sequential();
    this.model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [dim] }));
    this.model.add(tf.layers.dropout({ rate: 0.2 }));
    this.model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    this.model.add(tf.layers.dense({ units: this.labels.length, activation: 'softmax' }));
    this.model.compile({ optimizer: tf.train.adam(0.005), loss: 'sparseCategoricalCrossentropy', metrics: ['accuracy'] });

    const epochs = 60;
    await this.model.fit(xTensor, yTensor, {
      epochs,
      batchSize: Math.min(16, this.examples.length),
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (onProgress) onProgress({ stage: 'train', epoch: epoch + 1, total: epochs, acc: logs?.acc ?? logs?.accuracy });
        },
      },
    });
    xTensor.dispose();
    yTensor.dispose();
    this.trained = true;
    try { await this.model.save(STORAGE_MODEL); } catch (e) {}
  }

  async load() {
    this.buildLabels();
    try {
      this.model = await tf.loadLayersModel(STORAGE_MODEL);
      this.trained = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  async predict(text) {
    if (!this.model || !this.trained) return null;
    await this.initExtractor();
    const vectors = await this.embed([text]);
    const input = tf.tensor2d(vectors);
    const pred = this.model.predict(input);
    const data = await pred.data();
    input.dispose();
    pred.dispose();
    let best = 0, bestScore = -1;
    for (let i = 0; i < data.length; i++) if (data[i] > bestScore) { bestScore = data[i]; best = i; }
    const label = this.labels[best];
    return { label, score: bestScore };
  }

  responseFor(label) {
    if (label && label.startsWith('entorno_')) return null;
    const r = SITUATION_RESPONSES[label];
    if (Array.isArray(r)) return r[Math.floor(Math.random() * r.length)];
    if (r === undefined) return SITUATION_RESPONSES.desconocido[0];
    return r;
  }
}

export { DEFAULT_EXAMPLES };
