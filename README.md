# Live Globe

A 3D interactive globe with customizable location markers.

## Features

- 3D Earth visualization with atmospheric effects
- Interactive controls for panning and zooming
- Custom location markers
- Support for custom 3D models as markers (GLB format)
- Click-to-focus on markers

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