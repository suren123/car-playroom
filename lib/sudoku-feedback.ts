import type {SudokuRound} from './replay-games';

export type SudokuFeedback = {cell:number; rows:number[]; columns:number[]};

// Placed vehicles are immutable: initially full lines never transition to full,
// and a newly completed line cannot be celebrated again in the same round.
export function sudokuFeedback(before:SudokuRound,after:SudokuRound):SudokuFeedback|null {
 const cell=before.values.findIndex((value,i)=>value===-1&&after.values[i]!==-1);
 if(before.complete||before.size!==after.size||cell<0)return null;
 const rows:number[]=[],columns:number[]=[];
 if(!after.complete)for(let line=0;line<after.size;line++){
  const row=Array.from({length:after.size},(_,i)=>line*after.size+i);
  const column=Array.from({length:after.size},(_,i)=>i*after.size+line);
  if(row.some(i=>before.values[i]===-1)&&row.every(i=>after.values[i]>=0))rows.push(line);
  if(column.some(i=>before.values[i]===-1)&&column.every(i=>after.values[i]>=0))columns.push(line);
 }
 return {cell,rows,columns};
}
