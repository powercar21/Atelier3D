const TABS=[['home','Panou','📊','Panou de control','Imagine de ansamblu asupra atelierului'],['ord','Comenzi','📋','Comenzi','Comenzile clienților: noi, în lucru și finalizate'],['qc','Control calitate','🔍','Control calitate','Verifică piesele finalizate înainte de intrarea în stoc'],['stk','Stoc filament','🧵','Stoc filament','Verifică ce filamente sunt disponibile'],['fil','Filamente & stoc','🧵','Filamente & stoc','Catalog și nivelul stocului în timp real'],['in','Intrări','📥','Intrări filament','Achiziții și recepții de bobine'],['mat','Materiale','🎨','Materiale & componente','Vopsea, piese și componente: intrări pe factură și stoc'],['prod','Produse','🏷️','Produse','Denumire, gramaj, preț de vânzare și cost'],['mk','Producție','🏭','Producție','Cantități produse, filament și materiale consumate, cu PDF pentru contabilitate'],['sal','Vânzări','🛒','Vânzări','Figurinele vândute și stocul de produse finite'],['exp','Cheltuieli','💸','Cheltuieli','Costuri de funcționare ale atelierului'],['pf','Profit','📈','Profit & rezultate','Venituri, costuri și profit pe luni'],['usr','Cont','👤','Cont & utilizatori','Parola ta și conturile angajaților']];
const CATS=['Electricitate','Chirie','Întreținere / piese','Ambalaje','Transport / curier','Publicitate','Salarii','Altele'];
let S={fil:[],in:[],prod:[],mk:[],sal:[],exp:[],ord:[],mat:[],mi:[],set:[]},tab='home',msg='',cfgMsg='',ref=null,ready=false;
const $=s=>document.querySelector(s),uid=()=>Math.random().toString(36).slice(2,10);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toISOString().slice(0,10),n=v=>Math.round(v).toLocaleString('ro-RO'),L=v=>v.toLocaleString('ro-RO',{minimumFractionDigits:2,maximumFractionDigits:2})+' lei';
const sum=(a,f)=>a.reduce((x,r)=>x+f(r),0),fm=id=>S.fil.find(f=>f.id==id),pm=id=>S.prod.find(p=>p.id==id),pn=id=>(pm(id)||{name:'(șters)'}).name;
const fname=id=>{const f=fm(id);return f?`<span class="dot" style="background:${f.hex}"></span>${esc(f.brand)} ${esc(f.mat)} ${esc(f.color)}`:'(șters)'};
function stock(id){const i=sum(S.in.filter(r=>r.fil==id),r=>r.g),u=sum(S.mk.filter(r=>r.fil==id),r=>r.g);return{i,u,s:i-u}}
function cpg(id){const r=S.in.filter(x=>x.fil==id),g=sum(r,x=>x.g);return g>0&&sum(r,x=>x.q*x.p)>0?sum(r,x=>x.q*x.p)/g:((fm(id)||{}).pk||0)/1000}
const fq=v=>(Math.round(v*100)/100).toLocaleString('ro-RO'),mtm=id=>S.mat.find(m=>m.id==id),mname=id=>{const m=mtm(id);return m?esc(m.name):'(șters)'},mun=id=>(mtm(id)||{u:''}).u;
const mstk=id=>sum(S.mi.filter(r=>r.mat==id),r=>r.q)-sum(S.mk,r=>sum((r.mats||[]).filter(x=>x.mat==id),x=>x.q));
const mcpu=id=>{const r=S.mi.filter(x=>x.mat==id),q=sum(r,x=>x.q),t=sum(r,x=>x.tot);return q>0&&t>0?t/q:((mtm(id)||{}).pu||0)};
const mcost=r=>sum(r.mats||[],x=>x.q*(x.cu??mcpu(x.mat))),fcost=r=>r.g*(r.cp??cpg(r.fil)),nrOf=r=>r.nr||'PR-'+String(S.mk.indexOf(r)+1).padStart(4,'0');
const matOpts=()=>S.mat.map(m=>`<option value="${m.id}">${esc(m.name)} (${fq(mstk(m.id))} ${m.u})</option>`).join('');
function ucost(p){const r=S.mk.filter(x=>x.prod==p.id),q=sum(r,x=>x.q);return q?sum(r,x=>fcost(x)+mcost(x))/q:p.g*cpg(p.fil)+sum(p.bom||[],b=>b.q*mcpu(b.mat))}
const made=id=>sum(S.mk.filter(r=>r.prod==id),r=>r.q),sold=id=>sum(S.sal.filter(r=>r.prod==id),r=>r.q),avail=id=>made(id)-sold(id);
const rev=r=>r.q*r.pr,revTot=r=>r.q*r.pr+(r.liv||0),cogs=r=>r.q*(pm(r.prod)?ucost(pm(r.prod)):0);
const fplain=id=>{const f=fm(id);return f?`${f.brand} ${f.mat} ${f.color}`:'(șters)'};
const autoExp=()=>[...S.in.map(r=>({id:r.id,d:r.d,cat:'Intrare filament',desc:`${fplain(r.fil)} · ${r.q} bobine${r.sup?' · '+r.sup:''}`,a:r.q*r.p,auto:1})),...S.mi.map(r=>({id:r.id,d:r.d,cat:'Intrare materiale',desc:`${(mtm(r.mat)||{name:'(șters)'}).name} · ${fq(r.q)} ${mun(r.mat)}${r.inv?' · factura '+r.inv:''}${r.sup?' · '+r.sup:''}`,a:r.tot,auto:1}))];
const allExp=()=>[...S.exp,...autoExp()];
const stockVal=()=>sum(S.fil,f=>Math.max(0,stock(f.id).s)*cpg(f.id))+sum(S.mat,m=>Math.max(0,mstk(m.id))*mcpu(m.id));
const tot=()=>{const R=sum(S.sal,revTot),C=sum(S.sal,cogs),E1=sum(S.exp,r=>r.a),Ep=sum(autoExp(),r=>r.a),E=E1+Ep;return{R,C,E,E1,Ep,P:R-E}};
function months(k=6){const o=[],d=new Date();d.setDate(1);for(let i=0;i<k;i++){o.unshift(d.toISOString().slice(0,7));d.setMonth(d.getMonth()-1)}return o}
function mstat(m){const s=S.sal.filter(r=>r.d.startsWith(m)),R=sum(s,revTot),C=sum(s,cogs),E1=sum(S.exp.filter(r=>r.d.startsWith(m)),r=>r.a),Ep=sum(autoExp().filter(r=>r.d.startsWith(m)),r=>r.a),E=E1+Ep;return{m,R,C,E1,Ep,E,P:R-E}}
const CFG=window.APP_CONFIG||{};
let sb=null;try{if(CFG.SUPABASE_URL&&CFG.SUPABASE_ANON_KEY&&!/YOUR-PROJECT|YOUR_/.test(CFG.SUPABASE_URL+CFG.SUPABASE_ANON_KEY))sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY)}catch(e){console.error(e)}
const TB={fil:'fil',in:'receipts',prod:'prod',mk:'mk',sal:'sal',exp:'exp',ord:'ord',mat:'mat',mi:'mi',set:'settings'};
let U=[],cur=null,lerr='',fails=0,syncing=0,SYNC={},Q=Promise.resolve(),pend=new Set(),tmr=null,chan=null;
const ADM=()=>cur&&cur.role=='admin',RL={admin:'Administrator',op:'Operator',qc:'Control calitate'},can=k=>ADM()?k!='stk':cur&&cur.role=='qc'?k=='qc':['ord','stk'].includes(k);
const setSt_=t=>{const e=$('#st');if(e)e.textContent=t};
/* ---------- date: Supabase ---------- */
async function loadTable(k){const{data,error}=await sb.from(TB[k]).select('id,data').order('seq',{ascending:true});
 if(error){console.error(k,error);setSt_('⚠ eroare la încărcare');return false}
 const rows=(data||[]).map(r=>r.data),old=JSON.stringify(S[k]);S[k]=rows;SYNC[k]=new Map(rows.map(r=>[r.id,JSON.stringify(r)]));return old!==JSON.stringify(rows)}
