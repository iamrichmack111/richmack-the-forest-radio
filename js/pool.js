
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js";

export class BulletPool{
  constructor(scene,size=40){
    this.scene=scene;
    this.items=[];
    const geo=new THREE.SphereGeometry(.25,7,7);
    const mat=new THREE.MeshBasicMaterial({color:0xfff05b});
    for(let i=0;i<size;i++){
      const mesh=new THREE.Mesh(geo,mat);
      mesh.visible=false;scene.add(mesh);
      this.items.push({mesh,active:false,life:0,dir:new THREE.Vector3()});
    }
  }
  spawn(position,dir){
    const item=this.items.find(x=>!x.active);
    if(!item)return null;
    item.active=true;item.life=2.2;item.dir.copy(dir);
    item.mesh.position.copy(position);item.mesh.visible=true;
    return item;
  }
  update(dt,onMove){
    for(const item of this.items){
      if(!item.active)continue;
      item.mesh.position.addScaledVector(item.dir,100*dt);
      item.life-=dt;
      if(onMove(item)===false||item.life<=0)this.release(item);
    }
  }
  release(item){
    item.active=false;item.mesh.visible=false;
  }
}
