
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js";
import {QUALITY,WORLD_SIZE} from "./config.js";
import {createTerrain,createInstancedForest,createInstancedRocks,createBranding,createTorches,createLandmarks,createRangerStations,terrainHeight,checkTreeCollision} from "./world.js";
import {createVehicle,updateVehicle,resetVehicle} from "./vehicle.js";
import {BulletPool} from "./pool.js";
import {EnemyManager} from "./enemies.js";
import {createPickups,updatePickups} from "./pickups.js";
import {MissionSystem} from "./missions.js";
import {bindHoldButton,showGameUI,updateHUD,flash} from "./ui.js";
import {AudioManager} from "./audio.js";
import {CampManager} from "./camps.js";
import {NightEventManager} from "./events.js";

let scene,camera,renderer,clock,vehicle,enemyManager,bulletPool,pickups,missions,audio,camps,events,rangerStations,forestData;
let qualityName="fast",quality=QUALITY.fast;
let running=false,paused=false,gameOver=false;
let score=0,money=0,cameraMode=1,shootCooldown=0,frame=0,hudTimer=0,treeHitCooldown=0,enemyHitCooldown=0;
const keys={};
const minimap=document.getElementById("minimap");
const mctx=minimap.getContext("2d");


function init(){
  qualityName=document.getElementById("quality").value||"fast";
  quality=QUALITY[qualityName];

  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x050710);
  scene.fog=new THREE.FogExp2(0x111424,quality.fogDensity);

  camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.1,3500);
  renderer=new THREE.WebGLRenderer({antialias:qualityName!=="fast",powerPreference:"high-performance"});
  renderer.setPixelRatio(quality.pixelRatio);
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=quality.shadows;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  document.body.prepend(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0x7086bd,0x281a2c,1.5));
  const moon=new THREE.DirectionalLight(0xb6c7ff,3);
  moon.position.set(-300,420,-250);
  moon.castShadow=quality.shadows;
  moon.shadow.mapSize.set(quality.shadowMapSize,quality.shadowMapSize);
  scene.add(moon);

  createStars();
  createTerrain(scene,quality);
  forestData=createInstancedForest(scene,quality);
  createInstancedRocks(scene,quality);
  createBranding(scene);
  createTorches(scene,quality);
  createLandmarks(scene);
  rangerStations=createRangerStations(scene);

  vehicle=createVehicle(scene,quality);
  bulletPool=new BulletPool(scene,44);
  enemyManager=new EnemyManager(scene,quality);
  enemyManager.activateAround(vehicle.group.position);
  camps=new CampManager(scene,enemyManager);
  events=new NightEventManager(enemyManager,msg=>flash(msg,2200));
  pickups=createPickups(scene);
  missions=new MissionSystem(scene);
  audio=new AudioManager(renderRadio);

  clock=new THREE.Clock();
  bindControls();
  animate();
}

function createStars(){
  const geo=new THREE.BufferGeometry();
  const points=[];
  for(let i=0;i<1200;i++){
    const r=1500+Math.random()*900,a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1);
    points.push(r*Math.sin(b)*Math.cos(a),Math.abs(r*Math.cos(b))+120,r*Math.sin(b)*Math.sin(a));
  }
  geo.setAttribute("position",new THREE.Float32BufferAttribute(points,3));
  scene.add(new THREE.Points(geo,new THREE.PointsMaterial({color:0xffffff,size:1.25})));
}

function bindControls(){
  addEventListener("resize",()=>{
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
  });
  addEventListener("keydown",e=>{
    keys[e.code]=true;
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();
    if(e.code==="Space")shoot();
    if(e.code==="KeyP"||e.code==="Escape")togglePause();
    if(e.code==="KeyC")cycleCamera();
    if(e.code==="KeyH")toggleLights();
    if(e.code==="KeyR")toggleRadioPanel();
    if(e.code==="KeyK")audio.toggle();
    if(e.code==="KeyN")audio.next();
    if(e.code==="KeyB")audio.previous();
  });
  addEventListener("keyup",e=>keys[e.code]=false);

  bindHoldButton("btnUp",keys,"ArrowUp");
  bindHoldButton("btnDown",keys,"ArrowDown");
  bindHoldButton("btnLeft",keys,"ArrowLeft");
  bindHoldButton("btnRight",keys,"ArrowRight");
  bindHoldButton("brakeBtn",keys,"ShiftLeft");

  document.getElementById("shootBtn").addEventListener("pointerdown",e=>{e.preventDefault();shoot()});
  document.getElementById("pauseBtn").addEventListener("click",togglePause);
  document.getElementById("cameraBtn").addEventListener("click",cycleCamera);
  document.getElementById("lightsBtn").addEventListener("click",toggleLights);
  document.getElementById("radioBtn").addEventListener("click",toggleRadioPanel);
  bindRadioControls();
  document.getElementById("resetBtn").addEventListener("click",restart);
  document.getElementById("resumeGame").addEventListener("click",togglePause);
  document.getElementById("restartGame").addEventListener("click",()=>{restart();togglePause()});
}

