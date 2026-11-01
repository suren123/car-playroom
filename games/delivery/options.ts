export type ExtraCount='auto'|number;
export type ChoiceOptions={cargoCount?:ExtraCount;destinationCount?:ExtraCount;extraCargo:ExtraCount;extraStops:ExtraCount};
export type ResolvedChoices={cargoCount:number;destinationCount:number;extraCargo:number;extraStops:number;cargoChoices:number;stopChoices:number;error:string|null};
export const choiceVersion=2;
export const defaultChoiceOptions:ChoiceOptions={cargoCount:'auto',destinationCount:'auto',extraCargo:'auto',extraStops:'auto'};
export const choiceLimits={extraCargo:8,extraStops:6} as const;
export const choicePresets=[
 {name:'轻松找',extraCargo:1,extraStops:1},
 {name:'仔细找',extraCargo:3,extraStops:2},
 {name:'小挑战',extraCargo:5,extraStops:4},
] as const;
const count=(value:unknown,max:number):ExtraCount=>typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<=max?value:'auto';
export function parseChoiceOptions(value:unknown):ChoiceOptions{
 const v=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const required=(value:unknown)=>typeof value==='number'&&value>=1?count(value,4):'auto';
 return {cargoCount:required(v.cargoCount),destinationCount:required(v.destinationCount),extraCargo:count(v.extraCargo,8),extraStops:count(v.extraStops,6)};
}
export function resolveChoices(level:{count:number;choices:number;stops:number;mode?:string},options:ChoiceOptions=defaultChoiceOptions):ResolvedChoices{
 const parsed=parseChoiceOptions(options);
 const cargoCount=parsed.cargoCount==='auto'?level.count:parsed.cargoCount as number;
 const destinationCount=parsed.destinationCount==='auto'?level.stops:parsed.destinationCount as number;
 const extraCargo=parsed.extraCargo==='auto'?level.choices-level.count:parsed.extraCargo;
 const extraStops=parsed.extraStops==='auto'?(level.stops===2?1:0):parsed.extraStops;
 const error=destinationCount>cargoCount?'每个站点至少收到一件货物，请增加货物或减少目的地。':level.mode==='update'&&destinationCount<2?'“还剩什么”需要至少两个目的地，请增加目的地或选择其他任务。':null;
 return {cargoCount,destinationCount,extraCargo,extraStops,cargoChoices:cargoCount+extraCargo,stopChoices:destinationCount+extraStops,error};
}
export const choiceOptionsKey=(account:string)=>`car-playroom-delivery-choices-v1:${encodeURIComponent(account)}`;
type ChoiceStorage=Pick<Storage,'getItem'|'setItem'>;
export function readChoiceOptions(storage:ChoiceStorage,account:string):ChoiceOptions{
 try{return parseChoiceOptions(JSON.parse(storage.getItem(choiceOptionsKey(account))||'null'));}catch{return {...defaultChoiceOptions};}
}
export function saveChoiceOptions(storage:ChoiceStorage,account:string,value:ChoiceOptions):boolean{
 try{storage.setItem(choiceOptionsKey(account),JSON.stringify(parseChoiceOptions(value)));return true;}catch{return false;}
}
