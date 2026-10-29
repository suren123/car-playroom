'use client';
import {useEffect,useState,type CSSProperties} from 'react';
import {Illustration} from '../../components/illustration';
import {vehicleIllustration} from '../illustration-assets';
import type {CarKind} from '../vehicle-catalog';
import {CargoArt} from './art';
import {deliveryMemories,type DeliveryArrival} from './feedback';
import type {State} from './model';
import './celebration.css';

// Decoration owns no game timers or state transitions. Unmount cancels its CSS
// animations, and interrupting the finale can only settle it, never replay it.
function useDecoration(finale=false,interrupted=false){
 const [running,setRunning]=useState(true);
 useEffect(()=>{
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduce=()=>{if(preference.matches)setRunning(false);};
  const hide=()=>{if(finale&&document.hidden)setRunning(false);};
  reduce();hide();preference.addEventListener('change',reduce);
  if(finale)document.addEventListener('visibilitychange',hide);
  return()=>{preference.removeEventListener('change',reduce);if(finale)document.removeEventListener('visibilitychange',hide);};
 },[finale]);
 useEffect(()=>{if(interrupted)setRunning(false);},[interrupted]);
 return {running,settle:()=>setRunning(false)};
}

export function DeliveryArrivalEffect({event}:{event:DeliveryArrival}){
 const {running,settle}=useDecoration();
 return <div className={`dv-arrival-effect ${event.orderComplete?'is-order-complete':''} ${running?'is-running':''}`} aria-hidden="true" data-delivered-cargo={event.cargo.join(',')} data-delivered-stop={event.stop}>
  <div className="dv-arrival-goods">{event.cargo.map(id=><span key={id}><CargoArt id={id}/></span>)}</div>
  <span className="dv-arrival-check">✓</span>
  {running&&<>
   <span className="dv-arrival-clock" onAnimationEnd={settle}/>
   {event.orderComplete&&<div className="dv-arrival-stars">{Array.from({length:8},(_,i)=><span key={i} style={{left:i%2?'51%':'5%',top:`${12+Math.floor(i/2)*17}%`,'--delay':`${200+(i%4)*90}ms`,'--dx':`${i%2?12:-12}px`} as CSSProperties}>✦</span>)}</div>}
  </>}
 </div>;
}

export function DeliveryVictoryScene({state,car,interrupted}:{state:State;car:CarKind;interrupted:boolean}){
 const {running,settle}=useDecoration(true,interrupted);
 return <div className={`dv-victory-scene ${running?'is-running':''}`} aria-hidden="true">
  <span className="dv-victory-parking">P<span>✓</span></span>
  <div className="dv-victory-car"><Illustration id={vehicleIllustration[car]} priority/></div>
  <div className="dv-victory-orders">{deliveryMemories(state).map((cargo,i)=><div key={i} className="dv-victory-order"><span className="dv-victory-order-check">✓</span>{cargo.map(id=><CargoArt key={id} id={id}/>)}</div>)}</div>
  {running&&<>
   <span className="dv-victory-clock" onAnimationEnd={settle}/>
   <div className="dv-victory-confetti">{Array.from({length:18},(_,i)=><span key={i} className={i%3===0?'is-paper':''} style={{left:`${5+i*5.2}%`,color:['#d8b155','#88ac8b','#dfab89'][i%3],'--delay':`${350+(i%6)*90}ms`,'--dx':`${(i%2?1:-1)*(8+i%4*6)}px`,'--turn':`${i%2?90:-90}deg`} as CSSProperties}>{i%3===0?'':'✦'}</span>)}</div>
  </>}
 </div>;
}
