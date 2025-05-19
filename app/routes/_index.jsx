import { useEffect, useRef, useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { setupEarth, setMarkerModel } from '../globe/main.js';

export const loader = async () => {
  // You can fetch data here that will be used by the component
  return json({
    // Your data here
  });
};

export default function Index() {
  const globeRef = useRef(null);
  const cleanupRef = useRef(null);
  const data = useLoaderData();
  const [loading, setLoading] = useState(true);

  function initGlobe() {
    // Set the custom model before initializing
    setMarkerModel('/models/pin.glb');
    
    // Then initialize the globe
    const container = document.getElementById('globe-container');
    setupEarth(container);
  }
  
  useEffect(() => {
    let isMounted = true;
    
    // Import visualization code and set up the globe
    const loadGlobe = async () => {
      try {
        // Import the modules dynamically to ensure they only run on the client
        const { setupEarth } = await import("../globe/main.js");
        
        // Only proceed if the component is still mounted
        if (!isMounted || !globeRef.current) return;

        initGlobe();
        
        // The setupEarth function now handles cleanup internally
        const cleanup = await setupEarth(globeRef.current);
        
        // Store cleanup function
        if (isMounted) {
          // Clean up previous instance if it exists
          if (cleanupRef.current) {
            cleanupRef.current();
          }
          
          cleanupRef.current = cleanup;
          setLoading(false);
        } else if (cleanup) {
          // Component unmounted during setup, clean up immediately
          cleanup();
        }
      } catch (error) {
        console.error("Error loading globe:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadGlobe();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);  // Empty dependency array means this runs once on mount

  return (
    <div className="container">
      <h1>Live Globe Visualization</h1>
      <div ref={globeRef} id="globe-container" className="globe"></div>
      
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Earth...</p>
        </div>
      )}
    </div>
  );
} 