async function loadAll(){let ch=false;for(const k in TB)ch=(await loadTable(k))||ch;return ch}
async function loadUsers(){const{data}=await sb.from('profiles').select('*').order('name');U=data||[]}
async function sync(){if(!cur||!sb)return;syncing++;
 try{for(const k in TB){const prev=SYNC[k]||new Map(),now=new Map(),ins=[],upd=[];
   for(const r of S[k]){const j=JSON.stringify(r);now.set(r.id,j);if(!prev.has(r.id))ins.push({id:r.id,data:r});else if(prev.get(r.id)!==j)upd.push(r)}
   const del=[...prev.keys()].filter(id=>!now.has(id));
   if(ins.length){const{error}=await sb.from(TB[k]).insert(ins);if(error)throw error}
   for(const r of upd){const{error}=await sb.from(TB[k]).update({data:r}).eq('id',r.id);if(error)throw error}
   if(del.length){const{error}=await sb.from(TB[k]).delete().in('id',del);if(error)throw error}
   SYNC[k]=now}
  setSt_('● salvat online')}
 catch(e){console.error(e);setSt_('⚠ eroare la salvare');alert('Nu s-a putut salva: '+(e.message||e)+'\nDatele au fost reîncărcate din baza de date.');await loadAll();render()}
 finally{syncing--}}
function save(){render();Q=Q.then(sync);return Q}
function saveOrd(){return save()}
function refresh(){if(syncing||!cur){tmr=setTimeout(refresh,500);return}const ks=[...pend];pend.clear();
 Promise.all(ks.map(loadTable)).then(r=>{if(r.some(Boolean))render()})}
function subscribe(){if(chan)return;chan=sb.channel('db').on('postgres_changes',{event:'*',schema:'public'},p=>{const k=Object.keys(TB).find(x=>TB[x]==p.table);if(k){pend.add(k);clearTimeout(tmr);tmr=setTimeout(refresh,400)}}).subscribe()}
/* ---------- autentificare ---------- */
async function enter(user){
 const{data:p}=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle();
 if(!p||p.role=='none'){lerr='Contul nu are drepturi de acces. Contactează administratorul.';await sb.auth.signOut();cur=null;ready=true;return render()}
 cur={id:user.id,name:p.name||user.email,role:p.role,email:user.email};
 await loadAll();if(ADM())await loadUsers();subscribe();ready=true;setSt_('● salvat online');render()}
async function boot(){
 if(!sb){lerr='Configurare lipsă: completează SUPABASE_URL și SUPABASE_ANON_KEY în fișierul config.js.';ready=true;return render()}
 try{const{data:{session}}=await sb.auth.getSession();if(session)return await enter(session.user)}catch(e){console.error(e)}
 ready=true;render()}
async function logout(){try{await sb.auth.signOut();sb.removeAllChannels()}catch(e){}
 chan=null;cur=null;U=[];for(const k in TB)S[k]=[];SYNC={};tab='home';msg='';lerr='';render()}
async function doLogin(e){const d=fd(e);lerr='';
 if(fails)await new Promise(r=>setTimeout(r,Math.min(fails,5)*800));
 const{data,error}=await sb.auth.signInWithPassword({email:d.un.trim(),password:d.pw});
 if(error){fails++;lerr='Email sau parolă incorecte.';return render()}
 fails=0;tab='home';await enter(data.user)}
async function doPw(e){const d=fd(e);
 const r1=await sb.auth.signInWithPassword({email:cur.email,password:d.o});if(r1.error){msg='Parola actuală este greșită.';return render()}
 const r2=await sb.auth.updateUser({password:d.p});msg=r2.error?'Eroare: '+r2.error.message:'✓ Parola a fost schimbată.';render()}
async function api(method,body){const{data:{session}}=await sb.auth.getSession();
 const r=await fetch('/api/users',{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify(body)});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Eroare '+r.status);return j}
async function addUser(e){const d=fd(e);try{await api('POST',{email:d.un.trim(),name:d.name.trim(),password:d.pw,role:d.role});await loadUsers();render()}catch(x){alert(x.message)}}
async function resetPw(id){const p=prompt('Parola nouă (min. 6 caractere):');if(!p||p.length<6){if(p!==null)alert('Parola este prea scurtă.');return}
 try{await api('PATCH',{id,password:p});alert('Parola a fost resetată.')}catch(x){alert(x.message)}}
async function delUser(id){if(!confirm('Ștergi acest utilizator?'))return;try{await api('DELETE',{id});await loadUsers();render()}catch(x){alert(x.message)}}
function imp(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);
 if(!confirm('Importul ÎNLOCUIEȘTE toate datele curente cu cele din fișier. Continui?'))return;
 for(const k in TB)S[k]=Array.isArray(j[k])?j[k]:[];save()}catch(e){alert('Fișier invalid.')}};r.readAsText(f);inp.value=''}
const meView=()=>`<div class="av">${esc(cur.name.trim().slice(0,1).toUpperCase())}</div><div><b>${esc(cur.name)}</b><small>${RL[cur.role]}</small></div><button title="Deconectare" onclick="logout()">⎋</button>`;
function loginView(){return`<div class="lg1"><div class="lbrand"><div class="brand"><div class="logo">🖨️</div><div><b>Atelier 3D</b><span>Portal de lucru</span></div></div>
<div><h1>Tot atelierul tău, într-un singur loc.</h1><p>Filament, producție, vânzări și profit — simplu, clar și mereu la zi.</p><ul><li><i>🧵</i>Stoc de filament în timp real</li><li><i>🏭</i>Producție și consum exact</li><li><i>📈</i>Vânzări, cheltuieli și profit</li></ul></div><span style="opacity:.6;font-size:12px">© Atelier 3D</span></div>
<div class="lbox"><div class="lcard"><h2>Bine ai revenit 👋</h2><p>Autentifică-te pentru a accesa portalul.</p>
<form onsubmit="doLogin(event)"><label>Email<input type="email" name="un" required autocapitalize="off" autocomplete="username"></label>
<label>Parolă<input type="password" name="pw" required autocomplete="current-password"></label>
${lerr?`<div class="lerr">${lerr}</div>`:''}<button class="btn">Conectare</button></form>
<div class="ln">Ai uitat parola? Cere administratorului să ți-o reseteze.</div></div></div></div>`}

function render(){document.body.classList.remove('m');document.body.classList.toggle('lo',!cur);if(!cur){$('#login').innerHTML=ready?loginView():'';return}if(!can(tab))tab=ADM()?'home':cur.role=='qc'?'qc':'ord';$('#me').innerHTML=meView();
  $('#nav').innerHTML=TABS.filter(x=>can(x[0])).map(([k,l,i])=>`<button class="${k==tab?'on':''}" onclick="tab='${k}';msg='';render();scrollTo(0,0)">${i} ${l}</button>`).join('');
  const T=TABS.find(x=>x[0]==tab);$('#ph').innerHTML=`<h1>${T[3]}</h1><p>${T[4]}</p>`;$('#app').innerHTML=ready?views[tab]():''}
const filOpts=()=>S.fil.map(f=>`<option value="${f.id}">${esc(f.brand)} ${esc(f.mat)} ${esc(f.color)} (${n(stock(f.id).s)} g)</option>`).join('');
const need=(ok,t)=>ok?'':`<div class="e">${t}</div>`;
const del_=(k,id)=>`<button class="x" onclick="del('${k}','${id}')">✕</button>`;
const kpi=(i,b,s,c='')=>`<div class="${c}"><em>${i}</em><b>${b}</b><span>${s}</span></div>`;
const pc=v=>`<b class="${v<0?'no':'ok'}">${L(v)}</b>`;
const fstat=(p,q)=>{const f=fm(p.fil),s=stock(p.fil).s,need=q*p.g,c=s>=need?['ok','✓ În stoc']:s>0?['lo','⚠ Insuficient']:['no','✗ Epuizat'];
 return`<div class="om">${fname(f.id)}<br><span class="pill ${c[0]}" style="margin-top:6px">${c[1]} · ${n(Math.max(s,0))} g disponibil</span></div>`};
