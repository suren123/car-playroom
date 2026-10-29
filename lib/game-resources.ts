import manifest from './game-resources.generated.json';
import type {GameId} from '../games/registry';
import {ResourceSession,type GameResource,type PreparedResource} from './resource-loader';
import {gameAudioContext} from './audio-context';

export const RESOURCE_CACHE='car-playroom-resources-v1';
let active:ResourceSession|null=null;
export function gameResourceList(game:GameId):GameResource[]{return manifest.games[game].map(url=>(manifest.assets as Record<string,GameResource>)[url]);}
export function activateResources(session:ResourceSession){active=session;}
export function deactivateResources(session:ResourceSession){if(active===session)active=null;}
export function preparedResource(url:string){return active?.prepared.get(url);}
export function hasActiveResources(){return active!==null;}
export function createGameResources(game:GameId){return new ResourceSession(gameResourceList(game),{
 fetch:(url,options)=>fetch(url,options),
 cache:async()=>typeof caches==='undefined'?null:await caches.open(RESOURCE_CACHE),
 verify:async(data,revision)=>{const hash=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')===revision;},
 prepare:async(item,blob,signal)=>{
  if(signal.aborted)throw new DOMException('Cancelled','AbortError');
  const src=URL.createObjectURL(blob);let image:HTMLImageElement|undefined;
  const release=()=>{image?.removeAttribute('src');URL.revokeObjectURL(src);};
  try{
   let audio:AudioBuffer|undefined;
   if(item.kind==='image'){image=new Image();image.src=src;await image.decode();if(!image.naturalWidth)throw Error('Empty image');}
   else{const decoded=await gameAudioContext().decodeAudioData(await blob.arrayBuffer());if(!decoded.length)throw Error('Empty audio');if(item.kind==='effect'||item.url.startsWith('/audio/delivery/segment_'))audio=decoded;}
   if(signal.aborted)throw new DOMException('Cancelled','AbortError');
   return {src,image,audio,release} satisfies PreparedResource;
  }catch(error){release();throw error;}
 }
});}
