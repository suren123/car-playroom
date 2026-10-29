import {Illustration} from '../../components/illustration';
import type {CarKind} from '../vehicle-catalog';
export function TinyScene({car='delivery'}:{car?:CarKind}){return <div className="ws-tiny-scene" aria-hidden="true"><span/><Illustration id={car}/><i/></div>;}
