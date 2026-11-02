/* Flower Academy · përshtatësi Supabase për versionin në Render.
   Imiton window.claude.use("db"/"user") që përdor app-i, me login, miratim dhe role. */
(function(){
const SB_URL="https://ndwyqkxrrggmecfwjncd.supabase.co";
const SB_KEY="sb_publishable_ZMoCZ5WXmpmoj9kjBczlNA_7s-JfoPT";
const sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
window.sbClient=sb;
const css=`#authgate{position:fixed;inset:0;background:var(--bg,#f4f3f1);z-index:9999;display:grid;place-items:center;padding:16px;overflow:auto}
#authgate .box{width:100%;max-width:420px;background:var(--surface,#fff);border:1px solid var(--line,#ddd);border-radius:14px;padding:24px;display:grid;gap:14px;font-family:Inter,system-ui,sans-serif}
#authgate h1{font-size:24px;margin:0}#authgate p{margin:0;color:var(--muted,#666);font-size:14.5px;line-height:1.5}
#authgate label{font-size:13px;font-weight:600;display:grid;gap:6px}#authgate input{font:inherit;font-size:16px;padding:11px 12px;border:1px solid var(--line,#ccc);border-radius:9px}
#authgate button{font:inherit;font-weight:650;padding:12px;border-radius:9px;border:0;background:var(--accent,#8d1c4b);color:#fff;cursor:pointer}
#authgate button.link{background:none;color:var(--accent,#8d1c4b);padding:4px;font-weight:600}#authgate .err{color:#b3261e;font-size:13.5px}#authgate .ok{color:#1d6b3a;font-size:13.5px}
.adm table{width:100%;border-collapse:collapse}.adm td,.adm th{padding:8px 6px;border-bottom:1px solid var(--line,#ddd);text-align:left;font-size:14px}.adm button{font:inherit;font-size:13px;padding:6px 10px;border-radius:7px;border:1px solid var(--line,#ccc);background:var(--surface,#fff);cursor:pointer;margin:2px}
.adm button.pri{background:var(--accent,#8d1c4b);color:#fff;border-color:transparent}`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let gate=null;
function showGate(html){if(!gate){gate=document.createElement("div");gate.id="authgate";document.body.appendChild(gate)}gate.innerHTML=`<div class="box"><p style="letter-spacing:.12em;text-transform:uppercase;font-size:12px;font-weight:600">Flower · F&amp;B Academy</p>${html}</div>`}
function hideGate(){if(gate){gate.remove();gate=null}}

function loginForm(mode,msg){
  const reg=mode==="reg";
  showGate(`<h1>${reg?"Krijo llogarinë":"Hyr në akademi"}</h1>
  <p>${reg?"Regjistrohu me emailin tënd. Pasi shefi të miratojë llogarinë, mund të fillosh trajnimin.":"Trajnimi i stafit të restorantit dhe barit sipas standardeve Forbes."}</p>
  <form id="af" style="display:grid;gap:12px">
   <label>Email<input id="ae" type="email" autocomplete="email" required></label>
   <label>Fjalëkalimi<input id="ap" type="password" autocomplete="${reg?"new-password":"current-password"}" minlength="8" required></label>
   ${msg?`<div class="${msg.ok?"ok":"err"}">${esc(msg.t)}</div>`:""}
   <button type="submit">${reg?"Regjistrohu":"Hyr"}</button></form>
  <button class="link" id="asw">${reg?"Ke llogari? Hyr":"Nuk ke llogari? Regjistrohu"}</button>
  ${reg?"":`<button class="link" id="afg">Harrova fjalëkalimin</button>`}`);
  gate.querySelector("#asw").onclick=()=>loginForm(reg?"in":"reg");
  const fg=gate.querySelector("#afg");if(fg)fg.onclick=async()=>{const e=gate.querySelector("#ae").value.trim();if(!e){loginForm("in",{t:"Shkruaj emailin sipër, pastaj kliko “Harrova fjalëkalimin”."});return}
    const {error}=await sb.auth.resetPasswordForEmail(e,{redirectTo:location.origin+location.pathname});loginForm("in",error?{t:error.message}:{ok:1,t:"Të dërguam një email për të ndryshuar fjalëkalimin."})};
  gate.querySelector("#af").onsubmit=async ev=>{ev.preventDefault();
    const email=gate.querySelector("#ae").value.trim(),password=gate.querySelector("#ap").value;
    const b=gate.querySelector("button[type=submit]");b.disabled=true;b.textContent="Prit…";
    if(reg){const {data,error}=await sb.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});
      if(error)return loginForm("reg",{t:error.message});
      if(!data.session)return loginForm("in",{ok:1,t:"Të dërguam një email konfirmimi. Hape, konfirmo, pastaj hyr këtu."});
    }else{const {error}=await sb.auth.signInWithPassword({email,password});if(error)return loginForm("in",{t:error.message==="Invalid login credentials"?"Email ose fjalëkalim i gabuar.":error.message})}
    start();
  };
}
function pending(email){
  showGate(`<h1>Në pritje të miratimit</h1><p>Llogaria <b>${esc(email)}</b> u krijua. Shefi duhet ta miratojë para se të fillosh. Rifresko faqen pasi të të njoftojë.</p>
  <button id="arf">Rifresko</button><button class="link" id="alo">Dil</button>`);
  gate.querySelector("#arf").onclick=()=>location.reload();
  gate.querySelector("#alo").onclick=async()=>{await sb.auth.signOut();location.reload()};
}
function newPassForm(){
  showGate(`<h1>Fjalëkalim i ri</h1><form id="anp" style="display:grid;gap:12px"><label>Fjalëkalimi i ri<input id="anpv" type="password" minlength="8" required></label><button>Ruaje</button></form>`);
  gate.querySelector("#anp").onsubmit=async e=>{e.preventDefault();const {error}=await sb.auth.updateUser({password:gate.querySelector("#anpv").value});if(error){alert(error.message);return}start()};
}

