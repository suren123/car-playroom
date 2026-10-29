import {ArrowLeft,ArrowRight,Footprints,Check} from 'lucide-react';
import {Illustration} from '../../components/illustration';
import {trafficFlows,type TrafficRound,type WorkshopAction} from './model';
import {carCatalog} from '../vehicle-catalog';

export default function JunctionScene({round,motion,act}:{round:TrafficRound;motion:TrafficRound|null;act:(action:WorkshopAction)=>void}){
 const display=motion??round,j=display.junction!,current=round.junction!,flows=trafficFlows(display),walking=flows.includes('people'),moving=!!motion,flow=moving?current.lastFlow:null;
 const carName=(id:string)=>carCatalog.find(c=>c.id===id)!.name;
 return <section className={`ws-board ws-junction ${moving?'ws-in-transit':''}`} aria-label="路口调度站">
  <div className="ws-junction-map">
   <div className="ws-junction-road west"/><div className="ws-junction-zebra"/>
   {([0,1] as const).map(lane=>{const name=lane===0?'west':'north',cars=j.lanes[lane].slice(j.served[lane]);return <div className={`ws-junction-lane ${name}`} key={lane} aria-label={lane===0?'左边车队':'右边车队'}>
    <span className="ws-lane-label">{lane===0?<ArrowRight/>:<ArrowLeft/>}{lane===0?'左边':'右边'}</span>
    <div className="ws-lane-cars" style={{flexDirection:lane===0?'row-reverse':'row'}}>{cars.map((car,i)=><div className={`${i===0?'ws-lead-car':''} ${display.level===3&&car==='ambulance'?'ws-emergency':''} ${i===0&&flow===name?'ws-departing-placeholder':''}`} key={`${car}-${i}`}><Illustration id={car} alt={carName(car)} style={{transform:lane===1?'scaleX(-1)':undefined}}/>{display.level===3&&car==='ambulance'&&<small>救援</small>}</div>)}{!cars.length&&<Check className="ws-lane-clear"/>}</div>
    <span className={`ws-lane-light ${flow===name?'green':'red'}`} aria-label={`${lane===0?'左边':'右边'}${flow===name?'绿灯':'红灯'}`}><i/><i/></span>
   </div>;})}
   <Illustration id="shop" className="ws-junction-shop"/>
   <div className={`ws-crossing-people ${walking?'ws-people-present':''} ${flow==='people'?'ws-people-moving':''}`} aria-label={walking?'行人正在过街':'斑马线空闲'}><Illustration id="pedestrian"/><span>{walking?'行人先过':'安全斑马线'}</span></div>
   {moving&&flow!=='people'&&<div key={round.index} aria-hidden="true" className={`ws-transit-car ${flow}`}><Illustration id={round.arrived[round.arrived.length-1]} style={{transform:flow==='north'?'scaleX(-1)':undefined}}/></div>}
  </div>
  <div className="ws-junction-controls">
   {(['west','people','north'] as const).map(direction=><button key={direction} className={round.hint>1&&flows.includes(direction)?'ws-hint':''} disabled={round.complete||moving||(direction!=='people'&&j.served[direction==='west'?0:1]===j.lanes[direction==='west'?0:1].length)} onClick={()=>act({type:'flow',flow:direction})}>
    {direction==='west'?<ArrowRight/>:direction==='north'?<ArrowLeft/>:<Footprints/>}<span>{direction==='west'?'左边亮绿灯':direction==='north'?'右边亮绿灯':'让行人通过'}</span>
   </button>)}
  </div>
  <div className="ws-junction-arrived" aria-label="已安全通过"><span>安全通过</span>{round.arrived.map((car,i)=><Illustration id={car} key={i}/>)}{current.peopleServed>0&&<span className="ws-people-count"><Footprints/>{current.peopleServed}</span>}</div>
 </section>;
}
