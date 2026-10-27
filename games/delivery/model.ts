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
] as const;
export type ItemId=typeof items[number]['id'];
export type StopId='fire'|'work';
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
 {id:8,title:'换辆车再试',mode:'update',count:2,choices:4,stops:2},
];
export type Task={cargo:ItemId[];choices:ItemId[];stops:StopId[]};
export type State={level:Level;seed:number;tasks:Task[];taskIndex:number;phase:Phase;loaded:ItemId[];unloaded:ItemId[];stopIndex:number;hintLevel:number;review:boolean;wrong:number;hints:number;retries:number;message:string};
export type Action={type:'ready'}|{type:'load';item:ItemId}|{type:'depart'}|{type:'route';stop:StopId}|{type:'arrive'}|{type:'unload'}|{type:'remaining';item:ItemId}|{type:'next'}|{type:'hint'}|{type:'review'}|{type:'closeReview'};
function random(seed:number){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
function shuffle<T>(values:readonly T[],rand:()=>number){const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
export function taskSignature(task:Pick<Task,'cargo'|'stops'>){return JSON.stringify([[...task.cargo].sort(),task.stops]);}
export function makeTasks(level:Level,seed:number,recent:string[]=[]):Task[]{
 const rand=random(seed),seen=new Set<string>(recent.slice(-5)),out:Task[]=[];
 while(out.length<3){const all=shuffle(items.map(x=>x.id),rand),cargo=all.slice(0,level.count),stops=shuffle<StopId>(['fire','work'],rand).slice(0,level.stops),key=taskSignature({cargo,stops});
  if(seen.has(key))continue;seen.add(key);out.push({cargo,choices:shuffle(all.slice(0,level.choices),rand),stops});}
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
 if(action.type==='ready'&&state.phase==='look')return {...state,phase:'load',message:'找一找，把订单里的装备装上车。'};
 if(action.type==='load'&&state.phase==='load'){
  if(state.loaded.includes(action.item)||!task.choices.includes(action.item))return state;
  if(!task.cargo.includes(action.item))return mistake(state,'没关系，再看看订单。');
  const loaded=[...state.loaded,action.item];return {...state,loaded,hintLevel:0,phase:loaded.length===task.cargo.length?'depart':'load',message:loaded.length===task.cargo.length?'装备装好了，我们准备出发。':'装好了，再找一件。'};
 }
 if(action.type==='depart'&&state.phase==='depart')return {...state,phase:task.stops.length===1?'travel':'route',message:task.stops.length===1?'小车出发啦，慢慢开。':'看看要先去哪里。'};
 if(action.type==='route'&&state.phase==='route'){
  if(action.stop!==task.stops[state.stopIndex])return mistake(state,'没关系，再看看路线。');
  return {...state,phase:'travel',hintLevel:0,message:'小车出发啦，慢慢开。'};
 }
 if(action.type==='arrive'&&state.phase==='travel')return {...state,phase:'unload',message:'到站啦，把装备送到站里。'};
 if(action.type==='unload'&&state.phase==='unload'){
  const unloading=task.stops.length===1?task.cargo:[task.cargo[state.stopIndex]],unloaded=[...state.unloaded,...unloading];
  if(state.stopIndex+1<task.stops.length)return {...state,unloaded,stopIndex:state.stopIndex+1,phase:state.level.mode==='update'?'remaining':'route',hintLevel:0,message:state.level.mode==='update'?'还有一件装备，想一想是什么。':'第一站到啦，再去下一站。'};
  return {...state,unloaded,phase:'taskDone',message:'装备送到啦，谢谢小司机。'};
 }
 if(action.type==='remaining'&&state.phase==='remaining'){
  if(!task.choices.includes(action.item))return state;
  if(action.item!==task.cargo[1])return mistake(state,'没关系，再看看订单。');
  return {...state,phase:'travel',hintLevel:0,message:'小车出发啦，慢慢开。'};
 }
 if(action.type==='next'&&state.phase==='taskDone'){
  if(state.taskIndex===2)return {...state,phase:'finished',message:'三份装备都送到了，小车回车库啦。'};
  return {...state,taskIndex:state.taskIndex+1,phase:'look',loaded:[],unloaded:[],stopIndex:0,hintLevel:0,review:false,message:'看看订单。'};
 }
 return state;
}
