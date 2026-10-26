import type { CSSProperties, ReactNode } from 'react';
export function LittleIcon({kind}: {kind: string}) {
 const paths: Record<string, ReactNode> = {
  heart: <path d="M12 20S3 15 3 8.5a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1C21 15 12 20 12 20Z"/>,
  leaf: <><path d="M20 3C7 2 2 8 5 15c6 7 15-1 15-12Z"/><path d="m5 21 10-12"/></>,
  pause: <path d="M8 5v14M16 5v14"/>,
  sound: <><path d="m11 4-6 5H2v6h3l6 5V4Z"/><path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
  mute: <><path d="m11 4-6 5H2v6h3l6 5V4Z"/><path d="m16 9 6 6m0-6-6 6"/></>,
  hands: <><path d="m3 14 4-4 4 4 5-7 5 4M3 18h18M8 5l2-2m6 1 2 2"/></>,
  garage: <><path d="m2 10 10-7 10 7v11H2V10Z"/><path d="M6 21V11h12v10M6 15h12M6 18h12"/></>,
  tool: <path d="m14 7 3 3 5-5a7 7 0 0 1-9 9L6 21a2.1 2.1 0 0 1-3-3l7-7a7 7 0 0 1 9-9l-5 5Z"/>,
  bridge: <><path d="M2 15h20M4 15V6m16 9V6M4 7q8 12 16 0M8 12v3m4-1v1m4-3v3M4 15v6m16-6v6"/></>,
  hint: <><path d="M9 18h6m-6 3h6M8 14a7 7 0 1 1 8 0l-1 2H9l-1-2Z"/></>,
  help: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3M3 8l-2 1m20-1 2 1"/></>,
  retry: <path d="M4 9a9 9 0 1 1 1 10M4 3v6h6"/>,
  home: <><path d="m2 11 10-8 10 8M5 9v12h14V9M10 21v-7h4v7"/></>,
 };
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind] || paths.heart}</svg>;
}
export function Logo() {return <a className="logo" href="/game" aria-label="汽车小任务，回到车库"><span className="logo-icon"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M3 18h26v8H3zM7 11h14l6 9H4l3-9Z" fill="currentColor"/><path d="M10 13h9l3 5H8l2-5Z" fill="#fff6e9"/><circle cx="9" cy="26" r="4" fill="#283f3b"/><circle cx="24" cy="26" r="4" fill="#283f3b"/></svg></span><span>汽车小任务<small>LITTLE CAR MISSIONS</small></span></a>}
export function Wheel({size=64}: {size?: number}) {return <svg style={{width:size,height:size,flexShrink:0}} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="45" fill="#314542"/><circle cx="50" cy="50" r="32" fill="#60726c"/><circle cx="50" cy="50" r="21" fill="#fff5df"/><circle cx="50" cy="50" r="8" fill="#bdc9c0"/>{[0,60,120,180,240,300].map(a=><path key={a} d="M50 13v8" stroke="#9aa79c" strokeWidth="4" transform={`rotate(${a} 50 50)`}/>)}</svg>}
export function Part({kind, variant=0, wheelSize=82}: {kind: string; variant?: number; wheelSize?: number}) {
 if(kind==='wheel') return <span className={`wheel-choice wheel-size-${variant}`}><Wheel size={Math.round(wheelSize*(variant===0 ? 1 : variant===1 ? 1.45 : .62))}/></span>;
 if(kind==='light') return <svg viewBox="0 0 140 105" aria-hidden="true"><path d="M35 83h70" stroke="#425b53" strokeWidth="7" strokeLinecap="round"/>{variant===0 ? <><path d="M44 78V49a26 26 0 0 1 52 0v29" fill="#e5a546"/><path d="M53 68V49a17 17 0 0 1 17-17" stroke="#ffe4a5" strokeWidth="7" fill="none" strokeLinecap="round"/></> : variant===1 ? <><rect x="24" y="43" width="92" height="35" rx="10" fill="#a9b7ae"/><circle cx="49" cy="60" r="11" fill="#fff2c5"/><circle cx="91" cy="60" r="11" fill="#fff2c5"/></> : <><path d="M52 80V29h36v51" fill="#7d9c8a"/><circle cx="70" cy="44" r="8" fill="#d65341"/><circle cx="70" cy="66" r="8" fill="#f3d280"/></>}</svg>;
 return <svg viewBox="0 0 140 105" aria-hidden="true"><g stroke={variant===0?'#789a8b':variant===1?'#de9b61':'#d3614d'} strokeWidth="9" fill="none" strokeLinecap="round"><path d={variant===0?'M30 23v60m80-60v60M30 30h80M30 52h80M30 75h80':variant===1?'M20 71h100M20 35h100M35 35v36m35-36v36m35-36v36':'M25 30v55m90-55v55M25 30q45 55 90 0'}/></g></svg>;
}
export function CarArt({kind='fire', repaired=true, missing='wheel', className='', style}: {kind?: 'fire'|'bus'; repaired?: boolean; missing?: string; className?: string; style?: CSSProperties}) {
 const red=kind==='fire'?'#d9644f':'#e4b453';
 return <svg className={`car-art ${className}`} style={style} viewBox="0 0 620 320" fill="none" aria-hidden="true">
 <ellipse cx="310" cy="283" rx="258" ry="16" fill="#38564b" opacity=".10"/>
 <path d="M55 142a18 18 0 0 1 18-18h309v131H55V142Z" fill={red}/><path d="M382 126a23 23 0 0 1 23-23h69a28 28 0 0 1 23 12l44 63v77H382V126Z" fill={red}/>
 <path d="M403 124h62a15 15 0 0 1 12 6l31 45H403v-51Z" fill="#c5e4df"/><path d="m430 124 38 51h-24l-36-51h22Z" fill="#e4f3e7"/>
 <path d="M55 211h487v20H55z" fill="#f8d796"/><path d="M57 145h310v9H57z" fill="#f09377"/>
 <rect x="78" y="164" width="104" height="40" rx="6" fill="#f4e5cc"/><path d="M89 177h82m-82 13h82" stroke="#a6b6a9" strokeWidth="5"/>
 <rect x="198" y="164" width="151" height="40" rx="6" fill="#af493b"/><path d="M215 176h113m-113 13h113" stroke="#d3785c" strokeWidth="5"/>
 <rect x="415" y="188" width="20" height="7" rx="3" fill="#f3d99e"/><rect x="529" y="193" width="20" height="16" rx="4" fill="#fff2c5"/><rect x="45" y="240" width="508" height="17" rx="6" fill="#46625a"/>
 {(repaired || missing!=='ladder') ? <g stroke="#e5e5cb" strokeWidth="9" strokeLinecap="round"><path d="M86 99h276M86 117h276"/>{[110,151,192,233,274,315,350].map(x=><path key={x} d={`M${x} 99v18`}/>)}</g> : <rect x="85" y="94" width="276" height="27" rx="8" stroke="#6c8b76" strokeDasharray="10 9" strokeWidth="3"/>}
 {(repaired || missing!=='light') ? <><path d="M428 101V84a16 16 0 0 1 32 0v17" fill="#eab14e"/><path d="M436 86v9" stroke="#ffe9b9" strokeWidth="5" strokeLinecap="round"/><path d="M422 101h44" stroke="#46625a" strokeWidth="7" strokeLinecap="round"/></> : <rect x="420" y="66" width="47" height="38" rx="10" stroke="#6c8b76" strokeDasharray="7 6" strokeWidth="3"/>}
 {[147,450].map((x,i)=><g key={x} transform={`translate(${x-46},212)`}>{!repaired&&missing==='wheel'&&i===0 ? <><circle cx="46" cy="46" r="43" fill="#e4dbbf" stroke="#7c9685" strokeWidth="3" strokeDasharray="9 8"/><path d="M30 46h32m-16-16v32" stroke="#7c9685" strokeWidth="4" strokeLinecap="round"/></> : <><circle cx="46" cy="46" r="46" fill="#314542"/><circle cx="46" cy="46" r="31" fill="#64766b"/><circle cx="46" cy="46" r="20" fill="#f6e4bc"/><circle cx="46" cy="46" r="8" fill="#aab9aa"/></>}</g>)}
 <path d="M523 223c0 7-6 12-13 12s-13-5-13-12" stroke="#763f32" strokeWidth="4" strokeLinecap="round"/><circle cx="491" cy="163" r="4" fill="#314c43"/>
 </svg>;
}
