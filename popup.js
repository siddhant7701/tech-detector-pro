// Tech Detector Pro v3.1 — Popup Script
'use strict';

let state = { data:null, frozen:false, activeTab:'overview', linkCheckResults:null, linkCheckRunning:false };

/* ── Utilities ─────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function el(tag,cls,html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; }
function toast(msg, dur=2200){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(t._to); t._to=setTimeout(()=>t.classList.remove('show'), dur); }
function copyText(text){ navigator.clipboard.writeText(text).then(()=>toast('✓ Copied!')); }
function downloadJSON(obj, name){ const b=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=name; a.click(); }
function downloadCSV(rows, headers, name){ const csv=[headers.join(','),...rows.map(r=>headers.map(h=>JSON.stringify(r[h]??'')).join(','))].join('\n'); const b=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=name; a.click(); }
function truncate(s,n){ return s&&s.length>n?s.slice(0,n)+'…':(s||''); }
function safeUrl(h){ try{ return new URL(h).hostname; }catch(e){ return h.slice(0,40); } }
function hasStorage(){ return typeof chrome!=='undefined'&&chrome.storage?.local; }

/* ── Tab switching ─────────────────────────────────────────────── */
function setTab(name){
  state.activeTab=name;
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===name));
  document.querySelectorAll('.panel').forEach(p=>p.style.display='none');
  const p=$(`tab-${name}`);
  if(p) p.style.display='flex';
}

/* ── Render all ────────────────────────────────────────────────── */
function renderAll(data){
  $('siteHostname').textContent = data.hostname||'—';
  const sb=$('securityBadge');
  if(sb&&data.security){
    sb.textContent = data.security.isHTTPS ? '🔒 HTTPS' : '⚠️ HTTP';
    sb.className = 'security-badge '+(data.security.isHTTPS?'https':'http');
    sb.style.display='block';
  }
  renderOverview(data);
  renderCMSTheme(data);
  renderIssues(data);
  renderSEO(data);
  renderLinks(data);
  renderImages(data);
  renderForms(data);
  renderResources(data);
  renderRaw(data);
  $('emptyState').style.display='none';
  $('loadingState').style.display='none';
  const ap=$('tab-'+state.activeTab);
  if(ap) ap.style.display='flex';
}

