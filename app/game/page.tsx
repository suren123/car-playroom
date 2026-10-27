import Playroom from '../../components/playroom';
import { requireChatGPTUser } from '../chatgpt-auth';

export default async function Game(){
 const user=await requireChatGPTUser('/game');
 return <Playroom account={user.userId}/>;
}
