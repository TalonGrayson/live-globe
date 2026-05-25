import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const DEFAULT_SETTINGS = {
  pinColor:             "#ff3333",
  pinEmissiveColor:     "#ff3333",
  pinEmissiveIntensity: 0.2,
  bloomStrength:        0.3,
  bloomThreshold:       1.0,
  bloomRadius:          0.1,
  atmosphereColor:      "#3366cc",
  atmosphereOpacity:    0.6,
  atmosphereIntensity:  0.65,
  atmospherePower:      5.0,
  sunIntensity:         1.2,
  ambientLight:         0.3,
  emissionIntensity:    0.25,
  bumpScale:            0.5,
  starCount:            1500,
  starSize:             1.0,
  starOpacity:          0.8,
};

export async function getSettings() {
  try {
    const row = await prisma.globeSettings.findUnique({ where: { id: 1 } });
    return row ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(data) {
  return prisma.globeSettings.upsert({
    where:  { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
}
