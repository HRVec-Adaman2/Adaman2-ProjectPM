from pathlib import Path
from html import escape
import re
ROOT=Path(__file__).resolve().parents[1]
def inline(s):
    s=escape(s)
    s=re.sub(r'`([^`]+)`',r'<code>\1</code>',s)
    s=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',s)
    s=re.sub(r'(https://[^\s<]+)',r'<a href="\1" target="_blank" rel="noopener">\1</a>',s)
    return s
lines=(ROOT/'README_TH.md').read_text().splitlines()
out=[];toc=[];i=0
while i<len(lines):
    line=lines[i]
    if line.startswith('```'):
        code=[];i+=1
        while i<len(lines) and not lines[i].startswith('```'):code.append(lines[i]);i+=1
        out.append('<pre>'+escape('\n'.join(code))+'</pre>');i+=1;continue
    if line.startswith('|'):
        rows=[]
        while i<len(lines) and lines[i].startswith('|'):
            row=lines[i].strip().strip('|').split('|');i+=1
            if all(re.fullmatch(r'\s*[-:]+\s*',v) for v in row):continue
            rows.append(row)
        out.append('<div class="table-scroll"><table><thead><tr>'+''.join('<th>'+inline(v.strip())+'</th>' for v in rows[0])+'</tr></thead><tbody>')
        for row in rows[1:]:out.append('<tr>'+''.join('<td>'+inline(v.strip())+'</td>' for v in row)+'</tr>')
        out.append('</tbody></table></div>');continue
    m=re.match(r'^(#{1,3}) (.+)',line)
    if m:
        level=len(m[1]);hid='section-'+str(i+1)
        if level==2:toc.append((hid,m[2]))
        out.append(f'<h{level} id="{hid}">{inline(m[2])}</h{level}>');i+=1;continue
    m=re.match(r'^(?:- |\d+\. )',line)
    if m:
        ordered=line[0].isdigit();tag='ol' if ordered else 'ul';out.append('<'+tag+'>')
        pattern=r'^\d+\. ' if ordered else r'^- '
        while i<len(lines) and re.match(pattern,lines[i]):
            out.append('<li>'+inline(re.sub(pattern,'',lines[i]))+'</li>');i+=1
        out.append('</'+tag+'>');continue
    if line.strip():out.append('<p>'+inline(line)+'</p>')
    i+=1
