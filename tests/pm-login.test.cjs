const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../dist/pm-core.js');

// Execute the real app and its event handlers. Only DOM, storage and network
// boundaries are faked; no production authentication function is replaced.
const source = fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8');
const instrumented = source.replace(/\}\)\(\);\s*$/, 'return {state,login,refresh,can,enterDemo};})();');
function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return {promise, resolve};
}
function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {getItem:k => values.get(k) ?? null, removeItem:k => values.delete(k)};
}
async function boot(overrides = {}) {
  const elements = new Map(), documentEvents = {}, windowEvents = {};
  function element(selector) {
    if (['#andaman-report-v2-frame', '#reports-workspace'].includes(selector)) return null;
    if (!elements.has(selector)) elements.set(selector, {
      innerHTML:'', textContent:'', value:'', hidden:selector === '#app-root', open:false,
      classList:{add(){},remove(){},toggle(){}},
      setAttribute(){}, removeAttribute(){}, addEventListener(){},
      showModal(){this.open=true;}, close(){this.open=false;}
    });
    return elements.get(selector);
  }
  const member = {user_id:'test-user', active:true, role:'admin', display_name:'Test Admin', unit_id:'test-unit'};
  const session = {access_token:'fake-test-token', user:{id:'test-user'}};
  const calls = {signIn:[], signOut:[], getUser:0, getSession:0, queries:[], rpc:[], config:null};
  const controls = {
    signIn:async () => ({data:{session, user:session.user}, error:null}),
    getUser:async () => ({data:{user:session.user}, error:null}),
    member:async () => ({data:member, error:null}),
    rows:async () => ({data:[], error:null}),
    signOut:async () => ({error:null}),
    ...overrides
  };
  let authCallback;
  const client = {
    auth:{
      getSession:async () => { calls.getSession++; return {data:{session}}; },
      getUser:async () => { calls.getUser++; return controls.getUser(); },
      signInWithPassword:async credentials => { calls.signIn.push(credentials); return controls.signIn(); },
      signOut:async options => { calls.signOut.push(options); return controls.signOut(); },
      onAuthStateChange:callback => { authCallback=callback; return {data:{subscription:{}}}; }
    },
    from(table) {
      calls.queries.push(table);
      return {select(){return this;},eq(){return this;},order(){return this;},
        maybeSingle:() => controls.member(),
        range:() => controls.rows(table), limit:() => controls.rows(table)};
    },
    rpc:async name => { calls.rpc.push(name); return {data:[],error:null}; }
  };
  const stored = {'andaman-pm-auth':'old-session','andaman-pm-auth-code-verifier':'old-code',
    'andaman-pm-auth-user':'old-user','andaman-report-draft':'keep-draft','other-app-auth':'keep-other'};
  let reloads=0;
  const location = {hash:'#guide',origin:'https://test.invalid',reload(){reloads++;}};
  const win = {PMCore:C, ANDAMAN_CONFIG:{supabaseUrl:'https://test.supabase.co',supabasePublishableKey:'fake-publishable',loginAliases:{admin:'admin@example.invalid'}},
    supabase:{createClient(url,key,options){calls.config=options;return client;}},
    localStorage:storage(stored), sessionStorage:storage(stored), location, scrollTo(){},
    addEventListener(name,callback){(windowEvents[name]??=[]).push(callback);},removeEventListener(){}
  };
  const document = {hidden:false,querySelector:element,querySelectorAll:() => [],
    addEventListener(name,callback){(documentEvents[name]??=[]).push(callback);}};
  const api = await vm.runInNewContext(instrumented, {
    window:win,document,location,innerWidth:1200,console,
    setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},
    URL,Blob,Intl,Date,crypto:require('node:crypto').webcrypto
  }, {filename:'dist/app.js'});
  async function submit(email='admin',password='test-password') {
    const button={disabled:false},error={textContent:''};
    const form={id:'login-form',elements:{email:{value:email},password:{value:password}},
      querySelector:selector => selector === 'button' ? button : error};
    await documentEvents.submit[0]({target:form,preventDefault(){}});
    return {button,error};
  }
  async function click(action,id) {
    const button={dataset:{action,id}};
    const target={closest:selector => selector === '[data-action]' ? button : null};
    for (const callback of documentEvents.click) await callback({target,preventDefault(){}});
  }
  return {api,element,calls,controls,win,submit,click,session,
    emitAuth:event => authCallback(event,session),
    async emitWindow(name,event={}) {for(const cb of windowEvents[name]||[])await cb(event);},
    get reloads(){return reloads;}};
}
function locked(h) {
  assert.equal(h.element('#app-root').hidden,true);
  assert.equal(h.element('#login-root').hidden,false);
  assert.equal(h.api.state.me,null);
  assert.equal(h.api.state.data,null);
  assert.equal(h.element('#main').innerHTML,'');
  assert.equal(h.element('#main-nav').innerHTML,'');
  assert.equal(h.api.can('dashboard'),false);
}

