const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('embedded Apps Script frontend has valid JavaScript and self-contained local assets',()=>{
  const html=fs.readFileSync(require.resolve('../apps-script/Index.html'),'utf8');
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  assert.equal(scripts.length,6);
  scripts.forEach((source,i)=>assert.doesNotThrow(()=>new vm.Script(source,{filename:'embedded-'+i+'.js'})));
  assert.equal(html.includes('href="styles.css"'),false);
  assert.equal(html.includes('href="guide.css"'),false);
  assert.equal(html.includes('src="app.js"'),false);
  assert.ok(html.includes('data:image/jpeg;base64,'));
  assert.ok(html.includes('data:image/png;base64,'));
});
