import assert from 'node:assert/strict';
import {createDelivery,deliveryReducer,levels,items,taskSignature,stopIds,routeChoices,canShareShelf,preferredStops} from '../games/delivery/model.ts';

const ids=new Set(items.map(item=>item.id));
assert.equal(ids.size,50);assert.equal(stopIds.length,20);
assert.equal(canShareShelf('paint',['bucket']),false);
assert.equal(canShareShelf('bucket',['paint']),false);
for(const level of levels)for(let n=1;n<=200;n++){
 const seed=Math.imul(n,2654435761)>>>0;
 let state=createDelivery(level.id,seed);
 assert.deepEqual(createDelivery(level.id,seed),state,'seed must reproduce the same round');
 assert.equal(state.tasks.length,3);
 for(const task of state.tasks){assert.equal(new Set(task.stops).size,level.stops);assert.ok(task.stops.every(id=>stopIds.includes(id)));assert.deepEqual(new Set(routeChoices(task.stops)),new Set(task.stops));}
 assert.equal(new Set(state.tasks.map(taskSignature)).size,3);
 const previous=state.tasks.map(taskSignature),replayed=createDelivery(level.id,seed,previous);assert.deepEqual(replayed,createDelivery(level.id,seed,previous));assert.ok(replayed.tasks.every(task=>!previous.includes(taskSignature(task))),'recent tasks should not repeat');
 for(let round=0;round<3;round++){
  const task=state.tasks[state.taskIndex];assert.equal(task.cargo.length,level.count);assert.equal(task.choices.length,level.choices);assert.equal(new Set(task.choices).size,task.choices.length);assert.ok(task.cargo.every(id=>ids.has(id)&&task.choices.includes(id)));
  for(const id of task.choices)assert.ok(canShareShelf(id,task.choices.filter(other=>other!==id)),'confusable distractors on shelf');
  if(round===0)for(let i=0;i<task.stops.length;i++)assert.ok((task.stops.length===1?task.cargo:[task.cargo[i]]).some(id=>preferredStops[id].includes(task.stops[i])),'first order should prefer a natural destination');
  assert.equal(deliveryReducer(state,{type:'depart'}),state,'cannot depart before loading');
  state=deliveryReducer(state,{type:'ready'});
  const bad=task.choices.find(id=>!task.cargo.includes(id));if(bad){const before=state;state=deliveryReducer(state,{type:'load',item:bad});assert.equal(state.loaded.length,0);assert.equal(state.wrong,before.wrong+1);}
  for(const id of task.cargo){state=deliveryReducer(state,{type:'load',item:id});const duplicate=deliveryReducer(state,{type:'load',item:id});assert.equal(duplicate,state,'duplicate cargo tap must not advance');}
  assert.equal(state.phase,'depart');state=deliveryReducer(state,{type:'depart'});
  for(let stop=0;stop<task.stops.length;stop++){
   if(state.phase==='route'){const before=state;state=deliveryReducer(state,{type:'route',stop:stopIds.find(id=>id!==task.stops[stop])});assert.equal(state.stopIndex,before.stopIndex);assert.equal(state.phase,'route');state=deliveryReducer(state,{type:'route',stop:task.stops[stop]});}
   assert.equal(state.phase,'travel');assert.equal(deliveryReducer(state,{type:'depart'}),state,'transition ignores repeated input');state=deliveryReducer(state,{type:'arrive'});assert.equal(state.phase,'unload');state=deliveryReducer(state,{type:'unload'});
   if(state.phase==='remaining'){const wrong=task.choices.find(id=>id!==task.cargo[1]);const before=state;state=deliveryReducer(state,{type:'remaining',item:wrong});assert.equal(state.phase,'remaining');assert.equal(state.wrong,before.wrong+1);state=deliveryReducer(state,{type:'remaining',item:task.cargo[1]});}
  }
  assert.equal(state.phase,'taskDone');state=deliveryReducer(state,{type:'next'});
 }
 assert.equal(state.phase,'finished');assert.equal(deliveryReducer(state,{type:'next'}),state);
}
let review=createDelivery(3,42);review=deliveryReducer(review,{type:'ready'});review=deliveryReducer(review,{type:'review'});assert.equal(review.review,true);assert.equal(deliveryReducer(review,{type:'load',item:review.tasks[0].cargo[0]}),review);review=deliveryReducer(review,{type:'closeReview'});assert.equal(review.review,false);
let hints=createDelivery(1,42);hints=deliveryReducer(hints,{type:'ready'});const wrong=hints.tasks[0].choices.find(id=>!hints.tasks[0].cargo.includes(id));for(let level=1;level<=3;level++){hints=deliveryReducer(hints,{type:'load',item:wrong});assert.equal(hints.hintLevel,level);assert.equal(hints.loaded.length,0);}
console.log('PASS: 8 delivery templates × 200 spread seeds; solvable orders, unique tasks, wrong choices, transitions, review and three deliveries.');

const reached=new Set(),pairs=new Set(),cargoReached=new Set();
for(let seed=1;seed<=10000;seed++)for(const task of createDelivery(5,Math.imul(seed,2654435761)>>>0).tasks){task.stops.forEach(stop=>reached.add(stop));task.cargo.forEach(id=>cargoReached.add(id));pairs.add(task.stops.join(','));}
assert.equal(reached.size,20);assert.equal(cargoReached.size,50);assert.equal(pairs.size,380);
let recent=[];const acrossRounds=new Set();
for(let round=0;round<60;round++){
 const tasks=createDelivery(8,Math.imul(round+1,2654435761)>>>0,recent).tasks;
 for(const task of tasks){
  const previous=recent.slice(-5).map(s=>JSON.parse(s));
  assert.ok(task.cargo.every(id=>previous.every(p=>!p[0].includes(id))),'cargo repeated within recent five orders');
  assert.ok(task.stops.every(id=>previous.every(p=>!p[1].includes(id))),'station repeated within recent five orders');
  task.cargo.forEach(id=>acrossRounds.add(id));recent.push(taskSignature(task));recent=recent.slice(-5);
 }
}
assert.equal(acrossRounds.size,50);
assert.equal(createDelivery(8,1,['bad json','null','{}','[null,null]','[["removed-item"],["removed-stop"]]']).tasks.length,3);
console.log('PASS: 50 cargo, 20 destinations, 380 ordered routes; non-confusable shelves, destination preferences, recent-use rotation and malformed preferences.');
