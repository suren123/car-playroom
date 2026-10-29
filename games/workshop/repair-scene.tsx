'use client';
import {useContext,useEffect,useId,useRef,useState} from 'react';
import {Check,Play,ArrowRight} from 'lucide-react';
import {GameResourceContext} from '../../components/game-resource-context';
import {Illustration} from '../../components/illustration';
import {illustrationUrl} from '../illustration-assets';
import {carCatalog} from '../vehicle-catalog';
import {repairMasters,repairPartName,type Region} from './repair-master';
import {toolNames,type Tool,type RepairRound,type RepairPart,type WorkshopAction} from './model';
import './repair.css';

function Shape({region,...props}:{region:Region;fill?:string;stroke?:string;strokeWidth?:number;className?:string}){
 return region.round?<ellipse cx={region.x+region.w/2} cy={region.y+region.h/2} rx={region.w/2} ry={region.h/2} {...props}/>:<rect x={region.x} y={region.y} width={region.w} height={region.h} rx={4} {...props}/>;
}
function useMaster(round:RepairRound){const resources=useContext(GameResourceContext),url=illustrationUrl(round.vehicle),prepared=resources?.get(url);if(resources&&!prepared)throw new Error(`Repair master not preloaded: ${round.vehicle}`);return {master:repairMasters[round.vehicle],src:prepared?.src??url};}
export function RepairTool({tool}:{tool:Tool}){return <Illustration id={`tool-${tool}`} className="repair-tool-art"/>;}
export function RepairPartPreview({round,variant=0,part='wheel'}:{round:RepairRound;variant?:number;part?:RepairPart}){
 const {master,src}=useMaster(round),region=master.parts[part],clip=useId(),scale=[1,.62,1.36][variant];
 const pad=region.w*.3,v={x:region.x-pad,y:region.y-pad,w:region.w+pad*2,h:region.h+pad*2};
 return <svg className="repair-part-art" viewBox={`${v.x} ${v.y} ${v.w} ${v.h}`} aria-hidden="true" data-master={round.vehicle}>
  <defs><clipPath id={clip}><Shape region={region}/></clipPath></defs>
  <g transform={`translate(${region.x+region.w/2} ${region.y+region.h/2}) scale(${scale}) translate(${-region.x-region.w/2} ${-region.y-region.h/2})`}><image href={src} width={master.width} height={master.height} clipPath={`url(#${clip})`}/></g>
 </svg>;
}
export function RepairCar({round,working=false}:{round:RepairRound;working?:boolean}){
 const {master:m,src}=useMaster(round),prefix=useId(),job=round.jobs[round.index],current=job?.part;
 const broken=round.jobs.filter(j=>!round.installed.includes(j.part)),loose=broken.filter(j=>j.part==='light'||j.part==='equipment');
 const replaceWheel=broken.some(j=>j.part==='wheel'),wheel=m.parts.wheel;
 return <svg className="repair-car" viewBox={`-12 -12 ${m.width+24} ${m.height+24}`} role="img" aria-label={`${carCatalog.find(c=>c.id===round.vehicle)?.name}，${round.stage==='test'?'已经修好':repairPartName(round.vehicle,current!)+ '需要检修'}`} data-master={round.vehicle}>
  <defs><mask id={`${prefix}-body`} maskUnits="userSpaceOnUse" x="-12" y="-12" width={m.width+24} height={m.height+24}><rect width={m.width} height={m.height} fill="white"/>{round.complete?m.wheels.map((r,i)=><Shape key={i} region={r} fill="black"/>):<>{replaceWheel&&<Shape region={wheel} fill="black"/>}{loose.map(j=><Shape key={j.part} region={m.parts[j.part]} fill="black"/>)}</>}</mask>
   {(['light','equipment'] as const).map(part=><clipPath id={`${prefix}-${part}`} key={part}><Shape region={m.parts[part]}/></clipPath>)}
   {m.wheels.map((r,i)=><clipPath id={`${prefix}-wheel-${i}`} key={i}><Shape region={r}/></clipPath>)}
  </defs>
  <image href={src} width={m.width} height={m.height} mask={`url(#${prefix}-body)`}/>
  {replaceWheel&&<g><circle cx={wheel.x+wheel.w/2} cy={wheel.y+wheel.h/2} r={wheel.w*.2} fill="#768a91" stroke="#25353e" strokeWidth={wheel.w*.05}/><circle cx={wheel.x+wheel.w/2} cy={wheel.y+wheel.h/2} r={wheel.w*.06} fill="#d4e4e6"/></g>}
  {replaceWheel&&working&&current==='wheel'&&<g className="repair-wheel-mount"><image href={src} width={m.width} height={m.height} clipPath={`url(#${prefix}-wheel-${m.wheels.findIndex(r=>r.x===wheel.x&&r.y===wheel.y)})`}/></g>}
  {loose.map(j=>{const r=m.parts[j.part];return <g key={j.part} className={working&&j.part===current?'repair-tightening':''} style={{transformOrigin:`${r.x+r.w/2}px ${r.y+r.h/2}px`}} transform={`rotate(5 ${r.x+r.w/2} ${r.y+r.h/2})`}><image href={src} width={m.width} height={m.height} clipPath={`url(#${prefix}-${j.part})`}/></g>;})}
  {broken.some(j=>j.part==='window')&&<g className={working&&current==='window'?'repair-dirt repair-cleaning':'repair-dirt'}>{[.23,.55,.78].map((t,i)=>{const r=m.parts.window;return <ellipse key={i} cx={r.x+r.w*t} cy={r.y+r.h*(i%2?.65:.35)} rx={r.w*.22} ry={r.h*.3} fill={i%2?'#a88554':'#bea06a'} opacity=".95"/>;})}</g>}
  {round.complete&&m.wheels.map((r,i)=><g key={i} className="repair-test-wheel" style={{transformOrigin:`${r.x+r.w/2}px ${r.y+r.h/2}px`}}><image href={src} width={m.width} height={m.height} clipPath={`url(#${prefix}-wheel-${i})`}/></g>)}
 </svg>;
}

