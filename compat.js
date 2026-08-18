(() => {
  const ALL_VERSIONS = [
    '1.21.11','1.21.10','1.21.9','1.21.8','1.21.7','1.21.6','1.21.5','1.21.4','1.21.3','1.21.2','1.21.1','1.21',
    '1.20.6','1.20.5','1.20.4','1.20.3','1.20.2','1.20.1','1.20',
    '1.19.4','1.19.3','1.19.2','1.19.1','1.19',
    '1.18.2','1.18.1','1.18',
    '1.17.1','1.17',
    '1.16.5','1.16.4','1.16.3','1.16.2','1.16.1','1.16',
    '1.15.2','1.15.1','1.15',
    '1.14.4','1.14.3','1.14.2','1.14.1','1.14',
    '1.13.2','1.13.1','1.13',
    '1.12.2','1.12.1','1.12',
    '1.11.2','1.11.1','1.11',
    '1.10.2','1.10.1','1.10',
    '1.9.4','1.9.3','1.9.2','1.9.1','1.9',
    '1.8.9','1.8.8','1.8.7','1.8.6','1.8.5','1.8.4','1.8.3','1.8.2','1.8.1','1.8'
  ];

  versions.splice(0, versions.length, ...ALL_VERSIONS);

  const vcmp = (a, b) => {
    const A = a.split('.').map(Number), B = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      const d = (A[i] || 0) - (B[i] || 0);
      if (d) return d;
    }
    return 0;
  };
  const atLeast = min => vcmp(state.version, min) >= 0;

  // Keep the output as normal vanilla-style slash commands, as requested.
  commandRoot = name => `/${name}`;

  const pre1212Attribute = id => {
    const player = new Set([
      'block_break_speed','block_interaction_range','entity_interaction_range',
      'mining_efficiency','sneaking_speed','submerged_mining_speed','sweeping_damage_ratio'
    ]);
    return `minecraft:${player.has(id) ? 'player' : 'generic'}.${id}`;
  };

  modernAttrId = base => atLeast('1.21.2') ? `minecraft:${base}` : pre1212Attribute(base);

  const OLD_ATTR = {
    max_health:'generic.maxHealth', follow_range:'generic.followRange',
    knockback_resistance:'generic.knockbackResistance', movement_speed:'generic.movementSpeed',
    flying_speed:'generic.flyingSpeed', attack_damage:'generic.attackDamage',
    attack_knockback:'generic.attackKnockback', attack_speed:'generic.attackSpeed',
    armor:'generic.armor', armor_toughness:'generic.armorToughness', luck:'generic.luck'
  };

  legacyAttrName = base => {
    if (atLeast('1.16')) {
      const snake = {
        max_health:'max_health', follow_range:'follow_range', knockback_resistance:'knockback_resistance',
        movement_speed:'movement_speed', flying_speed:'flying_speed', attack_damage:'attack_damage',
        attack_knockback:'attack_knockback', attack_speed:'attack_speed', armor:'armor',
        armor_toughness:'armor_toughness', luck:'luck'
      }[base] || base;
      return `minecraft:generic.${snake}`;
    }
    return OLD_ATTR[base] || `generic.${base}`;
  };

  const ENCHANT_MIN = {
    frost_walker:'1.9', mending:'1.9', binding_curse:'1.11', vanishing_curse:'1.11',
    sweeping_edge:'1.11.1', channeling:'1.13', impaling:'1.13', loyalty:'1.13', riptide:'1.13',
    multishot:'1.14', piercing:'1.14', quick_charge:'1.14', soul_speed:'1.16',
    swift_sneak:'1.19', breach:'1.21', density:'1.21', wind_burst:'1.21', lunge:'1.21.11'
  };

  const ATTR_MIN = {
    attack_speed:'1.9', armor:'1.9', armor_toughness:'1.9', luck:'1.9', flying_speed:'1.9', attack_knockback:'1.9',
    scale:'1.20.5', block_interaction_range:'1.20.5', entity_interaction_range:'1.20.5', step_height:'1.20.5',
    gravity:'1.20.5', safe_fall_distance:'1.20.5', fall_damage_multiplier:'1.20.5', jump_strength:'1.20.5',
    block_break_speed:'1.20.5', mining_efficiency:'1.21', movement_efficiency:'1.21', oxygen_bonus:'1.21',
    sneaking_speed:'1.21', submerged_mining_speed:'1.21', sweeping_damage_ratio:'1.21', water_movement_efficiency:'1.21',
    burning_time:'1.21', explosion_knockback_resistance:'1.21'
  };

  const EFFECT_MIN = {
    glowing:'1.9', levitation:'1.9', luck:'1.9', unluck:'1.9', slow_falling:'1.13', conduit_power:'1.13',
    dolphins_grace:'1.13', bad_omen:'1.14', hero_of_the_village:'1.14', darkness:'1.19',
    trial_omen:'1.21', raid_omen:'1.21', wind_charged:'1.21', weaving:'1.21', oozing:'1.21', infested:'1.21'
  };

  const ITEM_MIN = {
    shield:'1.9', elytra:'1.9', totem_of_undying:'1.11', shulker_box:'1.11',
    trident:'1.13', crossbow:'1.14', jigsaw:'1.14',
    netherite_pickaxe:'1.16', netherite_sword:'1.16', netherite_axe:'1.16', netherite_shovel:'1.16', netherite_hoe:'1.16',
    netherite_helmet:'1.16', netherite_chestplate:'1.16', netherite_leggings:'1.16', netherite_boots:'1.16',
    netherite_block:'1.16', crying_obsidian:'1.16', warped_fungus_on_a_stick:'1.16',
    raw_gold_block:'1.17', light:'1.17', recovery_compass:'1.19', goat_horn:'1.19', mace:'1.21', spear:'1.21.11'
  };

  const existsInVersion = (id, table) => !table[id] || atLeast(table[id]);

  const DYES = ['white','orange','magenta','light_blue','yellow','lime','pink','gray','light_gray','cyan','purple','blue','brown','green','red','black'];
  function legacyItemInfo(id, damage) {
    let data = damage;
    const terracotta = id.match(/^(.+)_terracotta$/);
    if (terracotta && DYES.includes(terracotta[1])) return {id:'stained_hardened_clay',data:DYES.indexOf(terracotta[1])};
    const concrete = id.match(/^(.+)_concrete$/);
    if (concrete && DYES.includes(concrete[1])) return {id:'concrete',data:DYES.indexOf(concrete[1]),min:'1.12'};
    if (id === 'oak_planks') return {id:'planks',data:0};
    if (id === 'spruce_planks') return {id:'planks',data:1};
    if (id === 'prismarine') return {id:'prismarine',data:0};
    if (id === 'dark_prismarine') return {id:'prismarine',data:2};
    if (id === 'player_head') return {id:'skull',data:3};
    if (id === 'enchanted_golden_apple') return {id:'golden_apple',data:1};
    if (id === 'totem_of_undying') return {id:'totem',data:0,min:'1.11'};
    return {id:stripNs(id),data};
  }

  const COLOR_CODE = {
    black:'0',dark_blue:'1',dark_green:'2',dark_aqua:'3',dark_red:'4',dark_purple:'5',gold:'6',gray:'7',
    dark_gray:'8',blue:'9',green:'a',aqua:'b',red:'c',light_purple:'d',yellow:'e',white:'f'
  };
  function legacyText(text, color, bold, italic) {
    let prefix = `§${COLOR_CODE[color] || 'f'}`;
    if (bold) prefix += '§l';
    if (italic) prefix += '§o';
    return prefix + text;
  }

  function compatibleEnchants() {
    const map = new Map();
    for (const e of state.enchants) {
      const id = stripNs(String(e.id || '').trim());
      if (!id || !existsInVersion(id, ENCHANT_MIN)) continue;
      map.set(id, {...e,id});
    }
    return [...map.values()];
  }

  function compatibleAttrs() {
    return state.attributes.filter(a => {
      if (!existsInVersion(a.id, ATTR_MIN)) return false;
      if (!atLeast('1.9') && a.slot === 'offhand') return false;
      if (!atLeast('1.20.5') && !OLD_ATTR[a.id]) return false;
      return true;
    });
  }

  function uuidPair(i) {
    return {most: 910000 + i, least: 240000 + i};
  }

  const modernGenerateGive = generateGive;
  generateGive = function () {
    if (!state.item) return 'Choose an item or block first.';
    if (!existsInVersion(state.item, ITEM_MIN)) return `# ${state.item} does not exist in Minecraft ${state.version}.`;

    // 1.20.5+ is already component-based; temporarily remove version-impossible rows.
    if (atLeast('1.20.5')) {
      const oldE = state.enchants, oldA = state.attributes;
      state.enchants = compatibleEnchants();
      state.attributes = compatibleAttrs();
      try { return modernGenerateGive(); }
      finally { state.enchants = oldE; state.attributes = oldA; }
    }

    const item = state.item;
    const count = Math.max(1, Math.floor(safeNum($('#count').value, 1)));
    const name = $('#itemName').value.trim();
    const color = $('#nameColor').value;
    const bold = $('#nameBold').checked, italic = $('#nameItalic').checked;
    const damage = Math.max(0, Math.floor(safeNum($('#damage').value, 0)));
    const model = $('#customModel').value.trim();
    const raw = $('#rawExtra').value.trim();
    const unbreakable = $('#unbreakable').checked, hideTooltip = $('#hideTooltip').checked, hideEnchants = $('#hideEnchants').checked;
    const enchants = compatibleEnchants(), attrs = compatibleAttrs();
    const tag = [], display = [];

    if (atLeast('1.13')) {
      if (name) display.push(`Name:${snbtText(displayText(name,color,bold,italic))}`);
      if (state.lore.length) display.push(`Lore:[${state.lore.map(x=>snbtText(displayText(x.text,x.color||'gray',false,!!x.italic))).join(',')}]`);
    } else {
      if (name) display.push(`Name:${JSON.stringify(legacyText(name,color,bold,italic))}`);
      if (state.lore.length) display.push(`Lore:[${state.lore.map(x=>JSON.stringify(legacyText(x.text,x.color||'gray',false,!!x.italic))).join(',')}]`);
    }
    if (display.length) tag.push(`display:{${display.join(',')}}`);

    if (enchants.length) {
      if (atLeast('1.13')) tag.push(`Enchantments:[${enchants.map(x=>`{id:${JSON.stringify(ns(x.id))},lvl:${Math.floor(safeNum(x.level,1))}s}`).join(',')}]`);
      else tag.push(`ench:[${enchants.map(x=>`{id:${LEGACY_ENCHANT_IDS[x.id] ?? 0}s,lvl:${Math.floor(safeNum(x.level,1))}s}`).join(',')}]`);
    }

    if (attrs.length) {
      const mods = attrs.map((a,i) => {
        const core = `AttributeName:${JSON.stringify(legacyAttrName(a.id))},Name:${JSON.stringify(`itemstudio.${slug(a.id)}.${i}`)},Amount:${safeNum(a.amount,0)},Operation:${operationLegacy(a.operation)},Slot:${JSON.stringify(a.slot)}`;
        if (atLeast('1.16')) return `{${core},UUID:[I;${uuidInts(i).join(',')}]}`;
        const u = uuidPair(i);
        return `{${core},UUIDMost:${u.most}L,UUIDLeast:${u.least}L}`;
      }).join(',');
      tag.push(`AttributeModifiers:[${mods}]`);
    }

    if (unbreakable) tag.push('Unbreakable:1b');
    if (hideEnchants) tag.push('HideFlags:1');
    if (hideTooltip && atLeast('1.13')) tag.push('HideFlags:127');
    if (damage > 0 && atLeast('1.13')) tag.push(`Damage:${damage}`);
    if (model && atLeast('1.14')) tag.push(`CustomModelData:${Math.floor(safeNum(model,0))}`);
    if (raw) tag.push(raw.replace(/^\{|\}$/g,''));

    if (atLeast('1.13')) {
      return `/give @p ${ns(item)}${tag.length ? `{${tag.join(',')}}` : ''} ${count}`;
    }

    const legacy = legacyItemInfo(item, damage);
    if (legacy.min && !atLeast(legacy.min)) return `# ${item} does not exist in Minecraft ${state.version}.`;
    // Pre-1.13 order is: player, item, count, data, then NBT.
    return `/give @p ${legacy.id} ${count} ${legacy.data}${tag.length ? ` {${tag.join(',')}}` : ''}`;
  };

  const oldWarnings = warnings;
  warnings = function () {
    const out = oldWarnings().filter(x => !x.includes('Some newer attributes were added after older releases'));
    if (state.item && !existsInVersion(state.item, ITEM_MIN)) out.push(`${state.item} was added after Minecraft ${state.version}, so no valid /give command exists for this version.`);
    const badE = state.enchants.filter(e => !existsInVersion(stripNs(e.id), ENCHANT_MIN));
    if (badE.length) out.push(`Skipped ${badE.length} enchantment${badE.length>1?'s':''} that did not exist in ${state.version}.`);
    const badA = state.attributes.filter(a => !compatibleAttrs().includes(a));
    if (badA.length) out.push(`Skipped ${badA.length} attribute${badA.length>1?'s':''} that did not exist or could not apply in ${state.version}.`);
    if (!atLeast('1.9') && state.attributes.some(a => a.slot === 'offhand')) out.push('Offhand slots do not exist in 1.8.x; those modifiers are skipped.');
    return [...new Set(out)];
  };

  const oldEffects = generateEffects;
  generateEffects = function () {
    const valid = state.effects.filter(e => existsInVersion(stripNs(e.id), EFFECT_MIN));
    if (!valid.length && state.effects.length) return `# The selected effect(s) do not exist in Minecraft ${state.version}.`;
    const before = state.effects;
    state.effects = valid;
    try { return oldEffects(); }
    finally { state.effects = before; }
  };
})();
