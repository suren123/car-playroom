'use client';
import {useEffect} from 'react';
import {clearRetiredRounds} from '../lib/retired-rounds';

export function useGameSession(account:string,enabled=true){
 useEffect(()=>{
  if(!enabled)return;
  clearRetiredRounds(account);
  // Browser back/forward cache can resurrect a whole page, including React state.
  const shown=(event:PageTransitionEvent)=>{if(event.persisted)window.location.reload();};
  window.addEventListener('pageshow',shown);
  return()=>window.removeEventListener('pageshow',shown);
 },[account,enabled]);
}
