'use client';
import { useEffect, useState } from 'react';
import { clearRecords, loadRecords, pendingRecordCount } from '../lib/records-client';

const names:Record<string,string>={sort:'汽车分类',difference:'找不同',sudoku:'汽车数独',repair:'修车小师傅',bridge:'一起修桥',traffic:'红绿灯',queue:'小汽车排队',listen:'听指挥',detour:'道路改道'};
type Row={id:string;game:string;endedAt:string;completed:number;wrong:number;premature:number;hints:number;retries:number;pauses:number};
export default function ParentRecords(){
 const [rows,setRows]=useState<Row[]>([]),[message,setMessage]=useState('正在读取记录…'),[confirm,setConfirm]=useState(false),[pending,setPending]=useState(0),[hasMore,setHasMore]=useState(false),[gameFilter,setGameFilter]=useState(''),[dateFilter,setDateFilter]=useState('');
 async function refresh(){try{const data=await loadRecords();setRows(data.records as Row[]);setHasMore(data.hasMore);setPending(pendingRecordCount());setMessage(data.records.length?'':'还没有游戏记录。');}catch{setPending(pendingRecordCount());setMessage('记录暂时没有同步，联网后点“重试同步”。');}}
 async function more(){try{const data=await loadRecords(rows.length);setRows(old=>[...old,...(data.records as Row[])]);setHasMore(data.hasMore);}catch{setMessage('更早的记录暂时没有读取，请重试。');}}
 useEffect(()=>{void refresh();},[]);
 async function clear(){try{await clearRecords();setRows([]);setHasMore(false);setConfirm(false);setPending(0);setMessage('记录已清空。');}catch{setMessage('清空未成功，请检查网络后重试。');}}
 const visible=rows.filter(row=>(!gameFilter||row.game===gameFilter)&&(!dateFilter||new Date(row.endedAt).toLocaleDateString('sv-SE')===dateFilter));
 return <section className="parent-records" aria-label="陪玩记录"><h3>陪玩记录</h3><p>只记游戏操作，不能判断是谁点的，也不评估孩子的能力。</p>{message&&<p role="status">{message}</p>}{pending>0&&<p role="status">{pending} 局尚未同步。</p>}
  <div className="record-actions"><button onClick={()=>void refresh()}>重试同步</button>{rows.length>0&&<button onClick={()=>setConfirm(true)}>清空全部</button>}</div>
  {confirm&&<div className="record-confirm"><p>清空后无法恢复。</p><button onClick={()=>void clear()}>确认清空</button><button onClick={()=>setConfirm(false)}>取消</button></div>}
  {rows.length>0&&<div className="record-filters"><label>游戏<select value={gameFilter} onChange={e=>setGameFilter(e.target.value)}><option value="">全部</option>{Object.entries(names).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>日期<input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}/></label></div>}
  <div className="record-list">{visible.map(row=><article key={row.id}><strong>{names[row.game]||row.game}</strong><time>{new Date(row.endedAt).toLocaleDateString('zh-CN')}</time><span>{row.completed?'完成':'主动结束'} · 选错 {row.wrong} · 提前点 {row.premature} · 提示 {row.hints} · 重试 {row.retries} · 暂停 {row.pauses}</span></article>)}</div>{hasMore&&<button className="record-more" onClick={()=>void more()}>加载更早记录</button>}
 </section>;
}
