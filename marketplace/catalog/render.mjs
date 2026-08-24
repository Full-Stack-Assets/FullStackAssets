import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { escapeHtml, pageShell } from './templates.mjs';

export function groupForType(type) {
  const normalized = String(type).toUpperCase();
  if (normalized === 'ROLE' || normalized === 'AGENT') return 'agents';
  if (normalized === 'SKILL') return 'skills';
  if (normalized === 'WORKFLOW_PACK') return 'packs';
  if (normalized === 'COLLECTION') return 'collections';
  throw new Error(`Unsupported public entry type: ${type}`);
}
export function entryRoute(entry) { return `/library/${groupForType(entry.type)}/${entry.slug}/`; }

function actionLabel(entry) {
  if (entry.commercial_state === 'REFERENCE_ONLY') return 'Reference only';
  if (entry.commercial_state === 'FREE') return 'Add to Library';
  if (entry.commercial_state === 'PAID') return 'View offer';
  return 'View details';
}
function formatPrice(commerce) {
  if (!commerce || commerce.amount === null || commerce.amount === undefined) return '';
  if (commerce.currency === 'USD') return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(commerce.amount/100);
  return `${escapeHtml(commerce.currency ?? '')} ${Number(commerce.amount/100).toFixed(2)}`.trim();
}
function verifiedInstallAvailable(entry) {
  if (String(entry.commercial_state).toUpperCase() === 'REFERENCE_ONLY') return false;
  return (entry.compatibility ?? []).some((item)=>String(item.state ?? item.compatibility_state).toUpperCase()==='VERIFIED' && item.package_available === true);
}
function renderCapabilityGraph(entry) {
  const skills=entry.skill_ids ?? [];
  if (!skills.length) return '<p>No direct Skill composition is published for this entry.</p>';
  const height=Math.max(120,skills.length*64+24);
  const sourceY=Math.round(height/2)-20;
  const edges=skills.map((id,index)=>{
    const y=24+index*64;
    return `<line x1="190" y1="${sourceY+18}" x2="330" y2="${y+18}" stroke="currentColor"/><text x="230" y="${Math.round((sourceY+y)/2)+14}" font-size="11">uses skill</text><rect x="330" y="${y}" width="190" height="36" rx="6" fill="none" stroke="currentColor"/><text x="342" y="${y+23}" font-size="12">${escapeHtml(id)}</text>`;
  }).join('');
  return `<svg role="img" aria-label="Capability composition for ${escapeHtml(entry.id)}" viewBox="0 0 540 ${height}" width="100%"><title>Capability composition: ${escapeHtml(entry.id)} uses skill ${skills.map(escapeHtml).join(', ')}</title><rect x="10" y="${sourceY}" width="180" height="36" rx="6" fill="none" stroke="currentColor"/><text x="22" y="${sourceY+23}" font-size="12">${escapeHtml(entry.id)}</text>${edges}</svg>`;
}
function list(items, empty='None published') {
  const values=Array.isArray(items)?items:[];
  return values.length ? `<ul>${values.map((value)=>`<li>${escapeHtml(typeof value==='string'?value:JSON.stringify(value))}</li>`).join('')}</ul>` : `<p>${escapeHtml(empty)}</p>`;
}
function actionMarkup(entry){
  const price=formatPrice(entry.commerce);
  const install=verifiedInstallAvailable(entry) ? '<a class="btn btn-ghost" href="/my-library/">Install</a>' : '';
  const state=String(entry.commercial_state??'REFERENCE_ONLY').toUpperCase();
  if(state==='FREE'&&entry.commerce?.offer_id){
    return `<div data-marketplace-acquire-host><button type="button" class="btn btn-solid" data-free-acquire data-offer-id="${escapeHtml(entry.commerce.offer_id)}">Add to Library</button>${price?`<span class="library-price">${escapeHtml(price)}</span>`:''}${install}</div>`;
  }
  return `<span class="btn btn-solid">${escapeHtml(actionLabel(entry))}</span>${price?`<span class="library-price">${escapeHtml(price)}</span>`:''}${install}`;
}

