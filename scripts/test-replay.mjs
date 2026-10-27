import assert from 'node:assert/strict';
import {makeRound,replayReducer,categoryFor} from '../lib/replay-games.ts';

const signatures={sort:new Set(),difference:new Set()};
for(let seed=1;seed<=200;seed++){
 let sort=makeRound('sort',seed);
 assert.equal(sort.deck.length,6);assert.equal(new Set(sort.deck.map(x=>x.kind)).size,6);
 signatures.sort.add(JSON.stringify(sort.deck));
 const before=sort;sort=replayReducer(sort,{type:'category',category:categoryFor[sort.deck[0].kind]==='rescue'?'build':'rescue'});assert.equal(sort.parked.length,0);
 for(let i=0;i<6;i++){
   sort=replayReducer(sort,{type:'category',category:categoryFor[sort.deck[i].kind]});assert.equal(sort.parked.length,i+1);
   assert.equal(replayReducer(sort,{type:'category',category:categoryFor[sort.deck[i].kind]}).parked.length,i+1);
   sort=replayReducer(sort,{type:'next'});
 }
 assert.equal(sort.complete,true);assert.deepEqual(makeRound('sort',seed),before);
 for(const challenge of [false,true]){
   let diff=makeRound('difference',seed,challenge);
   const changed=diff.left.flatMap((v,i)=>JSON.stringify(v)!==JSON.stringify(diff.right[i])?[i]:[]);
   assert.deepEqual([...changed].sort(),[...diff.differences].sort());assert.equal(changed.length,challenge?3:2);
   signatures.difference.add(JSON.stringify(diff));
   const unchanged=diff.left.findIndex((_,i)=>!diff.differences.includes(i));assert.equal(replayReducer(diff,{type:'spot',index:unchanged}).found.length,0);
   for(const index of changed){diff=replayReducer(diff,{type:'spot',index});const count=diff.found.length;diff=replayReducer(diff,{type:'spot',index});assert.equal(diff.found.length,count);}assert.equal(diff.complete,true);

 }
}
for(const [kind,values] of Object.entries(signatures))assert.ok(values.size>100,`${kind} should offer varied rounds`);
for(let seed=1;seed<=200;seed++){
 for(const rule of ['color','model','purpose']){
  let sort=makeRound('sort',seed,false,rule);assert.equal(sort.rule,rule);
  while(!sort.complete){const target=rule==='purpose'?categoryFor[sort.deck[sort.index].kind]:rule==='model'?sort.deck[sort.index].kind:sort.deck[sort.index].color==='#de6650'?'red':'blue';sort=replayReducer(sort,{type:'bin',bin:target});if(!sort.complete)sort=replayReducer(sort,{type:'next'});}
  assert.equal(sort.parked.length,rule==='purpose'?6:4);
 }

}
console.log('PASS: 200 seeds × both levels; varied rounds, sorting rules, exact difference counts, duplicate taps, hints and completion.');
