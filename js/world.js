
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js";
import {WORLD_SIZE} from "./config.js";

export function terrainHeight(x,z){
  return Math.sin(x*.009)*5 + Math.cos(z*.007)*4 + Math.sin((x+z)*.004)*3;
}

export function createTerrain(scene,quality){
  const geo=new THREE.PlaneGeometry(WORLD_SIZE,WORLD_SIZE,quality.terrainSegments,quality.terrainSegments);
  geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++) pos.setY(i,terrainHeight(pos.getX(i),pos.getZ(i)));
  geo.computeVertexNormals();
  const mat=new THREE.MeshStandardMaterial({color:0x203024,roughness:1});
  const mesh=new THREE.Mesh(geo,mat);
  mesh.receiveShadow=quality.shadows;
  scene.add(mesh);
  return mesh;
}

export function createRoads(scene){
  const roadMat=new THREE.MeshStandardMaterial({color:0x4d4448,roughness:1});
  const paths=[
    [[-1150,-1080],[-850,-760],[-500,-850],[-120,-540],[350,-260],[820,160],[1120,620],[680,1040],[50,1120],[-620,860],[-1080,340],[-1150,-1080]],
    [[-1200,0],[0,0],[1200,0]],
    [[0,-1200],[0,0],[0,1200]],
    [[-920,650],[-350,420],[300,520],[940,780]],
    [[-860,-500],[-260,-180],[360,-460],[930,-700]]
  ];
  for(const path of paths){
    for(let i=0;i<path.length-1;i++){
      const [ax,az]=path[i],[bx,bz]=path[i+1];
      const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);
      const x=(ax+bx)/2,z=(az+bz)/2;
      const m=new THREE.Mesh(new THREE.BoxGeometry(22,.28,len+1),roadMat);
      m.position.set(x,terrainHeight(x,z)+.08,z);
      m.rotation.y=Math.atan2(dx,dz);
      m.receiveShadow=true;
      scene.add(m);
    }
  }
}

function createTreeGeometry(){
  const trunk=new THREE.CylinderGeometry(.65,.95,7,6);
  trunk.translate(0,3.5,0);
  const crown=new THREE.ConeGeometry(4.1,11,7);
  crown.translate(0,10.5,0);
  return {trunk,crown};
}

export function createInstancedForest(scene,quality){
  const {trunk,crown}=createTreeGeometry();
  const trunkMat=new THREE.MeshStandardMaterial({color:0x38271c});
  const crownMat=new THREE.MeshStandardMaterial({color:0x132719});
  const trunks=new THREE.InstancedMesh(trunk,trunkMat,quality.treeCount);
  const crowns=new THREE.InstancedMesh(crown,crownMat,quality.treeCount);
  const dummy=new THREE.Object3D();
  const collisionTrees=[];

  for(let i=0;i<quality.treeCount;i++){
    let x,z;
    let attempts=0;

    do{
      x=(Math.random()-.5)*WORLD_SIZE*.95;
      z=(Math.random()-.5)*WORLD_SIZE*.95;
      attempts++;
    }while(
      attempts<25&&(
        Math.abs(x)<34||
        Math.abs(z)<34||
        Math.hypot(x+1120,z+1040)<55
      )
    );

    const s=.75+Math.random()*.75;
    dummy.position.set(x,terrainHeight(x,z),z);
    dummy.rotation.y=Math.random()*Math.PI*2;
    dummy.scale.set(s,s,s);
    dummy.updateMatrix();
    trunks.setMatrixAt(i,dummy.matrix);
    crowns.setMatrixAt(i,dummy.matrix);

    collisionTrees.push({
      x,z,
      radius:1.2+s*.75
    });
  }

  trunks.instanceMatrix.needsUpdate=true;
  crowns.instanceMatrix.needsUpdate=true;
  trunks.castShadow=quality.shadows;
  crowns.castShadow=quality.shadows;
  scene.add(trunks,crowns);
  return {trunks,crowns,collisionTrees};
}

