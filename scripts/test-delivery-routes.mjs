import assert from 'node:assert/strict';
import {levels,createDelivery,deliveryReducer as act,remainingCargo,canShareShelf,taskSignature} from '../games/delivery/model.ts';
import {resolveChoices} from '../games/delivery/options.ts';
import {deliveryRecordParameters,encodeDeliveryHistory,decodeDeliveryHistory} from '../games/delivery/record-metadata.ts';
import {orderSpeechKeys} from '../lib/delivery-speech.ts';
import {readFileSync} from 'node:fs';
const voice=JSON.parse(readFileSync('lib/delivery-voice.json','utf8'));
const smoke=process.argv.includes('--smoke');
let rounds=0,invalid=0,multiselect=0;
for(const level of levels){
 for(const cargoCount of ['auto',1,2,3,4])for(const destinationCount of ['auto',1,2,3,4]){
  const base={cargoCount,destinationCount,extraCargo:0,extraStops:0};
  if(resolveChoices(level,base).error){assert.throws(()=>createDelivery(level.id,1,[],base));invalid++;continue;}
  for(const extraCargo of smoke?[0,8]:['auto',0,1,2,3,4,5,6,7,8])for(const extraStops of smoke?[0,6]:['auto',0,1,2,3,4,5,6]){
   const options={...base,extraCargo,extraStops},r=resolveChoices(level,options);
   for(let n=1;n<=200;n++){
    const seed=Math.imul(n,2654435761)>>>0;let s=createDelivery(level.id,seed,[],options);rounds++;
    assert.deepEqual(s.tasks,createDelivery(level.id,seed,[],options).tasks);
    const frozen=JSON.stringify(s.tasks);
    for(const t of s.tasks){
     assert.equal(t.cargo.length,r.cargoCount);assert.equal(t.stops.length,r.destinationCount);
     assert.equal(new Set(t.cargo).size,t.cargo.length);assert.equal(new Set(t.stops).size,t.stops.length);
     assert.equal(t.choices.length,r.cargoChoices);assert.equal(t.stopChoices.length,r.stopChoices);
     assert.equal(new Set(t.choices).size,t.choices.length);assert.equal(new Set(t.stopChoices).size,t.stopChoices.length);
     assert.ok(t.cargo.every(id=>t.choices.includes(id)));assert.ok(t.stops.every(id=>t.stopChoices.includes(id)));
     assert.ok(t.choices.every(id=>canShareShelf(id,t.choices.filter(x=>x!==id))));
     assert.deepEqual(t.deliveries.map(d=>d.stop),t.stops);
     assert.deepEqual(t.deliveries.flatMap(d=>d.cargo).sort(),[...t.cargo].sort());
     const counts=t.deliveries.map(d=>d.cargo.length);assert.ok(Math.min(...counts)>=1);assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
     if(n===1){const keys=orderSpeechKeys(t.cargo,t.stops,t.deliveries);assert.ok(keys.length&&keys.every(k=>voice[k]));assert.equal(keys.filter(k=>k.startsWith('segment_stop_')).length,t.stops.length);}
     s=act(s,{type:'ready'});for(const item of t.cargo)s=act(s,{type:'load',item});s=act(s,{type:'depart'});
     for(const stop of t.stops){
      if(s.phase==='remaining'){
       const remaining=remainingCargo(s),before=s;
       if(remaining.length>1){
        multiselect++;s=act(s,{type:'remaining',item:s.unloaded[0]});s=act(s,{type:'confirmRemaining'});assert.equal(s.wrong,before.wrong+1);assert.equal(s.phase,'remaining');s=act(s,{type:'remaining',item:s.unloaded[0]});
        for(const item of remaining)s=act(s,{type:'remaining',item});s=act(s,{type:'confirmRemaining'});
       }else{s=act(s,{type:'remaining',item:s.unloaded[0]});assert.equal(s.wrong,before.wrong+1);s=act(s,{type:'remaining',item:remaining[0]});}
       assert.equal(s.phase,r.extraStops>0?'route':'travel');
      }
      if(s.phase==='route'){for(const visited of t.stops.slice(0,s.stopIndex))assert.equal(act(s,{type:'route',stop:visited}),s);s=act(s,{type:'route',stop});}
      assert.equal(s.phase,'travel');s=act(s,{type:'arrive'});const unloaded=s.unloaded.length,index=s.stopIndex;s=act(s,{type:'unload'});assert.equal(s.unloaded.length-unloaded,t.deliveries[index].cargo.length);assert.equal(act(s,{type:'unload'}),s);
     }
     assert.equal(s.phase,'taskDone');assert.equal(s.unloaded.length,t.cargo.length);s=act(s,{type:'next'});
    }
    assert.equal(s.phase,'finished');assert.equal(JSON.stringify(s.tasks),frozen);assert.equal(act(s,{type:'next'}),s);
   }
  }
 }
 console.log(`PASS task ${level.id}: ${rounds} cumulative rounds, ${multiselect} multi-select checks`);
}
let recent=[];
for(let n=0;n<200;n++){
 const s=createDelivery(8,n,recent,{cargoCount:4,destinationCount:3,extraCargo:8,extraStops:6}),raw=deliveryRecordParameters(s,recent),p=JSON.parse(raw);
 assert.ok(raw.length<=500,raw.length);assert.equal(p.historyFormat,2);assert.deepEqual(decodeDeliveryHistory(p.recent),recent);
 assert.deepEqual(createDelivery(8,n,decodeDeliveryHistory(p.recent),p.choiceOptions).tasks,s.tasks);
 recent=[...recent,...s.tasks.map(taskSignature)].slice(-5);
}
assert.deepEqual(decodeDeliveryHistory(encodeDeliveryHistory(['[["wheel"],["fire"]]'])),['[["wheel"],["fire"]]']);
console.log(`PASS ${rounds} rounds, ${invalid} invalid configurations, speech allocation, compact history and metadata limit`);
