export const items = [
 {id:'wheel',name:'轮胎',symbol:'◉',color:'#405c54'},
 {id:'toolbox',name:'工具箱',symbol:'✚',color:'#d86f57'},
 {id:'hose',name:'水管',symbol:'◎',color:'#d78a55'},
 {id:'bucket',name:'水桶',symbol:'▣',color:'#79aeb1'},
 {id:'helmet',name:'头盔',symbol:'⌒',color:'#e7b65b'},
 {id:'cone',name:'路锥',symbol:'▲',color:'#e39159'},
 {id:'sign',name:'路牌',symbol:'◆',color:'#dfa849'},
 {id:'board',name:'桥板',symbol:'▰',color:'#bc956d'},
 {id:'box',name:'木箱',symbol:'▦',color:'#bd936b'},
 {id:'parcel',name:'包裹',symbol:'✳',color:'#dcae7b'},
 {id:'fuel',name:'油桶',symbol:'▤',color:'#83a991'},
 {id:'ladder',name:'梯子',symbol:'▥',color:'#8ca597'},
 {id:'luggage',name:'行李箱',symbol:'▣',color:'#429bc5'},
 {id:'backpack',name:'背包',symbol:'▣',color:'#6aa662'},
 {id:'gift',name:'礼物',symbol:'✳',color:'#d96b64'},
 {id:'toys',name:'玩具',symbol:'●',color:'#65a4cc'},
 {id:'books',name:'图书',symbol:'▤',color:'#d5a156'},
 {id:'picnic',name:'野餐篮',symbol:'▦',color:'#c7934a'},
 {id:'apples',name:'苹果',symbol:'●',color:'#da6862'},
 {id:'vegetables',name:'蔬菜',symbol:'❧',color:'#79a65d'},
 {id:'fish',name:'鱼',symbol:'◁',color:'#69a1ba'},
 {id:'milk',name:'牛奶',symbol:'▥',color:'#709cbe'},
 {id:'juice',name:'果汁',symbol:'▥',color:'#e6a554'},
 {id:'oranges',name:'橙子',symbol:'●',color:'#e6a554'},
 {id:'eggs',name:'鸡蛋',symbol:'●',color:'#cfb986'},
 {id:'flowers',name:'鲜花',symbol:'✿',color:'#d68b9c'},
 {id:'hay',name:'干草',symbol:'▤',color:'#ceb856'},
 {id:'paint',name:'油漆',symbol:'▣',color:'#d96b64'},
 {id:'firstAid',name:'急救箱',symbol:'✚',color:'#ca6d6d'},
 {id:'barrier',name:'路障',symbol:'▰',color:'#d98068'},
] as const;
export type ItemId=typeof items[number]['id'];
export const stopNames={fire:'消防站',work:'工地',shop:'商店',hospital:'医院',factory:'工厂',home:'住宅',school:'学校',police:'警察局',gas:'加油站',farm:'农场',greenhouse:'温室',parking:'停车场',busStop:'公交站',repair:'修车店'} as const;
export type StopId=keyof typeof stopNames;
export const stopIds=Object.keys(stopNames) as StopId[];
export function routeChoices(stops:StopId[]):StopId[]{return stopIds.filter(id=>stops.includes(id));}
export type Phase='look'|'load'|'depart'|'route'|'travel'|'unload'|'remaining'|'taskDone'|'finished';
export type Level={id:number;title:string;mode:'visible'|'visual'|'route-visible'|'route-memory'|'update';count:1|2;choices:2|3|4;stops:1|2};
export const levels:Level[]=[
 {id:1,title:'第一次送货',mode:'visible',count:1,choices:2,stops:1},
 {id:2,title:'两件一起送',mode:'visible',count:2,choices:3,stops:1},
 {id:3,title:'看好了再装车',mode:'visual',count:2,choices:3,stops:1},
 {id:4,title:'货架多一点',mode:'visual',count:2,choices:4,stops:1},
 {id:5,title:'认识两个站',mode:'route-visible',count:2,choices:3,stops:2},
 {id:6,title:'听完再出发',mode:'route-memory',count:2,choices:3,stops:2},
 {id:7,title:'还剩哪一件',mode:'update',count:2,choices:3,stops:2},
 {id:8,title:'剩下的找一找',mode:'update',count:2,choices:4,stops:2},
];
export type Task={cargo:ItemId[];choices:ItemId[];stops:StopId[]};
export type State={level:Level;seed:number;tasks:Task[];taskIndex:number;phase:Phase;loaded:ItemId[];unloaded:ItemId[];stopIndex:number;hintLevel:number;review:boolean;wrong:number;hints:number;retries:number;message:string};
export type Action={type:'ready'}|{type:'load';item:ItemId}|{type:'depart'}|{type:'route';stop:StopId}|{type:'arrive'}|{type:'unload'}|{type:'remaining';item:ItemId}|{type:'next'}|{type:'hint'}|{type:'review'}|{type:'closeReview'};
function random(seed:number){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
function shuffle<T>(values:readonly T[],rand:()=>number){const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
export function taskSignature(task:Pick<Task,'cargo'|'stops'>){return JSON.stringify([[...task.cargo].sort(),task.stops]);}

// These silhouettes are too similar at shelf size. Exclude across the whole
// choice set, including distractors, rather than relying on labels or colors.
export const confusionGroups:readonly (readonly ItemId[])[]=[
 ['parcel','box','gift'],['bucket','paint','fuel'],['toolbox','firstAid'],
 ['luggage','backpack'],['milk','juice','fish'],['toys','fish'],['apples','vegetables'],['sign','barrier'],
];
export function canShareShelf(item:ItemId,others:readonly ItemId[]):boolean{
 return !others.includes(item)&&!confusionGroups.some(group=>group.includes(item)&&others.some(other=>group.includes(other)));
}
// A preference, never a correctness rule: multiple destinations remain valid
// for each cargo, and the generated order remains the source of truth.
export const preferredStops:Record<ItemId,readonly StopId[]>={
 wheel:['repair','parking','factory'],toolbox:['repair','work','factory','home','police'],
 hose:['fire','farm','greenhouse'],bucket:['farm','greenhouse','work','home'],helmet:['work','factory','fire'],
 cone:['work','parking','gas'],sign:['work','parking','busStop'],board:['work','factory','home'],
 box:['shop','factory','home'],parcel:['home','shop','school','police','hospital','busStop'],
 fuel:['gas','repair','factory'],ladder:['work','repair','home'],luggage:['home','busStop'],backpack:['school','home'],
 gift:['home','school','hospital'],toys:['home','school','hospital'],books:['school','home','hospital','police'],
 picnic:['home','farm','busStop'],apples:['shop','home','school','hospital'],vegetables:['shop','home','farm'],
 fish:['shop','home'],milk:['shop','home','school','hospital'],juice:['shop','home','school','busStop'],
 oranges:['shop','home','school'],eggs:['shop','home','farm'],flowers:['greenhouse','home','school','hospital'],
 hay:['farm','greenhouse'],paint:['work','repair','factory','home'],firstAid:['hospital','fire','police','school','gas'],
 barrier:['work','parking','police','gas','busStop'],
};
function recentUse(recent:readonly string[]){
 const cargo=new Map<ItemId,number>(),stops=new Map<StopId,number>();
 for(const signature of recent.slice(-5))try{
  const entry:unknown=JSON.parse(signature);
  if(!Array.isArray(entry)||!Array.isArray(entry[0])||!Array.isArray(entry[1]))continue;
  for(const item of items)if(entry[0].includes(item.id))cargo.set(item.id,(cargo.get(item.id)??0)+1);
  for(const stop of stopIds)if(entry[1].includes(stop))stops.set(stop,(stops.get(stop)??0)+1);
 }catch{/* Ignore malformed legacy preferences, never restore a board. */}
 return {cargo,stops};
}
export function makeTasks(level:Level,seed:number,recent:string[]=[]):Task[]{
 const rand=random(seed),history=recent.slice(-5),seen=new Set(history),out:Task[]=[];
 const rank=<T,>(values:readonly T[],score:(value:T)=>number)=>values.map(value=>({value,score:score(value)+rand()})).sort((a,b)=>a.score-b.score).map(x=>x.value);
 for(let attempt=0;out.length<3&&attempt<100;attempt++){
  const use=recentUse(history),cargo:ItemId[]=[],stops:StopId[]=[];
  for(let i=0;i<level.count;i++){
   const available=level.stops===1&&stops.length?stops:stopIds.filter(id=>!stops.includes(id));
   const leastUse=Math.min(...available.map(id=>use.stops.get(id)??0));
   const fresh=available.filter(id=>(use.stops.get(id)??0)===leastUse);
   // Pick cargo and its destination together, so rotation need not send food
   // to a workshop merely because home and the shop were recently visited.
   const item=rank(items.map(x=>x.id).filter(id=>canShareShelf(id,cargo)),id=>(use.cargo.get(id)??0)*4+(fresh.some(stop=>preferredStops[id].includes(stop))?0:2))[0];
   cargo.push(item);
   if(stops.length<level.stops)stops.push(rank(available,id=>(use.stops.get(id)??0)*4+(preferredStops[item].includes(id)?0:2))[0]);
  }
  const choices=[...cargo];
  for(const id of shuffle(items.map(x=>x.id),rand))if(choices.length<level.choices&&canShareShelf(id,choices))choices.push(id);
  if(choices.length!==level.choices)throw Error('Insufficient distinct cargo choices');
  const key=taskSignature({cargo,stops});if(seen.has(key))continue;
  seen.add(key);history.push(key);out.push({cargo,choices:shuffle(choices,rand),stops});
 }
 if(out.length!==3)throw Error('Could not create three distinct deliveries');
 return out;
}
export function createDelivery(levelId:number,seed:number,recent:string[]=[]):State{const level=levels.find(x=>x.id===levelId)??levels[0];return {level,seed,tasks:makeTasks(level,seed,recent),taskIndex:0,phase:'look',loaded:[],unloaded:[],stopIndex:0,hintLevel:0,review:false,wrong:0,hints:0,retries:0,message:'看看订单。'};}
function mistake(state:State,first:string):State{const hintLevel=Math.min(3,state.hintLevel+1);return {...state,wrong:state.wrong+1,hintLevel,message:hintLevel===1?first:hintLevel===2?'看看亮起来的地方。':'看我示范一次，再一起试试。'};}
export function deliveryReducer(state:State,action:Action):State{
 const task=state.tasks[state.taskIndex];
 if(state.phase==='finished')return state;
 if(action.type==='review'&&['load','route','remaining'].includes(state.phase))return {...state,review:true,hints:state.hints+1,message:'我们再看看订单。'};
 if(action.type==='closeReview'&&state.review)return {...state,review:false,message:'我们继续。'};
 if(state.review)return state;
 if(action.type==='hint'&&['load','route','remaining'].includes(state.phase)){const hintLevel=Math.min(3,state.hintLevel+1);return {...state,hints:state.hints+1,hintLevel,message:hintLevel===1?'慢慢看看，可以请大人一起找。':hintLevel===2?'看看亮起来的地方。':'看我示范一次，再一起试试。'};}
 if(action.type==='ready'&&state.phase==='look')return {...state,phase:'load',message:'找一找，把订单里的货物装上车。'};
 if(action.type==='load'&&state.phase==='load'){
  if(state.loaded.includes(action.item)||!task.choices.includes(action.item))return state;
  if(!task.cargo.includes(action.item))return mistake(state,'没关系，再看看订单。');
  const loaded=[...state.loaded,action.item];return {...state,loaded,hintLevel:0,phase:loaded.length===task.cargo.length?'depart':'load',message:loaded.length===task.cargo.length?'货物装好了，我们准备出发。':'装好了，再找一件。'};
 }
 if(action.type==='depart'&&state.phase==='depart')return {...state,phase:task.stops.length===1?'travel':'route',message:task.stops.length===1?'小车出发啦，慢慢开。':'看看要先去哪里。'};
 if(action.type==='route'&&state.phase==='route'){
  if(action.stop!==task.stops[state.stopIndex])return mistake(state,'没关系，再看看路线。');
  return {...state,phase:'travel',hintLevel:0,message:'小车出发啦，慢慢开。'};
 }
 if(action.type==='arrive'&&state.phase==='travel')return {...state,phase:'unload',message:'到站啦，把货物送到站里。'};
 if(action.type==='unload'&&state.phase==='unload'){
  const unloading=task.stops.length===1?task.cargo:[task.cargo[state.stopIndex]],unloaded=[...state.unloaded,...unloading];
  if(state.stopIndex+1<task.stops.length)return {...state,unloaded,stopIndex:state.stopIndex+1,phase:state.level.mode==='update'?'remaining':'route',hintLevel:0,message:state.level.mode==='update'?'还有一件货物，想一想是什么。':'第一站到啦，再去下一站。'};
  return {...state,unloaded,phase:'taskDone',message:'货物送到啦，谢谢小司机。'};
 }
 if(action.type==='remaining'&&state.phase==='remaining'){
  if(!task.choices.includes(action.item))return state;
  if(action.item!==task.cargo[1])return mistake(state,'没关系，再看看订单。');
  return {...state,phase:'travel',hintLevel:0,message:'小车出发啦，慢慢开。'};
 }
 if(action.type==='next'&&state.phase==='taskDone'){
  if(state.taskIndex===2)return {...state,phase:'finished',message:'三份货物都送到了，小车回车库啦。'};
  return {...state,taskIndex:state.taskIndex+1,phase:'look',loaded:[],unloaded:[],stopIndex:0,hintLevel:0,review:false,message:'看看订单。'};
 }
 return state;
}
