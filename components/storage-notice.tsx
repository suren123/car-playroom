'use client';
import {useEffect,useState} from 'react';
export default function StorageNotice(){
 const [message,setMessage]=useState('');
 useEffect(()=>{
  const warn=()=>setMessage('本机暂时无法保存设置或陪玩记录，请检查浏览器存储设置。');
  window.addEventListener('car-storage-unavailable',warn);
  return()=>window.removeEventListener('car-storage-unavailable',warn);
 },[]);
 return message?<p role="status" className="storage-notice">{message}</p>:null;
}
