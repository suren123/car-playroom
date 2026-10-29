'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {Check} from 'lucide-react';
import {Illustration} from '../../components/illustration';
import {VehicleArt} from '../../components/vehicle-art';
import type {SortRound,SortToken,SortBin,WorkshopAction} from './model';
import './sort.css';

function Cargo({token}:{token:SortToken|SortBin}){return token.vehicle?<VehicleArt kind={token.vehicle} color={token.color}/>:token.art?<Illustration id={token.art}/>:null;}
type Flight={token:SortToken;x:number;y:number;dx:number;dy:number;width:number;height:number;key:number};
export default function SortScene({round:r,act,paused=false}:{paused?:boolean;round:SortRound;act:(a:WorkshopAction)=>void}){
 const root=useRef<HTMLElement>(null),[flight,setFlight]=useState<Flight|null>(null),serial=useRef(0);
 useEffect(()=>{const settle=()=>{if(document.hidden)setFlight(null);};document.addEventListener('visibilitychange',settle);return()=>document.removeEventListener('visibilitychange',settle);},[]);
 useEffect(()=>{if(paused&&r.complete){
  // Completion decoration settles when the parent panel is opened.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setFlight(null);
 }},[paused,r.complete]);
 function park(bin:string){
  const token=r.tokens.find(t=>t.id===r.selected);
  if(token&&token.bin===bin){const base=root.current?.getBoundingClientRect(),from=root.current?.querySelector(`[data-token="${token.id}"]`)?.getBoundingClientRect(),to=root.current?.querySelector(`[data-bin="${bin}"] .ws-bin-parked`)?.getBoundingClientRect();
   if(base&&from&&to&&!matchMedia('(prefers-reduced-motion: reduce)').matches)setFlight({token,x:from.x-base.x,y:from.y-base.y,dx:to.x+to.width/2-from.x-from.width/2,dy:to.y+to.height/2-from.y-from.height/2,width:from.width,height:from.height,key:++serial.current});
  }
  act({type:'sort',bin});
 }
 return <section ref={root} className={`ws-board ws-sort ${r.complete&&!flight?'sort-organized':''}`} aria-label="分类停车场">
  <div className="ws-sort-items" aria-label="等待归位的物品">{r.tokens.map(token=><button key={token.id} data-token={token.id} className={`${r.selected===token.id?'ws-selected':''} ${r.parked[token.id]!==undefined?'sort-empty-place':''}`} aria-pressed={r.selected===token.id} aria-label={`选择${token.name} ${token.id+1}`} disabled={r.complete||r.parked[token.id]!==undefined} onClick={()=>act({type:'select',token:token.id})}><Cargo token={token}/><span>{token.name}</span></button>)}</div>
  <div className={`ws-sort-bins ${r.level===3?'ws-four-bins':''}`}>{r.bins.map(bin=><button data-bin={bin.id} className={`ws-sort-bin ${r.hint>1&&r.selected!==null&&r.tokens[r.selected].bin===bin.id?'ws-hint':''}`} key={bin.id} disabled={r.complete||r.selected===null} onClick={()=>park(bin.id)}><div className="ws-bin-sign"><Cargo token={bin}/><strong>{bin.name}</strong></div><div className="ws-bin-parked">{r.tokens.filter(t=>r.parked[t.id]===bin.id).map(token=><div key={token.id}><Cargo token={token}/></div>)}</div>{r.complete&&<span className="sort-neat-sign"><Check/>整理好了</span>}</button>)}</div>
  {flight&&<div className="sort-flight" key={flight.key} aria-hidden="true" onAnimationEnd={()=>setFlight(current=>current?.key===flight.key?null:current)} style={{left:flight.x,top:flight.y,width:flight.width,height:flight.height,'--fly-x':`${flight.dx}px`,'--fly-y':`${flight.dy}px`} as CSSProperties}><Cargo token={flight.token}/></div>}
 </section>;
}
