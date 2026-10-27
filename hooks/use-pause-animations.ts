'use client';
import {useLayoutEffect,type RefObject} from 'react';

// CSS transitions (such as the bridge crossing) also need to stop during rest.
export function usePauseAnimations(root:RefObject<HTMLElement|null>,paused:boolean){
 useLayoutEffect(()=>{
  if(!paused)return;
  const animations=root.current?.getAnimations?.({subtree:true}).filter(animation=>animation.playState==='running')??[];
  for(const animation of animations)animation.pause();
  return()=>{for(const animation of animations)if(animation.playState==='paused')animation.play();};
 },[root,paused]);
}
