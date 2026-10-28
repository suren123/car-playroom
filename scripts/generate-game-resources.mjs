import {writeFileSync,readFileSync} from 'node:fs';
import {buildGameResources} from './game-resource-catalog.mjs';
const output=JSON.stringify(buildGameResources(),null,2)+'\n',file='lib/game-resources.generated.json';
if(process.argv.includes('--check')){
 if(readFileSync(file,'utf8').replaceAll('\r\n','\n')!==output)throw Error('Resource manifest is stale. Run npm run resources:generate.');
}else writeFileSync(file,output);
console.log('Game resource sizes, content hashes and per-game lists are current.');
