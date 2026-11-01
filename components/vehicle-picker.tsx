'use client';
import {useState} from 'react';
import {carCatalog,type CarKind} from '../games/vehicle-catalog';
import {vehicleIllustration} from '../games/illustration-assets';
import {Illustration} from './illustration';
import {VehicleFilter,type VehicleFilterValue} from './vehicle-filter';

/** All available vehicles fit one iPad portrait screen; a choice starts play. */
export function VehiclePicker({selected,onSelect,allowed,disabled=false,starting,delivery=false}:{selected:CarKind;onSelect:(car:CarKind)=>void;allowed?:readonly CarKind[];disabled?:boolean;starting?:CarKind|null;delivery?:boolean}){
 const [group,setGroup]=useState<VehicleFilterValue>('all');
 const cars=carCatalog.filter(c=>(!allowed||allowed.includes(c.id))&&(group==='all'||c.group===group));
 return <div className="vehicle-picker">
  {!allowed&&<VehicleFilter value={group} disabled={disabled} onChange={setGroup}/>}
  <div className={`${delivery?'dv-cars':'ws-garage-cars'} all-cars ${allowed?'repair-choices':''}`} aria-label="选择车辆">{cars.map(car=><button key={car.id} type="button" aria-label={`选择${car.name}`} aria-pressed={car.id===selected} className={delivery?`dv-car-choice ${car.id===selected?'is-selected':''}`:car.id===selected?'ws-selected':''} disabled={disabled} onClick={()=>onSelect(car.id)}><Illustration id={vehicleIllustration[car.id]} priority/><strong>{starting===car.id?'正在准备……':car.name}</strong></button>)}</div>
 </div>;
}