/* ---- db shim me të njëjtin API që përdor app-i ---- */
function makeDb(uid){
  const T={staff:"academy_staff",audits:"academy_audits"};
  const snap=(row)=>({exists:!!row,data:()=>row?row.data:undefined});
  function doc(path){const [col,id]=path.split("/");const tbl=T[col];
    const get=async()=>{const {data,error}=await sb.from(tbl).select("id,data").eq("id",id).maybeSingle();if(error)throw error;return data};
    return {
      async set(obj){const {error}=await sb.from(tbl).upsert({id,data:obj,updated_at:new Date().toISOString()});if(error)throw error},
      async update(patch){const cur=await get();const data=Object.assign({},cur?cur.data:{},patch);const {error}=await sb.from(tbl).upsert({id,data,updated_at:new Date().toISOString()});if(error)throw error},
      onSnapshot(cb,err){get().then(r=>cb(snap(r))).catch(e=>err&&err(e));return ()=>{}}
    }}
  function collection(col){const tbl=T[col];let lim=500;
    const q={orderBy(){return q},limit(n){lim=n;return q},
      async add(rec){const {error}=await sb.from(tbl).insert({data:rec,created_by:uid});if(error)throw error;q._refresh&&q._refresh()},
      onSnapshot(cb,err){const run=async()=>{let r=sb.from(tbl).select("id,data").limit(lim);if(tbl==="academy_audits")r=r.order("created_at",{ascending:false});const {data,error}=await r;if(error){err&&err(error);return}
          cb({docs:data.map(x=>({id:x.id,data:()=>x.data}))})};
        run();const t=setInterval(run,60000);q._refresh=run;window.__academyRefresh=(window.__academyRefresh||[]).concat(run);return ()=>clearInterval(t)}};
    return q}
  return {doc,collection};
}

