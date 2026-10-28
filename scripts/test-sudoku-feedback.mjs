import assert from 'node:assert/strict';
import {makeSudoku,replayReducer} from '../lib/replay-games.ts';
import {sudokuFeedback} from '../lib/sudoku-feedback.ts';

let events=0;
for(const size of [2,3,4])for(let seed=1;seed<=240;seed++){
 let before=makeSudoku(size,seed);
 const seen=new Set();
 for(let line=0;line<size;line++)for(const axis of ['row','column']){
  const indices=Array.from({length:size},(_,i)=>axis==='row'?line*size+i:i*size+line);
  if(indices.every(i=>before.values[i]>=0))seen.add(`${axis}:${line}`);
 }
 while(!before.complete){
  assert.equal(sudokuFeedback(before,replayReducer(before,{type:'hint'})),null);
  assert.equal(sudokuFeedback(before,replayReducer(before,{type:'symbol',value:(before.solution[before.selected]+1)%size})),null);
  const next=replayReducer(before,{type:'symbol',value:before.solution[before.selected]});
  const visual=sudokuFeedback(before,next);assert.equal(visual.cell,before.selected);
  for(const [axis,lines] of [['row',visual.rows],['column',visual.columns]])for(const line of lines){
   assert.ok(!seen.has(`${axis}:${line}`),'line celebrated twice or initially complete');
   seen.add(`${axis}:${line}`);events++;
  }
  for(let line=0;line<size;line++)for(const axis of ['row','column']){
   const indices=Array.from({length:size},(_,i)=>axis==='row'?line*size+i:i*size+line);
   if(!next.complete&&indices.every(i=>next.values[i]>=0))assert.ok(seen.has(`${axis}:${line}`),'completed line missed');
  }
  if(next.complete){assert.deepEqual(visual.rows,[]);assert.deepEqual(visual.columns,[]);}
  before=next;
 }
 assert.equal(sudokuFeedback(before,before),null);
}
const solution=[0,1,2,1,2,0,2,0,1],values=[-1,1,2,1,2,0,2,0,-1];
const simultaneous={...makeSudoku(3,1),initial:values,values,solution,selected:0};
assert.deepEqual(sudokuFeedback(simultaneous,replayReducer(simultaneous,{type:'symbol',value:0})),{cell:0,rows:[0],columns:[0]});
console.log(`Sudoku feedback: 720 rounds passed, ${events} unique line events; wrong/hint/initial/full-board exclusions and simultaneous row/column passed.`);
