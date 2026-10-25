const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../dist/core.js');
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-12,`${actual} != ${expected}`);

test('sample S.D. respects frequency counts and the sample denominator',()=>{
  const ev=C.evaluate([{topic:'ตัวอย่าง',s1:1,s2:1,s3:1,s4:1,s5:1}]);
  near(ev.items[0].mean,3);
  near(ev.items[0].sd,Math.sqrt(2.5));
  near(ev.sd,Math.sqrt(2.5));
  const unequal=C.evaluate([{s1:3,s5:1}]);
  near(unequal.mean,2);
  near(unequal.sd,2);
});

test('missing and single answers have unavailable S.D.; repeated identical answers have zero',()=>{
  const ev=C.evaluate([{s5:0},{s4:1}]);
  assert.equal(ev.items[0].mean,null);
  assert.equal(ev.items[0].sd,null);
  assert.equal(ev.items[1].sd,null);
  assert.equal(ev.sd,null);
  assert.equal(C.evaluate([{s5:10000000}]).sd,0);
});

test('overall S.D. includes variation between items instead of averaging item deviations',()=>{
  const ev=C.evaluate([{s5:2},{s1:2}]);
  assert.equal(ev.items[0].sd,0);
  assert.equal(ev.items[1].sd,0);
  near(ev.mean,3);
  near(ev.sd,Math.sqrt(16/3));
  const report=C.blank();
  report.evaluations=[{s5:2},{s1:2}];
  near(C.derived(report).evalOverallSd,Math.sqrt(16/3));
});

test('summary describes overall, highest and lowest in order and excludes unanswered items',()=>{
  const ev=C.evaluate([{topic:'ไม่มีผู้ตอบ',s5:0},{topic:'ต่ำสุด',s1:2},{topic:'สูงสุด',s5:2}]);
  const text=C.evaluationNarrative(ev);
  assert.ok(text.startsWith('จากตาราง พบว่า'));
  assert.ok(text.indexOf('ในภาพรวมทุกข้อ')<text.indexOf('ข้อที่มีค่าเฉลี่ยสูงสุด ได้แก่'));
  assert.ok(text.indexOf('ข้อที่มีค่าเฉลี่ยสูงสุด ได้แก่')<text.indexOf('ส่วนข้อที่มีค่าเฉลี่ยต่ำสุด ได้แก่'));
  assert.match(text,/ข้อที่ 3 “สูงสุด” มีค่าเฉลี่ยเท่ากับ 5\.00/);
  assert.match(text,/ข้อที่ 2 “ต่ำสุด” มีค่าเฉลี่ยเท่ากับ 1\.00/);
  assert.ok(!text.includes('ไม่มีผู้ตอบ'));
});

test('summary includes every tied item in question order using the displayed precision',()=>{
  const ev=C.evaluate([{topic:'สูงหนึ่ง',s4:999,s5:1},{topic:'สูงสอง',s4:998,s5:2},{topic:'ต่ำ',s1:1}]);
  const text=C.evaluationNarrative(ev);
  const highest=text.split('ข้อที่มีค่าเฉลี่ยสูงสุด ได้แก่ ')[1].split(' ส่วนข้อที่มีค่าเฉลี่ยต่ำสุด ได้แก่ ')[0];
  assert.match(highest,/ข้อที่ 1 “สูงหนึ่ง” มีค่าเฉลี่ยเท่ากับ 4\.00/);
  assert.match(highest,/ข้อที่ 2 “สูงสอง” มีค่าเฉลี่ยเท่ากับ 4\.00/);
  assert.ok(highest.indexOf('สูงหนึ่ง')<highest.indexOf('สูงสอง'));
});

test('summary handles equal means, one answered item and no answers without inventing a ranking',()=>{
  const same=C.evaluationNarrative(C.evaluate([{topic:'หนึ่ง',s4:2},{topic:'สอง',s3:1,s5:1}]));
  assert.match(same,/ทุกข้อที่มีข้อมูลมีค่าเฉลี่ยสูงสุดและต่ำสุดเท่ากัน/);
  assert.ok(same.includes('ข้อที่ 1 “หนึ่ง”')&&same.includes('ข้อที่ 2 “สอง”'));
  const one=C.evaluationNarrative(C.evaluate([{topic:'ว่าง'},{topic:'คำตอบเดียว',s4:1}]));
  assert.match(one,/มีข้อมูลเพียง ข้อที่ 2 “คำตอบเดียว”/);
  assert.ok(one.includes('S.D. = —'));
  assert.match(C.evaluationNarrative(C.evaluate([])),/ยังไม่มีข้อมูลคำตอบแบบประเมิน/);
});
