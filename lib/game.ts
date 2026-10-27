export type Mode = 'home' | 'repair' | 'bridge';
export type GameState = {mode: Mode; task: number; success: boolean; complete: boolean; boards: number; turn: 'child'|'parent'; hint: boolean; message: string; lockedUntil: number};
export const repairTasks = [
 {kind:'wheel', title:'帮小车装好轮胎', instruction:'找一找，哪个轮胎和车上的一样大？', hint:'看看小车右边的轮胎，再比一比大小。', success:'轮胎装好了！你找到合适的大小啦。', orders:[1,0,2], labels:['一样大的轮胎','大轮胎','小轮胎']},
 {kind:'light', title:'帮小车装上车顶灯', instruction:'车顶少了一盏灯，选一盏圆圆的车顶灯。', hint:'找找黄色、圆圆的那盏车顶灯。', success:'车顶灯装好了！小车又精神啦。', orders:[2,1,0], labels:['圆圆的车顶灯','车前灯','红绿灯']},
 {kind:'ladder', title:'帮小车装好梯子', instruction:'选一把竖着的梯子，上面有三根横档。', hint:'找找两条竖杆、中间三根横档的梯子。', success:'梯子装好了！三个小任务都完成啦。', orders:[0,2,1], labels:['三根横档的竖梯','横着的梯子','弯弯的栏杆']},
];
export const bridgeTasks = [
 {title:'一起搭过小河的桥', place:'小河', line:'小河在唱歌，我们一起铺好四块桥板。'},
 {title:'一起搭过水洼的桥', place:'小水洼', line:'路上有个小水洼，我们轮流来搭桥。'},
 {title:'一起搭过小山沟的桥', place:'小山沟', line:'最后一座小桥啦，我们还是一人一块。'},
];
export const initialState: GameState = {mode:'home',task:0,success:false,complete:false,boards:0,turn:'child',hint:false,message:'',lockedUntil:0};
export type Action = {type:'start'; mode:'repair'|'bridge'} | {type:'restore';state:GameState} | {type:'home'} | {type:'choose'; variant:number} | {type:'place'; actor:'child'|'parent'; now:number} | {type:'hint'} | {type:'help'} | {type:'retry'} | {type:'next'};
export function gameReducer(state:GameState, action:Action):GameState {
 if(action.type==='restore')return {...action.state,lockedUntil:0};
 if(action.type==='home') return {...initialState};
 if(action.type==='start') return {...initialState,mode:action.mode,message:action.mode==='repair'?repairTasks[0].instruction:'一人放一块，先轮到小司机。'};
 if(state.mode==='home'||state.complete) return state;
 if(action.type==='choose'&&state.mode==='repair'&&!state.success) {
  const task=repairTasks[state.task];
  if(action.variant===0) return {...state,success:true,hint:false,message:task.success};
  const message=task.kind==='wheel'?(action.variant===1?'这个轮胎有点大，再看看车上的轮胎。':'这个轮胎有点小，再看看车上的轮胎。'):'这一个还不太合适。我们再看看，也可以请大人帮忙。';
  return {...state,message};
 }
 if(action.type==='place'&&state.mode==='bridge'&&!state.success) {
  if(action.now<state.lockedUntil) return state;
  if(action.actor!==state.turn) return {...state,message:state.turn==='parent'?'这一块轮到大人。我们等一等，下一块就轮到你。':'这一块轮到小司机。大人也要等一等哦。'};
  const boards=state.boards+1, success=boards===4, turn=state.turn==='child'?'parent':'child';
  return {...state,boards,success,turn,lockedUntil:action.now+650,message:success?'小桥搭好啦！你一块，我一块，消防车可以过桥啦。':turn==='parent'?'这一块放好了！现在轮到大人。':'谢谢大人！现在轮到小司机。'};
 }
 if(action.type==='hint'&&!state.success) return {...state,hint:true,message:state.mode==='repair'?repairTasks[state.task].hint:'看头像，亮起来的那一边放一块桥板。'};
 if(action.type==='help'&&!state.success) return {...state,hint:true,message:'可以说：“有点难，请帮帮我。”大人陪你一起看看。'};
 if(action.type==='retry'&&!state.success) return {...state,hint:false,message:state.mode==='repair'?'我们慢慢来，再选一个试试。':'没关系，已经搭好的桥还在。我们从这里继续。'};
 if(action.type==='next'&&state.success) {
  if(state.task===2) return {...state,complete:true,message:'小车回到车库啦。谢谢你们一起完成小任务！'};
  const task=state.task+1;
  return {...state,task,success:false,boards:0,turn:'child',hint:false,lockedUntil:0,message:state.mode==='repair'?repairTasks[task].instruction:bridgeTasks[task].line+'先轮到小司机。'};
 }
 return state;
}
