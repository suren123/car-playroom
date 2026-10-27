import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handleRecords} from '../lib/records-api.ts';

const sqlite=new DatabaseSync(':memory:');
for(const path of ['drizzle/0000_harsh_preak.sql','drizzle/0001_typical_inhumans.sql'])sqlite.exec(readFileSync(path,'utf8').replaceAll('--> statement-breakpoint',''));
class Statement {
 constructor(sql,values=[]){this.sql=sql;this.values=values;}
 bind(...values){return new Statement(this.sql,values);}
 async first(){return sqlite.prepare(this.sql).get(...this.values)??null;}
 async all(){return {results:sqlite.prepare(this.sql).all(...this.values)};}
 async run(){return sqlite.prepare(this.sql).run(...this.values);}
}
const db={prepare:sql=>new Statement(sql),batch:async statements=>Promise.all(statements.map(statement=>statement.run()))};
const url='http://example.test/api/records',origin='http://example.test';
const request=(method,path='',body,overrideOrigin=origin)=>handleRecords(new Request(url+path,{method,headers:{origin:overrideOrigin,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),{DB:db});
const initial=await (await request('GET')).json();
const make=(game,day)=>({id:crypto.randomUUID(),game,startedAt:`2026-10-${day}T12:00:00.000Z`,endedAt:`2026-10-${day}T12:05:00.000Z`,completed:true,wrong:0,premature:0,hints:0,retries:0,pauses:0,difficulty:'simple',epoch:initial.epoch});
for(let i=0;i<55;i++)assert.equal((await request('POST','',make('traffic','27'))).status,200);
const item={...make('delivery','26'),gameVersion:'0.2.0',levelId:3,seed:12345,parameters:'{"mode":"visual"}',supports:'["review"]'};
assert.equal((await request('POST','',item)).status,200);assert.equal((await request('POST','',item)).status,200);
const first=await (await request('GET')).json();assert.equal(first.records.length,50);assert.equal(first.hasMore,true);
const filtered=await (await request('GET','?game=delivery&from=2026-10-26T00%3A00%3A00.000Z&to=2026-10-27T00%3A00%3A00.000Z')).json();assert.equal(filtered.records.length,1);assert.equal(filtered.records[0].id,item.id);assert.equal(filtered.records[0].levelId,3);assert.equal(filtered.records[0].supports,'["review"]');
assert.equal((await request('GET','?game=unknown')).status,400);assert.equal((await request('POST','',item,'https://other.test')).status,403);
assert.equal((await request('DELETE')).status,200);assert.equal((await request('POST','',item)).status,409);
console.log('PASS: in-memory migrations, legacy/new records, filtered pagination, idempotency, origin and stale writes.');
