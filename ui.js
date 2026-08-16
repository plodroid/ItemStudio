(() => {
  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];

  const baseGenerateGive = generateGive;
  generateGive = function () {
    if (!state.item) return 'Choose an item or block first.';
    return baseGenerateGive();
  };

  function exactVersionOptions() {
    const select = q('#versionSelect');
    if (!select) return;
    select.innerHTML = versions.map(v => `<option value="${v}">${v}</option>`).join('');
    select.value = state.version;
  }

  function setEditorTab(tab) {
    qa('[data-editor-tab]').forEach(button => {
      button.classList.toggle('active', button.dataset.editorTab === tab);
      button.setAttribute('aria-selected', button.dataset.editorTab === tab ? 'true' : 'false');
    });
    qa('[data-editor-panel]').forEach(panel => {
      panel.hidden = panel.dataset.editorPanel !== tab;
    });
  }

  function updateTabCounts() {
    const counts = {
      enchant: state.enchants.length,
      attribute: state.attributes.length,
      effect: state.effects.length
    };
    Object.entries(counts).forEach(([tab, count]) => {
      const button = q(`[data-editor-tab="${tab}"]`);
      if (!button) return;
      let badge = q('.tab-count', button);
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'tab-count';
        button.appendChild(badge);
      }
      badge.textContent = count ? String(count) : '';
      badge.hidden = !count;
    });
  }

  const baseRefresh = refresh;
  refresh = function () {
    if (state.item) {
      baseRefresh();
      updateTabCounts();
      return;
    }

    syncStateFromRows();
    const p = profile();
    const syntax = {
      components_simplified: '1.21.5+ command format',
      components_id: '1.21–1.21.4 command format',
      components_uuid: '1.20.5–1.20.6 command format',
      nbt_modern: '1.13–1.20.4 command format',
      nbt_legacy: '1.8–1.12 command format'
    };

    q('#syntaxPill').textContent = syntax[p];
    q('#versionNote').textContent = 'Syntax is handled automatically.';
    q('#rawExtraLabel').textContent = p.startsWith('components') ? 'Extra component entries' : 'Extra NBT tags';
    q('#rawHint').textContent = 'Optional — beginners can leave this empty.';
    q('#selectedItemCard').textContent = 'No item selected.';
    q('#previewName').textContent = 'Choose an item';
    q('#previewName').style.color = '';
    q('#previewEnchants').textContent = '';
    q('#previewLore').textContent = '';
    q('#previewAttrs').textContent = '';
    q('#mcIcon').textContent = '◆';
    q('#miniSummary').innerHTML = '<div><b>0</b><small>enchants</small></div><div><b>0</b><small>attributes</small></div><div><b>0</b><small>effects</small></div>';
    q('#effectCountBadge').textContent = '0';
    q('#commandOutput').textContent = 'Choose an item or block first.';
    q('#commandHelp').textContent = 'Start with the item search at the top.';
    q('#warningBox').hidden = true;
    q('#validationLabel').textContent = 'Waiting for an item';
    updateTabCounts();
  };

  const search = q('#itemSearch');
  const list = q('#itemList');

  function showPicker() {
    if (!search || !list) return;
    renderPicker();
    list.classList.add('show');
  }

  if (search && list) {
    search.addEventListener('focus', () => requestAnimationFrame(showPicker));
    search.addEventListener('input', () => requestAnimationFrame(showPicker));

    list.addEventListener('pointerdown', event => {
      const option = event.target.closest('.picker-option');
      if (!option) return;
      event.preventDefault();
      state.item = option.dataset.id;
      search.value = '';
      list.classList.remove('show');
      refresh();
    });
  }

  qa('#typeChoice .choice').forEach(button => {
    button.addEventListener('click', () => {
      state.item = '';
      if (search) search.value = '';
      requestAnimationFrame(() => {
        refresh();
        if (search) {
          search.focus();
          showPicker();
        }
      });
    });
  });

  qa('[data-editor-tab]').forEach(button => {
    button.addEventListener('click', () => setEditorTab(button.dataset.editorTab));
  });

  exactVersionOptions();
  setEditorTab('basic');
  state.item = '';
  refresh();
})();
