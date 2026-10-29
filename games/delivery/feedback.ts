import type {ItemId,State,StopId} from './model';

export type DeliveryArrival={cargo:ItemId[];stop:StopId;orderComplete:boolean};

// Celebrate only a successful unload transition. Never copy the remaining
// cargo into decoration: that would reveal the answer in the update tasks.
export function deliveryArrival(before:State,after:State):DeliveryArrival|null{
 if(before===after||before.seed!==after.seed||before.taskIndex!==after.taskIndex||before.phase!=='unload')return null;
 const cargo=after.unloaded.filter(id=>!before.unloaded.includes(id));
 if(!cargo.length)return null;
 return {cargo,stop:before.tasks[before.taskIndex].stops[before.stopIndex],orderComplete:after.phase==='taskDone'};
}

export function deliveryMemories(state:State):ItemId[][]{
 return state.phase==='finished'?state.tasks.map(task=>[...task.cargo]):[];
}
