import Playroom from '../../../components/playroom';
import {requireChatGPTUser} from '../../chatgpt-auth';

export default async function Library(){const user=await requireChatGPTUser('/game/library');return <Playroom account={user.userId} library/>;}
