(function (root) {
  'use strict';
  const institutions = ['สถาบันการอาชีวศึกษาภาคใต้ 2','วิทยาลัยเทคนิคระนอง','วิทยาลัยเทคนิคพังงา','วิทยาลัยเทคนิคภูเก็ต','วิทยาลัยอาชีวศึกษาภูเก็ต','วิทยาลัยเทคนิคกระบี่','วิทยาลัยเทคนิคตรัง','วิทยาลัยการอาชีพตรัง'];
  const topics = ['ความเหมาะสมของรูปแบบและกิจกรรม','ความเพียงพอและเหมาะสมของสื่อ อุปกรณ์ และสถานที่','ความรู้และทักษะที่ได้รับจากโครงการ','การนำความรู้ไปประยุกต์ใช้','ความพึงพอใจในภาพรวมของโครงการ'];
  const textFields = ['projectName','academicYear','respName','respPos','respDept','schoolName','schoolArea','introExtra','introReporter','memoDept','memoNo','memoDate','memoTo','memoBudget','budgetPlanned','memoPercent','memoGrade','memoViceCheck','memoViceComment','memoDirCheck','memoDirComment','viceName','vicePosition','directorName','directorPosition','q1Align','q2Status','q4Quant','q4Qual','q7Discuss','q9Strength','q10Weakness','q11Suggest','startDate','endDate','location'];
  function uuid() { if(globalThis.crypto.randomUUID)return globalThis.crypto.randomUUID();const b=globalThis.crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;return Array.from(b,(v,i)=>([4,6,8,10].includes(i)?'-':'')+v.toString(16).padStart(2,'0')).join(''); }
  function meanLabel(m) { return m == null ? 'ยังไม่มีข้อมูล' : m >= 4.51 ? 'มากที่สุด' : m >= 3.51 ? 'มาก' : m >= 2.51 ? 'ปานกลาง' : m >= 1.51 ? 'น้อย' : 'น้อยที่สุด'; }
  function count(v) { const n=Number(v); if(!Number.isSafeInteger(n)||n<0||n>10000000) throw Error('จำนวนผู้ตอบต้องเป็นจำนวนเต็ม 0–10,000,000'); return n; }
  // Frequency counts describe repeated observations on the 1–5 response scale.
  function sampleDeviation(frequencies,n,mean) {
    if(n<2)return null;
    let squared=0;
    for(let i=1;i<=5;i++)squared+=(frequencies[i]||0)*(i-mean)**2;
    return Math.sqrt(squared/(n-1));
  }
  function evaluate(rows) {
    let score=0,total=0;
    const pooled=Array(6).fill(0);
    const items=rows.map(r=>{
      let n=0,s=0;
      const frequencies=Array(6).fill(0);
      for(let i=1;i<=5;i++){const v=count(r['s'+i]??0);frequencies[i]=v;pooled[i]+=v;n+=v;s+=v*i;}
      score+=s;total+=n;
      const mean=n?s/n:null,sd=sampleDeviation(frequencies,n,mean);
      return {...r,n,score:s,mean,sd,trans:meanLabel(mean==null?null:Math.round(mean*100)/100)};
    });
    const mean=total?score/total:null,sd=sampleDeviation(pooled,total,mean);
    return {items,total,score,mean,sd,trans:meanLabel(mean==null?null:Math.round(mean*100)/100)};
  }
  function evaluationNarrative(ev) {
    if(!ev.total)return 'จากตาราง พบว่า ยังไม่มีข้อมูลคำตอบแบบประเมิน จึงยังไม่สามารถสรุปค่าเฉลี่ยในภาพรวม หรือระบุข้อที่มีค่าเฉลี่ยสูงสุดและต่ำสุดได้';
    const fmt=v=>v==null?'—':v.toFixed(2);
    const answered=ev.items.map((x,i)=>({...x,no:i+1,rank:x.mean==null?null:Number(x.mean.toFixed(2))})).filter(x=>x.mean!=null);
    const describe=x=>'ข้อที่ '+x.no+' “'+String(x.topic||'รายการที่ไม่ได้ระบุชื่อ')+'” มีค่าเฉลี่ยเท่ากับ '+fmt(x.mean)+' (S.D. = '+fmt(x.sd)+')';
    const overall='จากตาราง พบว่า ผลการประเมินความพึงพอใจในภาพรวมทุกข้ออยู่ในระดับ'+ev.trans+' มีค่าเฉลี่ยเท่ากับ '+fmt(ev.mean)+' (S.D. = '+fmt(ev.sd)+')';
    if(answered.length===1)return overall+' เมื่อพิจารณารายข้อ พบว่า มีข้อมูลเพียง '+describe(answered[0])+' จึงเป็นทั้งข้อที่มีค่าเฉลี่ยสูงสุดและต่ำสุดในข้อที่มีข้อมูล';
    const highest=Math.max(...answered.map(x=>x.rank)),lowest=Math.min(...answered.map(x=>x.rank));
    if(highest===lowest)return overall+' เมื่อพิจารณารายข้อ พบว่า ทุกข้อที่มีข้อมูลมีค่าเฉลี่ยสูงสุดและต่ำสุดเท่ากัน ได้แก่ '+answered.map(describe).join(' และ ');
    return overall+' เมื่อพิจารณารายข้อ พบว่า ข้อที่มีค่าเฉลี่ยสูงสุด ได้แก่ '+answered.filter(x=>x.rank===highest).map(describe).join(' และ ')+' ส่วนข้อที่มีค่าเฉลี่ยต่ำสุด ได้แก่ '+answered.filter(x=>x.rank===lowest).map(describe).join(' และ ');
  }
  function respondentStats(r) {
    const keys=['teacher','student','parent'];
    const total=keys.reduce((n,k)=>n+count(r[k]?.count??0),0);
    return {total,...Object.fromEntries(keys.map(k=>[k,{count:count(r[k]?.count??0),pct:total?count(r[k]?.count??0)/total*100:0}]))};
  }
  const goalFields={quantGoals:'q4Quant',qualGoals:'q4Qual'};
  const emptyGoal=()=>({planned:'',actual:''});
  function goalRows(r,key) {
    const source=r[key];
    // Preserve an old narrative as one complete planned row; never infer actual results.
    if(source==null)return [{planned:String(r[goalFields[key]]??''),actual:''},emptyGoal()];
    if(!Array.isArray(source)||source.length>200)throw Error('ตารางเป้าหมายต้องมีไม่เกิน 200 รายการ');
    const rows=source.map(x=>{
      if(!x||typeof x!=='object'||Array.isArray(x))throw Error('รูปแบบรายการเป้าหมายไม่ถูกต้อง');
      const row={};
      for(const prop of ['planned','actual']){
        if(x[prop]!=null&&!['string','number'].includes(typeof x[prop]))throw Error('ข้อความเป้าหมายไม่ถูกต้อง');
        row[prop]=String(x[prop]??'');
        if(row[prop].length>100000)throw Error('ข้อความเป้าหมายยาวเกิน 100,000 ตัวอักษร');
      }
      return row;
    });
    while(rows.length<2)rows.push(emptyGoal());
    return rows;
  }
  function normalizeGoals(r) {
    return {...r,...Object.fromEntries(Object.keys(goalFields).map(key=>[key,goalRows(r,key)]))};
  }
  function goalSummary(rows) {
    return rows.map((x,i)=>[x,i]).filter(([x])=>x.planned.trim()||x.actual.trim()).map(([x,i])=>(i+1)+'. ที่กำหนดไว้ในโครงการ: '+x.planned+'\nที่ดำเนินได้จริง: '+x.actual).join('\n\n');
  }
  function kpiPlanned(k) {
    return [k.kpiText,k.target?'ค่าเป้าหมาย: '+k.target:''].filter(Boolean).join('\n');
  }
  function blank() {
    return {schemaVersion:2,id:uuid(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),...Object.fromEntries(textFields.map(k=>[k,''])),academicYear:String(new Date().getFullYear()+543+(new Date().getMonth()>=9?1:0)),schoolName:institutions[0],schoolArea:'สำนักงานคณะกรรมการการอาชีวศึกษา กระทรวงศึกษาธิการ',q2Status:'ยังไม่ได้ดำเนินการ',memoDate:new Date().toISOString().slice(0,10),memoTo:'ผู้อำนวยการสถาบันการอาชีวศึกษาภาคใต้ 2',vicePosition:'ผู้อำนวยการสำนักพัฒนายุทธศาสตร์และความร่วมมืออาชีวศึกษา',directorPosition:'ผู้อำนวยการสถาบันการอาชีวศึกษาภาคใต้ 2',objectives:[''],quantGoals:[emptyGoal(),emptyGoal()],qualGoals:[emptyGoal(),emptyGoal()],evaluations:topics.map(topic=>({topic,s5:0,s4:0,s3:0,s2:0,s1:0})),respondents:{teacher:{count:0},student:{count:0},parent:{count:0}},kpis:Array.from({length:2},()=>({kpiText:'',target:'',actual:'',status:'ยังไม่ประเมิน'})),photos:[]};
  }
  function derived(r) { const goals=normalizeGoals(r),ev=evaluate(r.evaluations),rs=respondentStats(r.respondents); return {...goals,q4Quant:goalSummary(goals.quantGoals),q4Qual:goalSummary(goals.qualGoals),respondents:{teacher:rs.teacher,student:rs.student,parent:rs.parent},evaluations:ev.items,evalOverallMean:ev.mean,evalOverallSd:ev.sd,evalOverallTrans:ev.trans}; }
  function validate(r,cloud=false) {
    if(!r.projectName.trim()) throw Error('กรุณาระบุชื่อโครงการ');
    if(!/^\d{4}$/.test(r.academicYear)||+r.academicYear<2500||+r.academicYear>2800) throw Error('ระบุปีงบประมาณเป็น พ.ศ. 4 หลัก เช่น 2570');
    if(r.startDate&&r.endDate&&r.endDate<r.startDate) throw Error('วันสิ้นสุดต้องไม่ก่อนวันเริ่มโครงการ');
    for(const k of ['memoBudget','budgetPlanned']) if(r[k]!==''&&(!Number.isFinite(Number(r[k]))||Number(r[k])<0)) throw Error('งบประมาณต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป');
    if(r.memoPercent!==''&&(!Number.isFinite(Number(r.memoPercent))||+r.memoPercent<0||+r.memoPercent>100)) throw Error('ร้อยละความสำเร็จต้องอยู่ระหว่าง 0–100');
    const ev=evaluate(r.evaluations),rs=respondentStats(r.respondents);
    if(cloud&&!r.respName.trim()) throw Error('กรุณาระบุชื่อผู้รับผิดชอบก่อนบันทึกออนไลน์');
    if(cloud&&ev.items.some(x=>x.n>rs.total)) throw Error('จำนวนผู้ตอบรายข้อเกินจำนวนผู้ตอบทั้งหมด กรุณาตรวจสอบตารางประเมิน');
    return true;
  }
  function importReport(input) {
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('รูปแบบไฟล์รายงานไม่ถูกต้อง');
    const r=blank();
    for(const k of textFields){if((k==='q4Quant'&&input.quantGoals!=null)||(k==='q4Qual'&&input.qualGoals!=null))continue;if(input[k]!=null){if(typeof input[k]!=='string'&&typeof input[k]!=='number')throw Error('ชนิดข้อมูลไม่ถูกต้อง: '+k);r[k]=String(input[k]);if(r[k].length>100000)throw Error('ข้อความยาวเกิน 100,000 ตัวอักษร');}}
    if(!['ยังไม่ได้ดำเนินการ','อยู่ระหว่างดำเนินการ','ดำเนินการเสร็จสิ้นแล้ว'].includes(r.q2Status))throw Error('สถานะโครงการไม่ถูกต้อง');
    const arrays=['objectives','evaluations','kpis','photos'];
    arrays.forEach(k=>{if(input[k]!=null){if(!Array.isArray(input[k])||input[k].length>(k==='photos'?20:200))throw Error('จำนวนรายการ '+k+' เกินกำหนด');}});
    if(input.objectives)r.objectives=input.objectives.map(x=>{if(typeof x!=='string'||x.length>100000)throw Error('วัตถุประสงค์ไม่ถูกต้อง');return x;});
    if(input.evaluations)r.evaluations=input.evaluations.map(x=>{if(!x||typeof x.topic!=='string'||x.topic.length>500)throw Error('หัวข้อประเมินต้องไม่เกิน 500 ตัวอักษร');return {topic:x.topic,...Object.fromEntries([1,2,3,4,5].map(i=>['s'+i,count(x['s'+i]??0)]))};});
    if(input.respondents)r.respondents=Object.fromEntries(['teacher','student','parent'].map(k=>[k,{count:count(input.respondents[k]?.count??0)}]));
    if(input.kpis)r.kpis=input.kpis.map(x=>{if(!x||typeof x.kpiText!=='string'||x.kpiText.length>1000)throw Error('ตัวชี้วัดต้องไม่เกิน 1,000 ตัวอักษร');return {kpiText:x.kpiText,target:String(x.target??''),actual:String(x.actual??''),status:['บรรลุ','ไม่บรรลุ','ยังไม่ประเมิน'].includes(x.status)?x.status:'ยังไม่ประเมิน'};});
    for(const key of Object.keys(goalFields))r[key]=goalRows(input,key);
    if(input.logoBase64){if(!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(input.logoBase64)||input.logoBase64.length>2000000)throw Error('รูปโลโก้ไม่ถูกต้อง');r.logoBase64=input.logoBase64;}
    if(input.photos)r.photos=input.photos.map(x=>{if(!x||typeof x.caption!=='string'||x.caption.length>600)throw Error('คำบรรยายภาพต้องไม่เกิน 600 ตัวอักษร');if(!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(x.base64??'')||(x.base64??'').length>2000000)throw Error('ภาพนำเข้าต้องเป็น JPEG, PNG หรือ WebP แบบ Base64 ขนาดไม่เกิน 1.5 MB');return {id:uuid(),base64:x.base64,caption:x.caption};});
    r.isSample=input.isSample===true;
    return derived(r);
  }
  function warnings(r) {
    const ev=evaluate(r.evaluations),rs=respondentStats(r.respondents),w=[];
    if(!r.projectName.trim())w.push('ยังไม่ได้ระบุชื่อโครงการ');
    if(!r.respName.trim())w.push('ยังไม่ได้ระบุผู้รับผิดชอบ');
    if(!r.objectives.some(x=>x.trim()))w.push('ยังไม่ได้ระบุวัตถุประสงค์');
    if(!rs.total)w.push('ยังไม่มีจำนวนผู้ตอบแบบสอบถาม');
    ev.items.forEach((x,i)=>{if(rs.total&&x.n!==rs.total)w.push('ข้อประเมิน '+(i+1)+' มีผู้ตอบ '+x.n+' จาก '+rs.total+' คน');});
    return w;
  }
  function escape(s) { return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  const api={institutions,topics,textFields,uuid,meanLabel,count,evaluate,evaluationNarrative,respondentStats,goalRows,normalizeGoals,goalSummary,kpiPlanned,blank,derived,validate,importReport,warnings,escape};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.ReportCore=api;
})(typeof window!=='undefined'?window:globalThis);
