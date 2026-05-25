-- CreateTable
CREATE TABLE "GlobeSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "pinColor" TEXT NOT NULL DEFAULT '#ff3333',
    "pinEmissiveColor" TEXT NOT NULL DEFAULT '#ff3333',
    "pinEmissiveIntensity" REAL NOT NULL DEFAULT 0.2,
    "bloomStrength" REAL NOT NULL DEFAULT 0.3,
    "bloomThreshold" REAL NOT NULL DEFAULT 1.0,
    "bloomRadius" REAL NOT NULL DEFAULT 0.1,
    "atmosphereColor" TEXT NOT NULL DEFAULT '#3366cc',
    "atmosphereOpacity" REAL NOT NULL DEFAULT 0.6,
    "atmosphereIntensity" REAL NOT NULL DEFAULT 0.65,
    "atmospherePower" REAL NOT NULL DEFAULT 5.0,
    "sunIntensity" REAL NOT NULL DEFAULT 1.2,
    "ambientLight" REAL NOT NULL DEFAULT 0.3,
    "emissionIntensity" REAL NOT NULL DEFAULT 0.25,
    "bumpScale" REAL NOT NULL DEFAULT 0.5,
    "starCount" INTEGER NOT NULL DEFAULT 1500,
    "starSize" REAL NOT NULL DEFAULT 1.0,
    "starOpacity" REAL NOT NULL DEFAULT 0.8,
    "updatedAt" DATETIME NOT NULL
);
