'use strict';

const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => [...root.querySelectorAll(q)];
const escJson = s => JSON.stringify(String(s ?? ''));
const ns = id => id.includes(':') ? id : `minecraft:${id}`;
const stripNs = id => id.replace(/^minecraft:/,'');
const safeNum = (n, fallback=0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9_./-]+/g,'_').replace(/^_+|_+$/g,'') || 'modifier';

const versions = [
  '1.21.11','1.21.10','1.21.9','1.21.8','1.21.7','1.21.6','1.21.5','1.21.4','1.21.3','1.21.2','1.21.1','1.21','1.20.6','1.20.5','1.20.4','1.20.3','1.20.2','1.20.1','1.20','1.19.4','1.19','1.18','1.17','1.16','1.15','1.14','1.13','1.12','1.11','1.10','1.9','1.8'
];

const COLORS = ['white','gray','dark_gray','black','red','dark_red','gold','yellow','green','dark_green','aqua','dark_aqua','blue','dark_blue','light_purple','dark_purple'];

const ITEMS = [
  ['diamond_pickaxe','Diamond Pickaxe','item'],['netherite_pickaxe','Netherite Pickaxe','item'],['iron_pickaxe','Iron Pickaxe','item'],['golden_pickaxe','Golden Pickaxe','item'],['stone_pickaxe','Stone Pickaxe','item'],['wooden_pickaxe','Wooden Pickaxe','item'],
  ['diamond_sword','Diamond Sword','item'],['netherite_sword','Netherite Sword','item'],['iron_sword','Iron Sword','item'],['golden_sword','Golden Sword','item'],['stone_sword','Stone Sword','item'],['wooden_sword','Wooden Sword','item'],
  ['diamond_axe','Diamond Axe','item'],['netherite_axe','Netherite Axe','item'],['iron_axe','Iron Axe','item'],['diamond_shovel','Diamond Shovel','item'],['netherite_shovel','Netherite Shovel','item'],['diamond_hoe','Diamond Hoe','item'],['netherite_hoe','Netherite Hoe','item'],
  ['bow','Bow','item'],['crossbow','Crossbow','item'],['trident','Trident','item'],['mace','Mace','item'],['spear','Spear','item'],['shield','Shield','item'],['elytra','Elytra','item'],['fishing_rod','Fishing Rod','item'],['shears','Shears','item'],['flint_and_steel','Flint and Steel','item'],
  ['diamond_helmet','Diamond Helmet','item'],['diamond_chestplate','Diamond Chestplate','item'],['diamond_leggings','Diamond Leggings','item'],['diamond_boots','Diamond Boots','item'],['netherite_helmet','Netherite Helmet','item'],['netherite_chestplate','Netherite Chestplate','item'],['netherite_leggings','Netherite Leggings','item'],['netherite_boots','Netherite Boots','item'],
  ['totem_of_undying','Totem of Undying','item'],['golden_apple','Golden Apple','item'],['enchanted_golden_apple','Enchanted Golden Apple','item'],['stick','Stick','item'],['blaze_rod','Blaze Rod','item'],['carrot_on_a_stick','Carrot on a Stick','item'],['warped_fungus_on_a_stick','Warped Fungus on a Stick','item'],['book','Book','item'],['written_book','Written Book','item'],['paper','Paper','item'],['compass','Compass','item'],['recovery_compass','Recovery Compass','item'],['clock','Clock','item'],['name_tag','Name Tag','item'],['goat_horn','Goat Horn','item'],
  ['player_head','Player Head','block'],['command_block','Command Block','block'],['barrier','Barrier','block'],['light','Light','block'],['structure_block','Structure Block','block'],['jigsaw','Jigsaw','block'],['bedrock','Bedrock','block'],['diamond_block','Diamond Block','block'],['netherite_block','Netherite Block','block'],['raw_gold_block','Block of Raw Gold','block'],['prismarine','Prismarine','block'],['dark_prismarine','Dark Prismarine','block'],['sea_lantern','Sea Lantern','block'],['obsidian','Obsidian','block'],['crying_obsidian','Crying Obsidian','block'],['beacon','Beacon','block'],['chest','Chest','block'],['ender_chest','Ender Chest','block'],['shulker_box','Shulker Box','block'],
  ['white_concrete','White Concrete','block'],['orange_concrete','Orange Concrete','block'],['magenta_concrete','Magenta Concrete','block'],['light_blue_concrete','Light Blue Concrete','block'],['yellow_concrete','Yellow Concrete','block'],['lime_concrete','Lime Concrete','block'],['pink_concrete','Pink Concrete','block'],['gray_concrete','Gray Concrete','block'],['light_gray_concrete','Light Gray Concrete','block'],['cyan_concrete','Cyan Concrete','block'],['purple_concrete','Purple Concrete','block'],['blue_concrete','Blue Concrete','block'],['brown_concrete','Brown Concrete','block'],['green_concrete','Green Concrete','block'],['red_concrete','Red Concrete','block'],['black_concrete','Black Concrete','block'],
  ['white_terracotta','White Terracotta','block'],['orange_terracotta','Orange Terracotta','block'],['magenta_terracotta','Magenta Terracotta','block'],['light_blue_terracotta','Light Blue Terracotta','block'],['yellow_terracotta','Yellow Terracotta','block'],['lime_terracotta','Lime Terracotta','block'],['pink_terracotta','Pink Terracotta','block'],['gray_terracotta','Gray Terracotta','block'],['light_gray_terracotta','Light Gray Terracotta','block'],['cyan_terracotta','Cyan Terracotta','block'],['purple_terracotta','Purple Terracotta','block'],['blue_terracotta','Blue Terracotta','block'],['brown_terracotta','Brown Terracotta','block'],['green_terracotta','Green Terracotta','block'],['red_terracotta','Red Terracotta','block'],['black_terracotta','Black Terracotta','block'],
  ['stone','Stone','block'],['cobblestone','Cobblestone','block'],['deepslate','Deepslate','block'],['oak_planks','Oak Planks','block'],['spruce_planks','Spruce Planks','block'],['glass','Glass','block'],['tnt','TNT','block']
];