function start(){
  running=true;
  document.body.classList.add("game-started");
  // Start the MP3 first while the Start button click is still trusted.
  audio.playCurrent().then(ok=>{
    if(!ok){
      document.getElementById("radioPanel").classList.add("open");
      flash("PRESS PLAY TO START RICHMACK RADIO",2600);
    }
  });
  // Initialize the low engine tone only after requesting music playback.
  audio.ensure();
  document.getElementById("loading").classList.remove("active");
  showGameUI(true);
  flash("WELCOME TO RICHMACK: THE FOREST",1800);
}

function shoot(){
  if(!running||paused||gameOver||shootCooldown>0||vehicle.ammo<=0)return;
  vehicle.ammo--;shootCooldown=.18;
  const dir=new THREE.Vector3(-Math.sin(vehicle.heading),0,-Math.cos(vehicle.heading));
  const pos=vehicle.group.position.clone().add(new THREE.Vector3(0,2.6,0)).addScaledVector(dir,5);
  bulletPool.spawn(pos,dir);
}

function togglePause(){
  if(!running)return;
  paused=!paused;
  document.getElementById("pause").classList.toggle("active",paused);
  if(paused)Object.keys(keys).forEach(k=>keys[k]=false);
}

function cycleCamera(){
  cameraMode=(cameraMode+1)%3;
  flash(["CLOSE CAMERA","NORMAL CAMERA","FAR CAMERA"][cameraMode]);
}

function toggleLights(){
  const on=vehicle.headlights[0].intensity===0;
  vehicle.headlights.forEach(l=>l.intensity=on?7:0);
  flash(on?"RICHMACK HEADLIGHTS ON":"HEADLIGHTS OFF");
}

function toggleRadioPanel(){
  if(!running)return;
  const panel=document.getElementById("radioPanel");
  panel.classList.toggle("open");
  renderRadio(audio.state);
}

function formatTime(value){
  if(!Number.isFinite(value)||value<0)return "0:00";
  const minutes=Math.floor(value/60);
  return `${minutes}:${String(Math.floor(value%60)).padStart(2,"0")}`;
}

function renderRadio(state){
  if(!state)return;
  document.getElementById("radioTrack").textContent=state.title;
  document.getElementById("radioCounter").textContent=`Track ${state.index+1} / ${state.count}`;
  document.getElementById("radioPlay").textContent=state.playing?"PAUSE":"PLAY";
  document.getElementById("radioElapsed").textContent=formatTime(state.current);
  document.getElementById("radioDuration").textContent=formatTime(state.duration);
  document.getElementById("radioProgress").value=state.duration?state.current/state.duration:0;
  document.getElementById("radioVolume").value=state.volume;
  document.getElementById("radioShuffle").classList.toggle("active",state.shuffle);
  document.getElementById("radioRepeat").classList.toggle("active",state.repeat);
  document.getElementById("radioStation").textContent=state.error?"Press PLAY":state.title;
  const track=document.getElementById("radioTrack");
  track.title=state.error||state.title;
}

function bindRadioControls(){
  document.getElementById("radioClose").addEventListener("click",()=>document.getElementById("radioPanel").classList.remove("open"));
  document.getElementById("radioPrev").addEventListener("click",()=>audio.previous());
  document.getElementById("radioPlay").addEventListener("click",()=>audio.toggle());
  document.getElementById("radioNext").addEventListener("click",()=>audio.next());
  document.getElementById("radioShuffle").addEventListener("click",()=>audio.toggleShuffle());
  document.getElementById("radioRepeat").addEventListener("click",()=>audio.toggleRepeat());
  document.getElementById("radioVolume").addEventListener("input",e=>audio.setVolume(e.target.value));
  document.getElementById("radioProgress").addEventListener("input",e=>audio.seek(e.target.value));
  renderRadio(audio.state);
}

