const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const crypto=require('node:crypto');
const source=fs.readFileSync(require.resolve('../dist/report-editor/sdk-loader.js'),'utf8');
const SDK={createClient(){return {auth:{}};}};
function loader(sdk){
 const scripts=[],timers=new Map();let counter=0;
 const root={supabase:sdk};
 const ctx={window:root,URL,console:{info(){},warn(){}},setTimeout(fn){const id=++counter;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);},document:{createElement(){return {remove(){this.removed=true;}};},head:{appendChild(script){scripts.push(script);}}}};
 vm.runInNewContext(source,ctx);return {root,scripts,timers,load:root.AndamanSDK.load};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('an existing SDK resolves without any network request',async()=>{
 const h=loader(SDK);assert.equal(await h.load(),SDK);assert.equal(h.scripts.length,0);assert.equal(h.root.AndamanSDK.diagnostics().source,'bundled');
});
test('missing SDK is awaited and concurrent callers share a single download',async()=>{
 const h=loader();const p=h.load(),same=h.load();assert.equal(p,same);assert.equal(h.scripts.length,1);assert.match(h.scripts[0].src,/@2\.118\.0\/dist\/umd\/supabase\.js$/);
 let resolved=false;p.then(()=>resolved=true);await tick();assert.equal(resolved,false);
 h.root.supabase=SDK;h.scripts[0].onload();assert.equal(await p,SDK);assert.equal(h.timers.size,0);
});
test('network failure uses the second pinned HTTPS mirror',async()=>{
 const h=loader();const p=h.load();h.scripts[0].onerror();await tick();assert.equal(h.scripts.length,2);assert.match(h.scripts[1].src,/^https:\/\/unpkg\.com\//);
 h.root.supabase=SDK;h.scripts[1].onload();assert.equal(await p,SDK);assert.equal(h.root.AndamanSDK.diagnostics().attempts.length,2);assert.equal(h.timers.size,0);
});
test('a successful HTTP load without createClient also falls back',async()=>{
 const h=loader({unexpected:true});const p=h.load();h.scripts[0].onload();await tick();assert.equal(h.scripts.length,2);
 h.root.supabase=SDK;h.scripts[1].onload();await p;
});
test('both failures give a recoverable error and a later retry can succeed',async()=>{
 const h=loader();const p=h.load();const rejected=assert.rejects(p,/โหลดส่วนเชื่อมต่อออนไลน์ไม่ได้/);
 h.scripts[0].onerror();await tick();h.scripts[1].onerror();await rejected;
 assert.equal(h.root.AndamanSDK.diagnostics().status,'failed');assert.equal(h.timers.size,0);
 const retry=h.load();assert.equal(h.scripts.length,3);h.root.supabase=SDK;h.scripts[2].onload();assert.equal(await retry,SDK);
});
test('a stalled primary load times out before using the fallback',async()=>{
 const h=loader();const p=h.load();[...h.timers.values()][0]();await tick();assert.equal(h.scripts.length,2);assert.equal(h.scripts[0].removed,true);
 h.root.supabase=SDK;h.scripts[1].onload();await p;
});
test('actual bundled SDK explicitly exports createClient even with isolated script variables',()=>{
 const html=fs.readFileSync(require.resolve('../apps-script/Index.html'),'utf8');
 const code=html.match(/<script id="andaman-supabase">([\s\S]*?)<\/script>/)[1];
 const ctx={window:{},console,URL,Headers,Request,Response,fetch,WebSocket,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Blob,FormData,setTimeout,clearTimeout,setInterval,clearInterval,AbortController,crypto:crypto.webcrypto,atob,btoa};
 vm.createContext(ctx);vm.runInContext('(function hostScriptScope(){'+code+'})();',ctx);
 assert.equal(typeof ctx.window.supabase.createClient,'function');
});
