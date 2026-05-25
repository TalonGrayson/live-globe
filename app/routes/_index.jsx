import { useEffect, useRef, useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { setupEarth, setMarkerModel } from '../globe/main.js';
import { getSettings } from "../lib/settings.server";

export const loader = async () => {
  const settings = await getSettings();
  return json({ settings });
};

export default function Index() {
  const globeRef = useRef(null);
  const cleanupRef = useRef(null);
  const { settings } = useLoaderData();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inject settings as window variables before the globe initialises
    window.GLOBE_PIN_COLOR             = settings.pinColor;
    window.GLOBE_PIN_EMISSIVE_COLOR    = settings.pinEmissiveColor;
    window.GLOBE_PIN_EMISSIVE_INTENSITY = settings.pinEmissiveIntensity;
    window.GLOBE_BLOOM_STRENGTH        = settings.bloomStrength;
    window.GLOBE_BLOOM_THRESHOLD       = settings.bloomThreshold;
    window.GLOBE_BLOOM_RADIUS          = settings.bloomRadius;
    window.GLOBE_ATMOSPHERE_COLOR      = settings.atmosphereColor;
    window.GLOBE_ATMOSPHERE_OPACITY    = settings.atmosphereOpacity;
    window.GLOBE_ATMOSPHERE_INTENSITY  = settings.atmosphereIntensity;
    window.GLOBE_ATMOSPHERE_POWER      = settings.atmospherePower;
    window.GLOBE_STAR_COUNT            = settings.starCount;
    window.GLOBE_STAR_SIZE             = settings.starSize;
    window.GLOBE_STAR_OPACITY          = settings.starOpacity;
    // These keys match the existing config.js ENV_ convention
    window.ENV_SUN_INTENSITY           = settings.sunIntensity;
    window.ENV_SUN_AMBIENT_LIGHT       = settings.ambientLight;
    window.ENV_SUN_EMISSION_INTENSITY  = settings.emissionIntensity;
    window.ENV_BUMP_SCALE              = settings.bumpScale;

    let isMounted = true;

    const loadGlobe = async () => {
      try {
        const { setupEarth } = await import("../globe/main.js");
        if (!isMounted || !globeRef.current) return;

        setMarkerModel('/models/pin.glb');
        const cleanup = await setupEarth(globeRef.current);

        if (isMounted) {
          if (cleanupRef.current) cleanupRef.current();
          cleanupRef.current = cleanup;
          setLoading(false);
        } else if (cleanup) {
          cleanup();
        }
      } catch (error) {
        console.error("Error loading globe:", error);
        if (isMounted) setLoading(false);
      }
    };

    loadGlobe();

    return () => {
      isMounted = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

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
