'use client';
import {useEffect,useLayoutEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {CargoArt} from './art';
import {flightFrames,type CargoFlight} from './transport';

function Flight({flight,paused,onLand}:{flight:CargoFlight;paused:boolean;onLand:(id:number)=>void}){
 const node=useRef<HTMLSpanElement>(null),animation=useRef<Animation|null>(null),finish=useRef(onLand);
 useLayoutEffect(()=>{finish.current=onLand;},[onLand]);
 useLayoutEffect(()=>{
  const el=node.current;if(!el)return;
  let disposed=false,done=false;const settle=()=>{if(!disposed&&!done){done=true;finish.current(flight.id);}};
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  if(reduce.matches||!el.animate){queueMicrotask(settle);return()=>{disposed=true;};}
  const a=el.animate(flightFrames(flight.from,flight.to),{duration:flight.kind==='load'?560:500,delay:flight.delay??0,easing:'cubic-bezier(.22,.65,.3,1)',fill:'both'});animation.current=a;
  a.onfinish=settle;
  const changed=()=>{if(reduce.matches)settle();};reduce.addEventListener('change',changed);
  return()=>{disposed=true;a.onfinish=null;a.cancel();animation.current=null;reduce.removeEventListener('change',changed);};
 },[flight]);
 useLayoutEffect(()=>{const a=animation.current;if(a){if(paused)a.pause();else a.play();}},[paused,flight]);
 // A paused-aware fallback prevents a lost/cancelled animation from locking play.
 useEffect(()=>{if(paused)return;const elapsed=Number(animation.current?.currentTime)||0;const timer=setTimeout(()=>finish.current(flight.id),Math.max(100,1000+(flight.delay??0)-elapsed));return()=>clearTimeout(timer);},[paused,flight]);
 return <span ref={node} className="dv-cargo-flight" data-flight-kind={flight.kind} data-flight-item={flight.item} style={{left:flight.from.x-flight.from.size/2,top:flight.from.y-flight.from.size/2,width:flight.from.size,height:flight.from.size}}><CargoArt id={flight.item}/></span>;
}
export function CargoFlights({flights,paused,onLand}:{flights:CargoFlight[];paused:boolean;onLand:(id:number)=>void}){
 if(!flights.length||typeof document==='undefined')return null;
 return createPortal(<div className="dv-flight-layer" aria-hidden="true">{(flights[0]?.kind==='unload'?flights:flights.slice(0,2)).map(flight=><Flight key={flight.id} flight={flight} paused={paused} onLand={onLand}/>)}</div>,document.body);
}
