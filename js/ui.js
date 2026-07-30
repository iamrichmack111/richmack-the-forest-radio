
export function setupInstructionPages(){
  let page=0;
  const pages=[...document.querySelectorAll(".instruction-page")];
  const label=document.getElementById("pageLabel");
  const render=()=>{
    pages.forEach((p,i)=>p.classList.toggle("active",i===page));
    label.textContent=`${page+1} / ${pages.length}`;
  };
  document.getElementById("prevHelp").addEventListener("click",()=>{page=(page-1+pages.length)%pages.length;render()});
  document.getElementById("nextHelp").addEventListener("click",()=>{page=(page+1)%pages.length;render()});
  render();
}

export function bindHoldButton(id,keys,code){
  const el=document.getElementById(id);
  const down=e=>{e.preventDefault();keys[code]=true;el.classList.add("active")};
  const up=e=>{e.preventDefault();keys[code]=false;el.classList.remove("active")};
  ["pointerdown","touchstart"].forEach(ev=>el.addEventListener(ev,down,{passive:false}));
  ["pointerup","pointercancel","pointerleave","touchend"].forEach(ev=>el.addEventListener(ev,up,{passive:false}));
}

export function showGameUI(show){
  document.getElementById("hud").style.display=show?"block":"none";
  document.getElementById("topButtons").style.display=show?"flex":"none";
  document.getElementById("touchControls").style.display=show?"block":"none";
}

export function updateHUD(state){
  const pct=v=>`${Math.max(0,Math.min(100,v))}%`;
  document.getElementById("healthBar").style.width=pct(state.health);
  document.getElementById("fuelBar").style.width=pct(state.fuel);
  document.getElementById("damageBar").style.width=pct(state.damage);
  document.getElementById("ammo").textContent=state.ammo;
  document.getElementById("money").textContent=`$${state.money}`;
  document.getElementById("speed").textContent=`${Math.round(Math.abs(state.speed)*2.2)} MPH`;
  document.getElementById("score").textContent=state.score;
  document.getElementById("enemyCount").textContent=state.enemies;
  document.getElementById("radioStation").textContent=state.radio;
  document.getElementById("qualityLabel").textContent=state.quality;
  if(state.mission){
    document.getElementById("missionName").textContent=state.mission.name;
    document.getElementById("missionText").textContent=state.mission.text;
    document.getElementById("missionProgress").textContent=`${state.progress} / ${state.mission.goal}`;
  }else{
    document.getElementById("missionName").textContent="FOREST COMPLETE";
    document.getElementById("missionText").textContent="All Richmack missions finished.";
    document.getElementById("missionProgress").textContent="";
  }
}

let messageTimer;
export function flash(text,ms=1200){
  const el=document.getElementById("message");
  el.textContent=text;
  clearTimeout(messageTimer);
  messageTimer=setTimeout(()=>el.textContent="",ms);
}
