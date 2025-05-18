const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const WIDTH = 1024;
const HEIGHT = 512;
const texturesDir = path.join(__dirname, 'public', 'assets', 'textures');

// Ensure directory exists
if (!fs.existsSync(texturesDir)) {
  fs.mkdirSync(texturesDir, { recursive: true });
}

// Create diffuse map (color texture)
function createDiffuseMap() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Ocean base
  ctx.fillStyle = '#1a4f9c';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Simple continent shapes
  ctx.fillStyle = '#4d864d';
  
  // North America
  ctx.beginPath();
  ctx.moveTo(150, 100);
  ctx.quadraticCurveTo(200, 80, 220, 120);
  ctx.quadraticCurveTo(240, 150, 250, 200);
  ctx.quadraticCurveTo(270, 230, 240, 260);
  ctx.quadraticCurveTo(220, 300, 170, 290);
  ctx.quadraticCurveTo(130, 270, 120, 210);
  ctx.quadraticCurveTo(110, 170, 150, 100);
  ctx.fill();
  
  // South America
  ctx.beginPath();
  ctx.moveTo(250, 300);
  ctx.quadraticCurveTo(270, 320, 280, 360);
  ctx.quadraticCurveTo(290, 410, 270, 450);
  ctx.quadraticCurveTo(230, 470, 200, 440);
  ctx.quadraticCurveTo(190, 380, 220, 340);
  ctx.quadraticCurveTo(240, 310, 250, 300);
  ctx.fill();
  
  // Europe
  ctx.beginPath();
  ctx.moveTo(500, 120);
  ctx.quadraticCurveTo(530, 100, 560, 130);
  ctx.quadraticCurveTo(580, 180, 560, 200);
  ctx.quadraticCurveTo(520, 220, 480, 180);
  ctx.quadraticCurveTo(470, 150, 500, 120);
  ctx.fill();
  
  // Africa
  ctx.beginPath();
  ctx.moveTo(520, 200);
  ctx.quadraticCurveTo(560, 220, 590, 280);
  ctx.quadraticCurveTo(600, 340, 570, 390);
  ctx.quadraticCurveTo(530, 410, 490, 370);
  ctx.quadraticCurveTo(470, 320, 490, 260);
  ctx.quadraticCurveTo(510, 220, 520, 200);
  ctx.fill();
  
  // Asia
  ctx.beginPath();
  ctx.moveTo(600, 100);
  ctx.quadraticCurveTo(650, 80, 700, 100);
  ctx.quadraticCurveTo(750, 150, 780, 200);
  ctx.quadraticCurveTo(790, 250, 750, 290);
  ctx.quadraticCurveTo(710, 320, 660, 300);
  ctx.quadraticCurveTo(620, 260, 600, 210);
  ctx.quadraticCurveTo(590, 150, 600, 100);
  ctx.fill();
  
  // Australia
  ctx.beginPath();
  ctx.moveTo(780, 320);
  ctx.quadraticCurveTo(820, 310, 850, 340);
  ctx.quadraticCurveTo(860, 380, 830, 410);
  ctx.quadraticCurveTo(790, 420, 770, 380);
  ctx.quadraticCurveTo(760, 340, 780, 320);
  ctx.fill();
  
  // Antarctica
  ctx.fillStyle = '#d9e6f2';
  ctx.beginPath();
  ctx.moveTo(300, 470);
  ctx.quadraticCurveTo(400, 480, 500, 470);
  ctx.quadraticCurveTo(600, 480, 700, 470);
  ctx.quadraticCurveTo(750, 450, 700, 430);
  ctx.quadraticCurveTo(600, 420, 500, 430);
  ctx.quadraticCurveTo(400, 420, 300, 430);
  ctx.quadraticCurveTo(270, 450, 300, 470);
  ctx.fill();
  
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(path.join(texturesDir, 'earth_diffuse.jpg'), buffer);
  console.log('Created earth_diffuse.jpg');
}