export function renderEntry(entry) {
  const route = entryRoute(entry);
  const compatibility=(entry.compatibility ?? entry.compatibility_summary ?? []).map((item)=>typeof item==='string'?{runtime:item,state:'AVAILABLE'}:item);
  const evaluation=entry.evaluation_summary ?? {};
  const versions=entry.versions ?? entry.version_summary?.versions ?? (entry.version_summary?.current ? [entry.version_summary.current] : []);
  const action=actionMarkup(entry);
  const compatHtml=compatibility.length ? `<ul>${compatibility.map((item)=>`<li><strong>${escapeHtml(item.runtime)}</strong> · ${escapeHtml(item.state ?? item.compatibility_state ?? 'UNKNOWN')}</li>`).join('')}</ul>` : '<p>No verified runtime distribution published.</p>';
  const trustBits=[];
  if(evaluation.status) trustBits.push(`<li>Status: ${escapeHtml(evaluation.status)}</li>`);
  if(evaluation.tests !== undefined) trustBits.push(`<li>Tests: ${escapeHtml(evaluation.tests)}</li>`);
  if(evaluation.critical_failures !== undefined) trustBits.push(`<li>Critical failures: ${escapeHtml(evaluation.critical_failures)}</li>`);
  const acquireScript=String(entry.commercial_state).toUpperCase()==='FREE'&&entry.commerce?.offer_id?'<script type="module" src="/assets/library-acquire.js"></script>':'';
  const body = `<header class="page-hero"><div class="wrap"><div class="breadcrumbs"><a href="/library/">Library</a><span class="sep">/</span><a href="/library/${groupForType(entry.type)}/">${escapeHtml(groupForType(entry.type))}</a><span class="sep">/</span><span>${escapeHtml(entry.id)}</span></div><div class="eyebrow">${escapeHtml(entry.id)} · ${escapeHtml(entry.domain ?? entry.type)}</div><h1>${escapeHtml(entry.name)}</h1><p class="lede">${escapeHtml(entry.description ?? '')}</p><div class="hero-ctas">${action}</div></div></header>
<section><div class="wrap"><div class="sec-head"><h2>What it does</h2></div><p>${escapeHtml(entry.description ?? 'No public description published.')}</p>${list(entry.use_cases,'No public use cases published.')}</div></section>
<section><div class="wrap"><div class="sec-head"><h2>What it does not do</h2></div><p>${escapeHtml(entry.boundary ?? 'No additional public boundary text published.')}</p></div></section>
<section><div class="wrap"><div class="sec-head"><h2>Included Skills</h2></div>${list(entry.skill_ids,'No direct Skills published.')}<div class="library-capability-graph">${renderCapabilityGraph(entry)}</div></div></section>
<section><div class="wrap"><div class="sec-head"><h2>Compatibility</h2></div>${compatHtml}</div></section>
<section><div class="wrap"><div class="sec-head"><h2>Trust &amp; Verification</h2></div>${trustBits.length?`<ul>${trustBits.join('')}</ul>`:'<p>No public evaluation summary published.</p>'}</div></section>
<section><div class="wrap"><div class="sec-head"><h2>Versions</h2></div>${list(versions,'No public version history published.')}</div></section>${acquireScript}`;
  return pageShell({title:entry.name,description:entry.description ?? entry.name,canonicalPath:route,body});
}

