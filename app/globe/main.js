import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { createEarth } from './earth.js';
import { createAtmosphere } from './atmosphere.js';
import { createStars } from './stars.js';
import { loadLocationData } from './data.js';
import { createLocationMarkers, updateInfoPanel } from './markers.js';
import { initConfig, getConfig } from './config.js';

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize configuration only in browser
let ENV = {};
if (isBrowser) {
  initConfig();
  ENV = getConfig();
} else {
  // Server-side default config for SSR
  ENV = {
    sunIntensity: 1.2,
    ambientLight: 0.3,
    emissionIntensity: 0.25,
    sunVisualSize: 1.0,
    sunVisualBrightness: 1.0,
    debug: false
  };
}

// Track instances to prevent multiple initializations
let instanceCount = 0;

let scene, camera, renderer, controls;
let bloomComposer, finalComposer; // Post-processing composers
let darkMaterial, materials = {};
let BLOOM_SCENE = 1;
let bloomLayer;
let earth, atmosphere, locationMarkers;
let raycaster, mouse;
let currentIntersection = null;
let clickedMarker = null; // Track the clicked marker
let isAnimating = false; // Track if camera animation is in progress
let container;

const EARTH_RADIUS = 5;

// Initialize the scene
export async function setupEarth(containerElement) {
  // Get a unique instance ID for this initialization
  const instanceId = ++instanceCount;
  console.log(`Setting up Earth instance #${instanceId}`);
  
  // Remove any existing canvases to prevent duplication
  containerElement.querySelectorAll('canvas').forEach(canvas => {
    console.log('Removing existing canvas');
    canvas.remove();
  });
  
  return new Promise(async (resolve, reject) => {
    try {
      container = containerElement;
      
      // Create scene
      scene = new THREE.Scene();
      
      // Create camera
      camera = new THREE.PerspectiveCamera(
        45, 
        container.clientWidth / container.clientHeight, 
        0.1, 
        1000
      );
      camera.position.set(0, 10, 15);
      camera.lookAt(0, 0, 0);
      
      // Set up bloom layer and materials
      bloomLayer = new THREE.Layers();
      bloomLayer.set(BLOOM_SCENE);
      darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
      
      // Create renderer with better settings
      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        precision: 'highp',
        powerPreference: 'high-performance'
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio to prevent performance issues
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.autoClear = false;
      container.appendChild(renderer.domElement);
      
      // Set up post-processing with selective bloom effect
      setupPostProcessing();
      
      // Add orbit controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = EARTH_RADIUS + 1;
      controls.maxDistance = 30;
      controls.enablePan = false; // Disable panning for better UX
      
      // Create raycaster for hover detection
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();
      
      // Set clear background color - pure black for better contrast
      renderer.setClearColor(0x000000, 1);
      
      // Create stars first (background)
      const stars = createStars();
      scene.add(stars);
      
      // Create sun light and position it based on local time
      const sunLight = new THREE.DirectionalLight(0xffffff, ENV.sunIntensity);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      
      // Add subtle ambient light to prevent complete darkness on the dark side
      const ambientLight = new THREE.AmbientLight(0x333333, ENV.ambientLight);
      scene.add(ambientLight);
      
      // Update sun position based on local time
      updateSunPosition(sunLight);
      scene.add(sunLight);
      
      // Create atmosphere first (so it's behind the Earth)
      atmosphere = createAtmosphere(EARTH_RADIUS);
      scene.add(atmosphere);
      
      // Create Earth
      earth = await createEarth(EARTH_RADIUS);
      earth.castShadow = true;
      earth.receiveShadow = true;
      scene.add(earth);
      
      // Ensure atmosphere is properly positioned
      atmosphere.position.copy(earth.position);
      
      // Make sure to update the Earth's shader with the current sun position
      if (earth && earth.updateSunPosition) {
        earth.updateSunPosition(sunLight.position);
      }
      
      // Load location data and create markers
      const locations = await loadLocationData();
      // Check if a custom marker model URL has been provided
      const markerModelUrl = window.MARKER_MODEL_URL || null;
      locationMarkers = createLocationMarkers(locations, EARTH_RADIUS, markerModelUrl);
      scene.add(locationMarkers);
      
      // Add event listeners
      window.addEventListener('resize', onWindowResize);
      container.addEventListener('mousemove', onMouseMove);
      container.addEventListener('click', onMouseClick);
      
      // Create zoom controls if they don't exist
      const createZoomControls = () => {
        // Remove any existing zoom controls first
        const existingControls = document.querySelector('.zoom-controls');
        if (existingControls) {
          existingControls.remove();
        }
        
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        
        const zoomIn = document.createElement('button');
        zoomIn.id = 'zoom-in';
        zoomIn.textContent = '+';
        zoomIn.addEventListener('click', () => {
          const currentDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
          const newDistance = Math.max(currentDistance * 0.8, EARTH_RADIUS + 1.5);
          
          // Create a vector for the camera direction
          const direction = new THREE.Vector3();
          direction.subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize();
          
          // Set new camera position
          camera.position.copy(direction.multiplyScalar(newDistance));
        });
        
        const zoomOut = document.createElement('button');
        zoomOut.id = 'zoom-out';
        zoomOut.textContent = '-';
        zoomOut.addEventListener('click', () => {
          const currentDistance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
          const newDistance = Math.min(currentDistance * 1.2, 30);
          
          // Create a vector for the camera direction
          const direction = new THREE.Vector3();
          direction.subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize();
          
          // Set new camera position
          camera.position.copy(direction.multiplyScalar(newDistance));
        });
        
        zoomControls.appendChild(zoomIn);
        zoomControls.appendChild(zoomOut);
        
        // Append to the direct parent container for better placement
        container.parentElement.appendChild(zoomControls);
      };
      
      createZoomControls();
      
      // Create info panel if it doesn't exist
      if (!document.getElementById('info-panel')) {
        const infoPanel = document.createElement('div');
        infoPanel.id = 'info-panel';
        infoPanel.className = 'hidden';
        container.parentElement.appendChild(infoPanel);
      }
      
      // Animation variables
      let animationFrameId = null;
      let isRunning = true;
      
      // Animation loop
      function animate() {
        if (!isRunning) return;
        
        animationFrameId = requestAnimationFrame(animate);
        
        // Update controls
        controls.update();
        
        // Update atmosphere position to match Earth
        atmosphere.position.copy(earth.position);
        atmosphere.rotation.copy(earth.rotation);
        
        // No need to check for seconds here - always update sun position
        // This ensures it's always correct regardless of camera rotation
        const sunLight = scene.children.find(obj => obj.isDirectionalLight);
        if (sunLight) {
          updateSunPosition(sunLight);
        }
        
        // Check for hover on markers
        checkIntersections();
        
        // Render scene with selective bloom
        renderWithBloom();
      }
      
      // Start animation loop
      animate();
      
      // Create cleanup function
      const cleanup = () => {
        console.log(`Cleaning up Earth instance #${instanceId}`);
        
        // Stop animation loop
        isRunning = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        
        // Remove event listeners
        window.removeEventListener('resize', onWindowResize);
        if (container) {
          container.removeEventListener('mousemove', onMouseMove);
          container.removeEventListener('click', onMouseClick);
        }
        
        // Remove zoom controls
        const zoomControls = document.querySelector('.zoom-controls');
        if (zoomControls) {
          zoomControls.remove();
        }
        
        // Dispose of Three.js resources
        if (bloomComposer) {
          bloomComposer.dispose();
        }
        
        if (finalComposer) {
          finalComposer.dispose();
        }
        
        if (renderer) {
          renderer.dispose();
          if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
        }
        
        // Clear references
        scene = null;
        camera = null;
        renderer = null;
        controls = null;
        bloomComposer = null;
        finalComposer = null;
        earth = null;
        atmosphere = null;
        locationMarkers = null;
        raycaster = null;
        mouse = null;
        currentIntersection = null;
        clickedMarker = null; // Clear clicked marker reference
        isAnimating = false; // Reset animation state
        container = null;
      };
      
      // Resolve the promise with the cleanup function
      setTimeout(() => {
        resolve(cleanup);
      }, 500);
    } catch (error) {
      console.error("Error in setupEarth:", error);
      reject(error);
    }
  });
}

