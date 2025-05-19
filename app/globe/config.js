/**
 * Configuration utility for the 3D Globe
 * Handles environment variables and default settings
 */

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Default configuration
const DEFAULT_CONFIG = {
  // Sun light settings
  sunIntensity: 1.2,       // Brightness of the directional sun light
  ambientLight: 0.3,       // Ambient light intensity (affects dark side)
  emissionIntensity: 0.25, // Nighttime emission glow intensity
  
  // Visualization settings
  sunVisualSize: 1.0,        // Size of the sun sphere
  sunVisualBrightness: 1.0,  // Brightness of the sun sphere
  
  // Debug settings
  debug: false
};

// Store config in module scope for server-side usage
let currentConfig = { ...DEFAULT_CONFIG };

/**
 * Initialize configuration from environment variables
 * Looks for variables with the ENV_ prefix
 */
export function initConfig() {
  // Gather configuration from environment or defaults
  const config = {
    // Sun light settings
    sunIntensity: getEnvVar('SUN_INTENSITY', DEFAULT_CONFIG.sunIntensity),
    ambientLight: getEnvVar('SUN_AMBIENT_LIGHT', DEFAULT_CONFIG.ambientLight),
    emissionIntensity: getEnvVar('SUN_EMISSION_INTENSITY', DEFAULT_CONFIG.emissionIntensity),
    
    // Visualization settings
    sunVisualSize: getEnvVar('SUN_VISUAL_SIZE', DEFAULT_CONFIG.sunVisualSize),
    sunVisualBrightness: getEnvVar('SUN_VISUAL_BRIGHTNESS', DEFAULT_CONFIG.sunVisualBrightness),
    
    // Debug settings
    debug: getEnvVar('DEBUG', DEFAULT_CONFIG.debug)
  };
  
  // Store the config for server-side use
  currentConfig = { ...config };
  
  // Set the environment variables globally if in browser
  if (isBrowser) {
    Object.entries(config).forEach(([key, value]) => {
      const envKey = `ENV_${camelToSnakeCase(key).toUpperCase()}`;
      window[envKey] = value;
    });
    
    if (config.debug) {
      console.log('Globe configuration initialized:', config);
    }
  }
  
  return config;
}

/**
 * Get an environment variable with fallback
 */
function getEnvVar(name, defaultValue) {
  // For browser environment
  if (isBrowser) {
    const envName = `ENV_${name}`;
    
    // Check for window-defined environment variables
    if (window[envName] !== undefined) {
      return window[envName];
    }
  }
  
  // Check for process.env (server-side or during build)
  if (typeof process !== 'undefined' && 
      process.env && 
      process.env[`GLOBE_${name}`] !== undefined) {
    const value = process.env[`GLOBE_${name}`];
    
    // Convert string values to appropriate types
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(parseFloat(value))) return parseFloat(value);
    return value;
  }
  
  // Return default if no environment variable found
  return defaultValue;
}

/**
 * Convert camelCase to SNAKE_CASE
 */
function camelToSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Get current configuration
 * Can be used to retrieve current settings
 */
export function getConfig() {
  // For browser environment, get from window
  if (isBrowser) {
    return {
      sunIntensity: window.ENV_SUN_INTENSITY || currentConfig.sunIntensity,
      ambientLight: window.ENV_SUN_AMBIENT_LIGHT || currentConfig.ambientLight,
      emissionIntensity: window.ENV_SUN_EMISSION_INTENSITY || currentConfig.emissionIntensity,
      sunVisualSize: window.ENV_SUN_VISUAL_SIZE || currentConfig.sunVisualSize,
      sunVisualBrightness: window.ENV_SUN_VISUAL_BRIGHTNESS || currentConfig.sunVisualBrightness,
      debug: window.ENV_DEBUG || currentConfig.debug
    };
  }
  
  // For server environment, return stored config
  return currentConfig;
} 