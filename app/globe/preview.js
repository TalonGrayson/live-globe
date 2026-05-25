import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const BLOOM_SCENE = 1;
const RADIUS = 2;

const SAMPLE_PINS = [
  { latitude: 51.5,  longitude: -0.1  },
  { latitude: 40.7,  longitude: -74.0 },
  { latitude: 35.7,  longitude: 139.7 },
  { latitude: -33.9, longitude: 151.2 },
  { latitude: -15.8, longitude: -47.9 },
  { latitude: 28.6,  longitude: 77.2  },
];

function latLngToVec3(lat, lng, r) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

function hexToVec3(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function buildPinMesh(settings) {
  const geo = new THREE.ConeGeometry(0.07, 0.12, 8);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(settings.pinColor) });
  const mesh = new THREE.InstancedMesh(geo, mat, SAMPLE_PINS.length);
  SAMPLE_PINS.forEach((loc, i) => {
    const pos    = latLngToVec3(loc.latitude, loc.longitude, RADIUS);
    const normal = pos.clone().normalize();
    const q      = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), normal);
    const m      = new THREE.Matrix4().compose(pos.clone().multiplyScalar(1.01), q, new THREE.Vector3(1, 1, 1));
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.layers.enable(BLOOM_SCENE);
  return mesh;
}

export function setupPreview(container, initialSettings) {
  const s = { ...initialSettings };
  const w = container.clientWidth;
  const h = container.clientHeight;

  // — Renderer —
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 1);
  container.appendChild(renderer.domElement);

  // — Scene & camera —
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);
  camera.position.set(0, 0, 6);

  // — Bloom —
  const bloomLayer   = new THREE.Layers();
  bloomLayer.set(BLOOM_SCENE);
  const darkMat      = new THREE.MeshBasicMaterial({ color: 'black' });
  const savedMats    = {};

  // — Earth (no textures, lightweight) —
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS, 48, 48),
    new THREE.MeshPhongMaterial({ color: 0x1a4f9c, shininess: 5 }),
  );
  scene.add(earth);

  // — Atmosphere —
  const atmoUniforms = {
    atmosphereColor:     { value: hexToVec3(s.atmosphereColor) },
    atmosphereOpacity:   { value: s.atmosphereOpacity },
    atmosphereIntensity: { value: s.atmosphereIntensity },
    atmospherePower:     { value: s.atmospherePower },
  };
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 0.99, 32, 32),
    new THREE.ShaderMaterial({
      uniforms: atmoUniforms,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3  atmosphereColor;
        uniform float atmosphereOpacity;
        uniform float atmosphereIntensity;
        uniform float atmospherePower;
        varying vec3 vNormal;
        void main() {
          float i = pow(atmosphereIntensity - dot(vNormal, vec3(0,0,1)), atmospherePower);
          gl_FragColor = vec4(atmosphereColor, atmosphereOpacity) * i;
        }`,
      blending:    THREE.AdditiveBlending,
      side:        THREE.BackSide,
      transparent: true,
      depthWrite:  false,
    }),
  );
  scene.add(atmosphere);

  // — Lighting —
  const sunLight = new THREE.DirectionalLight(0xffffff, s.sunIntensity);
  sunLight.position.set(10, 5, 10);
  scene.add(sunLight);
  const ambLight = new THREE.AmbientLight(0x333333, s.ambientLight);
  scene.add(ambLight);

  // — Stars (minimal count, no texture) —
  const starPositions = new Float32Array(200 * 3);
  for (let i = 0; i < 200; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(Math.random() * 2 - 1);
    const d     = 80;
    starPositions[i * 3]     = d * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = d * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = d * Math.cos(phi);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff, size: s.starSize, transparent: true, opacity: s.starOpacity,
    sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  scene.add(new THREE.Points(starGeo, starMat));

  // — Pins —
  const pinGroup = new THREE.Group();
  let pinMesh = buildPinMesh(s);
  pinGroup.add(pinMesh);
  scene.add(pinGroup);

  // — Post-processing (bloom) —
  const combineShader = {
    uniforms: { baseTexture: { value: null }, bloomTexture: { value: null } },
    vertexShader:   `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D baseTexture, bloomTexture; varying vec2 vUv; void main() { gl_FragColor = texture2D(baseTexture,vUv) + texture2D(bloomTexture,vUv); }`,
  };

  const renderPass = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), s.bloomStrength, s.bloomRadius, s.bloomThreshold);

  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderPass);
  bloomComposer.addPass(bloomPass);

  const finalPass = new ShaderPass(
    new THREE.ShaderMaterial({ uniforms: combineShader.uniforms, vertexShader: combineShader.vertexShader, fragmentShader: combineShader.fragmentShader }),
    'baseTexture',
  );
  finalPass.needsSwap = true;

  const finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderPass);
  finalComposer.addPass(finalPass);
  combineShader.uniforms.bloomTexture.value = bloomComposer.renderTarget2.texture;

  bloomComposer.setSize(w, h);
  finalComposer.setSize(w, h);

  // — Controls —
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping  = true;
  controls.dampingFactor  = 0.05;
  controls.autoRotate     = true;
  controls.autoRotateSpeed = 0.6;
  controls.enablePan      = false;
  controls.minDistance    = 3;
  controls.maxDistance    = 12;

  // — Bloom render helpers —
  function darken(obj) {
    if (obj.isMesh && !obj.layers.test(bloomLayer)) { savedMats[obj.uuid] = obj.material; obj.material = darkMat; }
  }
  function restore(obj) {
    if (savedMats[obj.uuid]) { obj.material = savedMats[obj.uuid]; delete savedMats[obj.uuid]; }
  }
  function renderWithBloom() {
    scene.traverse(darken);
    renderer.clear(); bloomComposer.render();
    scene.traverse(restore);
    renderer.clear(); finalComposer.render();
  }

  // — Animation loop —
  let animId;
  function animate() {
    animId = requestAnimationFrame(animate);
    controls.update();
    renderWithBloom();
  }
  animate();

  // — Public API —
  return {
    applySettings(next) {
      // Pins — update material directly
      if (next.pinColor !== undefined) {
        s.pinColor = next.pinColor;
        pinMesh.material.color.set(s.pinColor);
      }

      // Bloom
      if (next.bloomStrength  !== undefined) bloomPass.strength   = next.bloomStrength;
      if (next.bloomThreshold !== undefined) bloomPass.threshold  = next.bloomThreshold;
      if (next.bloomRadius    !== undefined) bloomPass.radius     = next.bloomRadius;

      // Atmosphere uniforms
      if (next.atmosphereColor     !== undefined) atmoUniforms.atmosphereColor.value.copy(hexToVec3(next.atmosphereColor));
      if (next.atmosphereOpacity   !== undefined) atmoUniforms.atmosphereOpacity.value   = next.atmosphereOpacity;
      if (next.atmosphereIntensity !== undefined) atmoUniforms.atmosphereIntensity.value = next.atmosphereIntensity;
      if (next.atmospherePower     !== undefined) atmoUniforms.atmospherePower.value     = next.atmospherePower;

      // Lighting
      if (next.sunIntensity !== undefined) sunLight.intensity = next.sunIntensity;
      if (next.ambientLight !== undefined) ambLight.intensity = next.ambientLight;

      // Stars
      if (next.starSize    !== undefined) starMat.size    = next.starSize;
      if (next.starOpacity !== undefined) starMat.opacity = next.starOpacity;
    },

    destroy() {
      cancelAnimationFrame(animId);
      controls.dispose();
      bloomComposer.dispose();
      finalComposer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