export default function RepairScene({round:r,act,paused}:{round:RepairRound;act:(a:WorkshopAction)=>void;paused:boolean}){
 const [working,setWorking]=useState(false),remaining=useRef(950),locked=useRef(false),actRef=useRef(act);
 useEffect(()=>{actRef.current=act;},[act]);
 const job=r.jobs[r.index],master=repairMasters[r.vehicle],region=job?master.parts[job.part]:null;
 useEffect(()=>{if(!working||paused||!job)return;const start=performance.now();const timer=setTimeout(()=>{locked.current=false;setWorking(false);actRef.current({type:'service',part:job.part});},remaining.current);return()=>{clearTimeout(timer);remaining.current=Math.max(0,remaining.current-performance.now()+start);};},[working,paused,job]);
 function service(){if(locked.current||paused||r.stage!=='service')return;locked.current=true;remaining.current=950;setWorking(true);}
 const wheelName=repairPartName(r.vehicle,'wheel');
 const instruction=job?r.stage==='tool'?(job.part==='window'?'车窗脏了，用什么擦？':job.part==='wheel'?`少了一只${wheelName}，用什么帮忙？`:`${repairPartName(r.vehicle,job.part)}松了，用什么修？`):r.stage==='part'?`选一只大小合适的${wheelName}`:working?(job.part==='window'?'擦一擦，亮晶晶':'转一转，稳稳装好'):`点${repairPartName(r.vehicle,job.part)}，开始${job.part==='window'?'清洁':'维修'}`:'每一项都修好啦';
 return <section className={`repair-studio ${working?'repair-working':''} ${r.complete?'repair-finished':''}`} aria-label="小车维修工坊" data-phase={r.stage}>
  <div className="repair-scene">
   <div className="repair-shop-sign"><Illustration id="stop-repair"/><span>小镇修车店</span></div>
   <div className="repair-door" aria-hidden="true"/>
   <div className="repair-floor" aria-hidden="true"/>
   <div className="repair-vehicle-position" style={{aspectRatio:`${master.width+24}/${master.height+24}`}}><RepairCar round={r} working={working}/>{region&&<>
    <button className={`repair-target ${r.stage==='service'?'repair-target-ready':''}`} disabled={r.stage!=='service'||working} onClick={service} aria-label={`维修${repairPartName(r.vehicle,job.part)}`} style={{left:`${(region.x+region.w/2+12)/(master.width+24)*100}%`,top:`${(region.y+region.h/2+12)/(master.height+24)*100}%`}}><span/>{r.stage==='service'&&!working&&<ArrowRight/>}</button>
    {working&&<div className={`repair-active-tool repair-action-${job.tool}`} style={{left:`${(region.x+region.w/2+12)/(master.width+24)*100}%`,top:`${(region.y+region.h/2+12)/(master.height+24)*100}%`}}><RepairTool tool={job.tool}/></div>}
   </>}</div>
   <div className="repair-checklist">{r.jobs.map((j,i)=><span className={i<r.index?'is-fixed':i===r.index?'is-current':''} key={j.part}>{i<r.index?<Check/>:<b>{i+1}</b>}{repairPartName(r.vehicle,j.part)}</span>)}</div>
  </div>
  <div className="repair-workbench">
   <h2 aria-live="polite">{r.complete?'修好的小车，准备出发！':instruction}</h2>
   {job?<><div className="repair-tools" aria-label={r.stage==='part'?`选择${wheelName}`:'选择维修工具'}>
    {r.stage==='part'?job.options.map(variant=><button key={variant} aria-label={`${wheelName} ${variant+1}`} className={r.hint>1&&variant===job.target?'ws-hint':''} onClick={()=>act({type:'part',variant})}><RepairPartPreview round={r} variant={variant}/><span>{variant===0?'中号':variant===1?'小号':'大号'}</span></button>):(['cloth','wrench','screwdriver'] as Tool[]).map(tool=><button key={tool} className={`${r.stage==='service'&&tool===job.tool?'is-chosen':''} ${r.hint>1&&tool===job.tool?'ws-hint':''}`} disabled={r.stage!=='tool'} onClick={()=>act({type:'tool',tool})}><RepairTool tool={tool}/><span>{toolNames[tool]}</span>{r.stage==='service'&&tool===job.tool&&<Check/>}</button>)}
   </div>{r.stage==='service'&&<p className="repair-action-note">{working?'工具正在帮忙…':'工具选好啦，点车上的维修位置'}</p>}</>:<div className="repair-test-area"><div className="repair-inspection-strip">{r.jobs.map(j=><span key={j.part}><Check/>{repairPartName(r.vehicle,j.part)}</span>)}</div>{!r.complete&&<button className="ws-primary" onClick={()=>act({type:'check'})}><Play/>出库试车</button>}</div>}
  </div>
 </section>;
}