const views={
home(){const t=tot(),low=S.fil.filter(f=>stock(f.id).s<=f.min),lowM=S.mat.filter(m=>mstk(m.id)<=m.min),mo=today().slice(0,7),mk=S.mk.filter(r=>r.d.startsWith(mo)),ms=mstat(mo);
 return`<div class="kpi">${ADM()?kpi('💰',L(t.P),'Profit total','pr'):''}${kpi('🛒',L(ms.R),'Vânzări luna aceasta')}${kpi('🧵',(Math.round(sum(S.fil,f=>stock(f.id).s)/100)/10).toLocaleString('ro-RO')+' kg','Stoc filament')}${kpi('📦',sum(S.prod,p=>avail(p.id))+' buc','Produse finite în stoc')}${kpi('🏭',sum(mk,r=>r.q)+' buc','Produse luna aceasta ('+n(sum(mk,r=>r.g))+' g)')}${kpi('📋',S.ord.filter(o=>o.st!='done').length,'Comenzi active')}${kpi('🔍',S.ord.filter(o=>o.st=='qc').length,'La control calitate')}${kpi('⚠️',low.length,'Filamente sub minim')}</div>
 <div class="g2"><div class="card"><h2>Stoc redus</h2>${lowM.map(m=>`<div class="row"><span>🎨 ${esc(m.name)}</span><b class="${mstk(m.id)<=0?'no':'lo'}">${fq(mstk(m.id))} ${m.u}</b></div>`).join('')}${low.length?low.map(f=>`<div class="row"><span>${fname(f.id)}</span><b class="${stock(f.id).s<=0?'no':'lo'}">${n(stock(f.id).s)} g</b></div>`).join(''):(lowM.length?'':'<span class="ok"><b>Totul este în regulă ✓</b></span>')}</div>
 <div class="card"><h2>Ultimele vânzări</h2>${tbl(['Data','Produs','Cant.','Total'],S.sal.slice(-5).reverse().map(r=>[r.d,esc(pn(r.prod)),r.q,L(revTot(r))]))}</div></div>
 <div class="card"><h2>Ultimele producții</h2>${tbl(['Data','Produs','Cant.','Filament','Consum'],S.mk.slice(-5).reverse().map(r=>[r.d,esc(pn(r.prod)),r.q,fname(r.fil),n(r.g)+' g']))}</div>
 <button class="btn ghost" onclick="exp_()">⬇ Descarcă copie de siguranță</button> <label class="btn ghost" style="display:inline-grid;place-items:center;cursor:pointer">⬆ Importă copie<input type="file" accept=".json,application/json" hidden onchange="imp(this)"></label>`},
fil(){return`<div class="card"><h2>Adaugă filament în catalog</h2><form onsubmit="addFil(event)">
 <label>Producător<input name="brand" required placeholder="ex. Bambu"></label><label>Material<input name="mat" required placeholder="PLA, PETG…"></label>
 <label>Culoare<input name="color" required placeholder="Negru"></label><label>Nuanță<input type="color" name="hex" value="#222222"></label>
 <label>Preț / kg (lei)<input type="number" step="0.01" min="0" name="pk" value="0"></label><label>Stoc minim (g)<input type="number" min="0" name="min" value="1000"></label>
 <button class="btn">Adaugă</button></form></div>
 <div class="card"><h2>Gestiune stoc</h2><div class="tw">${tbl(['Filament','Intrat','Consumat','Stoc','Nivel','Cost / kg',''],S.fil.map(f=>{const s=stock(f.id),p=s.i?Math.max(0,Math.min(100,s.s/s.i*100)):0,c=s.s<=0?'var(--d)':s.s<=f.min?'var(--w)':'var(--ok)';
 return[fname(f.id),n(s.i)+' g',n(s.u)+' g',`<span class="pill ${s.s<=0?'no':s.s<=f.min?'lo':'ok'}">${n(s.s)} g</span>`,`<div class="bar"><i style="width:${p}%;background:${c}"></i></div>`,L(cpg(f.id)*1000),del_('fil',f.id)]}))}</div></div>`},
in(){return`<div class="card"><h2>Înregistrează intrare filament</h2>${need(S.fil.length,'Adaugă mai întâi un filament în catalog.')}<form onsubmit="addIn(event)">
 <label>Data<input type="date" name="d" value="${today()}" required></label><label>Filament<select name="fil" required>${filOpts()}</select></label>
 <label>Nr. bobine<input type="number" name="q" min="1" value="1" required></label><label>g / bobină<input type="number" name="w" min="1" value="1000" required></label>
 <label>Preț / bobină (lei)<input type="number" step="0.01" min="0" name="p" value="0"></label><label>Furnizor / factură<input name="sup"></label><button class="btn">Adaugă intrare</button></form></div>
 <div class="card"><h2>Istoric intrări</h2><div class="tw">${tbl(['Data','Filament','Bobine','Total','Preț/bob.','Furnizor',''],S.in.slice().reverse().map(r=>[r.d,fname(r.fil),r.q+' × '+n(r.w)+' g',n(r.g)+' g',L(r.p),esc(r.sup||'-'),del_('in',r.id)]))}</div></div>`},
mat(){const MC=['Vopsea','Piesă','Componentă','Consumabil','Altele'];return`<div class="kpi">${kpi('🎨',S.mat.length,'Materiale în catalog')}${kpi('⚠️',S.mat.filter(m=>mstk(m.id)<=m.min).length,'Sub stocul minim')}${kpi('💰',L(sum(S.mat,m=>Math.max(0,mstk(m.id))*mcpu(m.id))),'Valoare stoc materiale')}</div>
<div class="g2"><div class="card"><h2>Material nou <small>vopsea, piese, componente</small></h2><form onsubmit="addMat(event)"><label>Denumire<input name="name" required placeholder="ex. Vopsea acrilică roșie"></label><label>Categorie<select name="cat">${MC.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Unitate de măsură<select name="u"><option>buc</option><option>ml</option><option>l</option><option>g</option><option>kg</option><option>m</option></select></label><label>Stoc minim<input type="number" step="any" min="0" name="min" value="0"></label><button class="btn">Adaugă</button></form></div>
<div class="card"><h2>Intrare pe factură</h2>${need(S.mat.length,'Adaugă mai întâi un material.')}<form onsubmit="addMi(event)"><label>Data<input type="date" name="d" value="${today()}" required></label><label>Material<select name="mat" required>${matOpts()}</select></label><label>Cantitate<input type="number" step="any" min="0.001" name="q" required></label><label>Valoare totală (lei)<input type="number" step="0.01" min="0" name="tot" required></label><label>Nr. factură<input name="inv"></label><label>Furnizor<input name="sup"></label><button class="btn">Adaugă intrare</button></form></div></div>
<div class="card"><h2>Stoc materiale</h2><div class="tw">${tbl(['Material','Categorie','Intrat','Consumat','Stoc','Cost / UM','Valoare',''],S.mat.map(m=>{const i=sum(S.mi.filter(r=>r.mat==m.id),r=>r.q),k=mstk(m.id);return[esc(m.name),m.cat,fq(i)+' '+m.u,fq(i-k)+' '+m.u,`<span class="pill ${k<=0?'no':k<=m.min?'lo':'ok'}">${fq(k)} ${m.u}</span>`,L(mcpu(m.id)),L(Math.max(0,k)*mcpu(m.id)),del_('mat',m.id)]}))}</div></div>
<div class="card"><h2>Istoric intrări materiale</h2><div class="tw">${tbl(['Data','Material','Cantitate','Valoare','Preț / UM','Factură','Furnizor',''],S.mi.slice().reverse().map(r=>[r.d,mname(r.mat),fq(r.q)+' '+mun(r.mat),L(r.tot),L(r.tot/r.q),esc(r.inv||'-'),esc(r.sup||'-'),del_('mi',r.id)]))}</div></div>`},
prod(){return`<div class="card"><h2>Produs nou</h2><form onsubmit="addProd(event)">
 <label>Denumire produs<input name="name" required></label><label>Gramaj / bucată (g)<input type="number" step="0.1" min="0.1" name="g" required></label>
 <label>Preț de vânzare (lei)<input type="number" step="0.01" min="0" name="pr" value="0"></label><label>Filament implicit<select name="fil"><option value="">—</option>${filOpts()}</select></label>
 <button class="btn">Adaugă produs</button></form></div>
 <div class="card"><h2>Produse</h2><div class="tw">${tbl(['Produs','Gramaj','Preț vânzare','Cost producție','Marjă / buc','Produse','Vândute','În stoc',''],S.prod.map(p=>{const c=ucost(p);return[esc(p.name),p.g+' g',L(p.pr||0),L(c),pc((p.pr||0)-c),made(p.id),sold(p.id),`<b>${avail(p.id)}</b>`,del_('prod',p.id)]}))}</div></div>
 <div class="card"><h2>Rețetă: materiale per bucată <small>vopsea, piese, componente</small></h2>${need(S.prod.length&&S.mat.length,'Adaugă produse și materiale.')}<form onsubmit="addBom(event)"><label>Produs<select name="prod">${S.prod.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label><label>Material<select name="mat">${matOpts()}</select></label><label>Cantitate / bucată<input type="number" step="any" min="0.001" name="q" required></label><button class="btn">Adaugă în rețetă</button></form>
 <div class="tw">${tbl(['Produs','Material','Cantitate / buc',''],S.prod.flatMap(p=>(p.bom||[]).map(b=>[esc(p.name),mname(b.mat),fq(b.q)+' '+mun(b.mat),`<button class="x" onclick="delBom('${p.id}','${b.mat}')">✕</button>`])))}</div></div>`},

mk(){return`<div class="card"><h2>Înregistrează producție</h2>${need(S.prod.length&&S.fil.length,'Ai nevoie de cel puțin un produs și un filament.')}<form onsubmit="addMk(event)">
 <label>Data<input type="date" name="d" value="${today()}" required></label>
 <label>Produs<select name="prod" required onchange="this.form.fil.value=(pm(this.value)||{}).fil||this.form.fil.value;upBom(this.form)">${S.prod.map(p=>`<option value="${p.id}">${esc(p.name)} (${p.g} g)</option>`).join('')}</select></label>
 <label>Cantitate (buc)<input type="number" name="q" min="1" value="1" required oninput="upBom(this.form)"></label><label>Filament folosit<select name="fil" required>${filOpts()}</select></label>
 <label>Gramaj extra / suport (g)<input type="number" step="0.1" min="0" name="x" value="0"></label><div id="bomBox" style="grid-column:1/-1">${bomBox(S.prod[0]&&S.prod[0].id,1)}</div><button class="btn">Înregistrează</button></form><div class="msg">${msg}</div></div>
 <div class="card"><h2>Istoric producție</h2><div class="tw">${tbl(['Nr.','Data','Produs','Cant.','Filament','Consum','Materiale','Cost','PDF',''],S.mk.slice().reverse().map(r=>[nrOf(r)+(r.qc?' ✓ QC':''),r.d,esc(pn(r.prod)),r.q,fname(r.fil),n(r.g)+' g',(r.mats||[]).length?r.mats.map(m=>mname(m.mat)).join(', '):'-',L(fcost(r)+mcost(r)),`<button class="btn ghost" style="height:34px;padding:0 12px" onclick="pdfMk('${r.id}')">📄 PDF</button>`,del_('mk',r.id)]))}</div></div>`},
sal(){const t=tot();return`<div class="kpi">${kpi('🛒',sum(S.sal,r=>r.q)+' buc','Total vândute')}${kpi('💵',L(t.R),'Venituri totale')}${kpi('🚚',L(sum(S.sal,r=>r.liv||0)),'Livrări încasate')}${kpi('📦',sum(S.prod,p=>avail(p.id))+' buc','Produse finite în stoc')}</div>
 <div class="card"><h2>Înregistrează vânzare</h2>${need(S.prod.length,'Adaugă mai întâi produse.')}<form onsubmit="addSal(event)">
 <label>Data<input type="date" name="d" value="${today()}" required></label>
 <label>Produs<select name="prod" required onchange="this.form.pr.value=(pm(this.value)||{}).pr||0">${S.prod.map(p=>`<option value="${p.id}">${esc(p.name)} (în stoc: ${avail(p.id)})</option>`).join('')}</select></label>
 <label>Cantitate<input type="number" name="q" min="1" value="1" required></label><label>Preț / buc (lei)<input type="number" step="0.01" min="0" name="pr" value="${S.prod[0]?S.prod[0].pr||0:0}" required></label>
 <label>Client / canal<input name="cl" placeholder="ex. OLX, târg, client"></label>
 <label>Metodă de plată<select name="pay" required><option value="">— alege —</option><option value="paynet">Paynet online</option><option value="pos">Card la terminal POS</option><option value="cash">Numerar</option></select></label>
 <label class="chk" style="height:44px"><input type="checkbox" name="liv_on" onchange="togLiv(this)">Livrare necesară</label><label id="livBox" style="display:none">Preț livrare (lei)<input type="number" step="0.01" min="0" name="liv" value="0"></label>
 <button class="btn">Înregistrează</button></form><div class="msg">${msg}</div></div>
 ${rptCard()}${payCard()}
 <div class="card"><h2>Istoric vânzări</h2><div class="tw">${tbl(['Data','Produs','Cant.','Preț/buc','Livrare','Total','Plată','Profit brut','Client',''],S.sal.slice().reverse().map(r=>[r.d,esc(pn(r.prod)),r.q,L(r.pr),r.liv?L(r.liv):'-',L(revTot(r)),r.pay?`<span class="pill pp">${PAY[r.pay]||esc(r.pay)}</span>`:'-',pc(rev(r)-cogs(r)),esc(r.cl||'-'),del_('sal',r.id)]))}</div></div>`},
exp(){const mo=today().slice(0,7);return`<div class="kpi">${kpi('💸',L(tot().E),'Cheltuieli totale (inclusiv intrări)')}${kpi('📥',L(tot().Ep),'din care intrări filament + materiale')}${kpi('📅',L(mstat(mo).E),'Cheltuieli luna aceasta')}</div>
 <div class="card"><h2>Adaugă cheltuială <small>intrările de filament și materiale se adaugă automat</small></h2><form onsubmit="addExp(event)">
 <label>Data<input type="date" name="d" value="${today()}" required></label><label>Categorie<select name="cat">${CATS.map(c=>`<option>${c}</option>`).join('')}</select></label>
 <label>Descriere<input name="desc"></label><label>Sumă (lei)<input type="number" step="0.01" min="0" name="a" required></label><button class="btn">Adaugă</button></form></div>
 <div class="card"><h2>Istoric cheltuieli</h2><div class="tw">${tbl(['Data','Categorie','Descriere','Sumă',''],allExp().sort((a,b)=>b.d.localeCompare(a.d)).map(r=>[r.d,r.auto?`<span class="pill ok">${r.cat}</span>`:r.cat,esc(r.desc||'-'),L(r.a),r.auto?'<small style="color:var(--m)">automat</small>':del_('exp',r.id)]))}</div></div>`},
pf(){const t=tot(),M=months().map(mstat),mx=Math.max(1,...M.flatMap(x=>[x.R,Math.abs(x.P)])),h=v=>Math.round(Math.abs(v)/mx*120);
 const by={};allExp().forEach(r=>by[r.cat]=(by[r.cat]||0)+r.a);
 return`<div class="kpi">${kpi('💰',L(t.P),'Profit net total','pr')}${kpi('💵',L(t.R),'Venituri')}${kpi('📥',L(t.Ep),'Intrări (filament + materiale)')}${kpi('💸',L(t.E1),'Alte cheltuieli')}${kpi('📦',L(stockVal()),'Valoare stoc rămas')}${kpi('📊',(t.R?Math.round(t.P/t.R*100):0)+' %','Marjă de profit')}</div>
 <div class="card"><h2>Ultimele 6 luni</h2><div class="ch">${M.map(x=>`<div><div class="bs"><i style="height:${h(x.R)}px;background:var(--a)"></i><i style="height:${h(x.P)}px;background:${x.P<0?'var(--d)':'var(--a2)'}"></i></div><small>${x.m.slice(5)}/${x.m.slice(2,4)}</small></div>`).join('')}</div>
 <div class="lg"><span><s style="background:var(--a)"></s>Venituri</span><span><s style="background:var(--a2)"></s>Profit</span></div></div>
 <div class="g2"><div class="card"><h2>Detaliu pe luni</h2><div class="tw">${tbl(['Luna','Venituri','Intrări','Alte cheltuieli','Profit'],M.slice().reverse().map(x=>[x.m,L(x.R),L(x.Ep),L(x.E1),pc(x.P)]))}</div></div>
 <div class="card"><h2>Cheltuieli pe categorii</h2>${Object.keys(by).length?Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="row"><span>${k}</span><b>${L(v)}</b></div>`).join(''):'<div class="e">Nicio cheltuială.</div>'}</div></div>
 <div class="card"><h2>Profit pe produs</h2><div class="tw">${tbl(['Produs','Vândute','Venituri','Cost producție','Profit brut'],S.prod.map(p=>{const s=S.sal.filter(r=>r.prod==p.id);return[esc(p.name),sum(s,r=>r.q),L(sum(s,rev)),L(sum(s,cogs)),pc(sum(s,rev)-sum(s,cogs))]}))}</div>
 <p class="e">Venituri includ și livrările încasate (tabelul pe produse arată doar valoarea produselor). Profit = venituri − toate cheltuielile, inclusiv intrările de filament și materiale, în luna în care au fost făcute. Valoarea stocului rămas nu se scade. „Profit brut” pe produs = venituri − costul de producție al pieselor vândute.</p></div>`},
stk(){const l=S.fil.slice().sort((a,b)=>(a.mat+a.color).localeCompare(b.mat+b.color));
 return l.length?`<div class="fg">${l.map(f=>{const x=stock(f.id),s=x.s,c=s<=0?['no','Epuizat']:s<=f.min?['lo','Stoc redus']:['ok','În stoc'],p=x.i?Math.max(0,Math.min(100,s/x.i*100)):0;
 return`<div class="fc"><div class="sw" style="background:${f.hex}"></div><b>${esc(f.color)}</b><small>${esc(f.brand)} · ${esc(f.mat)}</small><div class="big">${n(Math.max(s,0))} g</div><span class="pill ${c[0]}">${c[1]}</span><div class="bar"><i style="width:${p}%;background:var(--${c[0]=='ok'?'ok':c[0]=='lo'?'w':'d'})"></i></div></div>`}).join('')}</div>`:'<div class="card e">Niciun filament în catalog.</div>'},
qc(){const w=S.ord.filter(o=>o.st=='qc').sort((a,b)=>(a.sentAt||'').localeCompare(b.sentAt||'')),mo=today().slice(0,7),dn=S.ord.filter(o=>o.qc&&o.qc.d.startsWith(mo));
 const card=o=>{const p=pm(o.prod),f=p&&fm(p.fil),bom=(p&&p.bom)||[];return`<div class="fc"><b style="font-size:16px">${o.q} × ${esc(p?p.name:'(produs șters)')}</b><small>${o.client?esc(o.client)+' · ':''}comanda din ${o.d}</small>
 <div class="om">Trimisă de ${esc(o.sentBy||'-')} · ${o.sentAt||''}</div>${o.note?`<div class="on">${esc(o.note)}</div>`:''}
 <div class="om">La aprobare se scad din stoc:<br>🧵 ${f?fname(f.id)+' – '+n(o.q*p.g)+' g':'<b class="no">Setează filamentul implicit al produsului!</b>'}${bom.map(b=>`<br>🎨 ${mname(b.mat)} – ${fq(b.q*o.q)} ${mun(b.mat)}`).join('')}</div>
 <label style="margin-top:12px">Bucăți conforme (din ${o.q})<input type="number" id="qa_${o.id}" min="0" max="${o.q}" value="${o.q}"></label>
 <label style="margin-top:8px">Observații<input id="qn_${o.id}" placeholder="obligatoriu la respingere / rebuturi"></label>
 <div class="oa"><button class="btn" style="background:var(--ok)" onclick="approveQc('${o.id}')">✓ Aprobă</button><button class="btn" style="background:var(--d)" onclick="rejectQc('${o.id}')">✗ Respinge</button></div></div>`};
 return`<div class="kpi">${kpi('🔍',w.length,'Așteaptă controlul','pr')}${kpi('✅',dn.length,'Comenzi aprobate luna aceasta')}${kpi('♻️',sum(dn,o=>o.q-o.qc.ok),'Rebuturi luna aceasta (buc)')}</div>
 ${w.length?`<div class="fg" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${w.map(card).join('')}</div>`:'<div class="card e">Nicio comandă nu așteaptă controlul de calitate. ✓</div>'}
 <div class="card" style="margin-top:20px"><h2>Ultimele verificări</h2><div class="tw">${tbl(['Data','Client','Produs','Conforme','Rebuturi','Verificat de','Observații','Doc.'],S.ord.filter(o=>o.qc).sort((a,b)=>b.qc.d.localeCompare(a.qc.d)).slice(0,10).map(o=>{const r=S.mk.find(x=>x.id==o.mk);return[o.qc.d,esc(o.client||'-'),esc(pn(o.prod)),o.qc.ok,o.q-o.qc.ok,esc(o.qc.by),esc(o.qc.note||'-'),r?nrOf(r):'-']}))}</div></div>`},
ord(){const ST={new:['Noi','#e8912c'],wip:['În lucru','#0f9d8a'],qc:['La control calitate','#8b5cf6'],done:['Finalizate','#14a06a']};
 const list=S.ord.slice().sort((a,b)=>(a.pri=='u'?0:1)-(b.pri=='u'?0:1)||(a.due||'9').localeCompare(b.due||'9'));
 const card=o=>{const p=pm(o.prod),ov=o.st!='done'&&o.due&&o.due<today();
  const a=o.st=='new'?`<button class="btn" onclick="setSt('${o.id}','wip')">▶ Începe</button>`:o.st=='wip'?`<button class="btn" onclick="setSt('${o.id}','qc')">🔍 Trimite la calitate</button><button class="btn ghost" onclick="setSt('${o.id}','new')">↩</button>`:o.st=='qc'?'<span class="pill" style="background:rgba(139,92,246,.15);color:#8b5cf6">⏳ Așteaptă controlul</span>':(o.mk&&o.qc?`<span class="pill ok">✓ În stoc: ${o.qc.ok} buc</span>`:`<button class="btn ghost" onclick="setSt('${o.id}','wip')">↩ Redeschide</button>`);
  return`<div class="oc ${o.pri=='u'?'urg':''}"><div class="oh"><b>${o.q} × ${esc(p?p.name:'(produs șters)')}</b>${o.pri=='u'?'<span class="pill no">Urgent</span>':''}</div>
  ${o.client?`<div class="om">👤 ${esc(o.client)}</div>`:''}<div class="om ${ov?'no':''}">📅 ${o.due||'fără termen'}${ov?' · întârziată':''}${o.doneAt?' · finalizată '+o.doneAt:''}</div>
  ${p?`<div class="om">🧵 ~${n(o.q*p.g)} g filament</div>`:''}${o.st!='done'&&p&&fm(p.fil)?fstat(p,o.q):''}${o.note?`<div class="on">${esc(o.note)}</div>`:''}
  ${o.rej&&o.st=='wip'?`<div class="on" style="color:var(--d)">✗ Respinsă la calitate (${esc(o.rej.by)}): ${esc(o.rej.reason)}</div>`:''}${o.qc?`<div class="om">✅ Control: ${esc(o.qc.by)} · ${o.qc.ok}/${o.q} conforme</div>`:''}<div class="oa">${a}${ADM()?`<button class="x" onclick="delOrd('${o.id}')">✕</button>`:''}</div></div>`};
 const col=k=>{let l=list.filter(o=>o.st==k);const c=l.length;if(k=='done')l=l.sort((a,b)=>(b.doneAt||'').localeCompare(a.doneAt||'')).slice(0,10);
  return`<div class="kc" style="--c2:${ST[k][1]}"><h3>${ST[k][0]}<span>${c}</span></h3>${l.map(card).join('')||'<div class="e">Nicio comandă.</div>'}</div>`};
 const f=ADM()?`<div class="card"><h2>Comandă nouă</h2><form onsubmit="addOrd(event)">
 <label>Client<input name="client" required></label><label>Produs<select name="prod" required onchange="togNew(this)">${S.prod.map(p=>`<option value="${p.id}">${esc(p.name)} (${p.g} g)</option>`).join('')}<option value="__new"${S.prod.length?'':' selected'}>➕ Produs nou (nu este în Produse)</option></select></label>
 <label>Cantitate<input type="number" name="q" min="1" value="1" required></label><label>Termen<input type="date" name="due"></label>
 <label>Prioritate<select name="pri"><option value="n">Normală</option><option value="u">Urgentă</option></select></label><label>Observații<input name="note" placeholder="culoare, detalii…"></label>
 <div id="newProd" class="bb" style="grid-column:1/-1" ${S.prod.length?'hidden':''}><b>Produs nou – se înregistrează automat în Produse</b>
 <div class="bl2"><label>Denumire produs<input name="pname" ${S.prod.length?'':'required'}></label><label>Gramaj / bucată (g)<input type="number" step="0.1" min="0.1" name="pg" ${S.prod.length?'':'required'}></label><label>Filament folosit<select name="pfil" ${S.prod.length?'':'required'}><option value="">— alege —</option>${filOpts()}</select></label><label>Preț vânzare (lei)<input type="number" step="0.01" min="0" name="ppr" value="0"></label></div>
 ${S.fil.length?'':'<div class="om no">Adaugă mai întâi un filament în catalog.</div>'}</div>
 <button class="btn">Adaugă comanda</button></form></div>`:'';
 return f+`<div class="kb">${['new','wip','qc','done'].map(col).join('')}</div>`},
usr(){return`<div class="card"><h2>Contul meu</h2><form onsubmit="doPw(event)"><label>Parola actuală<input type="password" name="o" required autocomplete="current-password"></label><label>Parola nouă (min. 6)<input type="password" name="p" minlength="6" required autocomplete="new-password"></label><button class="btn">Schimbă parola</button></form><div class="msg">${msg}</div></div>`+(ADM()?`<div class="card"><h2>Setări companie <small>apare pe documentele PDF</small></h2><form onsubmit="saveCfg(event)"><label>Denumirea companiei<input name="company" required maxlength="80" value="${esc(company())}"></label><button class="btn">Salvează</button></form><div class="msg" style="color:var(--ok)">${cfgMsg}</div></div><div class="card"><h2>Adaugă utilizator</h2><form onsubmit="addUser(event)"><label>Nume<input name="name" required></label><label>Email<input type="email" name="un" required autocapitalize="off"></label><label>Parolă (min. 6)<input type="password" name="pw" minlength="6" required></label><label>Rol<select name="role"><option value="op">Operator (Comenzi + Stoc filament)</option><option value="qc">Control calitate (doar pagina de calitate)</option><option value="admin">Administrator</option></select></label><button class="btn">Adaugă</button></form></div><div class="card"><h2>Utilizatori</h2><div class="tw">${tbl(['Nume','Email','Rol',''],U.map(u=>[esc(u.name),esc(u.email||''),RL[u.role],`<button class="x" title="Resetează parola" onclick="resetPw('${u.id}')">🔑</button>${u.id==cur.id?'':`<button class="x" onclick="delUser('${u.id}')">✕</button>`}`]))}</div></div>`:'')}
};
function tbl(h,rows){return rows.length?`<table><tr class="hd">${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map((c,i)=>`<td data-label="${h[i]||''}">${c}</td>`).join('')}</tr>`).join('')}</table>`:'<div class="e">Nicio înregistrare.</div>'}
const fd=e=>{e.preventDefault();return Object.fromEntries(new FormData(e.target))};
function togNew(sel){const on=sel.value=='__new',b=document.getElementById('newProd');b.hidden=!on;b.querySelectorAll('input[name=pname],input[name=pg],select[name=pfil]').forEach(x=>x.required=on);if(on)b.querySelector('input[name=pname]').focus()}
function addOrd(e){const d=fd(e);let pid=d.prod,np=false;
 if(pid=='__new'){const nm=(d.pname||'').trim(),g=+d.pg;if(!nm||!(g>0)||!d.pfil){alert('Completează denumirea, gramajul și filamentul produsului nou.');return}
  const ex=S.prod.find(p=>p.name.trim().toLowerCase()==nm.toLowerCase());
  if(ex)pid=ex.id;else{pid=uid();S.prod.push({id:pid,name:nm,g,pr:+d.ppr||0,fil:d.pfil});np=true}}
 S.ord.push({id:uid(),d:today(),client:d.client.trim(),prod:pid,q:+d.q,due:d.due,pri:d.pri,note:d.note.trim(),st:'new'});if(np)save();saveOrd()}
