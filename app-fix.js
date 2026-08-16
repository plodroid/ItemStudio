// UI + blank-start fixes layered over the core generator.
// Keep this file small so the command-generation logic stays isolated in app-1/2/3.

const itemStudioGenerateGive = generateGive;
generateGive = function(){
  if(!state.item) return 'Choose an item or block first.';
  return itemStudioGenerateGive();
};

function exactVersionOptions(){
  const select = $('#versionSelect');
  if(!select) return;
  select.innerHTML = versions.map(v => `<option value="${v}">${v}</option>`).join('');
  select.value = state.version;
}

function setEditorTab(tab){
  $$('[data-editor-tab]').forEach(button => {
    button.classList.toggle('active', button.dataset.editorTab === tab);
  });
  $$('[data-editor-panel]').forEach(panel => {
    panel.hidden = panel.dataset.editorPanel !== tab;
  });
}

function updateTabCounts(){
  const counts = {
    enchant: state.enchants.length,
    attribute: state.attributes.length,
    effect: state.effects.length
  };
  Object.entries(counts).forEach(([tab,count]) => {
    const button = $(`[data-editor-tab="${tab}"]`);
    if(!button) return;
    let badge = $('.tab-count', button);
    if(!badge){
      badge = document.createElement('span');
      badge.className = 'tab-count';
      button.appendChild(badge);
    }
    badge.textContent = count ? String(count) : '';
    badge.hidden = !count;
  });
}

const itemStudioRefresh = refresh;
refresh = function(){
  if(state.item){
    itemStudioRefresh();
    updateTabCounts();
    return;
  }

  syncStateFromRows();
  const p = profile();
  $('#syntaxPill').textContent = ({
    components_simplified:'1.21.5+ command format',
    components_id:'1.21–1.21.4 command format',
    components_uuid:'1.20.5–1.20.6 command format',
    nbt_modern:'1.13–1.20.4 command format',
    nbt_legacy:'1.8–1.12 command format'
  })[p];
  $('#versionNote').textContent = 'ItemStudio chooses the syntax automatically.';
  $('#rawExtraLabel').textContent = p.startsWith('components') ? 'Extra component entries' : 'Extra NBT tags';
  $('#rawHint').textContent = 'Optional. Only use raw data if you know you need it.';
  $('#selectedItemCard').textContent = 'No item selected.';
  $('#previewName').textContent = 'Choose an item';
  $('#previewName').style.color = '';
  $('#previewEnchants').textContent = '';
  $('#previewLore').textContent = '';
  $('#previewAttrs').textContent = '';
  $('#mcIcon').textContent = '◆';
  $('#miniSummary').innerHTML = '<div><b>0</b><small>enchants</small></div><div><b>0</b><small>attributes</small></div><div><b>0</b><small>effects</small></div>';
  $('#effectCountBadge').textContent = '0';
  $('#commandOutput').textContent = 'Choose an item or block first.';
  $('#commandHelp').textContent = 'Start by searching for an item or block above.';
  $('#warningBox').hidden = true;
  $('#validationLabel').textContent = 'Waiting for an item';
  updateTabCounts();
};

// The old generic option helper prettified version strings as "1 21 11".
// Rebuild the version selector with literal labels so 1.21.11 stays 1.21.11.
exactVersionOptions();

// Make the picker reliable even when the search box loses focus before a click finishes.
const itemList = $('#itemList');
if(itemList){
  itemList.addEventListener('pointerdown', event => {
    const option = event.target.closest('.picker-option');
    if(!option) return;
    event.preventDefault();
    state.item = option.dataset.id;
    $('#itemSearch').value = '';
    itemList.classList.remove('show');
    refresh();
  });
}

// Switching Item / Block now clears the previous selection instead of keeping a mismatched item.
$$('#typeChoice .choice').forEach(button => {
  button.addEventListener('click', () => {
    state.item = '';
    $('#itemSearch').value = '';
    setTimeout(() => {
      renderPicker();
      refresh();
      $('#itemSearch').focus();
    }, 0);
  });
});

// Beginner-friendly editor: show one section at a time.
$$('[data-editor-tab]').forEach(button => {
  button.addEventListener('click', () => setEditorTab(button.dataset.editorTab));
});
setEditorTab('basic');

// Start genuinely blank — no preselected pickaxe, command, enchant, or attribute.
state.item = '';
refresh();
