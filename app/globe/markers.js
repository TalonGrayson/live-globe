import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Bloom layer constant (must match main.js)
const BLOOM_SCENE = 1;

// Create location markers on the globe
export function createLocationMarkers(locations, radius, modelUrl = null) {
  // Create parent object to hold all markers
  const markersGroup = new THREE.Object3D();
  
  // If a model URL is provided, load it first
  if (modelUrl) {
    const loader = new GLTFLoader();
    
    // Add cache-busting parameter to prevent browsers from using cached models
    const cacheBustedUrl = modelUrl + (modelUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
    
    // Load the model asynchronously
    loader.load(
      cacheBustedUrl,
      (gltf) => {
        // Process each location
        locations.forEach(location => {
          // Convert latitude/longitude to 3D position
          const position = latLngToVector3(location.latitude, location.longitude, radius);
          
          // Create marker with the loaded model
          const markerMesh = createMarkerWithModel(position, gltf);
          
          // Attach location data to the model and all its children
          markerMesh.userData.locationData = location;
          markerMesh.traverse((child) => {
            child.userData.locationData = location;
          });
          
          // Add to parent group
          markersGroup.add(markerMesh);
        });
      },
      // Progress callback
      (xhr) => {
        console.log(`${(xhr.loaded / xhr.total * 100)}% loaded`);
      },
      // Error callback
      (error) => {
        console.error('Error loading GLTF model:', error);
        // Fall back to default markers
        createDefaultMarkers(locations, radius, markersGroup);
      }
    );
  } else {
    // Use default markers if no model provided
    createDefaultMarkers(locations, radius, markersGroup);
  }
  
  return markersGroup;
}

// Helper function to create default markers for all locations
function createDefaultMarkers(locations, radius, markersGroup) {
  locations.forEach(location => {
    // Convert latitude/longitude to 3D position
    const position = latLngToVector3(location.latitude, location.longitude, radius);
    
    // Create marker mesh
    const markerMesh = createMarker(position);
    markerMesh.userData.locationData = location;
    
    // Add to parent group
    markersGroup.add(markerMesh);
  });
}

// Convert latitude and longitude to 3D Vector
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

// Create marker mesh using a GLTF model
function createMarkerWithModel(position, gltf) {
  // Create a properly cloned model to preserve materials
  const originalScene = gltf.scene;
  const model = originalScene.clone(true); // true for deep clone
  
  // Debug info
  console.log('Loading GLB model for marker');
  
  // Keep track if we found any emissive materials
  let hasEmissiveMaterials = false;
  
  // Ensure all materials are cloned properly and enable bloom for emissive materials
  model.traverse((node) => {
    if (node.isMesh) {
      console.log(`Found mesh: ${node.name}`);
      
      // Make sure materials are properly preserved and can receive/cast shadows
      if (Array.isArray(node.material)) {
        console.log(`Mesh has multiple materials: ${node.material.length}`);
        node.material = node.material.map(mat => {
          const clonedMat = mat.clone();
          
          // Debug emissive properties
          if (clonedMat.emissive) {
            console.log(`Material has emissive color: ${clonedMat.emissive.getHexString()}`);
            console.log(`Material emissive intensity: ${clonedMat.emissiveIntensity}`);
            
            // Enable bloom layer for emissive materials
            // More robust check: any material with emissive color and intensity > 0
            if (clonedMat.emissiveIntensity > 0 && 
                !(clonedMat.emissive.r === 0 && clonedMat.emissive.g === 0 && clonedMat.emissive.b === 0)) {
              console.log('Enabling bloom for this material');
              node.layers.enable(BLOOM_SCENE);
              hasEmissiveMaterials = true;
            }
          }
          return clonedMat;
        });
      } else if (node.material) {
        const clonedMat = node.material.clone();
        
        // Debug emissive properties
        if (clonedMat.emissive) {
          console.log(`Material has emissive color: ${clonedMat.emissive.getHexString()}`);
          console.log(`Material emissive intensity: ${clonedMat.emissiveIntensity}`);
          
          // Enable bloom layer for emissive materials
          // More robust check: any material with emissive color and intensity > 0
          if (clonedMat.emissiveIntensity > 0 && 
              !(clonedMat.emissive.r === 0 && clonedMat.emissive.g === 0 && clonedMat.emissive.b === 0)) {
            console.log('Enabling bloom for this material');
            node.layers.enable(BLOOM_SCENE);
            hasEmissiveMaterials = true;
          }
        }
        node.material = clonedMat;
      }
      
      // Enable shadows
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
  
  // If we didn't find any emissive materials but we should have, try a different approach
  if (!hasEmissiveMaterials) {
    console.log("No emissive materials detected automatically. Trying alternative approach...");
    
    // Force bloom on entire model - this is a fallback approach
    model.traverse((node) => {
      // Enable bloom layer on all meshes in the model
      if (node.isMesh) {
        node.layers.enable(BLOOM_SCENE);
        console.log(`Forced bloom on mesh: ${node.name}`);
      }
    });
  }
  
  // Scale the model appropriately
  const scale = 0.05;
  model.scale.set(scale, scale, scale);
  
  // Position model slightly above the surface
  const adjustedPosition = position.clone().multiplyScalar(1.005);
  model.position.copy(adjustedPosition);
  
  // Orient model to point outward from center
  model.lookAt(new THREE.Vector3(0, 0, 0));
  model.rotateX(Math.PI / 2);
  
  return model;
}

// Create default marker mesh (cone)
function createMarker(position) {
  // Make marker slightly above the surface
  const markerSize = 0.1;
  const markerHeight = 0.1;
  const adjustedPosition = position.clone().multiplyScalar(1.005);
  
  // Create cone geometry pointing outward from the center
  const markerGeometry = new THREE.ConeGeometry(markerSize, markerHeight, 8);
  const markerMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff3333,
    // Reduced emissive properties for more subtle glow
    emissive: 0xff3333,
    emissiveIntensity: 0.2  // Reduced from 0.5 to 0.2
  });
  
  // Create marker mesh
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  
  // Position and orient marker
  marker.position.copy(adjustedPosition);
  marker.lookAt(new THREE.Vector3(0, 0, 0));
  marker.rotateX(Math.PI / 2);
  
  // Enable bloom effect for the entire marker
  marker.layers.enable(BLOOM_SCENE);
  
  return marker;
}

// Update info panel with location data
export function updateInfoPanel(locationData) {
  const infoPanel = document.getElementById('info-panel');
  
  if (!infoPanel) return;
  
  infoPanel.innerHTML = `
    <h3>${locationData.pointName}</h3>
    <p><strong>${locationData.city}, ${locationData.country}</strong></p>
    <p>${locationData.description}</p>
    <p class="coordinates">
      ${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}
    </p>
  `;
  
  infoPanel.classList.remove('hidden');
} 