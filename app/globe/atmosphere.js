import * as THREE from 'three';

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return new THREE.Vector3(
    ((n >> 16) & 255) / 255,
    ((n >> 8)  & 255) / 255,
    ( n        & 255) / 255,
  );
}

export function createAtmosphere(radius) {
  const isBrowser = typeof window !== 'undefined';

  const color     = isBrowser && window.GLOBE_ATMOSPHERE_COLOR
    ? hexToRgb(window.GLOBE_ATMOSPHERE_COLOR)
    : new THREE.Vector3(0.2, 0.4, 0.8);
  const opacity   = isBrowser && window.GLOBE_ATMOSPHERE_OPACITY   != null ? window.GLOBE_ATMOSPHERE_OPACITY   : 0.6;
  const intensity = isBrowser && window.GLOBE_ATMOSPHERE_INTENSITY != null ? window.GLOBE_ATMOSPHERE_INTENSITY : 0.65;
  const power     = isBrowser && window.GLOBE_ATMOSPHERE_POWER     != null ? window.GLOBE_ATMOSPHERE_POWER     : 5.0;

  const atmosphereGeometry = new THREE.SphereGeometry(radius * 0.99, 128, 128);
  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
      atmosphereColor:     { value: color },
      atmosphereOpacity:   { value: opacity },
      atmosphereIntensity: { value: intensity },
      atmospherePower:     { value: power },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal   = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3  atmosphereColor;
      uniform float atmosphereOpacity;
      uniform float atmosphereIntensity;
      uniform float atmospherePower;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(atmosphereIntensity - dot(vNormal, vec3(0, 0, 1.0)), atmospherePower);
        gl_FragColor = vec4(atmosphereColor, atmosphereOpacity) * intensity;
      }
    `,
    blending:   THREE.AdditiveBlending,
    side:       THREE.BackSide,
    transparent: true,
    depthWrite: false,
    depthTest:  true,
  });

  return new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
}
