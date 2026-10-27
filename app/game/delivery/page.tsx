import {requireChatGPTUser} from '../../chatgpt-auth';
import DeliveryGame from '../../../games/delivery/scene';
export default async function DeliveryPage(){const user=await requireChatGPTUser('/game/delivery');return <DeliveryGame account={user.userId}/>;}
