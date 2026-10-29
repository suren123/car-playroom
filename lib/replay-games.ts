import {carCatalog,pickPictureVehicles,type CarKind} from '../games/vehicle-catalog.ts';
import {vehicleNames} from '../games/vehicle-catalog.ts';
export {vehicleNames};
export type VehicleKind = 'fire' | 'ambulance' | 'bus' | 'truck' | 'digger' | 'crane';
export type Category = 'rescue' | 'transport' | 'build';
export type Vehicle = {kind: VehicleKind; color: string};
export type ReplayMode = 'sort' | 'difference' | 'sudoku';
export type SortRule='color'|'model'|'purpose';
export type PictureVehicle={kind:CarKind;color:string};
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
export type SudokuSize=2|3|4;
export const sudokuBlanks:Record<SudokuSize,number>={2:2,3:3,4:6};
export const sudokuSpeech={rules:'每一排和每一列，放不一样的小车。',rowColumn:'看看这个空位所在的一排和一列。',vehicle:'试试手指指着的小车。',conflict:'这一排或这一列已经有这辆车啦，换一辆试试。',observe:'再看看这一排和这一列，还缺哪辆车？',complete:'全部停好啦！',correct:'停好啦！'};
export function sudokuCandidates(board:number[],index:number,size:SudokuSize):number[]{
 const row=Math.floor(index/size),col=index%size;
 return Array.from({length:size},(_,v)=>v).filter(v=>!board.some((x,i)=>i!==index&&x===v&&(Math.floor(i/size)===row||i%size===col)));
}
export function countSolutions(board:number[],limit=2):number {
 const size=Math.sqrt(board.length) as SudokuSize;
 if(![2,3,4].includes(size)||board.some((v,i)=>v!==-1&&(!Number.isInteger(v)||v<0||v>=size||!sudokuCandidates(board,i,size).includes(v))))return 0;
 function solve(values:number[],cap:number):number{
  const empty=values.flatMap((v,i)=>v===-1?[i]:[]);if(!empty.length)return 1;
  const choices=empty.map(i=>({i,values:sudokuCandidates(values,i,size)})).sort((a,b)=>a.values.length-b.values.length)[0];
  let count=0;for(const v of choices.values){const next=[...values];next[choices.i]=v;count+=solve(next,cap-count);if(count>=cap)return cap;}return count;
 }
 return solve(board,limit);
}
export function sudokuSolvesByElimination(board:number[]):boolean{
 const size=Math.sqrt(board.length) as SudokuSize,values=[...board];
 while(values.includes(-1)){
  let progress=false;
  for(let i=0;i<values.length;i++)if(values[i]===-1){const choices=sudokuCandidates(values,i,size);if(!choices.length)return false;if(choices.length===1){values[i]=choices[0];progress=true;}}
  if(!progress)return false;
 }
 return true;
}
export function makeSudoku(size:SudokuSize,seed:number):SudokuRound{
 const random=seeded(seed),range=Array.from({length:size},(_,i)=>i),rows=shuffle(range,random),cols=shuffle(range,random),symbols=shuffle(range,random);
 const solution=rows.flatMap(r=>cols.map(c=>symbols[(r+c)%size])),initial=[...solution],order=shuffle(solution.map((_,i)=>i),random);
 // Each removal keeps a clue in every row/column and an elimination-only solution.
 function remove(start:number,left:number):boolean{
  if(!left)return true;
  for(let k=start;k<=order.length-left;k++){
   const i=order[k],value=initial[i];initial[i]=-1;
   const r=Math.floor(i/size),c=i%size;
   const clues=range.some(j=>initial[r*size+j]!==-1)&&range.some(j=>initial[j*size+c]!==-1);
   if(clues&&sudokuSolvesByElimination(initial)&&countSolutions(initial)===1&&remove(k+1,left-1))return true;
   initial[i]=value;
  }
  return false;
 }
 if(!remove(0,sudokuBlanks[size]))throw new Error('Unable to construct sudoku');
 return {kind:'sudoku',size,seed,vehicles:pickPictureVehicles(size,seeded(seed^0x51d0)),solution,initial,values:[...initial],selected:initial.indexOf(-1),complete:false,message:'',hint:false,hintLevel:0,wrong:0,hints:0,conflicts:[]};
}

