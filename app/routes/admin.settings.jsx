import { useEffect, useRef } from "react";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useActionData, Link } from "@remix-run/react";
import { requireAdmin } from "../sessions.server";
import { getSettings, saveSettings, DEFAULT_SETTINGS } from "../lib/settings.server";
import adminStyles from "../styles/admin.css";

export function links() {
  return [{ rel: "stylesheet", href: adminStyles }];
}

export async function loader({ request }) {
  await requireAdmin(request);
  const settings = await getSettings();
  return json({ settings });
}

export async function action({ request }) {
  await requireAdmin(request);
  const fd = await request.formData();

  const num = (key, def) => { const v = parseFloat(fd.get(key)); return isNaN(v) ? def : v; };
  const int = (key, def) => { const v = parseInt(fd.get(key), 10); return isNaN(v) ? def : v; };
  const str = (key, def) => fd.get(key)?.trim() || def;

  await saveSettings({
    pinColor:             str("pinColor",             DEFAULT_SETTINGS.pinColor),
    pinEmissiveColor:     str("pinEmissiveColor",     DEFAULT_SETTINGS.pinEmissiveColor),
    pinEmissiveIntensity: num("pinEmissiveIntensity", DEFAULT_SETTINGS.pinEmissiveIntensity),
    bloomStrength:        num("bloomStrength",        DEFAULT_SETTINGS.bloomStrength),
    bloomThreshold:       num("bloomThreshold",       DEFAULT_SETTINGS.bloomThreshold),
    bloomRadius:          num("bloomRadius",          DEFAULT_SETTINGS.bloomRadius),
    atmosphereColor:      str("atmosphereColor",      DEFAULT_SETTINGS.atmosphereColor),
    atmosphereOpacity:    num("atmosphereOpacity",    DEFAULT_SETTINGS.atmosphereOpacity),
    atmosphereIntensity:  num("atmosphereIntensity",  DEFAULT_SETTINGS.atmosphereIntensity),
    atmospherePower:      num("atmospherePower",      DEFAULT_SETTINGS.atmospherePower),
    sunIntensity:         num("sunIntensity",         DEFAULT_SETTINGS.sunIntensity),
    ambientLight:         num("ambientLight",         DEFAULT_SETTINGS.ambientLight),
    emissionIntensity:    num("emissionIntensity",    DEFAULT_SETTINGS.emissionIntensity),
    bumpScale:            num("bumpScale",            DEFAULT_SETTINGS.bumpScale),
    starCount:            int("starCount",            DEFAULT_SETTINGS.starCount),
    starSize:             num("starSize",             DEFAULT_SETTINGS.starSize),
    starOpacity:          num("starOpacity",          DEFAULT_SETTINGS.starOpacity),
  });

  return json({ saved: true });
}

