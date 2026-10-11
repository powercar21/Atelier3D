(function(){
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SETS={lit:'ABCDEFGHIJKLMNOPQRSTUVWXYZĂÂÎȘȚ',cyr:'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',dig:'0123456789',sym:'&!?.-+'};
const EU='AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT SK SI ES SE'.split(' '),INTL='GB UA CH NO IS LI US CA IL TR GE AM AZ BY RU KZ RS ME MK AL BA XK AE AU JP CN KR'.split(' ');
const ZONE={MD:'MD',RO:'RO',...Object.fromEntries(EU.map(c=>[c,'EU'])),...Object.fromEntries(INTL.map(c=>[c,'INT']))};
const LOCALE={ro:'ro-RO',ru:'ru-RU',en:'en-GB'};
const r2=v=>Math.round(v*100)/100;
let C=null,LANG='ro',CUR='MDL';const ST={letters:[],sel:-1,size:null,deliv:null,col:null,mode:'all',busy:false,country:'MD',cTouched:false,kb:false};
const I=()=>window.I18N[LANG],tt=(k,v)=>{let s=I()[k]!=null?I()[k]:(window.I18N.ro[k]!=null?window.I18N.ro[k]:k);if(v)for(const a in v)s=s.split('{'+a+'}').join(v[a]);return s};
const T=o=>o?(o[LANG]||o.ro||o.en||o.ru||''):'';
const M=v=>r2(v).toLocaleString(LOCALE[LANG],{minimumFractionDigits:2,maximumFractionDigits:2})+' '+CUR;
const lw=n=>{if(LANG=='ru'){const a=n%10,b=n%100;return a==1&&b!=11?tt('letter1'):(a>=2&&a<=4&&(b<10||b>=20))?tt('letter2'):tt('letterN')}return n==1?tt('letter1'):tt('letterN')};
const safe=f=>{try{return f()}catch(e){return null}};
const norm=ch=>({'ş':'Ș','ţ':'Ț','ș':'Ș','ț':'Ț','ă':'Ă','â':'Â','î':'Î'}[ch]||ch.toUpperCase());
const allowed=()=>Object.keys(SETS).filter(k=>C.sets[k]).map(k=>SETS[k]).join('');
const text=()=>ST.letters.map(l=>l.ch).join('');
const colOf=id=>C.colors.find(c=>c.id==id)||C.colors[0],sizeOf=()=>C.sizes.find(s=>s.id==ST.size),zone=()=>ZONE[ST.country]||'INT';
const delList=()=>C.deliv.filter(d=>d.zones.includes(zone())),delOf=()=>delList().find(d=>d.id==ST.deliv);
/* ===== litere bubble (hărți de înălțime din modelele tale, iluminate în browser) ===== */
const BB={},URLC={};
function loadBubble(){const B=window.BUBBLE;if(!B)return Promise.resolve();return Promise.all(Object.entries(B.c).map(([ch,b64])=>new Promise(res=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);BB[ch]={c,w:im.width,h:im.height};res()};im.onerror=res;im.src='data:image/png;base64,'+b64})))}
function bubbleURL(ch,hex,H){const k=ch+hex+H;if(URLC[k])return URLC[k];const g=BB[ch];if(!g)return null;
 const s=H/100,w=Math.max(2,Math.round(g.w*s)),h=Math.max(2,Math.round(g.h*s)),pad=Math.ceil(8*s)+3,W=w+2*pad,Hh=h+2*pad;
 const cv=document.createElement('canvas');cv.width=W;cv.height=Hh;const cx=cv.getContext('2d',{willReadFrequently:true});cx.imageSmoothingQuality='high';cx.drawImage(g.c,pad,pad,w,h);
 const id=cx.getImageData(0,0,W,Hh),D=id.data,zs=window.BUBBLE.zs/255*s,Z=new Float32Array(W*Hh);for(let i=0;i<W*Hh;i++)Z[i]=D[i*4]*zs;
 const n=parseInt(hex.slice(1),16),cr=Math.max(26,(n>>16)&255),cg=Math.max(26,(n>>8)&255),cb=Math.max(26,n&255);
 let Lx=-.5,Ly=-.62,Lz=.62,ll=Math.hypot(Lx,Ly,Lz);Lx/=ll;Ly/=ll;Lz/=ll;let Hx=Lx,Hy=Ly,Hz=Lz+1,hl=Math.hypot(Hx,Hy,Hz);Hx/=hl;Hy/=hl;Hz/=hl;
 const out=cx.createImageData(W,Hh),O=out.data,zmax=30*s;
 for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){const i=y*W+x,a=D[i*4+3];if(a<6){O[i*4+3]=0;continue}
  const xl=x>0?i-1:i,xr=x<W-1?i+1:i,yu=y>0?i-W:i,yd=y<Hh-1?i+W:i,dx=(Z[xr]-Z[xl])/(xr-xl||1),dy=(Z[yd]-Z[yu])/((yd-yu)/W||1);
  let nx=-dx,ny=-dy,nz=1;const nl=Math.hypot(nx,ny,nz);nx/=nl;ny/=nl;nz/=nl;
  const diff=Math.max(0,nx*Lx+ny*Ly+nz*Lz),sp=Math.pow(Math.max(0,nx*Hx+ny*Hy+nz*Hz),42),ao=.66+.34*Math.pow(Math.min(1,Z[i]/zmax),.55),sh=(.34+.82*diff)*ao;
  O[i*4]=Math.min(255,cr*sh+255*sp*.6);O[i*4+1]=Math.min(255,cg*sh+255*sp*.6);O[i*4+2]=Math.min(255,cb*sh+255*sp*.6);O[i*4+3]=a}
 cx.putImageData(out,0,0);return URLC[k]=cv.toDataURL('image/png')}
