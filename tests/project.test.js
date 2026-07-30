import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("required project files exist", () => {
  const required = [
    "index.html",
    "start-game.sh",
    "README.md",
    "js/main.js",
    "js/config.js",
    "js/world.js",
    "js/vehicle.js",
    "js/enemies.js",
    "js/camps.js",
    "js/events.js",
    "js/missions.js",
    "js/pickups.js",
    "js/pool.js",
    "js/ui.js",
    "js/audio.js",
    "css/ui.css",
    "css/forest.css"
  ];

  for (const file of required) {
    assert.equal(
      fs.existsSync(path.join(root, file)),
      true,
      `Missing required file: ${file}`
    );
  }
});

test("game is branded as Richmack: The Forest", () => {
  const html = read("index.html");
  const readme = read("README.md");

  assert.match(html, /RICHMACK/i);
  assert.match(html, /THE FOREST/i);
  assert.match(readme, /Richmack: The Forest/i);
});

test("Fast graphics is the default mode", () => {
  const html = read("index.html");

  assert.match(
    html,
    /<option value="fast" selected>Ultra Fast — Recommended<\/option>/
  );
});

test("road meshes are not created by main.js", () => {
  const main = read("js/main.js");

  assert.doesNotMatch(main, /createRoads\s*\(/);
  assert.doesNotMatch(main, /import\s*\{[^}]*createRoads/);
});

test("vehicle anti-sinking protection exists", () => {
  const vehicle = read("js/vehicle.js");

  assert.match(vehicle, /vehicleGroundHeight/);
  assert.match(vehicle, /if\s*\(v\.group\.position\.y<groundY\)/);
  assert.match(vehicle, /v\.group\.rotation\.set\(0,v\.heading,0\)/);
});

test("tree and enemy collision systems exist", () => {
  const world = read("js/world.js");
  const enemies = read("js/enemies.js");
  const main = read("js/main.js");

  assert.match(world, /checkTreeCollision/);
  assert.match(enemies, /collideWithVehicle/);
  assert.match(main, /checkTreeCollision/);
  assert.match(main, /collideWithVehicle/);
});

test("dynamic enemy spawning exists", () => {
  const enemies = read("js/enemies.js");
  const config = read("js/config.js");

  assert.match(enemies, /maintainPopulation/);
  assert.match(enemies, /spawnOne/);
  assert.match(config, /ENEMY_SPAWN/);
});

test("module files use pinned Three.js version", () => {
  const files = fs.readdirSync(path.join(root, "js"))
    .filter(file => file.endsWith(".js"));

  for (const file of files) {
    const content = read(path.join("js", file));
    if (content.includes("three.module.js")) {
      assert.match(content, /three@0\.185\.1/);
    }
  }
});
