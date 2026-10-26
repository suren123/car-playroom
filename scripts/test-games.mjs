import assert from 'node:assert/strict';
import { gameReducer, initialState, repairTasks } from '../lib/game.ts';
let s=gameReducer(initialState,{type:'start',mode:'repair'});
s=gameReducer(s,{type:'choose',variant:1});assert.equal(s.success,false);assert.match(s.message,/有点大/);
s=gameReducer(s,{type:'help'});assert.equal(s.hint,true);
s=gameReducer(s,{type:'retry'});assert.equal(s.task,0);assert.equal(s.hint,false);
for(let i=0;i<3;i++){s=gameReducer(s,{type:'choose',variant:0});assert.equal(s.success,true);assert.equal(gameReducer(s,{type:'choose',variant:0}).task,i);s=gameReducer(s,{type:'next'});}
assert.equal(s.complete,true);assert.equal(gameReducer(s,{type:'next'}).complete,true);
s=gameReducer(initialState,{type:'start',mode:'bridge'});
s=gameReducer(s,{type:'place',actor:'parent',now:1000});assert.equal(s.boards,0);assert.equal(s.turn,'child');
let time=2000;
for(let i=0;i<3;i++){for(let j=0;j<4;j++){const actor=j%2===0?'child':'parent';s=gameReducer(s,{type:'place',actor,now:time});assert.equal(s.boards,j+1);assert.equal(gameReducer(s,{type:'place',actor:s.turn,now:time+1}).boards,j+1);time+=1000;}assert.equal(s.success,true);s=gameReducer(s,{type:'next'});}
assert.equal(s.complete,true);assert.equal(s.task,2);assert.equal(gameReducer(s,{type:'home'}).mode,'home');
assert.equal(repairTasks.length,3);console.log('PASS: wrong choices, help, retry, three repair tasks, alternating turns, duplicate taps, three bridges, finish and home.');
