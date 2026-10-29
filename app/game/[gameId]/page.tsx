import {notFound} from 'next/navigation';
import DifferenceGame from '../../../components/difference-game';
import SudokuGame from '../../../components/sudoku-game';
import WorkshopGame from '../../../components/workshop-game';
import type {WorkshopGame as WorkshopGameId} from '../../../games/workshop/model';
import {gameIds,type GameId} from '../../../games/registry';
import {requireChatGPTUser} from '../../chatgpt-auth';
import GameResourceGate from '../../../components/game-resource-gate';

export default async function GamePage({params}:{params:Promise<{gameId:string}>}){
 const {gameId}=await params;
 if(!gameIds.includes(gameId as GameId)||gameId==='delivery')notFound();
 const user=await requireChatGPTUser(`/game/${gameId}`);
 const game=gameId as GameId;
 return <GameResourceGate key={`${user.userId}:${game}`} account={user.userId} game={game}>
  {game==='difference'?<DifferenceGame account={user.userId}/>:game==='sudoku'?<SudokuGame account={user.userId}/>:<WorkshopGame key={game} account={user.userId} game={game as WorkshopGameId}/>}
 </GameResourceGate>;
}
