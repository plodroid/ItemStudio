function warnings(){
  const out=[];
  if(profile()==='nbt_legacy' && state.enchants.some(e=>LEGACY_ENCHANT_IDS[stripNs(e.id)]==null)) out.push('One or more selected enchantments did not exist in this legacy version. ItemStudio cannot make a newer enchantment exist in an older Minecraft release.');
  if(profile()==='nbt_legacy' && ['netherite_pickaxe','netherite_sword','netherite_axe','netherite_shovel','netherite_hoe','netherite_helmet','netherite_chestplate','netherite_leggings','netherite_boots','mace','spear'].includes(state.item)) out.push(`“${state.item}” does not exist in ${state.version}. Choose an item that exists in that release.`);
  if(cmp(state.version,1,21,2)<0 && state.attributes.some(a=>['block_break_speed','block_interaction_range','entity_interaction_range','fall_damage_multiplier','gravity','jump_strength','safe_fall_distance','scale','step_height','burning_time','mining_efficiency','movement_efficiency','oxygen_bonus','sneaking_speed','submerged_mining_speed','sweeping_damage_ratio','water_movement_efficiency'].includes(a.id))) out.push('Some newer attributes were added after older releases. The syntax can be valid while the attribute ID itself is unknown to that Minecraft version.');
  if($('#rawExtra').value.trim()) out.push('Advanced raw data is inserted exactly as typed and cannot be fully validated by the browser.');
  return out;
}

function syncStateFromRows(){
  state.lore=$$('#loreRows .row-editor').map(r=>({text:$('input[data-k="text"]',r).value,color:$('select[data-k="color"]',r).value,italic:$('input[data-k="italic"]',r)?.checked||false})).filter(x=>x.text.trim());
  state.enchants=$$('#enchantRows .row-editor').map(r=>({id:$('input[data-k="id"]',r).value.trim(),level:$('input[data-k="level"]',r).value})).filter(x=>x.id);
  state.attributes=$$('#attributeRows .row-editor').map(r=>({id:$('select[data-k="id"]',r).value,amount:$('input[data-k="amount"]',r).value,operation:$('select[data-k="operation"]',r).value,slot:$('select[data-k="slot"]',r).value}));
  state.effects=$$('#effectRows .row-editor').map(r=>({id:$('input[data-k="id"]',r).value.trim(),amplifier:$('input[data-k="amplifier"]',r).value,slot:$('select[data-k="slot"]',r).value})).filter(x=>x.id);
}

function refresh(){
  syncStateFromRows();
  const p=profile();
  $('#syntaxPill').textContent = ({components_simplified:'1.21.5+ components',components_id:'1.21–1.21.4 components',components_uuid:'1.20.5–1.20.6 components',nbt_modern:'1.13–1.20.4 NBT',nbt_legacy:'1.8–1.12 legacy NBT'})[p];
  $('#versionNote').textContent = p.startsWith('components') ? 'Uses Java Edition item stack components.' : 'Uses the NBT command format from this release family.';
  $('#rawExtraLabel').textContent=p.startsWith('components')?'Extra component entries':'Extra NBT tags';
  $('#rawHint').textContent=p.startsWith('components')?'Advanced: comma-separated component entries only, without the outer brackets.':'Advanced: comma-separated NBT tags only, without the outer braces.';
  const item=ITEMS.find(x=>x[0]===state.item); $('#selectedItemCard').innerHTML=`Selected: <b>${item?.[1]||state.item}</b> <span>· ${ns(state.item)}</span>`;
  const nm=$('#itemName').value.trim() || item?.[1] || state.item.replaceAll('_',' ');
  $('#previewName').textContent=nm; $('#previewName').style.color=mcColor($('#nameColor').value);
  $('#previewEnchants').textContent=state.enchants.map(e=>`${title(e.id)} ${roman(safeNum(e.level,1))}`).join('\n');
  $('#previewLore').textContent=state.lore.map(x=>x.text).join('\n');
  $('#previewAttrs').textContent=state.attributes.map(a=>`${safeNum(a.amount,0)>=0?'+':''}${safeNum(a.amount,0)} ${title(a.id)} (${a.slot})`).join('\n');
  $('#mcIcon').textContent=iconFor(state.item);
  $('#miniSummary').innerHTML=`<div><b>${state.enchants.length}</b><small>enchants</small></div><div><b>${state.attributes.length}</b><small>attributes</small></div><div><b>${state.effects.length}</b><small>effects</small></div>`;
  $('#effectCountBadge').textContent=state.effects.length;
  const give=generateGive(), effects=generateEffects();
  $('#commandOutput').textContent=state.output==='give'?give:effects;
  $('#commandHelp').innerHTML=state.output==='give'?`Paste this into chat if it fits, or into an <b>Impulse / Needs Redstone</b> command block.`:`Put each line in its own <b>Repeating / Always Active</b> command block. The 2-second effect duration is refreshed while the condition matches.`;
  const w=warnings(); $('#warningBox').hidden=!w.length; $('#warningBox').innerHTML=w.map(x=>`• ${x}`).join('<br>');
  $('#validationLabel').textContent=w.length?`${w.length} compatibility note${w.length>1?'s':''}`:'Syntax profile loaded';
}

