import {requireChatGPTUser} from '../../chatgpt-auth';
import DeliveryGame from '../../../games/delivery/scene';
export default async function DeliveryPage(){await requireChatGPTUser('/game/delivery');return <DeliveryGame/>;}
