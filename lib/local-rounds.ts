import {gameCatalog,type GameId} from '../games/registry.ts';
import type {RoundRecord,RoundRecorder} from './records-client';

export type SavedRound<T>={version:1;rulesVersion:number;game:GameId;updatedAt:number;state:T;record:RoundRecord;extra?:Record<string,unknown>};
const key=(account:string,game:GameId)=>`car-playroom-round-v1:${account}:${game}`;
const invalid=()=>{if(typeof window!=='undefined')window.dispatchEvent(new Event('car-round-invalid'));return null;};
function validState(game:GameId,s:Record<string,unknown>):boolean{
 const index=(value:unknown,min:number,max:number)=>Number.isInteger(value)&&Number(value)>=min&&Number(value)<=max;
 if(['sort','difference','sudoku','queue','traffic','listen','detour'].includes(game)&&s.kind!==game)return false;
 if(game==='sort')return Array.isArray(s.deck)&&s.deck.length>0&&Array.isArray(s.bins)&&Array.isArray(s.parked)&&index(s.index,0,s.deck.length-1);
 if(game==='difference')return Array.isArray(s.left)&&Array.isArray(s.right)&&s.left.length===s.right.length&&Array.isArray(s.differences)&&Array.isArray(s.found);
 if(game==='sudoku')return (s.size===2||s.size===4)&&Array.isArray(s.values)&&s.values.length===s.size*s.size&&Array.isArray(s.initial)&&s.initial.length===s.values.length&&Array.isArray(s.solution)&&s.solution.length===s.values.length;
 if(game==='queue')return Array.isArray(s.cars)&&s.cars.length===3&&Array.isArray(s.order)&&index(s.index,0,3)&&(s.own===null||s.order.length===3);
 if(game==='traffic')return Array.isArray(s.signals)&&s.signals.length>0&&index(s.index,0,s.signals.length);
 if(game==='listen')return Array.isArray(s.groups)&&s.groups.length===3&&Array.isArray(s.stops)&&index(s.group,0,2)&&index(s.index,0,s.stops.length);
 if(game==='detour')return index(s.roads,2,3)&&index(s.blocked,0,Number(s.roads)-1);
 if(game==='repair'||game==='bridge')return s.mode===game&&index(s.task,0,2)&&index(s.boards,0,4);
 if(game==='delivery')return Array.isArray(s.tasks)&&s.tasks.length===3&&s.tasks.every(task=>task&&Array.isArray(task.cargo)&&Array.isArray(task.choices)&&Array.isArray(task.stops))&&!!s.level&&typeof s.phase==='string'&&index(s.taskIndex,0,2)&&Array.isArray(s.loaded)&&Array.isArray(s.unloaded);
 return false;
}
export function readRound<T>(account:string,game:GameId):SavedRound<T>|null{
 try{const raw=localStorage.getItem(key(account,game));if(!raw)return null;let data:SavedRound<T>;try{data=JSON.parse(raw);}catch{return invalid();}if(data.version!==1||data.rulesVersion!==gameCatalog[game].rulesVersion||data.game!==game||!data.state||typeof data.state!=='object'||!data.record||data.record.game!==game||!data.record.id||typeof data.updatedAt!=='number'||!validState(game,data.state as Record<string,unknown>))return invalid();return data;}catch{if(typeof window!=='undefined')window.dispatchEvent(new Event('car-storage-unavailable'));return null;}
}
export function saveRound<T>(account:string,game:GameId,state:T,record:RoundRecord,extra?:Record<string,unknown>):boolean{
 try{const data:SavedRound<T>={version:1,rulesVersion:gameCatalog[game].rulesVersion,game,updatedAt:Date.now(),state,record,extra};localStorage.setItem(key(account,game),JSON.stringify(data));return true;}catch{if(typeof window!=='undefined')window.dispatchEvent(new Event('car-storage-unavailable'));return false;}
}
export function removeRound(account:string,game:GameId){try{localStorage.removeItem(key(account,game));}catch{/* Storage can be disabled. */}}
export function trackRound(account:string,game:GameId,recorder:RoundRecorder){recorder.onUpdate((record,previousId)=>{const saved=readRound<unknown>(account,game);if(saved&&saved.record.id===previousId)saveRound(account,game,saved.state,record,saved.extra);});}