function title(s){ return stripNs(s).split(/[_.]/).map(x=>x?x[0].toUpperCase()+x.slice(1):x).join(' '); }
function roman(n){ n=Math.floor(n); if(n<=0||n>20)return String(n); const m=[[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];let s='';for(const [v,r] of m)while(n>=v){s+=r;n-=v}return s; }
function mcColor(c){ return ({white:'#fff',gray:'#aaa',dark_gray:'#555',black:'#111',red:'#f55',dark_red:'#a00',gold:'#fa0',yellow:'#ff5',green:'#5f5',dark_green:'#0a0',aqua:'#5ff',dark_aqua:'#0aa',blue:'#55f',dark_blue:'#00a',light_purple:'#f5f',dark_purple:'#a0a'})[c]||'#fff'; }
function iconFor(id){ if(id.includes('pickaxe'))return'⛏';if(id.includes('sword'))return'⚔';if(id.includes('axe'))return'🪓';if(id.includes('helmet'))return'⛑';if(id.includes('chestplate'))return'◈';if(id.includes('block')||ITEMS.find(x=>x[0]===id)?.[2]==='block')return'▣';if(id==='bow'||id==='crossbow')return'➶';if(id==='trident'||id==='spear')return'🔱';if(id==='shield')return'⬡';return'◆'; }

function optionHtml(values, selected){ return values.map(v=>{const val=Array.isArray(v)?v[0]:v,label=Array.isArray(v)?v[1]:title(v);return `<option value="${val}" ${val===selected?'selected':''}>${label}</option>`}).join(''); }
function addRow(kind, preset={}){
  const host=$(`#${kind}Rows`); const row=document.createElement('div'); row.className=`row-editor ${kind}`;
  if(kind==='lore') row.innerHTML=`<label>Text<input data-k="text" value="${preset.text||''}" placeholder="Legendary tool"></label><label>Color<select data-k="color">${optionHtml(COLORS,preset.color||'gray')}</select></label><button class="remove-row" aria-label="Remove">×</button>`;
  if(kind==='enchant') row.innerHTML=`<label>Enchantment<input data-k="id" list="enchantList" value="${preset.id||'efficiency'}" placeholder="efficiency"></label><label>Level<input data-k="level" type="number" value="${preset.level||5}"></label><label>Namespace<input value="minecraft" disabled></label><button class="remove-row" aria-label="Remove">×</button>`;
  if(kind==='attribute') row.innerHTML=`<label>Attribute<select data-k="id">${optionHtml(ATTRIBUTES,preset.id||'attack_damage')}</select></label><label>Amount<input data-k="amount" type="number" step="0.01" value="${preset.amount??5}"></label><label>Operation<select data-k="operation">${optionHtml([['add_value','Add value'],['add_multiplied_base','Multiply base'],['add_multiplied_total','Multiply total']],preset.operation||'add_value')}</select></label><label>When<select data-k="slot">${optionHtml(SLOTS,preset.slot||'mainhand')}</select></label><button class="remove-row" aria-label="Remove">×</button>`;
  if(kind==='effect') row.innerHTML=`<label>Effect<input data-k="id" list="effectList" value="${preset.id||'speed'}" placeholder="speed"></label><label>Amplifier<input data-k="amplifier" type="number" min="0" value="${preset.amplifier??1}"></label><label>Seconds<input value="2" disabled></label><label>When<select data-k="slot">${optionHtml(SLOTS,preset.slot||'mainhand')}</select></label><button class="remove-row" aria-label="Remove">×</button>`;
  host.appendChild(row); $('.remove-row',row).onclick=()=>{row.remove();refresh()}; row.addEventListener('input',refresh); row.addEventListener('change',refresh); refresh();
}

function renderPicker(){
  const q=$('#itemSearch').value.toLowerCase().trim(); const list=$('#itemList');
  let rows=ITEMS.filter(x=>x[2]===state.type && (!q || x[0].includes(q)||x[1].toLowerCase().includes(q))).slice(0,30);
  if(q && !rows.some(x=>x[0]===stripNs(q))){ rows.unshift([stripNs(q),`Use ID: ${ns(stripNs(q))}`,state.type]); }
  list.innerHTML=rows.map(x=>`<button class="picker-option" data-id="${x[0]}"><span>${x[1]}</span><small>${x[0]}</small></button>`).join('');
  list.classList.toggle('show',document.activeElement===$('#itemSearch'));
  $$('.picker-option',list).forEach(b=>b.onclick=()=>{state.item=b.dataset.id;$('#itemSearch').value='';list.classList.remove('show');refresh()});
}

function init(){
  $('#versionSelect').innerHTML=optionHtml(versions,state.version); $('#nameColor').innerHTML=optionHtml(COLORS,'aqua');
  document.body.insertAdjacentHTML('beforeend',`<datalist id="enchantList">${ENCHANTS.map(x=>`<option value="${x}">`).join('')}</datalist><datalist id="effectList">${EFFECTS.map(x=>`<option value="${x}">`).join('')}</datalist>`);
  $$('.panel').forEach(p=>p.classList.add('open'));
  $$('.choice').forEach(b=>b.onclick=()=>{$$('.choice').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.type=b.dataset.type;renderPicker();refresh()});
  $('#itemSearch').addEventListener('input',renderPicker); $('#itemSearch').addEventListener('focus',renderPicker); $('#itemSearch').addEventListener('blur',()=>setTimeout(()=>$('#itemList').classList.remove('show'),150));
  $('#versionSelect').onchange=e=>{state.version=e.target.value;refresh()};
  $$('input,select,textarea').forEach(el=>{if(!['versionSelect','itemSearch'].includes(el.id)){el.addEventListener('input',refresh);el.addEventListener('change',refresh)}});
  $$('[data-add]').forEach(b=>b.onclick=()=>addRow(b.dataset.add));
  $$('.command-tabs button').forEach(b=>b.onclick=()=>{$$('.command-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.output=b.dataset.output;refresh()});
  $('#copyBtn').onclick=async()=>{try{await navigator.clipboard.writeText($('#commandOutput').textContent)}catch{const t=document.createElement('textarea');t.value=$('#commandOutput').textContent;document.body.append(t);t.select();document.execCommand('copy');t.remove()}const toast=$('#toast');toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1300)};
  $('#themeToggle').onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark'};
  $('#resetBtn').onclick=()=>{location.reload()};
  $('#nameColor').value='white';
  refresh();
}
init();
