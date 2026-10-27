'use client';
import {useEffect,useState,type ReactNode} from 'react';
import type {GameId} from '../games/registry';

// A short, renewable lease prevents two tabs from modifying the same local round.
const owner=typeof crypto!=='undefined'?crypto.randomUUID():String(Math.random());
const duration=15000;
export default function RoundLease({account,game,children}:{account:string;game:GameId;children:ReactNode}){
 const [status,setStatus]=useState<'checking'|'owned'|'busy'|'unavailable'>('checking');const [attempt,setAttempt]=useState(0);
 useEffect(()=>{const key=`car-playroom-lease:${account}:${game}`;let stopped=false,holding=false;
  function check(){if(stopped)return;try{const current=JSON.parse(localStorage.getItem(key)||'null') as {owner:string;until:number}|null;const now=Date.now();if(current&&current.owner!==owner&&current.until>now){holding=false;setStatus('busy');return;}localStorage.setItem(key,JSON.stringify({owner,until:now+duration}));const verified=JSON.parse(localStorage.getItem(key)||'null') as {owner:string}|null;holding=verified?.owner===owner;setStatus(holding?'owned':'busy');}catch{holding=false;setStatus('unavailable');}}
  function release(){try{const current=JSON.parse(localStorage.getItem(key)||'null') as {owner:string}|null;if(current?.owner===owner)localStorage.removeItem(key);}catch{/* Storage is unavailable. */}holding=false;}
  const changed=(event:StorageEvent)=>{if(event.key!==key||!holding)return;try{const value=JSON.parse(event.newValue||'null') as {owner:string}|null;if(value&&value.owner!==owner){holding=false;setStatus('busy');}}catch{holding=false;setStatus('busy');}};
  const visibility=()=>{if(!document.hidden)check();};check();const timer=window.setInterval(()=>{if(holding)check();},5000);window.addEventListener('storage',changed);window.addEventListener('pagehide',release);document.addEventListener('visibilitychange',visibility);
  return()=>{stopped=true;clearInterval(timer);window.removeEventListener('storage',changed);window.removeEventListener('pagehide',release);document.removeEventListener('visibilitychange',visibility);release();};
 },[account,game,attempt]);
 if(status==='checking')return <main className="playroom" aria-busy="true"><p>小汽车准备中……</p></main>;
 if(status==='busy')return <main className="playroom"><h1>这局正在另一页玩</h1><p>先在另一页退出，再回来继续。如果另一页已经关闭，最多等待 15 秒再试。</p><button className="room-primary" onClick={()=>setAttempt(x=>x+1)}>再试一次</button><a href="/game/library">返回游戏列表</a></main>;
 return <>{status==='unavailable'&&<p role="status" className="storage-notice">本机无法保存进度，请保持页面打开。</p>}{children}</>;
}