function restart(){
  resetVehicle(vehicle);
  score=0;money=0;gameOver=false;treeHitCooldown=0;enemyHitCooldown=0;
  missions.reset();
  enemyManager.items.forEach(e=>{e.active=false;e.mesh.visible=false;e.campId=null});
  enemyManager.bossActive=false;
  enemyManager.setEventModifiers(0,1);
  enemyManager.activateAround(vehicle.group.position);
  camps.camps.forEach(c=>{c.cleared=false;c.spawned=false;c.remaining=0});
  events.active=null;events.remaining=0;events.cooldown=42;
  flash("FOREST RUN RESET");
}

function update(dt){
  if(!running||paused||gameOver)return;
  shootCooldown=Math.max(0,shootCooldown-dt);
  treeHitCooldown=Math.max(0,treeHitCooldown-dt);
  enemyHitCooldown=Math.max(0,enemyHitCooldown-dt);
  updateVehicle(vehicle,keys,dt,WORLD_SIZE);

  const treeCollision=checkTreeCollision(
    vehicle.group.position,
    forestData.collisionTrees,
    3.3
  );

  if(treeCollision){
    const impact=Math.abs(vehicle.speed);
    const distance=Math.max(.001,treeCollision.distance);
    const nx=treeCollision.dx/distance;
    const nz=treeCollision.dz/distance;
    const push=treeCollision.minDistance-distance+.25;

    vehicle.group.position.x+=nx*push;
    vehicle.group.position.z+=nz*push;

    if(treeHitCooldown<=0&&impact>5){
      const damage=Math.min(18,2+impact*.16);
      vehicle.health=Math.max(0,vehicle.health-damage);
      vehicle.damage=Math.min(100,vehicle.damage+damage*.7);
      vehicle.speed*=-.22;
      treeHitCooldown=.55;
      flash("TREE COLLISION — VEHICLE DAMAGED");
    }else{
      vehicle.speed*=.72;
    }
  }

  enemyManager.collideWithVehicle(
    vehicle.group.position,
    vehicle.speed,
    ({enemy,impact,damage})=>{
      if(enemyHitCooldown>0)return;

      vehicle.health=Math.max(0,vehicle.health-damage);
      vehicle.damage=Math.min(100,vehicle.damage+damage*.55);

      if(impact>22&&!enemy.isBoss){
        const result=enemyManager.damage(enemy,Math.max(1,Math.floor(impact/22)));
        if(result.killed){
          score+=result.reward;
          money+=Math.floor(result.reward*.22);
          missions.add("kills");
          const cleared=camps.registerKill(result.campId);
          if(cleared)missions.add("camps");
          flash(`${result.type.toUpperCase()} HIT — MONSTER DESTROYED`);
        }else{
          flash("MONSTER IMPACT — CAR DAMAGED");
        }
      }else{
        flash(enemy.isBoss?"BOSS IMPACT — HEAVY DAMAGE":"MONSTER COLLISION — CAR DAMAGED");
      }

      vehicle.speed*=enemy.isBoss?.35:.58;
      enemyHitCooldown=.42;
    }
  );

  audio.updateEngine(vehicle.speed);

  bulletPool.update(dt,item=>{
    const e=enemyManager.hitTest(item.mesh.position);
    if(!e)return true;
    const result=enemyManager.damage(e,1);
    if(result.killed){
      score+=result.reward;
      money+=Math.floor(result.reward*.28);
      missions.add(result.boss?"boss":"kills");
      const cleared=camps.registerKill(result.campId);
      if(cleared){
        missions.add("camps");
        score+=500;
        money+=180;
        flash("HAUNTED CAMP CLEARED",1800);
      }else{
        flash(result.boss?"FOREST BOSS DESTROYED":`${result.type.toUpperCase()} DESTROYED`);
      }
    }
    return false;
  });

  enemyManager.maintainPopulation(vehicle.group.position,dt);
  camps.update(vehicle.group.position);
  events.update(dt,vehicle.group.position);

  if(missions.current?.type==="boss"&&!enemyManager.bossActive){
    const boss=enemyManager.spawnBoss(vehicle.group.position);
    if(boss)flash("THE FOREST BOSS HAS AWAKENED",2200);
  }

  frame++;
  if(frame%quality.enemyUpdateStride===0){
    enemyManager.update(vehicle.group.position,dt*quality.enemyUpdateStride,e=>{
      const hit=e.damage;
      vehicle.health=Math.max(0,vehicle.health-hit);
      vehicle.damage=Math.min(100,vehicle.damage+2);
      flash(e.type==="witch"?"WITCH HEX!":"VAMPIRE STRIKE!");
    });
  }

  updatePickups(pickups,vehicle.group.position,dt,type=>{
    if(type==="relic"){score+=250;money+=40;missions.add("relic");flash("RICHMACK RELIC FOUND")}
    if(type==="fuel"){vehicle.fuel=Math.min(100,vehicle.fuel+35);missions.add("fuel");flash("RICHMACK FUEL +35")}
    if(type==="ammo"){vehicle.ammo+=18;flash("AMMO +18")}
    if(type==="repair"){vehicle.damage=Math.max(0,vehicle.damage-25);vehicle.health=Math.min(100,vehicle.health+18);flash("RICHMACK REPAIR")}
  });

  
  for(const station of rangerStations){
    if(Math.hypot(vehicle.group.position.x-station.x,vehicle.group.position.z-station.z)<16){
      vehicle.fuel=Math.min(100,vehicle.fuel+18*dt);
      vehicle.health=Math.min(100,vehicle.health+12*dt);
      vehicle.damage=Math.max(0,vehicle.damage-10*dt);
      vehicle.ammo=Math.min(120,vehicle.ammo+6*dt);
    }
  }

missions.update(vehicle.group.position,dt,done=>{
    score+=done.reward;money+=Math.floor(done.reward/3);
    flash(`MISSION COMPLETE: ${done.name}`,1800);
  });

  if(vehicle.health<=0){
    gameOver=true;vehicle.speed=0;flash("THE FOREST CLAIMED YOU",3500);
  }
}

