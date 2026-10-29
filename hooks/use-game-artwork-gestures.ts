'use client';
import {useEffect} from 'react';

/** Prevent image previews/dragging only on game artwork; retain browser zoom. */
export function useGameArtworkGestures(){
 useEffect(()=>{
  const prevent=(event:Event)=>{
   const target=event.target;
   if(!(target instanceof Element)||target.closest('.parent-panel'))return;
   if(target.closest('.workshop,.dv-app,.sudoku-room,.spot-room')&&target.closest('.illustration-art,.repair-car,.repair-part-art,.vehicle-art,.dv-cargo-art,.dv-stop-art'))event.preventDefault();
  };
  document.addEventListener('contextmenu',prevent);
  document.addEventListener('dragstart',prevent);
  return()=>{document.removeEventListener('contextmenu',prevent);document.removeEventListener('dragstart',prevent);};
 },[]);
}
