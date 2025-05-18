import * as THREE from 'three';

// Create Earth with realistic textures
export async function createEarth(radius) {
  const textureLoader = new THREE.TextureLoader();
  const DEBUG_TEXTURES = true; // Enable texture debugging
  
  // Fallback simple texture in case loading fails
  const createFallbackTexture = (color) => {
    console.log(`Creating fallback texture with color ${color}`);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add a grid pattern to make it clear this is a fallback
    if (DEBUG_TEXTURES) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      const gridSize = 64;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  // Load textures with fallbacks
  let diffuseMap, bumpMap, roughnessMap, aoMap;
  
  try {
    // Define texture paths correctly for Remix public assets
    const texturePaths = {
      diffuse: '/assets/textures/earth_diffuse.jpg',
      bump: '/assets/textures/earth_bump.jpg',
      roughness: '/assets/textures/earth_roughness.jpg',
      ao: '/assets/textures/earth_ao.jpg'
    };
    
    if (DEBUG_TEXTURES) {
      console.log('Loading textures from paths:', texturePaths);
      console.log('Current origin:', window.location.origin);
    }
    
    // Attempt to load all textures in sequence with individual error handling
    try {
      diffuseMap = await loadTexture(textureLoader, texturePaths.diffuse);
      if (DEBUG_TEXTURES) console.log('✓ Diffuse map loaded successfully');
    } catch (err) {
      console.error('Failed to load diffuse map:', err);
      diffuseMap = createFallbackTexture('#1a4f9c');
    }
    
    try {
      bumpMap = await loadTexture(textureLoader, texturePaths.bump);
      if (DEBUG_TEXTURES) console.log('✓ Bump map loaded successfully');
    } catch (err) {
      console.error('Failed to load bump map:', err);
      bumpMap = createFallbackTexture('#555555');
    }
    
    try {
      roughnessMap = await loadTexture(textureLoader, texturePaths.roughness);
      if (DEBUG_TEXTURES) console.log('✓ Roughness map loaded successfully');
    } catch (err) {
      console.error('Failed to load roughness map:', err);
      roughnessMap = createFallbackTexture('#777777');
    }
    
    try {
      aoMap = await loadTexture(textureLoader, texturePaths.ao);
      if (DEBUG_TEXTURES) console.log('✓ AO map loaded successfully');
    } catch (err) {
      console.error('Failed to load ao map:', err);
      aoMap = createFallbackTexture('#ffffff');
    }
    
    if (DEBUG_TEXTURES) {
      console.log('Texture loading status:');
      console.log('- diffuse:', diffuseMap instanceof THREE.CanvasTexture ? 'fallback' : 'loaded');
      console.log('- bump:', bumpMap instanceof THREE.CanvasTexture ? 'fallback' : 'loaded');
      console.log('- roughness:', roughnessMap instanceof THREE.CanvasTexture ? 'fallback' : 'loaded');
      console.log('- ao:', aoMap instanceof THREE.CanvasTexture ? 'fallback' : 'loaded');
    }
  } catch (error) {
    console.error('Error in texture loading process:', error);
    // Create fallback textures if the overall process fails
    diffuseMap = createFallbackTexture('#1a4f9c');  // Blue ocean
    bumpMap = createFallbackTexture('#555555');     // Medium gray
    roughnessMap = createFallbackTexture('#777777'); // Light gray
    aoMap = createFallbackTexture('#ffffff');       // White
  }
  
  // Fix texture settings for proper wrapping
  const configureTexture = (texture) => {
    if (!texture) return;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 1; // Reduce anisotropy to fix striping
    texture.needsUpdate = true;
  };
  
  configureTexture(diffuseMap);
  configureTexture(bumpMap);
  configureTexture(roughnessMap);
  configureTexture(aoMap);
  
  // Create Earth material with enhanced properties
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: diffuseMap,
    bumpMap: bumpMap,
    bumpScale: 0.02, // Reduced further to avoid artifacts
    roughnessMap: roughnessMap,
    roughness: 0.7,
    metalness: 0.0, // Removed metalness for more natural look
    aoMap: aoMap,
    aoMapIntensity: 0.8,
    envMapIntensity: 0.8,
    displacementScale: 0,  // Disabled displacement to avoid glitches
    side: THREE.FrontSide,
    transparent: false,
    flatShading: false,
  });
  
  // Create Earth mesh with higher resolution
  const earthGeometry = new THREE.SphereGeometry(radius, 128, 128); // Increased segments
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  
  // Set up second set of UVs for aoMap
  earthGeometry.setAttribute('uv2', new THREE.BufferAttribute(
    earthGeometry.attributes.uv.array, 2
  ));
  
  return earth;
}

// Helper function to load texture
function loadTexture(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        // Don't set texture parameters here - we'll configure them uniformly later
        resolve(texture);
      },
      (xhr) => {
        console.log(`${url}: ${Math.round(xhr.loaded / xhr.total * 100)}% loaded`);
      },
      (error) => {
        console.error(`Error loading texture ${url}:`, error);
        reject(error);
      }
    );
  });
} 