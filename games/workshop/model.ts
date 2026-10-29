import {seeded, shuffle, type VehicleKind} from '../../lib/replay-games.ts';
import {carCatalog, type CarKind} from '../vehicle-catalog.ts';
import type {IllustrationId} from '../illustration-assets.ts';
import {cargoIllustration,destinationIllustration} from '../illustration-assets.ts';
import {items,stopIds,stopNames,type ItemId,type StopId} from '../delivery/model.ts';

export const workshopGames=['queue','bridge','sort','repair','traffic','listen','detour'] as const;
export type WorkshopGame=typeof workshopGames[number];
export type Level=1|2|3;
export const levelNames={1:'入门',2:'练习',3:'挑战'} as const;
export const workshopVersion='workshop-v2';
export const allCars=carCatalog.map(car=>car.id);
export const editableCars:VehicleKind[]=['fire','ambulance','bus','truck','digger','crane'];
export const themes=['小镇','田园','海边'] as const;
export const stations=stopIds.map(id=>({id,name:stopNames[id],art:destinationIllustration[id]}));
export const workshopBrief:Record<WorkshopGame,{subtitle:string;levels:[string,string,string]}>={
 queue:{subtitle:'当一次车站调度员',levels:['照着车票排队','根据前后线索排队','多辆车的顺序推理']},
 bridge:{subtitle:'选桥板，拼一座能通车的桥',levels:['拼好短桥','有限桥板，刚好铺满','按桥墩颜色组合桥板']},
 sort:{subtitle:'给小车和物品找合适的位置',levels:['小车按用途进站','生活物品分仓库','颜色和车型都要对']},
 repair:{subtitle:'把小车修好，一起试车',levels:['清洁和换轮胎','再检查松动的部件','四项完整检修']},
 traffic:{subtitle:'守护小镇的每一个路口',levels:['看红绿灯','指挥两个方向的车队','行人过街，救援车优先']},
 listen:{subtitle:'听好路线，安排小车巡游',levels:['记住两站','记住三站','四站路线，排好再出发']},
 detour:{subtitle:'画一条小车能走的路线',levels:['绕开施工去终点','经过一站再到终点','按顺序经过两个站点']},
};
type Base={game:WorkshopGame;level:Level;seed:number;car:CarKind;theme:number;complete:boolean;wrong:number;hints:number;hint:number;message:string;revision:number};
export type QueueRound=Base&{game:'queue';cars:CarKind[];order:CarKind[];slots:(CarKind|null)[];history:(CarKind|null)[][];clues:[CarKind,CarKind][];checked:boolean};
export type BridgePiece={id:number;length:number;material:'wood'|'steel'};
export type BridgeRound=Base&{game:'bridge';span:number;pieces:BridgePiece[];placed:number[];pattern:('wood'|'steel')[];cooperate:boolean;turn:'child'|'parent';tested:boolean};
export type SortToken={id:number;art:IllustrationId;name:string;bin:string;vehicle?:VehicleKind;color?:string};
export type SortBin={id:string;name:string;art?:IllustrationId;color?:string;vehicle?:VehicleKind};
export type SortRound=Base&{game:'sort';tokens:SortToken[];bins:SortBin[];parked:Record<number,string>;selected:number|null};
export type RepairPart='wheel'|'window'|'light'|'equipment';
export type Tool='wrench'|'cloth'|'screwdriver';
export const toolNames:Record<Tool,string>={wrench:'扳手',cloth:'擦布',screwdriver:'螺丝刀'};
export const partNames:Record<RepairPart,string>={wheel:'轮胎',window:'车窗',light:'车灯',equipment:'专用装备'};
export type RepairJob={part:RepairPart;tool:Tool;target:number;options:number[]};
export type RepairRound=Base&{game:'repair';vehicle:VehicleKind;jobs:RepairJob[];index:number;stage:'tool'|'part'|'service'|'test';installed:RepairPart[]};
export type TrafficScene={light:'red'|'green';pedestrian:boolean;priority:boolean;car:CarKind;destination:IllustrationId};
export type TrafficFlow='west'|'north'|'people';
export type Junction={lanes:[CarKind[],CarKind[]];served:[number,number];pedestrianAt:number[];peopleServed:number;lastFlow:TrafficFlow|null};
export type TrafficRound=Base&{game:'traffic';scenes:TrafficScene[];index:number;arrived:CarKind[];junction:Junction|null};
export type ListenRound=Base&{game:'listen';route:string[];options:string[];plan:string[];covered:boolean;checked:boolean};
export type DetourRound=Base&{game:'detour';size:number;walls:number[];start:number;goal:number;via:number[];destinations:StopId[];path:number[];tested:boolean};
export type WorkshopRound=QueueRound|BridgeRound|SortRound|RepairRound|TrafficRound|ListenRound|DetourRound;
export type WorkshopAction={type:'hint'}|{type:'undo'}|{type:'check'}|{type:'queue';car:CarKind}|{type:'queue-place';car:CarKind;slot:number|null}|{type:'bridge';piece:number;actor:'child'|'parent'}|{type:'cooperate'}|{type:'select';token:number}|{type:'sort';bin:string}|{type:'tool';tool:Tool}|{type:'part';variant:number}|{type:'service';part:RepairPart}|{type:'traffic';go:boolean}|{type:'flow';flow:TrafficFlow}|{type:'cover'}|{type:'station';station:string}|{type:'step';cell:number};
const choice=<T,>(items:readonly T[],random:()=>number)=>items[Math.floor(random()*items.length)];
const base=(game:WorkshopGame,level:Level,seed:number,car:CarKind):Base=>({game,level,seed,car,theme:seed%3,complete:false,wrong:0,hints:0,hint:0,message:'',revision:0});
const cargoEntries=(ids:ItemId[]):[IllustrationId,string][]=>ids.map(id=>[cargoIllustration[id],items.find(item=>item.id===id)!.name]);
const cargoGroups:{name:string;art:IllustrationId;items:[IllustrationId,string][]}[]=[
 {name:'食物',art:'cargo-apples',items:cargoEntries(['apples','milk','eggs','oranges','fish','vegetables','juice','bananas','watermelon','strawberry','pineapple','corn','pumpkin','bread','cake','cookies'])},
 {name:'工具和材料',art:'toolbox',items:cargoEntries(['toolbox','ladder','hose','wheel','helmet','board','bucket','cone','sign','fuel','paint','barrier','extinguisher','shovel','broom'])},
 {name:'学习与玩耍',art:'cargo-books',items:cargoEntries(['books','toys','backpack','basketball','football','kite','guitar'])},
 {name:'生活用品',art:'cargo-luggage',items:cargoEntries(['luggage','umbrella','rainBoots','clock','picnic','firstAid'])},
];
export function workshopArtwork(game:WorkshopGame):IllustrationId[]{
 const ids:IllustrationId[]=[...(game==='repair'?editableCars:allCars)];
 if(game==='sort')ids.push('fireStation','constructionSite','warehouse',...cargoGroups.flatMap(g=>[g.art,...g.items.map(([id])=>id)]));
 if(game==='listen'||game==='traffic')ids.push(...stations.map(s=>s.art));
 if(game==='detour')ids.push('cargo-barrier',...stations.map(s=>s.art),...carCatalog.map(car=>`overhead-${car.id}` as IllustrationId));
 if(game==='traffic')ids.push('pedestrian');
 if(game==='repair')ids.push('tool-wrench','tool-cloth','tool-screwdriver','stop-repair');
 return [...new Set(ids)];
}
export function makeWorkshopRound(game:WorkshopGame,level:Level,seed:number,car:CarKind='fire'):WorkshopRound{
 const random=seeded(seed),common=base(game,level,seed,car);
 if(game==='queue'){
  const pool=shuffle(allCars.filter(id=>id!==car),random),order=shuffle([car,...pool.slice(0,level+1)],random);
  // The clue chain uniquely orders every vehicle; its cards are shuffled separately.
  const clues=shuffle(order.slice(1).map((id,i)=>[order[i],id] as [CarKind,CarKind]),random);
  return {...common,game,cars:shuffle(order,random),order,slots:[],history:[],clues,checked:false};
 }
 if(game==='bridge'){
  const span=level===1?4:level===2?6:8;
  const pieces:BridgePiece[]=[];let left=span;
  while(left){const length=choice(Array.from({length:Math.min(level+1,left)},(_,i)=>i+1),random);pieces.push({id:pieces.length,length,material:level===3&&pieces.length%2?'steel':'wood'});left-=length;}
  // At least three decisions, with a nontrivial combination at larger sizes.
  if(pieces.length<3){const first=pieces.find(p=>p.length>1)!;first.length--;pieces.push({id:pieces.length,length:1,material:first.material});}
  const pattern=pieces.flatMap(p=>Array(p.length).fill(p.material));
  // Spare boards make choosing a combination meaningful; the original set remains a solution.
  if(level>1)for(let i=0;i<2;i++)pieces.push({id:pieces.length,length:choice([2,3,level+1],random),material:level===3&&i===1?'steel':'wood'});
  return {...common,game,span,pieces:shuffle(pieces,random),placed:[],pattern,cooperate:false,turn:'child',tested:false};
 }
 if(game==='sort'){
  let bins:SortBin[],tokens:SortToken[];
  if(level===1){
   const groups=[{id:'rescue',name:'救援车',art:'fireStation' as const,cars:['fire','ambulance','police'] as CarKind[]},{id:'build',name:'工程车',art:'constructionSite' as const,cars:['digger','crane','mixer','roller','dump','forklift'] as CarKind[]},{id:'transport',name:'运输车',art:'warehouse' as const,cars:['truck','bus','delivery','schoolBus','fuelTanker'] as CarKind[]}];
   bins=groups.map(({id,name,art})=>({id,name,art}));
   tokens=groups.flatMap(g=>shuffle(g.cars,random).slice(0,2).map(id=>({id:0,art:id,name:carCatalog.find(c=>c.id===id)!.name,bin:g.id})));
  }else if(level===2){
   const groups=shuffle(cargoGroups,random).slice(0,3);
   bins=groups.map((g,i)=>({id:String(i),name:g.name,art:g.art}));
   tokens=groups.flatMap((g,i)=>shuffle(g.items,random).slice(0,3).map(([art,name])=>({id:0,art,name,bin:String(i)})));
  }else{
   const models=shuffle<VehicleKind>(['bus','truck'],random),palette=[{name:'红色',color:'#df5842'},{name:'蓝色',color:'#4387c9'}];
   bins=models.flatMap(vehicle=>palette.map(p=>({id:vehicle+p.color,name:p.name+carCatalog.find(c=>c.id===vehicle)!.name,vehicle,color:p.color})));
   tokens=bins.flatMap(bin=>[0,1].map(()=>({id:0,art:bin.vehicle!,name:bin.name,bin:bin.id,vehicle:bin.vehicle,color:bin.color})));
  }
  tokens=shuffle(tokens,random).map((token,id)=>({...token,id}));
  return {...common,game,bins:shuffle(bins,random),tokens,parked:{},selected:0};
 }
 if(game==='repair'){
  const vehicle=editableCars.includes(car as VehicleKind)?car as VehicleKind:choice(editableCars,random);
  const tools:Record<RepairPart,Tool>={wheel:'wrench',window:'cloth',light:'screwdriver',equipment:'wrench'};
  const extras=shuffle<RepairPart>(['light','equipment'],random).slice(0,level-1);
  const jobs=shuffle<RepairPart>(['wheel','window',...extras],random).map(part=>({part,tool:tools[part],target:0,options:shuffle([0,1,2],random)}));
  return {...common,game,vehicle,jobs,index:0,stage:'tool',installed:[]};
 }
 if(game==='traffic'){
  if(level>1){
   const count=level===2?2:3,pool=shuffle(allCars.filter(id=>id!==car&&id!=='ambulance'),random);
   const cars=shuffle([car,...pool.slice(0,count*2-1)],random);
   if(level===3&&!cars.includes('ambulance'))cars[Math.floor(random()*cars.length)]='ambulance';
   // Keep the chosen vehicle even when inserting an emergency vehicle.
   if(!cars.includes(car))cars[(cars.indexOf('ambulance')+1)%cars.length]=car;
   return {...common,game,scenes:[],index:0,arrived:[],junction:{lanes:[cars.slice(0,count),cars.slice(count)],served:[0,0],pedestrianAt:level===3?[0,3]:[1],peopleServed:0,lastFlow:null}};
  }
  const possibilities:Omit<TrafficScene,'car'|'destination'>[]=[{light:'green',pedestrian:false,priority:false},{light:'red',pedestrian:false,priority:false}];
  if(level>=2)possibilities.push({light:'green',pedestrian:true,priority:false});
  if(level===3)possibilities.push({light:'green',pedestrian:false,priority:true});
  const situations=shuffle([...possibilities,...possibilities],random);
  const scenes=situations.map(scene=>({...scene,car,destination:choice(stations,random).art}));
  return {...common,game,scenes,index:0,arrived:[],junction:null};
 }
 if(game==='listen'){
  const options=shuffle(stations.map(s=>s.id),random).slice(0,level+3),route=shuffle(options,random).slice(0,level+1);
  return {...common,game,route,options,plan:[],covered:false,checked:false};
 }
 const size=level===1?4:5,start=(size-1)*size,goal=size-1;
 // Generate a guaranteed corridor first, then add optional roads and dead ends.
 const moves=shuffle([...Array(size-1).fill(-size),...Array(size-1).fill(1)],random),corridor=[start];
 for(const move of moves)corridor.push(corridor[corridor.length-1]+move);
 const via=level===1?[]:level===2?[corridor[Math.floor(corridor.length/2)]]:[corridor[Math.floor(corridor.length/3)],corridor[Math.floor(corridor.length*2/3)]];
 const walls=Array.from({length:size*size},(_,i)=>i).filter(i=>!corridor.includes(i)&&random()<.65);
 return {...common,game:'detour',size,walls,start,goal,via,destinations:shuffle(stopIds,random).slice(0,via.length+1),path:[start],tested:false};
}
export function trafficCanGo(scene:TrafficScene){return scene.light==='green'&&!scene.pedestrian&&!scene.priority;}
export function trafficFlows(round:TrafficRound):TrafficFlow[]{
 const j=round.junction;if(!j||round.complete)return [];
 if(j.pedestrianAt[j.peopleServed]===j.served[0]+j.served[1])return ['people'];
 const available=([0,1] as const).filter(i=>j.served[i]<j.lanes[i].length);
 const priority=round.level===3?available.filter(i=>j.lanes[i][j.served[i]]==='ambulance'):[];
 return (priority.length?priority:available).map(i=>i===0?'west':'north');
}
export function adjacent(a:number,b:number,size:number){return Math.abs(Math.floor(a/size)-Math.floor(b/size))+Math.abs(a%size-b%size)===1;}
export function bridgeFilled(round:BridgeRound){return round.placed.reduce((sum,id)=>sum+round.pieces.find(p=>p.id===id)!.length,0);}
export function bridgeSolution(round:BridgeRound,prefix:number[]=[]):number[]|null{
 function search(path:number[],offset:number):number[]|null{
  if(offset===round.span)return path;
  for(const p of round.pieces)if(!path.includes(p.id)&&offset+p.length<=round.span&&(round.level<3||round.pattern.slice(offset,offset+p.length).every(m=>m===p.material))){const answer=search([...path,p.id],offset+p.length);if(answer)return answer;}
  return null;
 }
 const materials=prefix.flatMap(id=>{const p=round.pieces.find(p=>p.id===id);return p?Array(p.length).fill(p.material):[];});
 if(new Set(prefix).size!==prefix.length||prefix.some(id=>!round.pieces.some(p=>p.id===id))||materials.length>round.span||round.level===3&&materials.some((m,i)=>m!==round.pattern[i]))return null;
 return search(prefix,materials.length);
}
export function routeSolution(round:DetourRound,from=round.start,targets=[...round.via,round.goal]):number[]|null{
 const result=[from];
 for(const target of targets){
  const pending=[[result[result.length-1]]],seen=new Set(pending[0]);let found:number[]|undefined;
  while(pending.length){const path=pending.shift()!,last=path[path.length-1];if(last===target){found=path;break;}
   for(const next of [last-round.size,last+1,last+round.size,last-1])if(next>=0&&next<round.size**2&&adjacent(last,next,round.size)&&!round.walls.includes(next)&&!seen.has(next)){seen.add(next);pending.push([...path,next]);}
  }
  if(!found)return null;result.push(...found.slice(1));
 }
 return result;
}
export function visitedWaypoints(round:DetourRound){let visited=0;for(const cell of round.path)if(round.via[visited]===cell)visited++;return visited;}
export function workshopProgress(round:WorkshopRound):[number,number]{
 switch(round.game){
  case 'queue':return [round.slots.filter(Boolean).length,round.order.length];
  case 'bridge':return [bridgeFilled(round),round.span];
  case 'sort':return [Object.keys(round.parked).length,round.tokens.length];
  case 'repair':return [round.index,round.jobs.length];
  case 'traffic':return [round.index,round.junction?round.junction.lanes.flat().length+round.junction.pedestrianAt.length:round.scenes.length];
  case 'listen':return [round.plan.length,round.route.length];
  case 'detour':return [visitedWaypoints(round)+(round.complete?1:0),round.via.length+1];
 }
}
const fail=<T extends WorkshopRound>(s:T,message:string):T=>({...s,wrong:s.wrong+1,message,revision:s.revision+1});
const change=<T extends WorkshopRound>(s:T,patch:Partial<T>):T=>({...s,hint:0,message:'',revision:s.revision+1,...patch});
export function workshopHint(s:WorkshopRound):string{
 if(s.game==='queue'){const mismatch=s.slots.findIndex((car,i)=>car!==null&&car!==s.order[i]);return mismatch>=0?`看看第 ${mismatch+1} 个车位，可以撤回调整前后顺序。`:s.level===1?'照着车票，找出下一个车位对应的小车。':s.slots.length?'已排好的小车后面，下一辆应该是谁？看看前后线索。':'找出没有排在任何车后面的小车，它应该最先出发。';}
 if(s.game==='bridge')return bridgeSolution(s,s.placed)?s.level===3?'看看下一段桥墩的颜色，再比较桥板长度。':'数数还空着几格，把剩下的桥板拼一拼。':'这组桥板接不下去了，撤回后换一种组合。';
 if(s.game==='sort')return s.level===3?'先看颜色，再找同一种车，两项都要相同。':'先看选中的图片，再看每个车站的标志。';
 if(s.game==='repair')return s.stage==='tool'?'脏了用擦布，轮胎用扳手，车灯用螺丝刀。':s.stage==='part'?'比一比轮胎大小，和车上另一只一样大。':'点一下发亮的维修位置，让工具过去帮忙。';
 if(s.game==='traffic'){if(s.junction){const flows=trafficFlows(s);return flows[0]==='people'?'先让斑马线上的行人走到对面，两边的小车都等一等。':flows.length===2?'两边都可以走，选一边亮绿灯，另一边等一等。':'看看队伍最前面，让救援车或剩下的车先通过。';}const scene=s.scenes[s.index];return scene.light==='red'?'红灯亮着，要停在停车线后。':'绿灯亮着，道路安全，可以走。';}
 if(s.game==='listen')return '再看看路线，按从左到右的顺序安排。';
 return '亮起来的是下一步可以走的路，沿路找到任务点。';
}
export function workshopReducer(state:WorkshopRound,action:WorkshopAction):WorkshopRound{
 if(state.complete)return state;
 if(action.type==='hint')return {...state,hints:state.hints+1,hint:Math.min(2,state.hint+1),message:workshopHint(state),revision:state.revision+1};
 switch(state.game){
  case 'queue':{
   if(action.type==='queue'||action.type==='queue-place'){
    if(!state.cars.includes(action.car))return state;
    const from=state.slots.indexOf(action.car);
    if(action.type==='queue'&&from>=0)return state;
    const empty=state.order.findIndex((_,i)=>!state.slots[i]);
    const to=action.type==='queue'?empty:action.slot;
    if(to!==null&&(!Number.isInteger(to)||to<0||to>=state.order.length)||to===from||to===null&&from<0)return state;
    const slots=Array.from({length:state.order.length},(_,i)=>state.slots[i]??null);
    if(to===null)slots[from]=null;
    else {const displaced=slots[to];slots[to]=action.car;if(from>=0)slots[from]=displaced;}
    while(slots.length&&slots.at(-1)===null)slots.pop();
    return change(state,{slots,history:[...state.history,state.slots],checked:false});
   }
   if(action.type==='undo'&&state.history.length)return change(state,{slots:state.history.at(-1)!,history:state.history.slice(0,-1),checked:false});
   if(action.type==='check')return state.slots.length===state.order.length&&state.slots.every((car,i)=>state.order[i]===car)?change(state,{complete:true,message:'队伍排好啦，大家出发！',checked:true}):fail({...state,checked:true},'看看车票和前后线索，可以撤回再调整。');
   break;
  }
  case 'bridge':{
   if(action.type==='cooperate')return change(state,{cooperate:!state.cooperate,turn:'child'});
   if(action.type==='bridge'){
    const p=state.pieces.find(p=>p.id===action.piece);if(!p||state.placed.includes(p.id))return state;
    if(state.cooperate&&action.actor!==state.turn)return fail(state,'这一块轮到另一位小伙伴，等一等。');
    if(bridgeFilled(state)+p.length>state.span)return fail(state,'这块桥板放不下，可以撤回换一种组合。');
    return change(state,{placed:[...state.placed,p.id],turn:state.turn==='child'?'parent':'child',tested:false});
   }
   if(action.type==='undo'&&state.placed.length)return change(state,{placed:state.placed.slice(0,-1),turn:state.turn==='child'?'parent':'child',tested:false});
   if(action.type==='check'){
    const actual=state.placed.flatMap(id=>{const p=state.pieces.find(p=>p.id===id)!;return Array(p.length).fill(p.material);});
    if(actual.length!==state.span)return fail({...state,tested:true},'桥还没接到对岸，看看还差几格。');
    if(state.level===3&&actual.some((m,i)=>m!==state.pattern[i]))return fail({...state,tested:true},'桥板要和桥墩颜色对应，撤回调整一下。');
    return change(state,{complete:true,tested:true,message:'小桥通车啦！'});
   }
   break;
  }
  case 'sort':{
   if(action.type==='select'&&state.tokens.some(t=>t.id===action.token)&&state.parked[action.token]===undefined)return change(state,{selected:action.token});
   if(action.type==='sort'&&state.selected!==null){
    const token=state.tokens[state.selected];if(!state.bins.some(b=>b.id===action.bin)||state.parked[token.id]!==undefined)return state;
    if(token.bin!==action.bin)return fail(state,state.level===3?'车型和颜色都要一样哦。':'看看车站的标志和例子，再选一次。');
    const parked={...state.parked,[token.id]:action.bin},next=state.tokens.find(t=>parked[t.id]===undefined);
    return change(state,{parked,selected:next?.id??null,complete:!next,message:next?'放好啦！':'全部整理好啦！'});
   }
   break;
  }
  case 'repair':{
   const job=state.jobs[state.index];
   if(action.type==='tool'&&state.stage==='tool')return action.tool===job.tool?change(state,{stage:job.part==='wheel'?'part':'service',message:job.part==='wheel'?'找一只大小合适的轮胎。':'点一下小车上需要修理的位置。'}):fail(state,job.tool==='cloth'?'车窗脏了，用柔软的擦布擦一擦。':job.tool==='wrench'?'这里需要扳手来帮忙。':'松动的车灯需要螺丝刀。');
   if(action.type==='part'&&state.stage==='part'){
    if(!job.options.includes(action.variant))return state;
    if(action.variant!==job.target)return fail(state,action.variant===1?'这一只太小了，再比一比。':'这一只太大了，再比一比。');
    return change(state,{stage:'service',message:'大小刚刚好，点车上的轮轴装好它。'});
   }
   if(action.type==='service'&&state.stage==='service'&&action.part===job.part){const index=state.index+1;return change(state,{index,installed:[...state.installed,job.part],stage:index===state.jobs.length?'test':'tool',message:job.part==='window'?'擦干净啦！':job.part==='wheel'?'轮胎装好啦！':'拧紧啦！'});}
   if(action.type==='check'&&state.stage==='test')return change(state,{complete:true,message:'检修完成，小车可以出发啦！'});
   break;
  }
  case 'traffic':{
   if(action.type==='flow'&&state.junction){
    const j=state.junction,allowed=trafficFlows(state);
    if(!allowed.includes(action.flow))return fail(state,allowed[0]==='people'?'行人正在过街，两边的小车都要等一等。':action.flow==='people'?'现在没有行人过街，可以安排小车通过。':'看看队伍最前面，救援车要先通过。');
    const served:[number,number]=[...j.served];let arrived=state.arrived,peopleServed=j.peopleServed;
    if(action.flow==='people')peopleServed++;else{const lane=action.flow==='west'?0:1;arrived=[...arrived,j.lanes[lane][served[lane]]];served[lane]++;}
    const index=state.index+1,complete=index===j.lanes.flat().length+j.pedestrianAt.length;
    return change(state,{junction:{...j,served,peopleServed,lastFlow:action.flow},index,arrived,complete,message:complete?'大家都平安通过啦！':action.flow==='people'?'行人走到对面了，接着安排车队。':'这一辆通过了，再看看谁先走。'});
   }
   if(action.type==='traffic'&&!state.junction){
    const scene=state.scenes[state.index];
    if(action.go!==trafficCanGo(scene))return fail(state,scene.light==='red'?'红灯要停在停车线后。':scene.pedestrian?'先让过街的人走完。':scene.priority?'先让救援车通过。':'现在道路安全，可以出发。');
    const index=state.index+1;
    return change(state,{index,arrived:[...state.arrived,scene.car],complete:index===state.scenes.length,message:index===state.scenes.length?'每个路口都安全通过啦！':action.go?'安全通过！':'等一等，安全最重要。'});
   }
   break;
  }
  case 'listen':{
   if(action.type==='cover'&&!state.covered)return change(state,{covered:true});
   if(action.type==='station'&&state.covered&&state.options.includes(action.station)&&state.plan.length<state.route.length)return change(state,{plan:[...state.plan,action.station],checked:false});
   if(action.type==='undo'&&state.plan.length)return change(state,{plan:state.plan.slice(0,-1),checked:false});
   if(action.type==='check'&&state.covered)return state.plan.length===state.route.length&&state.plan.every((s,i)=>state.route[i]===s)?change(state,{complete:true,checked:true,message:'每一站都记住啦！'}):fail({...state,checked:true},'路线还不一样，可以再听一遍，或撤回调整。');
   break;
  }
  case 'detour':{
   if(action.type==='step'&&Number.isInteger(action.cell)&&action.cell>=0&&action.cell<state.size**2){
    const last=state.path[state.path.length-1];
    if(action.cell===last)return state;
    if(!adjacent(last,action.cell,state.size))return fail(state,'从小车旁边的道路接着走，一次一格。');
    if(state.walls.includes(action.cell))return fail(state,'这里正在施工，换条路试试。');
    // Loops are allowed: visiting a waypoint may require going back along a road.
    if(state.path.length>=100)return fail(state,'路线有点长，撤回几步再试试。');
    return change(state,{path:[...state.path,action.cell],tested:false});
   }
   if(action.type==='undo'&&state.path.length>1)return change(state,{path:state.path.slice(0,-1),tested:false});
   if(action.type==='check')return state.path[state.path.length-1]===state.goal&&visitedWaypoints(state)===state.via.length?change(state,{complete:true,tested:true,message:'路线通啦，小车到站！'}):fail({...state,tested:true},'先按顺序经过任务点，再把路线接到终点。');
  }
 }
 return state;
}
