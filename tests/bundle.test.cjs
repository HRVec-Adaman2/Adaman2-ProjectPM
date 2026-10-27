const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Apps Script template renders six parseable scripts with bundled local assets',()=>{
 const source=read('apps-script/Index.html');assert.equal((source.match(/<\?!= includePublicConfig_\(\); \?>/g)||[]).length,1);
 const html=source.replace('<?!= includePublicConfig_(); ?>',read('apps-script/Config.html'));
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,6);
 scripts.forEach((m,i)=>assert.doesNotThrow(()=>new vm.Script(m[1],{filename:'inline-'+i})));
 assert.doesNotMatch(html,/<script[^>]+src=/);assert.doesNotMatch(html,/<link[^>]+href="(?:styles|guide)\.css/);
 assert.match(html,/<base target="_top">/);assert.match(html,/data:image\/jpeg;base64/);assert.match(html,/data:image\/png;base64/);
});
test('config exposes public credentials only; admin is an email alias and uses Supabase Auth',()=>{
 const config=read('apps-script/Config.html').match(/<script>([\s\S]*?)<\/script>/)[1];const ctx={window:{location:{origin:'https://example.test'}},console:{info(){}}};
 vm.runInNewContext(config,ctx);assert.match(ctx.window.ANDAMAN_CONFIG.supabasePublishableKey,/^sb_publishable_/);assert.equal(ctx.window.ANDAMAN_CONFIG.loginAliases.admin,'andaman.southern2@gmail.com');
 assert.equal(Object.keys(ctx.window.ANDAMAN_CONFIG).length,4);
 const app=read('source/report-editor/app.js');assert.match(app,/signInWithPassword\(\{email:resolveLoginEmail/);assert.match(app,/id="login-email" type="text"/);
});
test('backend and frontend share calculation semantics, including unanswered and tied items',()=>{
 const C=require('../source/report-editor/core.js'),ctx={Utilities:{getUuid:()=> '00000000-0000-4000-8000-000000000000'}};vm.runInNewContext(read('apps-script/Core.gs'),ctx);
 for(const rows of [[],[{topic:'ก',s5:1}],[{topic:'ก',s5:2},{topic:'ข',s1:2}],[{topic:'ก',s4:3},{topic:'ข',s4:3}]]){
  const ev=C.evaluate(rows),other=ctx.AndamanReportCore.evaluate(rows);assert.equal(JSON.stringify(other),JSON.stringify(ev));assert.equal(ctx.AndamanReportCore.evaluationNarrative(other),C.evaluationNarrative(ev));
 }
});
