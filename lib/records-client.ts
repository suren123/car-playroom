export type RecordGame='sort'|'difference'|'sudoku'|'repair'|'bridge'|'traffic'|'queue'|'listen'|'detour';
export type RecordDifficulty='simple'|'auto'|'challenge';
export type RoundRecord={id:string;game:RecordGame;startedAt:string;endedAt:string;completed:boolean;wrong:number;premature:number;hints:number;retries:number;pauses:number;difficulty:RecordDifficulty;epoch:number|null};
const key='car-missions-pending-records-v1';
function pending():RoundRecord[]{try{return JSON.parse(localStorage.getItem(key)||'[]') as RoundRecord[];}catch{return [];}}
function put(items:RoundRecord[]){try{localStorage.setItem(key,JSON.stringify(items.slice(-40)));}catch{/* The game still works if storage is unavailable. */}}
async function epoch(){const r=await fetch('/api/records',{cache:'no-store'});if(!r.ok)throw new Error('记录暂时无法同步');return (await r.json() as {epoch:number}).epoch;}
async function send(item:RoundRecord){
 const current=item.epoch??await epoch();
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
export async function loadRecords(offset=0){await retryPendingRecords();const r=await fetch(`/api/records?offset=${offset}`,{cache:'no-store'});if(!r.ok)throw new Error('记录暂时无法读取');return await r.json() as {epoch:number;hasMore:boolean;records:(Omit<RoundRecord,'epoch'|'completed'>&{completed:number})[]};}
export async function clearRecords(){const r=await fetch('/api/records',{method:'DELETE'});if(!r.ok)throw new Error('记录暂时无法清空');put([]);return await r.json();}
export function pendingRecordCount(){return pending().length;}

export class RoundRecorder{
 private item:RoundRecord;private ended=false;private startEpoch:Promise<number>;
 constructor(game:RecordGame,difficulty:RecordDifficulty){
  this.item={id:crypto.randomUUID(),game,startedAt:new Date().toISOString(),endedAt:'',completed:false,wrong:0,premature:0,hints:0,retries:0,pauses:0,difficulty,epoch:null};
  this.startEpoch=epoch();this.startEpoch.catch(()=>{});
 }
 note(field:'wrong'|'premature'|'hints'|'retries'|'pauses'){if(!this.ended)this.item[field]=Math.min(99,this.item[field]+1);}
 async finish(completed:boolean){
  if(this.ended)return;this.ended=true;this.item.completed=completed;this.item.endedAt=new Date().toISOString();
  try{this.item.epoch=await this.startEpoch;}catch{/* Retried when online. */}
  const items=[...pending(),this.item];put(items);
  try{await retryPendingRecords();}catch{/* Parent view shows pending records. */}
 }
}
