import { seeded, shuffle, type VehicleKind } from './replay-games.ts';
export type RoadMode='traffic'|'queue'|'listen'|'detour';
export type Stop='fuel'|'fire'|'garage';
type Base={kind:RoadMode;seed:number;challenge:boolean;complete:boolean;message:string;hintLevel:number;wrong:number;premature:number;hints:number};
export type TrafficRound=Base&{kind:'traffic';signals:('red'|'green')[];index:number};
export type QueueRound=Base&{kind:'queue';cars:VehicleKind[];own:VehicleKind|null;order:VehicleKind[];index:number;ownPosition:number};
export type ListenRound=Base&{kind:'listen';stops:Stop[];index:number};
export type DetourRound=Base&{kind:'detour';roads:number;blocked:number;started:boolean;chosen:number|null};
export type RoadRound=TrafficRound|QueueRound|ListenRound|DetourRound;
export type RoadAction={type:'reset';round:RoadRound}|{type:'signal';signal:'red'|'green'}|{type:'own';car:VehicleKind}|{type:'depart';car:VehicleKind}|{type:'stop';stop:Stop}|{type:'begin'}|{type:'road';road:number}|{type:'hint'};
const base=(kind:RoadMode,seed:number,challenge:boolean):Base=>({kind,seed,challenge,complete:false,message:'',hintLevel:0,wrong:0,premature:0,hints:0});
export function makeRoadRound(kind:RoadMode,seed:number,challenge=false,queueIndex=0):RoadRound{
 const random=seeded(seed),common=base(kind,seed,challenge);
 if(kind==='traffic'){
  const signals:("red"|"green")[]=['green'];for(let i=1;i<(challenge?6:4);i++)signals.push(random()<.55?'red':'green');
  if(!signals.includes('red'))signals[1]='red';return {...common,kind,signals,index:0};
 }
 if(kind==='queue'){
  const cars=shuffle<VehicleKind>(['fire','bus','digger'],random);
  return {...common,kind,cars,own:null,order:[],index:0,ownPosition:queueIndex===0?0:queueIndex===1?1:queueIndex%3===2?2:Math.floor(random()*2)};
 }
 if(kind==='listen')return {...common,kind,stops:shuffle<Stop>(['fuel','fire','garage'],random).slice(0,challenge?2:1),index:0};
 return {...common,kind,roads:challenge?3:2,blocked:Math.floor(random()*(challenge?3:2)),started:false,chosen:null};
}
function error<T extends RoadRound>(s:T,premature=false):T{
 const hintLevel=Math.min(3,s.hintLevel+1);
 return {...s,wrong:s.wrong+1,premature:s.premature+(premature?1:0),hintLevel,message:hintLevel===1?'慢慢看，再试一次。':hintLevel===2?'看看亮起来的提示。':'看一遍示范，再试试。'};
}
export function roadReducer(state:RoadRound,action:RoadAction):RoadRound{
 if(action.type==='reset')return action.round;
 if(state.complete)return state;
 if(action.type==='hint')return {...state,hintLevel:Math.min(3,state.hintLevel+1),hints:state.hints+1,message:state.hintLevel>=2?'看一遍示范，再试试。':'看看亮起来的提示。'};
 if(state.kind==='traffic'&&action.type==='signal'){
  if(action.signal!==state.signals[state.index])return error(state,action.signal==='green');
  const index=state.index+1;return {...state,index,hintLevel:0,complete:index===state.signals.length,message:index===state.signals.length?'安全到站啦！':'做得好，看下一个灯。'};
 }
 if(state.kind==='queue'){
  if(action.type==='own'&&state.own===null&&state.cars.includes(action.car)){
   const others=state.cars.filter(c=>c!==action.car),order=[...others];order.splice(state.ownPosition,0,action.car);
   return {...state,own:action.car,order,message:'排好队了，看看轮到谁。'};
  }
  if(action.type==='depart'&&state.own!==null&&state.cars.includes(action.car)){
   if(action.car!==state.order[state.index]){const next=error(state,true);return {...next,message:next.hintLevel===1?'前面的车先走，等一等。':next.hintLevel===2?'看亮起来的车先走。':'看手指示范，再试试。'};}
   const index=state.index+1;return {...state,index,hintLevel:0,complete:index===3,message:index===3?'大家都出发啦！':'轮到下一辆车。'};
  }
 }
 if(state.kind==='listen'&&action.type==='stop'){
  if(action.stop!==state.stops[state.index])return error(state);
  const index=state.index+1;return {...state,index,hintLevel:0,complete:index===state.stops.length,message:index===state.stops.length?'任务完成啦！':'第一站到了，再去下一站。'};
 }
 if(state.kind==='detour'){
  if(action.type==='begin'&&!state.started)return {...state,started:true,message:'前面施工啦，找另一条路。'};
  if(action.type==='road'&&state.started&&action.road>=0&&action.road<state.roads){
   if(action.road===state.blocked){const next=error(state);return {...next,message:next.hintLevel===1?'这条路封住啦，换一条看看。':next.hintLevel===2?'看看没有路障的路。':'看手指示范，再试试。'};}
   return {...state,chosen:action.road,complete:true,message:'改道也能到达！'};
  }
 }
 return state;
}
