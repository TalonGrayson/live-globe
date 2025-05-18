const svg2img = require('svg2img');
const fs = require('fs');
const path = require('path');

const texturesDir = path.join(__dirname, 'public', 'assets', 'textures');

// List of files to convert
const files = [
  'earth_diffuse.svg',
  'earth_bump.svg',
  'earth_roughness.svg',
  'earth_ao.svg'
];

// Process each file
files.forEach(svgFile => {
  const svgPath = path.join(texturesDir, svgFile);
  const jpgPath = path.join(texturesDir, svgFile.replace('.svg', '.jpg'));
  
  // Read SVG file
  const svgContent = fs.readFileSync(svgPath, 'utf-8');
  
  // Convert to JPG
  svg2img(svgContent, {
    width: 1024,
    height: 512,
    preserveAspectRatio: true
  }, (error, buffer) => {
    if (error) {
      console.error(`Error converting ${svgFile}:`, error);
      return;
    }
    
    // Write JPG file
    fs.writeFileSync(jpgPath, buffer);
    console.log(`Converted ${svgFile} to JPG successfully`);
    
    // Delete the SVG file (optional)
    fs.unlinkSync(svgPath);
    console.log(`Removed ${svgFile}`);
  });
}); 