import assert from 'node:assert/strict';

const base=process.env.TEST_BASE||'http://127.0.0.1:5173';
const headers={origin:base,'content-type':'application/json'};
const url=base+'/api/records';
const get=async()=>{const r=await fetch(url,{headers});assert.equal(r.status,200);return r.json();};
const before=await get(),id=crypto.randomUUID();
assert.equal(typeof before.hasMore,'boolean');
assert.equal((await fetch(url+'?offset=-1',{headers})).status,400);
const item={id,game:'traffic',startedAt:new Date().toISOString(),endedAt:new Date().toISOString(),completed:true,wrong:1,premature:1,hints:0,retries:1,pauses:0,difficulty:'auto',epoch:before.epoch};
for(let i=0;i<2;i++){const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(item)});assert.equal(r.status,200);}
const added=await get();assert.equal(added.records.filter(x=>x.id===id).length,1);
const badOrigin=await fetch(url,{method:'POST',headers:{...headers,origin:'https://other.example'},body:JSON.stringify(item)});assert.equal(badOrigin.status,403);
const deleted=await fetch(url,{method:'DELETE',headers});assert.equal(deleted.status,200);
const cleared=await get();assert.equal(cleared.records.length,0);assert.ok(cleared.epoch>before.epoch);
const stale=await fetch(url,{method:'POST',headers,body:JSON.stringify(item)});assert.equal(stale.status,409);
console.log('PASS: local D1 records, idempotent writes, Origin check, clear-all and stale-write rejection.');
