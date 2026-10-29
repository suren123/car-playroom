import {Check,Flag,ArrowLeft,ArrowRight} from 'lucide-react';
import {Illustration} from '../../components/illustration';
import {stations,type ListenRound,type QueueRound} from './model';
import type {CSSProperties} from 'react';
import './tour.css';

export function ListenTour({round:r}:{round:ListenRound}){
 const name=`town-tour-${r.seed}`,n=r.route.length,left=(i:number)=>(i+.5)/n*84+8-8;
 // Pause at every real station, with the same ordered route used by the rule checker.
 const frames=['0%{left:-18%}'];
 r.route.forEach((_,i)=>{const arrive=(i+.55)/n*90,leave=(i+.88)/n*90;frames.push(`${arrive}%,${leave}%{left:${left(i)}%}`);});
 frames.push(`100%{left:${left(n-1)}%}`);
 return <section className="ws-board town-tour" aria-label="完成的巡游路线">
  <style>{`@keyframes ${name}{${frames.join('')}}`}</style>
  <div className="town-tour-heading"><h2>每一站，都到啦</h2><Flag/></div>
  <div className="town-tour-stations" style={{gridTemplateColumns:`repeat(${n},1fr)`}}>{r.route.map((id,i)=>{const stop=stations.find(s=>s.id===id)!;return <div className="town-tour-stop" key={id}><b>{i+1}</b><Illustration id={stop.art}/><strong>{stop.name}</strong><span className="town-arrived" style={{animationDelay:`${(i+.55)/n*2.88}s`}}><Check/>到站</span></div>;})}</div>
  <div className="town-tour-road"><div className="town-tour-car" style={{left:`${left(n-1)}%`,animationName:name}}><Illustration id={r.car}/></div></div>
  <p className="town-tour-order">{r.route.map((id,i)=><span key={id}>{i>0&&<ArrowRight/>}{stations.find(s=>s.id===id)!.name}</span>)}</p>
 </section>;
}

export function QueueDeparture({round:r}:{round:QueueRound}){
 return <div className="town-departure" aria-label="按顺序出发的小车">
  <span className="town-departure-label"><ArrowLeft/>按顺序出发</span>
  <div className="town-departure-road">{r.order.map((car,i)=><div className="town-convoy-car" key={car} style={{'--arrival':`${3+i*(76/r.order.length)}%`,animationDelay:`${i*.24}s`} as CSSProperties}><Illustration id={car}/><b>{i+1}</b></div>)}</div>
 </div>;
}
