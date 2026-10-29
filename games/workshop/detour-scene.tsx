'use client';
import {useEffect,useRef,type CSSProperties} from 'react';
import {Flag,Play,Undo2,Check} from 'lucide-react';
import {Illustration} from '../../components/illustration';
import {routeSolution,visitedWaypoints,type DetourRound,type WorkshopAction} from './model';
import {destinationIllustration} from '../illustration-assets';
import {stopNames} from '../delivery/model';
import {routeHeading,routeMotion} from './route-motion';
import './detour.css';

export default function DetourScene({round:r,act,animate,paused}:{round:DetourRound;act:(a:WorkshopAction)=>void;animate:boolean;paused:boolean}){
 const vehicle=useRef<HTMLDivElement>(null),drive=useRef<Animation|null>(null);
 const visited=visitedWaypoints(r),nextTarget=r.via[visited]??r.goal,last=r.path.at(-1)!,previous=r.path.at(-2)??last;
 const hintPath=r.hint?routeSolution(r,last,[nextTarget]):null;
 useEffect(()=>{
  if(!r.complete||!vehicle.current||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  drive.current=vehicle.current.animate(routeMotion(r.path,r.size),{duration:3200,easing:'linear'});
  return()=>{drive.current?.cancel();drive.current=null;};
 },[r.complete,r.path,r.size]);
 useEffect(()=>{if(r.complete&&(!animate||paused))drive.current?.finish();},[r.complete,animate,paused]);
 const angle=previous===last?0:routeHeading(previous,last,r.size);
 return <section className="ws-board ws-detour" aria-label="绕行路线地图">
  <div className="ws-map-wrap"><div className="ws-map" style={{gridTemplateColumns:`repeat(${r.size},1fr)`}}>{Array.from({length:r.size*r.size},(_,cell)=>{
   const wall=r.walls.includes(cell),waypoint=r.via.indexOf(cell),onPath=r.path.includes(cell);
   return <button key={cell} aria-label={wall?`施工 ${cell+1}`:cell===r.goal?'终点':waypoint>=0?`任务点 ${waypoint+1}`:`道路 ${cell+1}`} disabled={r.complete} className={`${wall?'ws-wall':''} ${onPath?'ws-path':''} ${hintPath?.[1]===cell?'ws-hint':''} ${cell===r.goal?'ws-goal':''}`} onClick={()=>act({type:'step',cell})}>
    {wall?<Illustration id="cargo-barrier"/>:cell===r.goal?<Illustration id={destinationIllustration[r.destinations[r.via.length]]}/>:waypoint>=0?<><Illustration id={destinationIllustration[r.destinations[waypoint]]}/><b>{waypoint+1}</b></>:cell===r.start?<span className="detour-start">起点</span>:onPath?<span className="ws-path-dot"/>:null}
   </button>;
  })}<svg className="ws-path-lines" viewBox={`0 0 ${r.size*100} ${r.size*100}`} aria-hidden="true"><polyline points={r.path.map(cell=>`${cell%r.size*100+50},${Math.floor(cell/r.size)*100+50}`).join(' ')} fill="none" stroke="#568b77" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/></svg>
  <div className="detour-drive-layer" aria-hidden="true"><div ref={vehicle} className="detour-map-car" data-vehicle={r.car} style={{left:`${(last%r.size+.5)/r.size*100}%`,top:`${(Math.floor(last/r.size)+.5)/r.size*100}%`,width:`${86/r.size}%`,height:`${86/r.size}%`,transform:`translate(-50%,-50%) rotate(${angle}deg)`} as CSSProperties}><Illustration id={`overhead-${r.car}`}/></div></div>
  </div></div>
  <aside className="ws-map-mission"><span className="ws-label">这次的路线</span><Illustration id={r.car}/>{r.via.map((_,i)=><div className={i<visited?'ws-visited':''} key={i}><b>{i+1}</b><Illustration id={destinationIllustration[r.destinations[i]]}/><span>{stopNames[r.destinations[i]]}</span>{i<visited&&<Check/>}</div>)}<div><Flag/><Illustration id={destinationIllustration[r.destinations[r.via.length]]}/><span>{stopNames[r.destinations[r.via.length]]}</span></div>{!r.complete?<><p>从小车旁边一格格连接。<br/>可以撤回，也可以走回头路。</p><button className="ws-secondary" onClick={()=>act({type:'undo'})}><Undo2/>撤回一步</button><button className="ws-primary" onClick={()=>act({type:'check'})}><Play/>检查路线</button></>:<p className="detour-arrived">沿着你画的路<br/>平安到{stopNames[r.destinations[r.via.length]]}</p>}</aside>
 </section>;
}
