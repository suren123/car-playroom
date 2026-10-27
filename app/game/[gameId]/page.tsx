import {notFound} from 'next/navigation';
import DifferenceGame from '../../../components/difference-game';
import SudokuGame from '../../../components/sudoku-game';
import Playroom from '../../../components/playroom';
import {gameIds,type GameId} from '../../../games/registry';
import {requireChatGPTUser} from '../../chatgpt-auth';

export default async function GamePage({params}:{params:Promise<{gameId:string}>}){
 const {gameId}=await params;
 if(!gameIds.includes(gameId as GameId)||gameId==='delivery')notFound();
 const user=await requireChatGPTUser(`/game/${gameId}`);
 if(gameId==='difference')return <DifferenceGame account={user.userId}/>;
 if(gameId==='sudoku')return <SudokuGame account={user.userId}/>;
 return <Playroom key={gameId} account={user.userId} initialGame={gameId as GameId}/>;
}
