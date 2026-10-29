import assert from 'node:assert/strict';
import {createDelivery,deliveryReducer,levels} from '../games/delivery/model.ts';
import {deliveryArrival,deliveryMemories} from '../games/delivery/feedback.ts';

let deliveries=0,orders=0;
for(const level of levels)for(let seed=1;seed<=100;seed++){
 let state=createDelivery(level.id,seed);
 const act=action=>{const before=state;state=deliveryReducer(state,action);const feedback=deliveryArrival(before,state);if(action.type!=='unload')assert.equal(feedback,null);return feedback;};
 assert.deepEqual(deliveryMemories(state),[]);
 for(let task=0;task<3;task++){
  const order=state.tasks[task];act({type:'ready'});
  const wrong=order.choices.find(id=>!order.cargo.includes(id));if(wrong)act({type:'load',item:wrong});
  for(const item of order.cargo)act({type:'load',item});act({type:'depart'});
  for(let stop=0;stop<order.stops.length;stop++){
   if(state.phase==='route')act({type:'route',stop:order.stops[stop]});
   if(state.phase==='remaining')act({type:'remaining',item:order.cargo[1]});
   act({type:'arrive'});
   const event=act({type:'unload'});deliveries++;
   assert.deepEqual(event.cargo,order.stops.length===1?order.cargo:[order.cargo[stop]]);
   assert.equal(event.stop,order.stops[stop]);assert.equal(event.orderComplete,stop===order.stops.length-1);
   if(event.orderComplete)orders++;
   else assert.ok(!event.cargo.includes(order.cargo[1]),'remaining answer leaked');
   assert.equal(deliveryArrival(state,deliveryReducer(state,{type:'unload'})),null,'double tap celebrated twice');
   assert.deepEqual(deliveryMemories(state),[],'premature full-round reveal');
  }
  act({type:'next'});
 }
 assert.equal(state.phase,'finished');assert.deepEqual(deliveryMemories(state),state.tasks.map(task=>task.cargo));
 assert.equal(deliveryArrival(state,state),null);
}
console.log(`PASS: ${deliveries} unload events, ${orders} completed orders; single/two-stop feedback, no remaining-answer leak, no duplicate effects or premature memories.`);