export default function AdminSettings() {
  const { settings } = useLoaderData();
  const actionData   = useActionData();
  const previewRef   = useRef(null);
  const previewApi   = useRef(null);
  const formRef      = useRef(null);

  useEffect(() => {
    if (!previewRef.current) return;
    let api;
    import("../globe/preview.js").then(({ setupPreview }) => {
      if (!previewRef.current) return;
      api = setupPreview(previewRef.current, settings);
      previewApi.current = api;
    });
    return () => { api?.destroy(); previewApi.current = null; };
  }, []);

  function handleChange() {
    if (!previewApi.current || !formRef.current) return;
    const fd = new FormData(formRef.current);
    const n  = (k) => parseFloat(fd.get(k));
    previewApi.current.applySettings({
      pinColor:            fd.get("pinColor"),
      bloomStrength:       n("bloomStrength"),
      bloomThreshold:      n("bloomThreshold"),
      bloomRadius:         n("bloomRadius"),
      atmosphereColor:     fd.get("atmosphereColor"),
      atmosphereOpacity:   n("atmosphereOpacity"),
      atmosphereIntensity: n("atmosphereIntensity"),
      atmospherePower:     n("atmospherePower"),
      sunIntensity:        n("sunIntensity"),
      ambientLight:        n("ambientLight"),
      starSize:            n("starSize"),
      starOpacity:         n("starOpacity"),
    });
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Live Globe — Admin</h1>
        <nav className="admin-nav">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/settings">Settings</Link>
        </nav>
        <Form method="post" action="/admin/logout">
          <button type="submit" className="admin-btn secondary">Sign out</button>
        </Form>
      </header>

      <main className="admin-main settings-layout">

        <Form method="post" className="settings-form" ref={formRef} onChange={handleChange}>

          <div className="settings-section">
            <h2>Pins</h2>
            <div className="settings-grid">
              <Field label="Colour" name="pinColor" type="color" value={settings.pinColor} />
              <Field label="Emissive colour" name="pinEmissiveColor" type="color" value={settings.pinEmissiveColor} />
              <Field label="Emissive intensity" name="pinEmissiveIntensity" type="number" value={settings.pinEmissiveIntensity} min={0} max={5} step={0.01} hint="GLB models only · 0 – 5" />
            </div>
          </div>

          <div className="settings-section">
            <h2>Bloom</h2>
            <div className="settings-grid">
              <Field label="Strength" name="bloomStrength" type="number" value={settings.bloomStrength} min={0} max={5} step={0.01} hint="0 – 5" />
              <Field label="Threshold" name="bloomThreshold" type="number" value={settings.bloomThreshold} min={0} max={1} step={0.01} hint="0 – 1" />
              <Field label="Radius" name="bloomRadius" type="number" value={settings.bloomRadius} min={0} max={1} step={0.01} hint="0 – 1" />
            </div>
          </div>

          <div className="settings-section">
            <h2>Atmosphere</h2>
            <div className="settings-grid">
              <Field label="Colour" name="atmosphereColor" type="color" value={settings.atmosphereColor} />
              <Field label="Opacity" name="atmosphereOpacity" type="number" value={settings.atmosphereOpacity} min={0} max={1} step={0.01} hint="0 – 1" />
              <Field label="Glow intensity" name="atmosphereIntensity" type="number" value={settings.atmosphereIntensity} min={0} max={1} step={0.01} hint="0 – 1" />
              <Field label="Glow falloff" name="atmospherePower" type="number" value={settings.atmospherePower} min={1} max={20} step={0.1} hint="1 – 20, higher = tighter edge" />
            </div>
          </div>

          <div className="settings-section">
            <h2>Lighting</h2>
            <div className="settings-grid">
              <Field label="Sun intensity" name="sunIntensity" type="number" value={settings.sunIntensity} min={0} max={5} step={0.01} hint="0 – 5" />
              <Field label="Ambient light" name="ambientLight" type="number" value={settings.ambientLight} min={0} max={1} step={0.01} hint="0 – 1" />
              <Field label="Night emission" name="emissionIntensity" type="number" value={settings.emissionIntensity} min={0} max={2} step={0.01} hint="0 – 2" />
              <Field label="Bump scale" name="bumpScale" type="number" value={settings.bumpScale} min={0} max={2} step={0.01} hint="0 – 2" />
            </div>
          </div>

          <div className="settings-section">
            <h2>Stars</h2>
            <div className="settings-grid">
              <Field label="Count" name="starCount" type="number" value={settings.starCount} min={0} max={10000} step={1} hint="0 – 10 000 · reload to apply" />
              <Field label="Size" name="starSize" type="number" value={settings.starSize} min={0.1} max={5} step={0.1} hint="0.1 – 5" />
              <Field label="Opacity" name="starOpacity" type="number" value={settings.starOpacity} min={0} max={1} step={0.01} hint="0 – 1" />
            </div>
          </div>

          <div className="settings-actions">
            <button type="submit" className="admin-btn">Save settings</button>
            {actionData?.saved && <span className="settings-saved">Saved — reload the globe to see changes.</span>}
          </div>

        </Form>

        <div className="preview-panel">
          <div ref={previewRef} className="preview-canvas" />
          <p className="preview-label">Preview · drag to rotate</p>
        </div>

      </main>
    </div>
  );
}

function Field({ label, name, type, value, min, max, step, hint }) {
  return (
    <div className="settings-field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={value}
        min={min} max={max} step={step} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}