function updateCamera(dt){
  const d=[18,25,34][cameraMode],h=[8,11,15][cameraMode];
  const back=new THREE.Vector3(Math.sin(vehicle.heading),0,Math.cos(vehicle.heading)).multiplyScalar(d);
  const desired=vehicle.group.position.clone().add(back);
  desired.y+=h;
  desired.y=Math.max(desired.y,terrainHeight(desired.x,desired.z)+5.5);
  camera.position.lerp(desired,1-Math.pow(.001,dt));
  const look=vehicle.group.position.clone().add(new THREE.Vector3(0,3.0,0))
    .addScaledVector(new THREE.Vector3(-Math.sin(vehicle.heading),0,-Math.cos(vehicle.heading)),14);
  camera.lookAt(look);
  camera.fov=68+Math.min(10,Math.abs(vehicle.speed)*.1);camera.updateProjectionMatrix();
}

function drawMinimap(){
  mctx.clearRect(0,0,190,190);mctx.fillStyle="#07090d";mctx.fillRect(0,0,190,190);
  const map=v=>95+(v/WORLD_SIZE)*180;
  mctx.strokeStyle="#66436d";mctx.strokeRect(5,5,180,180);
  mctx.fillStyle="#b64cff";
  for(const e of enemyManager.items)if(e.active)mctx.fillRect(map(e.mesh.position.x)-1,map(e.mesh.position.z)-1,3,3);
  mctx.fillStyle="#efd24a";
  for(const p of pickups)if(!p.taken)mctx.fillRect(map(p.x)-1,map(p.z)-1,3,3);
  mctx.save();
  mctx.translate(map(vehicle.group.position.x),map(vehicle.group.position.z));
  mctx.rotate(-vehicle.heading);
  mctx.fillStyle="#27e7ff";
  mctx.beginPath();mctx.moveTo(0,-7);mctx.lineTo(5,6);mctx.lineTo(-5,6);mctx.closePath();mctx.fill();
  mctx.restore();
}

function updateUI(dt){
  hudTimer+=dt;
  if(hudTimer<quality.hudInterval)return;
  hudTimer=0;
  updateHUD({
    health:vehicle.health,fuel:vehicle.fuel,damage:vehicle.damage,ammo:vehicle.ammo,
    money,score,speed:vehicle.speed,enemies:enemyManager.totalCount(),
    radio:audio.station,quality:quality.label,mission:missions.current,progress:missions.progress
  });
  drawMinimap();
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(.05,clock?clock.getDelta():.016);
  update(dt);updateCamera(dt);updateUI(dt);renderer.render(scene,camera);
}

document.getElementById("startGame").addEventListener("click",()=>{
  const startButton=document.getElementById("startGame");
  qualityName=document.getElementById("quality").value||"fast";
  startButton.disabled=true;
  startButton.textContent="LOADING THE FOREST...";
  try{
    if(!renderer)init();
    // Start audio inside the original click gesture so Safari/Chrome allow playback.
    start();
    startButton.disabled=false;
    startButton.textContent="ENTER THE FOREST";
  }catch(error){
    console.error(error);
    startButton.disabled=false;
    startButton.textContent="TRY AGAIN";
    const status=document.getElementById("startupStatus");
    status.textContent=`The game could not start: ${error.message}`;
    status.classList.add("error");
  }
});

showGameUI(false);