const HPX=()=>{const s=sizeOf(),b=Math.max(64,Math.min(150,40+(s?s.h:10)*5));return Math.round(b*(innerWidth<620?.78:1))};
function tile(l,i,H,sel){if(l.ch==' ')return`<span class="sp" style="width:${Math.round(H*.34)}px"></span>`;const c=colOf(l.c),u=bubbleURL(l.ch,c.hex,H),on=sel&&i==ST.sel&&ST.mode=='each';
 return`<button type="button" class="tile${on?' sel':''}" ${sel?`onclick="selL(${i})"`:'tabindex="-1"'} aria-label="${esc(l.ch)}">${u?`<img src="${u}" alt="${esc(l.ch)}" draggable="false">`:`<span class="tf" style="color:${c.hex};font-size:${H*.8}px">${esc(l.ch)}</span>`}</button>`}
/* ===== calcul preț ===== */
function calc(){const real=ST.letters.filter(l=>l.ch!=' '),s=sizeOf(),d=delOf(),n=real.length,base=r2(n*(s?s.price[CUR]:0)),extras=r2(real.reduce((a,l)=>a+(colOf(l.c).extra[CUR]||0),0)),sub=r2(base+extras),fo=C.freeOver[CUR],dp=d?(fo>0&&sub>=fo?0:d.price[CUR]):0;return{n,base,extras,sub,dp,total:r2(sub+dp),free:!!d&&fo>0&&sub>=fo&&d.price[CUR]>0}}
function fmt(t){let out='',ul=false;for(const raw of String(t||'').split(/\r?\n/)){const ln=raw.trim();if(ln.startsWith('- ')||ln.startsWith('• ')){if(!ul){out+='<ul>';ul=true}out+='<li>'+esc(ln.slice(2))+'</li>'}else{if(ul){out+='</ul>';ul=false}if(ln)out+='<p>'+esc(ln)+'</p>'}}return out+(ul?'</ul>':'')}
const firstReal=()=>ST.letters.findIndex(l=>l.ch!=' ');
function setText(v){const out=[];let n=0;for(const ch of String(v)){const u=norm(ch);if(u==' '){if(out.length&&out[out.length-1]!=' ')out.push(' ')}else if(allowed().includes(u)){if(n>=C.max)break;n++;out.push(u)}}
 ST.letters=out.map((ch,i)=>ch==' '?{ch}:{ch,c:(ST.letters[i]&&ST.letters[i].ch!=' '&&ST.letters[i].c)||ST.col});
 if(ST.mode=='each'&&(ST.sel<0||ST.sel>=ST.letters.length||ST.letters[ST.sel].ch==' '))ST.sel=firstReal();if(ST.sel>=ST.letters.length)ST.sel=-1;paint(true)}
