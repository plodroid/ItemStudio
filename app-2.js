function uniqueEnchants(){
  // Enchantment components are a map in modern Minecraft, so duplicate IDs must
  // collapse to one value. The last row wins, matching normal editor behavior.
  const byId=new Map();
  for(const enchant of state.enchants){
    const id=stripNs(enchant.id.trim());
    if(!id) continue;
    byId.set(id,{...enchant,id});
  }
  return [...byId.values()];
}

function commandRoot(name){
  // ItemStudio is primarily aimed at command blocks on Paper servers. Plugins
  // such as EssentialsX can override /give, so always call the vanilla command.
  return `minecraft:${name}`;
}

function generateGive(){
  const p=profile(), item=state.item || 'stone', count=Math.max(1,Math.floor(safeNum($('#count').value,1)));
  const name=$('#itemName').value.trim(), color=$('#nameColor').value, bold=$('#nameBold').checked, italic=$('#nameItalic').checked;
  const damage=Math.max(0,Math.floor(safeNum($('#damage').value,0))), model=$('#customModel').value.trim(), raw=$('#rawExtra').value.trim();
  const unbreakable=$('#unbreakable').checked, hideTooltip=$('#hideTooltip').checked, hideEnchants=$('#hideEnchants').checked;
  const enchants=uniqueEnchants();

  if(p.startsWith('components')){
    const c=[];
    if(name){
      const text = displayText(name,color,bold,italic);
      c.push(`minecraft:custom_name=${p==='components_simplified' ? snbtCompoundText(text) : snbtText(text)}`);
    }
    if(state.lore.length){
      const lore = state.lore.map(x=>displayText(x.text,x.color||'gray',false,!!x.italic));
      c.push(`minecraft:lore=[${lore.map(x=>p==='components_simplified' ? snbtCompoundText(x) : snbtText(x)).join(',')}]`);
    }
    if(enchants.length){
      const levels=enchants.map(x=>`${JSON.stringify(ns(x.id))}:${Math.max(0,Math.floor(safeNum(x.level,1)))}`).join(',');
      if(p==='components_simplified') c.push(`minecraft:enchantments={${levels}}`);
      else c.push(`minecraft:enchantments={levels:{${levels}},show_in_tooltip:${hideEnchants?'false':'true'}}`);
    }
    if(state.attributes.length){
      const mods=state.attributes.map((x,i)=>{
        const common=`type:${JSON.stringify(modernAttrId(x.id))},amount:${safeNum(x.amount,0)},operation:${JSON.stringify(x.operation)},slot:${JSON.stringify(x.slot)}`;
        if(p==='components_uuid') return `{${common},uuid:[I;${uuidInts(i).join(',')}],name:${JSON.stringify(`itemstudio.${slug(x.id)}.${i}`)}}`;
        return `{${common},id:${JSON.stringify(`itemstudio:${slug(x.id)}_${i}`)}}`;
      }).join(',');
      if(p==='components_simplified') c.push(`minecraft:attribute_modifiers=[${mods}]`);
      else c.push(`minecraft:attribute_modifiers={modifiers:[${mods}],show_in_tooltip:true}`);
    }
    if(unbreakable){
      if(p==='components_simplified') c.push(`minecraft:unbreakable={}`);
      else c.push(`minecraft:unbreakable={show_in_tooltip:true}`);
    }
    if(damage>0) c.push(`minecraft:damage=${damage}`);
    if(model){
      if(cmp(state.version,1,21,5)>=0) c.push(`minecraft:custom_model_data={floats:[${safeNum(model,0)}]}`);
      else c.push(`minecraft:custom_model_data=${Math.floor(safeNum(model,0))}`);
    }
    if(p==='components_simplified' && (hideTooltip || hideEnchants)){
      const hidden=[]; if(hideEnchants) hidden.push(`"minecraft:enchantments"`);
      c.push(`minecraft:tooltip_display={hide_tooltip:${hideTooltip?'true':'false'},hidden_components:[${hidden.join(',')}]}`);
    } else if(hideTooltip){ c.push(`minecraft:hide_tooltip={}`); }
    if(raw) c.push(raw.replace(/^\[|\]$/g,''));
    return `${commandRoot('give')} @p ${ns(item)}${c.length?`[${c.join(',')}]`:''} ${count}`;
  }

  const tag=[];
  const display=[];
  if(name){
    if(p==='nbt_modern') display.push(`Name:${snbtText(displayText(name,color,bold,italic))}`);
    else display.push(`Name:${JSON.stringify(name)}`);
  }
  if(state.lore.length){
    if(p==='nbt_modern') display.push(`Lore:[${state.lore.map(x=>snbtText(displayText(x.text,x.color||'gray',false,!!x.italic))).join(',')}]`);
    else display.push(`Lore:[${state.lore.map(x=>JSON.stringify(x.text)).join(',')}]`);
  }
  if(display.length) tag.push(`display:{${display.join(',')}}`);
  if(enchants.length){
    if(p==='nbt_modern') tag.push(`Enchantments:[${enchants.map(x=>`{id:${JSON.stringify(ns(x.id))},lvl:${Math.floor(safeNum(x.level,1))}s}`).join(',')}]`);
    else tag.push(`ench:[${enchants.map(x=>`{id:${LEGACY_ENCHANT_IDS[stripNs(x.id)] ?? 0}s,lvl:${Math.floor(safeNum(x.level,1))}s}`).join(',')}]`);
  }
  if(state.attributes.length){
    tag.push(`AttributeModifiers:[${state.attributes.map((x,i)=>`{AttributeName:${JSON.stringify(legacyAttrName(x.id))},Name:${JSON.stringify(`itemstudio.${slug(x.id)}.${i}`)},Amount:${safeNum(x.amount,0)},Operation:${operationLegacy(x.operation)},UUID:[I;${uuidInts(i).join(',')}],Slot:${JSON.stringify(x.slot)}}`).join(',')}]`);
  }
  if(unbreakable) tag.push('Unbreakable:1b');
  if(model && p==='nbt_modern') tag.push(`CustomModelData:${Math.floor(safeNum(model,0))}`);
  if(hideEnchants) tag.push('HideFlags:1');
  if(hideTooltip && p==='nbt_modern') tag.push('HideFlags:127');
  if(raw) tag.push(raw.replace(/^\{|\}$/g,''));
  const data = p==='nbt_legacy' ? ` ${count} ${damage}` : ` ${count}`;
  return `${commandRoot('give')} @p ${p==='nbt_legacy'?oldItemId(item):ns(item)}${tag.length?`{${tag.join(',')}}`:''}${data}`;
}

