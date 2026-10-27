'use client';
import {useEffect,useRef} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import type {GameId} from '../games/registry';
import {takeGameEntry,validGameEntry,type GameEntry} from '../lib/game-navigation';

export function useGameNavigation(account:string,game?:GameId){
 const router=useRouter(),query=useSearchParams().toString(),entry=useRef<GameEntry|null>(null);
 useEffect(()=>{
  if(!game)return;
  if(!entry.current||!validGameEntry(entry.current,account,game)){
   const carried=takeGameEntry(account,game),saved=window.history.state?.carGameEntry;
   entry.current=carried??(validGameEntry(saved,account,game)?saved:{account,game,home:'/game'});
  }
  // Merge into the framework's existing history state; retain its route keys.
  window.history.replaceState({...window.history.state,carGameEntry:entry.current},'');
 },[account,game,query]);
 return {goHome:()=>router.replace(entry.current?.home??'/game')};
}
