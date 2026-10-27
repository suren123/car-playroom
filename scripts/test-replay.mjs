import assert from 'node:assert/strict';
import {makeRound,replayReducer,categoryFor} from '../lib/replay-games.ts';

// Independent constraint validator and solution counter, without the generator's solver.
function possible(board,index,value){
 const row=Math.floor(index/4),col=index%4;
 for(let i=0;i<16;i++)if(i!==index&&board[i]===value&&(Math.floor(i/4)===row||i%4===col||(Math.floor(Math.floor(i/4)/2)===Math.floor(row/2)&&Math.floor((i%4)/2)===Math.floor(col/2))))return false;
 return true;
}
function solveCount(board){
 let best=-1,options=[];
 for(let i=0;i<16;i++)if(board[i]===-1){const candidates=[0,1,2,3].filter(v=>possible(board,i,v));if(best===-1||candidates.length<options.length){best=i;options=candidates;}}
 if(best===-1)return 1;
 let n=0;for(const value of options){const next=[...board];next[best]=value;n+=solveCount(next);if(n>=2)return 2;}return n;
}
const signatures={sort:new Set(),difference:new Set(),sudoku:new Set()};
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
   let sudoku=makeRound('sudoku',seed,challenge);
   assert.equal(sudoku.initial.filter(x=>x===-1).length,challenge?6:3);
   assert.equal(solveCount(sudoku.initial),1);
   for(let i=0;i<16;i++)assert.equal(possible(sudoku.solution,i,sudoku.solution[i]),true);
   signatures.sudoku.add(JSON.stringify(sudoku.initial));
   const selected=sudoku.selected;const wrong=(sudoku.solution[selected]+1)%4;
   sudoku=replayReducer(sudoku,{type:'symbol',value:wrong});assert.equal(sudoku.values[selected],-1);
   const valuesBefore=[...sudoku.values];sudoku=replayReducer(sudoku,{type:'hint'});assert.deepEqual(sudoku.values,valuesBefore);
   while(!sudoku.complete){const index=sudoku.selected;sudoku=replayReducer(sudoku,{type:'symbol',value:sudoku.solution[index]});}
   assert.deepEqual(sudoku.values,sudoku.solution);assert.equal(replayReducer(sudoku,{type:'home'}),null);
 }
}
for(const [kind,values] of Object.entries(signatures))assert.ok(values.size>100,`${kind} should offer varied rounds`);
for(let seed=1;seed<=200;seed++){
 for(const rule of ['color','model','purpose']){
  let sort=makeRound('sort',seed,false,rule);assert.equal(sort.rule,rule);
  while(!sort.complete){const target=rule==='purpose'?categoryFor[sort.deck[sort.index].kind]:rule==='model'?sort.deck[sort.index].kind:sort.deck[sort.index].color==='#de6650'?'red':'blue';sort=replayReducer(sort,{type:'bin',bin:target});if(!sort.complete)sort=replayReducer(sort,{type:'next'});}
  assert.equal(sort.parked.length,rule==='purpose'?6:4);
 }
 let tutorial=makeRound('sudoku',seed,false,'purpose',true);assert.equal(tutorial.size,2);assert.equal(tutorial.initial.filter(x=>x===-1).length,1);tutorial=replayReducer(tutorial,{type:'symbol',value:tutorial.solution[tutorial.selected]});assert.equal(tutorial.complete,true);
 for(const stage of [0,1,2,3]){const puzzle=makeRound('sudoku',seed,false,'color',false,stage);assert.equal(puzzle.size,stage<2?2:4);assert.equal(puzzle.initial.filter(x=>x===-1).length,[1,2,3,6][stage]);if(puzzle.size===4)assert.equal(solveCount(puzzle.initial),1);else {let count=0;for(let a=0;a<2;a++)for(let b=0;b<2;b++){const candidate=[a,b,b,a];if(candidate.every((x,i)=>puzzle.initial[i]===-1||puzzle.initial[i]===x))count++;}assert.equal(count,1);}}
}
console.log('PASS: 200 seeds × both levels; unique and valid sudoku puzzles, varied rounds, sorting rules, exact difference counts, duplicate taps, hints and completion.');