export function createInstancedRocks(scene,quality){
  const geo=new THREE.DodecahedronGeometry(2.3,0);
  const mat=new THREE.MeshStandardMaterial({color:0x514d56});
  const rocks=new THREE.InstancedMesh(geo,mat,quality.rockCount);
  const dummy=new THREE.Object3D();
  for(let i=0;i<quality.rockCount;i++){
    const x=(Math.random()-.5)*WORLD_SIZE*.92;
    const z=(Math.random()-.5)*WORLD_SIZE*.92;
    const s=.6+Math.random()*1.7;
    dummy.position.set(x,terrainHeight(x,z)+s,z);
    dummy.rotation.set(Math.random(),Math.random(),Math.random());
    dummy.scale.set(s,s*.7,s);
    dummy.updateMatrix();
    rocks.setMatrixAt(i,dummy.matrix);
  }
  rocks.instanceMatrix.needsUpdate=true;
  rocks.castShadow=quality.shadows;
  scene.add(rocks);
  return rocks;
}

function makeSignTexture(text,subtext){
  const c=document.createElement("canvas");
  c.width=512;c.height=256;
  const x=c.getContext("2d");
  x.fillStyle="#1b1020";x.fillRect(0,0,c.width,c.height);
  x.strokeStyle="#b44cff";x.lineWidth=14;x.strokeRect(8,8,c.width-16,c.height-16);
  x.fillStyle="#f1eaff";x.textAlign="center";x.font="bold 50px Arial";x.fillText(text,256,105);
  x.fillStyle="#b44cff";x.font="bold 28px Arial";x.fillText(subtext,256,160);
  return new THREE.CanvasTexture(c);
}

export function createBranding(scene){
  const signs=[
    [-880,-720,0,"RICHMACK","FOREST TRAIL"],
    [540,-320,1.2,"RICHMACK RADIO","DRIVING THE NIGHT"],
    [900,620,-.8,"RICHMACK FUEL","SUPPLY CAMP"],
    [-640,780,.4,"BEN HILL TRAIL","PRESENTED BY RICHMACK"],
    [80,980,Math.PI,"THE FOREST","RICHMACK"],
  ];
  for(const [x,z,rot,title,sub] of signs){
    const group=new THREE.Group();
    const board=new THREE.Mesh(
      new THREE.BoxGeometry(14,6,.7),
      new THREE.MeshStandardMaterial({map:makeSignTexture(title,sub)})
    );
    board.position.y=6;
    const postMat=new THREE.MeshStandardMaterial({color:0x4a3322});
    for(const px of [-5,5]){
      const post=new THREE.Mesh(new THREE.BoxGeometry(.7,7,.7),postMat);
      post.position.set(px,3,0);
      group.add(post);
    }
    group.add(board);
    group.position.set(x,terrainHeight(x,z),z);
    group.rotation.y=rot;
    scene.add(group);
  }
}

export function createTorches(scene,quality){
  const torchPositions=[];
  for(let x=-1100;x<=1100;x+=95){torchPositions.push([x,-16]);torchPositions.push([x,16])}
  for(let z=-1100;z<=1100;z+=95){torchPositions.push([-16,z]);torchPositions.push([16,z])}
  for(let i=0;i<26;i++){
    const a=i/26*Math.PI*2;
    torchPositions.push([760+Math.cos(a)*100,-620+Math.sin(a)*100]);
  }

  const poleGeo=new THREE.CylinderGeometry(.15,.22,4,7);
  const flameGeo=new THREE.SphereGeometry(.36,7,7);
  const poles=new THREE.InstancedMesh(poleGeo,new THREE.MeshStandardMaterial({color:0x3a281d}),torchPositions.length);
  const flames=new THREE.InstancedMesh(flameGeo,new THREE.MeshBasicMaterial({color:0xff9d35}),torchPositions.length);
  const dummy=new THREE.Object3D();
  const lights=[];
  torchPositions.forEach(([x,z],i)=>{
    const y=terrainHeight(x,z);
    dummy.position.set(x,y+2,z);dummy.updateMatrix();poles.setMatrixAt(i,dummy.matrix);
    dummy.position.set(x,y+4.2,z);dummy.updateMatrix();flames.setMatrixAt(i,dummy.matrix);
    if(i<quality.activeTorchLights){
      const light=new THREE.PointLight(0xff8a2a,4.8,42,1.8);
      light.position.set(x,y+4.3,z);
      scene.add(light);
      lights.push(light);
    }
  });
  poles.instanceMatrix.needsUpdate=true;
  flames.instanceMatrix.needsUpdate=true;
  scene.add(poles,flames);
  return {positions:torchPositions,lights};
}

