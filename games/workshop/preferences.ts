import {allCars,editableCars,type Level,type WorkshopGame} from './model.ts';
import type {CarKind} from '../vehicle-catalog.ts';
export type WorkshopPreference={level:Level;car:CarKind};
export function parseWorkshopPreference(raw:unknown,game:WorkshopGame):WorkshopPreference{
 const value=raw&&typeof raw==='object'?raw as Partial<WorkshopPreference>:{};
 const cars=game==='repair'?editableCars:allCars;
 return {level:value.level===2||value.level===3?value.level:1,car:cars.includes(value.car as never)?value.car!:'fire'};
}
export const workshopPreferenceKey=(account:string,game:WorkshopGame)=>`car-workshop-preference-v1:${account}:${game}`;
export function readWorkshopPreference(account:string,game:WorkshopGame):WorkshopPreference{
 try{const raw=localStorage.getItem(workshopPreferenceKey(account,game));if(raw)return parseWorkshopPreference(JSON.parse(raw),game);
  const difficulty=localStorage.getItem(`car-playroom-difficulty:${account}:${game}`),car=localStorage.getItem(`car-playroom-queue-car:${account}`);
  return parseWorkshopPreference({level:difficulty==='challenge'?3:1,car},game);
 }catch{return {level:1,car:'fire'};}
}
export function saveWorkshopPreference(account:string,game:WorkshopGame,value:WorkshopPreference){try{localStorage.setItem(workshopPreferenceKey(account,game),JSON.stringify(value));}catch{window.dispatchEvent(new Event('car-storage-unavailable'));}}
