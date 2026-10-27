'use client';
import {useState} from 'react';
import ParentRecords from './parent-records';
import {useAudioSettings} from '../lib/use-audio-settings';
import type {RecordDifficulty} from '../lib/records-client';
import type {GameId} from '../games/registry';

export const difficultyKey=(account:string,game?:GameId)=>`car-playroom-difficulty:${account}:${game??'default'}`;
export function readDifficulty(account:string,game?:GameId):RecordDifficulty{try{const value=localStorage.getItem(difficultyKey(account,game));return value==='simple'||value==='challenge'?value:'auto';}catch{return 'auto';}}
export default function ParentPanel({account,game,difficulty,onDifficulty,onClose,onRestart}:{account:string;game?:GameId;difficulty:RecordDifficulty;onDifficulty:(value:RecordDifficulty)=>void;onClose:()=>void;onRestart?:()=>void}){
 const [tab,setTab]=useState<'settings'|'records'|'help'>('settings');const {settings,setAudioSettings}=useAudioSettings();
 const select=(value:RecordDifficulty)=>{try{localStorage.setItem(difficultyKey(account,game),value);}catch{/* Keep the current setting in memory. */}onDifficulty(value);};
 return <div className="room-overlay"><section className="playroom-modal parent-panel" role="dialog" aria-modal="true" aria-label="家长小车站"><div className="parent-heading"><h2>家长小车站</h2><button className="parent-close" aria-label="关闭家长面板" onClick={onClose}>✕</button></div><nav className="parent-tabs" aria-label="家长选项"><button aria-pressed={tab==='settings'} onClick={()=>setTab('settings')}>设置</button><button aria-pressed={tab==='records'} onClick={()=>setTab('records')}>陪玩记录</button><button aria-pressed={tab==='help'} onClick={()=>setTab('help')}>玩法说明</button></nav>
 {tab==='settings'&&<>{onRestart&&<button className="room-secondary" onClick={onRestart}>重新开始这局</button>}{game!=='difference'&&game!=='sudoku'&&game!=='delivery'&&game!=='bridge'&&game!=='repair'&&<><p className="difficulty-note">难度从下一局生效</p><div className="difficulty-controls">{(['simple','auto','challenge'] as const).map(value=><button key={value} className={difficulty===value?'active':''} aria-pressed={difficulty===value} onClick={()=>select(value)}>{value==='simple'?'简单':value==='auto'?'循序练习':'挑战'}</button>)}</div></>}{game==='delivery'&&<p>快递任务可在选择任务页面调整。</p>}<div className="parent-tabs"><button onClick={()=>setAudioSettings({muted:!settings.muted})}>总声音 {settings.muted?'关':'开'}</button><button onClick={()=>setAudioSettings({voice:!settings.voice})}>语音 {settings.voice?'开':'关'}</button><button onClick={()=>setAudioSettings({effects:!settings.effects})}>音效 {settings.effects?'开':'关'}</button></div></>}
 {tab==='records'&&<ParentRecords/>}
 {tab==='help'&&<div className="room-parent-copy"><p>一起玩，遇到困难可以提示、求助或休息。</p><p>轮流游戏中，大人也等待；游戏不能判断是谁点击。</p><p>玩完后可以用真实玩具车一起排队或送货。记录不评价孩子的能力。</p></div>}
 </section></div>;
}
