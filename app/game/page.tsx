import Playroom from '../../components/playroom';
import { requireChatGPTUser } from '../chatgpt-auth';

export default async function Game(){
 await requireChatGPTUser('/game');
 return <Playroom/>;
}
