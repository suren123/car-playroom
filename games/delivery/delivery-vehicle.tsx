'use client';
import {useLayoutEffect,useRef} from 'react';
import {Illustration} from '../../components/illustration';
import {vehicleIllustration} from '../illustration-assets';
import type {CarKind} from '../vehicle-catalog';
import type {ItemId} from './model';
import {CargoArt} from './art';
import {artworkBox,cargoPorts} from './transport';

export function DeliveryVehicle({car,carried,visibleManifest,delivered,driving,landing,onSettled}:{car:CarKind;carried:ItemId[];visibleManifest:boolean;delivered:boolean;driving:boolean;landing:number;onSettled:()=>void}){
 const root=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{
  const node=root.current,art=node?.querySelector('.illustration-art');if(!node||!art)return;
  const measure=()=>{const box=artworkBox(art),parent=node.getBoundingClientRect(),port=cargoPorts[car];node.style.setProperty('--port-x',`${box.x-parent.x+box.width*port.x}px`);node.style.setProperty('--port-y',`${box.y-parent.y+box.height*port.y}px`);};
  measure();const observer=new ResizeObserver(measure);observer.observe(node);return()=>observer.disconnect();
 },[car]);
 return <div ref={root} className={`dv-stage-car ${driving?'is-driving':''} ${landing?'is-settling':''}`} onAnimationEnd={e=>{if(e.animationName==='dv-car-settle')onSettled();}}><Illustration id={vehicleIllustration[car]} priority/>
  <span className="dv-car-port" style={{left:'var(--port-x,32%)',top:'var(--port-y,42%)'}} aria-hidden="true">{carried.length||delivered?'✓':'↓'}{landing>0&&<i key={landing} className="dv-car-settle"/>}</span>
  <div className="dv-car-manifest" aria-label={`车上 ${carried.length} 件货物`} data-cargo-count={carried.length}>{visibleManifest&&carried.length?carried.map(id=><CargoArt key={id} id={id}/>):delivered&&!carried.length?<><span aria-hidden="true">✓</span>送好啦</>:<><span className="dv-neutral-parcel" aria-hidden="true"/><b>{carried.length}</b><span>件</span></>}</div>
 </div>;
}
