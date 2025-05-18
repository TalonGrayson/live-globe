import * as THREE from 'three';

// Create atmosphere glow effect
export function createAtmosphere(radius) {
  // Atmosphere parameters - make it larger for a more visible glow
  const atmosphereRadius = radius * 1.08;
  
  // Create atmosphere geometry and material
  const atmosphereGeometry = new THREE.SphereGeometry(atmosphereRadius, 128, 128);
  const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // Create a stronger glow effect
        float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
        // Brighter blue color with more opacity
        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    opacity: 1.0
  });
  
  // Create atmosphere mesh
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  
  return atmosphere;
} 