// Set up post-processing with selective bloom effect
function setupPostProcessing() {
  // Create bloom layer materials based shader
  const bloomParams = {
    exposure: 1,
    bloomStrength: 0.3,  // Reduced from 3.0 to 0.8
    bloomThreshold: 1, // Increased from 0 to 0.1 to reduce what gets bloomed
    bloomRadius: 0.1     // Reduced from 0.7 to 0.3
  };
  
  // Bloom render pass
  const renderScene = new RenderPass(scene, camera);
  
  // Bloom pass
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    bloomParams.bloomStrength,
    bloomParams.bloomRadius,
    bloomParams.bloomThreshold
  );
  
  // Shader for combining bloom with original scene
  const bloomShader = {
    uniforms: {
      baseTexture: { value: null },
      bloomTexture: { value: null }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
    fragmentShader: `
      uniform sampler2D baseTexture;
      uniform sampler2D bloomTexture;
      varying vec2 vUv;
      void main() {
        vec4 base = texture2D(baseTexture, vUv);
        vec4 bloom = texture2D(bloomTexture, vUv);
        gl_FragColor = base + bloom;
      }
    `
  };
  
  // Composer for bloom elements
  bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);
  
  // Composer for final scene
  finalComposer = new EffectComposer(renderer);
  
  // Final pass to combine original scene with bloom
  const finalPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: bloomShader.uniforms,
      vertexShader: bloomShader.vertexShader,
      fragmentShader: bloomShader.fragmentShader,
      defines: {}
    }),
    "baseTexture"
  );
  finalPass.needsSwap = true;
  
  // Add passes to final composer
  finalComposer.addPass(renderScene);
  finalComposer.addPass(finalPass);
  
  // Set texture for bloom
  bloomShader.uniforms.bloomTexture.value = bloomComposer.renderTarget2.texture;
  
  // Set correct sizes
  const pixelRatio = renderer.getPixelRatio();
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  bloomComposer.setSize(width, height);
  bloomComposer.setPixelRatio(pixelRatio);
  
  finalComposer.setSize(width, height);
  finalComposer.setPixelRatio(pixelRatio);
}

