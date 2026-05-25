import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Bloom layer constant (must match main.js)
const BLOOM_SCENE = 1;

// Create location markers on the globe
export async function createLocationMarkers(locations, radius, modelUrl = null) {
  console.log('Creating markers for locations:', locations);
  
  // Create parent object to hold all markers
  const markersGroup = new THREE.Object3D();
  
  // If a model URL is provided, load it first
  if (modelUrl) {
    console.log('Loading custom marker model from:', modelUrl);
    const loader = new GLTFLoader();
    
    // Add cache-busting parameter to prevent browsers from using cached models
    const cacheBustedUrl = modelUrl + (modelUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
    
    try {
      // Load the model synchronously
      const gltf = await new Promise((resolve, reject) => {
        loader.load(
          cacheBustedUrl,
          resolve,
          (xhr) => {
            if (xhr.lengthComputable) {
              console.log(`${(xhr.loaded / xhr.total * 100)}% loaded`);
            } else {
              console.log('Loading model...');
            }
          },
          reject
        );
      });
      
      console.log('GLB model loaded successfully');
      
      // Create instanced meshes for each unique geometry in the model
      const geometries = new Map();
      const materials = new Map();
      
      // First pass: collect unique geometries and materials
      gltf.scene.traverse((node) => {
        if (node.isMesh) {
          console.log('Found mesh in model:', node.name, {
            geometry: node.geometry.uuid,
            material: node.material.uuid,
            position: node.position,
            scale: node.scale,
            visible: node.visible,
            materialType: node.material.type,
            geometryType: node.geometry.type
          });
          
          // Ensure the mesh is visible and properly scaled
          node.visible = true;
          node.scale.set(1, 1, 1);
          
          if (!geometries.has(node.geometry.uuid)) {
            geometries.set(node.geometry.uuid, node.geometry);
          }
          if (!materials.has(node.material.uuid)) {
            // Clone the material to ensure proper instance handling
            const clonedMaterial = node.material.clone();
            // Ensure material is visible and properly configured
            clonedMaterial.visible = true;
            clonedMaterial.transparent = true;
            clonedMaterial.opacity = 1;
            materials.set(node.material.uuid, clonedMaterial);
          }
        }
      });

      console.log('Found geometries:', geometries.size);
      console.log('Found materials:', materials.size);

      // Second pass: create instanced meshes
      let instancedMeshCreated = false;
      
      // Debug: Log all geometry and material pairs
      console.log('Available geometry-material pairs:');
      geometries.forEach((geometry, geoUuid) => {
        materials.forEach((material, matUuid) => {
          console.log(`Geometry ${geoUuid} with Material ${matUuid}`);
        });
      });

      // Use only the first geometry/material for all markers
      const firstGeometry = geometries.values().next().value;
      const firstMaterial = materials.values().next().value;
      
      if (firstGeometry && firstMaterial) {
        // Log the original material properties
        console.log('First marker material properties:', {
          color: firstMaterial.color ? firstMaterial.color.getHexString() : undefined,
          emissive: firstMaterial.emissive ? firstMaterial.emissive.getHexString() : undefined,
          emissiveIntensity: firstMaterial.emissiveIntensity,
          metalness: firstMaterial.metalness,
          roughness: firstMaterial.roughness,
          opacity: firstMaterial.opacity,
          transparent: firstMaterial.transparent,
          type: firstMaterial.type
        });
        // Do NOT override color/emissive now
        firstMaterial.visible = true;
        // firstMaterial.transparent = false; // Let GLB decide
        // firstMaterial.opacity = 1; // Let GLB decide
        
        try {
          const instancedMesh = new THREE.InstancedMesh(
            firstGeometry,
            firstMaterial,
            locations.length
          );
          
          locations.forEach((location, index) => {
            const position = latLngToVector3(location.latitude, location.longitude, radius);
            const matrix = new THREE.Matrix4();
            const normal = position.clone().normalize();
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(
              new THREE.Vector3(0, -1, 0),
              normal
            );
            const scale = 0.05;
            matrix.compose(
              position.multiplyScalar(1.01),
              quaternion,
              new THREE.Vector3(scale, scale, scale)
            );
            instancedMesh.setMatrixAt(index, matrix);
          });
          instancedMesh.visible = true;
          instancedMesh.material.visible = true;
          instancedMesh.layers.enable(BLOOM_SCENE);
          instancedMesh.castShadow = false;
          instancedMesh.receiveShadow = false;
          console.log('Instanced mesh material at creation:', instancedMesh.material);
          markersGroup.add(instancedMesh);
          console.log('Added instanced mesh for all markers:', locations.length);
        } catch (error) {
          console.error('Error creating instanced mesh:', error);
          createDefaultMarkers(locations, radius, markersGroup);
        }
      } else {
        console.error('No geometry/material found, falling back to default markers');
        createDefaultMarkers(locations, radius, markersGroup);
      }
    } catch (error) {
      console.error('Error loading GLTF model:', error);
      // Fall back to default markers
      createDefaultMarkers(locations, radius, markersGroup);
    }
  } else {
    console.log('Using default markers');
    // Use default markers if no model provided
    createDefaultMarkers(locations, radius, markersGroup);
  }
  
  return markersGroup;
}

// Helper function to create default markers for all locations
function createDefaultMarkers(locations, radius, markersGroup) {
  console.log('Creating default markers');
  
  // Create instanced geometry for default markers
  const markerGeometry = new THREE.ConeGeometry(0.1, 0.1, 8);
  const markerMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff3333,
    emissive: 0xff3333,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 1,
    visible: true
  });
  
  const instancedMesh = new THREE.InstancedMesh(
    markerGeometry,
    markerMaterial,
    locations.length
  );
  
  // Store location data in the instanced mesh
  instancedMesh.userData.locations = locations;
  
  // Set up matrices for each instance
  locations.forEach((location, index) => {
    const position = latLngToVector3(location.latitude, location.longitude, radius);
    console.log('Creating marker at position:', position);
    
    const matrix = new THREE.Matrix4();
    
    // Create a quaternion that orients the marker to the surface normal
    const normal = position.clone().normalize();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(
      new THREE.Vector3(0, -1, 0), // Marker's up vector (-Y)
      normal
    );
    
    matrix.compose(
      position.multiplyScalar(1.005), // Slightly above surface
      quaternion,
      new THREE.Vector3(1, 1, 1)
    );
    
    instancedMesh.setMatrixAt(index, matrix);
  });
  
  // Enable bloom effect
  instancedMesh.layers.enable(BLOOM_SCENE);
  
  // Enable shadows
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;
  
  console.log('Adding default markers to scene');
  markersGroup.add(instancedMesh);
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
  const scale = 25;
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
  const markerSize = 0.1;
  const markerHeight = 0.1;
  const adjustedPosition = position.clone().multiplyScalar(1.005);

  const pinColor          = window.GLOBE_PIN_COLOR
    ? parseInt(window.GLOBE_PIN_COLOR.replace('#', ''), 16) : 0xff3333;
  const pinEmissiveColor  = window.GLOBE_PIN_EMISSIVE_COLOR
    ? parseInt(window.GLOBE_PIN_EMISSIVE_COLOR.replace('#', ''), 16) : 0xff3333;
  const pinEmissiveIntensity = window.GLOBE_PIN_EMISSIVE_INTENSITY ?? 0.2;

  const markerGeometry = new THREE.ConeGeometry(markerSize, markerHeight, 8);
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: pinColor,
    emissive: pinEmissiveColor,
    emissiveIntensity: pinEmissiveIntensity,
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