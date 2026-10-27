import {requireChatGPTUser} from '../../chatgpt-auth';
import DeliveryGame from '../../../games/delivery/scene';
import RoundLease from '../../../components/round-lease';
export default async function DeliveryPage(){const user=await requireChatGPTUser('/game/delivery');return <RoundLease account={user.userId} game="delivery"><DeliveryGame account={user.userId}/></RoundLease>;}
