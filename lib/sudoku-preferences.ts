import type {SudokuSize} from './replay-games';

type StorageReader=Pick<Storage,'getItem'>;
export const sudokuSizeKey=(account:string)=>`car-playroom-sudoku-size:${account}`;
export function readSudokuSize(storage:StorageReader,account:string):SudokuSize{
 try{
  const saved=storage.getItem(sudokuSizeKey(account));
  if(saved==='2'||saved==='3'||saved==='4')return Number(saved) as SudokuSize;
  const difficulty=storage.getItem(`car-playroom-difficulty:${account}:sudoku`);
  if(difficulty==='challenge')return 4;
  if(difficulty==='simple')return 2;
  if(difficulty==='auto'||difficulty===null){
   const stage=storage.getItem(`car-playroom-sudoku-stage:${account}`);
   if(stage==='2'||stage==='3')return 4;
  }
 }catch{/* Storage is optional; a fresh game remains available. */}
 return 2;
}
