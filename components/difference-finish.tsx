import {Illustration} from './illustration';
import type {DifferenceRound} from '../lib/replay-games';

/** A quiet comparison strip: the actual pairs the child discovered. */
export default function DifferenceFinish({round}:{round:DifferenceRound}){
 return <div className="spot-discoveries" aria-label="这次找到的不同" aria-hidden="true">{round.differences.map(index=><span className="spot-discovery" key={index}><Illustration id={round.left[index].kind}/><i>↔</i><Illustration id={round.right[index].kind}/></span>)}</div>;
}
