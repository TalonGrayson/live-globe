import * as THREE from 'three';

// Create location markers on the globe
export function createLocationMarkers(locations, radius) {
  // Create parent object to hold all markers
  const markersGroup = new THREE.Object3D();
  
  // Process each location
  locations.forEach(location => {
    // Convert latitude/longitude to 3D position
    const position = latLngToVector3(location.latitude, location.longitude, radius);
    
    // Create marker mesh
    const markerMesh = createMarker(position);
    markerMesh.userData.locationData = location;
    
    // Add to parent group
    markersGroup.add(markerMesh);
  });
  
  return markersGroup;
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

// Create marker mesh
function createMarker(position) {
  // Make marker slightly above the surface
  const markerSize = 0.1;
  const markerHeight = 0.1;
  const adjustedPosition = position.clone().multiplyScalar(1.02);
  
  // Create cone geometry pointing outward from the center
  const markerGeometry = new THREE.ConeGeometry(markerSize, markerHeight, 8);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff3333 });
  
  // Create marker mesh
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  
  // Position and orient marker
  marker.position.copy(adjustedPosition);
  marker.lookAt(new THREE.Vector3(0, 0, 0));
  marker.rotateX(Math.PI / 2);
  
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