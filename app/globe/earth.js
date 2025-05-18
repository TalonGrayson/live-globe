import * as THREE from 'three';

// Create Earth with realistic textures and day/night effect
export async function createEarth(radius) {
  // Safely check for environment variables
  const isBrowser = typeof window !== 'undefined';
  
  // Try to get environment variables if available, or use defaults
  const ambientLight = isBrowser && window.ENV_SUN_AMBIENT_LIGHT !== undefined 
    ? window.ENV_SUN_AMBIENT_LIGHT 
    : 0.1;
    
  const emissionIntensity = isBrowser && window.ENV_SUN_EMISSION_INTENSITY !== undefined 
    ? window.ENV_SUN_EMISSION_INTENSITY 
    : 0.2;
    
  const debugTextures = isBrowser && window.ENV_DEBUG !== undefined 
    ? window.ENV_DEBUG 
    : false;
  
  const textureLoader = new THREE.TextureLoader();
  const DEBUG_TEXTURES = debugTextures; // Enable texture debugging
  
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
  
  // Create custom shader material for day/night transition based on sun position
  const earthMaterial = new THREE.ShaderMaterial({
    uniforms: {
      dayTexture: { value: diffuseMap },
      bumpTexture: { value: bumpMap },
      bumpScale: { value: 1 },
      sunPosition: { value: new THREE.Vector3(50, 0, 0) }, // Default sun position (will be updated)
      ambientLight: { value: ambientLight }, // Get from environment
      emissionIntensity: { value: emissionIntensity } // Get from environment
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        // Output the world-space normal
        vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        // Output the world-space position
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D dayTexture;
      uniform sampler2D bumpTexture;
      uniform float bumpScale;
      uniform vec3 sunPosition;
      uniform float ambientLight;
      uniform float emissionIntensity;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // Normalized sun direction in world space - pointing FROM the sun TO the Earth center
        vec3 sunDirection = normalize(-sunPosition);
        
        // Bump mapping - perturb normal slightly for more realism
        vec3 normal = normalize(vNormal);
        vec4 bumpData = texture2D(bumpTexture, vUv);
        
        // Apply bump mapping in world space
        normal = normalize(normal + bumpScale * (bumpData.rgb - 0.5));
        
        // Calculate day-night mix factor based on dot product of normal and sun direction
        // Negative dot product because sunDirection points from sun to Earth, while normal points outward
        float dayNightMix = -dot(normal, sunDirection);
        
        // Apply smooth transition between day and night
        float lightness = smoothstep(-0.2, 0.3, dayNightMix);
        
        // Ensure minimum ambient light on the dark side
        lightness = max(lightness, ambientLight);
        
        // Get the base day texture color
        vec4 dayColor = texture2D(dayTexture, vUv);
        
        // For night side: create a darker version of the day texture with emission
        vec4 nightColor = dayColor * 0.05; // Darkened base texture
        
        // Add emission to night side (using day texture as a guide for emission intensity)
        // Areas that are brighter in day texture will emit more light at night
        float luminance = 0.2 * dayColor.r + 0.587 * dayColor.g + 0.114 * dayColor.b;
        nightColor.rgb += dayColor.rgb * luminance * emissionIntensity;
        
        // Mix between night and day textures
        vec4 finalColor = mix(nightColor, dayColor, lightness);
        
        gl_FragColor = finalColor;
      }
    `,
    side: THREE.FrontSide,
  });
  
  // Create Earth mesh with higher resolution
  const earthGeometry = new THREE.SphereGeometry(radius, 128, 128); // Increased segments
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  
  // Method to update sun position
  earth.updateSunPosition = function(sunPosition) {
    if (this.material && this.material.uniforms) {
      this.material.uniforms.sunPosition.value.copy(sunPosition);
    }
  };
  
  // Method to update shader parameters
  earth.updateShaderParameters = function(params = {}) {
    if (!this.material || !this.material.uniforms) return;
    
    // Update ambient light if provided
    if (params.ambientLight !== undefined) {
      this.material.uniforms.ambientLight.value = params.ambientLight;
    }
    
    // Update emission intensity if provided
    if (params.emissionIntensity !== undefined) {
      this.material.uniforms.emissionIntensity.value = params.emissionIntensity;
    }
    
    // Update bump scale if provided
    if (params.bumpScale !== undefined) {
      this.material.uniforms.bumpScale.value = params.bumpScale;
    }
  };
  
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