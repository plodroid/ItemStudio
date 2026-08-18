function uniqueEnchants(){
  const byId=new Map();
  for(const enchant of state.enchants){
    const id=stripNs(enchant.id.trim());
    if(!id) continue;
    byId.set(id,{...enchant,id});
  }
  return [...byId.values()];
}

const ENCHANT_MIN_VERSION={frost_walker:'1.9',mending:'1.9',binding_curse:'1.11',vanishing_curse:'1.11',sweeping_edge:'1.11.1',impaling:'1.13',loyalty:'1.13',riptide:'1.13',channeling:'1.13',multishot:'1.14',piercing:'1.14',quick_charge:'1.14',soul_speed:'1.16',swift_sneak:'1.19',density:'1.21',breach:'1.21',wind_burst:'1.21'};
const ATTRIBUTE_MIN_VERSION={attack_speed:'1.9',armor_toughness:'1.9',luck:'1.9',block_break_speed:'1.20.5',block_interaction_range:'1.20.5',entity_interaction_range:'1.20.5',fall_damage_multiplier:'1.20.5',gravity:'1.20.5',jump_strength:'1.20.5',safe_fall_distance:'1.20.5',scale:'1.20.5',step_height:'1.20.5',burning_time:'1.21',explosion_knockback_resistance:'1.21',mining_efficiency:'1.21',movement_efficiency:'1.21',oxygen_bonus:'1.21',sneaking_speed:'1.21',submerged_mining_speed:'1.21',sweeping_damage_ratio:'1.21',water_movement_efficiency:'1.21'};
function versionAtLeast(v,min){const t=min.split('.').map(Number);return cmp(v,t[0]||0,t[1]||0,t[2]||0)>=0;}
function enchantSupported(id){const min=ENCHANT_MIN_VERSION[stripNs(id)];return !min||versionAtLeast(state.version,min);}
function attributeSupported(id,slot){const min=ATTRIBUTE_MIN_VERSION[id];if(min&&!versionAtLeast(state.version,min))return false;if(slot==='offhand'&&cmp(state.version,1,9,0)<0)return false;return true;}

function legacyFormat(text,color='white',bold=false,italic=false){
  const colors={black:'0',dark_blue:'1',dark_green:'2',dark_aqua:'3',dark_red:'4',dark_purple:'5',gold:'6',gray:'7',dark_gray:'8',blue:'9',green:'a',aqua:'b',red:'c',light_purple:'d',yellow:'e',white:'f'};
  let out=`§${colors[color]||'f'}`;
  if(bold) out+='§l';
  if(italic) out+='§o';
  return out+String(text);
}

function legacyItemSpec(item,userDamage){
  const colors={white:0,orange:1,magenta:2,light_blue:3,yellow:4,lime:5,pink:6,gray:7,light_gray:8,cyan:9,purple:10,blue:11,brown:12,green:13,red:14,black:15};
  if(item==='player_head') return {id:'skull',data:3};
  if(item==='oak_planks') return {id:'planks',data:0};
  if(item==='spruce_planks') return {id:'planks',data:1};
  if(item==='dark_prismarine') return {id:'prismarine',data:1};
  const terr=item.match(/^(.+)_terracotta$/);
  if(terr && colors[terr[1]]!==undefined) return {id:'stained_hardened_clay',data:colors[terr[1]]};
  const concrete=item.match(/^(.+)_concrete$/);
  if(concrete && colors[concrete[1]]!==undefined && cmp(state.version,1,12,0)>=0) return {id:'concrete',data:colors[concrete[1]]};
  return {id:oldItemId(item),data:userDamage};
}

function attributeNbtId(base){
  if(cmp(state.version,1,16,0)>=0) return modernAttrId(base);
  return legacyAttrName(base);
}

function legacyUuidFields(i){
  if(cmp(state.version,1,16,0)>=0) return `UUID:[I;${uuidInts(i).join(',')}]`;
  const ints=uuidInts(i);
  const most=(BigInt(ints[0])<<32n) ^ BigInt(ints[1]>>>0);
  const least=(BigInt(ints[2])<<32n) ^ BigInt(ints[3]>>>0);
  return `UUIDMost:${most}L,UUIDLeast:${least}L`;
}