function effectSlotTarget(slot){
  const map={mainhand:'weapon.mainhand',offhand:'weapon.offhand',head:'armor.head',chest:'armor.chest',legs:'armor.legs',feet:'armor.feet'};
  return map[slot];
}
function generateEffects(){
  if(!state.effects.length) return '# No conditional effects added.';
  const p=profile();
  return state.effects.map((e,i)=>{
    const amp=Math.max(0,Math.floor(safeNum(e.amplifier,0))), effect=ns(e.id), slot=effectSlotTarget(e.slot);
    if(p.startsWith('components')){
      return `${commandRoot('execute')} as @a if items entity @s ${slot} ${ns(state.item)} run ${commandRoot('effect')} give @s ${effect} 2 ${amp} true`;
    }
    if(cmp(state.version,1,13,0)>=0){
      const nbtSlot={mainhand:'SelectedItem',offhand:'Inventory[{Slot:-106b}]',head:'Inventory[{Slot:103b}]',chest:'Inventory[{Slot:102b}]',legs:'Inventory[{Slot:101b}]',feet:'Inventory[{Slot:100b}]'}[e.slot];
      const id=ns(state.item);
      const pred=e.slot==='mainhand'?`{SelectedItem:{id:${JSON.stringify(id)}}}`:`{${nbtSlot.split('[')[0]}:[{${nbtSlot.match(/\{(.+)\}/)?.[1]||''},id:${JSON.stringify(id)}}]}`;
      return `${commandRoot('execute')} as @a if entity @s[nbt=${pred}] run ${commandRoot('effect')} give @s ${effect} 2 ${amp} true`;
    }
    return `# ${state.version}: conditional held/equipped effect checks vary in legacy command syntax. Use a repeating command block with /testfor + /effect for this version.`;
  }).join('\n');
}
