import type { ReactNode } from 'react';
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
  search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></>,
  grid: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/></>,
  traffic: <><rect x="7" y="2" width="10" height="20" rx="4"/><circle cx="12" cy="8" r="2"/><circle cx="12" cy="16" r="2"/></>,
  route: <><path d="M4 20V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v12M4 16h16"/><path d="m9 11 3-3 3 3"/></>,
 };
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind] || paths.heart}</svg>;
}
export function Logo() {return <a className="logo" href="/game" aria-label="汽车小任务，回到车库"><span className="logo-icon"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M3 18h26v8H3zM7 11h14l6 9H4l3-9Z" fill="currentColor"/><path d="M10 13h9l3 5H8l2-5Z" fill="#fff6e9"/><circle cx="9" cy="26" r="4" fill="#283f3b"/><circle cx="24" cy="26" r="4" fill="#283f3b"/></svg></span><span>汽车小任务<small>LITTLE CAR MISSIONS</small></span></a>}
export {RepairWheel as Wheel,RepairPart as Part,RepairCar as CarArt} from './repair-art';
