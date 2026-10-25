import { existsSync } from "node:fs";
import { resolve } from "node:path";

let loaded = false;

/** Load `.env.local`, then `.env`. Existing process variables win. */
export function loadLocalEnv() {
  if (loaded) return;
  loaded = true;
  for (const file of [".env.local", ".env"]) {
    const path = resolve(/*turbopackIgnore: true*/ process.cwd(), file);
    if (existsSync(path)) process.loadEnvFile(path);
  }
}
