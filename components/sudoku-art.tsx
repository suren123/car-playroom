import {Illustration} from './illustration';
import {sudokuKinds,type SudokuSize} from '../lib/replay-games';
import type {CSSProperties} from 'react';

// Shared PNGs and layout for the home icon and difficulty previews.
export function SudokuPreview({size=2,home=false}:{size?:SudokuSize;home?:boolean}){
 return <div className={`sudoku-preview ${home?'sudoku-home-icon':''}`} style={{'--size':size} as CSSProperties} aria-hidden="true">
  {Array.from({length:size*size},(_,i)=><span key={i} className={i===size*size-1?'preview-question':''}>
   {i===size*size-1?'?':<Illustration id={sudokuKinds[(Math.floor(i/size)+i%size)%size]} priority/>}
  </span>)}
 </div>;
}
