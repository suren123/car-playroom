'use client';
import {useEffect,useState} from 'react';
import {getAudioSettings,getAudioStatus,setAudioSettings} from './speech';
export function useAudioSettings(){
 const [settings,setSettings]=useState({muted:false,voice:true,effects:true});
 const [status,setStatus]=useState<ReturnType<typeof getAudioStatus>>('ready');
 useEffect(()=>{const update=()=>setSettings(getAudioSettings()),sound=()=>setStatus(getAudioStatus());update();sound();window.addEventListener('car-audio-settings',update);window.addEventListener('car-audio-status',sound);window.addEventListener('storage',update);return()=>{window.removeEventListener('car-audio-settings',update);window.removeEventListener('car-audio-status',sound);window.removeEventListener('storage',update);};},[]);
 return {settings,status,setAudioSettings};
}
