'use client';
import { useState } from 'react';
import { CarArt, Logo, LittleIcon } from '../../components/car-art';
export default function Login() {
 const [error, setError] = useState(''), [busy, setBusy] = useState(false);
 async function login(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (busy) return; setBusy(true); setError('');
  const form = new FormData(event.currentTarget);
  try {
   const response = await fetch('/api/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:form.get('username'),password:form.get('password')})});
   const data = await response.json() as {message?: string}; if (!response.ok) throw new Error(data.message || '暂时没有连上，请稍后再试。');
   window.location.assign('/game');
  } catch(err) {setError(err instanceof Error ? err.message : '网络没有连上，请再试一次。'); setBusy(false);}
 }
 return <main className="login-page"><header className="site-header"><Logo/><span className="quiet-pill"><span className="green-dot"/> 家庭专属小车库</span></header><div className="login-layout">
  <section className="login-story"><div className="eyebrow"><span/> 给小小车迷的成长冒险</div><h1>小车准备好啦，<br/>我们<span className="coral-text">一起慢慢来。</span></h1><p className="lead">修好一辆小车，搭起一座小桥。<br/>和爸爸妈妈一起，试一试、等一等、再出发。</p>
   <div className="hero-scene"><span className="cloud cloud-one"/><span className="cloud cloud-two"/><span className="sun"/><div className="scene-hills"/><CarArt/><div className="road-markings"/><span className="scene-badge"><LittleIcon kind="heart"/> 有你陪着，真好</span><span className="tree tree-one"/><span className="tree tree-two"/></div>
   <div className="story-notes"><span><LittleIcon kind="hands"/> 亲子一起玩</span><span><LittleIcon kind="leaf"/> 按自己的节奏</span><span><LittleIcon kind="pause"/> 随时可以休息</span></div>
  </section><section className="login-card" aria-labelledby="login-title"><div className="garage-symbol"><LittleIcon kind="garage"/></div><div className="eyebrow">PARENTS’ PIT STOP · 家长入口</div><h2 id="login-title">欢迎回到小车库</h2><p>请家长登录，再邀请小司机一起出发。</p>
   <form onSubmit={login}><label htmlFor="username">家庭账号</label><input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} defaultValue="parent" required/><label htmlFor="password">家庭密码</label><input id="password" type="password" name="password" autoComplete="current-password" placeholder="输入家庭密码" required maxLength={256}/><div className="login-error" role="alert">{error}</div><button className="primary wide" disabled={busy} type="submit">{busy?'正在打开车库…':'打开小车库'}<span aria-hidden="true">→</span></button></form>
   <div className="login-note"><LittleIcon kind="heart"/><p>这里没有比赛，也不用赶时间。<br/>每一次尝试，都有大人陪着。</p></div>
  </section></div><footer className="site-footer"><span>汽车小任务</span><span>小小任务，大大的陪伴。</span><span>无广告 · 无排行榜 · 不采集儿童个人资料</span></footer></main>;
}