export function createLandmarks(scene){
  const graveMat=new THREE.MeshStandardMaterial({color:0x78727e});
  const graveGeo=new THREE.BoxGeometry(3.4,6,.9);
  const graves=new THREE.InstancedMesh(graveGeo,graveMat,48);
  const dummy=new THREE.Object3D();
  for(let i=0;i<48;i++){
    const x=-760+(i%8)*14,z=540+Math.floor(i/8)*18;
    dummy.position.set(x,terrainHeight(x,z)+3,z);
    dummy.rotation.y=(Math.random()-.5)*.25;
    dummy.updateMatrix();graves.setMatrixAt(i,dummy.matrix);
  }
  graves.instanceMatrix.needsUpdate=true;scene.add(graves);

  const tower=new THREE.Mesh(
    new THREE.CylinderGeometry(12,18,55,10),
    new THREE.MeshStandardMaterial({color:0x2f2537})
  );
  tower.position.set(760,terrainHeight(760,-620)+27,-620);
  scene.add(tower);

  const camp=new THREE.Mesh(
    new THREE.BoxGeometry(34,10,22),
    new THREE.MeshStandardMaterial({color:0x393021})
  );
  camp.position.set(910,terrainHeight(910,600)+5,600);
  scene.add(camp);
}


export function createRangerStations(scene){
  const stations=[
    [-980,-920],
    [0,160],
    [870,720]
  ];
  const results=[];
  for(const [x,z] of stations){
    const group=new THREE.Group();
    const base=new THREE.Mesh(
      new THREE.BoxGeometry(24,9,16),
      new THREE.MeshStandardMaterial({color:0x3a2b44})
    );
    base.position.y=4.5;group.add(base);

    const roof=new THREE.Mesh(
      new THREE.ConeGeometry(16,7,4),
      new THREE.MeshStandardMaterial({color:0x1f1326})
    );
    roof.position.y=12;roof.rotation.y=Math.PI/4;group.add(roof);

    const sign=new THREE.Mesh(
      new THREE.PlaneGeometry(15,3),
      new THREE.MeshBasicMaterial({color:0xb44cff,side:THREE.DoubleSide})
    );
    sign.position.set(0,8.5,-8.05);group.add(sign);

    const beacon=new THREE.PointLight(0xb44cff,4,80,2);
    beacon.position.set(0,14,0);group.add(beacon);

    group.position.set(x,terrainHeight(x,z),z);
    scene.add(group);
    results.push({x,z,group});
  }
  return results;
}


export function checkTreeCollision(position,trees,vehicleRadius=3.1){
  let nearest=null;
  let nearestDistance=Infinity;

  for(const tree of trees){
    const dx=position.x-tree.x;
    const dz=position.z-tree.z;
    const distance=Math.hypot(dx,dz);
    const minDistance=vehicleRadius+tree.radius;

    if(distance<minDistance&&distance<nearestDistance){
      nearestDistance=distance;
      nearest={tree,dx,dz,distance,minDistance};
    }
  }

  return nearest;
}
