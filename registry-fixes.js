(() => {
  const oldSpear = ITEMS.findIndex(x => x[0] === 'spear');
  if (oldSpear >= 0) ITEMS.splice(oldSpear, 1);

  const spearItems = [
    ['wooden_spear','Wooden Spear','item'],['stone_spear','Stone Spear','item'],['copper_spear','Copper Spear','item'],
    ['iron_spear','Iron Spear','item'],['golden_spear','Golden Spear','item'],['diamond_spear','Diamond Spear','item'],['netherite_spear','Netherite Spear','item']
  ];
  for (const entry of spearItems) if (!ITEMS.some(x => x[0] === entry[0])) ITEMS.push(entry);

  if (!ENCHANTS.includes('lunge')) ENCHANTS.push('lunge');
  const enchantList = document.querySelector('#enchantList');
  if (enchantList && ![...enchantList.options].some(o => o.value === 'lunge')) {
    const option = document.createElement('option'); option.value = 'lunge'; enchantList.appendChild(option);
  }

  const beforeGenerate = generateGive;
  generateGive = function () {
    if (/_spear$/.test(state.item) && cmp(state.version,1,21,11) < 0) {
      return `# ${state.item} does not exist in Minecraft ${state.version}. Spears were added in 1.21.11.`;
    }
    return beforeGenerate();
  };

  const beforeWarnings = warnings;
  warnings = function () {
    const out = beforeWarnings();
    if (/_spear$/.test(state.item) && cmp(state.version,1,21,11) < 0) out.push('Spear items are only available in Minecraft 1.21.11 and newer.');
    return [...new Set(out)];
  };

  const beforeIcon = iconFor;
  iconFor = id => /_spear$/.test(id) ? '🔱' : beforeIcon(id);
})();
