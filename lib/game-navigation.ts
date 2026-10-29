import type {GameId} from '../games/registry';

export type GameScreen='welcome'|'levels'|'cars'|'difficulty'|'play'|'loading';
export type BackTarget='home'|'welcome'|'levels'|'cars'|'difficulty';
export function gameBackTarget(game:GameId,screen:GameScreen):BackTarget{
 if(game==='delivery')return screen==='play'?'cars':screen==='cars'||screen==='loading'?'levels':screen==='levels'?'welcome':'home';
 if(['sudoku','difference','sort','repair','bridge','traffic','listen','detour'].includes(game))return screen==='play'||screen==='loading'?'difficulty':'home';
 if(game==='queue')return screen==='play'?'cars':'home';
 return 'home';
}
export function hubUrl(category:unknown){return category==='focus'||category==='rules'?`/game?category=${category}`:'/game';}
export type GameEntry={account:string;game:GameId;home:string};
export function validGameEntry(value:unknown,account:string,game:GameId):value is GameEntry{
 if(!value||typeof value!=='object')return false;
 const entry=value as GameEntry;
 return entry.account===account&&entry.game===game&&['/game','/game?category=focus','/game?category=rules'].includes(entry.home);
}
// A handoff between the hub and the next client route, never a game snapshot.
let pending:GameEntry|null=null;
export function rememberGameEntry(account:string,game:GameId,category:unknown){pending={account,game,home:hubUrl(category)};}
export function takeGameEntry(account:string,game:GameId):GameEntry|null{
 const entry=pending;
 if(!entry||!validGameEntry(entry,account,game))return null;
 pending=null;return {account,game,home:entry.home};
}
