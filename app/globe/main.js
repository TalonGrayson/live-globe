import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createEarth } from './earth.js';
import { createAtmosphere } from './atmosphere.js';
import { createStars } from './stars.js';
import { loadLocationData } from './data.js';
import { createLocationMarkers, updateInfoPanel } from './markers.js';

// Track instances to prevent multiple initializations
let instanceCount = 0;

let scene, camera, renderer, controls;
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
      container.appendChild(renderer.domElement);
      
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
      
      // Enhanced lighting setup
      // Ambient light - increased intensity for better general illumination
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      
      // Hemisphere light - adds gradient lighting from sky to ground
      const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
      scene.add(hemisphereLight);
      
      // Main directional light - simulates sunlight
      const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
      mainLight.position.set(5, 3, 5);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 1024;
      mainLight.shadow.mapSize.height = 1024;
      scene.add(mainLight);
      
      // Secondary directional light - fills shadows from opposite side
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
      fillLight.position.set(-5, 2, -5);
      scene.add(fillLight);
      
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
        
        // Check for hover on markers
        checkIntersections();
        
        // Render scene
        renderer.render(scene, camera);
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

// Handle window resize
function onWindowResize() {
  if (!camera || !renderer || !container) return;
  
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
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