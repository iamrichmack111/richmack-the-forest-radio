
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js";
import {MISSIONS} from "./config.js";
import {terrainHeight} from "./world.js";

export class MissionSystem{
  constructor(scene){
    this.scene=scene;
    this.index=0;
    this.progress=0;
    this.markers=[];
    const points=[[-880,-740],[-520,-840],[-80,-540],[350,-250],[820,160],[1090,610],[670,1020],[60,1110]];
    const mat=new THREE.MeshStandardMaterial({color:0x23d9ff,emissive:0x07515c});
    for(const [x,z] of points){
      const mesh=new THREE.Mesh(new THREE.TorusGeometry(8,.75,10,32),mat.clone());
      mesh.position.set(x,terrainHeight(x,z)+8,z);mesh.rotation.y=Math.PI/2;
      scene.add(mesh);this.markers.push({x,z,mesh,hit:false});
    }
    this.refreshMarkerVisibility();
  }
  get current(){return MISSIONS[this.index]}
  add(type,amount=1){
    if(this.current?.type===type)this.progress+=amount;
  }
  update(player,dt,onComplete){
    this.markers.forEach(m=>m.mesh.rotation.z+=dt*.35);
    if(this.current?.type==="checkpoints"){
      const m=this.markers[this.progress];
      if(m&&Math.hypot(player.x-m.x,player.z-m.z)<11){
        m.hit=true;m.mesh.visible=false;this.progress++;
      }
    }
    if(this.current&&this.progress>=this.current.goal){
      const done=this.current;
      this.index++;this.progress=0;
      this.markers.forEach(m=>{m.hit=false});
      this.refreshMarkerVisibility();
      onComplete(done);
    }
  }
  refreshMarkerVisibility(){
    const show=this.current?.type==="checkpoints";
    this.markers.forEach((m,i)=>m.mesh.visible=show&&!m.hit&&i>=this.progress);
  }
  reset(){
    this.index=0;this.progress=0;
    this.markers.forEach(m=>m.hit=false);
    this.refreshMarkerVisibility();
  }
}
