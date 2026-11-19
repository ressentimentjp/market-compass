/* Market Compass 0.2 — workspace, source audit, pricing, Codex handoff */
'use strict';
const WS_KEY='marketcompass-workspace-v02';
const WS_DB_KEY='workspace-v02';
let ws={version:2,activeId:null,projects:[],updatedAt:''};
let workspaceLoaded=false;
let workspaceSaveTimer=null;
const projectId=()=> 'p_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
const clone=value=>JSON.parse(JSON.stringify(value));
const currentProject=()=>ws.projects.find(p=>p.id===ws.activeId);

async function initializeWorkspace(){
  let raw=null, dbRaw=null;
  try{raw=JSON.parse(localStorage.getItem(WS_KEY)||'null');}catch{}
  try{
    const db=await dbOpen();
    const content=await new Promise((resolve,reject)=>{
      const tx=db.transaction('data','readonly');const req=tx.objectStore('data').get(WS_DB_KEY);
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
    if(content)dbRaw=JSON.parse(content);
  }catch(e){console.warn('workspace IndexedDB unavailable:',e.message)}
  if(dbRaw && (!raw||dbRaw.updatedAt>raw.updatedAt))raw=dbRaw;
  if(raw?.version===2 && Array.isArray(raw.projects) && raw.projects.length){
    ws=raw;
    if(!currentProject())ws.activeId=ws.projects[0].id;
    swapState(clone(currentProject().data));
  }else{
    const id=projectId();
    ws={version:2,activeId:id,projects:[{id,title:st.productName||st.idea||'新しい企画',data:clone(st),updatedAt:date()}],updatedAt:date()};
  }
  st.evidence??=[];
  st.marketPersona??='';st.marketDemand??='';
  st.unitEconomics??={users:1000,rate:5,fee:490,commission:3.6,variable:35,fixed:10000};
  st.handoffTask??='P0機能の動く試作を実装し、テスト結果と未検証の問題を報告する。';
  st.handoffRepo??='';
  workspaceLoaded=true;
  updateProjectPicker();
}
function swapState(data){
  for(const key of Object.keys(st))delete st[key];
  Object.assign(st,{
    version:1,idea:'',term:'',termEn:'',target:'',region:'jp',timestamp:null,
    apps:[],repos:[],voices:[],sources:{},features:[],productName:'',problem:'',
    platform:'Web / スマホ・PC共通',pricing:'',evidence:[],marketPersona:'',marketDemand:'',
    unitEconomics:{users:1000,rate:5,fee:490,commission:3.6,variable:35,fixed:10000},
    handoffTask:'P0機能の動く試作を実装し、テスト結果と未検証の問題を報告する。',handoffRepo:''
  },data);
  if(!Array.isArray(st.evidence))st.evidence=[];
}
function snapshotActive(){
  if(!workspaceLoaded)return;
  const p=currentProject();if(!p)return;
  p.data=clone(st);
  p.title=(st.productName&&st.productName!=='新しいプロダクト'?st.productName:(st.idea||p.title)).trim().slice(0,44)||'新しい企画';
  p.updatedAt=date();ws.updatedAt=date();
}
function saveWorkspace(){
  if(!workspaceLoaded)return;
  snapshotActive();
  clearTimeout(workspaceSaveTimer);
  workspaceSaveTimer=setTimeout(async()=>{
    const content=JSON.stringify(ws);
    try{if(content.length<3_000_000)localStorage.setItem(WS_KEY,content);else localStorage.removeItem(WS_KEY);}catch(e){console.warn('Local storage unavailable',e)}
    try{
      const db=await dbOpen();
      await new Promise((resolve,reject)=>{const tx=db.transaction('data','readwrite');tx.objectStore('data').put(content,WS_DB_KEY);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
    }catch(e){console.warn('Workspace write failed',e)}
  },250);
  updateProjectPicker();
}
async function flushWorkspace(){
  if(!workspaceLoaded)return;
  snapshotActive();clearTimeout(workspaceSaveTimer);
  const content=JSON.stringify(ws);
  try{if(content.length<3_000_000)localStorage.setItem(WS_KEY,content)}catch{}
  try{const db=await dbOpen();await new Promise((resolve,reject)=>{let tx=db.transaction('data','readwrite');tx.objectStore('data').put(content,WS_DB_KEY);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}catch{}
}
function updateProjectPicker(){
  const sel=$('project-select');if(!sel)return;
  const focus=sel.value;
  sel.replaceChildren();
  for(const p of ws.projects){const opt=document.createElement('option');opt.value=p.id;opt.textContent=p.title||'無題の企画';sel.appendChild(opt)}
  sel.value=ws.activeId;
  $('project-count').textContent=ws.projects.length;
}
async function changeProject(id){
  if(running){toast('調査中はプロジェクトを切り替えられないよ。',true);updateProjectPicker();return;}
  if(id===ws.activeId)return;
  getForm();await flushWorkspace();
  const next=ws.projects.find(p=>p.id===id);if(!next)return;
  ws.activeId=id;swapState(clone(next.data));putForm();updateProjectPicker();renderAll();renderExtension('market');
  if(!st.timestamp)toast('プロジェクトを切り替えたよ。調査はまだ実行されていない。');else toast('保存済みのプロジェクトを表示している。情報は取得日時時点のものだよ。');
  saveWorkspace();
}
const emptyProject=name=>({version:1,idea:name,term:'',termEn:'',target:'',region:'jp',timestamp:null,apps:[],repos:[],voices:[],sources:{},features:[],productName:name,problem:'',platform:'Web / スマホ・PC共通',pricing:'',evidence:[],marketPersona:'',marketDemand:'',unitEconomics:{users:1000,rate:5,fee:490,commission:3.6,variable:35,fixed:10000},handoffTask:'P0機能の動く試作を実装し、テスト結果と未検証の問題を報告する。',handoffRepo:''});
async function addProject(duplicate=false){
  if(running)return;
  const title=prompt(duplicate?'複製プロジェクト名':'新しいプロジェクト名',duplicate?(st.productName||st.idea||'プロジェクト')+' のコピー':'新しい企画');
  if(!title?.trim())return;
  getForm();await flushWorkspace();
  const id=projectId();ws.projects.push({id,title:title.trim().slice(0,44),updatedAt:date(),data:duplicate?clone(st):emptyProject(title.trim())});
  ws.activeId=id;swapState(ws.projects[ws.projects.length-1].data);putForm();renderAll();saveWorkspace();toast(duplicate?'プロジェクトを複製したよ。':'新規プロジェクトを作成したよ。');navigate('overview');
}
async function deleteProject(){
  if(ws.projects.length===1){toast('最後のプロジェクトは削除できないよ。',true);return;}
  if(!confirm(`「${currentProject().title}」とその調査データをこの端末から削除する？`))return;
  ws.projects=ws.projects.filter(p=>p.id!==ws.activeId);ws.activeId=ws.projects[0].id;
  swapState(clone(ws.projects[0].data));putForm();renderAll();saveWorkspace();toast('プロジェクトを削除したよ。');
}
function checkResearch(){return [
  ['対象市場','誰に売るか、どんな状況で使うか',Boolean(st.marketPersona||st.target)],
  ['市場規模','母集団・普及率・出典に基づく推計',false],
  ['需要の証拠','レビュー/アンケート/検索需要などで確認',Boolean(st.voices.length||st.marketDemand)],
  ['競合料金','買い切りとサブスクを分けて確認',Boolean(st.apps.length)],
  ['支払意思','インタビューや課金テストで検証',false],
  ['継続利用','小規模リリース後に測定',false],
 ];}
function renderMarket(){
  $('market-app-count').textContent=st.timestamp?st.apps.length:'—';
  $('market-repo-count').textContent=st.timestamp?st.repos.length:'—';
  $('market-voice-count').textContent=st.timestamp?st.voices.length:'—';
  $('market-persona').value=st.marketPersona||'';
  $('market-demand').value=st.marketDemand||'';
  $('market-checklist').innerHTML=checkResearch().map(([name,sub,done])=>`<div class="check-item"><span class="check-icon ${done?'complete':''}">${done?'✓':'•'}</span><div><strong>${escapeHTML(name)}</strong><small>${escapeHTML(sub)}</small></div></div>`).join('');
}
function calcNumbers(){const x=st.unitEconomics;const users=Math.max(0,Number(x.users)||0),r=Math.min(100,Math.max(0,Number(x.rate)||0))/100,fee=Math.max(0,Number(x.fee)||0),comm=Math.min(100,Math.max(0,Number(x.commission)||0))/100;
  const gross=users*r*fee;const after=gross*(1-comm),cost=users*Math.max(0,Number(x.variable)||0)+Math.max(0,Number(x.fixed)||0);
  return {users,payers:users*r,gross,after,cost,profit:after-cost,variable:users*Math.max(0,Number(x.variable)||0)};
}
function renderPricing(){
  const p=st.unitEconomics||{};
  for(const [id,key] of [['calc-users','users'],['calc-rate','rate'],['calc-fee','fee'],['calc-commission','commission'],['calc-variable','variable'],['calc-fixed','fixed']])$(id).value=p[key]??0;
  const n=calcNumbers();const yen=x=>Math.round(x).toLocaleString('ja-JP');
  $('calc-output').innerHTML=`<div class="fin-value ${n.profit<0?'negative':''}"><small>月間概算損益</small><strong>${n.profit<0?'−':''}¥${yen(Math.abs(n.profit))}</strong><span>会員推計 ${yen(n.payers)}人</span></div><div class="fin-line"><span>課金総額</span><strong>¥${yen(n.gross)}</strong></div><div class="fin-line"><span>決済手数料控除後</span><strong>¥${yen(n.after)}</strong></div><div class="fin-line"><span>変動費（全利用者）</span><strong>−¥${yen(n.variable)}</strong></div><div class="fin-line"><span>固定費</span><strong>−¥${yen(Number(p.fixed)||0)}</strong></div>`;
  const prices=collectedPrices();$('pricing-evidence').textContent=st.apps.length?`無料 ${st.apps.filter(a=>a.price===0).length}件・有料 ${prices.length}件。初期購入価格の中央値：${prices.length?money(median(prices),st.region):'対象なし'}。サブスクは未集計。`:'アプリ価格データなし。取得後に初期購入価格のみ表示。';
}
function renderAudit(){
  const names={apple:'Apple App Store',github:'GitHub',hn:'Hacker News'};
  $('sources-audit').innerHTML=Object.keys(names).map(key=>{
    const s=st.sources?.[key];return `<div class="source-item"><div><strong>${names[key]}</strong><small>${s?escapeHTML(s.message):'未取得'} / ${s?.at?new Date(s.at).toLocaleString('ja-JP'):'取得日時なし'}</small></div><strong class="${s?(s.ok?'source-ok':'source-fail'):''}">${s?(s.ok?`${s.count}件`:'失敗'):'未調査'}</strong></div>`;
  }).join('');
  const box=$('evidence-list');
  if(!st.evidence?.length){box.innerHTML='<div class="empty">根拠・仮説はまだ登録されていないよ。右上の「根拠を追加」から入力してね。</div>';return;}
  box.innerHTML=st.evidence.map((e,i)=>`<div class="evidence-item" data-id="${escapeHTML(e.id)}"><div><span class="evidence-type ${e.type}">${({fact:'確認済みの事実',hypothesis:'未検証の仮説',unknown:'未確認'})[e.type]||'未確認'}</span><small>${escapeHTML(e.date||'')}</small></div><strong>${escapeHTML(e.title)}</strong><p>${escapeHTML(e.note||'')}</p><div class="evidence-actions">${safeURL(e.url)!=='#'?`<a target="_blank" rel="noopener" href="${safeURL(e.url)}">出典を開く ↗</a>`:'出典なし'}<button class="small-btn" data-remove="${escapeHTML(e.id)}">削除</button></div></div>`).join('');
  all('[data-remove]',box).forEach(btn=>btn.addEventListener('click',()=>{if(!confirm('この項目を削除する？'))return;st.evidence=st.evidence.filter(x=>x.id!==btn.dataset.remove);save();renderAudit()}));
}
function addEvidence(){
  const title=prompt('確認した事実 / 仮説の見出し');if(!title?.trim())return;
  const type=prompt('種類を入力：fact（確認済み） / hypothesis（仮説） / unknown（未確認）','hypothesis');
  const t=['fact','hypothesis','unknown'].includes(type)?type:'unknown';
  const url=prompt('出典URL（なければ空欄）','')||'';
  const note=prompt('内容・根拠・残っている疑問','')||'';
  st.evidence??=[];st.evidence.push({id:projectId(),title:title.trim().slice(0,160),type:t,url:safeURL(url),note:note.slice(0,2000),date:date()});
  save();renderAudit();toast('調査ノートに追加したよ。URLを登録しても自動で事実の検証はされない点に注意。');
}
function renderExtension(target){
  if(target==='market')renderMarket();
  else if(target==='pricing')renderPricing();
  else if(target==='sources')renderAudit();
  else if(target==='handoff')renderHandoff();
}
function currentSourceLog(){return {
  retrievedAt:st.timestamp,sourceStatus:st.sources,
  apps:st.apps.map(a=>({name:a.name,url:a.url,price:a.price,currency:a.currency,rating:a.rating,ratingCount:a.ratingCount})),
  github:st.repos.map(r=>({name:r.name,url:r.url,stars:r.stars,license:r.license})),
  voices:st.voices.map(v=>({source:v.source,kind:v.kind,product:v.product||null,text:v.text,rating:v.rating??null,url:v.url||null,date:v.date||null})),
  notes:st.evidence||[],limitations:[
    'App Storeの価格は買い切りの初期価格のみ。サブスク料金ではない。',
    'GitHub starsやHN投稿数を市場規模や実際の売上として扱わない。',
    '手動で入力した事実はURLの有無にかかわらず独立に再検証が必要。',
    'レビューは偏ったサンプルで、分類は辞書ベースの簡易推定。'
  ]
};}
function codexTaskText(){
  getForm();
  const repo=(st.handoffRepo||'未設定').trim();
  return [`# Codex 開発タスク`,``,`## 目標`,`企画「${st.productName||st.idea||'新しいプロダクト'}」のMVPを実装・検証する。`,``,`## 作業指示`,st.handoffTask||'P0のみ実装する。',``,`## リポジトリ`,repo,``,`## 作業順序`,`1. リポジトリにある現在のコードとREADME、PROJECT_BRIEF.md、RESEARCH_EVIDENCE.jsonを読む。`,`2. 未確認事項をリストアップし、事実と市場仮説を混ぜない。`,`3. PROJECT_BRIEF.mdのP0機能を小さな単位に分けて実装する。`,`4. 自動テストと、可能ならUIの動作確認を行う。`,`5. 変更ファイル、実行したテスト、失敗した項目、残課題を報告する。`,`6. 公開・課金・外部送信・APIキーの追加は明示の承認があるまで行わない。`,``,`## 受入条件`,`- [ ] P0機能が操作できる`,`- [ ] 異常系でクラッシュしない`,`- [ ] アクセスキーや秘密情報をコミットしない`,`- [ ] 調査の出典と未確認の仮説を区別する`,`- [ ] ローカルまたはクラウドのテスト結果を残す`,``,`## ユーザーへの報告`,`未完成の箇所や実機未検証の箇所を明示して報告。`].join('\n');
}
function agentsInstructions(){return `# AGENTS.md\n\n## Project rules\n- 言語: 日本語で進捗と結果を説明。\n- 根拠のない市場データ、価格、レビューを生成しない。\n- 調査結果と仮説を分ける。\n- 動作検証していないコードを検証済みと報告しない。\n- ユーザーの承認なしに公開、送金、課金APIの本番登録、秘密情報の送信を実行しない。\n- 既存のコードを確認してから必要最小限の変更を行う。\n- ファイル・テスト結果・残課題を明示する。\n`}
function readmeHandoff(){return `# Market Compass → Codex 引き継ぎ\n\nこのパックは **自動でCodexを実行しない**。ユーザーの承認を伴う手動引き継ぎ用。\n\n1. すでにアプリのソースがGitHubにある場合、そのリポジトリへZIP内のファイルを追加。\n2. Codex Cloud (https://chatgpt.com/codex/) で同じリポジトリを選択。\n3. CODEX_TASK.mdの指示を送る。\n4. Codexの変更とテスト結果を確認してからマージ。\n\nPROJECT_BRIEF.md: 企画とMVP。\nCODEX_TASK.md: 指示、受入条件。\nAGENTS.md: 作業上のルール。\nRESEARCH_EVIDENCE.json: 収集した情報・出典・未検証メモ。\n\n注：ZIPに含まれるのは**引き継ぎ資料**であり、アプリのソースコード自体ではない。\n`}
function renderHandoff(){
  $('handoff-task').value=st.handoffTask||'';
  $('handoff-repo').value=st.handoffRepo||'';
}
function crc32(buf){let c=0xFFFFFFFF;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xEDB88320:0)}return (c^0xFFFFFFFF)>>>0;}
function zipStored(files){
  const enc=new TextEncoder();const local=[];const central=[];let offset=0;
  for(const [filename,body] of Object.entries(files)){
    const name=enc.encode(filename),bytes=enc.encode(body);const crc=crc32(bytes);
    const a=new Uint8Array(30+name.length+bytes.length),view=new DataView(a.buffer);
    view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x800,true);
    view.setUint16(8,0,true);view.setUint32(14,crc,true);view.setUint32(18,bytes.length,true);view.setUint32(22,bytes.length,true);view.setUint16(26,name.length,true);
    a.set(name,30);a.set(bytes,30+name.length);local.push(a);
    const b=new Uint8Array(46+name.length),cv=new DataView(b.buffer);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);
    cv.setUint16(10,0,true);cv.setUint32(16,crc,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);
    cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);b.set(name,46);central.push(b);offset+=a.length;
  }
  const cdLength=central.reduce((s,b)=>s+b.length,0);const end=new Uint8Array(22),ev=new DataView(end.buffer);
  ev.setUint32(0,0x06054b50,true);ev.setUint16(8,central.length,true);ev.setUint16(10,central.length,true);ev.setUint32(12,cdLength,true);ev.setUint32(16,offset,true);
  return new Blob([...local,...central,end],{type:'application/zip'});
}
function downloadHandoff(){
  getForm();const files={
    'PROJECT_BRIEF.md':makeReport(),
    'CODEX_TASK.md':codexTaskText(),
    'AGENTS.md':agentsInstructions(),
    'RESEARCH_EVIDENCE.json':JSON.stringify(currentSourceLog(),null,2),
    'README_HANDOFF.md':readmeHandoff()
  };
  const blob=zipStored(files);const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='MarketCompass_Codex_Handoff.zip';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  save();toast('引き継ぎZIPを生成したよ。Codexの自動起動や課金は行われていない。');
}
async function copyHandoff(){
  const t=codexTaskText();try{await navigator.clipboard.writeText(t);toast('Codexへの指示をコピーしたよ。')}catch{download('CODEX_TASK.md',t,'text/markdown;charset=utf-8');toast('コピー不可のため指示をダウンロードしたよ。')}
}
async function importWorkspace(file){
  try{const data=JSON.parse(await file.text());if(data.version!==2||!Array.isArray(data.projects)||!data.projects.length)throw new Error('v0.2のワークスペースJSONではない');
    if(!confirm('現在の複数プロジェクトをこのバックアップで置き換える？'))return;
    ws=data;ws.activeId=ws.projects.some(p=>p.id===data.activeId)?data.activeId:ws.projects[0].id;
    swapState(clone(currentProject().data));putForm();renderAll();updateProjectPicker();await flushWorkspace();toast('複数プロジェクトを復元したよ。');
  }catch(e){toast('復元できなかった：'+e.message,true)}
}
function wireExtensions(){
  $('project-select').addEventListener('change',e=>changeProject(e.target.value));
  $('project-new').addEventListener('click',()=>addProject(false));
  $('project-duplicate').addEventListener('click',()=>addProject(true));
  $('project-delete').addEventListener('click',deleteProject);
  for(const [id,field] of [['market-persona','marketPersona'],['market-demand','marketDemand'],['handoff-task','handoffTask'],['handoff-repo','handoffRepo']]){
    $(id).addEventListener('change',e=>{st[field]=e.target.value;save();renderExtension(id.startsWith('market-')?'market':'handoff')});
  }
  for(const [id,key] of [['calc-users','users'],['calc-rate','rate'],['calc-fee','fee'],['calc-commission','commission'],['calc-variable','variable'],['calc-fixed','fixed']]){
    $(id).addEventListener('input',e=>{st.unitEconomics[key]=Math.max(0,Number(e.target.value)||0);save();renderPricing()});
  }
  $('add-evidence').addEventListener('click',addEvidence);
  $('handoff-zip').addEventListener('click',downloadHandoff);
  $('handoff-copy').addEventListener('click',copyHandoff);
  $('export-workspace').addEventListener('click',async()=>{getForm();await flushWorkspace();download('MarketCompass_Workspace_Backup.json',JSON.stringify(ws,null,2),'application/json')});
  $('import-workspace').addEventListener('change',async e=>{if(e.target.files?.[0])await importWorkspace(e.target.files[0]);e.target.value='';});
  renderMarket();renderPricing();renderAudit();renderHandoff();
}