/* ═══════════════════════════════════════════════════════════════
   OVERVIEW
═══════════════════════════════════════════════════════════════ */
function renderOverview(data){
  const s=data.stats;
  $('statRow').innerHTML=[
    {v:s.linkCount,  k:'Links'},
    {v:s.imageCount, k:'Images'},
    {v:s.scriptCount,k:'Scripts'},
    {v:s.formCount,  k:'Forms'},
    {v:s.techCount||data.technologies.length, k:'Tech'},
    {v:s.wordCount,  k:'Words'},
    {v:s.metaCount,  k:'Metas'},
    {v:s.headingCount,k:'Headings'},
  ].map(s=>`<div class="stat-box"><div class="stat-val">${s.v}</div><div class="stat-key">${s.k}</div></div>`).join('');

  // Category filter
  const cf=$('techCatFilter');
  if(cf){
    const cats=[...new Set(data.technologies.map(t=>t.category))].sort();
    cf.innerHTML='<option value="all">All Categories</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  }
  renderTechList(data.technologies,'','all');

  // Page info
  const fields=[
    {label:'Title',          val:data.title},
    {label:'Charset',        val:data.charset},
    {label:'Language',       val:data.lang||(data.seo?.lang)||'(not set)'},
    {label:'Doctype',        val:data.doctype},
    {label:'Internal Links', val:s.internalLinks},
    {label:'External Links', val:s.externalLinks},
    {label:'Missing Alt',    val:`${s.missingAltImages} images`},
    {label:'Broken Images',  val:`${s.brokenImages||0}`, cls:(s.brokenImages>0?'red':'')},
    {label:'Nofollow Links', val:s.nofollowLinks},
    {label:'Protocol',       val:data.security?.isHTTPS?'✅ HTTPS':'⚠️ HTTP', cls:data.security?.isHTTPS?'green':'red'},
    {label:'Inline Scripts', val:data.inlineScripts},
    {label:'Scanned',        val:new Date(data.scannedAt).toLocaleTimeString()},
  ];
  $('pageInfo').innerHTML=`<div class="info-grid">${fields.map(f=>`<div class="info-item"><div class="info-label">${esc(f.label)}</div><div class="info-val ${f.cls||''}">${esc(truncate(String(f.val),60))}</div></div>`).join('')}</div>`;

  // Colors
  const cs=$('colorSection'), cp=$('colorPalette');
  if(data.colors?.length>0){
    cs.style.display='block';
    cp.innerHTML=`<div class="color-grid">${data.colors.map(c=>`<div class="color-swatch" title="Click to copy: ${esc(c.value)}" onclick="navigator.clipboard.writeText('${esc(c.value)}');"><div class="color-circle" style="background:${esc(c.value)}"></div><div class="color-val">${esc(c.value.length>10?c.value.slice(0,9)+'…':c.value)}</div></div>`).join('')}</div>`;
  } else { cs.style.display='none'; }

  // Social
  const ss=$('socialSection'), sl=$('socialLinks');
  const socials=Object.entries(data.social||{});
  if(socials.length>0){
    ss.style.display='block';
    const icons={twitter:'🐦',instagram:'📸',facebook:'👍',linkedin:'💼',youtube:'▶️',tiktok:'🎵',github:'🐙',pinterest:'📌',discord:'💬'};
    sl.innerHTML=`<div class="social-grid">${socials.map(([p,info])=>`<a class="social-btn" href="${esc(info.url)}" target="_blank"><span>${icons[p]||'🔗'}</span><span>${esc(p.charAt(0).toUpperCase()+p.slice(1))}</span></a>`).join('')}</div>`;
  } else { ss.style.display='none'; }
}

function renderTechList(technologies, textFilter, catFilter){
  const list=$('techList');
  if(!list) return;
  if(!technologies.length){ list.innerHTML='<div style="color:var(--muted);font-size:12px;padding:10px 0">No technologies detected</div>'; return; }
  let filtered=[...technologies];
  if(textFilter){ const lf=textFilter.toLowerCase(); filtered=filtered.filter(t=>t.name.toLowerCase().includes(lf)||t.category.toLowerCase().includes(lf)); }
  if(catFilter&&catFilter!=='all') filtered=filtered.filter(t=>t.category===catFilter);
  if(!filtered.length){ list.innerHTML='<div style="color:var(--muted);font-size:12px;padding:10px 0">No tech matches filter</div>'; return; }
  const cats={};
  filtered.forEach(t=>{ if(!cats[t.category]) cats[t.category]=[]; cats[t.category].push(t); });
  list.innerHTML='';
  for(const [cat,techs] of Object.entries(cats)){
    list.appendChild(el('div','cat-group-label',esc(cat)));
    techs.forEach(tech=>{
      const card=el('div','tech-card');
      card.innerHTML=`<div class="tech-top"><div class="tech-left"><div class="tech-icon" style="border:1.5px solid ${tech.color}33">${tech.icon}</div><div><div class="tech-name">${esc(tech.name)}</div><div class="tech-meta">${tech.version?'v'+esc(tech.version):esc(tech.category)}</div></div></div><div class="tech-right"><span class="cat-badge">${esc(tech.category)}</span><span class="expand-icon">▾</span></div></div><div class="tech-details"><div class="detail-row"><div class="detail-label">Category</div><div class="detail-val">${esc(tech.category)}</div></div>${tech.version?`<div class="detail-row"><div class="detail-label">Version</div><div class="detail-val">${esc(tech.version)}</div></div>`:''}<div class="detail-row"><div class="detail-label">Official Link</div><div class="detail-val"><a href="${esc(tech.link)}" target="_blank">${esc(tech.link)}</a></div></div></div>`;
      card.querySelector('.tech-top').addEventListener('click',()=>card.classList.toggle('open'));
      list.appendChild(card);
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   CMS & THEME
═══════════════════════════════════════════════════════════════ */
function renderCMSTheme(data){
  const container=$('cmsThemeContent');
  if(!container) return;
  const cms=data.cmsInfo;
  const theme=data.themeInfo;
  const stack=data.stack||{};

  if(!cms){
    // Custom / headless site
    let stackHtml='';
    const all=[...(stack.frontend||[]),...(stack.backend||[]),...(stack.hosting||[])];
    if(all.length){
      stackHtml=`<div class="section-title" style="margin-top:16px">Detected Stack</div><div class="stack-grid">${all.map(s=>`<a class="stack-pill" href="${esc(s.link)}" target="_blank" style="border-color:${s.color}33"><span>${s.icon}</span><span>${esc(s.name)}</span></a>`).join('')}</div>`;
    }
    container.innerHTML=`<div class="no-cms-card"><div class="no-cms-icon">🏗️</div><div class="no-cms-title">No CMS Detected</div><div class="no-cms-sub">This appears to be a custom-built or headless site.<br>Check the <b>Overview</b> tab for detected technologies.</div></div>${stackHtml}`;
    return;
  }

  // Build theme card
  let themeHtml='';
  if(theme){
    const storeBtn=theme.storeUrl?`<a class="view-theme-btn" href="${esc(theme.storeUrl)}" target="_blank"><span>View in Theme Store</span><span class="btn-arrow">→</span></a>`:'';
    const browseBtn=theme.browseUrl&&!theme.storeUrl?`<a class="view-theme-btn secondary" href="${esc(theme.browseUrl)}" target="_blank"><span>Browse Themes</span><span class="btn-arrow">→</span></a>`:'';

    const badges=[
      theme.confidence?`<span class="theme-badge confidence-${esc(theme.confidence)}">${esc(theme.confidence)} detection</span>`:'',
      theme.role?`<span class="theme-badge role-${esc(theme.role)}">${esc(theme.role)}</span>`:'',
    ].filter(Boolean).join('');

    const infoItems=[];
    if(theme.id&&theme.id!=='undefined'&&theme.id!=='0') infoItems.push({l:'Theme ID',    v:theme.id});
    if(theme.handle)      infoItems.push({l:'Handle',     v:theme.handle});
    if(theme.slug)        infoItems.push({l:'Slug',       v:theme.slug});
    if(theme.parentName)  infoItems.push({l:'Parent Theme', v:theme.parentName});
    if(theme.templateId)  infoItems.push({l:'Template ID', v:theme.templateId});
    if(theme.version)     infoItems.push({l:'Version',    v:theme.version});
    if(theme.siteId)      infoItems.push({l:'Site ID',    v:theme.siteId});

    themeHtml=`<div class="cms-theme-divider"></div><div class="cms-theme-section">
      <div class="theme-label">Active Theme</div>
      <div class="theme-name-row">
        <div class="theme-name">${esc(theme.name)}</div>
      </div>
      <div class="theme-sub">${badges}</div>
      ${infoItems.length?`<div class="theme-info-grid">${infoItems.map(i=>`<div class="theme-info-item"><div class="theme-info-label">${esc(i.l)}</div><div class="theme-info-val">${esc(i.v)}</div></div>`).join('')}</div>`:''}
      <div class="theme-btn-row">${storeBtn}${browseBtn}</div>
      ${!theme.storeUrl?`<div class="no-store-note">⚠️ Theme store link unavailable — this may be a custom or private theme.</div>`:''}
    </div>`;
  } else {
    const browseBtn=cms.name==='WordPress'?`<a class="view-theme-btn secondary" href="https://wordpress.org/themes/" target="_blank"><span>Browse WP Themes</span><span class="btn-arrow">→</span></a>`:
                   cms.name==='Shopify'   ?`<a class="view-theme-btn secondary" href="https://themes.shopify.com" target="_blank"><span>Browse Shopify Themes</span><span class="btn-arrow">→</span></a>`:'';
    themeHtml=`<div class="cms-theme-divider"></div><div class="cms-theme-section"><div class="theme-label">Theme</div><div style="color:var(--muted);font-size:12px;margin-bottom:10px">Theme name could not be detected on this ${esc(cms.name)} site.</div>${browseBtn}</div>`;
  }

  // Stack info below CMS card
  let stackHtml='';
  if((stack.frontend?.length||stack.backend?.length||stack.hosting?.length)){
    const all=[...(stack.frontend||[]),...(stack.backend||[]),...(stack.hosting||[])];
    stackHtml=`<div class="section-title" style="margin-top:16px">Tech Stack</div><div class="stack-grid">${all.map(s=>`<a class="stack-pill" href="${esc(s.link)}" target="_blank" style="border-color:${s.color}33"><span>${s.icon}</span><span>${esc(s.name)}</span></a>`).join('')}</div>`;
  }

  container.innerHTML=`
    <div class="section-title">Platform</div>
    <div class="cms-card" style="--cms-color:${esc(cms.color||'#3b8eff')}">
      <div class="cms-card-header">
        <div class="cms-card-left">
          <div class="cms-icon-wrap">${cms.icon||'🌐'}</div>
          <div>
            <div class="cms-name">${esc(cms.name)}</div>
            ${cms.version?`<div class="cms-version">v${esc(cms.version)}</div>`:''}
            <div class="cms-confidence">Detection score: ${cms.detectionScore||'?'}</div>
          </div>
        </div>
        <a class="cms-link-btn" href="${esc(cms.link||'#')}" target="_blank">Visit →</a>
      </div>
      ${themeHtml}
    </div>
    ${stackHtml}
  `;
}

/* ═══════════════════════════════════════════════════════════════
   SEO ISSUES — like SEMrush
═══════════════════════════════════════════════════════════════ */
function computeIssues(data){
  const critical=[], warning=[], passed=[];
  let score=0, maxScore=0;

  function check(pts, condition, passText, failText, failLevel='warning', detail='', items=[]){
    maxScore+=pts;
    if(condition){ score+=pts; passed.push({text:passText}); }
    else{
      const obj={text:failText, detail, items};
      if(failLevel==='critical') critical.push(obj);
      else warning.push(obj);
    }
  }

  const seo=data.seo, s=data.stats;

  // Title
  if(!seo.title){
    critical.push({text:'Missing <title> tag', detail:'Every page must have a title tag for SEO and accessibility.'});
  } else if(seo.titleLen<30){
    maxScore+=15; score+=8; warning.push({text:`Title too short: ${seo.titleLen} chars`, detail:'Aim for 50–60 characters. Short titles miss keyword opportunities.'});
  } else if(seo.titleLen>65){
    maxScore+=15; score+=8; warning.push({text:`Title too long: ${seo.titleLen} chars`, detail:'Keep under 65 chars to avoid truncation in search results.'});
  } else { maxScore+=15; score+=15; passed.push({text:`Title length is great (${seo.titleLen} chars)`}); }

  // Meta description
  if(!seo.description){
    critical.push({text:'Missing meta description', detail:'Add a description tag to improve click-through rates from search results.'});
  } else if(seo.description.length<80){
    maxScore+=12; score+=6; warning.push({text:`Description too short: ${seo.description.length} chars`, detail:'Aim for 120–160 characters.'});
  } else if(seo.description.length>165){
    maxScore+=12; score+=6; warning.push({text:`Description too long: ${seo.description.length} chars`, detail:'Keep under 165 chars to avoid truncation.'});
  } else { maxScore+=12; score+=12; passed.push({text:`Meta description OK (${seo.description.length} chars)`}); }

  // H1
  const h1s=data.headings.filter(h=>h.level===1);
  if(h1s.length===0) critical.push({text:'No H1 tag found', detail:'Every page should have exactly one H1 heading.'});
  else if(h1s.length>1){ maxScore+=10; score+=5; warning.push({text:`${h1s.length} H1 tags found — should be exactly 1`, detail:`Current H1s: ${h1s.map(h=>'"'+h.text.slice(0,40)+'"').join(', ')}`}); }
  else { maxScore+=10; score+=10; passed.push({text:`H1 tag present: "${h1s[0].text.slice(0,50)}"`}); }

  // HTTPS
  check(10, data.security?.isHTTPS, 'HTTPS enabled', 'Site not using HTTPS', 'critical', 'HTTPS is a confirmed Google ranking factor. Install an SSL certificate immediately.');

  // Viewport / mobile
  check(8, !!seo.viewport, 'Mobile viewport set', 'Missing mobile viewport tag', 'critical', 'Add: <meta name="viewport" content="width=device-width, initial-scale=1">');

  // Canonical
  check(5, !!seo.canonical, 'Canonical URL set', 'No canonical URL', 'warning', 'Add <link rel="canonical"> to prevent duplicate content issues.');

  // Robots noindex
  if(data.security?.noindex) critical.push({text:'Page is set to noindex!', detail:'This page will NOT appear in search results. Remove the noindex directive if unintentional.'});
  else { maxScore+=5; score+=5; passed.push({text:'Page is indexable (no noindex)'}); }

  // Images alt text
  const missingAlt=s.missingAltImages, totalImgs=s.imageCount;
  if(missingAlt>0) warning.push({text:`${missingAlt}/${totalImgs} images missing alt text`, detail:'Alt text is important for accessibility and image SEO.', items:data.images.filter(i=>i.hasMissingAlt).map(i=>i.src).slice(0,8)});
  else if(totalImgs>0){ maxScore+=8; score+=8; passed.push({text:`All ${totalImgs} images have alt text`}); }

  // Broken images
  const broken=s.brokenImages||0;
  if(broken>0) critical.push({text:`${broken} broken image${broken>1?'s':''} detected`, detail:'Broken images harm user experience and can affect SEO.', items:data.images.filter(i=>i.isBroken).map(i=>i.src)});
  else if(totalImgs>0){ maxScore+=5; score+=5; passed.push({text:'No broken images detected'}); }

  // Open Graph
  const hasOG=!!(seo.ogTitle&&seo.ogDescription&&seo.ogImage);
  const partialOG=!!(seo.ogTitle||seo.ogDescription);
  if(hasOG){ maxScore+=8; score+=8; passed.push({text:'Open Graph tags complete (og:title, description, image)'}); }
  else if(partialOG){ maxScore+=8; score+=4; warning.push({text:'Open Graph tags incomplete', detail:'Missing: '+[!seo.ogTitle&&'og:title',!seo.ogDescription&&'og:description',!seo.ogImage&&'og:image'].filter(Boolean).join(', ')}); }
  else { warning.push({text:'No Open Graph tags', detail:'Add OG tags for richer social media sharing previews.'}); }

  // Twitter Card
  check(4, !!seo.twitterCard, 'Twitter/X Card tags present', 'No Twitter/X Card tags', 'warning', 'Add twitter:card meta tags for better Twitter/X sharing previews.');

  // Structured data
  if(data.structuredData.length>0){ maxScore+=8; score+=8; passed.push({text:`Structured data found (${data.structuredData.length} JSON-LD block${data.structuredData.length>1?'s':''})`}); }
  else warning.push({text:'No structured data (JSON-LD)', detail:'Add Schema.org markup to enable rich snippets in search results.'});

  // Word count
  const words=s.wordCount;
  if(words<300) warning.push({text:`Low word count: ${words.toLocaleString()} words`, detail:'Pages with less than 300 words may be considered thin content.'});
  else { maxScore+=5; score+=5; passed.push({text:`Good content length: ${words.toLocaleString()} words`}); }

  // Heading hierarchy
  let skipFound=false;
  const hlevels=data.headings.map(h=>h.level);
  for(let i=1;i<hlevels.length;i++) if(hlevels[i]>hlevels[i-1]+1){ skipFound=true; break; }
  if(skipFound) warning.push({text:'Heading hierarchy skips levels', detail:'Avoid skipping from H1 to H3 — use sequential heading levels.'});
  else if(data.headings.length>0){ maxScore+=3; score+=3; passed.push({text:'Heading hierarchy is sequential'}); }

  // Author / keywords
  if(seo.author){ maxScore+=2; score+=2; passed.push({text:'Author meta tag present'}); } else warning.push({text:'No author meta tag', detail:'Optional but useful for content attribution.'});
  if(seo.keywords){ maxScore+=2; score+=2; passed.push({text:'Keywords meta tag present'}); } else warning.push({text:'No keywords meta tag', detail:'Minor signal — not critical for modern SEO.'});

  // External links without nofollow
  const externalNofollow=data.links.filter(l=>l.type==='external'&&!l.isNofollow).length;
  if(externalNofollow>5) warning.push({text:`${externalNofollow} external links without nofollow`, detail:'Consider adding rel="nofollow" to paid/untrusted external links.'});

  const pct = maxScore>0 ? Math.min(100,Math.round((score/maxScore)*100)) : 0;
  return { critical, warning, passed, score:pct };
}

function renderIssues(data){
  const container=$('issuesContent');
  if(!container) return;
  const issues=computeIssues(data);
  const scoreColor = issues.score>=80?'var(--green)':issues.score>=50?'var(--yellow)':'var(--red)';
  const fill=issues.score;

  const renderGroup=(items, type)=>{
    if(!items.length) return '';
    const icons={critical:'❌', warning:'⚠️', passed:'✅'};
    const labels={critical:'Critical Issues', warning:'Warnings', passed:'Passed Checks'};
    return `<div class="issues-group ${type}">
      <div class="issues-group-header">
        <span>${icons[type]} ${labels[type]}</span>
        <span class="issues-count">${items.length}</span>
      </div>
      ${items.map(issue=>`
        <div class="issue-item ${type}">
          <div class="issue-text">${esc(issue.text)}</div>
          ${issue.detail?`<div class="issue-detail">${esc(issue.detail)}</div>`:''}
          ${issue.items?.length?`<div class="issue-items">${issue.items.slice(0,5).map(u=>`<div class="issue-item-url">${esc(truncate(u,70))}</div>`).join('')}${issue.items.length>5?`<div class="issue-item-more">+${issue.items.length-5} more…</div>`:''}</div>`:''}
        </div>
      `).join('')}
    </div>`;
  };

  container.innerHTML=`
    <!-- Score -->
    <div class="seo-score-card">
      <div class="score-header">
        <div>
          <div class="score-label">SEO Health Score</div>
          <div class="score-sub">${issues.critical.length} critical · ${issues.warning.length} warnings · ${issues.passed.length} passed</div>
        </div>
        <div class="score-number" style="color:${scoreColor}">${issues.score}</div>
      </div>
      <div class="score-bar-track">
        <div class="score-bar-fill" style="width:${fill}%;background:${scoreColor}"></div>
      </div>
    </div>

    ${renderGroup(issues.critical,'critical')}
    ${renderGroup(issues.warning,'warning')}
    ${renderGroup(issues.passed,'passed')}

    <!-- Link Checker -->
    <div class="section-title" style="margin-top:16px">Link Health Checker</div>
    <div class="link-checker-card" id="linkCheckerCard">
      <div class="lc-intro">
        Check external links for broken (404/5xx) URLs.
        <span id="lcLinkTotal">${data.links.filter(l=>l.type==='external').length} external links available.</span>
      </div>
      <div class="lc-controls">
        <button class="scan-btn" id="startLinkCheck" style="font-size:11px;padding:7px 14px">Check Links</button>
        <div class="lc-limit-note">Checks up to 40 links · ~5–10 seconds</div>
      </div>
      <div id="lcProgress" style="display:none">
        <div class="lc-progress-track"><div class="lc-progress-fill" id="lcProgressFill"></div></div>
        <div class="lc-status" id="lcStatus">Checking…</div>
      </div>
      <div id="lcResults"></div>
    </div>
  `;

  // Attach link checker
  $('startLinkCheck')?.addEventListener('click', ()=>runLinkCheck(data));
}

/* ── Broken Link Checker ─────────────────────────────────── */
async function runLinkCheck(data){
  if(state.linkCheckRunning){ toast('Link check already running…'); return; }
  state.linkCheckRunning=true;

  const btn=$('startLinkCheck');
  const prog=$('lcProgress');
  const fill=$('lcProgressFill');
  const status=$('lcStatus');
  const results=$('lcResults');

  if(btn) btn.disabled=true;
  if(prog) prog.style.display='block';
  if(results) results.innerHTML='';

  // Only check external links (no anchors, emails, phones)
  const links=data.links.filter(l=>l.type==='external'&&l.href.startsWith('http')).slice(0,40);
  const total=links.length;
  if(total===0){ if(status) status.textContent='No external links to check.'; state.linkCheckRunning=false; if(btn) btn.disabled=false; return; }

  const checked=[], broken=[], ok=[];
  let done=0;

  // Check 5 at a time
  for(let i=0;i<total;i+=5){
    const batch=links.slice(i,i+5);
    await Promise.all(batch.map(async link=>{
      const result=await checkURL(link.href);
      done++;
      checked.push({...link, ...result});
      if(result.status>=400||result.status===0) broken.push({...link, ...result});
      else ok.push({...link, ...result});
      const pct=Math.round((done/total)*100);
      if(fill) fill.style.width=pct+'%';
      if(status) status.textContent=`Checked ${done}/${total} links…`;
    }));
  }

  state.linkCheckRunning=false;
  if(btn) btn.disabled=false;
  if(status) status.textContent=`Done — ${broken.length} broken, ${ok.length} OK out of ${total} checked.`;

  if(!results) return;
  if(broken.length===0){
    results.innerHTML='<div class="lc-ok">✅ No broken links found!</div>';
    return;
  }
  results.innerHTML=`<div class="lc-broken-header">❌ ${broken.length} Broken Link${broken.length>1?'s':''}</div>`+
    broken.map(l=>`<div class="lc-broken-item"><div class="lc-status-badge status-${l.status}">${l.status||'ERR'}</div><div class="lc-url">${esc(truncate(l.href,70))}</div>${l.text?`<div class="lc-text">${esc(l.text)}</div>`:''}</div>`).join('');
}

async function checkURL(url){
  try{
    const ctrl=new AbortController();
    const to=setTimeout(()=>ctrl.abort(),8000);
    const r=await fetch(url,{method:'HEAD',signal:ctrl.signal,redirect:'follow'});
    clearTimeout(to);
    return {status:r.status, ok:r.ok};
  } catch(e){
    return {status: e.name==='AbortError'?'TIMEOUT':0, ok:false};
  }
}

/* ═══════════════════════════════════════════════════════════════
   SEO PANEL
═══════════════════════════════════════════════════════════════ */
function renderSEO(data){
  const seo=data.seo;
  function evalTitle(){ const l=seo.titleLen; if(!seo.title)return{cls:'bad',hint:'❌ Missing'}; if(l<30)return{cls:'warn',hint:`⚠️ Too short (${l})`}; if(l>65)return{cls:'warn',hint:`⚠️ Too long (${l})`}; return{cls:'good',hint:`✓ ${l} chars`}; }
  function evalDesc(){ const d=seo.description||''; if(!d)return{cls:'bad',hint:'❌ Missing'}; if(d.length<80)return{cls:'warn',hint:`⚠️ Too short (${d.length})`}; if(d.length>165)return{cls:'warn',hint:`⚠️ Too long (${d.length})`}; return{cls:'good',hint:`✓ ${d.length} chars`}; }
  const te=evalTitle(), de=evalDesc();
  $('seoCore').innerHTML=[
    {l:'Page Title',       v:seo.title||(esc('(missing)')), e:te},
    {l:'Meta Description', v:seo.description||(esc('(missing)')), e:de},
    {l:'Canonical URL',    v:seo.canonical||'(not set)', e:{}},
    {l:'Robots',           v:seo.robots||'(not set)', e:{}},
    {l:'Keywords',         v:seo.keywords||'(not set)', e:{}},
    {l:'Viewport',         v:seo.viewport||'(not set)', e:{}},
    {l:'Theme Color',      v:seo.themeColor||'(not set)', e:{}},
    {l:'Author',           v:seo.author||'(not set)', e:{}},
    {l:'Generator',        v:seo.generator||'(not set)', e:{}},
  ].map(r=>`<div class="seo-row ${r.e.cls||''}"><div class="seo-label">${esc(r.l)}</div><div class="seo-val">${esc(r.v)}</div>${r.e.hint?`<div class="seo-hint ${r.e.cls}">${r.e.hint}</div>`:''}</div>`).join('');

  $('seoOG').innerHTML=[{l:'og:title',v:seo.ogTitle},{l:'og:description',v:seo.ogDescription},{l:'og:image',v:seo.ogImage},{l:'og:type',v:seo.ogType},{l:'og:url',v:seo.ogUrl},{l:'og:site_name',v:seo.ogSiteName}]
    .map(r=>`<div class="seo-row ${r.v?'':'warn'}"><div class="seo-label">${esc(r.l)}</div><div class="seo-val">${esc(r.v)||'(not set)'}</div></div>`).join('');
  $('seoTwitter').innerHTML=[{l:'twitter:card',v:seo.twitterCard},{l:'twitter:title',v:seo.twitterTitle},{l:'twitter:description',v:seo.twitterDescription},{l:'twitter:image',v:seo.twitterImage},{l:'twitter:site',v:seo.twitterSite}]
    .map(r=>`<div class="seo-row ${r.v?'':'warn'}"><div class="seo-label">${esc(r.l)}</div><div class="seo-val">${esc(r.v)||'(not set)'}</div></div>`).join('');

  renderMetaList(data.metas,'');
  const sd=$('structuredData');
  if(!data.structuredData.length) sd.innerHTML='<div style="color:var(--muted);font-size:12px">No JSON-LD found</div>';
  else sd.innerHTML=data.structuredData.map(d=>`<div class="json-block">${esc(JSON.stringify(d,null,2))}</div>`).join('');
  const hl=$('headingList');
  if(!data.headings.length) hl.innerHTML='<div style="color:var(--muted);font-size:12px">No headings found</div>';
  else hl.innerHTML=data.headings.map(h=>`<div class="heading-item h${h.level}"><span class="h-badge">H${h.level}</span><span class="h-text">${esc(h.text)}</span></div>`).join('');
  $('linkTagList').innerHTML=data.linkTags.filter(l=>l.rel||l.href).map(l=>`<div class="seo-row"><div class="seo-label">${esc(l.rel||(esc('(no rel)')))}</div><div class="seo-val">${l.href?`<a href="${esc(l.href)}" target="_blank">${esc(truncate(l.href,80))}</a>`:''} ${l.type?`·${esc(l.type)}`:''} ${l.media?`·${esc(l.media)}`:''}</div></div>`).join('');
}

function renderMetaList(metas,filter){
  const ml=$('metaList');
  const f=metas.filter(m=>!filter||m.name.toLowerCase().includes(filter)||m.content.toLowerCase().includes(filter));
  ml.innerHTML=f.map(m=>`<div class="meta-item"><div class="meta-key">${esc(m.charset?'charset':m.name)}</div><div class="meta-val">${esc(m.charset||truncate(m.content,200))}</div></div>`).join('');
}

/* ─── Links ──────────────────────────────────────────────── */
function renderLinks(data,filter='',typeFilter='all'){
  const list=$('linkList');
  let links=data.links;
  if(typeFilter!=='all') links=links.filter(l=>l.type===typeFilter);
  if(filter) links=links.filter(l=>l.text.toLowerCase().includes(filter)||l.href.toLowerCase().includes(filter));
  $('linkCount').textContent=`${links.length} / ${data.links.length} links`;
  if(!links.length){ list.innerHTML='<div style="color:var(--muted);font-size:12px;padding:10px 0">No links match</div>'; return; }
  list.innerHTML='';
  links.forEach(link=>{
    const item=el('div','link-item');
    item.innerHTML=`<span class="link-badge ${link.type}">${link.type}</span><div class="link-body"><div class="link-text">${esc(link.text||'(no text)')}${link.isNofollow?'<span class="nofollow-tag">nofollow</span>':''}</div><div class="link-href"><a href="${esc(link.href)}" target="_blank">${esc(truncate(link.href,80))}</a></div>${link.title?`<div class="link-meta">title: ${esc(link.title)}</div>`:''}${link.target?`<div class="link-meta">target: ${esc(link.target)}</div>`:''}${link.rel?`<div class="link-meta">rel: ${esc(link.rel)}</div>`:''}</div>`;
    list.appendChild(item);
  });
}

/* ─── Images ─────────────────────────────────────────────── */
function renderImages(data,filter='',missingOnly=false,brokenOnly=false){
  const list=$('imgList');
  let imgs=data.images;
  if(missingOnly) imgs=imgs.filter(i=>i.hasMissingAlt);
  if(brokenOnly)  imgs=imgs.filter(i=>i.isBroken);
  if(filter) imgs=imgs.filter(i=>i.src.toLowerCase().includes(filter)||i.alt.toLowerCase().includes(filter));
  $('imgCount').textContent=`${imgs.length} / ${data.images.length} images`;
  if(!imgs.length){ list.innerHTML='<div style="color:var(--muted);font-size:12px;padding:10px 0">No images match</div>'; return; }
  list.innerHTML='';
  imgs.forEach(img=>{
    const item=el('div',`img-item${img.isBroken?' broken':''}`);
    item.innerHTML=`<img class="img-thumb" src="${esc(img.src)}" alt="${esc(img.alt)}" loading="lazy" onerror="this.style.display='none'"><div class="img-body"><div class="img-src"><a href="${esc(img.src)}" target="_blank">${esc(truncate(img.src,70))}</a></div><div class="img-alt ${img.hasMissingAlt?'missing':''}">${img.alt?'alt: '+esc(img.alt):'⚠️ No alt attribute'}</div>${(img.width||img.height)?`<div class="img-dims">${img.width}×${img.height}px</div>`:''}<div class="img-tags">${img.isBroken?'<span class="img-tag broken">🔴 broken</span>':''}${img.isLazyLoaded?'<span class="img-tag lazy">lazy</span>':''}${img.hasMissingAlt?'<span class="img-tag noalt">no alt</span>':''}${img.srcset?'<span class="img-tag">srcset</span>':''}</div></div>`;
    list.appendChild(item);
  });
}

/* ─── Forms ──────────────────────────────────────────────── */
function renderForms(data){
  const list=$('formList');
  $('formCount').textContent=`${data.forms.length} form${data.forms.length!==1?'s':''} found`;
  if(!data.forms.length){ list.innerHTML='<div style="color:var(--muted);font-size:12px;padding:10px 0">No forms found</div>'; return; }
  list.innerHTML='';
  data.forms.forEach((form,i)=>{
    const card=el('div','form-card');
    card.innerHTML=`<div class="form-header"><span class="form-icon">📋</span><div><div class="form-name">${esc(form.name||form.id||'Form '+(i+1))}</div><div class="form-action">${esc(truncate(form.action||'(no action)',60))}</div></div></div><div class="form-meta"><span class="form-badge">METHOD: ${esc((form.method||'get').toUpperCase())}</span>${form.enctype?`<span class="form-badge">${esc(form.enctype)}</span>`:''}<span class="form-badge">${form.fields.length} fields</span></div>${form.fields.map(f=>`<div class="field-item"><div class="field-name">${esc(f.label||f.name||f.id||'(unnamed '+f.tag+')')}</div><div class="field-meta">${esc(f.tag)}${f.type?'[type='+esc(f.type)+']':''}${f.placeholder?' · "'+esc(f.placeholder)+'"':''}${f.required?' · required':''}</div></div>`).join('')}`;
    list.appendChild(card);
  });
}

/* ─── Resources ──────────────────────────────────────────── */
function renderResources(data){
  $('scriptCountLabel').textContent=data.scripts.length;
  $('styleCountLabel').textContent=data.styles.length;
  $('scriptList').innerHTML=data.scripts.map(s=>`<div class="res-item"><div class="res-src"><a href="${esc(s.src)}" target="_blank">${esc(truncate(s.src,90))}</a></div><div class="res-meta">${s.async?'<span class="res-badge async">async</span>':''}${s.defer?'<span class="res-badge defer">defer</span>':''}${s.module?'<span class="res-badge mod">module</span>':''}${s.integrity?'<span class="res-badge">SRI ✓</span>':''}<span class="res-badge">${esc(safeUrl(s.src))}</span></div></div>`).join('')||'<div style="color:var(--muted);font-size:12px">No external scripts</div>';
  $('styleList').innerHTML=data.styles.map(s=>`<div class="res-item"><div class="res-src"><a href="${esc(s.href)}" target="_blank">${esc(truncate(s.href,90))}</a></div><div class="res-meta">${s.media?`<span class="res-badge">${esc(s.media)}</span>`:''}${s.integrity?'<span class="res-badge">SRI ✓</span>':''}<span class="res-badge">${esc(safeUrl(s.href))}</span></div></div>`).join('')||'<div style="color:var(--muted);font-size:12px">No external stylesheets</div>';

  // Fonts
  const fi=data.fontInfo, fl=$('fontList'), fcl=$('fontCountLabel');
  const allFonts=[...(fi?.googleFonts||[]).map(f=>({name:f,src:'Google Fonts'})),...(fi?.customFonts||[]).map(f=>({name:f,src:'Self-hosted'})),...(fi?.adobeFonts?[{name:'Adobe Fonts (Typekit)',src:'Adobe'}]:[])];
  if(fcl) fcl.textContent=allFonts.length;
  if(fl) fl.innerHTML=allFonts.length?allFonts.map(f=>`<div class="font-item"><span class="font-name">${esc(f.name)}</span><span class="font-source-badge">${esc(f.src)}</span></div>`).join(''):'<div style="color:var(--muted);font-size:12px">No font services detected</div>';

  // PWA
  const pwa=data.pwa, pi=$('pwaInfo');
  if(pi&&pwa) pi.innerHTML=`<div class="pwa-card"><div class="pwa-row"><span class="pwa-label">Web App Manifest</span><span class="pwa-val ${pwa.hasManifest?'yes':'no'}">${pwa.hasManifest?'✅ Found':'✗ None'}</span></div>${pwa.hasManifest?`<div class="pwa-row"><span class="pwa-label">Manifest URL</span><span class="pwa-val link"><a href="${esc(pwa.manifestUrl)}" target="_blank">${esc(truncate(pwa.manifestUrl,60))}</a></span></div>`:''}<div class="pwa-row"><span class="pwa-label">Service Worker API</span><span class="pwa-val ${pwa.hasServiceWorker?'yes':'no'}">${pwa.hasServiceWorker?'✅ Available':'✗ None'}</span></div><div class="pwa-row"><span class="pwa-label">Apple Web App Capable</span><span class="pwa-val ${pwa.appleCapable?'yes':'no'}">${pwa.appleCapable?'✅ Yes':'✗ No'}</span></div>${pwa.themeColor?`<div class="pwa-row"><span class="pwa-label">Theme Color</span><span class="pwa-val" style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:14px;border-radius:50%;background:${esc(pwa.themeColor)};border:1px solid rgba(255,255,255,0.2)"></span><span style="font-family:var(--mono);font-size:11px">${esc(pwa.themeColor)}</span></span></div>`:''}</div>`;
}

/* ─── Raw ────────────────────────────────────────────────── */
function renderRaw(data){ $('rawJSON').textContent=JSON.stringify(data,null,2); }

/* ═══════════════════════════════════════════════════════════════
   FREEZE / STORAGE
═══════════════════════════════════════════════════════════════ */
function setFrozen(val){
  state.frozen=val;
  const fb=$('freezeBtn'), badge=$('frozenBadge');
  if(fb){ fb.classList.toggle('frozen',val); const l=fb.querySelector('.freeze-label'); if(l) l.textContent=val?'Unfreeze':'Freeze'; }
  if(badge) badge.style.display=val?'block':'none';
  try{ if(hasStorage()) chrome.storage.local.set({frozen:val}); } catch(e){}
}

function saveData(data){
  if(state.frozen||!data) return;
  try{ if(hasStorage()) chrome.storage.local.set({lastData:data, lastUrl:data.url}); } catch(e){}
}

function loadSavedData(){
  return new Promise(resolve=>{
    try{
      if(!hasStorage()){ resolve(false); return; }
      chrome.storage.local.get(['lastData','frozen'],result=>{
        if(chrome.runtime.lastError){ resolve(false); return; }
        if(typeof result.frozen!=='undefined'){ state.frozen=result.frozen; setFrozen(state.frozen); }
        if(result.lastData){ state.data=result.lastData; renderAll(state.data); resolve(true); }
        else resolve(false);
      });
    } catch(e){ resolve(false); }
  });
}

/* ═══════════════════════════════════════════════════════════════
   SCAN
═══════════════════════════════════════════════════════════════ */
async function scan(){
  if(state.frozen){ toast('❄️ Frozen — click Unfreeze to rescan'); return; }
  $('emptyState').style.display='none';
  $('loadingState').style.display='flex';
  document.querySelectorAll('.panel').forEach(p=>p.style.display='none');
  try{
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if(!tab?.id) throw new Error('No active tab');
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']}).catch(()=>{});
    await new Promise(r=>setTimeout(r,150));
    const response=await chrome.tabs.sendMessage(tab.id,{action:'scan'});
    if(response?.success){ state.data=response.data; saveData(state.data); renderAll(state.data); toast('✅ Scan complete'); }
    else throw new Error(response?.error||'No data returned');
  } catch(e){
    $('loadingState').style.display='none';
    $('emptyState').style.display='flex';
    const sub=$('emptyState').querySelector('.empty-sub');
    if(sub) sub.textContent='⚠️ Could not scan. Try refreshing the page first.';
    console.error('[TDP] Scan error:',e);
  }
}

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async ()=>{

  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>setTab(t.dataset.tab)));
  $('scanBtn').addEventListener('click',scan);
  $('scanBtnBig').addEventListener('click',scan);
  $('freezeBtn').addEventListener('click',()=>setFrozen(!state.frozen));

  $('techFilter')?.addEventListener('input',e=>{ if(state.data) renderTechList(state.data.technologies,e.target.value.toLowerCase(),$('techCatFilter')?.value||'all'); });
  $('techCatFilter')?.addEventListener('change',e=>{ if(state.data) renderTechList(state.data.technologies,$('techFilter')?.value?.toLowerCase()||'',e.target.value); });
  $('metaFilter')?.addEventListener('input',e=>{ if(state.data) renderMetaList(state.data.metas,e.target.value.toLowerCase()); });
  $('copyMeta')?.addEventListener('click',()=>{ if(state.data) copyText(state.data.metas.map(m=>`${m.name}: ${m.content}`).join('\n')); });

  const updateLinks=()=>{ if(state.data) renderLinks(state.data,$('linkFilter').value.toLowerCase(),$('linkTypeFilter').value); };
  $('linkFilter')?.addEventListener('input',updateLinks);
  $('linkTypeFilter')?.addEventListener('change',updateLinks);
  $('copyLinks')?.addEventListener('click',()=>{ if(!state.data) return; const tf=$('linkTypeFilter').value; copyText((tf==='all'?state.data.links:state.data.links.filter(l=>l.type===tf)).map(l=>l.href).join('\n')); });
  $('exportLinksCSV')?.addEventListener('click',()=>{ if(state.data) downloadCSV(state.data.links,['href','text','type','rel','target','isNofollow'],'links.csv'); });
  $('exportLinksJSON')?.addEventListener('click',()=>{ if(state.data) downloadJSON(state.data.links,'links.json'); });

  const updateImgs=()=>{ if(state.data) renderImages(state.data,$('imgFilter').value.toLowerCase(),$('missingAltOnly').checked,$('brokenOnly').checked); };
  $('imgFilter')?.addEventListener('input',updateImgs);
  $('missingAltOnly')?.addEventListener('change',updateImgs);
  $('brokenOnly')?.addEventListener('change',updateImgs);
  $('copyImgs')?.addEventListener('click',()=>{ if(state.data) copyText(state.data.images.map(i=>i.src).join('\n')); });
  $('exportImgsCSV')?.addEventListener('click',()=>{ if(state.data) downloadCSV(state.data.images,['src','alt','width','height','loading','isLazyLoaded','hasMissingAlt','isBroken'],'images.csv'); });

  $('copyScripts')?.addEventListener('click',()=>{ if(state.data) copyText(state.data.scripts.map(s=>s.src).join('\n')); });
  $('exportScriptsJSON')?.addEventListener('click',()=>{ if(state.data) downloadJSON(state.data.scripts,'scripts.json'); });
  $('copyStyles')?.addEventListener('click',()=>{ if(state.data) copyText(state.data.styles.map(s=>s.href).join('\n')); });
  $('copyRaw')?.addEventListener('click',()=>{ if(state.data) copyText(JSON.stringify(state.data,null,2)); });
  $('downloadRaw')?.addEventListener('click',()=>{ if(state.data) downloadJSON(state.data,`tech-detector-${state.data.hostname}-${Date.now()}.json`); });

  // Load saved data first, then maybe auto-scan
  const hadData=await loadSavedData();
  if(!state.frozen&&!hadData) setTimeout(scan,300);
  if(state.frozen&&state.data) toast('❄️ Showing frozen data — Unfreeze to rescan',3000);
});