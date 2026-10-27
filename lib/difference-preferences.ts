import type {DifferenceDifficulty} from './replay-games';

export const differenceDifficultyKey=(account:string)=>`car-playroom-difference-level:${account}`;
export function readDifferenceDifficulty(storage:Pick<Storage,'getItem'>,account:string):DifferenceDifficulty{
 try{
  const saved=storage.getItem(differenceDifficultyKey(account));
  if(saved==='beginner'||saved==='practice'||saved==='challenge')return saved;
  const old=storage.getItem(`car-playroom-difficulty:${account}:difference`);
  if(old==='simple')return 'practice';
  if(old==='challenge')return 'challenge';
  if(old==='auto'||old===null){
   const stage=storage.getItem(`car-playroom-stage:${account}:difference`);
   if(stage==='1')return 'challenge';
   if(stage==='0'||old==='auto')return 'practice';
  }
 }catch{/* A fresh game does not require browser storage. */}
 return 'beginner';
}
