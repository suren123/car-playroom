import type {GameId} from '../games/registry';
export type RecordGame=GameId;
export type RecordDifficulty='simple'|'auto'|'challenge';
export type RoundRecord={id:string;game:RecordGame;startedAt:string;endedAt:string;completed:boolean;wrong:number;premature:number;hints:number;retries:number;pauses:number;difficulty:RecordDifficulty;epoch:number|null;gameVersion?:string;levelId?:number;seed?:number;parameters?:string;supports?:string};
const key='car-missions-pending-records-v1';
let memoryPending:RoundRecord[]=[];
function pending():RoundRecord[]{let stored:RoundRecord[]=[];try{const parsed=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(parsed))stored=parsed;}catch{/* In-memory records remain available during this visit. */}const byId=new Map([...stored,...memoryPending].map(item=>[item.id,item]));return [...byId.values()];}
function put(items:RoundRecord[]){try{localStorage.setItem(key,JSON.stringify(items));memoryPending=[];}catch{memoryPending=items;if(typeof window!=='undefined')window.dispatchEvent(new Event('car-storage-unavailable'));}}
const epochKey='car-playroom-record-epoch-v1';
function cachedEpoch(){try{const raw=localStorage.getItem(epochKey);if(raw===null)return null;const value=Number(raw);return Number.isSafeInteger(value)&&value>=0?value:null;}catch{return null;}}
function cacheEpoch(value:number){try{localStorage.setItem(epochKey,String(value));}catch{/* Keep the current record's epoch in memory. */}}
async function epoch(){const r=await fetch('/api/records',{cache:'no-store'});if(!r.ok)throw new Error('记录暂时无法同步');const value=(await r.json() as {epoch:number}).epoch;cacheEpoch(value);return value;}
async function send(item:RoundRecord){
 if(item.epoch===null)throw new Error('局次开始时无法确认记录状态，需要联网重新开始一局。');
 const current=item.epoch;
 const r=await fetch('/api/records',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...item,epoch:current})});
 if(r.status===409)return 'discarded';
 if(!r.ok)throw new Error('记录暂时无法同步');
 return 'saved';
}
let syncing:Promise<number>|null=null;
export async function retryPendingRecords(){
 if(syncing)return syncing;
 syncing=(async()=>{const initial=pending(),remaining:RoundRecord[]=[];
  for(const item of initial)try{await send(item);}catch{remaining.push(item);}
  const known=new Set(initial.map(x=>x.id)),newlyAdded=pending().filter(x=>!known.has(x.id));
  put([...remaining,...newlyAdded]);return remaining.length+newlyAdded.length;
 })();
 try{return await syncing;}finally{syncing=null;}
}
export async function loadRecords(offset=0,game='',date=''){await retryPendingRecords();const query=new URLSearchParams({offset:String(offset)});if(game)query.set('game',game);if(date){const start=new Date(`${date}T00:00:00`),end=new Date(start);end.setDate(end.getDate()+1);if(Number.isFinite(start.getTime())){query.set('from',start.toISOString());query.set('to',end.toISOString());}}const r=await fetch(`/api/records?${query}`,{cache:'no-store'});if(!r.ok)throw new Error('记录暂时无法读取');return await r.json() as {epoch:number;hasMore:boolean;records:(Omit<RoundRecord,'epoch'|'completed'>&{completed:number})[]};}
export async function clearRecords(){const r=await fetch('/api/records',{method:'DELETE'});if(!r.ok)throw new Error('记录暂时无法清空');const result=await r.json() as {epoch:number};cacheEpoch(result.epoch);put([]);if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('car-records-cleared',{detail:result.epoch}));return result;}
export function pendingRecordCount(){return pending().length;}
export function unverifiedRecordCount(){return pending().filter(item=>item.epoch===null).length;}

export class RoundRecorder{
 private item:RoundRecord;private ended=false;private startEpoch:Promise<number>;
 private updateHandler?: (record:RoundRecord,previousId:string)=>void;
 private revision=0;
 private clearListener=(event:Event)=>{const current=(event as CustomEvent<number>).detail;if(this.ended||!Number.isSafeInteger(current))return;this.revision++;const previousId=this.item.id;this.item={...this.item,id:crypto.randomUUID(),startedAt:new Date().toISOString(),wrong:0,premature:0,hints:0,retries:0,pauses:0,supports:undefined,epoch:current};this.startEpoch=Promise.resolve(current);this.updateHandler?.(this.snapshot(),previousId);};
 constructor(game:RecordGame,difficulty:RecordDifficulty,metadata:Partial<Pick<RoundRecord,'gameVersion'|'levelId'|'seed'|'parameters'>>={}, saved?:RoundRecord){
  this.item=saved ? {...saved} : {id:crypto.randomUUID(),game,startedAt:new Date().toISOString(),endedAt:'',completed:false,wrong:0,premature:0,hints:0,retries:0,pauses:0,difficulty,epoch:cachedEpoch(),...metadata};
  const revision=this.revision;this.startEpoch=epoch().then(current=>{if(revision!==this.revision)return this.item.epoch??current;const previousId=this.item.id;if(this.item.epoch!==null&&this.item.epoch!==current){this.item={...this.item,id:crypto.randomUUID(),startedAt:new Date().toISOString(),wrong:0,premature:0,hints:0,retries:0,pauses:0,supports:undefined};}this.item.epoch=current;this.updateHandler?.(this.snapshot(),previousId);return current;});this.startEpoch.catch(()=>{});if(typeof window!=='undefined')window.addEventListener('car-records-cleared',this.clearListener);
 }
 snapshot(){return {...this.item};}
 onUpdate(handler:(record:RoundRecord,previousId:string)=>void){this.updateHandler=handler;}
 note(field:'wrong'|'premature'|'hints'|'retries'|'pauses'){if(!this.ended)this.item[field]=Math.min(99,this.item[field]+1);}
 noteSupport(kind:'review'|'hint'|'demo'|'help'){if(this.ended)return;const used=new Set<string>(JSON.parse(this.item.supports||'[]'));used.add(kind);this.item.supports=JSON.stringify([...used]);}
 async finish(completed:boolean){
  if(this.ended)return;this.ended=true;if(typeof window!=='undefined')window.removeEventListener('car-records-cleared',this.clearListener);this.item.completed=completed;this.item.endedAt=new Date().toISOString();
  const originalId=this.item.id;put([...pending(),this.item]);
  try{this.item.epoch=await this.startEpoch;}catch{/* Retried when online. */}
  put(pending().map(item=>item.id===originalId?this.item:item));
  try{await retryPendingRecords();}catch{/* Parent view shows pending records. */}
 }
}
