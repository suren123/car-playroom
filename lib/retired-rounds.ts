import {gameIds} from '../games/registry.ts';

// Migration only: never read or recreate the retired round snapshots/leases.
export function clearRetiredRounds(account:string){
 for(const game of gameIds){
  for(const prefix of ['car-playroom-round-v1','car-playroom-lease']){
   try{localStorage.removeItem(`${prefix}:${account}:${game}`);}catch{/* Old data is inert when storage is unavailable. */}
  }
 }
}