/* ---- paneli i miratimeve për shefin ---- */
let members=[],memLoaded=false,myUid=null;
async function loadMembers(){const {data}=await sb.from("academy_members").select("*").order("created_at",{ascending:false});members=data||[];memLoaded=true;if((location.hash||"").includes("paneli"))window.dispatchEvent(new HashChangeEvent("hashchange"))}
window.academyAdmin={html(){
  if(!memLoaded){loadMembers();return ""}
  const pend=members.filter(m=>!m.approved), act=members.filter(m=>m.approved);
  const row=m=>`<tr><td>${esc(m.email)}</td><td>${m.approved?(m.is_manager?"Shef":"Staf"):"Në pritje"}</td><td>${
    m.user_id===myUid?'<span class="muted" style="font-size:13px">Ti</span>':m.approved?`${m.is_manager?`<button data-am="unmgr" data-id="${m.user_id}">Hiq si shef</button>`:`<button data-am="mgr" data-id="${m.user_id}">Bëje shef</button>`}<button data-am="block" data-id="${m.user_id}">Çaktivizo</button>`
    :`<button class="pri" data-am="ok" data-id="${m.user_id}">Mirato</button><button data-am="del" data-id="${m.user_id}">Refuzo</button>`}</td></tr>`;
  return `<section class="card stack adm" style="margin-bottom:18px"><p class="eyebrow">Llogaritë e stafit</p>
  ${pend.length?`<p><b>${pend.length} në pritje të miratimit</b></p>`:'<p class="muted" style="font-size:14px">Asnjë kërkesë në pritje. Stafi regjistrohet vetë te linku i platformës.</p>'}
  <div class="tablewrap"><table><thead><tr><th>Email</th><th>Statusi</th><th></th></tr></thead><tbody>${pend.concat(act).map(row).join("")}</tbody></table></div></section>`;
}};
document.addEventListener("click",async e=>{const b=e.target.closest("[data-am]");if(!b)return;const id=b.dataset.id,a=b.dataset.am;
  if(a==="del"&&!confirm("Ta refuzosh këtë kërkesë?"))return;
  const q=sb.from("academy_members");
  const {error}=a==="ok"?await q.update({approved:true}).eq("user_id",id):a==="mgr"?await q.update({is_manager:true}).eq("user_id",id):a==="unmgr"?await q.update({is_manager:false}).eq("user_id",id):a==="block"?await q.update({approved:false,is_manager:false}).eq("user_id",id):await q.delete().eq("user_id",id);
  if(error){alert(error.message);return}await loadMembers();(window.__academyRefresh||[]).forEach(f=>f())});

/* ---- startimi ---- */
let resolveReady;const ready=new Promise(r=>resolveReady=r);
window.claude={use:async(k)=>{const ctx=await ready;return k==="db"?ctx.db:ctx.user}};
async function start(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session){loginForm("in");return}
  const {data:m,error}=await sb.rpc("academy_join");
  if(error){loginForm("in",{t:error.message});return}
  if(!m.approved){pending(session.user.email);return}
  hideGate();
  const uid=session.user.id;myUid=uid;
  addLogout();
  resolveReady({db:makeDb(uid),user:{id:async()=>uid,canEdit:async()=>!!m.is_manager}});
}
function addLogout(){const w=document.getElementById("who");if(!w||document.getElementById("alog"))return;const b=document.createElement("button");b.id="alog";b.textContent="Dil";b.style.cssText="font:inherit;font-size:13px;padding:4px 10px;border:1px solid var(--line,#ccc);border-radius:999px;background:transparent;cursor:pointer;margin-left:8px";b.onclick=async()=>{await sb.auth.signOut();location.reload()};w.parentNode.appendChild(b)}
sb.auth.onAuthStateChange(ev=>{if(ev==="PASSWORD_RECOVERY")newPassForm()});
if(/type=recovery/.test(location.hash))newPassForm();else start();
})();