function setSt(id,st){const o=S.ord.find(x=>x.id==id);o.st=st;if(st=='qc'){o.sentBy=cur.name;o.sentAt=today();delete o.rej}if(st=='wip'&&!o.startedBy)o.startedBy=cur.name;if(st=='done')o.doneAt=today();else delete o.doneAt;saveOrd()}
function delOrd(id){if(!confirm('Ștergi comanda?'))return;S.ord=S.ord.filter(x=>x.id!=id);saveOrd()}
function bomBox(pid,q){const p=pm(pid),b=(p&&p.bom)||[];
 const rows=b.map(x=>{const m=mtm(x.mat);return m?`<div class="bl"><label class="chk"><input type="checkbox" name="m_${m.id}" checked>${esc(m.name)}</label><input type="number" step="any" min="0" name="q_${m.id}" value="${+(x.q*q).toFixed(3)}"><span>${m.u} · stoc ${fq(mstk(m.id))}</span></div>`:''}).join('');
 return`<div class="bb"><b>Materiale consumate din stoc</b>${rows||'<div class="om" style="color:var(--m)">Produsul nu are rețetă. Poți adăuga manual un material mai jos.</div>'}<div class="bl"><select name="xm"><option value="">+ alt material…</option>${matOpts()}</select><input type="number" step="any" min="0" name="xq" placeholder="cantitate"><span></span></div></div>`}
