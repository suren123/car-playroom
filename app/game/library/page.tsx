import {redirect} from 'next/navigation';
import {requireChatGPTUser} from '../../chatgpt-auth';

export default async function Library({searchParams}:{searchParams:Promise<{category?:string|string[]}>}){
 await requireChatGPTUser('/game/library');
 const {category}=await searchParams;
 redirect(category==='focus'||category==='rules'?`/game?category=${category}`:'/game');
}