files=['apps-script/Code.gs','apps-script/Core.gs','apps-script/Index.html','apps-script/Config.html','apps-script/appsscript.json','supabase/setup_report.sql','supabase/functions/report-sheet-sync/index.ts','supabase/config.toml','source/report-editor/app.js','source/report-editor/core.js','source/report-editor/print.js','source/report-editor/styles.css','source/report-editor/guide.js','scripts/build.cjs','examples/report-demo.json']
buttons=''.join(f'<button class="file" data-file="{i}" data-name="{escape(name)}">{escape(name)}</button>' for i,name in enumerate(files))
texts=''.join(f'<textarea hidden id="source-{i}">{escape((ROOT/name).read_text())}</textarea>' for i,name in enumerate(files))
toc_html=''.join(f'<a href="#{id}">{escape(title)}</a>' for id,title in toc)
html='''<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ANDAMAN REPORT — คู่มือติดตั้งและโค้ดทั้งหมด</title><style>
:root{--ink:#16372f;--muted:#5a6e67;--line:#dce5e0;--paper:#fff;--green:#155c49}*{box-sizing:border-box}body{margin:0;background:#f3f6f2;color:var(--ink);font:16px/1.75 Tahoma,Arial,sans-serif}header{background:var(--green);color:white;padding:30px clamp(20px,5vw,70px)}header h1{margin:0;font-size:30px;letter-spacing:.03em}header p{margin:5px 0 0;color:#d4e9dc}nav.top{position:sticky;top:0;z-index:3;background:white;border-bottom:1px solid var(--line);padding:12px clamp(20px,5vw,70px);display:flex;gap:10px;align-items:center}button,.pill{font:inherit;cursor:pointer;border:1px solid var(--line);border-radius:8px;padding:8px 16px;color:var(--ink);background:white}button.active,button.primary{background:var(--green);color:white;border-color:var(--green)}.layout{display:grid;grid-template-columns:285px minmax(0,1fr);max-width:1440px;margin:auto;gap:28px;padding:28px}aside{min-width:0}aside .sticky{position:sticky;top:90px;max-height:calc(100vh - 115px);overflow:auto;background:#e9f0e9;border-radius:12px;padding:16px}aside h2{font-size:17px;margin:0 0 10px}aside a{display:block;padding:6px 0;color:var(--green);font-size:13px;text-decoration:none}main{min-width:0;background:white;padding:clamp(20px,4vw,48px);border:1px solid var(--line);border-radius:14px}h1{font-size:28px;line-height:1.35}h2{font-size:23px;margin:40px 0 16px;scroll-margin-top:90px}h3{font-size:20px}p,li{overflow-wrap:anywhere}li{margin:8px 0}a{color:#0b6c61}code{background:#eef3ed;border-radius:4px;padding:2px 4px;font:13px/1.6 Consolas,monospace;overflow-wrap:anywhere}pre{white-space:pre-wrap;background:#102f29;color:#edf8ef;padding:18px;border-radius:10px;overflow-wrap:anywhere;font:13px/1.8 Consolas,monospace}.table-scroll{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px;margin:20px 0}td,th{border:1px solid var(--line);padding:12px;text-align:left;vertical-align:top}th{background:#edf3eb}#code-view{display:none}.file{width:100%;text-align:left;font-size:12px;line-height:1.6;margin-bottom:7px;overflow-wrap:anywhere;padding:8px}.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center}#filename{font:16px/1.5 Consolas,monospace;overflow-wrap:anywhere;margin:14px 0}#editor{width:100%;height:68vh;resize:vertical;background:#102f29;color:#eaf6ec;border:0;border-radius:10px;padding:18px;white-space:pre;overflow:auto;font:12px/1.7 Consolas,monospace;tab-size:2}#notice{font-size:14px;color:var(--muted)}.note{background:#edf3eb;border-left:4px solid #70956b;padding:15px;border-radius:4px;font-size:14px}#code-nav{display:none}@media(max-width:800px){.layout{grid-template-columns:1fr;padding:14px}aside .sticky{position:static;max-height:260px}header h1{font-size:24px}main{padding:22px}#editor{height:60vh}h2{font-size:21px}nav.top{flex-wrap:wrap}}@media print{header,nav.top,aside,#code-view{display:none!important}.layout{display:block;padding:0}main{border:0;padding:0}body{background:white;font-size:11pt}h2{break-after:avoid}table{font-size:9pt}pre{color:black;background:#eee}a{color:black}}
</style></head><body><header><h1>ANDAMAN REPORT</h1><p>คู่มือติดตั้ง • โค้ดหน้าบ้านและหลังบ้านครบไฟล์ • 26 ตุลาคม 2569</p></header><nav class="top"><button id="show-guide" class="active">ขั้นตอนติดตั้ง</button><button id="show-code">ดูและคัดลอกโค้ด</button><span id="notice">เริ่มที่คู่มือ แล้วคัดลอกไฟล์ให้ตรงโปรแกรม</span></nav><div class="layout"><aside><div class="sticky"><div id="guide-nav"><h2>สารบัญคู่มือ</h2>'''+toc_html+'''</div><div id="code-nav"><h2>เลือกไฟล์โค้ด</h2>'''+buttons+'''</div></div></aside><main><article id="guide-view">'''+''.join(out)+'''</article><section id="code-view"><h1>โค้ดฉบับเต็ม</h1><p class="note">เลือกไฟล์ทางซ้าย กด “คัดลอกทั้งไฟล์” แล้ววางในโปรแกรมตามคู่มือ Index.html มี CSS, JavaScript, โลโก้ และตราครุฑรวมอยู่แล้ว ต้องคัดลอกทั้งหมด ไม่ตัดเฉพาะส่วน HTML ด้านบน</p><div class="toolbar"><button id="copy" class="primary">คัดลอกทั้งไฟล์</button><button id="download">ดาวน์โหลดไฟล์ที่เลือก</button><span id="copy-state" aria-live="polite"></span></div><div id="filename"></div><textarea id="editor" readonly spellcheck="false" aria-label="โค้ดทั้งไฟล์"></textarea></section></main></div>'''+texts+'''<script>
let selected=0;
const files=[...document.querySelectorAll('[data-file]')];
function view(code){document.getElementById('guide-view').style.display=code?'none':'block';document.getElementById('code-view').style.display=code?'block':'none';document.getElementById('guide-nav').style.display=code?'none':'block';document.getElementById('code-nav').style.display=code?'block':'none';document.getElementById('show-guide').classList.toggle('active',!code);document.getElementById('show-code').classList.toggle('active',code);}
function pick(i){selected=i;document.getElementById('editor').value=document.getElementById('source-'+i).value;document.getElementById('filename').textContent=files[i].dataset.name;document.getElementById('copy-state').textContent='';files.forEach((b,j)=>b.classList.toggle('active',j===i));view(true);}
files.forEach((b,i)=>b.onclick=()=>pick(i));
document.getElementById('show-guide').onclick=()=>view(false);document.getElementById('show-code').onclick=()=>pick(selected);
document.getElementById('copy').onclick=async()=>{const editor=document.getElementById('editor');try{await navigator.clipboard.writeText(editor.value);document.getElementById('copy-state').textContent='คัดลอกครบทั้งไฟล์แล้ว';}catch{editor.focus();editor.select();const ok=document.execCommand('copy');document.getElementById('copy-state').textContent=ok?'คัดลอกครบทั้งไฟล์แล้ว':'เลือกโค้ดทั้งหมดแล้ว กด Ctrl+C หรือ Cmd+C';}};
document.getElementById('download').onclick=()=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([document.getElementById('editor').value],{type:'text/plain;charset=utf-8'}));a.href=url;a.download=files[selected].dataset.name.split('/').pop();a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
</script></body></html>'''
(ROOT/'START_HERE.html').write_text(html)
print('Created START_HERE.html with full install guide and',len(files),'copyable source files.')
