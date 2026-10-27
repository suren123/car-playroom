import {cargoIllustration,destinationIllustration,illustrationUrl,vehicleIllustration,type IllustrationId} from '../illustration-assets';
import type {CarKind} from '../vehicle-catalog';
import type {Task} from './model';

export const worldAssets:IllustrationId[]=['warehouse','roundTree','pineTree','cloud','doubleCloud','roundBush'];
export const welcomeAssets:IllustrationId[]=[...worldAssets,'delivery','parcel'];
export const levelAssets:IllustrationId[]=['parcel','helmet','bucket','toolbox'];
export const carAssets=Object.values(vehicleIllustration);
export function taskAssets(task:Task,car:CarKind):IllustrationId[]{
 return [...worldAssets,vehicleIllustration[car],...task.choices.map(id=>cargoIllustration[id]),...Object.values(destinationIllustration)];
}

// Keep decoded images alive for this visit. Failed requests can be retried.
const images=new Map<string,{image:HTMLImageElement;ready:Promise<void>}>();
export function preloadIllustrations(ids:IllustrationId[]):Promise<void>{
 if(typeof window==='undefined')return Promise.resolve();
 return Promise.all([...new Set(ids)].map(id=>{
  const url=illustrationUrl(id),existing=images.get(url);
  if(existing)return existing.ready;
  const image=new Image();
  const ready=new Promise<void>((resolve,reject)=>{
   let settled=false;
   const timeout=window.setTimeout(()=>finish(new Error('Image loading timed out')),12000);
   function finish(error?:Error){if(settled)return;settled=true;window.clearTimeout(timeout);image.onload=null;image.onerror=null;if(error){images.delete(url);reject(error);}else resolve();}
   image.onload=()=>{image.decode().then(()=>finish(),()=>finish());};
   image.onerror=()=>finish(new Error('Image unavailable'));
   image.src=url;
  });
  images.set(url,{image,ready});
  return ready;
 })).then(()=>undefined);
}
