
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js";
import {terrainHeight} from "./world.js";
import {WORLD_SIZE,ENEMY_SPAWN} from "./config.js";

const TYPES = {
  vampire:{hp:2,speed:10,damage:7,reward:200,color:0x35102f,head:0xcbb2b2},
  witch:{hp:3,speed:7,damage:10,reward:300,color:0x17391e,head:0x8baa77},
  wolf:{hp:2,speed:14,damage:6,reward:180,color:0x3b3b42,head:0x555560},
  skeleton:{hp:2,speed:8,damage:8,reward:220,color:0xd5d1ba,head:0xe5e0c9},
  ghost:{hp:3,speed:9,damage:9,reward:260,color:0x7eb8c7,head:0xbcecff},
  boss:{hp:18,speed:6,damage:18,reward:2200,color:0x5a0b0b,head:0xff4f4f}
};

function makeEnemy(type,quality){
  const cfg=TYPES[type];
  const g=new THREE.Group();
  const scale=type==="boss"?2.2:(type==="wolf"?.78:1);

  if(type==="wolf"){
    const body=new THREE.Mesh(
      new THREE.BoxGeometry(3.8,1.6,1.8),
      new THREE.MeshStandardMaterial({color:cfg.color})
    );
    body.position.y=1.2;
    const head=new THREE.Mesh(
      new THREE.BoxGeometry(1.4,1.4,1.3),
      new THREE.MeshStandardMaterial({color:cfg.head})
    );
    head.position.set(2.3,1.45,0);
    g.add(body,head);
  }else{
    const body=new THREE.Mesh(
      new THREE.CylinderGeometry(1.2,1.7,4,7),
      new THREE.MeshStandardMaterial({
        color:cfg.color,
        transparent:type==="ghost",
        opacity:type==="ghost"?.72:1
      })
    );
    body.position.y=2.2;
    const head=new THREE.Mesh(
      new THREE.SphereGeometry(1.05,10,10),
      new THREE.MeshStandardMaterial({
        color:cfg.head,
        emissive:type==="ghost"?0x1a4a55:0x000000
      })
    );
    head.position.y=5;
    g.add(body,head);

    if(type==="witch"){
      const hat=new THREE.Mesh(new THREE.ConeGeometry(1.8,3,9),new THREE.MeshStandardMaterial({color:0x131016}));
      hat.position.y=7;g.add(hat);
    }else if(type==="vampire"||type==="boss"){
      const cape=new THREE.Mesh(new THREE.ConeGeometry(2.2,5,9,1,true),new THREE.MeshStandardMaterial({color:0x170611,side:THREE.DoubleSide}));
      cape.position.set(0,2.7,.8);cape.rotation.x=Math.PI;g.add(cape);
    }else if(type==="skeleton"){
      for(let i=0;i<4;i++){
        const rib=new THREE.Mesh(new THREE.BoxGeometry(2.2,.18,.18),new THREE.MeshStandardMaterial({color:0xded9c4}));
        rib.position.set(0,1.8+i*.6,0);g.add(rib);
      }
    }
  }

  g.scale.setScalar(scale);
  g.visible=false;
  return {
    mesh:g,type,
    baseHp:cfg.hp,
    hp:cfg.hp,
    speed:cfg.speed,
    damage:cfg.damage,
    reward:cfg.reward,
    attack:0,
    active:false,
    patrolAngle:Math.random()*Math.PI*2,
    campId:null,
    isBoss:type==="boss"
  };
}

function randomType(){
  const r=Math.random();
  if(r<.28)return "vampire";
  if(r<.50)return "witch";
  if(r<.70)return "wolf";
  if(r<.87)return "skeleton";
  return "ghost";
}

export class EnemyManager{
  constructor(scene,quality){
    this.scene=scene;
    this.quality=quality;
    this.items=[];
    this.spawnTimer=0;
    this.eventBonus=0;
    this.eventPower=1;
    this.bossActive=false;

    const poolSize=Math.max(24,quality.enemyCount+10);
    for(let i=0;i<poolSize;i++){
      const e=makeEnemy(randomType(),quality);
      scene.add(e.mesh);
      this.items.push(e);
    }
    const boss=makeEnemy("boss",quality);
    scene.add(boss.mesh);
    this.items.push(boss);
  }

  setEventModifiers(spawnBonus=0,power=1){
    this.eventBonus=spawnBonus;
    this.eventPower=power;
  }

  activateAround(position,targetCount=ENEMY_SPAWN.targetActive){
    let attempts=0;
    while(this.count()<targetCount&&attempts<100){
      this.spawnOne(position);
      attempts++;
    }
  }

  spawnOne(position,opts={}){
    const type=opts.type||randomType();
    let e=this.items.find(x=>!x.active&&x.type===type);
    if(!e&&type!=="boss")e=this.items.find(x=>!x.active&&!x.isBoss);
    if(!e)return null;

    const a=opts.angle??Math.random()*Math.PI*2;
    const r=opts.distance??(ENEMY_SPAWN.spawnMinDistance+Math.random()*(ENEMY_SPAWN.spawnMaxDistance-ENEMY_SPAWN.spawnMinDistance));
    let x=position.x+Math.cos(a)*r;
    let z=position.z+Math.sin(a)*r;
    x=Math.max(-WORLD_SIZE/2+25,Math.min(WORLD_SIZE/2-25,x));
    z=Math.max(-WORLD_SIZE/2+25,Math.min(WORLD_SIZE/2-25,z));

    e.mesh.position.set(x,terrainHeight(x,z),z);
    e.active=true;
    e.mesh.visible=true;
    e.hp=e.baseHp*this.eventPower;
    e.attack=0;
    e.campId=opts.campId??null;
    e.patrolAngle=Math.random()*Math.PI*2;
    return e;
  }

