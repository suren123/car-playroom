import {vehicleGroups,type VehicleGroup} from '../games/vehicle-catalog';
import './vehicle-filter.css';
export type VehicleFilterValue='all'|VehicleGroup;
export function VehicleFilter({value,onChange,disabled=false}:{value:VehicleFilterValue;onChange:(value:VehicleFilterValue)=>void;disabled?:boolean}){
 return <div className="vehicle-filter" role="group" aria-label="车辆分类">{(['all',...Object.keys(vehicleGroups)] as VehicleFilterValue[]).map(group=><button type="button" key={group} disabled={disabled} aria-pressed={value===group} onClick={()=>onChange(group)}>{group==='all'?'全部车辆':vehicleGroups[group]}</button>)}</div>;
}