// Create bump map
function createBumpMap() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Base (all flat)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Continental elevation (medium height)
  ctx.fillStyle = '#8c8c8c';
  ctx.globalAlpha = 0.7;
  
  // North America
  ctx.beginPath();
  ctx.moveTo(150, 100);
  ctx.quadraticCurveTo(200, 80, 220, 120);
  ctx.quadraticCurveTo(240, 150, 250, 200);
  ctx.quadraticCurveTo(270, 230, 240, 260);
  ctx.quadraticCurveTo(220, 300, 170, 290);
  ctx.quadraticCurveTo(130, 270, 120, 210);
  ctx.quadraticCurveTo(110, 170, 150, 100);
  ctx.fill();
  
  // South America
  ctx.beginPath();
  ctx.moveTo(250, 300);
  ctx.quadraticCurveTo(270, 320, 280, 360);
  ctx.quadraticCurveTo(290, 410, 270, 450);
  ctx.quadraticCurveTo(230, 470, 200, 440);
  ctx.quadraticCurveTo(190, 380, 220, 340);
  ctx.quadraticCurveTo(240, 310, 250, 300);
  ctx.fill();
  
  // Europe
  ctx.beginPath();
  ctx.moveTo(500, 120);
  ctx.quadraticCurveTo(530, 100, 560, 130);
  ctx.quadraticCurveTo(580, 180, 560, 200);
  ctx.quadraticCurveTo(520, 220, 480, 180);
  ctx.quadraticCurveTo(470, 150, 500, 120);
  ctx.fill();
  
  // Africa
  ctx.beginPath();
  ctx.moveTo(520, 200);
  ctx.quadraticCurveTo(560, 220, 590, 280);
  ctx.quadraticCurveTo(600, 340, 570, 390);
  ctx.quadraticCurveTo(530, 410, 490, 370);
  ctx.quadraticCurveTo(470, 320, 490, 260);
  ctx.quadraticCurveTo(510, 220, 520, 200);
  ctx.fill();
  
  // Asia
  ctx.beginPath();
  ctx.moveTo(600, 100);
  ctx.quadraticCurveTo(650, 80, 700, 100);
  ctx.quadraticCurveTo(750, 150, 780, 200);
  ctx.quadraticCurveTo(790, 250, 750, 290);
  ctx.quadraticCurveTo(710, 320, 660, 300);
  ctx.quadraticCurveTo(620, 260, 600, 210);
  ctx.quadraticCurveTo(590, 150, 600, 100);
  ctx.fill();
  
  // Australia
  ctx.beginPath();
  ctx.moveTo(780, 320);
  ctx.quadraticCurveTo(820, 310, 850, 340);
  ctx.quadraticCurveTo(860, 380, 830, 410);
  ctx.quadraticCurveTo(790, 420, 770, 380);
  ctx.quadraticCurveTo(760, 340, 780, 320);
  ctx.fill();
  
  // Antarctica
  ctx.fillStyle = '#e6e6e6';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(300, 470);
  ctx.quadraticCurveTo(400, 480, 500, 470);
  ctx.quadraticCurveTo(600, 480, 700, 470);
  ctx.quadraticCurveTo(750, 450, 700, 430);
  ctx.quadraticCurveTo(600, 420, 500, 430);
  ctx.quadraticCurveTo(400, 420, 300, 430);
  ctx.quadraticCurveTo(270, 450, 300, 470);
  ctx.fill();
  
  // Mountain ranges (highest points)
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 1.0;
  
  // North America Rockies
  ctx.beginPath();
  ctx.moveTo(150, 120);
  ctx.quadraticCurveTo(170, 110, 180, 130);
  ctx.quadraticCurveTo(190, 150, 170, 170);
  ctx.quadraticCurveTo(150, 160, 150, 120);
  ctx.fill();
  
  // South America Andes
  ctx.beginPath();
  ctx.moveTo(220, 330);
  ctx.quadraticCurveTo(230, 350, 220, 380);
  ctx.quadraticCurveTo(210, 370, 220, 330);
  ctx.fill();
  
  // Europe Alps
  ctx.beginPath();
  ctx.moveTo(510, 150);
  ctx.quadraticCurveTo(520, 140, 530, 150);
  ctx.quadraticCurveTo(525, 160, 510, 150);
  ctx.fill();
  
  // Asia Himalayans
  ctx.beginPath();
  ctx.moveTo(650, 220);
  ctx.quadraticCurveTo(680, 200, 710, 230);
  ctx.quadraticCurveTo(700, 250, 670, 240);
  ctx.quadraticCurveTo(650, 230, 650, 220);
  ctx.fill();
  
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(path.join(texturesDir, 'earth_bump.jpg'), buffer);
  console.log('Created earth_bump.jpg');
}