type Base={complete:boolean;message:string;hint:boolean;hintLevel:number;wrong:number;hints:number;seed:number};
export type SortRound=Base&{kind:'sort';rule:SortRule;bins:{id:string;name:string;color?:string;kind?:VehicleKind}[];deck:Vehicle[];index:number;placed:boolean;parked:Vehicle[]};
export type DifferenceDifficulty='beginner'|'practice'|'challenge';
export const differenceLevels={beginner:{label:'入门',count:4,columns:2,differences:1},practice:{label:'练习',count:6,columns:3,differences:2},challenge:{label:'挑战',count:9,columns:3,differences:3}} as const;
export const differenceKinds:CarKind[]=carCatalog.map(car=>car.id);
export const differenceSpeech={rules:'两边的车有一点不一样。找到以后，点任意一边的小车。',complete:'全部找到啦！'};
export type DifferenceRound=Base&{kind:'difference';difficulty:DifferenceDifficulty;vehicles:CarKind[];left:PictureVehicle[];right:PictureVehicle[];differences:number[];found:number[]};
export type SudokuRound=Base&{kind:'sudoku';size:SudokuSize;vehicles:CarKind[];solution:number[];initial:number[];values:number[];selected:number|null;conflicts:number[]};
export type Round=SortRound|DifferenceRound|SudokuRound;
export const red='#de6650',blue='#6e9eaf';
export function sortTarget(round:SortRound,vehicle:Vehicle){return round.rule==='purpose'?categoryFor[vehicle.kind]:round.rule==='model'?vehicle.kind:vehicle.color===red?'red':'blue';}
export function makeRound(kind:ReplayMode,seed:number,challenge=false,sortRule:SortRule='purpose'):Round {
  const random=seeded(seed),base={complete:false,message:'',hint:false,hintLevel:0,wrong:0,hints:0,seed};
  if(kind==='sort'){
    if(sortRule==='color'){
      const deck=shuffle((['fire','bus','digger','truck'] as VehicleKind[]).map((kind,i)=>({kind,color:i%2?blue:red})),random);
      return {...base,kind,rule:sortRule,bins:[{id:'red',name:'红色',color:red},{id:'blue',name:'蓝色',color:blue}],deck,index:0,placed:false,parked:[]};
    }
    if(sortRule==='model'){
      const models=shuffle((Object.keys(colors) as VehicleKind[]),random).slice(0,2),deck=shuffle([...models,...models].map(k=>makeVehicle(k,random)),random);
      return {...base,kind,rule:sortRule,bins:models.map(k=>({id:k,name:vehicleNames[k],kind:k})),deck,index:0,placed:false,parked:[]};
    }
    const kinds=categories.flatMap(c=>c.kinds);
    return {...base,kind,rule:sortRule,bins:categories.map(c=>({id:c.id,name:c.name})),deck:shuffle(kinds,random).map(k=>makeVehicle(k,random)),index:0,placed:false,parked:[]};
  }
  if(kind==='difference')return makeDifference(challenge?'challenge':'practice',seed);
  return makeSudoku(challenge?4:2,seed);
}
export function makeDifference(difficulty:DifferenceDifficulty,seed:number):DifferenceRound{
 const random=seeded(seed),level=differenceLevels[difficulty];
 const vehicles=pickPictureVehicles(Math.min(level.count,6),random),lineup=[...vehicles];
 if(level.count>6)lineup.push(...shuffle(vehicles,random).slice(0,level.count-6));
 // The PNG defines each vehicle's appearance; no random recoloring.
 const vehicle=(kind:CarKind):PictureVehicle=>({kind,color:(colors as Partial<Record<CarKind,string[]>>)[kind]?.[0]??'#6e9eaf'});
 const left=shuffle(lineup,random).map(vehicle),right=left.map(v=>({...v}));
 const differences=shuffle(left.map((_,i)=>i),random).slice(0,level.differences);
 for(const index of differences)right[index]=vehicle(pick(vehicles.filter(kind=>kind!==left[index].kind),random));
 return {kind:'difference',difficulty,seed,vehicles,left,right,differences,found:[],complete:false,message:'',hint:false,hintLevel:0,wrong:0,hints:0};
}
export type ReplayAction={type:'home'}|{type:'start';round:Round}|{type:'category';category:Category}|{type:'bin';bin:string}|{type:'next'}|{type:'spot';index:number}|{type:'select';index:number}|{type:'symbol';value:number}|{type:'hint'};
function mistake<T extends Round>(state:T,soft:string):T{const hintLevel=Math.min(3,state.hintLevel+1);return {...state,wrong:state.wrong+1,hint:false,hintLevel,message:hintLevel===1?soft:hintLevel===2?'看看亮起来的地方。':'看手指示范，再试试。'};}
export function replayReducer(state:Round|null,action:ReplayAction):Round|null {
 if(action.type==='home')return null;
 if(action.type==='start')return action.round;
 if(!state||state.complete)return state;
 if(action.type==='hint'&&state.kind==='sudoku'){if(state.selected===null)return state;const hintLevel=Math.min(2,state.hintLevel+1);return {...state,hint:true,hintLevel,hints:state.hints+1,conflicts:[],message:hintLevel===1?sudokuSpeech.rowColumn:sudokuSpeech.vehicle};}
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
   if(!Number.isInteger(action.index)||action.index<0||action.index>=state.left.length||state.found.includes(action.index))return state;
   if(!state.differences.includes(action.index))return mistake(state,'再看看。');
   const found=[...state.found,action.index];return {...state,found,hint:false,hintLevel:0,complete:found.length===state.differences.length,message:found.length===state.differences.length?differenceSpeech.complete:'找到啦！'};
 }
 if(state.kind==='sudoku'){
   if(action.type==='select'&&state.values[action.index]===-1)return {...state,selected:action.index,hint:false,hintLevel:0,conflicts:[],message:''};
   if(action.type==='symbol'&&state.selected!==null){
     const i=state.selected;if(state.values[i]!==-1)return state;
     if(!Number.isInteger(action.value)||action.value<0||action.value>=state.size)return state;
     if(action.value!==state.solution[i]){const conflicts=state.values.flatMap((v,j)=>v===action.value&&(Math.floor(j/state.size)===Math.floor(i/state.size)||j%state.size===i%state.size)?[j]:[]);return {...state,wrong:state.wrong+1,hint:false,hintLevel:0,conflicts,message:conflicts.length?sudokuSpeech.conflict:sudokuSpeech.observe};}
     const values=[...state.values];values[i]=action.value;const next=values.indexOf(-1);
     return {...state,values,selected:next<0?null:next,hint:false,hintLevel:0,complete:next<0,conflicts:[],message:next<0?sudokuSpeech.complete:sudokuSpeech.correct};
   }
 }
 return state;
}
