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
      locationMarkers = createLocationMarkers(locations, EARTH_RADIUS);
      scene.add(locationMarkers);
      
      // Add event listeners
      window.addEventListener('resize', onWindowResize);
      container.addEventListener('mousemove', onMouseMove);
      
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

// Check for hover intersections
function checkIntersections() {
  if (!raycaster || !camera || !locationMarkers) return;
  
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObject(locationMarkers, true);
  
  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object;
    
    if (currentIntersection !== intersectedObject) {
      currentIntersection = intersectedObject;
      const locationData = intersectedObject.userData.locationData;
      updateInfoPanel(locationData);
    }
  } else if (currentIntersection) {
    currentIntersection = null;
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
      infoPanel.classList.add('hidden');
    }
  }
} 