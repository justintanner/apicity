import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

// A rig can have its own pack.toml. The city's city.toml, not the nearest
// pack.toml, identifies the import scope that owns the release-pack pin.
export function findPackCity(start, exists = existsSync) {
  let directory = resolve(start);
  while (true) {
    if (exists(join(directory, "city.toml"))) return directory;
    const parent = dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}
