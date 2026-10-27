const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const {stripTypeScriptTypes}=require('node:module');
const ID='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OWNER='11111111-1111-4111-8111-111111111111';
const ORIGIN='https://test-script.googleusercontent.com';
function bridge(options={}){
 let handler;const state={posts:[],jwt:null,clientOptions:null,query:[]};
 const env={SUPABASE_URL:'https://example.supabase.co',REPORT_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',REPORT_GAS_URL:'https://script.google.com/macros/s/test/exec',REPORT_BRIDGE_SECRET:'test-only-bridge-secret-at-least-32-chars',ALLOWED_ORIGINS:ORIGIN,...options.env};
 const report={id:ID,owner_id:OWNER,version:2,payload:{projectName:'ทดสอบ',photos:[]},...options.report};
 const chain={select(v){state.query.push(v);return chain;},eq(k,v){state.query.push([k,v]);return chain;},async single(){return {data:report,error:null};}};
 const createClient=(url,key,opts)=>{state.clientOptions=opts;return {auth:{async getUser(token){state.jwt=token;return options.invalid?{data:{},error:Error('invalid')}:{data:{user:{id:OWNER}},error:null};}},from:()=>chain,storage:{from:()=>({download:async()=>({data:new Blob(['png'],{type:'image/png'}),error:null})})}};};
 const ctx={Request,Response,URL,TextEncoder,Uint8Array,structuredClone,btoa,crypto:crypto.webcrypto,AbortSignal,
  createClient,Deno:{env:{get:k=>env[k]},serve:fn=>handler=fn},fetch:async (url,opts)=>{state.posts.push(JSON.parse(opts.body));return new Response(JSON.stringify({success:true,reportId:ID,version:2}));}};
 let code=fs.readFileSync(require.resolve('../supabase/functions/report-sheet-sync/index.ts'),'utf8').replace(/^import .*;\n/,'');
 code=stripTypeScriptTypes(code,{mode:'strip'});vm.runInNewContext(code,ctx);
 const request=(headers={},body={reportId:ID,version:2},method='POST')=>new Request('https://example.supabase.co/functions/v1/report-sheet-sync',{method,headers:{origin:ORIGIN,authorization:'Bearer user-token',...headers},...(method==='OPTIONS'?{}:{body:JSON.stringify(body)})});
 return {handler,request,state,env};
}
test('bridge verifies user JWT, queries with that user context and signs the exact payload',async()=>{
 const h=bridge();const result=await h.handler(h.request());assert.equal(result.status,200);assert.equal(h.state.jwt,'user-token');
 assert.equal(h.state.clientOptions.global.headers.Authorization,'Bearer user-token');assert.equal(h.state.posts.length,1);
 const signed=h.state.posts[0],expected=crypto.createHmac('sha256',h.env.REPORT_BRIDGE_SECRET).update(signed.message).digest('base64');
 assert.equal(signed.signature,expected);assert.equal(JSON.parse(signed.message).ownerId,OWNER);
 assert.equal(result.headers.get('Access-Control-Allow-Origin'),ORIGIN);
});
test('bridge rejects disallowed origin, missing token, bad auth, other owner and stale version',async()=>{
 for(const [opts,headers,body,status] of [
  [{},{origin:'https://other.example'},{reportId:ID,version:2},403],
  [{},{authorization:''},{reportId:ID,version:2},401],
  [{invalid:true},{},{reportId:ID,version:2},401],
  [{report:{owner_id:'other'}},{},{reportId:ID,version:2},404],
  [{},{},{reportId:ID,version:1},409]
 ]){const h=bridge(opts);assert.equal((await h.handler(h.request(headers,body))).status,status);assert.equal(h.state.posts.length,0);}
});
test('preflight returns allowed origin without a write; photo ownership is checked before download',async()=>{
 const h=bridge();assert.equal((await h.handler(h.request({},null,'OPTIONS'))).status,204);assert.equal(h.state.posts.length,0);
 const bad=bridge({report:{payload:{photos:[{path:'other/report/image.jpg'}]}}});assert.equal((await bad.handler(bad.request())).status,400);assert.equal(bad.state.posts.length,0);
});