// Create roughness map
function createRoughnessMap() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Base (smooth oceans)
  ctx.fillStyle = '#cccccc';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Continents (medium roughness)
  ctx.fillStyle = '#666666';
  
  // North America
  ctx.beginPath();
  ctx.moveTo(150, 100);
  ctx.quadraticCurveTo(200, 80, 220, 120);
  ctx.quadraticCurveTo(240, 150, 250, 200);
  ctx.quadraticCurveTo(270, 230, 240, 260);
  ctx.quadraticCurveTo(220, 300, 170, 290);
  ctx.quadraticCurveTo(130, 270, 120, 210);
  ctx.quadraticCurveTo(110, 170, 150, 100);
  ctx.fill();
  
  // South America
  ctx.beginPath();
  ctx.moveTo(250, 300);
  ctx.quadraticCurveTo(270, 320, 280, 360);
  ctx.quadraticCurveTo(290, 410, 270, 450);
  ctx.quadraticCurveTo(230, 470, 200, 440);
  ctx.quadraticCurveTo(190, 380, 220, 340);
  ctx.quadraticCurveTo(240, 310, 250, 300);
  ctx.fill();
  
  // Europe
  ctx.beginPath();
  ctx.moveTo(500, 120);
  ctx.quadraticCurveTo(530, 100, 560, 130);
  ctx.quadraticCurveTo(580, 180, 560, 200);
  ctx.quadraticCurveTo(520, 220, 480, 180);
  ctx.quadraticCurveTo(470, 150, 500, 120);
  ctx.fill();
  
  // Africa
  ctx.beginPath();
  ctx.moveTo(520, 200);
  ctx.quadraticCurveTo(560, 220, 590, 280);
  ctx.quadraticCurveTo(600, 340, 570, 390);
  ctx.quadraticCurveTo(530, 410, 490, 370);
  ctx.quadraticCurveTo(470, 320, 490, 260);
  ctx.quadraticCurveTo(510, 220, 520, 200);
  ctx.fill();
  
  // Asia
  ctx.beginPath();
  ctx.moveTo(600, 100);
  ctx.quadraticCurveTo(650, 80, 700, 100);
  ctx.quadraticCurveTo(750, 150, 780, 200);
  ctx.quadraticCurveTo(790, 250, 750, 290);
  ctx.quadraticCurveTo(710, 320, 660, 300);
  ctx.quadraticCurveTo(620, 260, 600, 210);
  ctx.quadraticCurveTo(590, 150, 600, 100);
  ctx.fill();
  
  // Australia
  ctx.beginPath();
  ctx.moveTo(780, 320);
  ctx.quadraticCurveTo(820, 310, 850, 340);
  ctx.quadraticCurveTo(860, 380, 830, 410);
  ctx.quadraticCurveTo(790, 420, 770, 380);
  ctx.quadraticCurveTo(760, 340, 780, 320);
  ctx.fill();
  
  // Antarctica (very rough)
  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.moveTo(300, 470);
  ctx.quadraticCurveTo(400, 480, 500, 470);
  ctx.quadraticCurveTo(600, 480, 700, 470);
  ctx.quadraticCurveTo(750, 450, 700, 430);
  ctx.quadraticCurveTo(600, 420, 500, 430);
  ctx.quadraticCurveTo(400, 420, 300, 430);
  ctx.quadraticCurveTo(270, 450, 300, 470);
  ctx.fill();
  
  // Mountain ranges (roughest)
  ctx.fillStyle = '#222222';
  
  // North America Rockies
  ctx.beginPath();
  ctx.moveTo(150, 120);
  ctx.quadraticCurveTo(170, 110, 180, 130);
  ctx.quadraticCurveTo(190, 150, 170, 170);
  ctx.quadraticCurveTo(150, 160, 150, 120);
  ctx.fill();
  
  // South America Andes
  ctx.beginPath();
  ctx.moveTo(220, 330);
  ctx.quadraticCurveTo(230, 350, 220, 380);
  ctx.quadraticCurveTo(210, 370, 220, 330);
  ctx.fill();
  
  // Europe Alps
  ctx.beginPath();
  ctx.moveTo(510, 150);
  ctx.quadraticCurveTo(520, 140, 530, 150);
  ctx.quadraticCurveTo(525, 160, 510, 150);
  ctx.fill();
  
  // Asia Himalayans
  ctx.beginPath();
  ctx.moveTo(650, 220);
  ctx.quadraticCurveTo(680, 200, 710, 230);
  ctx.quadraticCurveTo(700, 250, 670, 240);
  ctx.quadraticCurveTo(650, 230, 650, 220);
  ctx.fill();
  
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(path.join(texturesDir, 'earth_roughness.jpg'), buffer);
  console.log('Created earth_roughness.jpg');
}

