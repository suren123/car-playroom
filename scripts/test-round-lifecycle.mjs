import assert from 'node:assert/strict';
import {clearRetiredRounds} from '../lib/retired-rounds.ts';
import {gameIds} from '../games/registry.ts';
import {RoundRecorder,clearRecords,pendingRecordCount,retryPendingRecords} from '../lib/records-client.ts';

class Storage {
 data=new Map();
 getItem(k){return this.data.get(k)??null;}
 setItem(k,v){this.data.set(k,String(v));}
 removeItem(k){this.data.delete(k);}
}
class Events extends EventTarget {
 listeners=new Set();
 addEventListener(type,listener,...rest){if(type==='car-records-cleared')this.listeners.add(listener);super.addEventListener(type,listener,...rest);}
 removeEventListener(type,listener,...rest){if(type==='car-records-cleared')this.listeners.delete(listener);super.removeEventListener(type,listener,...rest);}
}
globalThis.localStorage=new Storage();
globalThis.window=new Events();
for(const account of ['account-a','account-b'])for(const game of gameIds)for(const prefix of ['car-playroom-round-v1','car-playroom-lease'])localStorage.setItem(`${prefix}:${account}:${game}`,'old');
const preserved=['car-playroom-delivery-v1','car-playroom-difficulty:account-a:queue','car-playroom-stage:account-a:sort','car-playroom-queue:account-a','car-missions-pending-records-v1','car-playroom-round-v1:account-a:unknown'];
for(const key of preserved)localStorage.setItem(key,'keep');
clearRetiredRounds('account-a');clearRetiredRounds('account-a');
for(const game of gameIds)for(const prefix of ['car-playroom-round-v1','car-playroom-lease']){
 assert.equal(localStorage.getItem(`${prefix}:account-a:${game}`),null);
 assert.equal(localStorage.getItem(`${prefix}:account-b:${game}`),'old');
}
for(const key of preserved)assert.equal(localStorage.getItem(key),'keep');
const storage=localStorage;
globalThis.localStorage={removeItem(){throw Error('blocked');}};
assert.doesNotThrow(()=>clearRetiredRounds('account-a'));
globalThis.localStorage=storage;
storage.removeItem('car-missions-pending-records-v1');

let epoch=0,offline=false,posts=0;
const server=new Map();
globalThis.fetch=async (_url,options={})=>{
 if(offline)throw Error('offline');
 if(options.method==='DELETE'){epoch++;server.clear();return Response.json({epoch});}
 if(options.method==='POST'){posts++;const row=JSON.parse(options.body);if(row.epoch!==epoch)return Response.json({}, {status:409});server.set(row.id,row);return Response.json({ok:true});}
 return Response.json({epoch,records:[],hasMore:false});
};
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));

// Every entry gets a new recorder; abandoning a page submits nothing and releases listeners.
const abandoned=new RoundRecorder('queue','auto');await settle();
const oldId=abandoned.snapshot().id;abandoned.note('wrong');abandoned.dispose();abandoned.dispose();
await abandoned.finish(false);assert.equal(server.size,0);assert.equal(pendingRecordCount(),0);assert.equal(window.listeners.size,0);
const next=new RoundRecorder('queue','auto');await settle();assert.notEqual(next.snapshot().id,oldId);assert.equal(next.snapshot().wrong,0);
next.note('pauses');assert.equal(server.size,0);
await Promise.all([next.finish(false),next.finish(false)]);assert.equal(posts,1);assert.equal(server.size,1);assert.equal([...server.values()][0].completed,false);assert.equal(window.listeners.size,0);

// Clear while playing resets the live recorder without any saved-round binding.
const live=new RoundRecorder('delivery','simple');await settle();live.note('wrong');const beforeClear=live.snapshot().id;
await clearRecords();assert.notEqual(live.snapshot().id,beforeClear);assert.equal(live.snapshot().wrong,0);assert.equal(live.snapshot().epoch,1);
await live.finish(true);await live.finish(true);assert.equal(server.size,1);assert.equal([...server.values()][0].completed,true);

// Finishing queues a record synchronously; unmount must not cancel the pending submission.
const exiting=new RoundRecorder('bridge','auto');await settle();offline=true;
const finishing=exiting.finish(false);exiting.dispose();await finishing;
assert.equal(pendingRecordCount(),1);assert.equal(window.listeners.size,0);
offline=false;await retryPendingRecords();assert.equal(pendingRecordCount(),0);assert.equal(server.size,2);
assert.equal([...server.values()].filter(row=>row.game==='bridge').length,1);

// Two tabs/instances are independent, and blocked storage still permits in-memory records.
const first=new RoundRecorder('sort','auto'),second=new RoundRecorder('sort','auto');await settle();
assert.notEqual(first.snapshot().id,second.snapshot().id);first.note('hints');assert.equal(second.snapshot().hints,0);
await Promise.all([first.finish(true),second.finish(false)]);assert.equal(server.size,4);
globalThis.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
const unavailable=new RoundRecorder('repair','simple');await settle();await unavailable.finish(true);
assert.equal(pendingRecordCount(),0);assert.equal(server.size,5);assert.equal(window.listeners.size,0);
globalThis.localStorage=storage;
console.log('PASS: scoped legacy cleanup, fresh rounds, discard/listener disposal, clear while playing, completion/exit deduplication, offline retry and independent instances.');
