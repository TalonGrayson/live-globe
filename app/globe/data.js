// Load location data from the API
export async function loadLocationData() {
  try {
    const response = await fetch('/api/locations');
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading location data:', error);
    return [];
  }
} 