function upBom(f){$('#bomBox').innerHTML=bomBox(f.prod.value,+f.q.value||1)}
function addMat(e){const d=fd(e);S.mat.push({id:uid(),name:d.name.trim(),cat:d.cat,u:d.u,min:+d.min,pu:0});save()}
function addMi(e){const d=fd(e);S.mi.push({id:uid(),d:d.d,mat:d.mat,q:+d.q,tot:+d.tot,inv:d.inv,sup:d.sup});save()}
function addBom(e){const d=fd(e),p=pm(d.prod);p.bom=(p.bom||[]).filter(b=>b.mat!=d.mat).concat({mat:d.mat,q:+d.q});save()}
function delBom(pid,mid){const p=pm(pid);p.bom=p.bom.filter(b=>b.mat!=mid);save()}
function addMk(e){const d=fd(e),p=pm(d.prod),q=+d.q,g=Math.round((q*p.g+ +d.x)*10)/10,s=stock(d.fil).s,mats=[];
 (p.bom||[]).forEach(b=>{if(d['m_'+b.mat]!==undefined&&+d['q_'+b.mat]>0)mats.push({mat:b.mat,q:+d['q_'+b.mat]})});
 if(d.xm&&+d.xq>0){const t=mats.find(m=>m.mat==d.xm);t?t.q+=+d.xq:mats.push({mat:d.xm,q:+d.xq})}
 const short=mats.filter(m=>m.q>mstk(m.mat)).map(m=>(mtm(m.mat)||{}).name),nr='PR-'+String(Math.max(0,...S.mk.map(r=>+nrOf(r).slice(3)))+1).padStart(4,'0');
 const r={id:uid(),nr,d:d.d,prod:d.prod,q,fil:d.fil,g,cp:cpg(d.fil),by:cur?cur.name:'',byRole:cur?cur.role:'',mats:mats.map(m=>({...m,cu:mcpu(m.mat)}))};
 S.mk.push(r);r.fa=stock(d.fil).s;r.mats.forEach(m=>m.after=mstk(m.mat));
 msg=[g>s?`⚠ Consumul (${n(g)} g) depășește stocul (${n(s)} g) – stocul va fi negativ.`:'',short.length?`⚠ Stoc insuficient la: ${short.join(', ')}.`:''].filter(Boolean).join(' ');save()}
