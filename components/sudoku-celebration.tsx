'use client';
import {useEffect,type CSSProperties} from 'react';
import {Illustration} from './illustration';
import type {CarKind} from '../games/vehicle-catalog';

const colors=['#d9aa43','#8db99b','#e8b39b'];

export function SudokuCelebration({running,onSettled}:{running:boolean;onSettled:()=>void}){
 useEffect(()=>{
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const settle=()=>{if(preference.matches)onSettled();};
  settle();preference.addEventListener('change',settle);
  return()=>preference.removeEventListener('change',settle);
 },[onSettled]);
 return <div className={`sudoku-celebration ${running?'is-celebrating':''}`} aria-hidden="true">
  <div className="sudoku-festival-lights">{Array.from({length:20},(_,i)=>{
   const side=Math.floor(i/5),position=12+(i%5)*19;
   return <i key={i} style={{left:side===0?`${position}%`:side===1?'100%':side===2?`${100-position}%`:'0%',top:side===0?'0%':side===1?`${position}%`:side===2?'100%':`${100-position}%`,'--delay':`${300+i*40}ms`} as CSSProperties}/>;
  })}</div>
  {running&&<>
   <span className="sudoku-celebration-clock" onAnimationEnd={onSettled}/>
   <div className="sudoku-confetti">{Array.from({length:18},(_,i)=><span key={i} className={i%3===0?'paper':'star'} style={{left:i%2?'calc(100% + 7px)':'-19px',top:`${8+Math.floor(i/2)*10}%`,color:colors[i%3],'--drift':`${(i%2?1:-1)*(8+(i%3)*5)}px`,'--turn':`${i%2?105:-105}deg`,'--delay':`${600+(i%5)*70}ms`} as CSSProperties}>{i%3===0?'':'✦'}</span>)}</div>
  </>}
 </div>;
}

export function SudokuVictoryParade({vehicles,running}:{vehicles:readonly CarKind[];running:boolean}){
 return <div className={`sudoku-parade ${running?'is-celebrating':''}`} aria-hidden="true">
  <span className="sudoku-parade-sign">P<span>✓</span></span>
  <div className="sudoku-parade-cars">{vehicles.map((kind,i)=><span key={kind} style={{'--delay':`${600+i*100}ms`} as CSSProperties}><Illustration id={kind} priority/></span>)}</div>
  <span className="sudoku-parade-flag">⚑</span>
 </div>;
}
