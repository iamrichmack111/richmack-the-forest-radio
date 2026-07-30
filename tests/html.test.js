import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

test("start button exists", () => {
  assert.match(html, /id="startGame"/);
});

test("instruction navigation buttons exist", () => {
  assert.match(html, /id="prevHelp"/);
  assert.match(html, /id="nextHelp"/);
});

test("on-screen controls exist", () => {
  const controls = [
    "btnUp",
    "btnDown",
    "btnLeft",
    "btnRight",
    "shootBtn",
    "brakeBtn",
    "pauseBtn",
    "cameraBtn",
    "lightsBtn",
    "radioBtn",
    "resetBtn"
  ];

  for (const id of controls) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});