function presentationClass(entry) {
  const group=groupForType(entry.type);
  if(group==='agents') return 'library-volume';
  if(group==='skills') return 'library-manual';
  if(group==='packs') return 'library-boxed-set';
  return 'library-collection';
}
function card(entry) {
  const search=[entry.id,entry.name,entry.description,entry.domain,...(entry.use_cases ?? []),...(entry.capabilities ?? [])].filter(Boolean).join(' ').toLowerCase();
  return `<article class="asset ${presentationClass(entry)}" data-library-entry data-library-type="${escapeHtml(String(entry.type).toUpperCase())}" data-library-domain="${escapeHtml(entry.domain ?? '')}" data-library-search="${escapeHtml(search)}"><div class="asset-serial">${escapeHtml(entry.id)}</div><h3><a href="${escapeHtml(entryRoute(entry))}">${escapeHtml(entry.name)}</a></h3><div class="role">${escapeHtml(entry.domain ?? entry.type)}</div><p>${escapeHtml(entry.description ?? '')}</p><span class="library-badge">${escapeHtml(entry.commercial_state ?? 'REFERENCE_ONLY')}</span></article>`;
}
export function renderLibraryIndex(catalog) {
  const types=['ALL',...(catalog.taxonomy?.types ?? [])];
  const domains=['ALL',...(catalog.taxonomy?.domains ?? [])];
  const controls=`<div class="library-filter-bar"><label>Search <input type="search" data-library-search placeholder="Search skills, agents, or outcomes"></label><label>Type <select data-library-type>${types.map((value)=>`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select></label><label>Domain <select data-library-domain>${domains.map((value)=>`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select></label><span data-library-result-count>${catalog.entries.length} results</span></div>`;
  const body = `<header class="page-hero library-shell"><div class="wrap"><div class="eyebrow">Agentic Capability Library</div><h1>Browse the Library</h1><p class="lede">Governed, portable AI capabilities organized as agents, skills, packs, and collections.</p></div></header><section><div class="wrap library-shelf">${controls}<div class="featured-work" data-library-grid>${catalog.entries.map(card).join('')}</div></div></section>`;
  return pageShell({title:'Agent & Skill Library',description:'Browse governed, portable AI capabilities.',canonicalPath:'/library/',body});
}
function renderCategory(group, entries) {
  const label = group[0].toUpperCase()+group.slice(1);
  const body = `<header class="page-hero"><div class="wrap"><div class="breadcrumbs"><a href="/library/">Library</a><span class="sep">/</span><span>${escapeHtml(label)}</span></div><h1>${escapeHtml(label)}</h1></div></header><section><div class="wrap"><div class="featured-work">${entries.map(card).join('')}</div></div></section>`;
  return pageShell({title:`Library ${label}`,description:`Browse ${label.toLowerCase()} in the Agent & Skill Library.`,canonicalPath:`/library/${group}/`,body});
}
function ensureParent(path){ mkdirSync(dirname(path),{recursive:true}); }
function write(path, content){ ensureParent(path); writeFileSync(path,content); }
function destinationForLibraryHref(root, href){
  const path = href.replace(/^\/library\/?/,'');
  return href.endsWith('/') ? join(root,path,'index.html') : join(root,path);
}
function validateLibraryLinks(root){
  const files=[];
  function walk(dir){ for(const name of readdirSync(dir)){ const p=join(dir,name); if(statSync(p).isDirectory()) walk(p); else if(name.endsWith('.html')) files.push(p); } }
  walk(root);
  const failures=[];
  for(const file of files){
    const html=readFileSync(file,'utf8');
    for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
      if(!href.startsWith('/library/')) continue;
      const dest=destinationForLibraryHref(root,href);
      if(!existsSync(dest)) failures.push(`${relative(root,file)} -> ${href}`);
    }
  }
  if(failures.length) throw new Error(`Generated Library link validation failed:\n${failures.join('\n')}`);
}

export function buildLibraryTree({catalog,searchIndex,outDir}) {
  const parent=dirname(outDir);
  const temp=join(parent,'.library-build-tmp');
  const backup=join(parent,'.library-build-old');
  rmSync(temp,{recursive:true,force:true});
  rmSync(backup,{recursive:true,force:true});
  mkdirSync(temp,{recursive:true});
  try {
    for(const entry of catalog.entries ?? []) groupForType(entry.type);
    write(join(temp,'index.html'),renderLibraryIndex(catalog));
    for(const group of ['agents','skills','packs','collections']){
      const entries=(catalog.entries ?? []).filter((entry)=>groupForType(entry.type)===group);
      write(join(temp,group,'index.html'),renderCategory(group,entries));
    }
    for(const entry of catalog.entries ?? []) write(join(temp,groupForType(entry.type),entry.slug,'index.html'),renderEntry(entry));
    write(join(temp,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
    write(join(temp,'search-index.json'),JSON.stringify(searchIndex ?? {entries:[]},null,2)+'\n');
    validateLibraryLinks(temp);
    if(existsSync(outDir)) renameSync(outDir,backup);
    try { renameSync(temp,outDir); }
    catch(error){ if(existsSync(backup)) renameSync(backup,outDir); throw error; }
    rmSync(backup,{recursive:true,force:true});
  } catch(error) {
    rmSync(temp,{recursive:true,force:true});
    throw error;
  }
}