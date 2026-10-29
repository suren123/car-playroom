'use client';
import {useEffect,useRef,useState,type CSSProperties,type PointerEvent} from 'react';
import {ArrowLeft,Play,Undo2} from 'lucide-react';
import {Illustration} from '../../components/illustration';
import {carCatalog,type CarKind} from '../vehicle-catalog';
import {QueueDeparture} from './tour-scene';
import type {QueueRound,WorkshopAction} from './model';
import './queue.css';

type Drag={car:CarKind;pointer:number;startX:number;startY:number;x:number;y:number;moved:boolean;target:number|'tray'|null};
const carName=(car:CarKind)=>carCatalog.find(c=>c.id===car)!.name;
export default function QueueScene({round:r,act,paused}:{round:QueueRound;act:(a:WorkshopAction)=>void;paused:boolean}){
 const [drag,setDrag]=useState<Drag|null>(null),active=useRef<Drag|null>(null),suppressClick=useRef(0);
 const [selected,setSelected]=useState<CarKind|null>(null);
 const disabled=paused||r.complete;
 const cancel=()=>{active.current=null;setDrag(null);};
 // Cancel external pointer interaction when the shared pause state changes.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{if(paused){if(active.current)suppressClick.current=Infinity;active.current=null;setDrag(null);setSelected(null);}},[paused]);
 useEffect(()=>{const hide=()=>{if(document.hidden){if(active.current)suppressClick.current=Infinity;active.current=null;setDrag(null);setSelected(null);}};document.addEventListener('visibilitychange',hide);return()=>{active.current=null;document.removeEventListener('visibilitychange',hide);};},[]);
 function down(e:PointerEvent<HTMLButtonElement>,car:CarKind){
  if(disabled||active.current||!e.isPrimary||e.button!==0)return;
  suppressClick.current=0;
  const next:Drag={car,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,moved:false,target:null};
  active.current=next;e.currentTarget.setPointerCapture(e.pointerId);
 }
 function move(e:PointerEvent<HTMLButtonElement>){
  const d=active.current;if(!d||e.pointerId!==d.pointer)return;if(disabled){cancel();return;}
  const moved=d.moved||Math.hypot(e.clientX-d.startX,e.clientY-d.startY)>8;if(!moved)return;
  const hit=document.elementFromPoint(e.clientX,e.clientY),slot=hit?.closest('[data-queue-slot]');
  const target=slot?Number(slot.getAttribute('data-queue-slot')):hit?.closest('[data-queue-tray]')?'tray':null;
  const next={...d,x:e.clientX,y:e.clientY,moved,target} as Drag;active.current=next;setDrag(next);
 }
 function up(e:PointerEvent<HTMLButtonElement>){
  const d=active.current;if(!d||d.pointer!==e.pointerId)return;
  cancel();if(d.moved){suppressClick.current=performance.now()+350;setSelected(null);if(!disabled&&d.target!==null)act({type:'queue-place',car:d.car,slot:d.target==='tray'?null:d.target});}
 }
 const handlers=(car:CarKind)=>({onPointerDown:(e:PointerEvent<HTMLButtonElement>)=>down(e,car),onPointerMove:move,onPointerUp:up,onPointerCancel:()=>{suppressClick.current=performance.now()+350;cancel();},onLostPointerCapture:cancel});
 const clickAllowed=()=>!disabled&&performance.now()>=suppressClick.current;
 const firstEmpty=r.order.findIndex((_,i)=>!r.slots[i]),correctSoFar=r.slots.every((car,i)=>!car||car===r.order[i]);
 return <section className={`ws-board ws-queue ${drag?'queue-dragging':''}`} aria-label="排队调度场">
  <div className="ws-clue-strip"><span className="ws-label">{r.level===1?'车票顺序':'前后线索'}</span>{r.level===1?<div className="ws-ticket">{r.order.map((car,i)=><span key={car}><small>{i+1}</small><Illustration id={car}/></span>)}</div>:<div className="ws-relations">{r.clues.map(([a,b])=><div key={a}><Illustration id={a}/><span>在前<ArrowLeft/></span><Illustration id={b}/></div>)}</div>}</div>
  <div className="ws-lineup" style={{'--cars':r.order.length} as CSSProperties} aria-label="你安排的队伍">{r.order.map((_,i)=>{const car=r.slots[i];return <button type="button" data-queue-slot={i} key={i} disabled={disabled} aria-label={`第${i+1}个车位${car?'，'+carName(car):'，空位'}`} aria-pressed={!!car&&selected===car} className={`ws-parking-slot ${car?'queue-occupied':''} ${selected===car&&car?'queue-selected':''} ${drag?.target===i?'queue-drop-target':''} ${(r.checked||r.hint>0)&&car&&car!==r.order[i]?'ws-mismatch':''} ${r.hint&&correctSoFar&&i===firstEmpty?'ws-hint':''}`} {...(car?handlers(car):{})} onClick={()=>{if(!clickAllowed())return;if(selected&&selected!==car){act({type:'queue-place',car:selected,slot:i});setSelected(null);}else setSelected(car??null);}}><b>{i+1}</b>{car?<Illustration id={car}/>:<span className="ws-slot-empty">拖到这里</span>}</button>;})}</div>
  {r.complete?<QueueDeparture round={r}/>:<div className={`ws-choice-tray ${drag?.target==='tray'?'queue-tray-target':''}`} data-queue-tray aria-label="待排队车辆，可拖回这里">{r.cars.map(car=><button type="button" className={`ws-car-choice ${r.slots.includes(car)?'ws-used':''} ${r.hint>1&&correctSoFar&&car===r.order[firstEmpty]?'ws-hint':''}`} key={car} disabled={disabled||r.slots.includes(car)} {...handlers(car)} onClick={()=>{if(clickAllowed()){act({type:'queue',car});setSelected(null);}}} aria-label={`安排${carName(car)}`}><Illustration id={car}/><span>{carName(car)}</span></button>)}</div>}
  <div className={`ws-controls ${r.complete?'ws-reserved':''}`}><button className="ws-secondary" disabled={disabled||!r.history.length} onClick={()=>{setSelected(null);act({type:'undo'});}}><Undo2/>撤回一步</button><button className="ws-primary" disabled={disabled||r.slots.filter(Boolean).length!==r.order.length} onClick={()=>act({type:'check'})}><Play/>排好出发</button></div>
  {drag&&!disabled&&<div className="queue-drag-car" style={{left:drag.x,top:drag.y}} aria-hidden="true"><Illustration id={drag.car}/></div>}
 </section>;
}
