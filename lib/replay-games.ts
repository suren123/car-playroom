export type VehicleKind = 'fire' | 'ambulance' | 'bus' | 'truck' | 'digger' | 'crane';
export type Category = 'rescue' | 'transport' | 'build';
export type Vehicle = {kind: VehicleKind; color: string};
export type ReplayMode = 'sort' | 'difference' | 'sudoku';
export type SortRule='color'|'model'|'purpose';
export const vehicleNames: Record<VehicleKind, string> = {fire:'消防车',ambulance:'救护车',bus:'公交车',truck:'货车',digger:'挖掘机',crane:'吊车'};
export const categories: {id:Category; name:string; kinds:VehicleKind[]}[] = [
  {id:'rescue',name:'救援',kinds:['fire','ambulance']},
  {id:'transport',name:'运输',kinds:['bus','truck']},
  {id:'build',name:'施工',kinds:['digger','crane']},
];
export const categoryFor: Record<VehicleKind, Category> = {fire:'rescue',ambulance:'rescue',bus:'transport',truck:'transport',digger:'build',crane:'build'};
export const colors: Record<VehicleKind,string[]> = {fire:['#de6650','#c94f44'],ambulance:['#f3eee1','#dce9dd'],bus:['#e3b04b','#6f9c83','#78a9b1'],truck:['#6e9eaf','#af8cb3','#879f69'],digger:['#e7b24b','#dd9451'],crane:['#df9c52','#8d9b69']};
export const sudokuKinds:VehicleKind[]=['fire','bus','digger','truck'];
export function seeded(seed:number) {let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
export function shuffle<T>(items:T[],random:()=>number):T[]{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const pick=<T,>(a:T[],random:()=>number)=>a[Math.floor(random()*a.length)];
const makeVehicle=(kind:VehicleKind,random:()=>number):Vehicle=>({kind,color:pick(colors[kind],random)});
export function countSolutions(board:number[],limit=2):number {
  const i=board.indexOf(-1);if(i<0)return 1;
  const row=Math.floor(i/4),col=i%4;let count=0;
  for(let v=0;v<4;v++){
    let valid=true;
    for(let k=0;k<4;k++)if(board[row*4+k]===v||board[k*4+col]===v)valid=false;
    for(let r=Math.floor(row/2)*2;r<Math.floor(row/2)*2+2;r++)for(let c=Math.floor(col/2)*2;c<Math.floor(col/2)*2+2;c++)if(board[r*4+c]===v)valid=false;
    if(valid){const next=[...board];next[i]=v;count+=countSolutions(next,limit-count);if(count>=limit)return count;}
  }
  return count;
}
type Base={complete:boolean;message:string;hint:boolean;hintLevel:number;wrong:number;hints:number;seed:number};
export type SortRound=Base&{kind:'sort';rule:SortRule;bins:{id:string;name:string;color?:string;kind?:VehicleKind}[];deck:Vehicle[];index:number;placed:boolean;parked:Vehicle[]};
export type DifferenceRound=Base&{kind:'difference';left:Vehicle[];right:Vehicle[];differences:number[];found:number[]};
export type SudokuRound=Base&{kind:'sudoku';size:2|4;solution:number[];initial:number[];values:number[];selected:number|null};
export type Round=SortRound|DifferenceRound|SudokuRound;
export const red='#de6650',blue='#6e9eaf';
export function sortTarget(round:SortRound,vehicle:Vehicle){return round.rule==='purpose'?categoryFor[vehicle.kind]:round.rule==='model'?vehicle.kind:vehicle.color===red?'red':'blue';}
export function makeRound(kind:ReplayMode,seed:number,challenge=false,sortRule:SortRule='purpose',tutorial=false):Round {
  const random=seeded(seed),base={complete:false,message:'',hint:false,hintLevel:0,wrong:0,hints:0,seed};
  if(kind==='sort'){
    if(sortRule==='color'){
      const deck=shuffle((['fire','bus','digger','truck'] as VehicleKind[]).map((kind,i)=>({kind,color:i%2?blue:red})),random);
      return {...base,kind,rule:sortRule,bins:[{id:'red',name:'红色',color:red},{id:'blue',name:'蓝色',color:blue}],deck,index:0,placed:false,parked:[]};
    }
    if(sortRule==='model'){
      const models=shuffle((Object.keys(vehicleNames) as VehicleKind[]),random).slice(0,2),deck=shuffle([...models,...models].map(k=>makeVehicle(k,random)),random);
      return {...base,kind,rule:sortRule,bins:models.map(k=>({id:k,name:vehicleNames[k],kind:k})),deck,index:0,placed:false,parked:[]};
    }
    const kinds=categories.flatMap(c=>c.kinds);
    return {...base,kind,rule:sortRule,bins:categories.map(c=>({id:c.id,name:c.name})),deck:shuffle(kinds,random).map(k=>makeVehicle(k,random)),index:0,placed:false,parked:[]};
  }
  if(kind==='difference'){
    const kinds=Object.keys(vehicleNames) as VehicleKind[];
    const lineup=shuffle(kinds,random);
    if(challenge)lineup.push(...shuffle(kinds,random).slice(0,3));
    const left=shuffle(lineup,random).map(kind=>makeVehicle(kind,random));
    const right=left.map(v=>({...v}));
    const differences=shuffle(left.map((_,i)=>i),random).slice(0,challenge?3:2);
    for(const i of differences){
      // Change the vehicle silhouette, keeping every unchanged tile identical.
      const kind=pick(kinds.filter(k=>k!==left[i].kind),random);right[i]=makeVehicle(kind,random);
    }
    return {...base,kind,left,right,differences,found:[]};
  }
  if(tutorial){const order=shuffle([0,1],random),solution=[order[0],order[1],order[1],order[0]],initial=[...solution];initial[Math.floor(random()*4)]=-1;return {...base,kind,size:2,solution,initial,values:[...initial],selected:initial.indexOf(-1)};}
  const order=()=>shuffle([0,1],random).flatMap(b=>shuffle([0,1],random).map(i=>b*2+i));
  const rows=order(),cols=order(),symbols=shuffle([0,1,2,3],random);
  const solution=rows.flatMap(r=>cols.map(c=>symbols[(2*(r%2)+Math.floor(r/2)+c)%4]));
  const initial=[...solution];let removed=0;
  for(const i of shuffle(Array.from({length:16},(_,i)=>i),random)){
    const old=initial[i];initial[i]=-1;
    if(countSolutions(initial)!==1)initial[i]=old;else removed++;
    if(removed===(challenge?6:3))break;
  }
  return {...base,kind,size:4,solution,initial,values:[...initial],selected:initial.indexOf(-1)};
}
export type ReplayAction={type:'home'}|{type:'start';round:Round}|{type:'category';category:Category}|{type:'bin';bin:string}|{type:'next'}|{type:'spot';index:number}|{type:'select';index:number}|{type:'symbol';value:number}|{type:'hint'};
function mistake<T extends Round>(state:T,soft:string):T{const hintLevel=Math.min(3,state.hintLevel+1);return {...state,wrong:state.wrong+1,hint:false,hintLevel,message:hintLevel===1?soft:hintLevel===2?'看看亮起来的地方。':'看手指示范，再试试。'};}
export function replayReducer(state:Round|null,action:ReplayAction):Round|null {
 if(action.type==='home')return null;
 if(action.type==='start')return action.round;
 if(!state||state.complete)return state;
 if(action.type==='hint'){const hintLevel=Math.min(3,state.hintLevel+1);return {...state,hint:true,hintLevel,hints:state.hints+1,message:hintLevel===1?'先慢慢看一看。':hintLevel===2?'看看亮起来的地方。':'看一遍示范，再试试。'};}
 if(state.kind==='sort'){
  if((action.type==='category'||action.type==='bin')&&!state.placed){
    const vehicle=state.deck[state.index];
    if(sortTarget(state,vehicle)!==(action.type==='category'?action.category:action.bin))return mistake(state,'换一个试试。');
    const parked=[...state.parked,vehicle];return {...state,parked,placed:true,hint:false,hintLevel:0,complete:parked.length===state.deck.length,message:'停对啦！'};
  }
  if(action.type==='next'&&state.placed)return {...state,index:state.index+1,placed:false,hint:false,hintLevel:0,message:''};
 }
 if(state.kind==='difference'&&action.type==='spot'){
   if(state.found.includes(action.index))return state;
   if(!state.differences.includes(action.index))return mistake(state,'再看看。');
   const found=[...state.found,action.index];return {...state,found,hint:false,hintLevel:0,complete:found.length===state.differences.length,message:'找到啦！'};
 }
 if(state.kind==='sudoku'){
   if(action.type==='select'&&state.values[action.index]===-1)return {...state,selected:action.index,hint:false,message:''};
   if(action.type==='symbol'&&state.selected!==null){
     const i=state.selected;if(state.values[i]!==-1)return state;
     if(action.value!==state.solution[i])return mistake(state,'换一辆试试。');
     const values=[...state.values];values[i]=action.value;const next=values.indexOf(-1);
     return {...state,values,selected:next<0?null:next,hint:false,hintLevel:0,complete:next<0,message:'停好啦！'};
   }
 }
 return state;
}
