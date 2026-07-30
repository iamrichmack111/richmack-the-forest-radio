
export const WORLD_SIZE = 2600;

export const QUALITY = {
  fast: {
    label: "FAST",
    pixelRatio: 1,
    terrainSegments: 88,
    treeCount: 520,
    rockCount: 110,
    enemyCount: 22,
    activeTorchLights: 8,
    shadows: false,
    shadowMapSize: 512,
    enemyUpdateStride: 3,
    hudInterval: .10,
    fogDensity: .00165
  },
  balanced: {
    label: "BALANCED",
    pixelRatio: 1.25,
    terrainSegments: 128,
    treeCount: 780,
    rockCount: 160,
    enemyCount: 28,
    activeTorchLights: 12,
    shadows: true,
    shadowMapSize: 1024,
    enemyUpdateStride: 2,
    hudInterval: .08,
    fogDensity: .0019
  },
  quality: {
    label: "QUALITY",
    pixelRatio: Math.min(devicePixelRatio, 1.75),
    terrainSegments: 180,
    treeCount: 1050,
    rockCount: 240,
    enemyCount: 36,
    activeTorchLights: 18,
    shadows: true,
    shadowMapSize: 2048,
    enemyUpdateStride: 1,
    hudInterval: .06,
    fogDensity: .0022
  }
};

export const MISSIONS = [
  {name:"Richmack Relic Run",text:"Collect cursed relics from the forest.",type:"relic",goal:6,reward:1400},
  {name:"Night Exorcist",text:"Destroy monsters roaming through the forest.",type:"kills",goal:14,reward:2400},
  {name:"Forest Route",text:"Drive through the Richmack forest checkpoint trail.",type:"checkpoints",goal:8,reward:2800},
  {name:"Supply Recovery",text:"Collect Richmack Fuel canisters.",type:"fuel",goal:5,reward:1800},
  {name:"Camp Cleanout",text:"Clear haunted enemy camps.",type:"camps",goal:3,reward:3500},
  {name:"Boss Hunt",text:"Destroy the creature controlling the forest.",type:"boss",goal:1,reward:5000}
];

export const RADIO_STATIONS = [
  "Quiet Storm",
  "Night Drive",
  "Forest Radio",
  "Richmack Hip Hop",
  "Silence"
];


export const ENEMY_SPAWN = {
  minActive: 8,
  targetActive: 12,
  maxActive: 16,
  spawnMinDistance: 115,
  spawnMaxDistance: 280,
  despawnDistance: 520,
  spawnInterval: 1.25
};

export const NIGHT_EVENTS = [
  {name:"Vampire Ambush",duration:24,spawnBonus:5,message:"VAMPIRE AMBUSH — KEEP MOVING"},
  {name:"Witch Ritual",duration:28,spawnBonus:4,message:"WITCH RITUAL DETECTED"},
  {name:"Blood Moon",duration:34,spawnBonus:7,message:"BLOOD MOON — ENEMIES ARE STRONGER"},
  {name:"Forest Fog",duration:26,spawnBonus:3,message:"THE FOREST FOG IS CLOSING IN"}
];
