
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js";
import {terrainHeight} from "./world.js";

function vehicleGroundHeight(x,z,heading){
  const forwardX=-Math.sin(heading);
  const forwardZ=-Math.cos(heading);
  const rightX=Math.cos(heading);
  const rightZ=-Math.sin(heading);

  const samples=[
    [0,0],
    [3.4,2.25],
    [3.4,-2.25],
    [-3.4,2.25],
    [-3.4,-2.25],
    [4.3,0],
    [-4.3,0]
  ];

  let highest=-Infinity;
  for(const [forwardOffset,rightOffset] of samples){
    const sx=x+forwardX*forwardOffset+rightX*rightOffset;
    const sz=z+forwardZ*forwardOffset+rightZ*rightOffset;
    highest=Math.max(highest,terrainHeight(sx,sz));
  }
  return highest;
}

function brandTexture(text){
  const c=document.createElement("canvas");c.width=512;c.height=128;
  const x=c.getContext("2d");x.fillStyle="#16081d";x.fillRect(0,0,512,128);
  x.fillStyle="#ef5dff";x.textAlign="center";x.textBaseline="middle";x.font="bold 58px Arial";x.fillText(text,256,64);
  return new THREE.CanvasTexture(c);
}

export function createVehicle(scene,quality){
  const group=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(5.5,1.55,8.7),new THREE.MeshStandardMaterial({color:0x76269b,metalness:.2,roughness:.5}));
  body.position.y=2.0;body.castShadow=quality.shadows;group.add(body);

  const hood=new THREE.Mesh(new THREE.BoxGeometry(4.8,1.1,2.7),new THREE.MeshStandardMaterial({color:0xa833cb}));
  hood.position.set(0,2.45,-3.25);group.add(hood);

  const cabin=new THREE.Mesh(new THREE.BoxGeometry(4.2,2.1,3.4),new THREE.MeshStandardMaterial({color:0x4a617d,transparent:true,opacity:.86}));
  cabin.position.set(0,3.15,.5);group.add(cabin);

  const wheelMat=new THREE.MeshStandardMaterial({color:0x101010});
  const wheels=[];
  for(const [x,z] of [[-2.75,-2.7],[2.75,-2.7],[-2.75,2.7],[2.75,2.7]]){
    const w=new THREE.Mesh(new THREE.CylinderGeometry(1.02,1.02,.72,16),wheelMat);
    w.rotation.z=Math.PI/2;w.position.set(x,1.05,z);group.add(w);wheels.push(w);
  }

  const doorTex=brandTexture("RICHMACK");
  for(const side of [-1,1]){
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(5.6,1.35),new THREE.MeshBasicMaterial({map:doorTex}));
    sign.position.set(side*2.76,2.1,.25);sign.rotation.y=side===1?Math.PI/2:-Math.PI/2;group.add(sign);
  }

  const hoodBrand=new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.2),new THREE.MeshBasicMaterial({map:brandTexture("THE FOREST")}));
  hoodBrand.position.set(0,3.02,-3.15);hoodBrand.rotation.x=-Math.PI/2;group.add(hoodBrand);

  const underglow=new THREE.Mesh(
    new THREE.CircleGeometry(3.7,24),
    new THREE.MeshBasicMaterial({color:0x9f35d4,transparent:true,opacity:.24,depthWrite:false})
  );
  underglow.rotation.x=-Math.PI/2;
  underglow.position.y=.18;
  group.add(underglow);

  const headlights=[];
  for(const x of [-1.35,1.35]){
    const light=new THREE.SpotLight(0xfff2c3,7,95,.36,.35,1.4);
    light.position.set(x,2.7,-4.2);light.target.position.set(x,0,-35);group.add(light,light.target);headlights.push(light);
  }

  group.position.set(-1120,vehicleGroundHeight(-1120,-1040,.55)+0.62,-1040);
  scene.add(group);

  return {
    group,body,wheels,headlights,
    speed:0,
    heading:.55,
    verticalVelocity:0,
    airborne:false,
    fuel:100,
    health:100,
    damage:0,
    ammo:48
  };
}

export function resetVehicle(v){
  v.group.position.set(-1120,vehicleGroundHeight(-1120,-1040,.55)+0.62,-1040);
  v.heading=.55;v.speed=0;v.verticalVelocity=0;v.airborne=false;
  v.fuel=100;v.health=100;v.damage=0;v.ammo=48;
}

export function updateVehicle(v,keys,dt,worldSize){
  const forward=keys["KeyW"]||keys["ArrowUp"];
  const reverse=keys["KeyS"]||keys["ArrowDown"];
  const left=keys["KeyA"]||keys["ArrowLeft"];
  const right=keys["KeyD"]||keys["ArrowRight"];
  const brake=keys["ShiftLeft"]||keys["ShiftRight"];

  if(forward&&v.fuel>0)v.speed+=44*dt;
  if(reverse&&v.fuel>0)v.speed-=27*dt;
  if(!forward&&!reverse)v.speed*=Math.pow(.994,dt*60);
  if(brake)v.speed*=Math.pow(.91,dt*60);

  v.speed=Math.max(-28,Math.min(78*(1-v.damage*.0028),v.speed));
  const steer=(left?1:0)+(right?-1:0);
  const grip=Math.min(1,Math.abs(v.speed)/8);
  v.heading+=steer*1.55*grip*dt*(v.speed>=0?1:-1);

  const fwd=new THREE.Vector3(Math.sin(v.heading),0,Math.cos(v.heading));
  v.group.position.addScaledVector(fwd,-v.speed*dt);

  const groundY=vehicleGroundHeight(v.group.position.x,v.group.position.z,v.heading)+0.62;
  if(v.airborne){
    v.verticalVelocity-=18*dt;
    v.group.position.y+=v.verticalVelocity*dt;
    if(v.group.position.y<=groundY){
      v.group.position.y=groundY;
      v.airborne=false;
      if(v.verticalVelocity<-10){
        v.damage=Math.min(100,v.damage+Math.abs(v.verticalVelocity)*.35);
        v.health=Math.max(0,v.health-Math.abs(v.verticalVelocity)*.18);
      }
      v.verticalVelocity=0;
    }
  }else{
    v.group.position.y+=(groundY-v.group.position.y)*Math.min(1,dt*18);
  }

  // Hard anti-sinking guard. The vehicle origin can never remain below
  // the sampled road/terrain clearance, even after collisions or lag spikes.
  if(v.group.position.y<groundY){
    v.group.position.y=groundY;
    v.verticalVelocity=Math.max(0,v.verticalVelocity);
    v.airborne=false;
  }

  // Keep the full vehicle upright. Rotating the whole group on uneven
  // terrain could pivot the car body through the road surface.
  v.group.rotation.set(0,v.heading,0);

  // Only the body receives a small visual steering lean.
  v.body.rotation.x=0;
  v.body.rotation.z=-steer*Math.min(.08,Math.abs(v.speed)*.003);
  v.wheels.forEach(w=>w.rotation.x-=v.speed*dt*1.15);

  if(Math.abs(v.speed)>2)v.fuel=Math.max(0,v.fuel-Math.abs(v.speed)*dt*.0048);
  const limit=worldSize/2-14;
  v.group.position.x=Math.max(-limit,Math.min(limit,v.group.position.x));
  v.group.position.z=Math.max(-limit,Math.min(limit,v.group.position.z));
}
