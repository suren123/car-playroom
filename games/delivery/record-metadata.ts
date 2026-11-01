import {choiceVersion} from './options.ts';
import type {State,ItemId,StopId} from './model.ts';

// Frozen v1 codebooks. Never reorder or append: a future catalog needs a new
// format. Compact history preserves seeded reproduction within the API's
// existing 500-character metadata limit, without storing a resumable board.
const cargoCodes:readonly ItemId[]=['bananas','watermelon','strawberry','pineapple','corn','pumpkin','bread','cake','cookies','basketball','football','kite','guitar','umbrella','rainBoots','clock','letters','extinguisher','shovel','broom','wheel','toolbox','hose','bucket','helmet','cone','sign','board','box','parcel','fuel','ladder','luggage','backpack','gift','toys','books','picnic','apples','vegetables','fish','milk','juice','oranges','eggs','flowers','hay','paint','firstAid','barrier'];
const stopCodes:readonly StopId[]=['postOffice','bakery','library','zoo','amusementPark','stadium','fire','work','shop','hospital','factory','home','school','police','gas','farm','greenhouse','parking','busStop','repair'];
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export function encodeDeliveryHistory(recent:readonly string[]):string[]{
 return recent.slice(-5).flatMap(signature=>{try{
  const [cargo,stops]=JSON.parse(signature);
  if(!Array.isArray(cargo)||!Array.isArray(stops)||cargo.length<1||cargo.length>2||stops.length<1||stops.length>2)return [];
  if(cargo.some(id=>!cargoCodes.includes(id))||stops.some(id=>!stopCodes.includes(id)))return [];
  return [cargo.map(id=>alphabet[cargoCodes.indexOf(id)]).join('')+'.'+stops.map(id=>alphabet[stopCodes.indexOf(id)]).join('')];
 }catch{return [];}});
}
export function decodeDeliveryHistory(value:unknown):string[]{
 if(!Array.isArray(value))return [];
 return value.slice(-5).flatMap(code=>{
  if(typeof code!=='string'||!/^\w{1,2}\.\w{1,2}$/.test(code))return [];
  const [a,b]=code.split('.'),cargo=[...a].map(c=>cargoCodes[alphabet.indexOf(c)]),stops=[...b].map(c=>stopCodes[alphabet.indexOf(c)]);
  if(cargo.some(id=>!id)||stops.some(id=>!id))return [];
  return [JSON.stringify([cargo,stops])];
 });
}
export function deliveryRecordParameters(state:State,recent:readonly string[]):string{
 return JSON.stringify({mode:state.level.mode,count:state.level.count,stops:state.level.stops,choiceVersion,choiceOptions:state.choiceOptions,resolvedChoices:state.choices,historyFormat:1,recent:encodeDeliveryHistory(recent)});
}
