import * as THREE from 'three';

// Create atmosphere glow effect
export function createAtmosphere(radius) {
  // Atmosphere parameters - make it only slightly larger than Earth
  const atmosphereRadius = radius * 0.99;
  
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
        // Create a much more subtle glow effect
        float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 5.0);
        // Less saturated blue color with lower opacity
        gl_FragColor = vec4(0.2, 0.4, 0.8, 0.6) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    opacity: 0.7
  });
  
  // Create atmosphere mesh
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  
  return atmosphere;
} 