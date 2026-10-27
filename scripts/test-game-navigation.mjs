import assert from 'node:assert/strict';
import {gameBackTarget,hubUrl,rememberGameEntry,takeGameEntry,validGameEntry} from '../lib/game-navigation.ts';

for(const [game,screen,target] of [
 ['delivery','welcome','home'],['delivery','levels','welcome'],['delivery','cars','levels'],['delivery','play','cars'],['delivery','loading','levels'],
 ...['sudoku','difference'].flatMap(game=>[['difficulty','home'],['play','difficulty'],['loading','difficulty']].map(([screen,target])=>[game,screen,target])),
 ['queue','cars','home'],['queue','play','cars'],
 ...['sort','repair','bridge','traffic','listen','detour'].map(game=>[game,'play','home']),
])assert.equal(gameBackTarget(game,screen),target,`${game}/${screen}`);
assert.equal(hubUrl('focus'),'/game?category=focus');assert.equal(hubUrl('rules'),'/game?category=rules');
for(const invalid of [null,undefined,'//example.org','focus&redirect=evil'])assert.equal(hubUrl(invalid),'/game');
assert.equal(takeGameEntry('a','queue'),null);
rememberGameEntry('a','queue','rules');assert.equal(takeGameEntry('b','queue'),null);assert.equal(takeGameEntry('a','sudoku'),null);
const entry=takeGameEntry('a','queue');assert.deepEqual(entry,{account:'a',game:'queue',home:'/game?category=rules'});assert.equal(takeGameEntry('a','queue'),null);
assert.ok(validGameEntry(entry,'a','queue'));assert.equal(validGameEntry(entry,'a','delivery'),false);assert.equal(validGameEntry(entry,'b','queue'),false);
for(const home of ['https://example.org','/login','/game?category=unknown','/game/delivery'])assert.equal(validGameEntry({...entry,home},'a','queue'),false);
console.log('PASS: all ten games’ parent targets, preparation/loading boundaries, filtered hub whitelist, single-use entry handoff and account/game isolation.');
