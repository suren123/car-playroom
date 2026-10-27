import assert from 'node:assert/strict';
import {makeSudoku,replayReducer,sudokuSpeech,countSolutions} from '../lib/replay-games.ts';
import {readSudokuSize,sudokuSizeKey} from '../lib/sudoku-preferences.ts';

// Independent row/column verifier, exhaustive solver and single-candidate solver.
function options(board,i,n){
 const row=board.slice(Math.floor(i/n)*n,Math.floor(i/n)*n+n),column=board.filter((_,j)=>j%n===i%n);
 return Array.from({length:n},(_,v)=>v).filter(v=>!row.includes(v)&&!column.includes(v));
}
function solutions(board,n){
 const i=board.indexOf(-1);if(i<0)return 1;
 let total=0;for(const v of options(board,i,n)){const next=[...board];next[i]=v;total+=solutions(next,n);if(total>1)return 2;}return total;
}
function eliminate(board,n){
 const values=[...board];
 while(values.includes(-1)){
  const step=values.findIndex((v,i)=>v===-1&&options(values,i,n).length===1);
  if(step<0)return false;values[step]=options(values,step,n)[0];
 }
 return values;
}
for(const n of [2,3,4]){
 const signatures=new Set();
 for(let i=0;i<240;i++){
  const seed=(Math.imul(i+1,2654435761))>>>0;
  let round=makeSudoku(n,seed);
  assert.deepEqual(round,makeSudoku(n,seed));
  assert.equal(round.initial.filter(v=>v===-1).length,{2:2,3:3,4:6}[n]);
  for(let r=0;r<n;r++){
   assert.equal(new Set(round.solution.slice(r*n,r*n+n)).size,n);
   assert.equal(new Set(round.solution.filter((_,j)=>j%n===r)).size,n);
   assert.ok(round.initial.slice(r*n,r*n+n).some(v=>v!==-1));
   assert.ok(round.initial.some((v,j)=>j%n===r&&v!==-1));
  }
  assert.equal(solutions(round.initial,n),1);
  assert.equal(countSolutions(round.initial),1);
  assert.deepEqual(eliminate(round.initial,n),round.solution);
  signatures.add(JSON.stringify(round.initial));
  const original=[...round.values],first=round.selected;
  round=replayReducer(round,{type:'hint'});assert.equal(round.hintLevel,1);
  round=replayReducer(round,{type:'hint'});assert.equal(round.hintLevel,2);assert.deepEqual(round.values,original);
  const second=round.values.findIndex((v,j)=>v===-1&&j!==first);
  round=replayReducer(round,{type:'select',index:second});assert.equal(round.hintLevel,0);
  round=replayReducer(round,{type:'symbol',value:(round.solution[second]+1)%n});assert.deepEqual(round.values,original);
  assert.equal(round.message,round.conflicts.length?sudokuSpeech.conflict:sudokuSpeech.observe);
  const clue=round.initial.findIndex(v=>v>=0);assert.equal(replayReducer(round,{type:'select',index:clue}),round);
  while(!round.complete){const at=round.selected;round=replayReducer(round,{type:'symbol',value:round.solution[at]});assert.equal(round.hintLevel,0);assert.deepEqual(round.conflicts,[]);}
  assert.deepEqual(round.values,round.solution);assert.equal(round.selected,null);
  assert.equal(replayReducer(round,{type:'symbol',value:0}),round);assert.equal(replayReducer(round,{type:'hint'}),round);
 }
 assert.ok(signatures.size>={2:4,3:80,4:180}[n],`${n}×${n} puzzle variety: ${signatures.size}`);
}
const values=new Map(),storage={getItem:key=>values.get(key)??null},account='test';
assert.equal(readSudokuSize(storage,account),2);
for(const [difficulty,stage,expected] of [['simple',3,2],['challenge',0,4],['auto',0,2],['auto',1,2],['auto',2,4],['auto',3,4],['garbage',3,2]]){
 values.set(`car-playroom-difficulty:${account}:sudoku`,difficulty);values.set(`car-playroom-sudoku-stage:${account}`,String(stage));assert.equal(readSudokuSize(storage,account),expected);
}
for(const n of [2,3,4]){values.set(sudokuSizeKey(account),String(n));assert.equal(readSudokuSize(storage,account),n);assert.equal(readSudokuSize(storage,'other'),2);}
assert.equal(readSudokuSize({getItem(){throw new Error('blocked');}},account),2);
// A wrong but currently non-repeating vehicle must not be described as a conflict.
let ambiguous=null;
for(let seed=1;seed<500&&!ambiguous;seed++){
 const r=makeSudoku(4,seed);
 for(let i=0;i<16;i++)if(r.values[i]===-1){const wrong=options(r.values,i,4).find(v=>v!==r.solution[i]);if(wrong!==undefined)ambiguous={...r,selected:i,wrongValue:wrong};}
}
assert.ok(ambiguous);
const wrong=replayReducer(ambiguous,{type:'symbol',value:ambiguous.wrongValue});assert.equal(wrong.message,sudokuSpeech.observe);assert.deepEqual(wrong.conflicts,[]);
console.log('PASS: 240 seeds × 3 sizes; exact blanks, clues in every row/column, unique and elimination-only solutions, hints, conflicts, immutable completion, preferences.');