// Render scene with selective bloom effect
function renderWithBloom() {
  // Exclude non-bloom objects
  scene.traverse(darkenNonBloomed);
  
  // Render bloom objects only
  renderer.clear();
  bloomComposer.render();
  
  // Restore materials
  scene.traverse(restoreMaterial);
  
  // Render final scene
  renderer.clear();
  finalComposer.render();
}

// Hide non-bloom objects
function darkenNonBloomed(obj) {
  // Check if this is a mesh and not in the bloom layer
  if (obj.isMesh && !obj.layers.test(bloomLayer)) {
    // Store original material for later restoration
    materials[obj.uuid] = obj.material;
    
    // Debug which objects are being darkened vs kept for bloom
    console.log(`Darkening object: ${obj.name || 'unnamed'}, in bloom layer: ${obj.layers.test(bloomLayer)}`);
    
    // Replace with dark material
    obj.material = darkMaterial;
  }
}

// Restore original materials
function restoreMaterial(obj) {
  if (materials[obj.uuid]) {
    obj.material = materials[obj.uuid];
    delete materials[obj.uuid];
  }
}

// Handle window resize
function onWindowResize() {
  if (!camera || !renderer || !container) return;
  
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  renderer.setSize(width, height);
  
  // Also update composers sizes
  if (bloomComposer && finalComposer) {
    bloomComposer.setSize(width, height);
    finalComposer.setSize(width, height);
  }
}

// Handle mouse move for point hover
function onMouseMove(event) {
  if (!container) return;
  
  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
}

// Handle mouse click for marker selection
function onMouseClick(event) {
  if (!raycaster || !camera || !locationMarkers) return;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(locationMarkers, true);
  
  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object;
    let locationData;
    
    // Check if this object has location data
    if (intersectedObject.userData && intersectedObject.userData.locationData) {
      locationData = intersectedObject.userData.locationData;
    } else {
      // Try to find location data in parent objects (for GLB models with multiple meshes)
      let parent = intersectedObject.parent;
      while (parent && !locationData) {
        if (parent.userData && parent.userData.locationData) {
          locationData = parent.userData.locationData;
        }
        parent = parent.parent;
      }
    }
    
    if (locationData) {
      // Set this as the clicked marker
      clickedMarker = intersectedObject;
      // Focus on the location
      focusOnLocation(locationData);
      // Update the info panel
      updateInfoPanel(locationData);
    }
  } else {
    // Clicked away from any marker, clear clicked marker state
    clickedMarker = null;
    // Hide info panel when clicking away
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
      infoPanel.classList.add('hidden');
    }
  }
}

// Focus the camera on a specific location
function focusOnLocation(locationData) {
  if (!camera || !controls) return;
  
  // Set animating flag to true
  isAnimating = true;
  
  // Convert the location to a 3D position
  const position = latLngToVector3(locationData.latitude, locationData.longitude, EARTH_RADIUS);
  
  // Calculate target position slightly away from the surface in the direction from center to position
  const targetPosition = position.clone().multiplyScalar(1.8);
  
  // Animate camera movement
  const startPosition = camera.position.clone();
  const duration = 1000; // 1 second
  const startTime = Date.now();
  
  function animateCamera() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Use easing function for smoother animation
    const easeProgress = easeOutQuad(progress);
    
    // Interpolate between start and target position
    const newPosition = new THREE.Vector3().lerpVectors(
      startPosition,
      targetPosition,
      easeProgress
    );
    
    // Update camera position
    camera.position.copy(newPosition);
    
    // Make camera look at the globe center (0,0,0), not the marker
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    
    // Always keep the controls target at the globe's center
    controls.target.set(0, 0, 0);
    
    // Continue animation if not complete
    if (progress < 1) {
      requestAnimationFrame(animateCamera);
    } else {
      // Animation complete, reset animating flag
      isAnimating = false;
    }
  }
  
  // Start animation
  animateCamera();
}

