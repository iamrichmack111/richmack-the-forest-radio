
import {NIGHT_EVENTS} from "./config.js";

export class NightEventManager{
  constructor(enemyManager,onMessage){
    this.enemyManager=enemyManager;
    this.onMessage=onMessage;
    this.cooldown=42;
    this.active=null;
    this.remaining=0;
  }

  update(dt,player){
    if(this.active){
      this.remaining-=dt;
      if(this.remaining<=0){
        this.onMessage(`${this.active.name.toUpperCase()} ENDED`);
        this.active=null;
        this.enemyManager.setEventModifiers(0,1);
        this.cooldown=45+Math.random()*35;
      }
      return;
    }

    this.cooldown-=dt;
    if(this.cooldown<=0){
      this.active=NIGHT_EVENTS[Math.floor(Math.random()*NIGHT_EVENTS.length)];
      this.remaining=this.active.duration;
      const power=this.active.name==="Blood Moon"?1.65:1;
      this.enemyManager.setEventModifiers(this.active.spawnBonus,power);
      this.enemyManager.activateAround(player,12+this.active.spawnBonus);
      this.onMessage(this.active.message);
    }
  }
}
