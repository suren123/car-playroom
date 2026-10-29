import {LittleIcon} from '../../components/car-art';
import {CargoArt,StopArt} from './art';
import type {Level} from './model';
import './level-art.css';

function CargoBed({count=1,remaining=false}:{count?:number;remaining?:boolean}){
 return <span className="dv-task-bed"><span className="dv-task-slots">
  {remaining?<span className="dv-task-remaining"><CargoArt id="helmet"/><b>?</b></span>:Array.from({length:count},(_,i)=><span className="dv-task-slot" key={i}/>)}
 </span></span>;
}

export function DeliveryLevelArt({level}:{level:Level}){
 return <span className={`dv-task-art dv-task-art--${level.id}`} aria-hidden="true">
  {level.mode==='visible'&&<>
   <span className="dv-task-goods"><CargoArt id="parcel"/>{level.count===2&&<CargoArt id="bucket"/>}</span>
   <span className="dv-task-down">↓</span><CargoBed count={level.count}/>
  </>}
  {level.mode==='visual'&&<span className="dv-task-memory">
   <span className={`dv-task-paper ${level.id===4?'dv-task-shelf':''}`}>
    <CargoArt id="parcel"/><CargoArt id="bucket"/>
    {level.id===4&&<><CargoArt id="helmet"/><CargoArt id="toolbox"/></>}
   </span>
   <span className="dv-task-cover"><svg viewBox="0 0 40 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12q15 17 30 0M10 17l-3 5m13-2v6m10-9 3 5"/></svg></span>
  </span>}
  {(level.mode==='route-visible'||level.mode==='route-memory')&&<>
   {level.mode==='route-memory'&&<span className="dv-task-listen"><LittleIcon kind="sound"/></span>}
   <span className="dv-task-stations"><StopArt stop="fire"/><span className="dv-task-arrow">→</span><StopArt stop="shop"/></span>
   <span className="dv-task-road"/>
  </>}
  {level.mode==='update'&&<>
   <span className="dv-task-unload"><span className="dv-task-delivered"><CargoArt id="parcel"/><b>✓</b></span><span className="dv-task-arrow">←</span><CargoBed remaining/></span>
   {level.id===8&&<span className="dv-task-options"><CargoArt id="parcel"/><CargoArt id="helmet"/><CargoArt id="bucket"/><CargoArt id="toolbox"/></span>}
  </>}
 </span>;
}
