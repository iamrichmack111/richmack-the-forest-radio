
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js";
import {terrainHeight} from "./world.js";

const CAMP_POSITIONS=[
  [-760,560],
  [760,-620],
  [900,610],
  [-500,-820],
  [420,500]
];

export class CampManager{
  constructor(scene,enemyManager){
    this.scene=scene;
    this.enemyManager=enemyManager;
    this.camps=[];
    this.nextId=1;

    for(const [x,z] of CAMP_POSITIONS)this.createCamp(x,z);
  }

  createCamp(x,z){
    const id=this.nextId++;
    const group=new THREE.Group();

    const fire=new THREE.Mesh(
      new THREE.ConeGeometry(1.4,3.4,8),
      new THREE.MeshStandardMaterial({color:0xff7a24,emissive:0x8a2100})
    );
    fire.position.y=1.7;group.add(fire);

    const ringMat=new THREE.MeshStandardMaterial({color:0x4e4a50});
    for(let i=0;i<10;i++){
      const a=i/10*Math.PI*2;
      const stone=new THREE.Mesh(new THREE.DodecahedronGeometry(.8,0),ringMat);
      stone.position.set(Math.cos(a)*3,.45,Math.sin(a)*3);
      group.add(stone);
    }

    const banner=new THREE.Mesh(
      new THREE.PlaneGeometry(7,2.2),
      new THREE.MeshBasicMaterial({color:0x6e1da5,side:THREE.DoubleSide})
    );
    banner.position.set(0,4,-4);group.add(banner);

    group.position.set(x,terrainHeight(x,z),z);
    this.scene.add(group);

    const camp={id,x,z,group,cleared:false,spawned:false,remaining:0};
    this.camps.push(camp);
  }

  update(player){
    for(const camp of this.camps){
      if(camp.cleared)continue;
      const d=Math.hypot(player.x-camp.x,player.z-camp.z);
      if(d<190&&!camp.spawned){
        camp.spawned=true;
        camp.remaining=5;
        for(let i=0;i<5;i++){
          const angle=i/5*Math.PI*2;
          this.enemyManager.spawnOne({x:camp.x,y:0,z:camp.z},{
            angle,
            distance:18+Math.random()*20,
            campId:camp.id
          });
        }
      }
    }
  }

  registerKill(campId){
    if(campId==null)return null;
    const camp=this.camps.find(c=>c.id===campId);
    if(!camp||camp.cleared)return null;
    camp.remaining=Math.max(0,camp.remaining-1);
    if(camp.remaining===0){
      camp.cleared=true;
      camp.group.children.forEach(obj=>{
        if(obj.material&&obj.material.color)obj.material.color.setHex(0x2f8f5b);
      });
      return camp;
    }
    return null;
  }
}