const ENCHANTS = [
  'aqua_affinity','bane_of_arthropods','binding_curse','blast_protection','breach','channeling','density','depth_strider','efficiency','feather_falling','fire_aspect','fire_protection','flame','fortune','frost_walker','impaling','infinity','knockback','looting','loyalty','luck_of_the_sea','lure','mending','multishot','piercing','power','projectile_protection','protection','punch','quick_charge','respiration','riptide','sharpness','silk_touch','smite','soul_speed','sweeping_edge','swift_sneak','thorns','unbreaking','vanishing_curse','wind_burst'
];

const LEGACY_ENCHANT_IDS = {protection:0,fire_protection:1,feather_falling:2,blast_protection:3,projectile_protection:4,respiration:5,aqua_affinity:6,thorns:7,depth_strider:8,frost_walker:9,binding_curse:10,sharpness:16,smite:17,bane_of_arthropods:18,knockback:19,fire_aspect:20,looting:21,efficiency:32,silk_touch:33,unbreaking:34,fortune:35,power:48,punch:49,flame:50,infinity:51,luck_of_the_sea:61,lure:62,mending:70,vanishing_curse:71};

const ATTRIBUTES = [
  ['attack_damage','Attack Damage'],['attack_speed','Attack Speed'],['armor','Armor'],['armor_toughness','Armor Toughness'],['knockback_resistance','Knockback Resistance'],['max_health','Max Health'],['movement_speed','Movement Speed'],['flying_speed','Flying Speed'],['attack_knockback','Attack Knockback'],['luck','Luck'],['follow_range','Follow Range'],['block_break_speed','Block Break Speed'],['block_interaction_range','Block Interaction Range'],['entity_interaction_range','Entity Interaction Range'],['fall_damage_multiplier','Fall Damage Multiplier'],['gravity','Gravity'],['jump_strength','Jump Strength'],['safe_fall_distance','Safe Fall Distance'],['scale','Scale'],['step_height','Step Height'],['burning_time','Burning Time'],['explosion_knockback_resistance','Explosion Knockback Resistance'],['mining_efficiency','Mining Efficiency'],['movement_efficiency','Movement Efficiency'],['oxygen_bonus','Oxygen Bonus'],['sneaking_speed','Sneaking Speed'],['submerged_mining_speed','Submerged Mining Speed'],['sweeping_damage_ratio','Sweeping Damage Ratio'],['water_movement_efficiency','Water Movement Efficiency']
];

