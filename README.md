# Live Globe

A 3D interactive globe with customizable location markers.

## Features

- 3D Earth visualization with atmospheric effects
- Interactive controls for panning and zooming
- Custom location markers
- Support for custom 3D models as markers (GLB format)
- Click-to-focus on markers
- Selective bloom effect for emissive materials

## Usage

### Basic Setup

```js
import { setupEarth } from './app/globe/main.js';

// Initialize the globe
const container = document.getElementById('globe-container');
setupEarth(container);
```

### Using Custom 3D Models for Markers

You can use your own GLB models for location markers. Add this code to your application's main JavaScript file (e.g., `app/routes/index.jsx` or any file where you initialize the globe):

```js
import { setupEarth, setMarkerModel } from '../globe/main.js';

// In your component or initialization function:
function initGlobe() {
  // Set the custom model before initializing
  setMarkerModel('/models/pin.glb');
  
  // Then initialize the globe
  const container = document.getElementById('globe-container');
  setupEarth(container);
}

// Call initGlobe() when your component mounts
```

### Updating Markers on an Existing Globe

You can switch marker models on an already initialized globe. Add this to your application code where appropriate:

```js
import { updateMarkers } from '../globe/main.js';

// Update markers with a new model
function changeMarkers() {
  updateMarkers('/models/new-pin.glb');
}

// Or revert to default markers
function resetMarkers() {
  updateMarkers();
}
```

### Focusing on Specific Locations

You can programmatically focus the globe on specific coordinates:

```js
import { focusOnLocationByCoords } from '../globe/main.js';

// Focus on New York
function focusOnNewYork() {
  focusOnLocationByCoords(40.7128, -74.0060);
}

// Focus on Tokyo
function focusOnTokyo() {
  focusOnLocationByCoords(35.6762, 139.6503);
}
```

Users can also click on any marker to automatically zoom and rotate to that location.

### Creating Glowing Markers with Emissive Materials

The globe features a selective bloom effect that makes only emissive materials glow. You can adjust the bloom settings:

```js
import { setBloomSettings } from '../globe/main.js';

// Increase glow intensity
function enhanceGlow() {
  setBloomSettings(3.0, 0.7, 0);
}

// Subtle glow
function subtleGlow() {
  setBloomSettings(1.5, 0.3, 0);
}

// Turn off glow (almost)
function minimizeGlow() {
  setBloomSettings(0.1, 0.1, 0);
}
```

The bloom effect parameters are:
- `strength` (0-5): Intensity of the bloom/glow
- `radius` (0-1): How far the bloom extends
- `threshold` (0-1): Minimum brightness required for bloom

#### Preparing Models with Emissive Materials in Blender

For the selective bloom effect to work, you need to set up emissive materials properly in Blender:

1. In Blender, select your object and go to the Material Properties panel
2. Create or select a material
3. Scroll down to the "Emission" section and enable it
4. Set "Emission Color" to a bright color (this is the color that will glow)
5. Set "Emission Strength" to a value above 0 (higher values = stronger glow):
   - 1.0-3.0: Subtle glow
   - 3.0-5.0: Medium glow
   - 5.0+: Strong glow
6. Export as GLB format, ensuring "Export Materials" is checked

Only parts of your model with emission enabled will glow. You can have multiple materials on a single model, with only some of them set to be emissive.

#### Troubleshooting Bloom Effect

If your emissive materials aren't glowing properly:

1. **Ensure proper export from Blender**:
   - Make sure you're using "Export" → "glTF 2.0 (.glb/.gltf)"
   - Check "Materials" in the export settings
   - Try increasing emission strength to 10+ for more visible results

2. **Force bloom on all markers** (if nothing else works):
   ```js
   import { forceBloomOnAllMarkers } from '../globe/main.js';
   
   // Call this after the globe is initialized
   forceBloomOnAllMarkers();
   ```

3. **Debug the scene**:
   ```js
   import { debugScene } from '../globe/main.js';
   
   // Call this to see which objects have bloom enabled
   debugScene();
   ```

4. **Try stronger bloom settings**:
   ```js
   import { setBloomSettings } from '../globe/main.js';
   
   // Use maximum bloom settings
   setBloomSettings(5.0, 1.0, 0);
   ```

If the model fails to load, the system will automatically fall back to the default cone markers.

## Location Data Format

Location data should be in the following format:

```js
{
  pointName: "Location Name",
  city: "City",
  country: "Country",
  latitude: 40.7128,
  longitude: -74.0060,
  description: "Description of this location"
}
```

## License

[Your license information] 