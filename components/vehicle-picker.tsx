'use client';
import {useState} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import {carCatalog,type CarKind} from '../games/vehicle-catalog';
import {vehicleIllustration} from '../games/illustration-assets';
import {Illustration} from './illustration';
import {VehicleFilter,type VehicleFilterValue} from './vehicle-filter';

/** Eight large choices per page; selection survives filtering and paging. */
export function VehiclePicker({selected,onSelect,allowed,disabled=false,starting,delivery=false}:{selected:CarKind;onSelect:(car:CarKind)=>void;allowed?:readonly CarKind[];disabled?:boolean;starting?:CarKind|null;delivery?:boolean}){
 const [view,setView]=useState<{group:VehicleFilterValue;page:number|null}>({group:'all',page:null});
 const cars=carCatalog.filter(c=>(!allowed||allowed.includes(c.id))&&(view.group==='all'||c.group===view.group));
 const count=Math.max(1,Math.ceil(cars.length/8)),page=Math.min(count-1,view.page??Math.max(0,Math.floor(cars.findIndex(c=>c.id===selected)/8)));
 return <div className="vehicle-picker">
  {!allowed&&<VehicleFilter value={view.group} disabled={!!starting} onChange={group=>setView({group,page:null})}/>}
  <div className={`${delivery?'dv-cars':'ws-garage-cars'} paged-cars`} aria-label="选择车辆">{cars.slice(page*8,page*8+8).map(car=><button key={car.id} type="button" aria-label={`选择${car.name}`} aria-pressed={car.id===selected} className={delivery?`dv-car-choice ${car.id===selected?'is-selected':''}`:car.id===selected?'ws-selected':''} disabled={disabled} onClick={()=>onSelect(car.id)}><Illustration id={vehicleIllustration[car.id]} priority/><strong>{starting===car.id?'正在准备……':car.name}</strong></button>)}</div>
  <nav className="vehicle-pages" aria-label="车辆翻页"><button type="button" aria-label="上一页车辆" disabled={page===0||!!starting} onClick={()=>setView({...view,page:page-1})}><ChevronLeft/>上一页</button><span role="status">{page+1} / {count} 页 · {cars.length} 辆</span><button type="button" aria-label="下一页车辆" disabled={page===count-1||!!starting} onClick={()=>setView({...view,page:page+1})}>下一页<ChevronRight/></button></nav>
 </div>;
}
