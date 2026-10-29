import audioManifest from './audio-manifest.json';
import deliveryVoice from './delivery-voice.json';
import effects from './effects-manifest.json';
import {gameAudioContext} from './audio-context';
import {hasActiveResources,preparedResource} from './game-resources';
import {normalizeSpeechText as normalize} from './speech-text';
import {cargoSpeechKeys,routeSpeechKeys,orderSpeechKeys,joinSpeechWav} from './delivery-speech';

type Settings={muted:boolean;voice:boolean;effects:boolean};
type AudioStatus='ready'|'loading'|'blocked'|'missing'|'failed';
const defaultSettings:Settings={muted:false,voice:true,effects:true};
const settingsKey='car-playroom-audio-v2';
let volatileSettings:Settings={...defaultSettings};
const audioByText=new Map(Object.values(audioManifest).map(clip=>[normalize(clip.text),`/audio/${clip.file}`]));
for(const clip of Object.values(deliveryVoice))audioByText.set(normalize(clip.text),clip.file);
let player:HTMLAudioElement|null=null;
let context:AudioContext|null=null;
let playbackId=0;
let temporaryVoiceUrl:string|null=null;
const activeSources=new Set<AudioBufferSourceNode>();
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
 if(temporaryVoiceUrl){URL.revokeObjectURL(temporaryVoiceUrl);temporaryVoiceUrl=null;}
}
export function stopSpeech(){
 stopVoice();
 stopEffects();
}
function stopEffects(){
 for(const source of activeSources){try{source.stop();}catch{/* Already ended. */}}activeSources.clear();
}
function playSource(source:string|undefined,enabled=true,temporary=false){
 if(typeof window==='undefined')return;
 if(!enabled||getAudioSettings().muted||!getAudioSettings().voice){if(temporary&&source)URL.revokeObjectURL(source);stopVoice();return;}
 stopVoice();if(!source){status('missing');return;}
 const prepared=preparedResource(source);
 if(hasActiveResources()&&!prepared&&!temporary){status('missing');return;}
 if(temporary)temporaryVoiceUrl=source;
 const id=playbackId,audio=audioPlayer();audio.src=prepared?.src??source;audio.volume=1;status('loading');
 audio.onended=()=>{if(playbackId===id){stopVoice();status('ready');}};
 audio.onerror=()=>{if(playbackId===id){stopVoice();status('failed');}};
 void audio.play().then(()=>{if(playbackId===id)status('ready');}).catch(()=>{if(playbackId===id)status('blocked');});
}
export function speakGently(text:string,enabled=true){playSource(audioByText.get(normalize(text)),enabled);}
export function speakDelivery(id:keyof typeof deliveryVoice){playSource(deliveryVoice[id]?.file);}
function speakFragments(keys:string[]){
 if(typeof window==='undefined')return;
 stopVoice();
 if(getAudioSettings().muted||!getAudioSettings().voice)return;
 const manifest=deliveryVoice as Record<string,{file:string}>;
 const clips=keys.map(key=>preparedResource(manifest[key]?.file??'')?.audio);
 if(!keys.length||clips.some(clip=>!clip)){status('missing');return;}
 try{const wav=joinSpeechWav(clips as AudioBuffer[]);playSource(URL.createObjectURL(new Blob([wav],{type:'audio/wav'})),true,true);}
 catch{status('failed');}
}
export function speakCargo(cargo:string[]){speakFragments(cargoSpeechKeys(cargo));}
export function speakRoute(stops:string[]){speakFragments(routeSpeechKeys(stops));}
export function speakOrder(cargo:string[],stops:string[]){speakFragments(orderSpeechKeys(cargo,stops));}
export function prepareAudio(){
 if(typeof window==='undefined')return;
 try{
  context=gameAudioContext();if(context.state==='suspended')void context.resume().catch(()=>status('blocked'));
 }catch{status('blocked');}
}
export function playEffect(id:keyof typeof effects){
 const effectsBuffer=preparedResource('/audio/effects.wav')?.audio;
 if(!context||!effectsBuffer||getAudioSettings().muted||!getAudioSettings().effects)return;
 const clip=effects[id],source=context.createBufferSource(),gain=context.createGain();source.buffer=effectsBuffer;gain.gain.value=.55;source.connect(gain).connect(context.destination);activeSources.add(source);source.onended=()=>activeSources.delete(source);source.start(0,clip.start,clip.duration);
}
