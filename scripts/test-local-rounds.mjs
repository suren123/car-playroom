import assert from 'node:assert/strict';
import {readRound,saveRound,trackRound,removeRound} from '../lib/local-rounds.ts';
import {RoundRecorder,clearRecords,pendingRecordCount} from '../lib/records-client.ts';

class Storage {data=new Map();getItem(k){return this.data.get(k)??null;}setItem(k,v){this.data.set(k,String(v));}removeItem(k){this.data.delete(k);}}
globalThis.localStorage=new Storage();globalThis.window=new EventTarget();
let epoch=0;const server=new Map();
globalThis.fetch=async (_url,options={})=>{if(options.method==='DELETE'){epoch++;server.clear();return Response.json({epoch});}if(options.method==='POST'){const row=JSON.parse(options.body);if(row.epoch!==epoch)return Response.json({}, {status:409});server.set(row.id,row);return Response.json({ok:true});}return Response.json({epoch,records:[],hasMore:false});};

const state={kind:'queue',cars:['fire','bus','digger'],own:'fire',order:['fire','bus','digger'],index:1,ownPosition:0,complete:false};
const recorder=new RoundRecorder('queue','auto');trackRound('account-a','queue',recorder);saveRound('account-a','queue',state,recorder.snapshot());
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(readRound('account-a','queue').state.index,1);assert.equal(readRound('account-b','queue'),null);assert.equal(readRound('account-a','queue').record.epoch,0);
recorder.note('wrong');saveRound('account-a','queue',state,recorder.snapshot());const oldId=recorder.snapshot().id;
await clearRecords();const rebased=readRound('account-a','queue');assert.notEqual(rebased.record.id,oldId);assert.equal(rebased.record.wrong,0);assert.equal(rebased.record.epoch,1);
await recorder.finish(true);await recorder.finish(true);assert.equal(server.size,1);assert.equal([...server.values()][0].epoch,1);assert.equal(pendingRecordCount(),0);
removeRound('account-a','queue');assert.equal(readRound('account-a','queue'),null);
console.log('PASS: account-isolated local round, async epoch capture, clear-and-resume, durable outbox and duplicate finish.');
