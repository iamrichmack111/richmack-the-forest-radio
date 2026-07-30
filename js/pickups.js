
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js";
import {terrainHeight} from "./world.js";
import {WORLD_SIZE} from "./config.js";

export function createPickups(scene){
  const items=[];
  const defs=[
    ["relic",24,new THREE.OctahedronGeometry(1.7),0xa72cff],
    ["fuel",16,new THREE.BoxGeometry(2,3,1.2),0xc82b30],
    ["ammo",18,new THREE.BoxGeometry(2.4,1.2,1.7),0xe0b33e],
    ["repair",12,new THREE.BoxGeometry(2,2,2),0x35b65b]
  ];
  for(const [type,count,geo,color] of defs){
    const mat=new THREE.MeshStandardMaterial({color,emissive:new THREE.Color(color).multiplyScalar(.22)});
    for(let i=0;i<count;i++){
      const x=(Math.random()-.5)*WORLD_SIZE*.82,z=(Math.random()-.5)*WORLD_SIZE*.82;
      const mesh=new THREE.Mesh(geo,mat);
      mesh.position.set(x,terrainHeight(x,z)+2,z);
      scene.add(mesh);
      items.push({type,mesh,taken:false,x,z});
    }
  }
  return items;
}

export function updatePickups(items,player,dt,onCollect){
  for(const p of items){
    if(p.taken)continue;
    p.mesh.rotation.y+=dt*1.4;
    if(Math.hypot(player.x-p.x,player.z-p.z)<5){
      p.taken=true;p.mesh.visible=false;onCollect(p.type);
    }
  }
}