function generateGive(){
  const p=profile(), item=state.item || 'stone', count=Math.max(1,Math.floor(safeNum($('#count').value,1)));
  const name=$('#itemName').value.trim(), color=$('#nameColor').value, bold=$('#nameBold').checked, italic=$('#nameItalic').checked;
  const damage=Math.max(0,Math.floor(safeNum($('#damage').value,0))), model=$('#customModel').value.trim(), raw=$('#rawExtra').value.trim();
  const unbreakable=$('#unbreakable').checked, hideTooltip=$('#hideTooltip').checked, hideEnchants=$('#hideEnchants').checked;
  const enchants=uniqueEnchants().filter(x=>enchantSupported(x.id));
  const attributes=state.attributes.filter(x=>attributeSupported(x.id,x.slot));

  if(p.startsWith('components')){
    const c=[];
    if(name){
      const text=displayText(name,color,bold,italic);
      c.push(`minecraft:custom_name=${p==='components_simplified'?snbtCompoundText(text):snbtText(text)}`);
    }
    if(state.lore.length){
      const lore=state.lore.map(x=>displayText(x.text,x.color||'gray',false,!!x.italic));
      c.push(`minecraft:lore=[${lore.map(x=>p==='components_simplified'?snbtCompoundText(x):snbtText(x)).join(',')}]`);
    }
    if(enchants.length){
      const levels=enchants.map(x=>`${JSON.stringify(ns(x.id))}:${Math.max(0,Math.floor(safeNum(x.level,1)))}`).join(',');
      if(p==='components_simplified') c.push(`minecraft:enchantments={${levels}}`);
      else c.push(`minecraft:enchantments={levels:{${levels}},show_in_tooltip:${hideEnchants?'false':'true'}}`);
    }
    if(attributes.length){
      const mods=attributes.map((x,i)=>{
        const common=`type:${JSON.stringify(modernAttrId(x.id))},amount:${safeNum(x.amount,0)},operation:${JSON.stringify(x.operation)},slot:${JSON.stringify(x.slot)}`;
        if(p==='components_uuid') return `{${common},uuid:[I;${uuidInts(i).join(',')}],name:${JSON.stringify(`itemstudio.${slug(x.id)}.${i}`)}}`;
        return `{${common},id:${JSON.stringify(`itemstudio:${slug(x.id)}_${i}`)}}`;
      }).join(',');
      if(p==='components_simplified') c.push(`minecraft:attribute_modifiers=[${mods}]`);
      else c.push(`minecraft:attribute_modifiers={modifiers:[${mods}],show_in_tooltip:true}`);
    }
    if(unbreakable) c.push(p==='components_simplified'?'minecraft:unbreakable={}':'minecraft:unbreakable={show_in_tooltip:true}');
    if(damage>0) c.push(`minecraft:damage=${damage}`);
    if(model) c.push(cmp(state.version,1,21,5)>=0?`minecraft:custom_model_data={floats:[${safeNum(model,0)}]}`:`minecraft:custom_model_data=${Math.floor(safeNum(model,0))}`);
    if(p==='components_simplified'&&(hideTooltip||hideEnchants)){
      const hidden=[];
      if(hideEnchants) hidden.push('"minecraft:enchantments"');
      c.push(`minecraft:tooltip_display={hide_tooltip:${hideTooltip?'true':'false'},hidden_components:[${hidden.join(',')}]}`);
    }else if(hideTooltip){
      c.push('minecraft:hide_tooltip={}');
    }
    if(raw) c.push(raw.replace(/^\[|\]$/g,''));
    return `/give @p ${ns(item)}${c.length?`[${c.join(',')}]`:''} ${count}`;
  }

  const tag=[];
  const display=[];
  if(name){
    if(p==='nbt_modern') display.push(`Name:${snbtText(displayText(name,color,bold,italic))}`);
    else display.push(`Name:${JSON.stringify(legacyFormat(name,color,bold,italic))}`);
  }
  if(state.lore.length){
    if(p==='nbt_modern') display.push(`Lore:[${state.lore.map(x=>snbtText(displayText(x.text,x.color||'gray',false,!!x.italic))).join(',')}]`);
    else display.push(`Lore:[${state.lore.map(x=>JSON.stringify(legacyFormat(x.text,x.color||'gray',false,!!x.italic))).join(',')}]`);
  }
  if(display.length) tag.push(`display:{${display.join(',')}}`);
  if(enchants.length){
    if(p==='nbt_modern') tag.push(`Enchantments:[${enchants.map(x=>`{id:${JSON.stringify(ns(x.id))},lvl:${Math.floor(safeNum(x.level,1))}s}`).join(',')}]`);
    else tag.push(`ench:[${enchants.map(x=>`{id:${LEGACY_ENCHANT_IDS[stripNs(x.id)]??0}s,lvl:${Math.floor(safeNum(x.level,1))}s}`).join(',')}]`);
  }
  if(attributes.length){
    const mods=attributes.map((x,i)=>`{AttributeName:${JSON.stringify(attributeNbtId(x.id))},Name:${JSON.stringify(`itemstudio.${slug(x.id)}.${i}`)},Amount:${safeNum(x.amount,0)},Operation:${operationLegacy(x.operation)},${legacyUuidFields(i)},Slot:${JSON.stringify(x.slot)}}`).join(',');
    tag.push(`AttributeModifiers:[${mods}]`);
  }
  if(unbreakable) tag.push('Unbreakable:1b');
  if(model&&p==='nbt_modern') tag.push(`CustomModelData:${Math.floor(safeNum(model,0))}`);
  if(hideEnchants) tag.push('HideFlags:1');
  if(hideTooltip&&p==='nbt_modern') tag.push('HideFlags:127');
  if(raw) tag.push(raw.replace(/^\{|\}$/g,''));

  if(p==='nbt_legacy'){
    const spec=legacyItemSpec(item,damage);
    return `/give @p ${spec.id} ${count} ${spec.data}${tag.length?` {${tag.join(',')}}`:''}`;
  }
  return `/give @p ${ns(item)}${tag.length?`{${tag.join(',')}}`:''} ${count}`;
}