test('saved tokens and #guide never restore access or load online data on page startup',async () => {
  const h=await boot();
  await h.emitWindow('hashchange');
  h.emitAuth('INITIAL_SESSION');h.emitAuth('SIGNED_IN');
  await h.api.refresh();
  locked(h);
  assert.equal(h.calls.getSession,0);assert.equal(h.calls.getUser,0);
  assert.equal(h.calls.queries.length,0);assert.equal(h.calls.signIn.length,0);
  assert.equal(h.calls.config.auth.persistSession,false);
  assert.equal(h.calls.config.auth.detectSessionInUrl,false);
  assert.equal(h.calls.config.auth.autoRefreshToken,true);
  for(const store of [h.win.localStorage,h.win.sessionStorage]){
    for(const key of ['andaman-pm-auth','andaman-pm-auth-code-verifier','andaman-pm-auth-user'])assert.equal(store.getItem(key),null);
    assert.equal(store.getItem('andaman-report-draft'),'keep-draft');
    assert.equal(store.getItem('other-app-auth'),'keep-other');
  }
});
test('empty or rejected credentials stay on login without fetching member data',async () => {
  const h=await boot({signIn:async () => ({data:{session:null,user:null},error:Error('invalid')})});
  await h.submit('','');locked(h);assert.equal(h.calls.signIn.length,0);
  await h.submit();locked(h);assert.equal(h.calls.signIn.length,1);
  assert.equal(h.calls.getUser,0);assert.equal(h.calls.queries.length,0);
  assert.match(h.element('#login-root').innerHTML,/กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน/);
});
test('successful credentials require a verified user and active membership before the dashboard appears',async () => {
  const pending=deferred(),h=await boot({member:() => pending.promise});
  const login=h.submit();
  await new Promise(setImmediate);
  assert.equal(h.element('#app-root').hidden,true);
  assert.equal(h.api.state.me,null);
  assert.deepEqual(h.calls.queries,['pm_members']);
  pending.resolve({data:{user_id:'test-user',active:true,role:'admin',display_name:'Test Admin'},error:null});
  await login;
  assert.equal(h.element('#app-root').hidden,false);
  assert.equal(h.element('#login-root').hidden,true);
  assert.equal(h.api.state.me.user_id,'test-user');
  assert.match(h.element('#main').innerHTML,/ภาพรวม/);
  assert.equal(h.calls.signIn[0].email,'admin@example.invalid');
  assert.equal(h.calls.getUser,1);
});
test('inactive and missing members cannot open the dashboard',async () => {
  for(const data of [null,{user_id:'test-user',active:false,role:'admin'}]){
    const h=await boot({member:async () => ({data,error:null})});
    await h.submit();locked(h);
    assert.deepEqual(h.calls.queries,['pm_members']);
    assert.equal(h.calls.rpc.length,0);
    assert.match(h.element('#login-root').innerHTML,/กรุณาติดต่อ Admin/);
  }
});
test('a rejected verified-user lookup cannot open the dashboard',async () => {
  const h=await boot({getUser:async () => ({data:{user:null},error:Error('expired')})});
  await h.submit();locked(h);assert.equal(h.calls.queries.length,0);
});
test('logout hides data before remote sign-out completes and only signs out this session',async () => {
  const pending=deferred(),h=await boot({signOut:() => pending.promise});
  await h.submit();
  h.element('#modal').showModal();h.element('#modal-body').innerHTML='private-data';
  const logout=h.click('logout');
  await new Promise(setImmediate);
  locked(h);assert.equal(h.element('#modal').open,false);
  assert.equal(h.element('#modal-body').innerHTML,'');
  assert.equal(h.calls.signOut[0].scope,'local');
  pending.resolve({error:null});await logout;
});
test('a delayed data response cannot reopen a logged-out dashboard',async () => {
  const h=await boot();await h.submit();
  const pending=deferred();h.controls.rows=() => pending.promise;
  const refresh=h.api.refresh();
  await new Promise(setImmediate);
  await h.click('logout');locked(h);
  pending.resolve({data:[],error:null});await refresh;locked(h);
});
test('a delayed password response cannot reopen a session cancelled by SIGNED_OUT',async () => {
  const pending=deferred(),h=await boot({signIn:() => pending.promise});
  const login=h.submit();h.emitAuth('SIGNED_OUT');
  pending.resolve({data:{session:h.session,user:h.session.user},error:null});
  await login;locked(h);assert.equal(h.calls.getUser,0);
});
test('duplicate submissions make only one password request',async () => {
  const pending=deferred(),h=await boot({signIn:() => pending.promise});
  const first=h.submit();await h.submit();assert.equal(h.calls.signIn.length,1);
  pending.resolve({data:{session:null,user:null},error:Error('invalid')});
  await first;locked(h);
});
test('membership revocation during an active session clears the dashboard',async () => {
  const h=await boot();await h.submit();
  h.controls.member=async () => ({data:{active:false},error:null});
  await assert.rejects(h.api.refresh(),/กรุณาติดต่อ Admin/);locked(h);
});
test('demo needs an explicit button and a new page returns to login',async () => {
  const h=await boot();locked(h);
  await h.click('demo-picker');assert.equal(h.element('#modal').open,true);locked(h);
  await h.click('demo-enter','admin');
  assert.equal(h.api.state.demo,true);assert.equal(h.element('#app-root').hidden,false);
  assert.equal(h.calls.signIn.length,0);assert.equal(h.calls.getUser,0);
  await h.click('logout');locked(h);assert.equal(h.calls.signOut.length,0);
  locked(await boot());
});
test('a back-forward cache restore reloads the page so credentials are required again',async () => {
  const h=await boot();await h.submit();
  await h.emitWindow('pageshow',{persisted:false});assert.equal(h.reloads,0);
  await h.emitWindow('pageshow',{persisted:true});assert.equal(h.reloads,1);
  locked(await boot());
});