// Easing function for smoother animation
function easeOutQuad(t) {
  return t * (2 - t);
}

// Convert latitude and longitude to 3D Vector (duplicate of the one in markers.js)
function latLngToVector3(lat, lng, radius) {
  // Convert to radians
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  // Calculate position
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
}

// Check for hover intersections
function checkIntersections() {
  if (!raycaster || !camera || !locationMarkers) return;
  
  // Skip hover detection during camera animation
  if (isAnimating) return;
  
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObject(locationMarkers, true);
  
  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object;
    let locationData;
    
    // Check if this object has location data
    if (intersectedObject.userData && intersectedObject.userData.locationData) {
      locationData = intersectedObject.userData.locationData;
    } else {
      // Try to find location data in parent objects (for GLB models with multiple meshes)
      let parent = intersectedObject.parent;
      while (parent && !locationData) {
        if (parent.userData && parent.userData.locationData) {
          locationData = parent.userData.locationData;
        }
        parent = parent.parent;
      }
    }
    
    // Only update if we found location data and it's a different object from what we're currently showing
    if (locationData && currentIntersection !== intersectedObject) {
      currentIntersection = intersectedObject;
      // If we hover over a different marker than clicked, update the info panel
      clickedMarker = null; // Clear clicked state when hovering a different marker
      updateInfoPanel(locationData);
    }
  } else if (currentIntersection && !clickedMarker) {
    // Only hide the panel if we're not hovering over a marker AND no marker is clicked
    currentIntersection = null;
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
      infoPanel.classList.add('hidden');
    }
  }
}

// Utility function to set a custom marker model
export function setMarkerModel(modelUrl) {
  window.MARKER_MODEL_URL = modelUrl;
}

// Function to update markers with a new model on an existing globe
export async function updateMarkers(modelUrl = null) {
  if (!scene || !locationMarkers) {
    console.error('Globe not initialized yet');
    return;
  }
  
  // Clear THREE.js cache to ensure new models are loaded
  // This helps when loading models with the same URL but different content
  THREE.Cache.clear();
  
  // Remove current markers
  scene.remove(locationMarkers);
  
  // Get current location data
  const locations = await loadLocationData();
  
  // Create new markers with the model URL
  locationMarkers = createLocationMarkers(locations, EARTH_RADIUS, modelUrl);
  
  // Add new markers to scene
  scene.add(locationMarkers);
}

// Function to adjust bloom effect settings
export function setBloomSettings(strength = 3.0, radius = 0.7, threshold = 0) {
  if (!bloomComposer) {
    console.error('Post-processing not initialized yet');
    return;
  }
  
  // Find the bloom pass in the composer
  const bloomPass = bloomComposer.passes.find(pass => pass instanceof UnrealBloomPass);
  
  if (bloomPass) {
    console.log(`Setting bloom: strength=${strength}, radius=${radius}, threshold=${threshold}`);
    
    // Update bloom settings
    bloomPass.strength = strength;   // Intensity of the bloom (0-3 is a good range)
    bloomPass.radius = radius;       // How far the bloom extends (0-1 is a good range)
    bloomPass.threshold = threshold; // Minimum brightness for bloom (0-1)
  } else {
    console.error('Could not find bloom pass');
  }
}

// Function to focus the globe on a specific location
export function focusOnLocationByCoords(latitude, longitude) {
  if (!scene || !camera || !controls) {
    console.error('Globe not initialized yet');
    return;
  }
  
  focusOnLocation({
    latitude: latitude,
    longitude: longitude
  });
}

// Function to set a mesh object to have bloom effect
export function setBloomForObject(object, shouldBloom) {
  if (!object) return;
  
  if (shouldBloom) {
    object.layers.enable(BLOOM_SCENE);
  } else {
    object.layers.disable(BLOOM_SCENE);
  }
}

// Debug function to force bloom on all markers
export function forceBloomOnAllMarkers() {
  if (!locationMarkers) {
    console.error('Markers not initialized yet');
    return;
  }
  
  console.log('Forcing bloom on all markers');
  locationMarkers.traverse((node) => {
    if (node.isMesh) {
      node.layers.enable(BLOOM_SCENE);
      console.log(`Enabling bloom on ${node.name || 'unnamed mesh'}`);
    }
  });
}