  spawnBoss(position){
    if(this.bossActive)return null;
    const boss=this.items.find(x=>x.isBoss&&!x.active);
    if(!boss)return null;
    const a=Math.random()*Math.PI*2;
    const r=220;
    const x=position.x+Math.cos(a)*r;
    const z=position.z+Math.sin(a)*r;
    boss.mesh.position.set(x,terrainHeight(x,z),z);
    boss.active=true;boss.mesh.visible=true;boss.hp=boss.baseHp;
    boss.attack=0;boss.campId=null;
    this.bossActive=true;
    return boss;
  }

  maintainPopulation(position,dt){
    this.spawnTimer-=dt;
    const desired=Math.min(ENEMY_SPAWN.maxActive,ENEMY_SPAWN.targetActive+this.eventBonus);
    if(this.spawnTimer<=0&&this.count()<desired){
      this.spawnTimer=ENEMY_SPAWN.spawnInterval;
      this.spawnOne(position);
    }

    for(const e of this.items){
      if(!e.active||e.isBoss)continue;
      if(e.mesh.position.distanceTo(position)>ENEMY_SPAWN.despawnDistance){
        e.active=false;e.mesh.visible=false;e.campId=null;
      }
    }
  }

  update(target,dt,onAttack){
    for(const e of this.items){
      if(!e.active)continue;
      const dx=target.x-e.mesh.position.x;
      const dz=target.z-e.mesh.position.z;
      const d=Math.hypot(dx,dz);

      if(d<250){
        const chaseSpeed=e.speed*(e.isBoss?1.0:1.0);
        e.mesh.position.x+=dx/d*chaseSpeed*dt;
        e.mesh.position.z+=dz/d*chaseSpeed*dt;
        e.mesh.position.y=terrainHeight(e.mesh.position.x,e.mesh.position.z)+(e.type==="ghost"?2.2:0);
        e.mesh.lookAt(target.x,e.mesh.position.y,target.z);
      }else{
        e.patrolAngle+=dt*.35;
        e.mesh.position.x+=Math.cos(e.patrolAngle)*e.speed*.16*dt;
        e.mesh.position.z+=Math.sin(e.patrolAngle)*e.speed*.16*dt;
        e.mesh.position.y=terrainHeight(e.mesh.position.x,e.mesh.position.z)+(e.type==="ghost"?2.2:0);
      }

      e.attack-=dt;
      if(d<(e.isBoss?10:5.8)&&e.attack<=0){
        e.attack=e.isBoss?.8:1.15;
        onAttack(e);
      }
    }
  }

  hitTest(position){
    for(const e of this.items){
      if(!e.active)continue;

      const dx=position.x-e.mesh.position.x;
      const dz=position.z-e.mesh.position.z;
      const horizontal=Math.hypot(dx,dz);

      const centerY=e.mesh.position.y+
        (e.isBoss?6:
        e.type==="ghost"?4.2:
        e.type==="wolf"?1.5:3.2);

      const vertical=Math.abs(position.y-centerY);

      const radius=e.isBoss?6.2:
        e.type==="ghost"?3.8:
        e.type==="wolf"?3.2:3.0;

      const height=e.isBoss?8:
        e.type==="ghost"?6:
        e.type==="wolf"?3.5:5.5;

      if(horizontal<radius&&vertical<height)return e;
    }
    return null;
  }

  collideWithVehicle(vehiclePosition,vehicleSpeed,onCollision){
    const collisions=[];
    for(const e of this.items){
      if(!e.active)continue;

      const dx=vehiclePosition.x-e.mesh.position.x;
      const dz=vehiclePosition.z-e.mesh.position.z;
      const distance=Math.hypot(dx,dz);
      const radius=e.isBoss?8.5:e.type==="wolf"?5.0:4.7;

      if(distance<radius){
        const impact=Math.max(1,Math.abs(vehicleSpeed));
        const nx=distance>0?dx/distance:1;
        const nz=distance>0?dz/distance:0;

        e.mesh.position.x-=nx*(e.isBoss?1.2:3.2);
        e.mesh.position.z-=nz*(e.isBoss?1.2:3.2);
        e.mesh.position.y=terrainHeight(e.mesh.position.x,e.mesh.position.z)+(e.type==="ghost"?2.2:0);

        collisions.push({
          enemy:e,
          impact,
          damage:e.isBoss?15:Math.min(12,3+impact*.09)
        });
      }
    }

    for(const collision of collisions)onCollision(collision);
    return collisions.length;
  }

  damage(e,amount){
    e.hp-=amount;
    if(e.hp<=0){
      const result={
        killed:true,
        type:e.type,
        reward:e.reward,
        campId:e.campId,
        boss:e.isBoss
      };
      e.active=false;e.mesh.visible=false;e.campId=null;
      if(e.isBoss)this.bossActive=false;
      return result;
    }
    return {killed:false};
  }

  count(){
    return this.items.filter(x=>x.active&&!x.isBoss).length;
  }

  totalCount(){
    return this.items.filter(x=>x.active).length;
  }
}
