(() => {
  const VERSIONS = [
    '1.21.11','1.21.10','1.21.9','1.21.8','1.21.7','1.21.6','1.21.5','1.21.4','1.21.3','1.21.2','1.21.1','1.21',
    '1.20.6','1.20.5','1.20.4','1.20.3','1.20.2','1.20.1','1.20','1.19.4','1.19.3','1.19.2','1.19.1','1.19',
    '1.18.2','1.18.1','1.18','1.17.1','1.17','1.16.5','1.16.4','1.16.3','1.16.2','1.16.1','1.16',
    '1.15.2','1.15.1','1.15','1.14.4','1.14.3','1.14.2','1.14.1','1.14','1.13.2','1.13.1','1.13',
    '1.12.2','1.12.1','1.12','1.11.2','1.11.1','1.11','1.10.2','1.10.1','1.10','1.9.4','1.9.3','1.9.2','1.9.1','1.9',
    '1.8.9','1.8.8','1.8.7','1.8.6','1.8.5','1.8.4','1.8.3','1.8.2','1.8.1','1.8'
  ];

  const $ = s => document.querySelector(s);
  const versionSelect = $('#checkerVersion');
  const input = $('#commandInput');
  const results = $('#checkerResults');
  const summary = $('#checkerSummary');

  versionSelect.innerHTML = VERSIONS.map(v => `<option value="${v}">${v}</option>`).join('');
  versionSelect.value = '1.21.11';

  const cmp = (a,b) => {
    const A=a.split('.').map(Number), B=b.split('.').map(Number);
    for(let i=0;i<3;i++){const d=(A[i]||0)-(B[i]||0);if(d)return d;}
    return 0;
  };
  const atLeast = min => cmp(versionSelect.value,min) >= 0;

  const KNOWN = new Set([
    'advancement','attribute','ban','ban-ip','banlist','bossbar','clear','clone','damage','data','datapack','debug','defaultgamemode','deop','difficulty',
    'effect','enchant','execute','experience','fill','forceload','function','gamemode','gamerule','give','help','item','kick','kill','list','locate','loot','me',
    'msg','op','pardon','pardon-ip','particle','perf','place','playsound','publish','random','recipe','reload','replaceitem','return','ride','save-all','save-off',
    'save-on','say','schedule','scoreboard','seed','setblock','setidletimeout','setworldspawn','spawnpoint','spectate','spreadplayers','stats','stop','stopsound',
    'summon','tag','team','teammsg','teleport','tell','tellraw','testfor','testforblock','testforblocks','time','title','tm','tp','trigger','w','weather','whitelist',
    'worldborder','xp'
  ]);

  const INTRO = {
    data:'1.13', bossbar:'1.13', team:'1.13', tag:'1.13', datapack:'1.13', forceload:'1.13', schedule:'1.13',
    attribute:'1.16', item:'1.17', place:'1.19', damage:'1.19.4', ride:'1.19.4', random:'1.20.2', return:'1.20.2'
  };
  const REMOVED = {testfor:'1.13',testforblock:'1.13',testforblocks:'1.13',stats:'1.13',replaceitem:'1.17'};

  function tokenize(text){
    const out=[]; let cur='', quote=null, esc=false, depth=0;
    for(const ch of text.trim()){
      if(quote){cur+=ch;if(esc){esc=false;continue;}if(ch==='\\'){esc=true;continue;}if(ch===quote)quote=null;continue;}
      if(ch==='"'||ch==="'"){quote=ch;cur+=ch;continue;}
      if(ch==='{'||ch==='['||ch==='('){depth++;cur+=ch;continue;}
      if(ch==='}'||ch===']'||ch===')'){depth=Math.max(0,depth-1);cur+=ch;continue;}
      if(/\s/.test(ch)&&depth===0){if(cur){out.push(cur);cur='';}continue;}
      cur+=ch;
    }
    if(cur) out.push(cur);
    return out;
  }

  function structuralIssues(text,line){
    const issues=[], stack=[]; let quote=null, esc=false;
    const pairs={'}':'{',']':'[',')':'('};
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(quote){if(esc){esc=false;continue;}if(ch==='\\'){esc=true;continue;}if(ch===quote)quote=null;continue;}
      if(ch==='"'||ch==="'"){quote=ch;continue;}
      if(ch==='{'||ch==='['||ch==='('){stack.push({ch,pos:i});continue;}
      if(ch==='}'||ch===']'||ch===')'){
        const top=stack.pop();
        if(!top||top.ch!==pairs[ch]) issues.push(err(line,`Mismatched ${ch}`,`Character ${i+1} closes the wrong bracket type.`));
      }
    }
    if(quote) issues.push(err(line,'Unclosed quote',`The ${quote} string never closes.`));
    if(stack.length) issues.push(err(line,'Unclosed bracket',`Missing closing bracket for ${stack[stack.length-1].ch}.`));
    return issues;
  }

  const err=(line,title,detail)=>({type:'error',line,title,detail});
  const warn=(line,title,detail)=>({type:'warning',line,title,detail});
  const info=(line,title,detail)=>({type:'info',line,title,detail});
  const ok=(line,title,detail)=>({type:'ok',line,title,detail});
  const integer = s => /^-?\d+$/.test(String(s||''));
  const coord = s => /^(?:~(?:-?\d+(?:\.\d+)?)?|\^(?:-?\d+(?:\.\d+)?)?|-?\d+(?:\.\d+)?)$/.test(String(s||''));

  function commandName(token){
    return String(token||'').replace(/^\//,'').replace(/^minecraft:/,'').toLowerCase();
  }

  function checkAvailability(cmd,line){
    const issues=[];
    if(INTRO[cmd] && !atLeast(INTRO[cmd])) issues.push(err(line,`/${cmd} is not available`,`This command was added after Minecraft ${versionSelect.value}.`));
    if(REMOVED[cmd] && atLeast(REMOVED[cmd])) issues.push(err(line,`/${cmd} was removed`,`Use the newer command system in Minecraft ${versionSelect.value}.`));
    return issues;
  }

  function duplicateEnchantKeys(item,line){
    if(!/enchantments\s*=/.test(item)) return [];
    const keys=[...item.matchAll(/["']?(minecraft:[a-z0-9_./-]+)["']?\s*:/gi)].map(m=>m[1]);
    const seen=new Set(), dup=new Set();
    for(const k of keys){if(seen.has(k))dup.add(k);seen.add(k);}
    return [...dup].map(k=>warn(line,'Duplicate enchantment key',`${k} appears more than once. Modern enchantments are a map, so keep one level per enchantment.`));
  }

  function checkGive(tokens,line){
    const issues=[];
    const target=tokens[1], item=tokens[2];
    if(!target) return [err(line,'Missing target','Use /give <target> <item> ...')];
    if(!item) return [err(line,'Missing item','Use /give <target> <item> ...')];

    if(!atLeast('1.13')){
      if(item.includes('[')) issues.push(err(line,'Item components are too new','Square-bracket item components start in 1.20.5. Minecraft 1.8–1.12 uses count, data value, then NBT.'));
      if(item.includes('{')) issues.push(err(line,'NBT is in the wrong position',`In ${versionSelect.value}, use /give <player> <item> <count> <data> {NBT}.`));
      if(tokens[3] && !integer(tokens[3])) issues.push(err(line,'Invalid amount',`The third /give argument must be an integer amount in ${versionSelect.value}.`));
      if(tokens[4] && !integer(tokens[4])) issues.push(err(line,'Invalid data value',`Legacy /give expects a numeric data/damage value before NBT.`));
      if(tokens[5] && !tokens[5].startsWith('{')) issues.push(err(line,'Invalid legacy NBT','The final legacy /give argument should be an NBT compound such as {display:{Name:"Sword"}}.'));
      if(tokens.length>6) issues.push(err(line,'Too many /give arguments','Legacy NBT should stay together as one final compound.'));
      return issues;
    }

    if(!atLeast('1.20.5')){
      if(item.includes('[')) issues.push(err(line,'Item components are not supported yet',`Minecraft ${versionSelect.value} uses item{NBT}, not item[components].`));
      if(tokens[3] && !integer(tokens[3])) issues.push(err(line,'Invalid amount','The optional count after the item must be an integer.'));
      if(tokens.length>4) issues.push(err(line,'Too many /give arguments',`Minecraft ${versionSelect.value} expects /give <targets> <item{NBT}> [count].`));
      return issues;
    }

    if(tokens[3] && !integer(tokens[3])) issues.push(err(line,'Invalid amount','The optional count after the item must be an integer.'));
    if(tokens.length>4) issues.push(err(line,'Too many /give arguments','Item components/NBT belong directly after the item; only count comes after it.'));
    const b=item.indexOf('['), c=item.indexOf('{');
    if(b>=0&&c>=0&&c<b) issues.push(err(line,'Component order is wrong','When both are used, [components] must come before {custom_data}.'));
    issues.push(...duplicateEnchantKeys(item,line));

    if(atLeast('1.21.5')){
      if(/enchantments\s*=\s*\{\s*levels\s*:/i.test(item)) issues.push(err(line,'Old enchantment component shape','1.21.5+ uses enchantments={sharpness:5}, without levels:{...}.'));
      if(/attribute_modifiers\s*=\s*\{\s*modifiers\s*:/i.test(item)) issues.push(err(line,'Old attribute component shape','1.21.5+ inlines the modifier list: attribute_modifiers=[{...}].'));
    } else {
      if(/custom_name\s*=\s*\{\s*text\s*:/i.test(item)) issues.push(err(line,'Text component format is too new',`${versionSelect.value} expects custom_name as a JSON text component string, not an inline SNBT text object.`));
    }

    if(atLeast('1.21.2') && /type\s*:\s*["']minecraft:(?:generic|player|zombie)\./i.test(item)){
      issues.push(err(line,'Old attribute ID prefix','1.21.2+ removed generic., player. and zombie. prefixes from attribute IDs.'));
    }
    return issues;
  }

  function checkExecute(tokens,line){
    const issues=[];
    if(!atLeast('1.13')){
      const modern=new Set(['as','at','if','unless','run','positioned','rotated','facing','anchored','in','store','on','summon']);
      if(tokens.slice(1).some(t=>modern.has(t))) issues.push(err(line,'Modern /execute syntax is not available',`Minecraft ${versionSelect.value} uses the legacy /execute <entity> <x> <y> <z> <command...> form.`));
    } else if(tokens.length>=6 && /^@[pares]/.test(tokens[1]) && coord(tokens[2])&&coord(tokens[3])&&coord(tokens[4]) && !tokens.includes('run')){
      issues.push(err(line,'Legacy /execute syntax detected','Minecraft 1.13+ uses execute subcommands such as as/at/positioned and run.'));
    }
    return issues;
  }

  function checkEffect(tokens,line){
    const issues=[];
    if(!atLeast('1.13')){
      if(tokens[1]==='give'||tokens[1]==='clear') issues.push(err(line,'Modern /effect syntax is too new',`In ${versionSelect.value}, use /effect <player> <effect> [seconds] [amplifier] [hideParticles].`));
    } else if(tokens[1] && tokens[1]!=='give' && tokens[1]!=='clear'){
      issues.push(err(line,'Missing effect action','Minecraft 1.13+ uses /effect give ... or /effect clear ...'));
    }
    return issues;
  }

  function checkTeleport(tokens,line){
    if(tokens.length<2) return [err(line,'Missing teleport destination','Add a target/destination or coordinates.')];
    return [];
  }

  function checkSetblock(tokens,line){
    if(tokens.length<5) return [err(line,'Not enough /setblock arguments','Expected three coordinates and a block.')];
    if(!coord(tokens[1])||!coord(tokens[2])||!coord(tokens[3])) return [err(line,'Invalid block position','The first three /setblock arguments must be coordinates.')];
    return [];
  }

  function checkFill(tokens,line){
    if(tokens.length<8) return [err(line,'Not enough /fill arguments','Expected two sets of XYZ coordinates and a block.')];
    for(let i=1;i<=6;i++) if(!coord(tokens[i])) return [err(line,'Invalid fill position','The first six /fill arguments after the command must be coordinates.')];
    return [];
  }

  function checkSummon(tokens,line){
    if(!tokens[1]) return [err(line,'Missing entity','Use /summon <entity> [x] [y] [z] ...')];
    if(tokens.length>=5 && (!coord(tokens[2])||!coord(tokens[3])||!coord(tokens[4]))) return [err(line,'Invalid summon position','Summon coordinates must be valid absolute, ~ relative, or ^ local coordinates.')];
    return [];
  }

  function checkTextCommand(tokens,line){
    const cmd=commandName(tokens[0]);
    let payload='';
    if(cmd==='tellraw') payload=tokens.slice(2).join(' ');
    if(cmd==='title' && ['title','subtitle','actionbar'].includes(tokens[2])) payload=tokens.slice(3).join(' ');
    if(!payload) return [];
    if(!atLeast('1.21.5') && /\{\s*[A-Za-z_][\w-]*\s*:\s*'/.test(payload)){
      return [err(line,'SNBT text component is too new',`Minecraft ${versionSelect.value} expects JSON text syntax here, for example {"text":"Hello"}.`)];
    }
    if(!atLeast('1.21.5') && payload.trim().startsWith('{')){
      try{JSON.parse(payload);}catch{return [err(line,'Invalid JSON text component','Before 1.21.5, this text component must parse as JSON.')];}
    }
    return [];
  }

  function lintLine(raw,line){
    const text=raw.trim(); if(!text)return [];
    const issues=structuralIssues(text,line);
    if(issues.some(x=>x.type==='error')) return issues;
    const tokens=tokenize(text); if(!tokens.length)return issues;
    const cmd=commandName(tokens[0]);

    if(!KNOWN.has(cmd)){
      issues.push(warn(line,'Command not in the vanilla checker',`/${cmd} may be a plugin/mod command. ItemStudio will only verify its brackets and quotes.`));
      return issues;
    }

    issues.push(...checkAvailability(cmd,line));
    if(issues.some(x=>x.type==='error' && (x.title.includes('not available')||x.title.includes('removed')))) return issues;

    if(cmd==='give') issues.push(...checkGive(tokens,line));
    if(cmd==='execute') issues.push(...checkExecute(tokens,line));
    if(cmd==='effect') issues.push(...checkEffect(tokens,line));
    if(cmd==='tp'||cmd==='teleport') issues.push(...checkTeleport(tokens,line));
    if(cmd==='setblock') issues.push(...checkSetblock(tokens,line));
    if(cmd==='fill') issues.push(...checkFill(tokens,line));
    if(cmd==='summon') issues.push(...checkSummon(tokens,line));
    if(cmd==='tellraw'||cmd==='title') issues.push(...checkTextCommand(tokens,line));

    if(!issues.length) issues.push(ok(line,'No obvious syntax errors',`The command matches the ${versionSelect.value} rules checked by ItemStudio.`));
    return issues;
  }

  function render(){
    const lines=input.value.split(/\r?\n/);
    let all=[];
    lines.forEach((line,i)=>{if(line.trim())all.push(...lintLine(line,i+1));});
    results.innerHTML='';

    if(!input.value.trim()){
      summary.innerHTML='<span class="summary-light idle"></span><span>Paste a command to start.</span>';
      return;
    }

    const errors=all.filter(x=>x.type==='error').length;
    const warnings=all.filter(x=>x.type==='warning').length;
    const light=errors?'error':warnings?'warn':'ok';
    const text=errors?`${errors} error${errors>1?'s':''}${warnings?`, ${warnings} warning${warnings>1?'s':''}`:''}`:warnings?`${warnings} warning${warnings>1?'s':''}`:'No obvious syntax errors found.';
    summary.innerHTML=`<span class="summary-light ${light}"></span><span>${text}</span>`;

    for(const item of all){
      const row=document.createElement('div'); row.className=`result-row ${item.type}`;
      const symbol=item.type==='error'?'!':item.type==='warning'?'?':item.type==='ok'?'✓':'i';
      row.innerHTML=`<div class="result-icon">${symbol}</div><div class="result-copy"><b>${item.line?`Line ${item.line} · `:''}${item.title}</b><p>${item.detail}</p></div>`;
      results.appendChild(row);
    }
  }

  let timer;
  input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(render,160)});
  versionSelect.addEventListener('change',render);
  $('#checkBtn').addEventListener('click',render);
  $('#exampleBtn').addEventListener('click',()=>{
    input.value=atLeast('1.20.5')?'/give @p minecraft:diamond_sword[minecraft:custom_name={text:\'Example\'}] 1':'/give @p minecraft:diamond_sword 1';
    render(); input.focus();
  });
  $('#themeToggle').addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark'});
})();
