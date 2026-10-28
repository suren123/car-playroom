import {requireChatGPTUser} from '../../chatgpt-auth';
import DeliveryGame from '../../../games/delivery/scene';
import GameResourceGate from '../../../components/game-resource-gate';
export default async function DeliveryPage(){const user=await requireChatGPTUser('/game/delivery');return <GameResourceGate key={user.userId} account={user.userId} game="delivery"><DeliveryGame account={user.userId}/></GameResourceGate>;}
