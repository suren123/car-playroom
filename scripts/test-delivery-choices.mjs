import assert from 'node:assert/strict';
import {deliveryRecordParameters,encodeDeliveryHistory,decodeDeliveryHistory} from '../games/delivery/record-metadata.ts';
import {levels,createDelivery,deliveryReducer,canShareShelf,stopIds,items,taskSignature} from '../games/delivery/model.ts';
import {defaultChoiceOptions,parseChoiceOptions,resolveChoices,readChoiceOptions,saveChoiceOptions,choiceOptionsKey,choicePresets} from '../games/delivery/options.ts';

for(const value of [null,{},[],false,'8',{extraCargo:9,extraStops:7},{extraCargo:-1,extraStops:NaN},{extraCargo:1.5,extraStops:'2'}])assert.deepEqual(parseChoiceOptions(value),defaultChoiceOptions);
for(const preset of choicePresets)assert.deepEqual(parseChoiceOptions(preset),{extraCargo:preset.extraCargo,extraStops:preset.extraStops});
const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
storage.setItem('car-playroom-delivery-v1',JSON.stringify({level:8,car:'fire',recent:['old order'],extraCargo:100}));
assert.deepEqual(readChoiceOptions(storage,'alice'),defaultChoiceOptions,'old preferences do not invent a new override');
saveChoiceOptions(storage,'alice',{extraCargo:8,extraStops:6});
assert.deepEqual(readChoiceOptions(storage,'alice'),{extraCargo:8,extraStops:6});
assert.deepEqual(readChoiceOptions(storage,'bob'),defaultChoiceOptions,'account isolation');
assert.notEqual(choiceOptionsKey('a:b'),choiceOptionsKey('a%3Ab'));
assert.ok(storage.getItem('car-playroom-delivery-v1').includes('old order'),'preserve unrelated preferences');
storage.setItem(choiceOptionsKey('alice'),'bad JSON');assert.deepEqual(readChoiceOptions(storage,'alice'),defaultChoiceOptions);
const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('quota');}};
assert.deepEqual(readChoiceOptions(blocked,'a'),defaultChoiceOptions);assert.equal(saveChoiceOptions(blocked,'a',{extraCargo:8,extraStops:6}),false);