// Create ambient occlusion map
function createAoMap() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Base (full ambient light)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Subtle continental occlusion
  ctx.fillStyle = '#dddddd';
  ctx.globalAlpha = 0.3;
  
  // North America
  ctx.beginPath();
  ctx.moveTo(150, 100);
  ctx.quadraticCurveTo(200, 80, 220, 120);
  ctx.quadraticCurveTo(240, 150, 250, 200);
  ctx.quadraticCurveTo(270, 230, 240, 260);
  ctx.quadraticCurveTo(220, 300, 170, 290);
  ctx.quadraticCurveTo(130, 270, 120, 210);
  ctx.quadraticCurveTo(110, 170, 150, 100);
  ctx.fill();
  
  // South America
  ctx.beginPath();
  ctx.moveTo(250, 300);
  ctx.quadraticCurveTo(270, 320, 280, 360);
  ctx.quadraticCurveTo(290, 410, 270, 450);
  ctx.quadraticCurveTo(230, 470, 200, 440);
  ctx.quadraticCurveTo(190, 380, 220, 340);
  ctx.quadraticCurveTo(240, 310, 250, 300);
  ctx.fill();
  
  // Europe
  ctx.beginPath();
  ctx.moveTo(500, 120);
  ctx.quadraticCurveTo(530, 100, 560, 130);
  ctx.quadraticCurveTo(580, 180, 560, 200);
  ctx.quadraticCurveTo(520, 220, 480, 180);
  ctx.quadraticCurveTo(470, 150, 500, 120);
  ctx.fill();
  
  // Africa
  ctx.beginPath();
  ctx.moveTo(520, 200);
  ctx.quadraticCurveTo(560, 220, 590, 280);
  ctx.quadraticCurveTo(600, 340, 570, 390);
  ctx.quadraticCurveTo(530, 410, 490, 370);
  ctx.quadraticCurveTo(470, 320, 490, 260);
  ctx.quadraticCurveTo(510, 220, 520, 200);
  ctx.fill();
  
  // Asia
  ctx.beginPath();
  ctx.moveTo(600, 100);
  ctx.quadraticCurveTo(650, 80, 700, 100);
  ctx.quadraticCurveTo(750, 150, 780, 200);
  ctx.quadraticCurveTo(790, 250, 750, 290);
  ctx.quadraticCurveTo(710, 320, 660, 300);
  ctx.quadraticCurveTo(620, 260, 600, 210);
  ctx.quadraticCurveTo(590, 150, 600, 100);
  ctx.fill();
  
  // Australia
  ctx.beginPath();
  ctx.moveTo(780, 320);
  ctx.quadraticCurveTo(820, 310, 850, 340);
  ctx.quadraticCurveTo(860, 380, 830, 410);
  ctx.quadraticCurveTo(790, 420, 770, 380);
  ctx.quadraticCurveTo(760, 340, 780, 320);
  ctx.fill();
  
  // Shadows in deep valleys
  ctx.fillStyle = '#999999';
  ctx.globalAlpha = 0.6;
  
  // North America valleys
  ctx.beginPath();
  ctx.moveTo(150, 120);
  ctx.quadraticCurveTo(170, 110, 180, 130);
  ctx.quadraticCurveTo(190, 150, 170, 170);
  ctx.quadraticCurveTo(150, 160, 150, 120);
  ctx.fill();
  
  // South America valleys
  ctx.beginPath();
  ctx.moveTo(220, 330);
  ctx.quadraticCurveTo(230, 350, 220, 380);
  ctx.quadraticCurveTo(210, 370, 220, 330);
  ctx.fill();
  
  // Europe valleys
  ctx.beginPath();
  ctx.moveTo(510, 150);
  ctx.quadraticCurveTo(520, 140, 530, 150);
  ctx.quadraticCurveTo(525, 160, 510, 150);
  ctx.fill();
  
  // Asia valleys
  ctx.beginPath();
  ctx.moveTo(650, 220);
  ctx.quadraticCurveTo(680, 200, 710, 230);
  ctx.quadraticCurveTo(700, 250, 670, 240);
  ctx.quadraticCurveTo(650, 230, 650, 220);
  ctx.fill();
  
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(path.join(texturesDir, 'earth_ao.jpg'), buffer);
  console.log('Created earth_ao.jpg');
}

// Create all textures
try {
  createDiffuseMap();
  createBumpMap();
  createRoughnessMap();
  createAoMap();
  console.log('All texture files created successfully');
} catch (error) {
  console.error('Error creating texture files:', error);
} 