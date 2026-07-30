import {PLAYLIST} from "./playlist.js";

export class AudioManager{
  constructor(onChange=()=>{}){
    this.ctx=null;
    this.engine=null;
    this.engineGain=null;
    this.onChange=onChange;
    this.tracks=PLAYLIST;
    this.index=Math.min(Number(localStorage.getItem("richmackRadioTrack")||0),Math.max(0,PLAYLIST.length-1));
    this.shuffle=localStorage.getItem("richmackRadioShuffle")==="true";
    this.repeat=localStorage.getItem("richmackRadioRepeat")==="true";
    this.player=new Audio();
    this.player.preload="auto";
    this.player.setAttribute("playsinline", "");
    this.player.volume=Math.max(0,Math.min(1,Number(localStorage.getItem("richmackRadioVolume")||.72)));
    this.lastError="";
    this.player.addEventListener("ended",()=>this.repeat?this.playCurrent():this.next());
    this.player.addEventListener("error",()=>{
      const code=this.player.error?.code||"unknown";
      this.lastError=`Audio error ${code}: ${this.player.currentSrc||this.player.src}`;
      console.error(this.lastError,this.player.error);
      this.notify();
    });
    ["play","pause","loadedmetadata","timeupdate","volumechange"].forEach(name=>
      this.player.addEventListener(name,()=>this.notify())
    );
    this.load(this.index,false);
  }
  ensure(){
    if(!this.ctx){
      this.ctx=new (window.AudioContext||window.webkitAudioContext)();
      this.engine=this.ctx.createOscillator();
      this.engineGain=this.ctx.createGain();
      this.engine.type="sawtooth";
      this.engine.frequency.value=55;
      this.engineGain.gain.value=.012;
      this.engine.connect(this.engineGain).connect(this.ctx.destination);
      this.engine.start();
    }
    if(this.ctx.state==="suspended")this.ctx.resume();
  }
  updateEngine(speed){
    if(!this.ctx)return;
    this.engine.frequency.setTargetAtTime(55+Math.abs(speed)*2.2,this.ctx.currentTime,.05);
  }
  load(index,autoplay=true){
    if(!this.tracks.length)return;
    this.index=(index+this.tracks.length)%this.tracks.length;
    this.player.src=new URL(this.tracks[this.index].file,document.baseURI).href;
    this.player.load();
    localStorage.setItem("richmackRadioTrack",String(this.index));
    this.notify();
    if(autoplay)this.playCurrent();
  }
  async playCurrent(){
    if(!this.tracks.length)return false;
    try{
      this.lastError="";
      this.player.muted=false;
      if(this.player.volume===0)this.setVolume(.72);
      await this.player.play();
      this.notify();
      return true;
    }catch(error){
      this.lastError=error?.message||String(error);
      console.warn("Richmack Radio playback was blocked or failed:",error);
      this.notify();
      return false;
    }
  }
  toggle(){this.player.paused?this.playCurrent():this.player.pause()}
  next(){
    if(!this.tracks.length)return;
    const next=this.shuffle&&this.tracks.length>1
      ? this.randomDifferentIndex()
      : this.index+1;
    this.load(next,true);
  }
  previous(){
    if(this.player.currentTime>4){this.player.currentTime=0;return}
    this.load(this.index-1,true);
  }
  randomDifferentIndex(){
    let candidate=this.index;
    while(candidate===this.index)candidate=Math.floor(Math.random()*this.tracks.length);
    return candidate;
  }
  setVolume(value){
    this.player.volume=Math.max(0,Math.min(1,Number(value)));
    localStorage.setItem("richmackRadioVolume",String(this.player.volume));
    this.notify();
  }
  seek(value){
    if(Number.isFinite(this.player.duration))this.player.currentTime=this.player.duration*Number(value);
  }
  toggleShuffle(){
    this.shuffle=!this.shuffle;
    localStorage.setItem("richmackRadioShuffle",String(this.shuffle));
    this.notify();
  }
  toggleRepeat(){
    this.repeat=!this.repeat;
    localStorage.setItem("richmackRadioRepeat",String(this.repeat));
    this.notify();
  }
  get state(){
    return {
      title:this.tracks[this.index]?.title||"Radio Off",
      index:this.index,
      count:this.tracks.length,
      playing:!this.player.paused,
      current:this.player.currentTime||0,
      duration:Number.isFinite(this.player.duration)?this.player.duration:0,
      volume:this.player.volume,
      shuffle:this.shuffle,
      repeat:this.repeat,
      error:this.lastError
    };
  }
  get station(){return this.state.title}
  notify(){this.onChange(this.state)}
}