let rounds=0;const usedCargo=new Set(),usedStops=new Set(),slotPositions=new Set();
for(const level of levels)for(const extraCargo of ['auto',...Array.from({length:9},(_,i)=>i)])for(const extraStops of ['auto',...Array.from({length:7},(_,i)=>i)]){
 const options={extraCargo,extraStops},resolved=resolveChoices(level,options);
 for(let n=1;n<=200;n++){
  const seed=Math.imul(n,2654435761)>>>0;
  let state=createDelivery(level.id,seed,[],options);rounds++;
  assert.deepEqual(state,createDelivery(level.id,seed,[],options),'seed + configuration reproduces all candidates');
  assert.deepEqual(state.choices,resolved);const frozen=JSON.stringify(state.tasks);
  for(const task of state.tasks){
   assert.equal(task.choices.length,level.count+resolved.extraCargo);assert.equal(task.stopChoices.length,level.stops+resolved.extraStops);
   assert.equal(new Set(task.choices).size,task.choices.length);assert.equal(new Set(task.stopChoices).size,task.stopChoices.length);
   assert.ok(task.cargo.every(id=>task.choices.includes(id)));assert.ok(task.stops.every(id=>task.stopChoices.includes(id)));
   for(const id of task.choices){usedCargo.add(id);assert.ok(canShareShelf(id,task.choices.filter(x=>x!==id)),'entire shelf must be unambiguous');}
   for(const id of task.stopChoices){assert.ok(stopIds.includes(id));usedStops.add(id);}
   if(task.stopChoices.length===8)slotPositions.add(task.stopChoices.indexOf(task.stops[0]));
   state=deliveryReducer(state,{type:'ready'});
   assert.equal(deliveryReducer(state,{type:'load',item:'unknown'}),state);
   const bad=task.choices.find(id=>!task.cargo.includes(id));
   if(bad){const before=state;state=deliveryReducer(state,{type:'load',item:bad});assert.equal(state.wrong,before.wrong+1);assert.deepEqual(state.loaded,[]);}
   for(const item of task.cargo){state=deliveryReducer(state,{type:'load',item});assert.equal(deliveryReducer(state,{type:'load',item}),state);}
   state=deliveryReducer(state,{type:'depart'});
   assert.equal(state.phase,level.stops===1&&resolved.extraStops===0?'travel':'route');
   for(let index=0;index<task.stops.length;index++){
    if(state.phase==='remaining'){
     assert.equal(index,1);assert.ok(task.choices.includes(task.cargo[0]),'delivered cargo remains an option');
     const before=state;state=deliveryReducer(state,{type:'remaining',item:task.cargo[0]});assert.equal(state.phase,'remaining');assert.equal(state.wrong,before.wrong+1);
     state=deliveryReducer(state,{type:'remaining',item:task.cargo[1]});assert.equal(state.phase,resolved.extraStops>0?'route':'travel');
    }
    if(state.phase==='route'){
     assert.equal(deliveryReducer(state,{type:'route',stop:'unknown'}),state);
     if(index>0)assert.equal(deliveryReducer(state,{type:'route',stop:task.stops[0]}),state,'already delivered cannot be selected');
     const wrong=task.stopChoices.find(id=>!task.stops.slice(0,index+1).includes(id));
     if(wrong){const before=state;state=deliveryReducer(state,{type:'route',stop:wrong});assert.equal(state.phase,'route');assert.equal(state.stopIndex,index);assert.equal(state.wrong,before.wrong+1);}
     const before=state;state=deliveryReducer(state,{type:'review'});assert.equal(deliveryReducer(state,{type:'route',stop:task.stops[index]}),state);state=deliveryReducer(state,{type:'closeReview'});assert.deepEqual(state.tasks,before.tasks);
     state=deliveryReducer(state,{type:'route',stop:task.stops[index]});assert.equal(deliveryReducer(state,{type:'route',stop:task.stops[index]}),state);
    }
    assert.equal(state.phase,'travel');state=deliveryReducer(state,{type:'arrive'});assert.equal(state.phase,'unload');state=deliveryReducer(state,{type:'unload'});assert.equal(deliveryReducer(state,{type:'unload'}),state);
   }
   assert.equal(state.phase,'taskDone');state=deliveryReducer(state,{type:'next'});
  }
  assert.equal(state.phase,'finished');assert.equal(deliveryReducer(state,{type:'next'}),state);assert.equal(JSON.stringify(state.tasks),frozen,'stable candidates across pauses, hints, arrivals and orders');
 }
 console.log(`PASS task ${level.id}, extra cargo ${extraCargo}, extra stops ${extraStops}: 200 seeds`);
}
assert.equal(rounds,128000);assert.equal(usedCargo.size,50);assert.equal(usedStops.size,20);assert.equal(slotPositions.size,8);
for(const level of levels){
 const original=createDelivery(level.id,42),max=createDelivery(level.id,42,[],{extraCargo:8,extraStops:6});
 assert.deepEqual(original.tasks.map(taskSignature),max.tasks.map(taskSignature),'counts do not bias correct orders');
 const options={extraCargo:1,extraStops:1},active=createDelivery(level.id,42,[],options);options.extraCargo=8;
 assert.equal(active.choiceOptions.extraCargo,1,'in-progress round owns an immutable configuration snapshot');
}
assert.deepEqual([...usedCargo].sort(),items.map(i=>i.id).sort());
console.log(`PASS: ${rounds} rounds / ${rounds*3} orders; all 8 tasks × 80 settings × 200 seeds; settings isolation, full candidate rules, fixed positions, wrong choices, review and complete flows.`);

let recent=[];
for(let round=0;round<100;round++){
 const state=createDelivery(round%8+1,round,recent,{extraCargo:8,extraStops:6});
 const parameters=deliveryRecordParameters(state,recent),p=JSON.parse(parameters);
 assert.ok(parameters.length<=500,`metadata is ${parameters.length} characters`);
 assert.deepEqual(decodeDeliveryHistory(p.recent),recent);
 assert.deepEqual(createDelivery(state.level.id,state.seed,decodeDeliveryHistory(p.recent),p.choiceOptions).tasks,state.tasks);
 recent=[...recent,...state.tasks.map(taskSignature)].slice(-5);
}
assert.deepEqual(encodeDeliveryHistory(['null','bad JSON','{}','[["unknown"],["fire"]]']),[]);
assert.deepEqual(decodeDeliveryHistory(['..','AA.ZZ',null,1,'99.99']),[]);
console.log('PASS: compact v1 history round trips, seeded records reproduce candidates, metadata stays within unchanged 500-character API limit.');
