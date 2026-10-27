'use client';
import {useEffect,useRef,useState} from 'react';

export default function GameBackButton({onBack}:{onBack:()=>void}){
 const [busy,setBusy]=useState(false),until=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 return <button className="game-back" aria-label="返回" disabled={busy} onClick={event=>{
  if(event.detail>1||Date.now()<until.current)return;
  until.current=Date.now()+550;setBusy(true);
  timer.current=setTimeout(()=>setBusy(false),550);
  onBack();
 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m11 5-7 7 7 7M4 12h16"/></svg><span>返回</span></button>;
}
