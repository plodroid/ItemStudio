// Blank-start behavior: ItemStudio should not preselect or generate a default item.
const itemStudioGenerateGive = generateGive;
generateGive = function(){
  if(!state.item) return '# Choose an item or block first.';
  return itemStudioGenerateGive();
};
const itemStudioRefresh = refresh;
refresh = function(){
  if(state.item) return itemStudioRefresh();
  syncStateFromRows();
  const p=profile();
  $('#syntaxPill').textContent=({components_simplified:'1.21.5+ components',components_id:'1.21–1.21.4 components',components_uuid:'1.20.5–1.20.6 components',nbt_modern:'1.13–1.20.4 NBT',nbt_legacy:'1.8–1.12 legacy NBT'})[p];
  $('#versionNote').textContent=p.startsWith('components')?'Uses Java Edition item stack components.':'Uses the NBT command format from this release family.';
  $('#selectedItemCard').textContent='Nothing selected yet.';
  $('#previewName').textContent='Choose an item';
  $('#previewName').style.color='';
  $('#previewEnchants').textContent='';
  $('#previewLore').textContent='';
  $('#previewAttrs').textContent='';
  $('#mcIcon').textContent='◆';
  $('#miniSummary').innerHTML='<div><b>0</b><small>enchants</small></div><div><b>0</b><small>attributes</small></div><div><b>0</b><small>effects</small></div>';
  $('#effectCountBadge').textContent='0';
  $('#commandOutput').textContent='# Choose an item or block first.';
  $('#commandHelp').textContent='Start by searching for an item or block above.';
  $('#warningBox').hidden=true;
  $('#validationLabel').textContent='Waiting for an item';
};
state.item='';
refresh();
