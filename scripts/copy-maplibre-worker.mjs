// Copies MapLibre's worker files into public/maplibre so the map can load its worker from our own origin.
// The bundled default worker URL breaks under Turbopack ("Worker failed to load"). Runs before dev and build.
import { cpSync, mkdirSync } from "node:fs";

const from = new URL("../node_modules/maplibre-gl/dist/", import.meta.url);
const to = new URL("../public/maplibre/", import.meta.url);
mkdirSync(to, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) cpSync(new URL(f, from), new URL(f, to));
