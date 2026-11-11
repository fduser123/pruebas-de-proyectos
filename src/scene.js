import * as THREE from 'three';
import { ENVIRONMENTS } from './environments.js';

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth || 300, canvas.clientHeight || 200, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1.6, 4.2);
  camera.lookAt(0, 1.0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.1);
  sun.position.set(3, 5, 4);
  scene.add(ambient, sun);

  // Ground
  const groundGeo = new THREE.PlaneGeometry(30, 30, 1, 1);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x6fbf5a, flatShading: true, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Trees (low-poly)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4f2a, flatShading: true });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x7ec850, flatShading: true });
  const trees = [];
  const treePositions = [[-4, -3], [4, -2], [-6, 1], [5, 2], [0, -5]];
  for (const [x, z] of treePositions) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6), trunkMat);
    trunk.position.y = 0.6;
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 6), leafMat);
    leaves.position.y = 2.0;
    g.add(trunk, leaves);
    g.position.set(x, 0, z);
    scene.add(g);
    trees.push({ group: g, trunk, leaves });
  }

  // Avatar (low-poly head)
  const avatar = new THREE.Group();
  const headMat = new THREE.MeshStandardMaterial({ color: 0xf2c9a0, flatShading: true, roughness: 0.7 });
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), headMat);
  head.position.y = 1.5;
  avatar.add(head);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, flatShading: true });
  const eyeGeo = new THREE.SphereGeometry(0.07, 6, 6);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.18, 1.55, 0.45);
  eyeR.position.set(0.18, 1.55, 0.45);
  avatar.add(eyeL, eyeR);

  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x8b3a3a, flatShading: true });
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.06), mouthMat);
  mouth.position.set(0, 1.32, 0.48);
  avatar.add(mouth);

  // body
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4f6df5, flatShading: true });
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 6), bodyMat);
  body.position.y = 0.4;
  body.rotation.y = Math.PI;
  avatar.add(body);

  scene.add(avatar);

  // Particles
  const particleCount = 300;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = Math.random() * 6 + 0.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.8 });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  let mouthOpen = 0;
  let targetMouth = 0;
  let envKey = 'spring';
  let particleMode = 'petals';

  function applyEnvironment(key) {
    const e = ENVIRONMENTS[key];
    if (!e) return;
    envKey = key;
    particleMode = e.particles;
    scene.background = new THREE.Color(e.skyTop);
    scene.fog = new THREE.FogExp2(e.fog, e.fogDensity);
    ambient.color.set(e.ambient);
    ambient.intensity = e.ambientIntensity;
    sun.color.set(e.sunColor);
    sun.intensity = e.sunIntensity;
    groundMat.color.set(e.grass);
    for (const t of trees) {
      t.trunk.material.color.set(e.trunk);
      t.leaves.material.color.set(e.leaves);
      t.leaves.visible = key !== 'winter';
    }
    particleMat.color.set(e.particleColor);
    particleMat.opacity = (e.particles === 'none') ? 0 : 0.85;
  }

  function setMouth(openness) {
    targetMouth = Math.max(0, Math.min(1, openness));
  }

  let raf = 0;
  const clock = new THREE.Clock();
  function update() {
    const dt = clock.getDelta();
    // mouth lerp
    mouthOpen += (targetMouth - mouthOpen) * Math.min(1, dt * 12);
    mouth.scale.y = 1 + mouthOpen * 3;
    mouth.position.y = 1.32 - mouthOpen * 0.05;

    // avatar idle bob
    avatar.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.03;
    avatar.rotation.y = Math.sin(clock.elapsedTime * 0.6) * 0.08;

    // particles
    if (particleMat.opacity > 0) {
      const arr = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        arr[i * 3 + 1] -= 0.4 * dt + Math.random() * 0.002;
        arr[i * 3] += (Math.random() - 0.5) * 0.02;
        if (arr[i * 3 + 1] < 0.2) {
          arr[i * 3 + 1] = 6 + Math.random() * 2;
          arr[i * 3] = (Math.random() - 0.5) * 20;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(update);
  }

  function resize() {
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 200;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  applyEnvironment('spring');

  return {
    scene, camera, renderer, avatar, mouth,
    applyEnvironment, setMouth, update, resize, stop: () => cancelAnimationFrame(raf),
  };
}