const EFFECTS = ['speed','slowness','haste','mining_fatigue','strength','instant_health','instant_damage','jump_boost','nausea','regeneration','resistance','fire_resistance','water_breathing','invisibility','blindness','night_vision','hunger','weakness','poison','wither','health_boost','absorption','saturation','glowing','levitation','luck','unluck','slow_falling','conduit_power','dolphins_grace','bad_omen','hero_of_the_village','darkness','trial_omen','raid_omen','wind_charged','weaving','oozing','infested'];
const SLOTS = ['mainhand','offhand','head','chest','legs','feet'];

const state = { version:'1.21.11', type:'item', item:'diamond_pickaxe', lore:[], enchants:[], attributes:[], effects:[], output:'give' };

function versionTuple(v){ return v.split('.').map(Number); }
function cmp(v,a,b=0,c=0){ const x=versionTuple(v), y=[a,b,c]; for(let i=0;i<3;i++){ const d=(x[i]||0)-y[i]; if(d) return d; } return 0; }
function profile(){
  const v=state.version;
  if(cmp(v,1,20,5)>=0){
    if(cmp(v,1,21,5)>=0) return 'components_simplified';
    if(cmp(v,1,21,0)>=0) return 'components_id';
    return 'components_uuid';
  }
  if(cmp(v,1,13,0)>=0) return 'nbt_modern';
  return 'nbt_legacy';
}
function newerAttrIds(){ return cmp(state.version,1,21,2)>=0; }

function displayText(text, color='white', bold=false, italic=false){
  return {text:String(text),color,bold:!!bold,italic:!!italic};
}
function snbtText(obj){ return `'${JSON.stringify(obj).replace(/'/g,"\\'")}'`; }
function snbtString(v){ return `'${String(v).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}'`; }
function snbtCompoundText(obj){
  const parts=[`text:${snbtString(obj.text)}`];
  if(obj.color) parts.push(`color:${snbtString(obj.color)}`);
  if(obj.bold) parts.push('bold:true');
  if(obj.italic) parts.push('italic:true');
  else parts.push('italic:false');
  return `{${parts.join(',')}}`;
}
function modernAttrId(base){ return `minecraft:${newerAttrIds() ? base : `generic.${base}`}`; }
function legacyAttrName(base){
  const map={attack_damage:'generic.attackDamage',attack_speed:'generic.attackSpeed',armor:'generic.armor',armor_toughness:'generic.armorToughness',knockback_resistance:'generic.knockbackResistance',max_health:'generic.maxHealth',movement_speed:'generic.movementSpeed',flying_speed:'generic.flyingSpeed',attack_knockback:'generic.attackKnockback',luck:'generic.luck',follow_range:'generic.followRange'};
  return map[base] || `generic.${base}`;
}
function operationLegacy(op){ return ({add_value:0,add_multiplied_base:1,add_multiplied_total:2})[op] ?? 0; }
function uuidInts(i){ return [1511506142, -1892789760 + i, -1107296256, 100000+i]; }
function oldItemId(id){
  const map={wooden_sword:'wooden_sword',wooden_pickaxe:'wooden_pickaxe',golden_sword:'golden_sword',golden_pickaxe:'golden_pickaxe',player_head:'skull'};
  return map[id]||id;
}
