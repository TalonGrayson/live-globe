import * as THREE from 'three';

// Create star field background
export function createStars() {
  // Create stars parameters - more reasonable count
  const starCount = 1500;
  const starDistance = 350; // Further away to avoid clipping
  
  // Create stars geometry
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  
  for (let i = 0; i < starCount; i++) {
    // Create random positions in a spherical pattern
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    
    const x = starDistance * Math.sin(phi) * Math.cos(theta);
    const y = starDistance * Math.sin(phi) * Math.sin(theta);
    const z = starDistance * Math.cos(phi);
    
    // Set positions
    starPositions[i * 3] = x;
    starPositions[i * 3 + 1] = y;
    starPositions[i * 3 + 2] = z;
    
    // Set sizes (smaller for more subtlety)
    starSizes[i] = Math.random() * 0.6 + 0.1;
  }
  
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
  
  // Create a simpler point material
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.0,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: false
  });
  
  // Create a simple circular texture without complexity
  const starTexture = createSimpleStarTexture();
  if (starTexture) {
    starMaterial.map = starTexture;
  }
  
  // Create stars points
  const stars = new THREE.Points(starGeometry, starMaterial);
  
  return stars;
}

// Create a simpler texture for stars
function createSimpleStarTexture() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    
    const context = canvas.getContext('2d');
    if (!context) return null;
    
    // Clear the canvas
    context.fillStyle = 'black';
    context.fillRect(0, 0, 32, 32);
    
    // Draw a simple white circle
    context.beginPath();
    context.arc(16, 16, 8, 0, Math.PI * 2);
    context.closePath();
    
    // Fill with a radial gradient
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 8);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.8, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    context.fillStyle = gradient;
    context.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Configure texture to prevent filtering artifacts
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    
    return texture;
  } catch (error) {
    console.error('Error creating star texture:', error);
    return null;
  }
} 