'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {gameNames,type GameId} from '../games/registry';
import {activateResources,createGameResources,deactivateResources} from '../lib/game-resources';
import type {ResourceProgress,ResourceSession} from '../lib/resource-loader';
import {stopSpeech} from '../lib/speech';
import {useGameNavigation} from '../hooks/use-game-navigation';
import {useGameSession} from '../hooks/use-game-session';
import GameBackButton from './game-back-button';
import {VehicleArt} from './vehicle-art';
import {GameResourceContext} from './game-resource-context';

export default function GameResourceGate({account,game,children}:{account:string;game:GameId;children:ReactNode}){
 const {goHome}=useGameNavigation(account,game);useGameSession(account);
 const owner=useRef<ResourceSession|null>(null),cancelled=useRef(false),busy=useRef(false);
 const [progress,setProgress]=useState<ResourceProgress|null>(null),[ready,setReady]=useState(false),[visible,setVisible]=useState(false);
 useEffect(()=>{
  cancelled.current=false;const session=createGameResources(game);owner.current=session;setReady(false);stopSpeech();
  const visibility=()=>setVisible(!document.hidden);visibility();document.addEventListener('visibilitychange',visibility);
  void load(session);
  return()=>{cancelled.current=true;owner.current=null;busy.current=false;document.removeEventListener('visibilitychange',visibility);stopSpeech();deactivateResources(session);session.dispose();};
 },[account,game]);
 async function load(session:ResourceSession){
  busy.current=true;
  try{
   await session.load(value=>{if(owner.current===session&&!cancelled.current)setProgress(value);});
   if(owner.current!==session||cancelled.current)return;
   activateResources(session);setReady(true);
  }catch{/* The loader reports a retryable error; cancellation stays silent. */}
  finally{if(owner.current===session)busy.current=false;}
 }
 function back(){if(cancelled.current)return;cancelled.current=true;const session=owner.current;if(session){deactivateResources(session);session.dispose();}stopSpeech();goHome();}
 // Once mounted, hiding the document must pause the game, not unmount its round.
 const entered=useRef(false);if(ready&&visible)entered.current=true;
 if(ready&&entered.current)return <GameResourceContext.Provider value={owner.current!.prepared}>{children}</GameResourceContext.Provider>;
 const failed=progress?.phase==='failed',preparing=progress?.phase==='prepare'||progress?.phase==='ready';
 const percent=progress?Math.floor(progress.loaded/Math.max(progress.total,1)*100):0;
 return <main className="game-preparation" aria-busy={!failed}>
  <header><GameBackButton onBack={back}/><strong>{gameNames[game]}</strong></header>
  <section className="game-preparation-card" aria-labelledby="prepare-title">
   <VehicleArt kind="truck"/>
   <h1 id="prepare-title">{failed?'有些资源没有准备好':'正在准备小汽车'}</h1>
   <p role="status">{failed?'检查网络后，再试一次。':ready&&!visible?'准备好了，回来就能玩。':preparing?'正在准备画面和声音':'先把小汽车和声音准备好，玩起来更顺畅。'}</p>
   <progress aria-label="资源下载进度" max={100} value={percent}/>
   <p className="preparation-progress">{percent}%{progress?` · ${progress.ready} / ${progress.count} 项已准备好`:''}</p>
   {failed&&<button className="room-primary" onClick={()=>{if(owner.current&&!busy.current&&!cancelled.current)void load(owner.current);}}>重试</button>}
  </section>
 </main>;
}
