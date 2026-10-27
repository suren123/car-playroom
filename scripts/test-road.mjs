import assert from 'node:assert/strict';
import {makeRoadRound,roadReducer} from '../lib/road-games.ts';

for(let seed=1;seed<=200;seed++)for(const challenge of [false,true]){
 let traffic=makeRoadRound('traffic',seed,challenge);
 assert.equal(traffic.signals.length,challenge?6:4);assert.ok(traffic.signals.includes('red'));
 const t0=traffic.index;traffic=roadReducer(traffic,{type:'signal',signal:traffic.signals[0]==='red'?'green':'red'});assert.equal(traffic.index,t0);
 while(!traffic.complete)traffic=roadReducer(traffic,{type:'signal',signal:traffic.signals[traffic.index]});
 assert.equal(roadReducer(traffic,{type:'signal',signal:'green'}),traffic);
 let listen=makeRoadRound('listen',seed,challenge);assert.equal(listen.stops.length,challenge?2:1);
 while(!listen.complete){if(listen.groupDone)listen=roadReducer(listen,{type:'nextListen'});else listen=roadReducer(listen,{type:'stop',stop:listen.stops[listen.index]});}assert.equal(listen.group,2);
 let detour=makeRoadRound('detour',seed,challenge);assert.equal(detour.started,false);
 detour=roadReducer(detour,{type:'begin'});detour=roadReducer(detour,{type:'road',road:detour.blocked});assert.equal(detour.complete,false);
 detour=roadReducer(detour,{type:'road',road:(detour.blocked+1)%detour.roads});assert.equal(detour.complete,true);
 for(const queueIndex of [0,1,2]){
  let queue=makeRoadRound('queue',seed,challenge,queueIndex);const own=queue.cars[0];queue=roadReducer(queue,{type:'own',car:own});
  assert.equal(queue.order[queue.ownPosition],own);assert.equal(queue.ownPosition,queueIndex);
  const outOfTurn=queue.order[2];queue=roadReducer(queue,{type:'depart',car:outOfTurn});assert.equal(queue.index,0);assert.equal(queue.order[queue.ownPosition],own);
  queue=roadReducer(queue,{type:'depart',car:queue.order[0]});const departed=queue;queue=roadReducer(queue,{type:'depart',car:queue.order[0]});assert.equal(queue,departed);
  while(!queue.complete)queue=roadReducer(queue,{type:'depart',car:queue.order[queue.index]});assert.equal(queue.index,3);
 }
}
console.log('PASS: 200 seeds, four road games, both difficulties, queue order, early taps, blocked roads, completion and duplicate taps.');
