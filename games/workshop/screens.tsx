import QueueScene from './queue-scene';
import JunctionScene from './junction';
import DetourScene from './detour-scene';
import {ListenTour} from './tour-scene';
import type {TrafficRound} from './model';
import type {CSSProperties} from 'react';
import {ArrowRight,Check,Flag,Hand,Undo2,Play,Eye,Volume2} from 'lucide-react';
import {Illustration} from '../../components/illustration';
import RepairScene from './repair-scene';
import SortScene from './sort-scene';
import {bridgeFilled,bridgeSolution,trafficCanGo,stations,type WorkshopRound,type WorkshopAction} from './model';

function Station({id}:{id:string}){const stop=stations.find(s=>s.id===id)!;return <><Illustration id={stop.art}/><span>{stop.name}</span></>;}
export default function WorkshopScreen({round,act,routeAudio,motion=null,paused=false,celebrate=false}:{celebrate?:boolean;paused?:boolean;motion?:TrafficRound|null;round:WorkshopRound;act:(a:WorkshopAction)=>void;routeAudio:()=>void}){
 const r=round,disabled=r.complete;
 const undo=<button disabled={disabled} className="ws-secondary" onClick={()=>act({type:'undo'})}><Undo2/>撤回一步</button>;
 if(r.game==='queue')return <QueueScene key={r.seed} round={r} act={act} paused={paused}/>;
 if(r.game==='bridge'){
  const solution=bridgeSolution(r,r.placed),next=solution?.[r.placed.length];
  return <section className="ws-board ws-bridge" aria-label="桥梁工地">
   <div className="ws-project-note"><span>河面宽 <b>{r.span}</b> 格 · 已铺 <b>{bridgeFilled(r)}</b> 格</span>{!disabled&&<button className="ws-secondary" aria-pressed={r.cooperate} onClick={()=>act({type:'cooperate'})}>{r.cooperate?'双人轮流':'自己搭桥'}</button>}</div>
   <div className="ws-river"><div className="ws-river-shine"/><span className="ws-bank ws-bank-left"/><span className="ws-bank ws-bank-right"/><Illustration id={r.car} align="bottom-left" className={`ws-crossing-car ${disabled?'ws-crossed':''}`}/><Flag className="ws-bank-flag"/>
    <div className="ws-bridge-cells" style={{gridTemplateColumns:`repeat(${r.span},1fr)`}}>{r.pattern.map((material,i)=><div key={i} className={`ws-support ${r.level===3?material:''}`}><span>{i+1}</span></div>)}</div>
    <div className="ws-bridge-deck">{r.placed.map((id,index)=>{const p=r.pieces.find(p=>p.id===id)!,left=r.placed.slice(0,index).reduce((sum,previous)=>sum+r.pieces.find(piece=>piece.id===previous)!.length,0);return <div key={id} className={`ws-plank ${p.material}`} style={{left:`${left/r.span*100}%`,width:`${p.length/r.span*100}%`}}>{Array.from({length:p.length},(_,i)=><span key={i}/>)}</div>;})}</div>
   </div>
   {r.complete?<div className="bridge-result-pieces" aria-label="搭好这座桥用的桥板"><strong>这座桥用了</strong>{r.placed.map(id=>{const p=r.pieces.find(piece=>piece.id===id)!;return <span className="bridge-result-piece" key={id}><span className={`ws-plank ${p.material}`} style={{width:28*p.length}}>{Array.from({length:p.length},(_,i)=><span key={i}/>)}</span><small>{p.length} 格</small></span>;})}</div>:<div className="ws-choice-tray ws-piece-tray" aria-label="可用桥板">{r.pieces.map(p=><button key={p.id} className={`ws-piece-choice ${r.placed.includes(p.id)?'ws-used':''} ${r.hint>1&&p.id===next?'ws-hint':''}`} disabled={disabled||r.placed.includes(p.id)} aria-label={`${p.length}格${p.material==='wood'?'木':'蓝'}桥板 ${p.id+1}`} onClick={()=>act({type:'bridge',piece:p.id,actor:r.turn})}><span className={`ws-plank ${p.material}`} style={{width:32*p.length}}>{Array.from({length:p.length},(_,i)=><span key={i}/>)}</span><small>{p.length} 格</small></button>)}</div>}
   <div className={`ws-controls ${disabled?'ws-reserved':''}`}>{r.cooperate&&<span className="ws-turn">轮到{r.turn==='child'?'小司机':'大人'}选桥板</span>}{undo}<button className="ws-primary" onClick={()=>act({type:'check'})}><Play/>小车试桥</button></div>
  </section>;
 }
 if(r.game==='sort')return <SortScene key={r.seed} round={r} act={act} paused={paused}/>;
 if(r.game==='repair')return <RepairScene key={r.seed} round={r} act={act} paused={paused}/>;
 if(r.game==='traffic'){
  if(r.junction)return <JunctionScene round={r} motion={motion} act={act}/>;
  const display=motion??r,scene=display.scenes[Math.min(display.index,display.scenes.length-1)],moving=!!motion;
  return <section className={`ws-board ws-traffic ${moving?scene.light==='green'?'ws-simple-driving':'ws-simple-stopping':''}`} aria-label="交通观察路口">
   <div className="ws-crossroad"><div className="ws-vertical-road"/><div className="ws-horizontal-road"/><div className="ws-crosswalk"/>
    <div className={`ws-signal ${scene.light}`} aria-label={scene.light==='red'?'红灯':'绿灯'}><i/><i/></div>
    <Illustration id={scene.car} className="ws-driver"/><Illustration id={scene.destination} className="ws-destination"/>
    {scene.pedestrian&&<div className="ws-pedestrian"><Illustration id="pedestrian"/><span>行人过街</span></div>}
    {scene.priority&&<div className="ws-priority"><Illustration id="ambulance"/><span>救援车先行</span></div>}
    <span className="ws-stop-line"/>
   </div>
   <div className={`ws-traffic-controls ${disabled?'ws-reserved':''}`}><button className={`ws-stop-button ${r.hint>1&&!trafficCanGo(scene)?'ws-hint':''}`} onClick={()=>act({type:'traffic',go:false})}><Hand/><span>停一停</span></button><button className={`ws-go-button ${r.hint>1&&trafficCanGo(scene)?'ws-hint':''}`} onClick={()=>act({type:'traffic',go:true})}><ArrowRight/><span>可以走</span></button></div>
   <div className="ws-safe-stops" aria-label="已完成观察的车辆">{r.arrived.map((car,i)=><span key={i}><Illustration id={car}/><Check/></span>)}</div>
  </section>;
 }
 if(r.game==='listen'&&r.complete)return <ListenTour round={r}/>;
 if(r.game==='listen')return <section className="ws-board ws-listen" aria-label="巡游路线记忆">
  <div className="ws-memory-card"><div className="ws-project-note"><strong>{!r.covered?'记住这些站点':'记得去哪儿吗？'}</strong><div className="ws-memory-actions"><button disabled={r.covered} className={`ws-primary ${r.covered?'ws-reserved':''}`} onClick={()=>act({type:'cover'})}><Eye/>记好了，盖起来</button><button className="ws-secondary" onClick={routeAudio}><Volume2/>再听一遍</button></div></div><div className="ws-memory-route">{r.route.map((stop,i)=><div key={i}><b>{i+1}</b>{!r.covered||r.hint>0||disabled?<Station id={stop}/>:<span className="ws-hidden-stop">?</span>}</div>)}</div></div>
  <div className="ws-route-plan" aria-label="你安排的巡游路线"><aside className="ws-route-driver"><Illustration id={r.car}/><span>我的巡游车</span></aside>{r.route.map((_,i)=><div key={i} className={r.checked&&r.plan[i]!==r.route[i]?'ws-mismatch':''}><b>{i+1}</b>{r.plan[i]?<Station id={r.plan[i]}/>:<span>＋</span>}</div>)}</div>
  <div className="ws-station-choices">{r.options.map(stop=><button key={stop} disabled={disabled||!r.covered||r.plan.length===r.route.length} onClick={()=>act({type:'station',station:stop})}><Station id={stop}/></button>)}</div>
  <div className={`ws-controls ${disabled||!r.covered?'ws-reserved':''}`}>{undo}<button className="ws-primary" disabled={r.plan.length!==r.route.length} onClick={()=>act({type:'check'})}><Play/>按路线出发</button></div>
 </section>;
 return <DetourScene key={r.seed} round={r} act={act} animate={celebrate} paused={paused}/>;
}