const LEGACY_EFFECT_IDS={speed:1,slowness:2,haste:3,mining_fatigue:4,strength:5,instant_health:6,instant_damage:7,jump_boost:8,nausea:9,regeneration:10,resistance:11,fire_resistance:12,water_breathing:13,invisibility:14,blindness:15,night_vision:16,hunger:17,weakness:18,poison:19,wither:20,health_boost:21,absorption:22,saturation:23,glowing:24,levitation:25,luck:26,unluck:27};

function effectSlotTarget(slot){
  const map={mainhand:'weapon.mainhand',offhand:'weapon.offhand',head:'armor.head',chest:'armor.chest',legs:'armor.legs',feet:'armor.feet'};
  return map[slot];
}

function legacyHeldNbt(item,slot){
  const id=ns(item);
  if(slot==='mainhand') return `{SelectedItem:{id:${JSON.stringify(id)}}}`;
  const slotIds={offhand:-106,head:103,chest:102,legs:101,feet:100};
  const s=slotIds[slot];
  if(s===undefined) return null;
  if(slot==='offhand'&&cmp(state.version,1,9,0)<0) return null;
  return `{Inventory:[{Slot:${s}b,id:${JSON.stringify(id)}}]}`;
}

function generateEffects(){
  if(!state.effects.length) return '# No conditional effects added.';
  const p=profile();
  if(cmp(state.version,1,13,0)>=0){
    return state.effects.map(e=>{
      const amp=Math.max(0,Math.floor(safeNum(e.amplifier,0))), effect=ns(e.id), slot=effectSlotTarget(e.slot);
      if(p.startsWith('components')) return `/execute as @a if items entity @s ${slot} ${ns(state.item)} run effect give @s ${effect} 2 ${amp} true`;
      const pred=legacyHeldNbt(state.item,e.slot);
      return pred?`/execute as @a if entity @s[nbt=${pred}] run effect give @s ${effect} 2 ${amp} true`:`# ${e.slot} is not available in ${state.version}`;
    }).join('\n');
  }

  const objective='itemstudioHold';
  const lines=[`/scoreboard objectives add ${objective} dummy`,`/scoreboard players set @a ${objective} 0`];
  state.effects.forEach(e=>{
    const pred=legacyHeldNbt(state.item,e.slot);
    if(!pred){ lines.push(`# ${e.slot} is not available in ${state.version}`); return; }
    const effectId=LEGACY_EFFECT_IDS[stripNs(e.id)];
    if(effectId===undefined){ lines.push(`# ${e.id} does not exist in ${state.version}`); return; }
    const amp=Math.max(0,Math.floor(safeNum(e.amplifier,0)));
    lines.push(`/scoreboard players set @a ${objective} 1 ${pred}`);
    lines.push(`/effect @a[score_${objective}_min=1] ${effectId} 2 ${amp} true`);
  });
  return lines.join('\n');
}
