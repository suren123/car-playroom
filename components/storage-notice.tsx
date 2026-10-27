'use client';
import {useEffect,useState} from 'react';
export default function StorageNotice(){const [message,setMessage]=useState('');useEffect(()=>{const warn=()=>setMessage('本机暂时无法保存，退出后可能无法恢复进度；请保持页面打开并检查浏览器存储设置。');const invalid=()=>setMessage('有一局暂时不能继续，可以重新开始。');window.addEventListener('car-storage-unavailable',warn);window.addEventListener('car-round-invalid',invalid);return()=>{window.removeEventListener('car-storage-unavailable',warn);window.removeEventListener('car-round-invalid',invalid);};},[]);return message?<p role="status" className="storage-notice">{message}</p>:null;}
