import {gameIds} from '../games/registry.ts';
const games = new Set<string>(gameIds);
const reply = (body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const bounded = (value:unknown)=>Number.isInteger(value)&&Number(value)>=0&&Number(value)<=99;

export async function handleRecords(request:Request,env:{DB?:D1Database}):Promise<Response>{
 const db=env.DB;
 if(!db)return reply({message:'记录服务暂时不可用。'},503);
 const origin=new URL(request.url).origin;
 if(request.method!=='GET'&&request.headers.get('origin')!==origin)return reply({message:'请重新打开游戏后再试。'},403);
 try{
  if(request.method==='GET'){
   const params=new URL(request.url).searchParams,rawOffset=params.get('offset')||'0',game=params.get('game'),from=params.get('from'),to=params.get('to');
   const offset=Number(rawOffset);if(!Number.isSafeInteger(offset)||offset<0||offset>100000)return reply({message:'记录页码不正确。'},400);
   if((game&&!games.has(game))||((from||to)&&(!from||!to||!Number.isFinite(Date.parse(from))||!Number.isFinite(Date.parse(to))||from>=to)))return reply({message:'筛选条件不正确。'},400);
   const meta=await db.prepare('SELECT epoch FROM record_meta WHERE id=1').first<{epoch:number}>();
   const clauses:string[]=[],values:(string|number)[]=[];if(game){clauses.push('game = ?');values.push(game);}if(from&&to){clauses.push('ended_at >= ? AND ended_at < ?');values.push(from,to);}values.push(offset);
   const rows=await db.prepare(`SELECT id,game,started_at AS startedAt,ended_at AS endedAt,completed,wrong,premature,hints,retries,pauses,difficulty,game_version AS gameVersion,level_id AS levelId,seed,parameters,supports FROM game_rounds ${clauses.length?'WHERE '+clauses.join(' AND '):''} ORDER BY ended_at DESC, id DESC LIMIT 50 OFFSET ?`).bind(...values).all();
   return reply({epoch:meta?.epoch??0,records:rows.results??[],hasMore:(rows.results??[]).length===50});
  }
  if(request.method==='DELETE'){
   await db.batch([db.prepare('DELETE FROM game_rounds'),db.prepare('INSERT INTO record_meta(id,epoch) VALUES(1,1) ON CONFLICT(id) DO UPDATE SET epoch=epoch+1')]);
   const meta=await db.prepare('SELECT epoch FROM record_meta WHERE id=1').first<{epoch:number}>();
   return reply({ok:true,epoch:meta?.epoch??1});
  }
  if(request.method!=='POST')return reply({message:'不支持此操作。'},405);
  const raw=await request.text();if(raw.length>4096)return reply({message:'记录内容过长。'},413);
  let item:Record<string,unknown>;
  try{item=JSON.parse(raw);if(!item||typeof item!=='object'||Array.isArray(item))throw new Error('invalid');}catch{return reply({message:'记录格式不正确。'},400);}
  const keys=['wrong','premature','hints','retries','pauses'];
  const dates=typeof item.startedAt==='string'&&typeof item.endedAt==='string'&&Number.isFinite(Date.parse(item.startedAt))&&Number.isFinite(Date.parse(item.endedAt));
  if(typeof item.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(item.id)||!games.has(String(item.game))||!dates||typeof item.completed!=='boolean'||!keys.every(k=>bounded(item[k]))||!Number.isSafeInteger(item.epoch)||Number(item.epoch)<0||!['simple','auto','challenge'].includes(String(item.difficulty)))return reply({message:'记录格式不正确。'},400);
  const meta=await db.prepare('SELECT epoch FROM record_meta WHERE id=1').first<{epoch:number}>();
  if(item.epoch!==(meta?.epoch??0))return reply({message:'记录已清空，请刷新后再试。'},409);
  if((item.gameVersion!=null&&(typeof item.gameVersion!=='string'||item.gameVersion.length>30))||(item.levelId!=null&&(!Number.isInteger(item.levelId)||Number(item.levelId)<1||Number(item.levelId)>100))||(item.seed!=null&&(!Number.isSafeInteger(item.seed)||Number(item.seed)<0||Number(item.seed)>4294967295))||(['parameters','supports'] as const).some(k=>item[k]!=null&&(typeof item[k]!=='string'||(item[k] as string).length>500)))return reply({message:'记录参数不正确。'},400);
  await db.prepare('INSERT INTO game_rounds(id,game,started_at,ended_at,completed,wrong,premature,hints,retries,pauses,difficulty,game_version,level_id,seed,parameters,supports) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING')
   .bind(item.id,item.game,item.startedAt,item.endedAt,item.completed?1:0,item.wrong,item.premature,item.hints,item.retries,item.pauses,item.difficulty,item.gameVersion??null,item.levelId??null,item.seed??null,item.parameters??null,item.supports??null).run();
  return reply({ok:true});
 }catch{return reply({message:'记录暂时没有保存，请稍后重试。'},503);}
}
