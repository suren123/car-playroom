import {notFound} from 'next/navigation';
import Playroom from '../../../components/playroom';
import {gameIds,type GameId} from '../../../games/registry';
import {requireChatGPTUser} from '../../chatgpt-auth';
import RoundLease from '../../../components/round-lease';

export default async function GamePage({params}:{params:Promise<{gameId:string}>}){
 const {gameId}=await params;
 if(!gameIds.includes(gameId as GameId)||gameId==='delivery')notFound();
 const user=await requireChatGPTUser(`/game/${gameId}`);
 return <RoundLease account={user.userId} game={gameId as GameId}><Playroom account={user.userId} initialGame={gameId as GameId}/></RoundLease>;
}
