'use client';
import {useLayoutEffect,useRef,useState,type RefObject} from 'react';
import {stopSpeech} from '../lib/speech';

// Own the lock only while a round/result is mounted. Restore the exact prior
// inline styles and scroll position when returning to a scrollable selection.
export function useGameViewport(header:RefObject<HTMLElement|null>,active:boolean,onInterrupt?:()=>void){
 const [reason,setReason]=useState<'landscape'|'small'|null>(null),callback=useRef(onInterrupt);
 useLayoutEffect(()=>{callback.current=onInterrupt;},[onInterrupt]);
 useLayoutEffect(()=>{
  const root=header.current?.closest('main');if(!active||!root)return;
  const html=document.documentElement,body=document.body,x=scrollX,y=scrollY;
  const saved=[html.style.overflow,html.style.overscrollBehavior,body.style.overflow,body.style.position,body.style.top,body.style.left,body.style.width];
  html.style.overflow='hidden';html.style.overscrollBehavior='none';body.style.overflow='hidden';body.style.position='fixed';body.style.top=`${-y}px`;body.style.left=`${-x}px`;body.style.width='100%';
  root.classList.add('game-viewport');let previous:string|null=null;
  const resize=()=>{
   const viewport=window.visualViewport;
   // Do not treat accessibility pinch zoom as a device resize.
   const zoomed=!!viewport&&viewport.scale>1.01;root.toggleAttribute('data-game-zoomed',zoomed);if(zoomed)return;
   const width=viewport?.width??innerWidth,height=viewport?.height??innerHeight;
   root.style.setProperty('--game-height',`${Math.floor(height)}px`);
   const next=width>height?'landscape':width<600||height<800?'small':null;
   root.classList.toggle('game-orientation-blocked',!!next);setReason(next);
   if(next&&next!==previous){stopSpeech();callback.current?.();}previous=next;
  };
  const touch=(event:TouchEvent)=>{
   if(event.touches.length!==1||window.visualViewport&&window.visualViewport.scale>1.01)return;
   const target=event.target;
   // Parent panels and review content are separate scroll containers. Never
   // disable their touch stream, or the queue's pointer-driven drag events.
   if(target instanceof Element&&target.closest('.parent-panel,.dv-modal,.playroom-modal'))return;
   if(event.cancelable)event.preventDefault();
  };
  resize();window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
  root.addEventListener('touchmove',touch,{passive:false});
  return()=>{
   root.removeEventListener('touchmove',touch);window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);
   root.removeAttribute('data-game-zoomed');root.classList.remove('game-viewport','game-orientation-blocked');root.style.removeProperty('--game-height');
   [html.style.overflow,html.style.overscrollBehavior,body.style.overflow,body.style.position,body.style.top,body.style.left,body.style.width]=saved;
   window.scrollTo(x,y);
  };
 },[active,header]);
 return active?reason:null;
}
