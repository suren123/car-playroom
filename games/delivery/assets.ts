import {preparedResource} from '../../lib/game-resources';
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

// The entry gate has already downloaded and decoded every game illustration.
export function preloadIllustrations(ids:IllustrationId[]):Promise<void>{
 if(typeof window==='undefined')return Promise.resolve();
 return ids.every(id=>preparedResource(illustrationUrl(id))?.image)
  ?Promise.resolve():Promise.reject(new Error('Game illustration is not prepared'));
}
