# Richmack: The Forest 2.0

An optimized haunted open-world driving survival game built with Three.js.

## New in 2.0

- Dynamic monster spawning so the world never becomes empty
- Enemies spawn around the player instead of all at startup
- Far-away enemies despawn and are reused
- Active enemy count stays controlled for performance
- Haunted camps with mini encounters
- Camp-clearing missions
- Vampire, witch, wolf, skeleton, ghost, and boss enemies
- Enemy patrol movement
- Blood Moon, Witch Ritual, Vampire Ambush, and Forest Fog events
- Boss mission and boss encounter
- Three Richmack Ranger Stations
- Ranger stations automatically repair, refuel, and restock the car
- Farther and higher chase camera
- Better visibility down the road
- Rebalanced mission rewards
- Existing instancing, object pooling, Fast graphics default, and modular structure retained

## Default graphics

```text
Ultra Fast — Recommended
```

Ultra Fast preserves the forest look while reducing expensive rendering work.

## Run

```bash
chmod +x start-game.sh
./start-game.sh
```

Open:

```text
http://localhost:8000
```

Do not double-click `index.html`. The game uses browser modules and must run through the included HTTP server.

## Controls

```text
W / Up Arrow       Accelerate
S / Down Arrow     Reverse
A / Left Arrow     Steer left
D / Right Arrow    Steer right
Space              Shoot
Shift              Handbrake
P or Escape        Pause
C                  Change camera
H                  Toggle headlights
M                  Change Richmack Radio station
R                  Restart
```

## Performance design

- Instanced trees, rocks, torches, and gravestones
- Bullet object pooling
- Enemy object reuse
- Dynamic spawn/despawn system
- Limited active monster count
- Reduced enemy update rate in Fast mode
- Limited real-time torch lights
- Lower Fast-mode pixel ratio
- Lower HUD and minimap refresh rate
- Disabled shadows in Fast mode
- High-performance WebGL renderer preference


## Collision and hitbox update

This revision adds physical collision behavior.

### Enemy projectile hitboxes

- Ghost and white enemy hitboxes are larger and correctly aligned with their visible bodies.
- Projectile detection now uses horizontal radius and vertical height instead of one small center point.
- Wolves, ghosts, standard monsters, and bosses each have appropriately sized hit areas.

### Monster collisions

- Monsters can physically touch the car.
- Contact damages vehicle health and increases vehicle damage.
- High-speed impacts can injure or destroy non-boss monsters.
- Boss impacts cause heavier damage.
- Monsters are pushed away from the vehicle after contact.

### Tree collisions

- Tree positions are stored for collision testing.
- The vehicle can no longer pass freely through tree trunks.
- Tree crashes reduce health and increase vehicle damage.
- The car is pushed away and loses speed after impact.
- Trees avoid the main road centerlines and starting area to preserve playability.


## Road visibility fix

This revision fixes the vehicle rotating into and disappearing beneath roads.

- Removed whole-car terrain pitch rotation
- Keeps the vehicle group upright at all times
- Retains only a small visual body lean while steering
- Uses wheel-appropriate ground clearance
- Adds a hard anti-sinking height clamp every frame
- Raises the camera target to keep the full car visible
- Prevents collision impulses or frame skips from leaving the car below ground


## No-roads version

This revision removes all road meshes from the world.

- The vehicle now drives directly on the terrain.
- No road surface can overlap or cover the car.
- Torch routes, checkpoints, signs, camps, landmarks, and missions remain.
- Forest navigation now relies on torches, checkpoints, signs, and the minimap.
- Tree collision and monster collision remain enabled.


## Automated tests

Run:

```bash
npm run test:all
```

The tests verify:

- required project files
- Richmack branding
- Fast graphics default
- road meshes remain removed
- vehicle anti-sinking logic
- tree and monster collision systems
- dynamic enemy spawning
- pinned Three.js module version
- instruction and on-screen control buttons

GitHub Actions also runs the test suite on pushes and pull requests.

## GitHub release

The included helper can create or rename the repository, update its description, push `main`, create the tag, and publish a GitHub release.

```bash
./release-github.sh richmack-the-forest v2.2.0
```

Default repository description:

```text
Richmack: The Forest is an optimized browser-based haunted open-world driving survival game built with Three.js.
```


## Richmack Radio

Version 2.2.0 bundles 17 local MP3 tracks for offline in-game playback. The cinematic title screen stays uncluttered; radio controls appear only after entering the forest.

Controls: `R` opens/closes the radio, `K` plays or pauses, `N` selects the next track, and `B` selects the previous track. Volume, shuffle, repeat, and the last selected track are remembered in browser storage.
