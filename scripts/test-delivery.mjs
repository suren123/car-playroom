import assert from 'node:assert/strict';
import {createDelivery,deliveryReducer,levels,items,taskSignature} from '../games/delivery/model.ts';

const ids=new Set(items.map(item=>item.id));
for(const level of levels)for(let n=1;n<=200;n++){
 const seed=Math.imul(n,2654435761)>>>0;
 let state=createDelivery(level.id,seed);
 assert.deepEqual(createDelivery(level.id,seed),state,'seed must reproduce the same round');
 assert.equal(state.tasks.length,3);
 assert.equal(new Set(state.tasks.map(taskSignature)).size,3);
 const previous=state.tasks.map(taskSignature),replayed=createDelivery(level.id,seed,previous);assert.deepEqual(replayed,createDelivery(level.id,seed,previous));assert.ok(replayed.tasks.every(task=>!previous.includes(taskSignature(task))),'recent tasks should not repeat');
 for(let round=0;round<3;round++){
  const task=state.tasks[state.taskIndex];assert.equal(task.cargo.length,level.count);assert.equal(task.choices.length,level.choices);assert.equal(new Set(task.choices).size,task.choices.length);assert.ok(task.cargo.every(id=>ids.has(id)&&task.choices.includes(id)));
  assert.equal(deliveryReducer(state,{type:'depart'}),state,'cannot depart before loading');
  state=deliveryReducer(state,{type:'ready'});
  const bad=task.choices.find(id=>!task.cargo.includes(id));if(bad){const before=state;state=deliveryReducer(state,{type:'load',item:bad});assert.equal(state.loaded.length,0);assert.equal(state.wrong,before.wrong+1);}
  for(const id of task.cargo){state=deliveryReducer(state,{type:'load',item:id});const duplicate=deliveryReducer(state,{type:'load',item:id});assert.equal(duplicate,state,'duplicate cargo tap must not advance');}
  assert.equal(state.phase,'depart');state=deliveryReducer(state,{type:'depart'});
  for(let stop=0;stop<task.stops.length;stop++){
   if(state.phase==='route'){const before=state;state=deliveryReducer(state,{type:'route',stop:task.stops[stop]==='fire'?'work':'fire'});assert.equal(state.stopIndex,before.stopIndex);assert.equal(state.phase,'route');state=deliveryReducer(state,{type:'route',stop:task.stops[stop]});}
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