// Debug function to print scene info
export function debugScene() {
  if (!scene) {
    console.error('Scene not initialized yet');
    return;
  }
  
  console.log('Debug scene info:');
  let bloomCount = 0;
  let totalMeshes = 0;
  
  scene.traverse((node) => {
    if (node.isMesh) {
      totalMeshes++;
      if (node.layers.test(bloomLayer)) {
        bloomCount++;
        console.log(`Mesh in bloom layer: ${node.name || 'unnamed'}`);
      }
    }
  });
  
  console.log(`Total meshes: ${totalMeshes}, Meshes with bloom: ${bloomCount}`);
}

// Calculate and update the sun's position based on local time
function updateSunPosition(sunLight) {
  // Get current date and time
  const now = new Date();
  
  // Calculate day of year (0-365)
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  // Calculate declination angle (sun's position relative to equator)
  // Formula: 23.45 degrees * sin(2π * (day of year - 81) / 365)
  const declination = 23.45 * Math.sin((2 * Math.PI * (dayOfYear - 81)) / 365);
  
  // Convert declination to radians
  const declinationRad = declination * (Math.PI / 180);
  
  // Calculate hour angle (sun's position based on time of day)
  const hour = now.getHours() + now.getMinutes() / 60;
  // Convert 24-hour time to angle (15 degrees per hour, with solar noon at 12:00)
  const hourAngle = (hour - 12) * 15 * (Math.PI / 180);
  
  // Calculate sun position in 3D space
  // Using simplified model: x = cos(hourAngle), y = sin(declination), z = sin(hourAngle)
  const distance = 50; // Distance from Earth's center
  const sunX = distance * Math.cos(hourAngle);
  const sunY = distance * Math.sin(declinationRad);
  const sunZ = distance * Math.sin(hourAngle);
  
  // Set light position in world space (independent of camera)
  const sunPosition = new THREE.Vector3(sunX, sunY, sunZ);
  sunLight.position.copy(sunPosition);
  
  // Update Earth's shader if Earth exists with the new sun position
  if (earth && earth.updateSunPosition) {
    earth.updateSunPosition(sunPosition);
  }
  
  // Make the light target the center of the Earth
  sunLight.lookAt(0, 0, 0);
  
  // Log sun position for debugging
  console.log(`Sun position: declination=${declination}°, hour=${hour}, position=(${sunX}, ${sunY}, ${sunZ})`);
  
  return sunPosition;
}

// Update the exported updateTime function
export function updateTime() {
  if (!scene) {
    console.error('Scene not initialized yet');
    return;
  }
  
  // Find the sun light in the scene
  const sunLight = scene.children.find(obj => obj.isDirectionalLight);
  
  if (sunLight) {
    const position = updateSunPosition(sunLight);
    return position;
  } else {
    console.error('Sun light not found in scene');
    return null;
  }
}

// Export functions to update sun settings
export function updateSunSettings(settings = {}) {
  if (!scene) {
    console.error('Scene not initialized yet');
    return;
  }
  
  // Update environment variables with new settings
  if (settings.sunIntensity !== undefined) {
    ENV.sunIntensity = settings.sunIntensity;
    if (isBrowser) window.ENV_SUN_INTENSITY = settings.sunIntensity;
  }
  
  if (settings.ambientLight !== undefined) {
    ENV.ambientLight = settings.ambientLight;
    if (isBrowser) window.ENV_SUN_AMBIENT_LIGHT = settings.ambientLight;
  }
  
  if (settings.emissionIntensity !== undefined) {
    ENV.emissionIntensity = settings.emissionIntensity;
    if (isBrowser) window.ENV_SUN_EMISSION_INTENSITY = settings.emissionIntensity;
  }
  
  // Apply updated settings to the scene objects
  const sunLight = scene.children.find(obj => obj.isDirectionalLight);
  if (sunLight) {
    sunLight.intensity = ENV.sunIntensity;
  }
  
  const ambientLight = scene.children.find(obj => obj.isAmbientLight);
  if (ambientLight) {
    ambientLight.intensity = ENV.ambientLight;
  }
  
  // Update Earth shader if Earth exists
  if (earth && earth.updateShaderParameters) {
    earth.updateShaderParameters({
      ambientLight: ENV.ambientLight,
      emissionIntensity: ENV.emissionIntensity
    });
  }
  
  if (ENV.debug) {
    console.log('Updated sun settings:', ENV);
  }
  
  return ENV;
} 