/* ---------- PDF producție (fără biblioteci externe) ---------- */
let USED={r:{},b:{}};const _hx={};
const gl=(ch,b)=>FD[b?'b':'r'].m[ch]||FD[b?'b':'r'].m['?'],tw=(s,z,b)=>[...String(s)].reduce((a,ch)=>a+gl(ch,b)[1],0)*z/1000;
const hx=(s,b)=>'<'+[...String(s)].map(ch=>{const g=gl(ch,b)[0];USED[b?'b':'r'][g]=FD[b?'b':'r'].m[ch]?ch:'?';return g.toString(16).padStart(4,'0')}).join('')+'>';
const b2h=k=>_hx[k]||(_hx[k]=[...atob(FD[k].d)].map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(''));
function buildPdf(pages,W=595,H=842){const o=[],add=s=>o.push(s),fo={};add('<</Type/Catalog/Pages 2 0 R>>');add('');
 ['r','b'].forEach(k=>{const nm=k=='b'?'LiberationSans-Bold':'LiberationSans',u=USED[k],h=b2h(k)+'>';
  add(`<</Length ${h.length}/Length1 ${FD[k].n}/Filter/ASCIIHexDecode>>\nstream\n${h}\nendstream`);const ff=o.length;
  add(`<</Type/FontDescriptor/FontName/${nm}/Flags 4/FontBBox[-200 -250 1200 950]/ItalicAngle 0/Ascent 905/Descent -212/CapHeight 716/StemV ${k=='b'?140:80}/FontFile2 ${ff} 0 R>>`);const fd=o.length;
  add(`<</Type/Font/Subtype/CIDFontType2/BaseFont/${nm}/CIDSystemInfo<</Registry(Adobe)/Ordering(Identity)/Supplement 0>>/FontDescriptor ${fd} 0 R/CIDToGIDMap/Identity/DW 600/W[${Object.entries(u).map(([g,ch])=>`${g}[${Math.round(FD[k].m[ch][1])}]`).join(' ')}]>>`);const cid=o.length;
  const en=Object.entries(u),blk=[];for(let i=0;i<en.length;i+=90)blk.push(en.slice(i,i+90));
  const cm=`/CIDInit /ProcSet findresource begin 12 dict begin begincmap /CMapName /Adobe-Identity-UCS def /CMapType 2 def 1 begincodespacerange <0000> <FFFF> endcodespacerange\n${blk.map(bk=>`${bk.length} beginbfchar\n${bk.map(([g,ch])=>`<${(+g).toString(16).padStart(4,'0')}> <${ch.codePointAt(0).toString(16).padStart(4,'0')}>`).join('\n')}\nendbfchar`).join('\n')}\nendcmap CMapName currentdict /CMap defineresource pop end end`;
  add(`<</Length ${cm.length}>>\nstream\n${cm}\nendstream`);const tu=o.length;
  add(`<</Type/Font/Subtype/Type0/BaseFont/${nm}/Encoding/Identity-H/DescendantFonts[${cid} 0 R]/ToUnicode ${tu} 0 R>>`);fo[k]=o.length});
 const kids=[];pages.forEach(c=>{add(`<</Length ${c.length}>>\nstream\n${c}\nendstream`);const ct=o.length;add(`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${W} ${H}]/Resources<</Font<</F1 ${fo.r} 0 R/F2 ${fo.b} 0 R>>>>/Contents ${ct} 0 R>>`);kids.push(o.length+' 0 R')});
 o[1]=`<</Type/Pages/Kids[${kids.join(' ')}]/Count ${pages.length}>>`;
 let out='%PDF-1.4\n',off=[];o.forEach((b,i)=>{off.push(out.length);out+=`${i+1} 0 obj\n${b}\nendobj\n`});const x=out.length;
 out+=`xref\n0 ${o.length+1}\n0000000000 65535 f \n`+off.map(v=>String(v).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<</Size ${o.length+1}/Root 1 0 R>>\nstartxref\n${x}\n%%EOF`;
 return Uint8Array.from(out,c=>c.charCodeAt(0))}
async function pdfMk(id){USED={r:{},b:{}};const r=S.mk.find(x=>x.id==id),p=pm(r.prod),f=fm(r.fil),fa=r.fa??stock(r.fil).s,old=r.fa===undefined,pages=[],G='0.06 0.62 0.54';let c='',y=0;const who=(r.ord||(r.byRole&&r.byRole!='admin'))?(r.by||''):'',co=company();
 const T=(x,yy,s,z=10,b=0,al='l',col='0.1 0.12 0.15')=>{const w=tw(s,z,b);c+=`BT ${col} rg /F${b?2:1} ${z} Tf ${(al=='r'?x-w:x).toFixed(1)} ${(842-yy).toFixed(1)} Td ${hx(s,b)} Tj ET\n`};
 const Ln=yy=>{c+=`0.85 0.88 0.9 RG 0.6 w 40 ${842-yy} m 555 ${842-yy} l S\n`},page=()=>{if(c)pages.push(c);c='';y=50};
 const sec=t=>{if(y>720)page();y+=12;T(40,y,t.toUpperCase(),9,1,'l',G);y+=8;Ln(y);y+=20};
 const tab=(cols,rows)=>{cols.forEach(([h,x,a])=>T(x,y,h,8.5,1,a,'0.45 0.5 0.55'));y+=8;Ln(y);y+=16;rows.forEach(rw=>{if(y>790){page()}rw.forEach((v,i)=>T(cols[i][1],y,String(v),10,0,cols[i][2]));y+=20})};
 page();c+=`${G} rg 0 756 595 86 re f\n`;{let z=20;while(tw(co,z,1)>340&&z>10)z--;T(40,44,co,z,1,'l','1 1 1')}T(40,66,'Document de producție – consum materiale',11,0,'l','0.88 1 0.97');T(555,44,nrOf(r),18,1,'r','1 1 1');T(555,66,'Data: '+r.d,11,0,'r','0.88 1 0.97');y=112;
 T(40,y,who?'Operator producție: '+who:'',10);T(555,y,'Generat: '+today(),10,0,'r','0.45 0.5 0.55');y+=6;
 sec('1. Produs fabricat');tab([['Produs',40,'l'],['Cantitate (buc)',370,'r'],['Gramaj / buc',460,'r'],['Total filament',555,'r']],[[p?p.name:'(șters)',r.q,(p?p.g:'-')+' g',n(r.g)+' g']]);
 if(r.qc){T(40,y-6,`Control calitate: ${r.qc.by} · ${r.qc.d} · conforme ${r.qc.ok} din ${r.qc.total} (rebuturi ${r.qc.total-r.qc.ok})${r.qc.note?' · '+r.qc.note:''}`.slice(0,120),9,0,'l','0.45 0.5 0.55');y+=12}
 sec('2. Filament consumat');tab([['Filament',40,'l'],['Consum',330,'r'],['Stoc înainte',440,'r'],['Stoc rămas',555,'r']],[[f?`${f.brand} ${f.mat} ${f.color}`:'(șters)',n(r.g)+' g',n(fa+r.g)+' g',n(fa)+' g']]);
 if(old){T(40,y-6,'* Înregistrare veche: stocul rămas reprezintă stocul curent la data exportului.',8,0,'l','0.45 0.5 0.55');y+=8}
 sec('3. Materiale și componente consumate');
 if((r.mats||[]).length)tab([['Material',40,'l'],['UM',270,'l'],['Consum',350,'r'],['Stoc înainte',450,'r'],['Stoc rămas',555,'r']],r.mats.map(m=>{const a=m.after??mstk(m.mat);return[(mtm(m.mat)||{name:'(șters)'}).name,mun(m.mat),fq(m.q),fq(a+m.q),fq(a)]}));
 else{T(40,y,'Nu s-au consumat materiale suplimentare.',10,0,'l','0.45 0.5 0.55');y+=20}
 if(y>700)page();y=Math.max(y+40,740);[['Întocmit – Producție (operator)',40],['Verificat',225],['Aprobat – semnătură',410]].forEach(([l,x])=>{c+=`0.6 0.65 0.7 RG 0.6 w ${x} ${842-y} m ${x+145} ${842-y} l S\n`;T(x,y+13,l,8.5,0,'l','0.45 0.5 0.55')});
 T(40,820,'Document generat de '+co,8,0,'l','0.6 0.65 0.7');pages.push(c);
 const bytes=buildPdf(pages),fn=nrOf(r)+'.pdf';
 try{const dl=null;if(dl){await dl.save({filename:fn,data:bytes});return}}catch(e){if(e&&e.code=='declined')return}
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));a.download=fn;a.click()}
function approveQc(id){const o=S.ord.find(x=>x.id==id),p=pm(o.prod),ok=Math.max(0,Math.min(o.q,Math.round(+document.getElementById('qa_'+id).value||0))),note=document.getElementById('qn_'+id).value.trim();
 if(!p||!p.fil||!fm(p.fil)){alert('Produsul nu are filament implicit. Cere administratorului să îl seteze în pagina Produse.');return}
 if(ok<1){alert('Nicio bucată conformă – folosește „Respinge".');return}
 if(ok<o.q&&!note){alert('Scrie la observații motivul rebuturilor.');return}
 const mats=(p.bom||[]).filter(b=>mtm(b.mat)).map(b=>({mat:b.mat,q:+(b.q*o.q).toFixed(3),cu:mcpu(b.mat)})),g=Math.round(o.q*p.g*10)/10;
 const short=[...(stock(p.fil).s<g?['filament']:[]),...mats.filter(m=>m.q>mstk(m.mat)).map(m=>mtm(m.mat).name)];
 if(short.length&&!confirm('Stoc insuficient la: '+short.join(', ')+'. Aprobi oricum?'))return;
 const nr='PR-'+String(Math.max(0,...S.mk.map(r=>+nrOf(r).slice(3)))+1).padStart(4,'0'),
  r={id:uid(),nr,d:today(),prod:o.prod,q:ok,fil:p.fil,g,cp:cpg(p.fil),by:o.startedBy||o.sentBy||'',byRole:'op',mats,ord:o.id,qc:{by:cur.name,d:today(),ok,total:o.q,note}};
 S.mk.push(r);r.fa=stock(p.fil).s;r.mats.forEach(m=>m.after=mstk(m.mat));
 o.st='done';o.doneAt=today();o.mk=r.id;o.qc={by:cur.name,d:today(),ok,note};save();saveOrd()}
function rejectQc(id){const o=S.ord.find(x=>x.id==id),note=document.getElementById('qn_'+id).value.trim();
 if(!note){alert('Scrie motivul respingerii în Observații.');return}
 o.st='wip';o.rej={by:cur.name,d:today(),reason:note};saveOrd()}
const company=()=>(S.set[0]&&S.set[0].company)||'Atelier 3D';
function saveCfg(e){const d=fd(e);S.set=[{id:'cfg',company:d.company.trim()||'Atelier 3D'}];cfgMsg='✓ Denumirea companiei a fost salvată.';save();setTimeout(()=>{cfgMsg='';if(tab=='usr')render()},2500)}
function addFil(e){const d=fd(e);S.fil.push({id:uid(),brand:d.brand.trim(),mat:d.mat.trim(),color:d.color.trim(),hex:d.hex,pk:+d.pk,min:+d.min});save()}
function addIn(e){const d=fd(e);S.in.push({id:uid(),d:d.d,fil:d.fil,q:+d.q,w:+d.w,g:d.q*d.w,p:+d.p,sup:d.sup});save()}
function addProd(e){const d=fd(e);S.prod.push({id:uid(),name:d.name.trim(),g:+d.g,pr:+d.pr,fil:d.fil});save()}
const MN=['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
function rptCard(){return`<div class="card"><h2>Raport lunar de vânzări <small>PDF pentru transmitere</small></h2><form onsubmit="event.preventDefault();pdfSales(this.m.value)"><label>Luna<input type="month" name="m" value="${today().slice(0,7)}" required></label><button class="btn">📄 Export PDF vânzări lunare</button></form></div>`}
async function pdfSales(m){if(!/^\d{4}-\d{2}$/.test(m||'')){alert('Alege luna.');return}
 USED={r:{},b:{}};const W=842,H=595,G='0.06 0.62 0.54',GR='0.45 0.5 0.55',co=company(),[yy,mm]=m.split('-').map(Number),label=MN[mm-1]+' '+yy,PS={paynet:'Paynet online',pos:'Card POS',cash:'Numerar'};
 const rows=S.sal.filter(r=>r.d.startsWith(m)).sort((a,b)=>a.d.localeCompare(b.d)),pages=[];let c='',y=0;
 const txt=(x,yv,s,z=10,b=0,al='l',col='0.1 0.12 0.15')=>{const w=tw(s,z,b);return `BT ${col} rg /F${b?2:1} ${z} Tf ${(al=='r'?x-w:al=='c'?x-w/2:x).toFixed(1)} ${(H-yv).toFixed(1)} Td ${hx(s,b)} Tj ET\n`};
 const T=(...a)=>{c+=txt(...a)},Ln=(yv,x1=40,x2=W-40)=>{c+=`0.85 0.88 0.9 RG 0.6 w ${x1} ${H-yv} m ${x2} ${H-yv} l S\n`};
 const fit=(s,mw,z)=>{s=String(s);if(tw(s,z)<=mw)return s;while(s.length>1&&tw(s+'…',z)>mw)s=s.slice(0,-1);return s+'…'};
 const page=()=>{if(c)pages.push(c);c='';y=45},dm=d=>d.split('-').reverse().join('.');
 const sec=t=>{if(y>H-120)page();y+=10;T(40,y,t.toUpperCase(),9,1,'l',G);y+=7;Ln(y);y+=18};
 const head=cols=>{cols.forEach(([h,x,a])=>T(x,y,h,8.5,1,a,GR));y+=7;Ln(y);y+=15};
 const tab=(cols,rs)=>{head(cols);rs.forEach(rw=>{if(y>H-62){page();head(cols)}rw.forEach((v,i)=>T(cols[i][1],y,cols[i][3]?fit(v,cols[i][3],9.5):String(v),9.5,0,cols[i][2]));y+=17})};
 const n=rows.length,qty=sum(rows,r=>r.q),pv=sum(rows,rev),lv=sum(rows,r=>r.liv||0),tt=sum(rows,revTot);
 page();c+=`${G} rg 0 ${H-84} ${W} 84 re f\n`;{let z=20;while(tw(co,z,1)>380&&z>10)z--;T(40,40,co,z,1,'l','1 1 1')}
 T(40,62,'Raport lunar de vânzări',11,0,'l','0.88 1 0.97');T(W-40,40,label,20,1,'r','1 1 1');T(W-40,62,`Perioadă: 01.${String(mm).padStart(2,'0')}.${yy} – ${new Date(yy,mm,0).getDate()}.${String(mm).padStart(2,'0')}.${yy}`,11,0,'r','0.88 1 0.97');
 y=118;[['Vânzări (nr.)',n],['Bucăți vândute',qty],['Valoare produse',L(pv)],['Livrări încasate',L(lv)],['Total încasat',L(tt)]].forEach(([l,v],i)=>{T(40+i*152,y,l,8.5,0,'l',GR);T(40+i*152,y+20,String(v),15,1,'l',i==4?G:'0.1 0.12 0.15')});y+=38;
 sec('Încasări pe metode de plată');const pk=['paynet','pos','cash'].concat(rows.some(r=>!r.pay)?['']:[]);
 tab([['Metodă de plată',40,'l'],['Vânzări',300,'r'],['Valoare produse',440,'r'],['Livrări',580,'r'],['Total încasat',W-40,'r']],pk.map(k=>{const l=rows.filter(r=>(r.pay||'')==k);return[PS[k]||'Nespecificat',l.length,L(sum(l,rev)),L(sum(l,r=>r.liv||0)),L(sum(l,revTot))]}));
 sec('Vânzări pe produse');const pg=[...new Set(rows.map(r=>r.prod))];
 tab([['Produs',40,'l',300],['Cantitate',440,'r'],['Valoare produse',580,'r'],['Total cu livrare',W-40,'r']],pg.length?pg.map(id=>{const l=rows.filter(r=>r.prod==id);return[pn(id),sum(l,r=>r.q),L(sum(l,rev)),L(sum(l,revTot))]}):[]);
 sec('Detaliu vânzări');
 if(n){tab([['Data',40,'l'],['Produs',108,'l',190],['Client / canal',305,'l',130],['Cant.',505,'r'],['Preț / buc',570,'r'],['Livrare',635,'r'],['Total',705,'r'],['Plată',715,'l',87]],rows.map(r=>[dm(r.d),pn(r.prod),r.cl||'-',r.q,L(r.pr),r.liv?L(r.liv):'-',L(revTot(r)),PS[r.pay]||'-']));
  if(y>H-70)page();Ln(y-8);T(40,y+4,'TOTAL LUNĂ',10,1);T(505,y+4,String(qty),10,1,'r');T(635,y+4,L(lv),10,1,'r');T(705,y+4,L(tt),10,1,'r');y+=30}
 else{T(40,y,'Nu există vânzări în luna selectată.',10,0,'l',GR);y+=30}
 if(y>H-95)page();y=Math.max(y+25,H-85);[['Întocmit',40],['Verificat',330],['Aprobat – semnătură',620]].forEach(([l,x])=>{c+=`0.6 0.65 0.7 RG 0.6 w ${x} ${H-y} m ${x+182} ${H-y} l S\n`;T(x,y+13,l,8.5,0,'l',GR)});
 pages.push(c);const out=pages.map((p,i)=>p+txt(40,H-16,'Document generat de '+co,8,0,'l','0.6 0.65 0.7')+txt(W-40,H-16,`Pagina ${i+1} din ${pages.length}`,8,0,'r','0.6 0.65 0.7'));
 const bytes=buildPdf(out,W,H),fn=`Vanzari-${m}.pdf`;
 try{const dl=null;if(dl){await dl.save({filename:fn,data:bytes});return}}catch(e){if(e&&e.code=='declined')return}
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));a.download=fn;a.click()}
const PAY={paynet:'Paynet online',pos:'Card la terminal POS',cash:'Numerar'};
function togLiv(c){const b=document.getElementById('livBox'),i=b.querySelector('input');b.style.display=c.checked?'flex':'none';i.required=c.checked;if(c.checked)i.focus();else i.value=0}
function payCard(){const mo=today().slice(0,7),rows=['paynet','pos','cash',''].map(k=>{const l=S.sal.filter(r=>(r.pay||'')==k);return l.length||k?[PAY[k]||'Nespecificat',l.length,L(sum(l.filter(r=>r.d.startsWith(mo)),revTot)),`<b>${L(sum(l,revTot))}</b>`]:null}).filter(Boolean);
 return`<div class="card"><h2>Încasări pe metode de plată <small>include livrările</small></h2><div class="tw">${tbl(['Metodă de plată','Vânzări','Luna aceasta','Total încasat'],rows)}</div></div>`}
function addSal(e){const d=fd(e),a=avail(d.prod);S.sal.push({id:uid(),d:d.d,prod:d.prod,q:+d.q,pr:+d.pr,cl:d.cl,pay:d.pay,liv:d.liv_on?Math.max(0,+d.liv||0):0});msg=d.q>a?`⚠ Ai vândut ${d.q} buc, dar în stoc erau doar ${a}. Înregistrează și producția.`:'';save()}
function addExp(e){const d=fd(e);S.exp.push({id:uid(),d:d.d,cat:d.cat,desc:d.desc,a:+d.a});save()}
function del(k,id){if(!confirm('Sigur ștergi înregistrarea?'))return;
  if(k=='fil'&&(S.in.some(r=>r.fil==id)||S.mk.some(r=>r.fil==id))){alert('Filamentul are intrări/producții și nu poate fi șters.');return}
  if(k=='prod'&&(S.mk.some(r=>r.prod==id)||S.sal.some(r=>r.prod==id))){alert('Produsul are producții/vânzări și nu poate fi șters.');return}
  if(k=='mat'&&(S.mi.some(r=>r.mat==id)||S.mk.some(r=>(r.mats||[]).some(x=>x.mat==id))||S.prod.some(p=>(p.bom||[]).some(b=>b.mat==id)))){alert('Materialul are intrări, consum sau rețetă și nu poate fi șters.');return}
  S[k]=S[k].filter(x=>x.id!=id);save()}
function exp_(){const j=JSON.stringify(S,null,1),f='atelier3d-'+today()+'.json';
  (async()=>{try{const d=null;if(d){await d.save({filename:f,data:j});return}}catch(e){}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([j],{type:'application/json'}));a.download=f;a.click()})()}
render();boot();
