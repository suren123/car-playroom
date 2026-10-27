import assert from 'node:assert/strict';
import {makeDifference,replayReducer,differenceLevels,differenceKinds} from '../lib/replay-games.ts';
import {readDifferenceDifficulty,differenceDifficultyKey} from '../lib/difference-preferences.ts';

for(const [difficulty,count,changes] of [['beginner',4,1],['practice',6,2],['challenge',9,3]]){
 const signatures=new Set();
 for(let i=1;i<=240;i++){
  const seed=Math.imul(i,2654435761)>>>0;
  let round=makeDifference(difficulty,seed);
  assert.deepEqual(round,makeDifference(difficulty,seed));assert.equal(round.difficulty,difficulty);
  assert.equal(round.left.length,count);assert.equal(round.right.length,count);
  assert.equal(differenceLevels[difficulty].count,count);
  const actual=[];
  for(let j=0;j<count;j++){
   assert.ok(differenceKinds.includes(round.left[j].kind));assert.ok(differenceKinds.includes(round.right[j].kind));
   if(round.left[j].kind!==round.right[j].kind)actual.push(j);else assert.deepEqual(round.left[j],round.right[j]);
  }
  assert.equal(actual.length,changes);assert.deepEqual([...round.differences].sort(),actual.sort());
  assert.equal(new Set(round.left.map(v=>v.kind)).size,Math.min(count,6));
  for(const kind of differenceKinds)assert.ok(round.left.filter(v=>v.kind===kind).length<=2);
  signatures.add(JSON.stringify([round.left,round.right]));
  const untouched=round.left.findIndex((_,j)=>!actual.includes(j));
  const before=round;round=replayReducer(round,{type:'spot',index:untouched});assert.equal(round.wrong,1);assert.equal(round.found.length,0);assert.deepEqual(round.left,before.left);assert.deepEqual(round.right,before.right);
  assert.equal(replayReducer(round,{type:'spot',index:-1}),round);assert.equal(replayReducer(round,{type:'spot',index:count}),round);
  round=replayReducer(round,{type:'hint'});round=replayReducer(round,{type:'hint'});assert.ok(round.hintLevel>=2);assert.equal(round.found.length,0);
  for(const index of actual){
   round=replayReducer(round,{type:'spot',index});assert.equal(round.hintLevel,0);assert.equal(round.hint,false);
   assert.equal(replayReducer(round,{type:'spot',index}),round);
  }
  assert.equal(round.complete,true);assert.equal(round.message,'全部找到啦！');assert.equal(round.found.length,changes);
  assert.equal(replayReducer(round,{type:'hint'}),round);assert.equal(replayReducer(round,{type:'spot',index:untouched}),round);
 }
 assert.ok(signatures.size>200,`${difficulty} should have varied rounds`);
}
const account='a',data=new Map(),storage={getItem:key=>data.get(key)??null};
const oldKey=`car-playroom-difficulty:${account}:difference`,stageKey=`car-playroom-stage:${account}:difference`;
assert.equal(readDifferenceDifficulty(storage,account),'beginner');
for(const [old,stage,expected] of [['simple','1','practice'],['challenge','0','challenge'],['auto','0','practice'],['auto','1','challenge'],[null,'0','practice'],[null,'1','challenge'],['broken','1','beginner'],[null,'broken','beginner']]){
 old===null?data.delete(oldKey):data.set(oldKey,old);data.set(stageKey,stage);assert.equal(readDifferenceDifficulty(storage,account),expected);
}
for(const difficulty of ['beginner','practice','challenge']){data.set(differenceDifficultyKey(account),difficulty);assert.equal(readDifferenceDifficulty(storage,account),difficulty);assert.equal(readDifferenceDifficulty(storage,'b'),'beginner');}
assert.equal(readDifferenceDifficulty({getItem(){throw Error('blocked');}},account),'beginner');
console.log('PASS: 240 seeds × 3 difference levels, exact PNG differences, unchanged pairs, replay determinism, wrong/repeated taps, hints, stable completion and preference migration.');
