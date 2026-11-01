export type ExtraCount='auto'|number;
export type ChoiceOptions={extraCargo:ExtraCount;extraStops:ExtraCount};
export type ResolvedChoices={extraCargo:number;extraStops:number;cargoChoices:number;stopChoices:number};
export const choiceVersion=1;
export const defaultChoiceOptions:ChoiceOptions={extraCargo:'auto',extraStops:'auto'};
export const choiceLimits={extraCargo:8,extraStops:6} as const;
export const choicePresets=[
 {name:'轻松找',extraCargo:1,extraStops:1},
 {name:'仔细找',extraCargo:3,extraStops:2},
 {name:'小挑战',extraCargo:5,extraStops:4},
] as const;
const count=(value:unknown,max:number):ExtraCount=>typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<=max?value:'auto';
export function parseChoiceOptions(value:unknown):ChoiceOptions{
 const v=value&&typeof value==='object'?value as Record<string,unknown>:{};
 return {extraCargo:count(v.extraCargo,8),extraStops:count(v.extraStops,6)};
}
export function resolveChoices(level:{count:number;choices:number;stops:number},options:ChoiceOptions=defaultChoiceOptions):ResolvedChoices{
 const parsed=parseChoiceOptions(options);
 const extraCargo=parsed.extraCargo==='auto'?level.choices-level.count:parsed.extraCargo;
 const extraStops=parsed.extraStops==='auto'?(level.stops===2?1:0):parsed.extraStops;
 return {extraCargo,extraStops,cargoChoices:level.count+extraCargo,stopChoices:level.stops+extraStops};
}
export const choiceOptionsKey=(account:string)=>`car-playroom-delivery-choices-v1:${encodeURIComponent(account)}`;
type ChoiceStorage=Pick<Storage,'getItem'|'setItem'>;
export function readChoiceOptions(storage:ChoiceStorage,account:string):ChoiceOptions{
 try{return parseChoiceOptions(JSON.parse(storage.getItem(choiceOptionsKey(account))||'null'));}catch{return {...defaultChoiceOptions};}
}
export function saveChoiceOptions(storage:ChoiceStorage,account:string,value:ChoiceOptions):boolean{
 try{storage.setItem(choiceOptionsKey(account),JSON.stringify(parseChoiceOptions(value)));return true;}catch{return false;}
}
