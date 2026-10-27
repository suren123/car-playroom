import audioManifest from './audio-manifest.json';
import deliveryVoice from './delivery-voice.json';
import effects from './effects-manifest.json';

type Settings={muted:boolean;voice:boolean;effects:boolean};
type AudioStatus='ready'|'loading'|'blocked'|'missing'|'failed';
const defaultSettings:Settings={muted:false,voice:true,effects:true};
const settingsKey='car-playroom-audio-v2';
let volatileSettings:Settings={...defaultSettings};
const normalize=(text:string)=>text.replace(/[\s，。！？、：；“”‘’"']/g,'');
const audioByText=new Map(Object.values(audioManifest).map(clip=>[normalize(clip.text),`/audio/${clip.file}`]));
for(const clip of Object.values(deliveryVoice))audioByText.set(normalize(clip.text),clip.file);
let player:HTMLAudioElement|null=null;
let context:AudioContext|null=null;
let effectsBuffer:AudioBuffer|null=null;
let loadingEffects:Promise<void>|null=null;
let playbackId=0;
const activeSources=new Set<AudioBufferSourceNode>();
const prefetched=new Set<string>();
let audioStatus:AudioStatus='ready';
const emit=(name:string)=>{if(typeof window!=='undefined')window.dispatchEvent(new Event(name));};
function status(value:AudioStatus){audioStatus=value;emit('car-audio-status');}
export function getAudioStatus(){return audioStatus;}
export function getAudioSettings():Settings{
 if(typeof window==='undefined')return defaultSettings;
 try{return {...volatileSettings,...JSON.parse(localStorage.getItem(settingsKey)||'{}')};}catch{return volatileSettings;}
}
export function setAudioSettings(change:Partial<Settings>){
 const next={...getAudioSettings(),...change};volatileSettings=next;try{localStorage.setItem(settingsKey,JSON.stringify(next));}catch{/* Keep in-memory settings. */}
 if(next.muted)stopSpeech();else{if(!next.voice)stopVoice();if(!next.effects)stopEffects();}emit('car-audio-settings');
}
function audioPlayer(){if(player)return player;player=document.getElementById('game-prompt-audio') as HTMLAudioElement|null;if(player)return player;player=document.createElement('audio');player.id='game-prompt-audio';player.preload='auto';player.setAttribute('playsinline','');player.setAttribute('aria-hidden','true');player.style.display='none';document.body.appendChild(player);return player;}
function stopVoice(){
 playbackId++;player?.pause();if(player){try{player.currentTime=0;}catch{/* Metadata may not have loaded yet. */}player.removeAttribute('src');player.load();}
}
export function stopSpeech(){
 stopVoice();
 stopEffects();
}
function stopEffects(){
 for(const source of activeSources){try{source.stop();}catch{/* Already ended. */}}activeSources.clear();
}
function playSource(source:string|undefined,enabled=true){
 if(typeof window==='undefined')return;
 if(!enabled||getAudioSettings().muted||!getAudioSettings().voice){stopVoice();return;}
 stopVoice();if(!source){status('missing');return;}
 const id=playbackId,audio=audioPlayer();audio.src=source;audio.volume=1;status('loading');
 audio.onended=()=>{if(playbackId===id){audio.removeAttribute('src');audio.load();status('ready');}};
 audio.onerror=()=>{if(playbackId===id)status('failed');};
 void audio.play().then(()=>{if(playbackId===id)status('ready');}).catch(()=>{if(playbackId===id)status('blocked');});
}
export function speakGently(text:string,enabled=true){playSource(audioByText.get(normalize(text)),enabled);}
export function speakDelivery(id:keyof typeof deliveryVoice){playSource(deliveryVoice[id]?.file);}
const cargoKey=(cargo:string[])=>'cargo_'+[...cargo].sort().join('_');
export function speakCargo(cargo:string[]){playSource((deliveryVoice as Record<string,{file:string}>)[cargoKey(cargo)]?.file);}
function prefetch(file:string){if(typeof document==='undefined'||prefetched.has(file))return;prefetched.add(file);const link=document.createElement('link');link.rel='prefetch';link.href=file;document.head.appendChild(link);}
export function preloadCargo(cargo:string[]){const clip=(deliveryVoice as Record<string,{file:string}>)[cargoKey(cargo)];if(clip)prefetch(clip.file);}
export function preloadDelivery(ids:(keyof typeof deliveryVoice)[]){for(const id of ids)prefetch(deliveryVoice[id].file);}
export function prepareAudio(){
 if(typeof window==='undefined')return;
 try{
  context??=new AudioContext();if(context.state==='suspended')void context.resume();
  if(!effectsBuffer&&!loadingEffects){const ctx=context;loadingEffects=fetch('/audio/effects.wav').then(r=>{if(!r.ok)throw new Error('audio');return r.arrayBuffer();}).then(data=>ctx.decodeAudioData(data)).then(buffer=>{effectsBuffer=buffer;}).catch(()=>{status('failed');}).finally(()=>{loadingEffects=null;});}
 }catch{status('blocked');}
}
export function playEffect(id:keyof typeof effects){
 if(!context||!effectsBuffer||getAudioSettings().muted||!getAudioSettings().effects)return;
 const clip=effects[id],source=context.createBufferSource(),gain=context.createGain();source.buffer=effectsBuffer;gain.gain.value=.55;source.connect(gain).connect(context.destination);activeSources.add(source);source.onended=()=>activeSources.delete(source);source.start(0,clip.start,clip.duration);
}