window.setText=setText;
window.selL=i=>{ST.mode='each';ST.sel=i;paint()};
window.setMode=m=>{ST.mode=m;if(m=='each'&&(ST.sel<0||!ST.letters[ST.sel]||ST.letters[ST.sel].ch==' '))ST.sel=firstReal();paint()};
window.togKb=()=>{ST.kb=!ST.kb;$('#kbBox').classList.toggle('open',ST.kb);$('#kbBtn').setAttribute('aria-expanded',ST.kb);$('#kbBtn').textContent=ST.kb?tt('kbClose'):tt('kbOpen')};
window.addCh=ch=>{setText(text()+ch)};window.back=()=>setText(text().slice(0,-1));window.clr=()=>{ST.sel=-1;setText('')};
window.pickC=id=>{ST.col=id;if(ST.mode=='all')ST.letters.forEach(l=>{if(l.ch!=' ')l.c=id});else if(ST.sel>=0&&ST.letters[ST.sel]&&ST.letters[ST.sel].ch!=' '){ST.letters[ST.sel].c=id;let j=ST.sel+1;while(j<ST.letters.length&&ST.letters[j].ch==' ')j++;if(j<ST.letters.length)ST.sel=j}paint()};
window.pickS=id=>{ST.size=id;paint()};window.pickD=id=>{ST.deliv=id;paint()};
const fixDeliv=()=>{const l=delList();if(!l.find(d=>d.id==ST.deliv))ST.deliv=l.length?l[0].id:null};
window.pickCountry=c=>{ST.country=c;ST.cTouched=true;fixDeliv();rebuild()};
window.setLang=l=>{LANG=l;safe(()=>localStorage.setItem('cfg_lang',l));rebuild()};
window.setCur=c=>{CUR=c;safe(()=>localStorage.setItem('cfg_cur',c));if(!ST.cTouched){ST.country=c=='RON'?'RO':'MD';fixDeliv()}rebuild()};
function paint(syncInput){
 const s=sizeOf(),H=HPX();
 $('#prev').innerHTML=ST.letters.length?ST.letters.map((l,i)=>tile(l,i,H,true)).join(''):`<div class="empty">${tt('emptyPrev')}</div>`;
 if(syncInput&&$('#txt').value!==text())$('#txt').value=text();
 const k=calc(),d=delOf(),mn=C.min[CUR],min=mn>0&&k.sub<mn&&k.n>0,cur=(ST.mode=='each'&&ST.sel>=0&&ST.letters[ST.sel])?ST.letters[ST.sel].c:ST.col;
 $('#pvInfo').textContent=k.n?`${k.n} ${lw(k.n)} · ${s?esc(s.label):''}`.replace(/&amp;/g,'&'):'';
 {const pv=document.querySelector('.pv');if(pv)document.documentElement.style.setProperty('--pvh',(pv.offsetHeight+16)+'px')}
 document.querySelectorAll('.sw').forEach(e=>e.classList.toggle('on',e.dataset.id==cur));
 document.querySelectorAll('.size').forEach(e=>e.classList.toggle('on',e.dataset.id==ST.size));
 document.querySelectorAll('.seg button').forEach(e=>e.classList.toggle('on',e.dataset.m==ST.mode));
 $('#cn').textContent=ST.mode=='all'?tt('hintAll'):(ST.sel>=0&&ST.letters[ST.sel]?tt('hintSel',{ch:ST.letters[ST.sel].ch}):tt('hintNone'));
 $('#addrBox').style.display=d&&d.addr?'contents':'none';
 const rows=[`<div class="ln"><span>${k.n} ${lw(k.n)} × ${s?M(s.price[CUR]):'-'}<br><small>${s?esc(s.label):''}</small></span><span>${M(k.base)}</span></div>`];
 if(k.extras>0)rows.push(`<div class="ln"><span>${tt('extras')}</span><span>${M(k.extras)}</span></div>`);
 rows.push(`<div class="ln"><span>${tt('deliveryL')}<br><small>${d?esc(T(d.label)):'-'}${k.free?' – '+tt('freeD'):''}</small></span><span>${M(k.dp)}</span></div>`);
 const off=k.n<1||min||ST.busy||!d;
 $('#sum').innerHTML=`<h3>${tt('summary')}</h3>${rows.join('')}<div class="ln t"><span>${tt('total')}</span><span>${M(k.total)}</span></div>${min?`<div class="err">${tt('minWarn',{p:M(mn)})}</div>`:''}${!d?`<div class="err">${tt('noDeliv')}</div>`:''}${T(C.note)?`<div class="note">${esc(T(C.note))}</div>`:''}<button class="btn" type="submit" form="f" id="go" ${off?'disabled':''}>${ST.busy?tt('sending'):tt('place')}</button>`;
 $('#mb').innerHTML=`<div><small>${tt('total')}</small><b>${M(k.total)}</b></div><button type="button" onclick="document.getElementById('orderCard').scrollIntoView()">${tt('toOrder')}</button>`;
}
window.submitOrder=async e=>{e.preventDefault();const f=e.target,v=Object.fromEntries(new FormData(f)),k=calc(),d=delOf(),er=m=>{$('#err').innerHTML=m?`<div class="err">${esc(m)}</div>`:''};er('');
 if(k.n<1)return er(tt('e_empty'));if(C.min[CUR]>0&&k.sub<C.min[CUR])return er(tt('e_min'));if(!d)return er(tt('e_deliv'));
 if((v.name||'').trim().length<2)return er(tt('e_name'));if(!/^[+()\d\s.-]{9,25}$/.test((v.phone||'').trim()))return er(tt('e_phone'));
 if(d.addr&&((v.city||'').trim().length<2||(v.addr||'').trim().length<4))return er(tt('e_addr'));
 if(!f.terms.checked)return er(tt('e_terms'));
 ST.busy=true;paint();
 try{const r=await fetch('/api/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({letters:ST.letters.map(l=>l.ch==' '?{ch:' '}:{ch:l.ch,c:l.c}),size:ST.size,deliv:ST.deliv,cur:CUR,country:ST.country,lang:LANG,name:v.name,phone:v.phone,email:v.email,city:v.city,addr:v.addr,zip:v.zip,note:v.note,terms:true,website:v.website||''})});
  const j=await r.json().catch(()=>({}));if(!r.ok){ST.busy=false;paint();return er(I()['e_'+j.code]||j.error||tt('e_generic'))}
  const H=Math.round(Math.min(80,30+sizeOf().h*2.2));
  $('#app').innerHTML=`<div class="done"><div class="card"><div style="font-size:54px">🎉</div><h2>${tt('done')}</h2><div class="nr">${esc(j.nr||'')}</div><div class="mini">${ST.letters.map((l,i)=>tile(l,i,H,false)).join('')}</div><p>${tt('due')}: <b>${M(j.total!=null?j.total:k.total)}</b></p><p class="hint">${tt('contact')}${C.phone||C.email?`. ${tt('alsoWrite')} ${esc([C.phone,C.email].filter(Boolean).join(' / '))}`:''}.</p><button class="btn" onclick="location.reload()">${tt('newOrder')}</button></div></div>`;window.scrollTo(0,0)}
 catch(x){ST.busy=false;paint();er(tt('e_net'))}};
function countryOptions(){let dn=null;safe(()=>{dn=new Intl.DisplayNames([LOCALE[LANG]],{type:'region'})});const nm=c=>(dn&&safe(()=>dn.of(c)))||c;
 const all=Object.keys(ZONE).sort((a,b)=>nm(a).localeCompare(nm(b),LOCALE[LANG])),top=['MD','RO'],rest=all.filter(c=>!top.includes(c));
 return[...top,...rest].map(c=>`<option value="${c}"${c==ST.country?' selected':''}>${esc(nm(c))}</option>`).join('')}
function build(){
 const im=(C.intro&&C.intro.images)||[],tx=T(C.intro&&C.intro.text);
 const intro=(tx||im.length)?`<section class="intro${im.length&&tx?' two':''}">${tx?`<div class="it">${fmt(tx)}</div>`:''}${im.length?`<div class="ig n${im.length}">${im.map(i=>`<figure><img src="${esc(i.url)}" alt="${esc(T(i.cap))}" loading="lazy">${T(i.cap)?`<figcaption>${esc(T(i.cap))}</figcaption>`:''}</figure>`).join('')}</div>`:''}</section>`:'';
 const kbSets=Object.keys(SETS).filter(k=>C.sets[k]).map(k=>[...SETS[k]].map(ch=>`<button type="button" onclick="addCh('${ch}')">${ch}</button>`).join('')+'<span class="sepr"></span>').join('');
 const dl=delList();
 $('#app').innerHTML=`<div class="topbar"><div class="lang" role="group" aria-label="${tt('lang')}">${['ro','ru','en'].map(l=>`<button type="button" class="${l==LANG?'on':''}" onclick="setLang('${l}')">${l.toUpperCase()}</button>`).join('')}</div>
<label class="curSel"><span>${tt('cur')}</span><select onchange="setCur(this.value)" aria-label="${tt('cur')}">${C.currencies.map(c=>`<option value="${c}"${c==CUR?' selected':''}>${esc(window.CURNAMES[LANG][c])}</option>`).join('')}</select></label></div>
<header class="hd"><h1>${esc(T(C.title)||'Litere bubble 3D')}</h1><p>${esc(T(C.sub))}</p><a class="cta" href="#s1" onclick="document.getElementById('txt').focus({preventScroll:true})">${tt('cta')}</a></header>${intro}
<main class="wrap"><div>
<section class="card" id="s1"><h2><i>1</i>${tt('s1')}</h2><input id="txt" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="${C.max+15}" placeholder="${esc(tt('ph'))}" oninput="setText(this.value)">
<div class="row" style="margin-top:12px"><button type="button" class="ghost" id="kbBtn" aria-expanded="${ST.kb}" onclick="togKb()">${ST.kb?tt('kbClose'):tt('kbOpen')}</button><button type="button" class="ghost" onclick="back()">${tt('back')}</button><button type="button" class="ghost" onclick="clr()">${tt('clear')}</button></div>
<div class="kb${ST.kb?' open':''}" id="kbBox">${kbSets}<button type="button" onclick="addCh(' ')" style="min-width:90px">${tt('space')}</button></div>
<p class="hint">${tt('maxHint',{n:C.max})}</p></section>
<div class="live">
<section class="card pv"><div class="pvh"><b>${tt('preview')}</b><span id="pvInfo"></span></div><div id="prev" class="prev"></div></section>
<section class="card"><h2><i>2</i>${tt('s2')}</h2><div class="seg"><button type="button" data-m="all" onclick="setMode('all')">${tt('modeAll')}</button><button type="button" data-m="each" onclick="setMode('each')">${tt('modeEach')}</button></div>
<div class="pal">${C.colors.map(c=>{const ex=c.extra[CUR];return`<button type="button" class="sw" data-id="${esc(c.id)}" style="--h:${esc(c.hex)}" title="${esc(T(c.name))}${ex>0?' (+'+M(ex)+')':''}" aria-label="${esc(T(c.name))}" onclick="pickC('${c.id}')">${ex>0?`<b>+${r2(ex)}</b>`:''}</button>`}).join('')}</div><p class="cn" id="cn"></p></section>
<section class="card"><h2><i>3</i>${tt('s3')}</h2><div class="sizes">${C.sizes.map(s=>`<button type="button" class="size" data-id="${esc(s.id)}" onclick="pickS('${s.id}')"><b>${esc(s.label)}</b><small>${tt('height',{h:s.h})}</small><em>${tt('perLetter',{p:M(s.price[CUR])})}</em></button>`).join('')}</div></section>
</div>
<section class="card" id="orderCard"><h2><i>4</i>${tt('s4')}</h2><form id="f" onsubmit="submitOrder(event)" novalidate><div class="grid">
<label class="f">${tt('name')}<input name="name" autocomplete="name" required></label><label class="f">${tt('phone')}<input name="phone" type="tel" autocomplete="tel" required></label>
<label class="f full">${tt('email')}<input name="email" type="email" autocomplete="email"></label>
<label class="f">${tt('country')}<select id="country" name="country" onchange="pickCountry(this.value)">${countryOptions()}</select></label>
<label class="f">${tt('delivery')}<select id="deliv" name="deliv" onchange="pickD(this.value)">${dl.length?dl.map(x=>`<option value="${esc(x.id)}"${x.id==ST.deliv?' selected':''}>${esc(T(x.label))} – ${x.price[CUR]>0?M(x.price[CUR]):tt('free')}</option>`).join(''):`<option value="">${tt('noDeliv')}</option>`}</select></label>
<span id="addrBox" style="display:contents"><label class="f">${tt('city')}<input name="city" autocomplete="address-level2"></label><label class="f">${tt('addr')}<input name="addr" autocomplete="street-address"></label><label class="f">${tt('zip')}<input name="zip" autocomplete="postal-code" maxlength="16"></label></span>
<label class="f full">${tt('note')}<textarea name="note" maxlength="500" placeholder="${esc(tt('notePh'))}"></textarea></label>
<div class="hp"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div></div>
<label class="chk"><input type="checkbox" name="terms">${tt('terms')}</label><div id="err"></div></form></section>
</div><aside class="card sum" id="sum"></aside></main><div class="mbar" id="mb"></div>`;
 paint(true)}
function rebuild(){const f=$('#f'),keep=f?{...Object.fromEntries(new FormData(f)),terms:f.terms.checked}:{};build();const g=$('#f');if(g)for(const k in keep){const el=g.elements[k];if(!el||['country','deliv'].includes(k))continue;if(el.type=='checkbox')el.checked=!!keep[k];else el.value=keep[k]}}
function detect(){let l=safe(()=>new URLSearchParams(location.search).get('lang'))||safe(()=>localStorage.getItem('cfg_lang'));if(!window.I18N[l]){const n=(navigator.language||'ro').slice(0,2).toLowerCase();l=window.I18N[n]?n:'ro'}return l}
async function init(){LANG=detect();document.documentElement.lang=LANG;$('#app').innerHTML=`<div class="load">${tt('loading')}</div>`;
 try{const[r]=await Promise.all([fetch('/api/config'),loadBubble()]),j=await r.json();if(!r.ok)throw new Error(j.error||'');C=j;
  if(!C.sizes.length||!C.colors.length||!C.deliv.length||!C.currencies.length||!Object.values(C.sets).some(Boolean))throw new Error('Configuratorul nu este încă gata.');
  let cu=safe(()=>localStorage.getItem('cfg_cur'));if(!C.currencies.includes(cu))cu=(String(navigator.language||'').toUpperCase().endsWith('-RO')?'RON':(LANG=='en'?'EUR':'MDL'));CUR=C.currencies.includes(cu)?cu:C.currencies[0];
  ST.country=CUR=='RON'?'RO':'MD';ST.size=C.sizes[0].id;ST.col=C.colors[0].id;fixDeliv();build()}
 catch(e){$('#app').innerHTML=`<div class="load">${tt('unavailable')}<br><small>${esc(e.message||'')}</small></div>`}}
init();
})();
