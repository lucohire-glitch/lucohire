
import React, { useEffect, useRef } from 'react';

export default function ResumeCheckView({ onBack }: any) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add('report-unlocked');
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => window.scrollTo(0, 0), 50);

    const script = document.createElement('script');
    script.innerHTML = `
/* ---------------- resume-on-file check: no resume yet → send them to signup ---------------- */
function hasResumeOnFile(){
  try {
    const v = localStorage.getItem('lucohireHasResume');
    return v === null ? true : v === 'true'; // no signal yet → assume they have one, don't block the page
  } catch(e){ return true; }
}
function goToSignup(){
  try { if(window.top && window.top !== window) window.top.postMessage({lucohire:'navigate', view:'signup'}, '*'); } catch(e){}
  try { if(window.top === window) window.location.href = 'signup.html'; } catch(e){}
}
if(!hasResumeOnFile()){
  document.addEventListener('DOMContentLoaded', ()=>{
    document.getElementById('uploadFlow').style.display='none';
    const nr=document.getElementById('noResumeState');
    nr.classList.add('show');
    document.getElementById('noResumeCta').addEventListener('click', e=>{ e.preventDefault(); goToSignup(); });
    document.getElementById('noResumeSub').textContent='Tumhare LucoHire profile me abhi resume attach nahi hai. Signup pe le ja rahe hain…';
    setTimeout(goToSignup, 1600);
  });
}

/* ---------------- shared: upload → loading → results ---------------- */
const dropzone=document.getElementById('dropzone'), fileInput=document.getElementById('fileInput'),
      fileCard=document.getElementById('fileCard'), fileName=document.getElementById('fileName'),
      fileSize=document.getElementById('fileSize'), removeBtn=document.getElementById('removeBtn'),
      analyzeBtn=document.getElementById('analyzeBtn'), errorMsg=document.getElementById('errorMsg');
const resultsView=document.getElementById('resultsView');
const MAX_SIZE=10*1024*1024, ALLOWED_EXT=['pdf','doc','docx'];
let currentFile=null;

function formatSize(b){ if(b<1024) return b+' B'; if(b<1024*1024) return Math.round(b/1024)+' KB'; return (b/(1024*1024)).toFixed(1)+' MB'; }
function showError(msg){ errorMsg.textContent=msg; errorMsg.style.display='block'; dropzone.classList.add('error'); setTimeout(()=>dropzone.classList.remove('error'),600); }
function clearError(){ errorMsg.style.display='none'; errorMsg.textContent=''; }

function acceptFile(file){
  const ext=file.name.split('.').pop().toLowerCase();
  if(!ALLOWED_EXT.includes(ext)){ showError('Please upload a PDF or Word document.'); return; }
  if(file.size>MAX_SIZE){ showError('That file is over 10MB — try a smaller version.'); return; }
  clearError(); currentFile=file;
  fileName.textContent=file.name; fileSize.textContent=formatSize(file.size);
  fileCard.classList.add('show'); dropzone.style.display='none'; analyzeBtn.disabled=false;
  document.getElementById('buildResumeCard').classList.add('used');
}
dropzone.addEventListener('click',()=>fileInput.click());
dropzone.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' ') fileInput.click(); });
['dragenter','dragover'].forEach(evt=>dropzone.addEventListener(evt,e=>{e.preventDefault();dropzone.classList.add('drag');}));
['dragleave','drop'].forEach(evt=>dropzone.addEventListener(evt,e=>{e.preventDefault();dropzone.classList.remove('drag');}));
dropzone.addEventListener('drop',e=>{ const f=e.dataTransfer.files[0]; if(f) acceptFile(f); });
fileInput.addEventListener('change',()=>{ if(fileInput.files[0]) acceptFile(fileInput.files[0]); });
removeBtn.addEventListener('click',e=>{ e.stopPropagation(); currentFile=null; fileInput.value=''; fileCard.classList.remove('show'); dropzone.style.display='flex'; analyzeBtn.disabled=true; clearError(); document.getElementById('buildResumeCard').classList.remove('used'); });

/* "Don't have a resume? We'll build one for you" — generates a stand-in resume from the
   candidate's LucoHire profile so they can still get an analysis without a file on hand */
document.getElementById('buildResumeBtn').addEventListener('click', ()=>{
  clearError();
  currentFile='generated';
  fileName.textContent='LucoHire-Profile-Resume.pdf';
  fileSize.textContent='Built from your profile';
  fileCard.classList.add('show'); dropzone.style.display='none'; analyzeBtn.disabled=false;
  document.getElementById('buildResumeCard').classList.add('used');
});

analyzeBtn.addEventListener('click',()=>{
  if(!currentFile) return;
  const steps=['Reading your resume…','Matching against 18,000+ listings…','Checking skill demand & trends…','Building your roadmap…'];
  let i=0;
  analyzeBtn.disabled=true;
  analyzeBtn.innerHTML='<svg style="animation:spin 1s linear infinite;width:18px;height:18px;margin-right:8px;vertical-align:middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/></svg>' + steps[0];
  const iv=setInterval(()=>{
    i++;
    if(i<steps.length){ analyzeBtn.innerHTML='<svg style="animation:spin 1s linear infinite;width:18px;height:18px;margin-right:8px;vertical-align:middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/></svg>' + steps[i]; return; }
    clearInterval(iv);
    analyzeBtn.textContent='Analyze my resume';
    analyzeBtn.disabled=false;
    document.getElementById('resultsView').scrollIntoView({behavior:'smooth', block:'start'});
  }, 550);
});

/* job description toggle */
const jdToggle=document.getElementById('jdToggle'), jdBox=document.getElementById('jdBox');
jdToggle.addEventListener('click',()=>{
  const opening=jdBox.hidden;
  jdBox.hidden=!opening;
  jdToggle.classList.toggle('open',opening);
});
document.getElementById('jdQuickLink')?.addEventListener('click', e=>{
  e.preventDefault();
  if(jdBox.hidden){ jdBox.hidden=false; jdToggle.classList.add('open'); }
  jdToggle.scrollIntoView({behavior:'smooth', block:'center'});
});
document.querySelectorAll('.jd-tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.jd-tab').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  const mode=t.dataset.jd;
  document.getElementById('jdText').hidden = mode!=='text';
  document.getElementById('jdUrl').hidden = mode!=='url';
}));

/* branded share card */
const CARD_CANDIDATE = { name:'Rahul Kumar', initials:'RK', role:'UI/UX Designer · Figma specialist',
  skills:['Figma UI Design','Logo Design','Brand Identity'] };

function drawCard(){
  const c=document.getElementById('cardCanvas'), ctx=c.getContext('2d');
  const W=c.width, H=c.height, M=42;
  function roundRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  }
  const bg=ctx.createLinearGradient(0,0,W,H); bg.addColorStop(0,'#1B4FE0'); bg.addColorStop(1,'#141A33');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  let glow=ctx.createRadialGradient(W-50,50,0,W-50,50,260);
  glow.addColorStop(0,'rgba(228,223,251,.28)'); glow.addColorStop(1,'rgba(228,223,251,0)');
  ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(W-50,50,260,0,Math.PI*2); ctx.fill();
  glow=ctx.createRadialGradient(30,H-30,0,30,H-30,220);
  glow.addColorStop(0,'rgba(27,79,224,.4)'); glow.addColorStop(1,'rgba(27,79,224,0)');
  ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(30,H-30,220,0,Math.PI*2); ctx.fill();

  roundRect(M,44,44,44,13); ctx.fillStyle='#fff'; ctx.fill();
  ctx.font='800 26px Georgia, serif'; ctx.fillStyle='#1B4FE0';
  ctx.fillText('L', M+14, 75);
  ctx.font='800 28px Georgia, serif'; ctx.fillStyle='#fff'; ctx.fillText('Luco', M+58, 66);
  const lw=ctx.measureText('Luco').width;
  ctx.fillStyle='#E4DFFB'; ctx.fillText('Hire', M+58+lw, 66);
  ctx.font='700 12px Arial, sans-serif'; ctx.fillStyle='rgba(255,255,255,.72)';
  ctx.fillText('AI-POWERED RESUME CHECK', M+59, 84);

  ctx.font='700 12px Arial, sans-serif';
  const pillText='lucohire.com', ptw=ctx.measureText(pillText).width;
  roundRect(W-M-ptw-26, 50, ptw+26, 28, 14); ctx.fillStyle='rgba(255,255,255,.16)'; ctx.fill();
  ctx.fillStyle='#fff'; ctx.fillText(pillText, W-M-ptw-13, 68);

  ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(M,118); ctx.lineTo(W-M,118); ctx.stroke();

  const avR=32, avX=M+avR, avY=118+30+avR;
  ctx.beginPath(); ctx.arc(avX,avY,avR,0,Math.PI*2); ctx.fillStyle='#E4DFFB'; ctx.fill();
  ctx.font='800 22px Georgia, serif'; ctx.fillStyle='#141A33'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(CARD_CANDIDATE.initials, avX, avY+2);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';

  ctx.font='700 20px Arial, sans-serif'; ctx.fillStyle='#fff';
  ctx.fillText(CARD_CANDIDATE.name, avX+avR+16, avY-2);
  ctx.font='500 13.5px Arial, sans-serif'; ctx.fillStyle='rgba(255,255,255,.72)';
  ctx.fillText(CARD_CANDIDATE.role, avX+avR+16, avY+18);

  const scoreTop=avY+avR+30;
  ctx.font='800 120px Georgia, serif'; ctx.fillStyle='#fff'; ctx.fillText('64', M, scoreTop+120);
  ctx.font='600 22px Arial, sans-serif'; ctx.fillStyle='rgba(255,255,255,.68)';
  ctx.fillText('/ 100', M+150, scoreTop+120);

  const ringCx=W-M-70, ringCy=scoreTop+56, ringR=56;
  ctx.lineWidth=10; ctx.lineCap='round';
  ctx.beginPath(); ctx.arc(ringCx,ringCy,ringR,0,Math.PI*2); ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(ringCx,ringCy,ringR,-Math.PI/2,-Math.PI/2+0.64*Math.PI*2);
  ctx.strokeStyle='#E4DFFB'; ctx.stroke();
  ctx.font='700 21px Arial, sans-serif'; ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('64%', ringCx, ringCy); ctx.textAlign='left'; ctx.textBaseline='alphabetic';

  ctx.font='700 14px Arial, sans-serif';
  const tagText='NEEDS WORK', ttw=ctx.measureText(tagText).width;
  roundRect(M, scoreTop+138, ttw+24, 30, 15); ctx.fillStyle='rgba(251,241,223,.95)'; ctx.fill();
  ctx.fillStyle='#B9791A'; ctx.fillText(tagText, M+12, scoreTop+158);
  ctx.font='500 14px Arial, sans-serif'; ctx.fillStyle='rgba(255,255,255,.65)';
  ctx.fillText('Based on 18,000+ recent listings', M+ttw+38, scoreTop+158);

  const statY=scoreTop+190;
  const stats=[{num:'4',lbl:'skills rising',color:'#8FF0C4'},{num:'12.7k+',lbl:'jobs unlock',color:'#E4DFFB'},{num:'3',lbl:'quick wins',color:'#fff'}];
  const gap=16, cw=(W-2*M-2*gap)/3;
  stats.forEach((s,i)=>{
    const x=M+i*(cw+gap);
    roundRect(x,statY,cw,78,14); ctx.fillStyle='rgba(255,255,255,.09)'; ctx.fill();
    ctx.font='800 25px Georgia, serif'; ctx.fillStyle=s.color; ctx.textAlign='center';
    ctx.fillText(s.num, x+cw/2, statY+38);
    ctx.font='600 11.5px Arial, sans-serif'; ctx.fillStyle='rgba(255,255,255,.7)';
    ctx.fillText(s.lbl, x+cw/2, statY+58); ctx.textAlign='left';
  });

  const skY=statY+78+40;
  ctx.font='700 12.5px Arial, sans-serif'; ctx.fillStyle='rgba(255,255,255,.65)';
  ctx.fillText('TOP SKILLS', M, skY);
  let sx=M, sy=skY+18; ctx.font='600 14px Arial, sans-serif';
  CARD_CANDIDATE.skills.forEach(sk=>{
    const tw=ctx.measureText(sk).width, pw=tw+28, ph=36;
    if(sx+pw>W-M){ sx=M; sy+=ph+10; }
    roundRect(sx,sy,pw,ph,18); ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fill();
    ctx.fillStyle='#fff'; ctx.fillText(sk, sx+14, sy+23);
    sx+=pw+10;
  });

  const footY=sy+70;
  ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.beginPath(); ctx.moveTo(M,footY); ctx.lineTo(W-M,footY); ctx.stroke();
  ctx.font='800 23px Georgia, serif'; ctx.fillStyle='#fff'; ctx.fillText('lucohire.com', M, footY+37);
  ctx.font='600 14px Arial, sans-serif'; ctx.fillStyle='rgba(255,255,255,.72)';
  ctx.fillText('Check your resume free →', M, footY+61);

  return c.toDataURL('image/png');
}

/* the actual resume file behind "Download ATS-friendly resume" / "Share resume" —
   the real uploaded file if there is one, else the profile-generated stand-in */
function getResumeBlob(){
  if(currentFile instanceof File){
    return Promise.resolve({ blob:currentFile, filename:'ATS-Friendly-Resume-'+currentFile.name, type:currentFile.type||'application/octet-stream' });
  }
  const txt='LUCOHIRE — ATS-FRIENDLY RESUME\\nGenerated from your LucoHire profile.\\n\\nOpen the LucoHire app to review and customize every section before you send it out.';
  return Promise.resolve({ blob:new Blob([txt],{type:'text/plain'}), filename:'ATS-Friendly-Resume.txt', type:'text/plain' });
}

document.getElementById('downloadAtsBtn').addEventListener('click', async ()=>{
  const {blob, filename} = await getResumeBlob();
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 4000);
});

document.getElementById('shareResumeBtn').addEventListener('click', async ()=>{
  document.getElementById('sheetTitle').textContent='Share your resume';
  document.getElementById('cardPreview').style.display='none';
  const shareText='Sharing my resume from LucoHire — built and checked at https://lucohire.com';
  const shareUrl='https://lucohire.com';
  const opts=[
    {name:'WhatsApp', href:'https://wa.me/?text='+encodeURIComponent(shareText)},
    {name:'LinkedIn', href:'https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(shareUrl)},
    {name:'Email', href:'mailto:?subject='+encodeURIComponent('My resume, via LucoHire')+'&body='+encodeURIComponent(shareText)}
  ];
  document.getElementById('shareOptions').innerHTML = opts.map(o=>\`<a class="share-opt" href="\${o.href}" target="_blank" rel="noopener">\${o.name}</a>\`).join('')
    + \`<button class="share-opt" id="copyLinkBtn">Copy link</button>\`
    + (navigator.canShare ? \`<button class="share-opt" id="nativeShareBtn">Share file</button>\` : '');
  document.getElementById('shareOverlay').classList.add('show');
  const copyBtn=document.getElementById('copyLinkBtn');
  copyBtn.onclick=()=>{ navigator.clipboard.writeText(shareUrl); copyBtn.textContent='Copied ✓'; };
  const nativeBtn=document.getElementById('nativeShareBtn');
  if(nativeBtn) nativeBtn.onclick=async ()=>{
    try{
      const {blob, filename, type} = await getResumeBlob();
      const file=new File([blob], filename, {type});
      if(navigator.canShare && navigator.canShare({files:[file]})) await navigator.share({files:[file], text:shareText, title:'My resume'});
      else await navigator.share({text:shareText, url:shareUrl});
    }catch(e){}
  };
});

document.getElementById('shareBtn').addEventListener('click',()=>{
  document.getElementById('sheetTitle').textContent='Share your score';
  document.getElementById('cardPreview').style.display='';
  const url=drawCard();
  document.getElementById('cardPreview').src=url;
  const shareText='My resume just scored 64/100 on LucoHire — check yours free: https://lucohire.com';
  const shareUrl='https://lucohire.com';
  const opts=[
    {name:'WhatsApp', href:'https://wa.me/?text='+encodeURIComponent(shareText)},
    {name:'LinkedIn', href:'https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(shareUrl)},
    {name:'Twitter / X', href:'https://twitter.com/intent/tweet?text='+encodeURIComponent(shareText)},
    {name:'Facebook', href:'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(shareUrl)+'&quote='+encodeURIComponent(shareText)},
    {name:'Telegram', href:'https://t.me/share/url?url='+encodeURIComponent(shareUrl)+'&text='+encodeURIComponent(shareText)},
    {name:'SMS', href:'sms:?body='+encodeURIComponent(shareText)},
    {name:'Email', href:'mailto:?subject='+encodeURIComponent('My LucoHire resume score')+'&body='+encodeURIComponent(shareText)}
  ];
  document.getElementById('shareOptions').innerHTML = opts.map(o=>\`<a class="share-opt" href="\${o.href}" target="_blank" rel="noopener">\${o.name}</a>\`).join('')
    + \`<button class="share-opt" id="copyLinkBtn">Copy link</button>\`
    + (navigator.share ? \`<button class="share-opt" id="nativeShareBtn">More options</button>\` : '');
  document.getElementById('shareOverlay').classList.add('show');
  const copyBtn=document.getElementById('copyLinkBtn');
  copyBtn.onclick=()=>{ navigator.clipboard.writeText(shareUrl); copyBtn.textContent='Copied ✓'; };
  const nativeBtn=document.getElementById('nativeShareBtn');
  if(nativeBtn) nativeBtn.onclick=async ()=>{
    try{
      const blob=await (await fetch(url)).blob();
      const file=new File([blob],'lucohire-resume-score.png',{type:'image/png'});
      if(navigator.canShare && navigator.canShare({files:[file]})) await navigator.share({files:[file], text:shareText, title:'LucoHire Resume Score'});
      else await navigator.share({text:shareText, url:shareUrl});
    }catch(e){}
  };
});
function closeShare(){ document.getElementById('shareOverlay').classList.remove('show'); }

/* keep the jump-nav pill in sync with whichever section is on screen */
const jumpLinks=[...document.querySelectorAll('#jumpnav a')];
const jumpTargets=jumpLinks.map(a=>document.querySelector(a.getAttribute('href')));
window.addEventListener('scroll',()=>{
  let idx=0;
  jumpTargets.forEach((el,i)=>{ if(el && el.getBoundingClientRect().top<120) idx=i; });
  jumpLinks.forEach((a,i)=>a.classList.toggle('active', i===idx));
}, {passive:true});

/* ---------------- results content ---------------- */
const OUTDATED=[
  {skill:"jQuery", jobs:"1,140 jobs", trend:"-28%", action:"Resume se hatao"},
  {skill:"PHP Core (without Laravel)", jobs:"2,300 jobs", trend:"-19%", action:"Hatao, Laravel likho agar aata hai toh"},
  {skill:"Bootstrap only", jobs:"1,800 jobs", trend:"-22%", action:"Hatao, Tailwind likho"}
];
const FADING=[
  {skill:"JavaScript (vanilla only)", jobs:"8,400 jobs", trend:"-11%", note:"JS aana chahiye par sirf JS se kaam nahi chalega, framework chahiye"},
  {skill:"CSS only (no Tailwind)", jobs:"3,200 jobs", trend:"-14%", note:"CSS ke saath Tailwind/Next jodna padega"},
  {skill:"WordPress Custom", jobs:"2,900 jobs", trend:"-9%", note:"Sirf ispe mat raho"}
];
const RISING=[
  {skill:"Next.js 14 / App Router", jobs:"6,200 jobs", trend:"+41%", salary:"14-18 LPA", learnTime:"1 day"},
  {skill:"TypeScript", jobs:"12,400 jobs", trend:"+33%", salary:"16-22 LPA", learnTime:"6 hours"},
  {skill:"GenAI Integration (LLM APIs, RAG)", jobs:"4,100 jobs", trend:"+340%", salary:"22-30 LPA", learnTime:"1 day"},
  {skill:"React Server Components", jobs:"2,800 jobs", trend:"+58%", salary:"15-20 LPA", learnTime:"1 day"}
];
/* one quick-wins set per path, so the "3 quick wins" section can switch to match whichever path is selected in Choose your path */
const PATH_WINS={
  p1:[
    {n:"1", skill:"TypeScript", time:"6 hours", jobs:"+7,200 unlock", line:"Migrated 3 components to TypeScript"},
    {n:"2", skill:"Next.js", time:"1 day", jobs:"+3,100 unlock", line:"Built e-commerce with Next.js, SSR 40% faster"},
    {n:"3", skill:"Tailwind CSS", time:"4 hours", jobs:"+2,400 unlock", line:"Styled UI with Tailwind, reduced CSS by 60%"}
  ],
  p2:[
    {n:"1", skill:"React Server Components", time:"1 day", jobs:"2,800 jobs · +58%", line:"Rebuilt a data-heavy page with React Server Components"},
    {n:"2", skill:"System Design Basics", time:"50 min", jobs:"9,100 jobs at 15 LPA+", line:"Designed scalable notification flow for 10k users"},
    {n:"3", skill:"Performance Optimization", time:"35 min", jobs:"5,600 jobs at 15 LPA+", line:"Improved LCP from 3.2s to 1.4s"}
  ],
  p3:[
    {n:"1", skill:"GenAI Integration (LLM APIs, RAG)", time:"1 day", jobs:"4,100 jobs · +340%", line:"Integrated OpenAI API for auto-summary, saved 2 hrs/week per user"},
    {n:"2", skill:"System Design Deep", time:"2 days", jobs:"15-25 LPA · senior-tag roles", line:"Designed a horizontally-scalable system to handle 1M+ users"},
    {n:"3", skill:"DSA Patterns for frontend", time:"3 days", jobs:"Core interview round", line:"Practiced pattern-based problems for Razorpay/CRED/Swiggy-type rounds"}
  ],
  p4:[
    {n:"1", skill:"AI Tools (Cursor / Copilot)", time:"2 hours", jobs:"2026 roadmap priority", line:"Used AI-assisted tooling (Cursor/Copilot) to ship features faster"},
    {n:"2", skill:"Full-stack basics (Node + DB)", time:"1 day", jobs:"2028–30 roadmap priority", line:"Built a full-stack feature end-to-end with Node.js and a database"},
    {n:"3", skill:"Web Performance & Security", time:"4 hours", jobs:"2027 roadmap priority", line:"Audited and fixed core web vitals and key security gaps"}
  ]
};
let activeWinsPath=null; // null = no path chosen yet → wins card shows its empty state
const SALARY=[
  {title:"System Design Basics", jobs:"9,100 jobs at 15 LPA+", add:"Designed scalable notification flow for 10k users"},
  {title:"Performance Optimization", jobs:"5,600 jobs at 15 LPA+", add:"Improved LCP from 3.2s to 1.4s"},
  {title:"GenAI Feature", jobs:"4,100 jobs at 15 LPA+", add:"Integrated OpenAI API for auto-summary, saved 2 hrs/week per user"}
];
const FIXES=[
  {tag:"Rewrite", before:"Worked on the company website using JavaScript and CSS.",
   after:"Rebuilt the company's marketing site in JavaScript, improving mobile load time by 35% for ~50K monthly visitors.",
   why:"Numbers + scale turn a duty into proof — ATS keyword-scoring and recruiters both reward specifics over descriptions."},
  {tag:"Rewrite", before:"Responsible for maintaining and updating web pages.",
   after:"Shipped weekly updates across 12+ pages using WordPress and custom PHP, cutting turnaround from 2 days to same-day.",
   why:"\\"Responsible for\\" reads passive. \\"Shipped… cutting turnaround\\" reads like impact."},
  {tag:"Remove", before:"\\"References available upon request\\" — sitting at the very bottom, in your most valuable resume real estate.",
   after:"Removed. Nobody calls references off a resume anymore — recruiters ask separately if they need them.",
   why:"That line is currently occupying the exact spot where a GitHub or portfolio link belongs."},
  {tag:"Add", before:"No links section — a recruiter has to Google you to find your work.",
   after:"Add one line under your name: GitHub · Portfolio · LinkedIn — three clickable links, nothing else.",
   why:"For dev roles, a live GitHub is often checked before the resume is read past line one."},
  {tag:"Explain", before:"2022–2024 par resume mein koi mention nahi — gap khaali chhoda hua hai.",
   after:"Add one line: \\"2022–2024: Career break — caregiving responsibilities; stayed current via 2 self-directed projects (see GitHub).\\"",
   why:"Khaali gap ATS aur recruiter dono ke liye red flag ki tarah dikhta hai. Ek chhoti, seedhi line usse non-issue bana deti hai."}
];
/* the Reorder example flips based on experience level — fresher vs 2+ yrs get opposite advice */
const REORDER_FIX={
  experienced:{tag:"Reorder", before:"Education section placed above Experience — with 2+ years of work-ex already.",
    after:"Move Experience to the top. Education-first reads \\"fresher\\" to both ATS parsing and human recruiters.",
    why:"Section order isn't cosmetic — ATS often weighs whichever section it parses first more heavily."},
  fresher:{tag:"Keep as-is", before:"Education section placed above Experience — sahi hai, tum fresher ho.",
    after:"Ise waisa hi rehne do. Fresher ke liye Education-first hi sahi signal hai — college, CGPA aur relevant coursework top par rakho.",
    why:"Fresher ke resume me Education sabse strong proof point hoti hai jab tak solid work-ex na ho — ATS aur recruiter dono ye expect karte hain."}
};
let experienceLevel='experienced';
function allFixes(){ return [...FIXES, REORDER_FIX[experienceLevel]]; }
function setExperience(lvl){
  experienceLevel=lvl;
  document.querySelectorAll('.exp-pill').forEach(p=>p.classList.toggle('active', p.dataset.lvl===lvl));
  document.getElementById('fixList').innerHTML = allFixes().map(f=>\`
    <div class="fix-card">
      <span class="fix-tag">\${f.tag}</span>
      <div class="fix-line fix-before">\${f.before}</div>
      <div class="fix-line fix-after">\${f.after}</div>
      <div class="fix-why">\${f.why}</div>
    </div>\`).join('');
  document.getElementById('secLeadership').classList.toggle('exp-hidden', lvl==='fresher');
  renderWins(activeWinsPath);
}
const ROADMAP=[
  {year:"2026", title:"AI Tools (Cursor, Copilot)", note:"Nahi seekha toh junior bhi aage nikal jayega"},
  {year:"2027", title:"Performance + Security", note:"Har company maangegi"},
  {year:"2028–30", title:"Full-stack + AI", note:"Sirf frontend se kaam nahi chalega"}
];
const PATHS=[
  {id:"p1", title:"Abhi 3-6 LPA job chahiye", sub:"0-30 din me calls badhani hai", badge:"Fast Track", recommended:true,
   syllabus:["TypeScript (6 hrs)","Next.js (1 day)","Tailwind (4 hrs)"],
   kya:"+12,700 jobs unlock · Resume score 64→82 · Expected calls 3x",
   oneLiner:"TypeScript + Next.js + Tailwind → 3x calls", lessons:3, jobs:12700},
  {id:"p2", title:"8-12 LPA pe jump karna hai", sub:"2-3 mahine • product me jana hai", badge:"Most Popular",
   syllabus:["Advanced React (Server Components)","System Design Basics","Performance Optimization"],
   kya:"Product companies me shortlist · Avg 10-14 LPA · System Design questions clear",
   oneLiner:"RSC + System Design → Product companies shortlist", lessons:6, jobs:9400},
  {id:"p3", title:"15 LPA+ High Paid banna hai", sub:"Senior tag • Top startups", badge:"High Salary",
   syllabus:["System Design Deep","GenAI Integration (LLM APIs, RAG)","DSA Patterns for frontend"],
   kya:"Razorpay, CRED, Swiggy type companies · 15-25 LPA · Senior tag",
   oneLiner:"System Design + GenAI → 15-25 LPA", lessons:8, jobs:4100},
  {id:"p4", title:"2030 tak job secure karni hai", sub:"AI replace na kare", badge:"Future Safe",
   syllabus:["AI Tools (Cursor / Copilot)","Full-stack basics (Node + DB)","Web Performance & Security"],
   kya:"AI replace nahi karega · Full-stack + AI = safe for next 5 years",
   oneLiner:"AI Tools + Full-stack → 5 saal safe", lessons:10, jobs:6800}
];

let activeTab='overview';
let reportUnlocked=true;
const tabAnchor={overview:'secOverview', fixes:'secAnalysis', recruiter:'secRecruiterScan', skills:'secDrop'};
function applyTab(tab){
  activeTab=tab;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  const target=document.getElementById(tabAnchor[tab]);
  if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
  updatePaywallVisibility();
}
function updatePaywallVisibility(){
  const card = document.getElementById('paywallCard');
  if(!card) return;
  card.hidden = true;
}
function unlockReport(){
  reportUnlocked = true;
  document.body.classList.add('report-unlocked');
  updatePaywallVisibility();
}
let selectedPaths={}, expandedPaths={};
/* skills the user has explicitly added from "Skills on the rise" / "Staying relevant through 2030" —
   these flow into every path's syllabus box below, and can be switched off per-path from there */
let addedSkills=new Set();
let pathSkillOff={}; // pathSkillOff[pathId] = Set of skill names turned OFF for that path's plan

function renderResults(){
  document.getElementById('fixList').innerHTML = allFixes().map(f=>\`
    <div class="fix-card">
      <span class="fix-tag">\${f.tag}</span>
      <div class="fix-line fix-before">\${f.before}</div>
      <div class="fix-line fix-after">\${f.after}</div>
      <div class="fix-why">\${f.why}</div>
    </div>\`).join('');

  document.getElementById('outdatedList').innerHTML = OUTDATED.map((s,i)=>\`
    <div class="skill-row" id="out-\${i}">
      <div class="skill-main">
        <div class="skill-name">\${s.skill}<span class="trend down">\${s.trend}</span></div>
        <div class="skill-meta">\${s.jobs} · last 30 days</div>
        <div class="skill-note">\${s.action}</div>
      </div>
      <button class="skill-action" onclick="toggleRow('out-\${i}', this)">Hatao</button>
    </div>\`).join('');

  document.getElementById('fadingList').innerHTML = FADING.map(s=>\`
    <div class="skill-row">
      <div class="skill-main">
        <div class="skill-name">\${s.skill}<span class="trend down">\${s.trend}</span></div>
        <div class="skill-meta">\${s.jobs} · last 30 days</div>
        <div class="skill-note">\${s.note}</div>
      </div>
    </div>\`).join('');

  document.getElementById('risingList').innerHTML = RISING.map((s,i)=>\`
    <div class="skill-row" id="rise-\${i}">
      <div class="skill-main">
        <div class="skill-name">\${s.skill}<span class="trend up">\${s.trend}</span></div>
        <div class="skill-meta">\${s.jobs} · \${s.salary}</div>
      </div>
      <div class="skill-btns">
        <button class="skill-action ghost" onclick="toggleLearnTip(\${i})">Kyun?</button>
        <button class="skill-action add-skill-btn \${addedSkills.has(s.skill)?'on':''}" id="addRise-\${i}" onclick="toggleAddedSkill('\${s.skill.replace(/'/g,"\\\\'")}', this)">\${addedSkills.has(s.skill)?'✓ Added':'+ Add to plan'}</button>
      </div>
    </div>
    <div class="learn-tip" id="tip-rise-\${i}" hidden><b>\${s.skill}</b> isliye rising hai — jyada jobs, behtar salary range (~\${s.learnTime} me seekha ja sakta hai). Abhi sirf "+ Add to plan" karo; actual lesson agle step me milega.</div>\`).join('');

  renderWins(activeWinsPath);

  document.getElementById('salaryList').innerHTML = SALARY.map(s=>\`
    <div class="salary-item">
      <div class="salary-title">\${s.title}<span style="font-weight:500;color:var(--ink-soft);font-size:11px;"> · \${s.jobs}</span></div>
      <div class="salary-add">Add to resume: <b>"\${s.add}"</b></div>
    </div>\`).join('');

  document.getElementById('timelineList').innerHTML = ROADMAP.map((r,i)=>\`
    <div class="tl-item"><div class="tl-dot"></div>
      <div class="tl-year">\${r.year}</div>
      <div class="tl-title">\${r.title}</div>
      <div class="tl-note">\${r.note}</div>
      <button class="skill-action add-skill-btn tl-add \${addedSkills.has(r.title)?'on':''}" id="addRoad-\${i}" onclick="toggleAddedSkill('\${r.title.replace(/'/g,"\\\\'")}', this)">\${addedSkills.has(r.title)?'✓ Added':'+ Add to my plan'}</button>
    </div>\`).join('');

  renderPaths();
}

function toggleRow(id, btn, onLabel){
  const row=document.getElementById(id);
  const isOn=row.classList.toggle('done');
  row.style.opacity = isOn ? .45 : 1;
  btn.classList.toggle('on', isOn);
  btn.textContent = isOn ? (onLabel || 'Hata diya') : (onLabel ? 'Add karo' : 'Hatao');
}

function toggleLearnTip(i){
  const tip=document.getElementById('tip-rise-'+i);
  tip.hidden=!tip.hidden;
}

/* the one shared "add this skill" action used by both Skills on the rise and Staying relevant
   through 2030 — whatever gets added here shows up as a chip in every path's syllabus box below */
function toggleAddedSkill(skill, btn){
  if(addedSkills.has(skill)) addedSkills.delete(skill);
  else addedSkills.add(skill);
  renderResults(); // re-render everywhere this skill appears (rising list, roadmap, path boxes)
}

function isSkillOn(pathId, skill){
  return !(pathSkillOff[pathId] && pathSkillOff[pathId].has(skill));
}
function toggleSkillForPath(pathId, skill){
  if(!pathSkillOff[pathId]) pathSkillOff[pathId]=new Set();
  if(pathSkillOff[pathId].has(skill)) pathSkillOff[pathId].delete(skill);
  else pathSkillOff[pathId].add(skill);
  renderPaths();
}

function renderPaths(){
  document.getElementById('pathList').innerHTML = PATHS.map(p=>{
    const sel=!!selectedPaths[p.id], exp=!!expandedPaths[p.id];
    const chipSkills=[...p.syllabus, ...addedSkills].filter((v,i,a)=>a.indexOf(v)===i);
    return \`
    <div class="path-card \${sel?'sel':''}" onclick="togglePath('\${p.id}')">
      <div class="path-top">
        <div class="path-check">\${sel?'<svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}</div>
        <div style="min-width:0;flex:1;">
          <span class="path-title">\${p.title}</span><span class="path-badge">\${p.badge}</span>\${p.recommended?'<span class="path-badge" style="background:var(--green-tint);color:var(--green);">Matches your resume</span>':''}
          <div class="path-sub">\${p.sub}</div>
          <div><span class="path-oneline">\${p.oneLiner}</span></div>
        </div>
      </div>
      <div class="path-detail" \${exp?'':'hidden'}>
        <div class="path-detail-label">Syllabus — tap a skill to include or leave it out</div>
        <div class="path-syllabus">\${chipSkills.map(s=>{
          const on=isSkillOn(p.id,s);
          return \`<span class="skill-chip \${on?'on':''}" onclick="event.stopPropagation(); toggleSkillForPath('\${p.id}','\${s.replace(/'/g,"\\\\'")}')"><span class="chip-ic">\${on?'✓':'+'}</span>\${s}</span>\`;
        }).join('')}</div>
        <div class="path-kya">\${p.kya}</div>
        <div class="path-stats">
          <span class="path-stat a">\${p.lessons} lessons</span>
          <span class="path-stat b">+\${p.jobs.toLocaleString('en-IN')} jobs</span>
        </div>
      </div>
    </div>\`;
  }).join('');
  updateSummary();
}

function renderWins(pathId){
  const empty=document.getElementById('winsEmpty'), list=document.getElementById('winList'),
        title=document.getElementById('winsTitle'), sub=document.getElementById('winsSub'),
        fresherNote=document.getElementById('winsFresherNote');
  if(!pathId){
    title.textContent = '3 quick wins for the next 30 days';
    sub.textContent = 'Ek path select karo neeche se — usi ke hisab se yahan exact 3 wins dikhengi';
    empty.hidden = false;
    list.innerHTML = '';
    fresherNote.hidden = true;
    return;
  }
  const p = PATHS.find(x=>x.id===pathId) || PATHS[0];
  empty.hidden = true;
  title.textContent = \`3 quick wins — \${p.badge} path\`;
  sub.textContent = 'Direct result, kam time me — inko complete karke resume me exactly waisa hi likh dena jaisa neeche diya hai';
  list.innerHTML = PATH_WINS[pathId].map(w=>\`
    <div class="win-item">
      <div class="win-top"><div class="win-num">\${w.n}</div><div class="win-skill">\${w.skill}</div><div class="win-time">\${w.time} · \${w.jobs}</div></div>
      <div class="win-line">"\${w.line}"</div>
    </div>\`).join('');
  fresherNote.hidden = experienceLevel!=='fresher';
}

function togglePath(id){
  selectedPaths[id] = !selectedPaths[id];
  if(selectedPaths[id]){
    expandedPaths[id]=true;
    activeWinsPath=id;
  } else {
    const stillOn = PATHS.filter(p=>selectedPaths[p.id]);
    activeWinsPath = stillOn.length ? stillOn[stillOn.length-1].id : null;
  }
  renderPaths();
  renderWins(activeWinsPath);
}

function updateSummary(){
  const chosen = PATHS.filter(p=>selectedPaths[p.id]);
  const bar=document.getElementById('summaryBar');
  if(chosen.length===0){ bar.hidden=true; return; }
  const lessons=chosen.reduce((a,p)=>a+p.lessons,0);
  const jobs=chosen.reduce((a,p)=>a+p.jobs,0);
  bar.hidden=false;
  document.getElementById('summaryText').innerHTML = \`<b>\${chosen.length} path\${chosen.length>1?'s':''}</b> selected · \${lessons} lessons · +\${jobs.toLocaleString('en-IN')} jobs unlock\`;
}
document.getElementById('startBtn').addEventListener('click', goNextStep);

renderResults(); // the report is always visible on the page — Analyze just scrolls you to it
setExperience('experienced'); // matches the default active pill; also syncs Leadership section visibility
applyTab('overview');
/* ---- single-file shell bridge: works embedded (single merged file) or standalone ---- */
function LucoTo(e, href){
  if(!(window.parent && window.parent!==window && window.parent.LucoNav)) return true;
  e && e.preventDefault();
  const [file, qs]=href.split('?');
  const KEYMAP={'resume-tool.html':'resume','pricing.html':'pricing','padhaao.html':'padhaao','practice.html':'practice','test.html':'test','bata-do.html':'batado'};
  const key=KEYMAP[file];
  if(!key) return true;
  if(qs){
    const p=new URLSearchParams(qs);
    for(const [k,v] of p.entries()){
      if(k==='paths') window.parent.LucoState.paths=v.split(',');
      else if(k==='pWeak') window.parent.LucoState.pWeak=v.split('|');
      else if(k==='testTopics'){ try{ window.parent.LucoState.testTopics=JSON.parse(v); }catch(err){} }
      else window.parent.LucoState[k]=isNaN(v)?v:Number(v);
    }
  }
  window.parent.LucoNav(key);
  return false;
}

function goNextStep(e){
  e.preventDefault();
  const ids=Object.keys(selectedPaths).filter(k=>selectedPaths[k]);
  const pathIds=ids.length?ids:['p1'];
  // only the skills still toggled "on" in each selected path's syllabus box carry forward
  const finalSkills=[...new Set(pathIds.flatMap(id=>{
    const p=PATHS.find(x=>x.id===id);
    const chips=p?[...p.syllabus, ...addedSkills].filter((v,i,a)=>a.indexOf(v)===i):[];
    return chips.filter(s=>isSkillOn(id,s));
  }))];
  const qs='score=64&paths='+encodeURIComponent(pathIds.join(','))+'&skills='+encodeURIComponent(finalSkills.join(','));
  if(window.parent && window.parent!==window && window.parent.LucoNav){
    window.parent.LucoState.paths=pathIds;
    window.parent.LucoState.skills=finalSkills;
    window.parent.LucoState.score=64;
    window.parent.LucoNav('pricing');
  } else {
    window.location.href='pricing.html?'+qs;
  }
  return false;
}
`;
    document.body.appendChild(script);

    const checkInterval = setInterval(() => {
      const logo = containerRef.current?.querySelector('.header .logo') as HTMLElement;
      if(logo) {
        logo.onclick = (e) => {
          e.preventDefault();
          if(onBack) onBack();
        };
        clearInterval(checkInterval);
      }
    }, 100);

    return () => {
      clearInterval(checkInterval);
      document.body.classList.remove('report-unlocked');
      if(script.parentNode) script.parentNode.removeChild(script);
    };
  }, [onBack]);

  return (
    <div style={{background: '#fff', minHeight: '100vh', width: '100%'}} ref={containerRef}>
      <style>{`
  :root{
    --brand-900:#2A1B85; --brand-700:#4C2FD9; --brand-500:#3B22A8; --brand-200:#ECE8FB;
    --tint:#F6F6F3;
    --green:#1FA854; --green-tint:#E5F5EB;
    --amber:#C9821A; --amber-tint:#FBF0DF;
    --red:#C24F3F; --red-tint:#FBEBE7;
    --ink:#1B1F23; --ink-soft:#5B6168; --line:#E4E3DD;
    --white:#FFFFFF;
  }
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  html{scroll-behavior:smooth;}
  html,body{margin:0;padding:0;background:var(--white);color:var(--ink);font-family:'Inter',sans-serif;}
  #resultsView{background:var(--tint);}
  .app{max-width:440px;margin:0 auto;min-height:100vh;}
  h1,h2,h3{font-family:'Fraunces', serif;margin:0;}
  p{margin:0;}
  button{font-family:inherit;cursor:pointer;border:none;background:none;}
  button:disabled{cursor:not-allowed;}
  .view[hidden]{display:none;}

  .header{display:flex;align-items:center;padding:20px 24px 0;}
  .logo{font-family:'Fraunces', serif;font-size:19px;font-weight:700;letter-spacing:-.2px;}
  .logo .luco{color:var(--ink);}
  .logo .hire{color:var(--brand-700);}

  /* ================= UPLOAD VIEW ================= */
  #uploadView main{padding:20px 24px 10px;}
  .up-label{font-size:14.5px;font-weight:600;color:var(--ink-soft);margin-bottom:14px;}

  .dropzone{border:1.5px dashed var(--line);border-radius:18px;padding:34px 20px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;background:var(--tint);transition:border-color .15s, background .15s;cursor:pointer;}
  .dropzone.drag{border-color:var(--brand-700);background:var(--brand-200);}
  .dropzone.error{border-color:var(--red);background:var(--red-tint);}
  .or-divider{display:flex;align-items:center;gap:10px;margin:16px 0;color:var(--ink-faint);font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;}
  .or-divider::before,.or-divider::after{content:"";flex:1;height:1px;background:var(--line);}
  .build-resume-card{display:flex;align-items:center;gap:12px;background:var(--brand-200);border-radius:16px;padding:14px;margin-bottom:16px;}
  .build-resume-card.used{opacity:.55;pointer-events:none;}
  .brc-icon{flex:none;width:34px;height:34px;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;color:var(--brand-700);}
  .brc-text{flex:1;font-size:12px;color:var(--ink-soft);line-height:1.4;}
  .brc-text b{color:var(--ink);}
  .brc-cta{flex:none;font-size:11.5px;font-weight:700;color:#fff;background:var(--brand-700);border:none;padding:9px 12px;border-radius:10px;white-space:nowrap;cursor:pointer;}
  .dz-icon{width:46px;height:46px;border-radius:14px;background:var(--white);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--brand-700);}
  .dz-title{font-size:14.5px;font-weight:600;color:var(--ink);}
  .dz-sub{font-size:12.5px;color:var(--ink-soft);}
  .dz-browse{font-weight:700;color:var(--brand-700);text-decoration:underline;text-underline-offset:2px;}
  .dz-hint{margin-top:6px;font-size:11.5px;color:var(--ink-soft);}
  .dz-error-msg{margin-top:10px;font-size:12.5px;font-weight:600;color:var(--red);display:none;}

  .filecard{display:none;align-items:center;gap:12px;border:1px solid var(--line);border-radius:16px;padding:14px;background:var(--white);box-shadow:0 6px 18px -12px rgba(16,38,33,.25);}
  .filecard.show{display:flex;}
  .filecard-icon{width:38px;height:38px;border-radius:10px;background:var(--brand-200);color:var(--brand-900);display:flex;align-items:center;justify-content:center;flex:none;}
  .filecard-info{flex:1;min-width:0;}
  .filecard-name{font-size:13.5px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .filecard-size{font-size:11.5px;color:var(--ink-soft);margin-top:1px;}
  .filecard-remove{width:26px;height:26px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;color:var(--ink-soft);font-size:17px;}
  .filecard-remove:hover{background:var(--tint);color:var(--ink);}

  .cta{width:100%;margin-top:18px;padding:15px;border-radius:14px;font-weight:700;font-size:15px;color:#fff;background:var(--brand-700);box-shadow:0 14px 26px -14px rgba(27,79,224,.55);}
  @keyframes spin { 100% { transform: rotate(360deg); } }
  .cta:disabled{background:var(--line);color:var(--ink-soft);box-shadow:none;}
  .cta:not(:disabled):active{transform:scale(.99);}
  .trust{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:14px;font-size:12px;color:var(--ink-soft);}
  .trust svg{flex:none;color:var(--brand-700);}

  .ats-checklist{margin-top:22px;border:1px solid var(--line);border-radius:16px;padding:15px 16px;background:var(--tint);}
  .ats-checklist-title{font-size:12.5px;font-weight:700;color:var(--ink);margin-bottom:10px;}
  .ats-checklist-grid{display:flex;flex-direction:column;gap:9px;}
  .ats-check-item{display:flex;align-items:flex-start;gap:9px;font-size:12px;color:var(--ink-soft);line-height:1.45;}
  .aci-dot{flex:none;width:6px;height:6px;border-radius:50%;background:var(--brand-700);margin-top:5px;}

  .no-resume{display:none;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:36px 20px;}
  .no-resume.show{display:flex;}
  .no-resume-icon{width:52px;height:52px;border-radius:16px;background:var(--brand-200);color:var(--brand-700);display:flex;align-items:center;justify-content:center;}
  .no-resume-title{font-size:15px;font-weight:700;color:var(--ink);font-family:'Fraunces';}
  .no-resume-sub{font-size:12.5px;color:var(--ink-soft);line-height:1.5;max-width:300px;}
  .no-resume-cta{margin-top:4px;font-size:12.5px;font-weight:700;color:#fff;background:var(--brand-700);padding:12px 20px;border-radius:12px;}

  /* ================= RESULTS VIEW ================= */
  #resultsView{padding-bottom:24px;}
  #resultsView .header{background:#fff;}
  .score-strip{display:flex;align-items:center;gap:14px;padding:18px 24px;background:#fff;border-bottom:1px solid var(--line);}
  .score-ring-sm{width:52px;height:52px;flex:none;position:relative;}
  .score-ring-sm svg{width:100%;height:100%;transform:rotate(-90deg);position:absolute;inset:0;}
  .score-ring-sm .trk{fill:none;stroke:var(--line);stroke-width:6;}
  .score-ring-sm .fil{fill:none;stroke:var(--brand-700);stroke-width:6;stroke-linecap:round;}
  .score-num-sm{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Fraunces';font-size:14px;font-weight:700;color:var(--ink);}
  .score-txt-title{font-size:14px;font-weight:700;color:var(--ink);}
  .score-tag{font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;margin-left:6px;background:var(--amber-tint);color:var(--amber);}
  .score-txt-sub{font-size:12px;color:var(--ink-soft);margin-top:2px;}

  /* quick-stats orientation row */
  .stat-row{display:grid;grid-template-columns:repeat(2, 1fr);padding:16px 20px;gap:12px;border-bottom:1px solid var(--line);background:#fff;}
  .stat-cell{display:flex;align-items:center;justify-content:flex-start;text-align:left;padding:12px 14px;gap:12px;border-radius:14px;background:var(--tint);}
  .stat-num{font-family:'Fraunces';font-size:22px;font-weight:700;color:var(--ink);line-height:1;}
  .stat-lbl{font-size:11px;font-weight:700;color:var(--ink-soft);line-height:1.2;}

  /* sticky section jump nav */
  .jumpnav{position:sticky;top:0;z-index:20;display:flex;gap:6px;overflow-x:auto;padding:10px 24px;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);border-bottom:1px solid var(--line);scrollbar-width:none;}
  .jumpnav::-webkit-scrollbar{display:none;}
  .jumpnav a{flex:none;font-size:11.5px;font-weight:600;color:var(--ink-soft);background:var(--tint);padding:7px 12px;border-radius:99px;white-space:nowrap;text-decoration:none;}
  .jumpnav a.active{background:var(--brand-900);color:#fff;}

  .section{background:#fff;border:1px solid var(--line);border-radius:20px;padding:20px 18px;margin:14px 16px 0;box-shadow:0 12px 28px -22px rgba(16,38,33,.35);}
  .section.flush{background:none;border:none;box-shadow:none;padding:0;margin:14px 16px 0;}
  .bar-track{height:6px;background:rgba(255,255,255,.12);border-radius:99px;overflow:hidden;}
  .bar-track.light{background:#fff;border:1px solid var(--line);}
  .bar-fill{height:100%;border-radius:99px;}
  .scan-row{background:rgba(255,255,255,.06);border-radius:10px;padding:10px 12px;font-size:12.5px;color:#fff;line-height:1.4;}
  .kw-chip{font-size:11.5px;font-weight:700;padding:5px 11px;border-radius:99px;display:inline-block;cursor:pointer;border:none;font-family:inherit;}
  .kw-chip.miss{background:var(--red-tint);color:var(--red);}
  .kw-chip.hit{background:var(--green-tint);color:var(--green);}
  .parse-row{display:flex;align-items:center;gap:9px;font-size:12.5px;border-radius:10px;padding:9px 11px;line-height:1.4;}
  .parse-row.ok{background:var(--green-tint);}
  .parse-row.bad{background:var(--red-tint);}
  .parse-row span{font-weight:800;flex:none;}
  .parse-row.ok span{color:var(--green);}
  .parse-row.bad span{color:var(--red);}
  .verdict-box{margin-top:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:14px;display:flex;align-items:center;gap:12px;}
  .verdict-icon{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;font-size:18px;}
  .mini-label{font-size:12px;font-weight:700;color:var(--ink-soft);margin-bottom:8px;text-transform:uppercase;letter-spacing:.03em;}
  .mini-label.on-dark{color:rgba(255,255,255,.55);}

  .section-head{display:flex;gap:11px;align-items:flex-start;}
  .sec-icon{flex:none;width:34px;height:34px;border-radius:10px;background:var(--tint);color:var(--brand-700);display:flex;align-items:center;justify-content:center;margin-top:1px;}
  .dark-card .sec-icon{background:rgba(255,255,255,.12);color:#fff;}
  .sec-icon.warn{background:var(--red-tint);color:var(--red);}
  .section-head-text{flex:1;min-width:0;}
  .section-head h2{font-size:16px;font-weight:700;color:var(--ink);line-height:1.3;}
  .section-head p{font-size:12.5px;color:var(--ink-soft);margin-top:3px;line-height:1.45;}
  .sub-divider{display:flex;align-items:center;gap:8px;margin:18px 0 4px;}
  .sub-divider span{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-soft);white-space:nowrap;}
  .sub-divider::after{content:'';flex:1;height:1px;background:var(--line);}
  .sub-note{font-size:11.5px;color:var(--ink-soft);margin-top:2px;margin-bottom:6px;line-height:1.4;}

  /* ---- ATS fear card ---- */
  .fear-card{background:linear-gradient(160deg,var(--brand-900) 0%,var(--brand-500) 55%,var(--brand-700) 100%);border-radius:20px;padding:20px 18px;color:#fff;box-shadow:0 18px 34px -20px rgba(42,27,133,.45);}
  .fear-eyebrow{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#CFC7F5;margin-bottom:8px;display:flex;align-items:center;gap:6px;}
  .fear-title{font-size:16.5px;font-weight:700;line-height:1.35;font-family:'Fraunces';}
  .fear-body{font-size:12.5px;color:rgba(255,255,255,.82);line-height:1.6;margin-top:9px;}
  .fear-stat{margin-top:12px;background:rgba(0,0,0,.22);border-radius:12px;padding:11px 12px;font-size:12px;color:#fff;line-height:1.5;}
  .fear-stat b{color:#DCD3F7;}
  .fear-cta{display:block;width:100%;text-align:center;margin-top:15px;padding:14px;border-radius:13px;font-weight:700;font-size:14px;background:#fff;color:var(--brand-900);}
  .fear-progress{display:none;align-items:center;gap:12px;margin-top:15px;background:rgba(0,0,0,.24);border-radius:13px;padding:12px 14px;}
  .progress-ring{position:relative;width:52px;height:52px;flex:none;}
  .progress-ring svg{width:100%;height:100%;transform:rotate(-90deg);}
  .progress-ring .trk{fill:none;stroke:rgba(255,255,255,.22);stroke-width:6;}
  .progress-ring .fil{fill:none;stroke:#fff;stroke-width:6;stroke-linecap:round;transition:stroke-dashoffset .2s linear;}
  .progress-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Fraunces';font-size:12px;font-weight:800;color:#fff;}
  .progress-label{font-size:12.5px;color:rgba(255,255,255,.82);font-weight:600;line-height:1.4;}

  /* ---- resume analysis / line fixes ---- */
  .fix-card{border:1px solid var(--line);border-radius:14px;padding:13px;margin-top:12px;}
  .fix-card:first-child{margin-top:16px;}
  .fix-tag{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:2px 8px;border-radius:99px;background:var(--brand-200);color:var(--brand-900);display:inline-block;margin-bottom:8px;}
  .fix-line{font-size:12px;line-height:1.5;border-radius:9px;padding:8px 10px 8px 28px;position:relative;}
  .fix-before{color:#8C332C;background:var(--red-tint);}
  .fix-before::before{content:'✕';position:absolute;left:10px;top:8px;font-weight:800;font-size:10.5px;color:var(--red);}
  .fix-after{color:#0E6B47;background:var(--green-tint);margin-top:6px;}
  .fix-after::before{content:'✓';position:absolute;left:10px;top:8px;font-weight:800;font-size:10.5px;color:var(--green);}
  .fix-why{margin-top:7px;font-size:11px;color:var(--ink-soft);line-height:1.45;}

  /* ---- step-to-step flow navigation ---- */
  .stepper-nav{margin-top:20px;}
  .stepper-label{font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft);text-align:center;}
  .stepper-dots{display:flex;gap:6px;justify-content:center;margin-top:10px;}
  .stepper-dots i{flex:1;max-width:34px;height:4px;border-radius:3px;background:var(--line);}
  .stepper-dots i.done{background:var(--brand-700);}
  .stepper-dots i.active{background:var(--brand-900);}
  .stepper-btns{display:flex;gap:10px;margin-top:14px;}
  .stepper-prev,.stepper-next{flex:1;text-align:center;padding:13px;border-radius:12px;font-weight:700;font-size:13px;text-decoration:none;}
  .stepper-prev{color:var(--ink);border:1.5px solid var(--line);}
  .stepper-next{flex:1.4;color:#fff;background:var(--brand-700);}

  .skill-row{display:flex;flex-wrap:nowrap;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;border-bottom:1px solid var(--line);}
  .skill-row:last-child{border-bottom:none;}
  .skill-main{min-width:0;}
  .skill-name{font-size:13.5px;font-weight:600;color:var(--ink);}
  .skill-meta{font-size:11.5px;color:var(--ink-soft);margin-top:2px;}
  .trend{font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px;margin-left:6px;}
  .trend.down{background:var(--red-tint);color:var(--red);}
  .trend.up{background:var(--green-tint);color:var(--green);}
  .skill-action{flex:none;font-size:10.5px;font-weight:700;padding:5px 8px;border-radius:99px;border:1.5px solid var(--line);color:var(--ink);background:#fff;white-space:nowrap;letter-spacing:.02em;}
  .skill-action.on{background:var(--brand-900);color:#fff;border-color:var(--brand-900);}
  .skill-note{font-size:12px;color:var(--ink-soft);margin-top:4px;line-height:1.4;}

  .dark-card{margin:8px 0;background:var(--brand-900);border-radius:18px;padding:18px;}
  .dark-card .section-head h2{color:#fff;}
  .dark-card .section-head p{color:rgba(255,255,255,.55);}
  .win-item{background:rgba(255,255,255,.06);border-radius:13px;padding:12px;margin-top:10px;}
  .win-top{display:flex;align-items:center;gap:9px;}
  .win-num{width:22px;height:22px;border-radius:50%;background:#fff;color:var(--brand-900);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex:none;}
  .win-skill{font-size:13.5px;font-weight:700;color:#fff;}
  .win-time{font-size:10.5px;color:rgba(255,255,255,.6);margin-left:auto;}
  .win-line{margin-top:8px;font-size:11.5px;color:rgba(255,255,255,.8);line-height:1.4;padding:8px 10px;background:rgba(0,0,0,.18);border-radius:8px;}

  .salary-item{border:1px solid var(--line);border-radius:14px;padding:13px;margin-top:10px;background:var(--white);}
  .salary-title{font-size:13px;font-weight:700;color:var(--ink);}
  .salary-add{margin-top:8px;font-size:11.5px;color:var(--ink-soft);line-height:1.4;background:var(--tint);border-radius:8px;padding:8px 10px;}
  .salary-add b{color:var(--ink);font-weight:600;}
  .skill-btns{display:flex;align-items:center;gap:6px;flex:none;}
  
  .timeline{margin-top:14px;padding-left:16px;border-left:2px solid var(--line);display:flex;flex-direction:column;gap:16px;}
  .tl-item{position:relative;}
  .tl-dot{position:absolute;left:-20.5px;top:2px;width:9px;height:9px;border-radius:50%;background:var(--brand-700);border:2px solid #fff;}
  .tl-year{font-size:11px;font-weight:800;color:var(--brand-700);}
  .tl-title{font-size:13.5px;font-weight:600;color:var(--ink);margin-top:2px;}
  .tl-note{font-size:12px;color:var(--ink-soft);margin-top:2px;}
  .tl-add{margin-top:8px;}

  .path-card{border:1.5px solid var(--line);border-radius:16px;padding:14px;margin-top:10px;cursor:pointer;transition:border-color .15s, background .15s;}
  .path-card.sel{border-color:var(--brand-700);background:var(--tint);}
  .path-top{display:flex;gap:10px;align-items:flex-start;}
  .path-check{width:20px;height:20px;border-radius:6px;border:1.8px solid var(--line);flex:none;margin-top:1px;display:flex;align-items:center;justify-content:center;}
  .path-card.sel .path-check{background:var(--brand-700);border-color:var(--brand-700);}
  .path-title{font-size:13.5px;font-weight:700;color:var(--ink);}
  .path-badge{font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:99px;background:var(--brand-200);color:var(--brand-900);margin-left:6px;}
  .path-sub{font-size:11.5px;color:var(--ink-soft);margin-top:2px;}
  .path-oneline{margin-top:7px;font-size:11px;font-weight:600;color:var(--brand-700);background:var(--tint);display:inline-flex;padding:5px 10px;border-radius:99px;}
  .path-detail{margin-top:12px;padding:14px;border-radius:14px;background:var(--brand-200);}
  .path-detail[hidden]{display:none;}
  .path-detail-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--brand-700);}
  .path-syllabus{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px;}
  .skill-chip{font-size:11.5px;font-weight:700;padding:6px 10px 6px 8px;border-radius:99px;background:#fff;border:1.5px solid var(--brand-700);color:var(--brand-700);display:inline-flex;align-items:center;gap:5px;cursor:pointer;transition:background .15s ease,color .15s ease,opacity .15s ease;}
  .skill-chip .chip-ic{font-size:11px;line-height:1;flex:none;}
  .skill-chip.on{background:var(--brand-700);color:#fff;}
  .skill-chip:not(.on){opacity:.6;}
  .skill-chip:active{transform:scale(.96);}
  .path-kya{margin-top:10px;font-size:12px;color:var(--ink);background:#fff;border-radius:8px;padding:8px 10px;line-height:1.4;}
  .path-stats{display:flex;gap:8px;margin-top:10px;}
  .path-stat{font-size:11px;font-weight:700;padding:5px 9px;border-radius:99px;}
  .path-stat.a{background:var(--brand-900);color:#fff;}
  .path-stat.b{background:var(--green-tint);color:var(--green);}

  .summary-bar{position:fixed;left:0;right:0;bottom:0;max-width:440px;margin:0 auto;background:#fff;border-top:1px solid var(--line);padding:14px 20px;box-shadow:0 -8px 24px rgba(16,38,33,.08);}
  .summary-bar[hidden]{display:none;}
  .summary-text{font-size:12.5px;color:var(--ink-soft);margin-bottom:8px;}
  .summary-text b{color:var(--ink);}

  /* ---- persona-gap additions ---- */
  .leads-teaser{display:flex;align-items:center;gap:10px;background:var(--green-tint);border:1px solid var(--green);border-radius:14px;padding:11px 13px;margin-top:14px;}
  .leads-teaser .lt-icon{font-size:16px;flex:none;}
  .leads-teaser .lt-text{font-size:12px;color:var(--ink);line-height:1.45;}
  .leads-teaser .lt-text b{color:var(--green);}
  .score-percentile{font-size:12px;color:var(--ink-soft);margin-top:10px;line-height:1.5;}
  .score-percentile b{color:var(--brand-900);}
  .save-later-btn{margin-top:8px;font-size:12px;font-weight:700;color:var(--brand-700);background:var(--tint);border-radius:99px;padding:8px 13px;display:inline-block;}
  .exp-toggle{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:16px;padding:12px;background:var(--tint);border-radius:14px;}
  .exp-toggle-label{font-size:12px;font-weight:600;color:var(--ink-soft);flex:none;}
  .exp-pill{font-size:11.5px;font-weight:700;padding:7px 12px;border-radius:99px;border:1.5px solid var(--line);color:var(--ink-soft);background:#fff;}
  .exp-pill.active{background:var(--brand-900);color:#fff;border-color:var(--brand-900);}
  .skill-btns{display:flex;gap:6px;flex:none;}
  .skill-action.ghost{background:transparent;color:var(--brand-700);border-color:var(--brand-700);}
  .learn-tip{font-size:11.5px;color:var(--brand-900);background:var(--tint);border-radius:10px;padding:8px 10px;margin:2px 0 12px;line-height:1.45;}
  .wins-fresher-note{font-size:11.5px;color:rgba(255,255,255,.85);background:rgba(255,255,255,.12);border-radius:10px;padding:9px 11px;margin-top:10px;line-height:1.45;}
  .wins-empty{font-size:12px;color:rgba(255,255,255,.75);background:rgba(255,255,255,.07);border:1px dashed rgba(255,255,255,.25);border-radius:12px;padding:13px;margin-top:14px;line-height:1.5;}
  .wins-empty[hidden]{display:none;}
  .leadership-list{display:flex;flex-direction:column;gap:9px;margin-top:12px;}
  .lead-check-item{display:flex;align-items:flex-start;gap:10px;font-size:12.5px;color:var(--ink);line-height:1.5;padding:10px 12px;border-radius:12px;background:var(--amber-tint);}
  .lead-check-item .lci-icon{flex:none;width:20px;height:20px;border-radius:50%;background:var(--amber);color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;}
  .leadership-note{font-size:11.5px;color:var(--ink-soft);margin-top:10px;line-height:1.5;}
  .fear-gap-note{font-size:12px;color:rgba(255,255,255,.82);background:rgba(255,255,255,.1);border-radius:12px;padding:11px 12px;margin-top:14px;line-height:1.5;}

  /* ---- upload-view additions: JD context box + instant share/report card ---- */
  .jd-toggle{width:100%;text-align:center;display:flex;justify-content:center;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--brand-700);background:transparent;border:none;padding:12px 0 4px;margin-top:0;cursor:pointer;}
  .jd-toggle .ic{transition:transform .15s;}
  .jd-toggle.open .ic{transform:rotate(45deg);}
  .jd-box{margin-top:10px;}
  .jd-tabs{display:flex;gap:6px;margin-bottom:8px;}
  .jd-tab{flex:1;padding:9px 4px;border-radius:9px;font-size:11.5px;font-weight:700;background:var(--tint);color:var(--ink-soft);border:1px solid var(--line);}
  .jd-tab.active{background:var(--brand-900);color:#fff;border-color:var(--brand-900);}
  .jd-textarea{width:100%;min-height:90px;border:1.5px solid var(--line);border-radius:12px;padding:11px 12px;font-size:12.5px;font-family:inherit;resize:vertical;}
  .jd-input{width:100%;border:1.5px solid var(--line);border-radius:12px;padding:12px;font-size:12.5px;font-family:inherit;}
  .jd-note{display:flex;gap:7px;margin-top:9px;font-size:11px;color:var(--ink-soft);line-height:1.5;}
  .jd-note svg{flex:none;margin-top:1px;color:var(--brand-700);}
  .report-card{border:1.5px solid var(--line);border-radius:18px;padding:18px;background:var(--tint);}
  .report-card-title{font-size:14.5px;font-weight:700;display:flex;align-items:center;gap:7px;}
  .report-card-title svg{color:var(--green);flex:none;}
  .report-card-sub{font-size:12px;color:var(--ink-soft);margin-top:4px;line-height:1.5;}
  .share-row{display:flex;gap:10px;margin-top:16px;}
  .share-row-stack{display:flex;flex-direction:column;}
  .share-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:13px;border-radius:12px;font-size:12.5px;font-weight:700;border:1.5px solid var(--line);color:var(--ink);background:#fff;}
  .share-btn.full{width:100%;}
  .share-btn.primary{background:var(--brand-700);color:#fff;border-color:var(--brand-700);}
  .share-hint{font-size:11px;color:var(--ink-soft);text-align:center;margin-top:9px;line-height:1.5;}
  .sheet-overlay{position:fixed;inset:0;background:rgba(16,38,33,.5);z-index:60;display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .2s;}
  .sheet-overlay.show{opacity:1;pointer-events:auto;}
  .sheet{width:100%;max-width:440px;background:#fff;border-radius:20px 20px 0 0;padding:20px 20px calc(20px + env(safe-area-inset-bottom));max-height:88vh;overflow-y:auto;transform:translateY(100%);transition:transform .25s;}
  .sheet-overlay.show .sheet{transform:translateY(0);}
  .sheet-handle{width:36px;height:4px;border-radius:3px;background:var(--line);margin:0 auto 14px;}
  .sheet-title{font-size:14px;font-weight:700;margin-bottom:12px;}
  .card-preview{width:100%;border-radius:14px;display:block;margin-bottom:14px;}
  .share-options{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
  .share-opt{display:block;text-align:center;padding:12px;border-radius:12px;background:var(--tint);border:1px solid var(--line);color:var(--ink);font-size:12.5px;font-weight:700;text-decoration:none;}
  .sheet-close{width:100%;margin-top:12px;padding:13px;border-radius:14px;font-weight:700;font-size:13px;color:var(--ink-soft);background:var(--tint);}

  .tab-bar{display:flex;gap:6px;margin:16px 16px 0;background:var(--tint);border:1px solid var(--line);border-radius:14px;padding:4px;}
  .tab-btn{flex:1;text-align:center;font-size:12px;font-weight:700;color:var(--ink-soft);padding:10px 4px;border-radius:11px;}
  .tab-btn.active{background:#fff;color:var(--brand-900);box-shadow:0 4px 10px -4px rgba(16,38,33,.25);}
  .tab-hidden, .exp-hidden{display:none !important;}
  .mini-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .mini-stat-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:13px;}
  .mini-stat-card .msc-label{font-size:10.5px;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.03em;}
  .mini-stat-card .msc-value{font-size:15px;font-weight:700;color:var(--ink);margin-top:5px;line-height:1.3;font-family:'Fraunces';}
  .mini-stat-card .msc-sub{font-size:10.5px;color:var(--ink-soft);margin-top:4px;line-height:1.4;}
  .hub-link{display:flex;align-items:center;gap:11px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:13px;}
  .hub-link .hl-icon{width:34px;height:34px;border-radius:10px;background:var(--tint);color:var(--brand-700);display:flex;align-items:center;justify-content:center;flex:none;}
  .hub-link .hl-text{flex:1;}
  .hub-link .hl-title{font-size:13px;font-weight:700;color:var(--ink);}
  .hub-link .hl-sub{font-size:11px;color:var(--ink-soft);margin-top:2px;}
  .hub-link .hl-arrow{color:var(--ink-soft);flex:none;}

  /* ================= PAYWALL / VALUE SYSTEM ================= */
  .paywall-card{background:linear-gradient(165deg,var(--brand-900) 0%,var(--brand-500) 100%);border-radius:20px;padding:22px 20px;margin:16px 16px 20px;color:#fff;box-shadow:0 18px 34px -18px rgba(42,27,133,.55);}
  .paywall-icon{width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;margin-bottom:12px;}
  .paywall-card h3{font-size:17px;color:#fff;margin-bottom:6px;}
  .paywall-card>p{font-size:12.5px;color:rgba(255,255,255,.78);line-height:1.5;margin-bottom:14px;}
  .paywall-list{list-style:none;padding:0;margin:0 0 18px;display:flex;flex-direction:column;gap:8px;}
  .paywall-list li{font-size:12.5px;color:rgba(255,255,255,.92);display:flex;gap:8px;align-items:flex-start;line-height:1.4;}
  .paywall-list svg{flex:none;margin-top:2px;color:#8FF0C4;}
  .paywall-cta{width:100%;background:#fff;color:var(--brand-700);font-weight:700;font-size:14.5px;padding:14px;border-radius:13px;}
  .paywall-trust{text-align:center;font-size:11px;color:rgba(255,255,255,.6);margin-top:10px;}

  .locked-premium{position:relative;min-height:110px;border-radius:16px;overflow:hidden;}
  body:not(.report-unlocked) .locked-premium>*:not(.lock-badge){filter:blur(5px);pointer-events:none;user-select:none;}
  .lock-badge{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;}
  body.report-unlocked .lock-badge{display:none;}
  .lock-badge-inner{display:flex;align-items:center;gap:7px;background:var(--white);border:1px solid var(--line);border-radius:99px;padding:8px 14px;font-size:11.5px;font-weight:600;color:var(--ink-soft);box-shadow:0 8px 18px -10px rgba(16,38,33,.3);}
  .lock-badge-inner svg{color:var(--brand-700);flex:none;}

  .unlocked-banner{display:none;align-items:center;gap:10px;background:var(--green-tint);border-radius:14px;padding:12px 14px;margin:16px 16px 20px;font-size:12.5px;font-weight:600;color:var(--green);}
  body.report-unlocked .unlocked-banner{display:flex;}

  .quick-links-row{display:flex;align-items:center;gap:8px;margin-top:10px;}
  .quick-link{font-size:11.5px;font-weight:600;color:var(--brand-700);text-decoration:none;}
  .qlr-dot{color:var(--line);font-size:11px;}
`}</style>
      <div dangerouslySetInnerHTML={{ __html: `
<div class="app">

  <!-- ================= UPLOAD VIEW ================= -->
  <section class="view" id="uploadView">
    <header class="header"><div class="logo"><span class="luco">Luco</span><span class="hire">Hire</span></div></header>
    <main>
      <div class="no-resume" id="noResumeState">
        <div class="no-resume-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15l3-3 3 3"/></svg></div>
        <div class="no-resume-title">Koi resume file nahi mili</div>
        <div class="no-resume-sub" id="noResumeSub">Tumhare LucoHire profile me abhi resume attach nahi hai. Signup me apna resume upload karo, phir yahan wapas aake check karo.</div>
        <a class="no-resume-cta" id="noResumeCta" href="signup.html">Signup pe jao →</a>
      </div>

      <div id="uploadFlow">
      <p class="up-label">Upload your resume to see where you stand</p>

      <div class="dropzone" id="dropzone" tabindex="0" role="button" aria-label="Upload resume">
        <input type="file" id="fileInput" accept=".pdf,.doc,.docx" hidden>
        <div class="dz-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg></div>
        <p class="dz-title">Drag and drop your resume here</p>
        <p class="dz-sub">or <span class="dz-browse">browse files</span></p>
        <p class="dz-hint">PDF or Word · up to 10MB</p>
      </div>
      <p class="dz-error-msg" id="errorMsg"></p>

      <div class="filecard" id="fileCard">
        <div class="fc-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
        <div class="fc-info">
          <div class="fc-name" id="fileName">Mohan_Sharma_Resume.pdf</div>
          <div class="fc-size" id="fileSize">1.2 MB</div>
        </div>
        <button class="fc-remove" id="removeBtn" aria-label="Remove resume"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>

      <button type="button" class="jd-toggle" id="jdToggle"><span class="ic">+</span>Add the job you're applying for (optional)</button>
      <div class="jd-box" id="jdBox" hidden style="margin-top:12px;">
        <div class="jd-tabs">
          <button type="button" class="jd-tab active" data-jd="text">Job description text</button>
          <button type="button" class="jd-tab" data-jd="url">Job posting link</button>
        </div>
        <textarea id="jdText" class="jd-textarea" placeholder="Paste the job description text here…"></textarea>
        <input id="jdUrl" class="jd-input" type="url" placeholder="Paste the job posting URL here…" hidden>
        <p class="jd-note"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>Totally optional. Add it to get a match score for this exact role — skip it and we'll still analyze your resume against the wider market.</p>
      </div>

      <div class="or-divider"><span>or</span></div>
      <div class="dropzone" id="buildResumeCard" tabindex="0" role="button" aria-label="Build resume" onclick="document.getElementById('buildResumeBtn').click()">
        <button type="button" id="buildResumeBtn" hidden></button>
        <div class="dz-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg></div>
        <p class="dz-title">Don't have a resume?</p>
        <p class="dz-sub">We'll <span class="dz-browse">build one for you</span></p>
        <p class="dz-hint">from your profile</p>
      </div>

      <button class="cta" id="analyzeBtn" disabled>Analyze my resume</button>
      <p class="trust"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>Private and secure — your resume is never shared</p>
      </div>
    </main>
  </section>

  <div class="sheet-overlay" id="shareOverlay" onclick="if(event.target===this) closeShare()">
    <div class="sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-title" id="sheetTitle">Share your score</div>
      <canvas id="cardCanvas" width="600" height="780" style="display:none;"></canvas>
      <img id="cardPreview" class="card-preview" alt="LucoHire resume score card">
      <div class="share-options" id="shareOptions"></div>
      <button class="sheet-close" onclick="closeShare()">Close</button>
    </div>
  </div>

  <!-- ================= RESULTS VIEW (always visible below the upload box) ================= -->
  <section class="view" id="resultsView">

    <div class="score-strip">
      <div class="score-ring-sm"><svg viewBox="0 0 52 52"><circle class="trk" cx="26" cy="26" r="22"/><circle class="fil" id="miniRing" cx="26" cy="26" r="22" stroke-dasharray="138" stroke-dashoffset="50"/></svg><div class="score-num-sm" id="miniRingNum">64</div></div>
      <div><div class="score-txt-title">Resume score: 64 / 100<span class="score-tag">Needs work</span></div><div class="score-txt-sub">Based on 18,000+ recent listings</div></div>
    </div>

    <div class="score-percentile" style="font-size:13px; color:var(--ink-soft); line-height:1.4; margin: 16px 24px 0; padding-top:16px; border-top:1px dashed var(--line); text-align:center;">Tumhara score <b style="color:var(--ink);">average se upar</b> hai 2–4 yr experience wale UI/UX designers ke liye (average: 58/100).</div>

    <div class="exp-toggle" id="expToggle">
      <span class="exp-toggle-label">Yeh resume:</span>
      <button class="exp-pill active" data-lvl="experienced" onclick="setExperience('experienced')">2+ yrs experience</button>
      <button class="exp-pill" data-lvl="fresher" onclick="setExperience('fresher')">Fresher / 0-1 yr</button>
    </div>

    <div class="tab-bar" id="tabBar">
      <div class="tab-btn active" data-tab="overview" onclick="applyTab('overview')">Overview</div>
      <div class="tab-btn" data-tab="fixes" onclick="applyTab('fixes')">Fixes</div>
      <div class="tab-btn" data-tab="recruiter" onclick="applyTab('recruiter')">Recruiter</div>
      <div class="tab-btn" data-tab="skills" onclick="applyTab('skills')">Skills</div>
    </div>

    <div class="unlocked-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><polyline points="20 6 9 17 4 12"/></svg>
      Full report unlocked — everything below is yours
    </div>

    <div class="paywall-card" id="paywallCard" hidden>
      <div class="paywall-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
      <h3>Unlock your full resume report</h3>
      <p>You've seen the headline. Here's everything behind it — the exact fixes, the recruiter's real verdict, and a resume ready to send.</p>
      <ul class="paywall-list">
        <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Every weak bullet, rewritten line-by-line</li>
        <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>The recruiter's full 6-second scan, not just the verdict</li>
        <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Missing JD keywords + ATS parsing fixes</li>
        <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Skills to drop, skills to learn, salary-boosting roadmap</li>
        <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>A rewritten, ATS-optimised resume — ready to send today</li>
      </ul>
      <button class="paywall-cta" onclick="unlockReport()">Unlock full report — ₹499</button>
      <p class="paywall-trust">One-time · or included free with the Job-Ready plan</p>
    </div>

    <div class="section" id="secOverview" data-tab="overview">
      <div class="verdict-box" style="background:var(--tint);border:1px solid var(--line);">
        <div class="verdict-icon" style="background:var(--amber-tint);color:var(--amber);">⚠</div>
        <div><div style="font-weight:700;font-size:14px;color:var(--ink);">Borderline — 6 me se 6 recruiter 6 sec ke baad skip kar sakte hain</div><div style="font-size:11.5px;color:var(--ink-soft);margin-top:2px;">Wajah aur pura breakdown → Recruiter tab</div></div>
      </div>

      <div class="mini-grid" style="margin-top:12px;">
        <div class="mini-stat-card">
          <div class="msc-label">Benchmark</div>
          <div class="msc-value">Top 35%</div>
          <div class="msc-sub">2-4 yr UI/UX resumes ke beech</div>
        </div>
        <div class="mini-stat-card">
          <div class="msc-label">Your edge</div>
          <div class="msc-value">Stable tenure</div>
          <div class="msc-sub">1.8 yr avg, koi gap nahi — isko aur highlight karo</div>
        </div>
      </div>

      <div class="stat-row" style="margin-top:4px;">
        <div class="stat-cell"><div class="stat-num" style="color:var(--red)">3</div><div class="stat-lbl">skills to drop</div></div>
        <div class="stat-cell"><div class="stat-num" style="color:var(--green)">4</div><div class="stat-lbl">skills rising</div></div>
        <div class="stat-cell"><div class="stat-num">3</div><div class="stat-lbl">quick wins</div></div>
        <div class="stat-cell"><div class="stat-num" style="color:var(--brand-700)">12.7k+</div><div class="stat-lbl">jobs unlock</div></div>
      </div>

      <div class="mini-label" style="margin-top:18px;">Sabse bada risk abhi</div>
      <div class="hub-link" onclick="applyTab('fixes')" style="cursor:pointer;">
        <div class="hl-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
        <div class="hl-text"><div class="hl-title">4 JD keywords missing — sabse bada rejection risk</div><div class="hl-sub">Unlock to see exactly which ones</div></div>
        <svg class="hl-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>

      <div class="mini-label" style="margin-top:16px;">Dekho</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div class="hub-link" onclick="applyTab('fixes')" style="cursor:pointer;">
          <div class="hl-icon">✍</div>
          <div class="hl-text"><div class="hl-title">Fixes</div><div class="hl-sub">Line-by-line rewrites, ATS risk, missing keywords</div></div>
          <svg class="hl-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="hub-link" onclick="applyTab('recruiter')" style="cursor:pointer;">
          <div class="hl-icon">👁</div>
          <div class="hl-text"><div class="hl-title">Recruiter view</div><div class="hl-sub">6-sec scan, ownership language, likely interview Qs</div></div>
          <svg class="hl-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="hub-link" onclick="applyTab('skills')" style="cursor:pointer;">
          <div class="hl-icon">📈</div>
          <div class="hl-text"><div class="hl-title">Skills & roadmap</div><div class="hl-sub">Drop, rising, salary, paths, quick wins</div></div>
          <svg class="hl-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </div>

    <div class="section locked-premium" id="secRecruiterScan" data-tab="recruiter">
      <div class="lock-badge"><div class="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div class="dark-card" style="background:linear-gradient(160deg, #1d105c 0%, #301f91 100%); box-shadow: inset 0 2px 12px rgba(0,0,0,0.2);">
        <div class="section-head">
          <div class="sec-icon" style="background:rgba(255,255,255,.12);color:#fff;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg></div>
          <div class="section-head-text"><h2>Recruiter's 6-second scan</h2><p>Yeh wahi verdict hai jo ek real recruiter 6 second me deta hai — resume properly padhne se pehle</p></div>
        </div>

        <div class="verdict-box">
          <div class="verdict-icon" style="background:var(--amber-tint);color:var(--amber);">⚠</div>
          <div><div style="font-weight:700;font-size:14px;color:#fff;">Borderline — 6 me se 6 recruiter 6 sec ke baad skip kar sakte hain</div><div style="font-size:11.5px;color:rgba(255,255,255,.6);margin-top:2px;">Reason: pehli nazar me impact numbers nahi dikhte</div></div>
        </div>

        <div class="mini-label on-dark" style="margin-top:16px;">👁 Nazar is order me jaati hai</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div class="scan-row">1. Job title + company (top) — clear ✓</div>
          <div class="scan-row">2. Last role ka pehla bullet — "responsible for" se shuru hota hai, weak ⚠</div>
          <div class="scan-row">3. Numbers / impact — miss ho jaate hain, kahin highlight nahi ✗</div>
        </div>

        <div style="margin-top:16px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,.75);margin-bottom:5px;"><span>Ownership language (drove, led, built)</span><b style="color:#fff;">35%</b></div>
          <div class="bar-track"><div class="bar-fill" style="width:35%;background:var(--amber);"></div></div>
          <div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:4px;">7 me se sirf 2-3 bullets strong language use karte hain, baaki "responsible for / worked on" jaisa weak hai</div>
        </div>
        <div style="margin-top:14px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,.75);margin-bottom:5px;"><span>Relevance to target role</span><b style="color:#fff;">72%</b></div>
          <div class="bar-track"><div class="bar-fill" style="width:72%;background:var(--green);"></div></div>
          <div style="font-size:11px;color:rgba(255,255,255,.5);margin-top:4px;">Baaki 28% content (purani internship, unrelated tools) filler lag raha hai</div>
        </div>
        <div style="margin-top:14px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,.75);margin-bottom:5px;"><span>Career pattern</span><b style="color:#fff;">Stable ✓</b></div>
          <div style="font-size:11px;color:rgba(255,255,255,.5);">Average tenure 1.8 yrs, koi unexplained gap nahi — job-hopping red flag nahi hai</div>
        </div>
      </div>
    </div>

    <div class="section locked-premium" id="secAnalysis" data-tab="fixes">
      <div class="lock-badge"><div class="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div class="section-head">
        <div class="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div>
        <div class="section-head-text"><h2>Yeh mat likho, yeh likho</h2><p>Line-by-line fixes — wording aur structure, dono. Ye exact wahi cheezein hain jo abhi tumhara ATS score aur recruiter ka pehla impression, dono kaat rahi hain.</p></div>
      </div>
      <div id="fixList"></div>
    </div>

    <div class="section locked-premium" id="secJDMatch" data-tab="fixes">
      <div class="lock-badge"><div class="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div class="section-head">
        <div class="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
        <div class="section-head-text"><h2>JD match deep-dive</h2><p>Tumne jo job description upload ki, uske against exact match — generic nahi, isi job ke liye</p></div>
      </div>

      <div style="display:flex;align-items:flex-start;gap:18px;background:var(--tint);border:1px solid var(--line);border-radius:16px;padding:20px;margin-top:16px;margin-bottom:20px;">
        <div class="score-ring-sm" style="flex:none;transform:scale(1.1);"><svg viewBox="0 0 52 52"><circle class="trk" cx="26" cy="26" r="22"/><circle class="fil" cx="26" cy="26" r="22" stroke-dasharray="138" stroke-dashoffset="55" style="stroke:var(--amber);"/></svg><div class="score-num-sm">60%</div></div>
        <div style="font-size:12.5px;color:var(--ink-soft);line-height:1.6;"><b style="color:var(--ink);font-size:14px;display:block;margin-bottom:6px;">18 of 30</b> JD keywords match. Baaki 12 missing — inhe (genuinely) add karne se match 85%+ ja sakta hai.</div>
      </div>

      <div style="margin-top:16px;">
        <div class="mini-label">Missing keywords (add karo agar genuinely aata hai)</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;">
          <button class="kw-chip miss" onclick="this.classList.toggle('miss'); this.classList.toggle('hit');">+ Figma Variables</button>
          <button class="kw-chip miss" onclick="this.classList.toggle('miss'); this.classList.toggle('hit');">+ Design Systems</button>
          <button class="kw-chip miss" onclick="this.classList.toggle('miss'); this.classList.toggle('hit');">+ A/B Testing</button>
          <button class="kw-chip miss" onclick="this.classList.toggle('miss'); this.classList.toggle('hit');">+ Accessibility (WCAG)</button>
          
          <div style="display:inline-flex;align-items:center;gap:4px;">
            <input type="text" id="newKwInput" placeholder="Naya keyword..." style="font-size:11.5px;padding:4px 8px;border-radius:99px;border:1px solid var(--line);background:#fff;width:100px;font-family:inherit;" onkeypress="if(event.key==='Enter') document.getElementById('addKwBtn').click()">
            <button id="addKwBtn" class="kw-chip" style="background:var(--tint);color:var(--brand-700);border:1px dashed var(--brand-700);" onclick="const inp=document.getElementById('newKwInput'); const kw=inp.value; if(kw && kw.trim()){ const b=document.createElement('button'); b.className='kw-chip hit'; b.onclick=function(){ this.classList.toggle('miss'); this.classList.toggle('hit'); }; b.textContent='+ ' + kw.trim(); this.parentNode.parentNode.insertBefore(b, this.parentNode); inp.value=''; }">+ Add</button>
          </div>
        </div>
      </div>

      <div style="margin-top:16px;">
        <div class="mini-label">ATS parsing simulation — jo bot literally padh paata hai</div>
        <div style="display:flex;flex-direction:column;gap:7px;">
          <div class="parse-row ok"><span>✓</span> Work experience, dates, job titles — clean parse</div>
          <div class="parse-row bad"><span>✗</span> Skills 2-column table me hain — ATS ignore kar deta hai, plain list me convert karo</div>
          <div class="parse-row bad"><span>✗</span> Contact info header/footer me hai — kai ATS parsers isko skip kar dete hain</div>
        </div>
      </div>

      <div style="margin-top:16px;">
        <div class="mini-label">Quantification audit — number missing bullets</div>
        <div class="fix-card" style="margin-top:0;">
          <span class="fix-tag">No impact number</span>
          <div class="fix-line fix-before">Improved onboarding flow for new users</div>
          <div class="fix-line fix-after">Redesigned onboarding flow, cutting drop-off from [X]% to [Y]%</div>
          <div class="fix-why">Bina number ke, recruiter impact ka andaza nahi laga paata — exact % add karo</div>
        </div>
        <div class="fix-card">
          <span class="fix-tag">No impact number</span>
          <div class="fix-line fix-before">Worked closely with engineering team on new features</div>
          <div class="fix-line fix-after">Partnered with a 4-person eng team to ship [X] features across [Y] sprints</div>
          <div class="fix-why">Team size / scope specify karo — "worked closely" kuch nahi batata</div>
        </div>
      </div>
    </div>

    <div class="section locked-premium" id="secDrop" data-tab="skills">
      <div class="lock-badge"><div class="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div class="section-head">
        <div class="sec-icon warn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg></div>
        <div class="section-head-text"><h2>Skills to drop</h2><p>Not showing up in job listings anymore — hatao toh calls badhengi</p></div>
      </div>
      <div id="outdatedList"></div>
    </div>

    <div class="section locked-premium" data-tab="skills">
      <div class="lock-badge"><div class="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div class="section-head"><h2>Fading skills</h2><p>Abhi hai, par demand gir rahi hai</p></div>
      <div id="fadingList"></div>
    </div>

    <div class="section locked-premium" id="secATS" data-tab="fixes">
      <div class="lock-badge"><div class="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div class="fear-card">
        <div class="fear-eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>Reality check</div>
        <div class="fear-title">Human tumhara resume dekhta hi nahi — jab tak ATS pehle "haan" na bole</div>
        <div class="fear-body">Top product companies aur bade startups apna pehla shortlist ek software (ATS) se karte hain, human se nahi. Formatting ya keyword match weak hai toh resume seedha reject queue me chala jaata hai — kisi recruiter ne aankh tak nahi maari. Manual review sirf unhi resumes pe hota hai jo ye pehla filter paar kar lete hain.</div>
        <div class="fear-stat">Tumhara resume score abhi <b>64/100</b> hai — is range ke resumes ka bada hissa isi pehle filter par hi atak jaata hai, kaam ke skills hone ke baad bhi.</div>
        <div class="fear-gap-note">Career break liya hai? Wo tumhare against nahi jaata — jab tak resume usse clearly explain kare. ATS khaali employment gaps ko bhi flag karta hai, isliye "Yeh mat likho, yeh likho" section me ek exact example diya gaya hai gap explain karne ka.</div>
        <a class="fear-cta" href="#secAnalysis">Dekho exact fixes neeche ↓</a>
      </div>
    </div>

    <div class="section locked-premium" id="secNextSteps" data-tab="recruiter">
      <div class="lock-badge"><div class="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div class="section-head">
        <div class="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7Z"/></svg></div>
        <div class="section-head-text"><h2>What happens after you apply</h2><p>Is resume ke saath is exact JD pe apply karoge toh kya hoga — aur interview tak pahunche toh kya poocha jaayega</p></div>
      </div>

      <div style="background:var(--tint);border:1px solid var(--line);border-radius:16px;padding:14px;margin-bottom:14px;">
        <div class="mini-label" style="margin-bottom:10px;">Top 3 rejection reasons (agar reject hua toh)</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px;"><span>Missing keywords (Figma Variables, A/B Testing)</span><b style="color:var(--red);">42%</b></div>
            <div class="bar-track light"><div class="bar-fill" style="width:42%;background:var(--red);"></div></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px;"><span>No quantified impact in bullets</span><b style="color:var(--amber);">33%</b></div>
            <div class="bar-track light"><div class="bar-fill" style="width:33%;background:var(--amber);"></div></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px;"><span>ATS parsing issue (table format)</span><b style="color:var(--ink-soft);">25%</b></div>
            <div class="bar-track light"><div class="bar-fill" style="width:25%;background:var(--ink-soft);"></div></div>
          </div>
        </div>
      </div>

      <div class="mini-label">Interview me yeh 5 poocha jaayega (resume ke claims se)</div>
      <div class="skill-row"><div><div class="skill-name">"Improved onboarding flow" — exact numbers batao?</div><div class="skill-meta">Kyunki bullet me impact quantified nahi hai</div></div></div>
      <div class="skill-row"><div><div class="skill-name">Design system kaise maintain kiya, kitne components?</div><div class="skill-meta">JD me "Design Systems" explicitly maanga gaya hai</div></div></div>
      <div class="skill-row"><div><div class="skill-name">Kabhi A/B test run kiya? Result kya tha?</div><div class="skill-meta">Resume me mention nahi, par role ke liye critical hai</div></div></div>
      <div class="skill-row"><div><div class="skill-name">Eng team ke saath kaam karne ka process kya tha?</div><div class="skill-meta">"Worked closely with engineering" ka follow-up</div></div></div>
      <div class="skill-row" style="border-bottom:none;"><div><div class="skill-name">1.8 yrs me role switch kyun kiya?</div><div class="skill-meta">Tenure pattern se predictable follow-up</div></div></div>
    </div>

    <div class="section locked-premium" id="secSalary" data-tab="skills">
      <div class="lock-badge"><div class="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div class="section-head">
        <div class="sec-icon" style="font-weight:800;font-size:15px;">₹</div>
        <div class="section-head-text"><h2>For a higher salary</h2><p>15 LPA+ ka filter — inn 3 cheezon ki wajah se hi shortlist rukti hai, baaki sab theek hone ke baad bhi</p></div>
      </div>
      <div id="salaryList"></div>
    </div>

    <div class="section exp-hidden locked-premium" id="secLeadership" data-tab="skills">
      <div class="lock-badge"><div class="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div class="section-head">
        <div class="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <div class="section-head-text"><h2>Leadership signal check</h2><p>Senior ya leadership role target kar rahe ho? Ye 4 cheezein abhi resume me missing lag rahi hain</p></div>
      </div>
      <div class="leadership-list">
        <div class="lead-check-item"><span class="lci-icon">–</span><div><b>Team size</b> — "led a team of X engineers" jaisi line kahin nahi hai</div></div>
        <div class="lead-check-item"><span class="lci-icon">–</span><div><b>Mentoring</b> — juniors ko mentor karne ka koi mention nahi</div></div>
        <div class="lead-check-item"><span class="lci-icon">–</span><div><b>Business impact</b> — revenue, cost ya retention jaisa business-level number missing hai</div></div>
        <div class="lead-check-item"><span class="lci-icon">–</span><div><b>Architecture decisions</b> — system-level decisions ka ownership nahi likha</div></div>
      </div>
      <p class="leadership-note">Sirf senior/leadership-track ke liye relevant hai — isliye ye tabhi dikh raha hai jab "2+ yrs experience" selected ho. "Fresher / 0-1 yr" pe switch karoge toh ye section apne aap hide ho jaayega.</p>
    </div>

    <div class="section flush" id="secWins" data-tab="skills">
      <div class="dark-card">
        <div class="section-head">
          <div class="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
          <div class="section-head-text"><h2 id="winsTitle">3 quick wins for the next 30 days</h2><p id="winsSub">Ek path select karo neeche se — usi ke hisab se yahan exact 3 wins dikhengi</p></div>
        </div>
        <div class="wins-empty" id="winsEmpty">Abhi tak koi path select nahi kiya. <b>"Choose your path"</b> me se ek pe tap karo, iske 3 wins turant yahan aa jaayenge.</div>
        <div class="wins-fresher-note" id="winsFresherNote" hidden>Fresher ho? Inhe personal ya college project ke against likho, job experience ke against nahi.</div>
        <div id="winList"></div>
      </div>
    </div>

    <div class="section" id="secDownload">
      <div class="section-head">
        <div class="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="M12 15V3M12 15l-4-4M12 15l4-4"/><path d="M4 17v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg></div>
        <div class="section-head-text"><h2>Your rewritten, ATS-optimised resume</h2><p>Every fix above, already applied — download it and send it today</p></div>
      </div>
      <div class="locked-premium" style="margin-top:14px;">
        <div class="lock-badge"><div class="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
        <button class="share-btn full" id="downloadAtsBtn">⬇ Download ATS-friendly resume</button>
      </div>
    </div>

    <p class="sub-note" data-tab="skills" style="margin:16px 16px 2px;">Yeh sections sirf <b>diagnosis</b> ke liye hain. Jo skill "+ Add to plan" karoge wo neeche "Choose your path" me syllabus ka hissa ban jaayegi — actual seekhna agle step, <b>Padhaao</b>, me hoga.</p>

    <div class="section locked-premium" id="secRising" data-tab="skills">
      <div class="lock-badge"><div class="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div class="section-head">
        <div class="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
        <div class="section-head-text"><h2>Skills on the rise</h2><p>Ab seekhoge toh 2 saal aage rahoge — inn hi skills ki wajah se naye job postings me salary range upar shift hui hai</p></div>
      </div>
      <div id="risingList"></div>
    </div>

    <div class="section locked-premium" id="secRoadmap" data-tab="skills">
      <div class="lock-badge"><div class="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div class="section-head">
        <div class="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h6a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4H9"/></svg></div>
        <div class="section-head-text"><h2>Staying relevant through 2030</h2><p>Future-proof roadmap — har saal jo naya seekhna padega, taaki AI ya juniors overtake na kar paayein</p></div>
      </div>
      <div class="timeline" id="timelineList"></div>
    </div>

    <div class="section" id="secPaths" style="margin-bottom:110px;" data-tab="skills">
      <div class="section-head">
        <div class="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg></div>
        <div class="section-head-text"><h2>Choose your path</h2><p>Jo select karoge, wahi tumhara syllabus banega</p></div>
      </div>
      <div id="pathList"></div>
    </div>

    <div class="section" id="secDownloadBottom" style="margin-bottom:24px;">
      <div class="section-head">
        <div class="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="M12 15V3M12 15l-4-4M12 15l4-4"/><path d="M4 17v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg></div>
        <div class="section-head-text"><h2>Your rewritten, ATS-optimised resume</h2><p>Every fix above, already applied — download it and send it today</p></div>
      </div>
      <div class="locked-premium" style="margin-top:14px;">
        <div class="lock-badge"><div class="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
        <div class="share-row-stack">
          <button class="share-btn full" id="downloadAtsBtnBottom">⬇ Download ATS-friendly resume</button>
          <div class="share-row" style="margin-top:10px;">
            <button class="share-btn" id="shareResumeBtnBottom">↗ Share resume</button>
          </div>
        </div>
      </div>
      <button class="share-btn primary" style="width:100%;margin-top:10px;" id="shareBtnBottom">↗ Share score card</button>
    </div>

    <div class="section" id="stepperNavSection" style="margin-bottom:24px;">
      <div class="stepper-nav">
        <div class="stepper-label">Step 1 of 5 — Batao: Resume Check</div>
        <div class="stepper-dots"><i class="active"></i><i></i><i></i><i></i><i></i></div>
      </div>
    </div>

    <div class="summary-bar" id="summaryBar" hidden>
      <p class="summary-text" id="summaryText"></p>
      <button class="cta" id="startBtn" style="margin-top:0;">Next: Choose your plan →</button>
    </div>
  </section>

</div>


` }} />
    </div>
  );
}
