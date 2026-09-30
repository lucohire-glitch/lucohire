import React, { useEffect, useRef } from 'react';
import './ResumeCheckView.css';

export default function ResumeCheckView({ onBack }: any) {
  useEffect(() => {
    // Setup vanilla JS logic exactly as it was
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

analyzeBtn.addEventListener('click', () => {
    if (!currentFile) return;
    
    // Hide upload UI parts
    const uploadFlow = document.getElementById('uploadFlow');
    if(uploadFlow) uploadFlow.style.display = 'none';
    
    // Show loader
    const loader = document.getElementById('themeLoader');
    if(loader) loader.style.display = 'flex';
    
    const loaderText = document.getElementById('loaderText');
    const steps = ['Reading your resume...', 'Matching against 18,000+ listings...', 'Checking skill demand & trends...', 'Building your roadmap...'];
    let i = 0;
    if(loaderText) loaderText.textContent = steps[0];
    
    const iv = setInterval(() => {
      i++;
      if (i < steps.length) { 
        if(loaderText) loaderText.textContent = steps[i]; 
        return; 
      }
      clearInterval(iv);
      
      // Hide loader, show results
      if(loader) loader.style.display = 'none';
      const resultsView = document.getElementById('resultsView');
      if(resultsView) {
        resultsView.style.display = 'block';
        resultsView.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 700);
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
    sub.textContent = 'Ek path select karo upar se — usi ke hisab se yahan exact 3 wins dikhengi';
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
applyTab('overview'); // clean, minimal default landing view

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
    
    document.body.classList.add('report-unlocked');

    return () => {
      if(document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="resume-check-container" style={{ background: '#fff', width: '100%', minHeight: '100vh' }}>
      <div className="app">

  {/*  ================= UPLOAD VIEW =================  */}
  <section className="view" id="uploadView">
    <header className="header"><div className="logo"><span className="luco">Luco</span><span className="hire">Hire</span></div></header>
    <main>
      <div className="no-resume" id="noResumeState">
        <div className="no-resume-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15l3-3 3 3"/></svg></div>
        <div className="no-resume-title">Koi resume file nahi mili</div>
        <div className="no-resume-sub" id="noResumeSub">Tumhare LucoHire profile me abhi resume attach nahi hai. Signup me apna resume upload karo, phir yahan wapas aake check karo.</div>
        <a className="no-resume-cta" id="noResumeCta" href="signup.html">Signup pe jao →</a>
      </div>

      <div id="uploadFlow">
      <p className="up-label">Upload your resume to see where you stand</p>

      <div className="dropzone" id="dropzone" tabIndex={0} role="button" aria-label="Upload resume">
        <input type="file" id="fileInput" accept=".pdf,.doc,.docx" hidden />
        <div className="dz-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg></div>
        <p className="dz-title">Drag and drop your resume here</p>
        <p className="dz-sub">or <span className="dz-browse">browse files</span></p>
        <p className="dz-hint">PDF or Word · up to 10MB</p>
      </div>
      <p className="dz-error-msg" id="errorMsg"></p>

      <button type="button" className="jd-toggle" id="jdToggle"><span className="ic">+</span>Add the job you're applying for (optional)</button>
      <div className="jd-box" id="jdBox" hidden>
        <div className="jd-tabs">
          <button type="button" className="jd-tab active" data-jd="text">Job description text</button>
          <button type="button" className="jd-tab" data-jd="url">Job posting link</button>
        </div>
        <textarea id="jdText" className="jd-textarea" placeholder="Paste the job description text here…"></textarea>
        <input id="jdUrl" className="jd-input" type="url" placeholder="Paste the job posting URL here…" hidden />
        <p className="jd-note"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>Totally optional. Add it to get a match score for this exact role — skip it and we'll still analyze your resume against the wider market.</p>
      </div>

      <div className="or-divider"><span>or</span></div>
      <div className="dropzone" id="buildResumeCard" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '35px 20px', border: '1.5px dashed var(--line)', borderRadius: '18px', background: '#FAFAFA', textAlign: 'center'}}>
          <div className="dz-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg></div>
          <p className="dz-title" style={{margin: '0', fontSize: '15px', fontWeight: 'bold', color: 'var(--ink)'}}>Don't have a resume?</p>
          <p className="dz-sub" style={{margin: '0', fontSize: '13px', color: 'var(--ink-soft)'}}>We'll build one for you from your LucoHire profile</p>
          <button type="button" className="brc-cta" id="buildResumeBtn" style={{marginTop: '12px', border: '1.5px solid var(--brand-700)', background: 'var(--brand-900)', color: '#fff', padding: '8px 16px', borderRadius: '99px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'}}>Build my resume &rarr;</button>
        </div>

      <div className="filecard" id="fileCard">
        <div className="filecard-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg></div>
        <div className="filecard-info"><div className="filecard-name" id="fileName"></div><div className="filecard-size" id="fileSize"></div></div>
        <button className="filecard-remove" id="removeBtn" aria-label="Remove file">×</button>
      </div>

      <button className="cta" id="analyzeBtn" disabled>Analyze my resume</button>
      <p className="trust"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>Private and secure — your resume is never shared</p>
      </div>
    </main>
  </section>

  <div className="sheet-overlay" id="shareOverlay" onClick={() => { if((event as any).target === (event as any).currentTarget) (window as any).closeShare() }}>
    <div className="sheet">
      <div className="sheet-handle"></div>
      <div className="sheet-title" id="sheetTitle">Share your score</div>
      <canvas id="cardCanvas" width="600" height="780" style={{'display': 'none'}}></canvas>
      <img id="cardPreview" className="card-preview" alt="LucoHire resume score card" />
      <div className="share-options" id="shareOptions"></div>
      <button className="sheet-close" onClick={() => {(window as any).closeShare() }}>Close</button>
    </div>
  </div>

  {/*  ================= RESULTS VIEW (always visible below the upload box) =================  */}
  
    {/* Loader */}
    <div id="themeLoader" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '20px', minHeight: '50vh' }}>
      <div style={{ width: '45px', height: '45px', border: '4px solid var(--tint)', borderTop: '4px solid var(--brand-700)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <div id="loaderText" style={{ color: 'var(--brand-900)', fontWeight: 'bold', fontSize: '16px' }}>Analyzing...</div>
    </div>
    
    <section className="view" id="resultsView">
    

    <div className="score-strip">
      <div className="score-ring-sm"><svg viewBox="0 0 52 52"><circle className="trk" cx="26" cy="26" r="22"/><circle className="fil" id="miniRing" cx="26" cy="26" r="22" strokeDasharray="138" strokeDashoffset="50"/></svg><div className="score-num-sm" id="miniRingNum">64</div></div>
      <div><div className="score-txt-title">Resume score: 64 / 100<span className="score-tag">Needs work</span></div><div className="score-txt-sub">Based on 18,000+ recent listings</div></div>
    </div>

    <div className="score-percentile">Tumhara score <b>average se upar</b> hai 2–4 yr experience wale UI/UX designers ke liye (average: 58/100).</div>

    <div className="quick-links-row" style={{ display: 'none' }}>
      <a href="#dropzone" className="quick-link">↑ Upload a different resume</a>
      <span className="qlr-dot">•</span>
      <a href="#jdToggle" className="quick-link" id="jdQuickLink">+ Add the job description</a>
    </div>

    <div className="exp-toggle" id="expToggle" style={{ display: 'none' }}>
      <span className="exp-toggle-label">Yeh resume:</span>
      <button className="exp-pill active" data-lvl="experienced" onClick={() => {(window as any).setExperience('experienced') }}>2+ yrs experience</button>
      <button className="exp-pill" data-lvl="fresher" onClick={() => {(window as any).setExperience('fresher') }}>Fresher / 0-1 yr</button>
    </div>

    <div className="tab-bar" id="tabBar" style={{ display: 'none' }}>
      <div className="tab-btn active" data-tab="overview" onClick={() => {(window as any).applyTab('overview') }}>Overview</div>
      <div className="tab-btn" data-tab="fixes" onClick={() => {(window as any).applyTab('fixes') }}>Fixes</div>
      <div className="tab-btn" data-tab="recruiter" onClick={() => {(window as any).applyTab('recruiter') }}>Recruiter</div>
      <div className="tab-btn" data-tab="skills" onClick={() => {(window as any).applyTab('skills') }}>Skills</div>
    </div>

    <div className="unlocked-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><polyline points="20 6 9 17 4 12"/></svg>
      Full report unlocked — everything below is yours
    </div>

    <div className="paywall-card" id="paywallCard" hidden>
      <div className="paywall-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
      <h3>Unlock your full resume report</h3>
      <p>You've seen the headline. Here's everything behind it — the exact fixes, the recruiter's real verdict, and a resume ready to send.</p>
      <ul className="paywall-list">
        <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>Every weak bullet, rewritten line-by-line</li>
        <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>The recruiter's full 6-second scan, not just the verdict</li>
        <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>Missing JD keywords + ATS parsing fixes</li>
        <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>Skills to drop, skills to learn, salary-boosting roadmap</li>
        <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>A rewritten, ATS-optimised resume — ready to send today</li>
      </ul>
      <button className="paywall-cta" onClick={() => {(window as any).unlockReport() }}>Unlock full report — ₹499</button>
      <p className="paywall-trust">One-time · or included free with the Job-Ready plan</p>
    </div>

    <div className="section" id="secOverview" data-tab="overview">
      <div className="verdict-box" style={{'background': 'var(--tint)', 'border': '1px solid var(--line)'}}>
        <div className="verdict-icon" style={{'background': 'var(--amber-tint)', 'color': 'var(--amber)'}}>⚠</div>
        <div><div style={{'fontWeight': '700', 'fontSize': '14px', 'color': 'var(--ink)'}}>Borderline — 6 me se 6 recruiter 6 sec ke baad skip kar sakte hain</div><div style={{'fontSize': '11.5px', 'color': 'var(--ink-soft)', 'marginTop': '2px'}}>Wajah aur pura breakdown → Recruiter tab</div></div>
      </div>

      <div className="mini-grid" style={{'marginTop': '12px'}}>
        <div className="mini-stat-card">
          <div className="msc-label">Benchmark</div>
          <div className="msc-value">Top 35%</div>
          <div className="msc-sub">2-4 yr UI/UX resumes ke beech</div>
        </div>
        <div className="mini-stat-card">
          <div className="msc-label">Your edge</div>
          <div className="msc-value">Stable tenure</div>
          <div className="msc-sub">1.8 yr avg, koi gap nahi — isko aur highlight karo</div>
        </div>
      </div>

      <div className="stat-row" style={{'marginTop': '4px'}}>
        <div className="stat-cell"><div className="stat-num" style={{'color': 'var(--red)'}}>3</div><div className="stat-lbl">skills to drop</div></div>
        <div className="stat-cell"><div className="stat-num" style={{'color': 'var(--green)'}}>4</div><div className="stat-lbl">skills rising</div></div>
        <div className="stat-cell"><div className="stat-num">3</div><div className="stat-lbl">quick wins</div></div>
        <div className="stat-cell"><div className="stat-num" style={{'color': 'var(--brand-700)'}}>12.7k+</div><div className="stat-lbl">jobs unlock</div></div>
      </div>

      <div className="mini-label" style={{'marginTop': '18px'}}>Sabse bada risk abhi</div>
      <div className="hub-link" onClick={() => {(window as any).applyTab('fixes') }} style={{'cursor': 'pointer'}}>
        <div className="hl-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
        <div className="hl-text"><div className="hl-title">4 JD keywords missing — sabse bada rejection risk</div><div className="hl-sub">Unlock to see exactly which ones</div></div>
        <svg className="hl-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>

      <div className="mini-label" style={{'marginTop': '16px'}}>Dekho</div>
      <div style={{'display': 'flex', 'flexDirection': 'column', 'gap': '8px'}}>
        <div className="hub-link" onClick={() => {(window as any).applyTab('fixes') }} style={{'cursor': 'pointer'}}>
          <div className="hl-icon">✍</div>
          <div className="hl-text"><div className="hl-title">Fixes</div><div className="hl-sub">Line-by-line rewrites, ATS risk, missing keywords</div></div>
          <svg className="hl-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div className="hub-link" onClick={() => {(window as any).applyTab('recruiter') }} style={{'cursor': 'pointer'}}>
          <div className="hl-icon">👁</div>
          <div className="hl-text"><div className="hl-title">Recruiter view</div><div className="hl-sub">6-sec scan, ownership language, likely interview Qs</div></div>
          <svg className="hl-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div className="hub-link" onClick={() => {(window as any).applyTab('skills') }} style={{'cursor': 'pointer'}}>
          <div className="hl-icon">📈</div>
          <div className="hl-text"><div className="hl-title">Skills & roadmap</div><div className="hl-sub">Drop, rising, salary, paths, quick wins</div></div>
          <svg className="hl-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </div>

    <div className="section locked-premium" id="secRecruiterScan" data-tab="recruiter">
      <div className="lock-badge"><div className="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div className="dark-card" style={{'background': 'linear-gradient(160deg, var(--brand-900) 0%, var(--brand-700) 100%)'}}>
        <div className="section-head">
          <div className="sec-icon" style={{'background': 'rgba(255,255,255,.12)', 'color': '#fff'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg></div>
          <div className="section-head-text"><h2>Recruiter's 6-second scan</h2><p>Yeh wahi verdict hai jo ek real recruiter 6 second me deta hai — resume properly padhne se pehle</p></div>
        </div>

        <div className="verdict-box">
          <div className="verdict-icon" style={{'background': 'var(--amber-tint)', 'color': 'var(--amber)'}}>⚠</div>
          <div><div style={{'fontWeight': '700', 'fontSize': '14px', 'color': '#fff'}}>Borderline — 6 me se 6 recruiter 6 sec ke baad skip kar sakte hain</div><div style={{'fontSize': '11.5px', 'color': 'rgba(255,255,255,.6)', 'marginTop': '2px'}}>Reason: pehli nazar me impact numbers nahi dikhte</div></div>
        </div>

        <div className="mini-label on-dark" style={{'marginTop': '16px'}}>👁 Nazar is order me jaati hai</div>
        <div style={{'display': 'flex', 'flexDirection': 'column', 'gap': '8px'}}>
          <div className="scan-row">1. Job title + company (top) — clear ✓</div>
          <div className="scan-row">2. Last role ka pehla bullet — "responsible for" se shuru hota hai, weak ⚠</div>
          <div className="scan-row">3. Numbers / impact — miss ho jaate hain, kahin highlight nahi ✗</div>
        </div>

        <div style={{'marginTop': '16px'}}>
          <div style={{'display': 'flex', 'justifyContent': 'space-between', 'fontSize': '12px', 'color': 'rgba(255,255,255,.75)', 'marginBottom': '5px'}}><span>Ownership language (drove, led, built)</span><b style={{'color': '#fff'}}>35%</b></div>
          <div className="bar-track"><div className="bar-fill" style={{'width': '35%', 'background': 'var(--amber)'}}></div></div>
          <div style={{'fontSize': '11px', 'color': 'rgba(255,255,255,.5)', 'marginTop': '4px'}}>7 me se sirf 2-3 bullets strong language use karte hain, baaki "responsible for / worked on" jaisa weak hai</div>
        </div>
        <div style={{'marginTop': '14px'}}>
          <div style={{'display': 'flex', 'justifyContent': 'space-between', 'fontSize': '12px', 'color': 'rgba(255,255,255,.75)', 'marginBottom': '5px'}}><span>Relevance to target role</span><b style={{'color': '#fff'}}>72%</b></div>
          <div className="bar-track"><div className="bar-fill" style={{'width': '72%', 'background': 'var(--green)'}}></div></div>
          <div style={{'fontSize': '11px', 'color': 'rgba(255,255,255,.5)', 'marginTop': '4px'}}>Baaki 28% content (purani internship, unrelated tools) filler lag raha hai</div>
        </div>
        <div style={{'marginTop': '14px'}}>
          <div style={{'display': 'flex', 'justifyContent': 'space-between', 'fontSize': '12px', 'color': 'rgba(255,255,255,.75)', 'marginBottom': '5px'}}><span>Career pattern</span><b style={{'color': '#fff'}}>Stable ✓</b></div>
          <div style={{'fontSize': '11px', 'color': 'rgba(255,255,255,.5)'}}>Average tenure 1.8 yrs, koi unexplained gap nahi — job-hopping red flag nahi hai</div>
        </div>
      </div>
    </div>

    <div className="section locked-premium" id="secAnalysis" data-tab="fixes">
      <div className="lock-badge"><div className="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div className="section-head">
        <div className="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div>
        <div className="section-head-text"><h2>Yeh mat likho, yeh likho</h2><p>Line-by-line fixes — wording aur structure, dono. Ye exact wahi cheezein hain jo abhi tumhara ATS score aur recruiter ka pehla impression, dono kaat rahi hain.</p></div>
      </div>
      <div id="fixList"></div>
    </div>

    <div className="section locked-premium" id="secJDMatch" data-tab="fixes">
      <div className="lock-badge"><div className="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div className="section-head">
        <div className="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
        <div className="section-head-text"><h2>JD match deep-dive</h2><p>Tumne jo job description upload ki, uske against exact match — generic nahi, isi job ke liye</p></div>
      </div>

      <div style={{'display': 'flex', 'alignItems': 'center', 'gap': '14px', 'background': 'var(--tint)', 'border': '1px solid var(--line)', 'borderRadius': '16px', 'padding': '14px', 'marginTop': '16px'}}>
        <div className="score-ring-sm"><svg viewBox="0 0 52 52"><circle className="trk" cx="26" cy="26" r="22"/><circle className="fil" cx="26" cy="26" r="22" strokeDasharray="138" strokeDashoffset="55" style={{'stroke': 'var(--amber)'}}/></svg><div className="score-num-sm">60%</div></div>
        <div style={{'fontSize': '12px', 'color': 'var(--ink-soft)', 'lineHeight': '1.5'}}><b style={{'color': 'var(--ink)'}}>18 of 30</b> JD keywords match. Baaki 12 missing — inhe (genuinely) add karne se match 85%+ ja sakta hai.</div>
      </div>

      <div style={{'marginTop': '16px'}}>
        <div className="mini-label">Missing keywords (add karo agar genuinely aata hai)</div>
          <div id="missingKeywordsContainer" style={{'display': 'flex', 'flexWrap': 'wrap', 'gap': '7px'}}>
            <span className="kw-chip miss">Figma Variables</span>
            <span className="kw-chip miss">Design Systems</span>
            <span className="kw-chip miss">A/B Testing</span>
            <span className="kw-chip miss">Accessibility (WCAG)</span>
          </div>
          <div style={{'display': 'flex', 'gap': '8px', 'marginTop': '12px'}}>
            <input type="text" id="newKeywordInput" placeholder="Add missing keyword..." style={{'flex': '1', 'padding': '8px 12px', 'borderRadius': '8px', 'border': '1px solid var(--line)', 'fontSize': '13px', 'outline': 'none'}} onKeyDown={(e) => { if(e.key === 'Enter') { const btn = document.getElementById('addKeywordBtn'); if(btn) btn.click(); } }} />
            <button id="addKeywordBtn" type="button" style={{'background': 'var(--brand-900)', 'color': '#fff', 'border': 'none', 'borderRadius': '8px', 'padding': '0 16px', 'fontSize': '13px', 'fontWeight': 'bold', 'cursor': 'pointer', 'display': 'flex', 'alignItems': 'center', 'gap': '4px'}} onClick={() => { const input = document.getElementById('newKeywordInput') as HTMLInputElement; if(input && input.value.trim()) { const container = document.getElementById('missingKeywordsContainer'); if(container) { const span = document.createElement('span'); span.className = 'kw-chip miss'; span.textContent = input.value.trim(); container.appendChild(span); input.value = ''; } } }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg> Add</button>
          </div>
      </div>

      <div style={{'marginTop': '16px'}}>
        <div className="mini-label">ATS parsing simulation — jo bot literally padh paata hai</div>
        <div style={{'display': 'flex', 'flexDirection': 'column', 'gap': '7px'}}>
          <div className="parse-row ok"><span>✓</span> Work experience, dates, job titles — clean parse</div>
          <div className="parse-row bad"><span>✗</span> Skills 2-column table me hain — ATS ignore kar deta hai, plain list me convert karo</div>
          <div className="parse-row bad"><span>✗</span> Contact info header/footer me hai — kai ATS parsers isko skip kar dete hain</div>
        </div>
      </div>

      <div style={{'marginTop': '16px'}}>
        <div className="mini-label">Quantification audit — number missing bullets</div>
        <div className="fix-card" style={{'marginTop': '0'}}>
          <span className="fix-tag">No impact number</span>
          <div className="fix-line fix-before">Improved onboarding flow for new users</div>
          <div className="fix-line fix-after">Redesigned onboarding flow, cutting drop-off from [X]% to [Y]%</div>
          <div className="fix-why">Bina number ke, recruiter impact ka andaza nahi laga paata — exact % add karo</div>
        </div>
        <div className="fix-card">
          <span className="fix-tag">No impact number</span>
          <div className="fix-line fix-before">Worked closely with engineering team on new features</div>
          <div className="fix-line fix-after">Partnered with a 4-person eng team to ship [X] features across [Y] sprints</div>
          <div className="fix-why">Team size / scope specify karo — "worked closely" kuch nahi batata</div>
        </div>
      </div>
    </div>

    <p className="sub-note" data-tab="skills" style={{'margin': '16px 16px 2px'}}>Yeh teen sections sirf <b>diagnosis</b> ke liye hain. Jo skill "+ Add to plan" karoge wo neeche "Choose your path" me syllabus ka hissa ban jaayegi — actual seekhna agle step, <b>Padhaao</b>, me hoga.</p>

    <div className="section locked-premium" id="secDrop" data-tab="skills">
      <div className="lock-badge"><div className="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div className="section-head">
        <div className="sec-icon warn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg></div>
        <div className="section-head-text"><h2>Skills to drop</h2><p>Not showing up in job listings anymore — hatao toh calls badhengi</p></div>
      </div>
      <div id="outdatedList"></div>
    </div>

    <div className="section locked-premium" data-tab="skills">
      <div className="lock-badge"><div className="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div className="section-head"><h2>Fading skills</h2><p>Abhi hai, par demand gir rahi hai</p></div>
      <div id="fadingList"></div>
    </div>

    

    

    <div className="section locked-premium" id="secATS" data-tab="fixes">
      <div className="lock-badge"><div className="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div className="fear-card">
        <div className="fear-eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>Reality check</div>
        <div className="fear-title">Human tumhara resume dekhta hi nahi — jab tak ATS pehle "haan" na bole</div>
        <div className="fear-body">Top product companies aur bade startups apna pehla shortlist ek software (ATS) se karte hain, human se nahi. Formatting ya keyword match weak hai toh resume seedha reject queue me chala jaata hai — kisi recruiter ne aankh tak nahi maari. Manual review sirf unhi resumes pe hota hai jo ye pehla filter paar kar lete hain.</div>
        <div className="fear-stat">Tumhara resume score abhi <b>64/100</b> hai — is range ke resumes ka bada hissa isi pehle filter par hi atak jaata hai, kaam ke skills hone ke baad bhi.</div>
        <div className="fear-gap-note">Career break liya hai? Wo tumhare against nahi jaata — jab tak resume usse clearly explain kare. ATS khaali employment gaps ko bhi flag karta hai, isliye "Yeh mat likho, yeh likho" section me ek exact example diya gaya hai gap explain karne ka.</div>
        <a className="fear-cta" href="#secAnalysis">Dekho exact fixes neeche ↓</a>
      </div>
    </div>

    

    

    

    

    <div className="section locked-premium" id="secNextSteps" data-tab="recruiter">
      <div className="lock-badge"><div className="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div className="section-head">
        <div className="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7Z"/></svg></div>
        <div className="section-head-text"><h2>What happens after you apply</h2><p>Is resume ke saath is exact JD pe apply karoge toh kya hoga — aur interview tak pahunche toh kya poocha jaayega</p></div>
      </div>

      <div style={{'background': 'var(--tint)', 'border': '1px solid var(--line)', 'borderRadius': '16px', 'padding': '14px', 'marginBottom': '14px'}}>
        <div className="mini-label" style={{'marginBottom': '10px'}}>Top 3 rejection reasons (agar reject hua toh)</div>
        <div style={{'display': 'flex', 'flexDirection': 'column', 'gap': '10px'}}>
          <div>
            <div style={{'display': 'flex', 'justifyContent': 'space-between', 'fontSize': '12.5px', 'marginBottom': '4px'}}><span>Missing keywords (Figma Variables, A/B Testing)</span><b style={{'color': 'var(--red)'}}>42%</b></div>
            <div className="bar-track light"><div className="bar-fill" style={{'width': '42%', 'background': 'var(--red)'}}></div></div>
          </div>
          <div>
            <div style={{'display': 'flex', 'justifyContent': 'space-between', 'fontSize': '12.5px', 'marginBottom': '4px'}}><span>No quantified impact in bullets</span><b style={{'color': 'var(--amber)'}}>33%</b></div>
            <div className="bar-track light"><div className="bar-fill" style={{'width': '33%', 'background': 'var(--amber)'}}></div></div>
          </div>
          <div>
            <div style={{'display': 'flex', 'justifyContent': 'space-between', 'fontSize': '12.5px', 'marginBottom': '4px'}}><span>ATS parsing issue (table format)</span><b style={{'color': 'var(--ink-soft)'}}>25%</b></div>
            <div className="bar-track light"><div className="bar-fill" style={{'width': '25%', 'background': 'var(--ink-soft)'}}></div></div>
          </div>
        </div>
      </div>

      <div className="mini-label">Interview me yeh 5 poocha jaayega (resume ke claims se)</div>
      <div className="skill-row"><div><div className="skill-name">"Improved onboarding flow" — exact numbers batao?</div><div className="skill-meta">Kyunki bullet me impact quantified nahi hai</div></div></div>
      <div className="skill-row"><div><div className="skill-name">Design system kaise maintain kiya, kitne components?</div><div className="skill-meta">JD me "Design Systems" explicitly maanga gaya hai</div></div></div>
      <div className="skill-row"><div><div className="skill-name">Kabhi A/B test run kiya? Result kya tha?</div><div className="skill-meta">Resume me mention nahi, par role ke liye critical hai</div></div></div>
      <div className="skill-row"><div><div className="skill-name">Eng team ke saath kaam karne ka process kya tha?</div><div className="skill-meta">"Worked closely with engineering" ka follow-up</div></div></div>
      <div className="skill-row" style={{'borderBottom': 'none'}}><div><div className="skill-name">1.8 yrs me role switch kyun kiya?</div><div className="skill-meta">Tenure pattern se predictable follow-up</div></div></div>
    </div>

    

    <div className="section locked-premium" id="secSalary" data-tab="skills">
      <div className="lock-badge"><div className="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div className="section-head">
        <div className="sec-icon" style={{'fontWeight': '800', 'fontSize': '15px'}}>₹</div>
        <div className="section-head-text"><h2>For a higher salary</h2><p>15 LPA+ ka filter — inn 3 cheezon ki wajah se hi shortlist rukti hai, baaki sab theek hone ke baad bhi</p></div>
      </div>
      <div id="salaryList"></div>
    </div>

<div className="section exp-hidden locked-premium" id="secLeadership" data-tab="skills">
      <div className="lock-badge"><div className="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div className="section-head">
        <div className="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <div className="section-head-text"><h2>Leadership signal check</h2><p>Senior ya leadership role target kar rahe ho? Ye 4 cheezein abhi resume me missing lag rahi hain</p></div>
      </div>
      <div className="leadership-list">
        <div className="lead-check-item"><span className="lci-icon">–</span><div><b>Team size</b> — "led a team of X engineers" jaisi line kahin nahi hai</div></div>
        <div className="lead-check-item"><span className="lci-icon">–</span><div><b>Mentoring</b> — juniors ko mentor karne ka koi mention nahi</div></div>
        <div className="lead-check-item"><span className="lci-icon">–</span><div><b>Business impact</b> — revenue, cost ya retention jaisa business-level number missing hai</div></div>
        <div className="lead-check-item"><span className="lci-icon">–</span><div><b>Architecture decisions</b> — system-level decisions ka ownership nahi likha</div></div>
      </div>
      <p className="leadership-note">Sirf senior/leadership-track ke liye relevant hai — isliye ye tabhi dikh raha hai jab "2+ yrs experience" selected ho. "Fresher / 0-1 yr" pe switch karoge toh ye section apne aap hide ho jaayega.</p>
    </div>

<div className="section flush" id="secWins" data-tab="skills">
      <div className="dark-card">
        <div className="section-head">
          <div className="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
          <div className="section-head-text"><h2 id="winsTitle">3 quick wins for the next 30 days</h2><p id="winsSub">Ek path select karo upar se — usi ke hisab se yahan exact 3 wins dikhengi</p></div>
        </div>
        <div className="wins-empty" id="winsEmpty">Abhi tak koi path select nahi kiya. <b>"Choose your path"</b> me se ek pe tap karo, iske 3 wins turant yahan aa jaayenge.</div>
        <div className="wins-fresher-note" id="winsFresherNote" hidden>Fresher ho? Inhe personal ya college project ke against likho, job experience ke against nahi.</div>
        <div id="winList"></div>
      </div>
    </div>

<div className="section" id="secDownload">
      <div className="section-head">
        <div className="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><path d="M12 15V3M12 15l-4-4M12 15l4-4"/><path d="M4 17v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg></div>
        <div className="section-head-text"><h2>Your rewritten, ATS-optimised resume</h2><p>Every fix above, already applied — download it and send it today</p></div>
      </div>
      <div className="locked-premium" style={{'marginTop': '14px'}}>
        <div className="lock-badge"><div className="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
        <div className="share-row-stack">
          <button className="share-btn full" id="downloadAtsBtn">⬇ Download ATS-friendly resume</button>
          <div className="share-row" style={{'marginTop': '10px'}}>
            <button className="share-btn" id="shareResumeBtn">↗ Share resume</button>
          </div>
        </div>
      </div>
      <button className="share-btn primary" style={{'width': '100%', 'marginTop': '10px'}} id="shareBtn">↗ Share score card</button>
    </div>

<div className="section locked-premium" id="secRising" data-tab="skills">
      <div className="lock-badge"><div className="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div className="section-head">
        <div className="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
        <div className="section-head-text"><h2>Skills on the rise</h2><p>Ab seekhoge toh 2 saal aage rahoge — inn hi skills ki wajah se naye job postings me salary range upar shift hui hai</p></div>
      </div>
      <div id="risingList"></div>
    </div>

<div className="section locked-premium" id="secRoadmap" data-tab="skills">
      <div className="lock-badge"><div className="lock-badge-inner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Unlocks with full report</div></div>
      <div className="section-head">
        <div className="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h6a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4H9"/></svg></div>
        <div className="section-head-text"><h2>Staying relevant through 2030</h2><p>Future-proof roadmap — har saal jo naya seekhna padega, taaki AI ya juniors overtake na kar paayein</p></div>
      </div>
      <div className="timeline" id="timelineList"></div>
    </div>

<div className="section" id="secPaths" style={{'marginBottom': '110px'}} data-tab="skills">
      <div className="section-head">
        <div className="sec-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg></div>
        <div className="section-head-text"><h2>Choose your path</h2><p>Jo select karoge, wahi tumhara syllabus banega</p></div>
      </div>
      <div id="pathList"></div>
    </div>

<div className="section" id="stepperNavSection" style={{'marginBottom': '132px'}}>
      <div className="stepper-nav">
        <div className="stepper-label">Step 1 of 5 — Batao: Resume Check</div>
        <div className="stepper-dots"><i className="active"></i><i></i><i></i><i></i><i></i></div>
      </div>
    </div>

    <div className="summary-bar" id="summaryBar" hidden>
      <p className="summary-text" id="summaryText"></p>
      <button className="cta" id="startBtn" style={{'marginTop': '0'}}>Next: Choose your plan →</button>
    </div>
  </section>

</div>
    </div>
  );
}
