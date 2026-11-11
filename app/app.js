(() => {
  'use strict';
  const core = window.DesktopCore;
  const $ = (selector, root=document) => root.querySelector(selector);
  const ICONS = {
    browser:'<circle cx="12" cy="12" r="8.5"/><path d="M3.6 12h16.8M12 3.5c2.3 2.3 3.4 5.2 3.4 8.5S14.3 18.2 12 20.5C9.7 18.2 8.6 15.3 8.6 12S9.7 5.8 12 3.5Z"/>',
    files:'<path d="M3 7.5a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 10h18"/>',
    notes:'<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5"/>',
    calendar:'<rect x="3.5" y="5.5" width="17" height="15" rx="2.3"/><path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17M8 13.5h2M14 13.5h2M8 17h2"/>',
    calculator:'<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7h8M8 11h.1M12 11h.1M16 11h.1M8 14h.1M12 14h.1M16 14h.1M8 17h.1M12 17h.1M16 17h.1"/>',
    settings:'<circle cx="12" cy="12" r="3.1"/><path d="M19.2 13.7l1.1 1.1-1.7 3-1.5-.4a7.8 7.8 0 0 1-2.1 1.2l-.4 1.6H9.4L9 18.6a7.8 7.8 0 0 1-2.1-1.2l-1.5.4-1.7-3 1.1-1.1a8 8 0 0 1 0-2.5L3.7 10l1.7-3 1.5.4A7.8 7.8 0 0 1 9 6.2l.4-1.6h5.2l.4 1.6a7.8 7.8 0 0 1 2.1 1.2l1.5-.4 1.7 3-1.1 1.2a8 8 0 0 1 0 2.5Z"/>',
    help:'<rect x="3.5" y="5" width="17" height="12" rx="2"/><path d="M9 20h6M12 17v3M7.5 9.5h9"/>'
  };
  const APPS = {
    browser:{title:'Browser',width:850,height:570}, files:{title:'Files',width:750,height:510},
    notes:{title:'Notes',width:620,height:510}, calendar:{title:'Calendar',width:600,height:490},
    calculator:{title:'Calculator',width:335,height:465}, settings:{title:'Settings',width:590,height:470},
    help:{title:'Getting started',width:620,height:480}
  };
  const appIds = Object.keys(APPS), pinned = ['browser','files','notes','calculator'];
  const openWindows = new Map();
  let topZ = 1, activeId = null, cascade = 0;
  const storage = {
    get(key, fallback='') { try { return localStorage.getItem('pocket-desktop.'+key) ?? fallback; } catch (_) {return fallback;} },
    set(key, value) { try { localStorage.setItem('pocket-desktop.'+key,value); return true; } catch (_) {return false;} }
  };
  function icon(id, extra='') { return `<span class="app-icon ${id} ${extra}" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[id]}</svg></span>`; }
  function appButton(id, context) {
    return `<button class="${context==='desktop'?'desktop-icon':'launcher-app'}" data-open="${id}" aria-label="Open ${APPS[id].title}">${icon(id)}<span class="app-label">${APPS[id].title}</span></button>`;
  }
  $('#desktop-icons').innerHTML = appIds.filter(id => id !== 'help').map(id=>appButton(id,'desktop')).join('');
  $('#launcher-grid').innerHTML = appIds.map(id=>appButton(id,'launcher')).join('');
  function filterApplications() {
    const query=$('#launcher-search').value.trim().toLocaleLowerCase();let shown=0;
    $('#launcher-grid').querySelectorAll('[data-open]').forEach(button=>{
      button.hidden=!APPS[button.dataset.open].title.toLocaleLowerCase().includes(query);
      if(!button.hidden) shown++;
    });
    $('#launcher-empty').hidden=shown>0;
  }
  $('#launcher-search').addEventListener('input',filterApplications);
  const savedWallpaper = storage.get('wallpaper','dusk');
  if (['dusk','ocean','night'].includes(savedWallpaper)) document.body.dataset.wallpaper = savedWallpaper;
  const workspace = $('#workspace');
  const space = () => ({width:workspace.clientWidth,height:workspace.clientHeight});
  const nativeBrowser = window.webkit?.messageHandlers?.nativeBrowser;
  let browserSyncPending=false;
  function syncNativeBrowser() {
    if (!nativeBrowser || browserSyncPending) return;
    browserSyncPending=true;
    requestAnimationFrame(()=>{
      browserSyncPending=false;
      const entry=openWindows.get('browser'), slot=entry?.el.querySelector('.native-browser-slot');
      if (!entry || entry.el.hidden || activeId!=='browser' || !slot || slot.hidden || !$('#launcher').hidden || !$('#quick-panel').hidden || !$('#desktop-menu').hidden) {
        nativeBrowser.postMessage({action:'hide'}); return;
      }
      const r=slot.getBoundingClientRect(), clip=workspace.getBoundingClientRect();
      nativeBrowser.postMessage({action:'frame',x:r.x,y:r.y,width:r.width,height:r.height,
        clipX:clip.x,clipY:clip.y,clipWidth:clip.width,clipHeight:clip.height});
    });
  }
  function panel(id, show) {
    const el = $('#'+id), button = id === 'launcher' ? $('#launcher-toggle') : $('#quick-toggle');
    if(!show && el.contains(document.activeElement)) document.activeElement.blur();
    el.hidden = !show; button.setAttribute('aria-expanded',String(show)); syncNativeBrowser();
  }
  function hidePanels() { panel('launcher',false); panel('quick-panel',false); $('#desktop-menu').hidden=true; syncNativeBrowser(); }
  $('#launcher-toggle').addEventListener('click',event=>{ event.stopPropagation(); const next=$('#launcher').hidden; hidePanels(); if(next){$('#launcher-search').value='';filterApplications();} panel('launcher',next); });
  $('#quick-toggle').addEventListener('click',event=>{ event.stopPropagation(); const next=$('#quick-panel').hidden; hidePanels(); panel('quick-panel',next); });
  $('#show-desktop').addEventListener('click',()=>{
    for(const entry of openWindows.values()) {
      if(entry.el.contains(document.activeElement)) document.activeElement.blur();
      entry.el.hidden=true;
    }
    activeId=null; hidePanels(); renderTasks(); syncNativeBrowser();
  });
  $('#desktop').addEventListener('contextmenu',event=>{
    if(event.target.closest('.window,.taskbar,.floating-panel,.desktop-menu,.desktop-icon'))return;
    event.preventDefault();hidePanels();
    const menu=$('#desktop-menu');menu.hidden=false;
    const rect=menu.getBoundingClientRect();
    menu.style.left=Math.max(4,Math.min(event.clientX,window.innerWidth-rect.width-4))+'px';
    menu.style.top=Math.max(4,Math.min(event.clientY,window.innerHeight-rect.height-4))+'px';
    syncNativeBrowser();
  });
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-context-show]')) { $('#show-desktop').click(); hidePanels(); return; }
    const opener=event.target.closest('[data-open]');
    if (opener) { openApp(opener.dataset.open); hidePanels(); return; }
    const dismiss=event.target.closest('[data-dismiss]');
    if (dismiss) { panel(dismiss.dataset.dismiss,false); return; }
    if (!event.target.closest('.floating-panel,.taskbar,.desktop-menu')) hidePanels();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape') hidePanels();
    if(event.altKey && !event.ctrlKey && !event.metaKey && event.key==='Tab') {
      const visible=[...openWindows.entries()].filter(([,entry])=>!entry.el.hidden).sort((a,b)=>Number(b[1].el.style.zIndex)-Number(a[1].el.style.zIndex));
      if(visible.length>1){event.preventDefault();focusWindow(visible[1][0]);}
    }
    if(event.altKey && !event.ctrlKey && !event.metaKey && event.key==='F4' && activeId) {
      event.preventDefault();close(activeId);
    }
    if(event.ctrlKey && event.altKey && activeId && ['ArrowLeft','ArrowRight'].includes(event.key)) {
      event.preventDefault(); snap(activeId,event.key==='ArrowLeft'?'left':'right');
    }
  });
  function updateClock() {
    const now=new Date();
    const time=now.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
    $('#widget-time').textContent=time;
    $('#task-time').textContent=time;
    $('#widget-date').textContent=now.toLocaleDateString([], {weekday:'long',month:'long',day:'numeric'});
    $('#task-date').textContent=now.toLocaleDateString([], {month:'short',day:'numeric'});
    $('#quick-date').textContent=now.toLocaleDateString([], {weekday:'long',month:'long',day:'numeric',year:'numeric'});
  }
  updateClock(); setInterval(updateClock,30000);
  function renderTasks() {
    const ids=[...pinned,...Array.from(openWindows.keys()).filter(id=>!pinned.includes(id))];
    $('#task-apps').innerHTML=ids.map(id=>{
      const entry=openWindows.get(id), label=entry ? `Restore ${APPS[id].title}` : `Open ${APPS[id].title}`;
      return `<button class="task-button ${entry?'is-open':''} ${entry&&!entry.el.hidden&&activeId===id?'is-active':''}" data-task="${id}" aria-label="${label}" title="${APPS[id].title}">${icon(id)}</button>`;
    }).join('');
    $('#task-apps').querySelectorAll('[data-task]').forEach(button=>button.addEventListener('click',()=>{
      const id=button.dataset.task, entry=openWindows.get(id);
      if (!entry) openApp(id);
      else if (entry.el.hidden || activeId!==id) {entry.el.hidden=false;focusWindow(id);}
      else minimize(id);
    }));
  }
  function focusWindow(id) {
    const entry=openWindows.get(id); if(!entry) return;
    activeId=id; entry.el.style.zIndex=String(++topZ); renderTasks(); syncNativeBrowser();
  }
  function chooseNext() {
    const visible=[...openWindows.entries()].filter(([,v])=>!v.el.hidden).sort((a,b)=>Number(b[1].el.style.zIndex)-Number(a[1].el.style.zIndex));
    activeId=visible[0]?.[0] || null; renderTasks(); syncNativeBrowser();
  }
  function paint(entry) {
    for (const key of ['x','y','width','height']) entry.el.style[{x:'left',y:'top',width:'width',height:'height'}[key]]=entry.bounds[key]+'px';
    syncNativeBrowser();
  }
  function minimize(id) {
    const entry=openWindows.get(id); if(!entry)return;
    if(entry.el.contains(document.activeElement)) document.activeElement.blur();
    entry.el.hidden=true; if(activeId===id) chooseNext(); else renderTasks();
  }
  function close(id) {
    const entry=openWindows.get(id); if(!entry)return;
    if (entry.cleanup) entry.cleanup();
    if (id==='browser' && nativeBrowser) nativeBrowser.postMessage({action:'close'});
    entry.el.remove(); openWindows.delete(id); if(activeId===id) chooseNext(); else renderTasks();
  }
  function maximize(id) {
    const entry=openWindows.get(id); if(!entry)return;
    const button=entry.el.querySelector('[data-action="maximize"]');
    if(!entry.maximized) {
      entry.restoreBounds={...entry.bounds}; entry.bounds=core.maximizeBounds(space()); entry.maximized=true;
      entry.el.classList.add('maximized'); button.setAttribute('aria-label','Restore size'); button.title='Restore size'; button.textContent='❐';
    } else {
      const old=entry.restoreBounds, s=space();
      entry.bounds={...old,width:Math.min(old.width,s.width),height:Math.min(old.height,s.height)};
      entry.bounds=core.moveBounds(entry.bounds,0,0,s); entry.maximized=false;
      entry.el.classList.remove('maximized'); button.setAttribute('aria-label','Maximize'); button.title='Maximize'; button.textContent='□';
    }
    paint(entry); focusWindow(id);
  }
  function snap(id,side) {
    const entry=openWindows.get(id); if(!entry)return;
    entry.maximized=false; entry.el.classList.remove('maximized');
    const button=entry.el.querySelector('[data-action="maximize"]');
    button.setAttribute('aria-label','Maximize');button.title='Maximize';button.textContent='□';
    entry.bounds=core.snapBounds(space(),side);paint(entry);focusWindow(id);
  }
  function makeDraggable(entry,element,kind) {
    element.addEventListener('pointerdown',event=>{
      if(event.button!==0 || event.target.closest('button') || entry.maximized) return;
      event.preventDefault(); focusWindow(entry.id); element.setPointerCapture(event.pointerId);
      const startX=event.clientX,startY=event.clientY,original={...entry.bounds};
      const move=e=>{
        const dx=e.clientX-startX,dy=e.clientY-startY;
        entry.bounds=kind==='move'?core.moveBounds(original,dx,dy,space()):core.resizeFromEdge(original,dx,dy,space(),kind); paint(entry);
      };
      const end=()=>{element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',end);element.removeEventListener('pointercancel',end);};
      element.addEventListener('pointermove',move);element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);
    });
  }
  function openApp(id) {
    if(!APPS[id]) return;
    let entry=openWindows.get(id);
    if(entry) {entry.el.hidden=false;focusWindow(id);return;}
    const app=APPS[id], el=document.createElement('section');
    el.className='window'; el.dataset.window=id; el.setAttribute('role','group'); el.setAttribute('aria-label',app.title+' window');
    el.innerHTML=`<div class="window-titlebar">${icon(id)}<span class="window-title">${app.title}</span><div class="window-controls"><button data-action="snap-left" aria-label="Snap left" title="Snap left">◧</button><button data-action="snap-right" aria-label="Snap right" title="Snap right">◨</button><button data-action="minimize" aria-label="Minimize" title="Minimize">−</button><button data-action="maximize" aria-label="Maximize" title="Maximize">□</button><button class="close" data-action="close" aria-label="Close" title="Close">×</button></div></div><div class="window-content"></div>${['n','ne','e','se','s','sw','w','nw'].map(edge=>`<div class="resize-handle resize-${edge}" data-edge="${edge}" aria-label="Resize ${edge}"></div>`).join('')}`;
    workspace.append(el);
    entry={id,el,bounds:core.initialBounds(space(),app,cascade++),maximized:false}; openWindows.set(id,entry); paint(entry);
    el.addEventListener('pointerdown',()=>focusWindow(id));
    el.querySelector('[data-action="minimize"]').addEventListener('click',()=>minimize(id));
    el.querySelector('[data-action="maximize"]').addEventListener('click',()=>maximize(id));
    el.querySelector('[data-action="snap-left"]').addEventListener('click',()=>snap(id,'left'));
    el.querySelector('[data-action="snap-right"]').addEventListener('click',()=>snap(id,'right'));
    el.querySelector('[data-action="close"]').addEventListener('click',()=>close(id));
    makeDraggable(entry,el.querySelector('.window-titlebar'),'move');
    el.querySelector('.window-titlebar').addEventListener('dblclick',event=>{if(!event.target.closest('button'))maximize(id);});
    el.querySelectorAll('.resize-handle').forEach(handle=>makeDraggable(entry,handle,handle.dataset.edge));
    mountApp(id,el.querySelector('.window-content'),entry); focusWindow(id);
  }
  function mountApp(id, target, entry) {
    if(id==='notes') mountNotes(target);
    else if(id==='calculator') mountCalculator(target);
    else if(id==='files') mountFiles(target,entry);
    else if(id==='browser') mountBrowser(target);
    else if(id==='calendar') mountCalendar(target);
    else if(id==='settings') mountSettings(target);
    else if(id==='help') mountHelp(target);
  }
  function mountNotes(target) {
    target.innerHTML='<div class="notes-page"><div class="notes-top"><strong>My notes</strong><span class="notes-status">Saved on this device</span></div><textarea class="notes-editor" aria-label="Note text" placeholder="Start writing something wonderful…"></textarea></div>';
    const editor=$('textarea',target),status=$('.notes-status',target); editor.value=storage.get('note');
    editor.addEventListener('input',()=>{status.textContent=storage.set('note',editor.value)?'Saved on this device':'Could not save on this device';});
  }
  function mountCalculator(target) {
    const keys=['AC','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','='];
    target.innerHTML=`<div class="calc-page"><div class="calc-display" data-testid="calculator-display" aria-live="polite">0</div><div class="calc-grid">${keys.map(key=>`<button class="${['÷','×','−','+'].includes(key)?'operator':''} ${key==='='?'equals':''} ${key==='0'?'zero':''}" data-key="${key}">${key}</button>`).join('')}</div></div>`;
    const calc=new core.Calculator(),display=$('.calc-display',target);
    target.querySelectorAll('[data-key]').forEach(button=>button.addEventListener('click',()=>{display.textContent=calc.press(button.dataset.key);}));
    const onKey=event=>{
      if(activeId!=='calculator' || /^(INPUT|TEXTAREA)$/.test(event.target.tagName) || event.ctrlKey || event.metaKey || event.altKey)return;
      const map={'*':'×','/':'÷','-':'−','Enter':'=','Escape':'AC'};
      const key=map[event.key] || event.key;
      if (/^\d$/.test(key) || ['.','+','−','×','÷','=','%','Backspace','AC'].includes(key)) {
        event.preventDefault(); display.textContent=calc.press(key);
      }
    };
    document.addEventListener('keydown',onKey);
    openWindows.get('calculator').cleanup=()=>document.removeEventListener('keydown',onKey);
  }
  function mountFiles(target,entry) {
    target.innerHTML='<div class="file-layout"><aside class="file-sidebar"><span class="small-label">Locations</span><strong>Selected files</strong><p>On your device</p></aside><div class="file-content"><h2 class="app-heading">Your files</h2><p class="app-subtitle">Choose a file from your device to preview it here.</p><div class="file-empty"><div class="file-illustration">▱</div><p>Bring a file into your workspace</p><button class="primary-button" data-pick>Choose a file</button><input type="file" hidden></div><div data-file-preview class="file-preview"></div></div></div>';
    const input=$('input',target),preview=$('[data-file-preview]',target); let objectURL=null;
    $('[data-pick]',target).addEventListener('click',()=>input.click());
    input.addEventListener('change',async()=>{
      const file=input.files && input.files[0]; if(!file)return;
      if(objectURL) {URL.revokeObjectURL(objectURL);objectURL=null;}
      preview.replaceChildren();
      const name=document.createElement('div'); name.className='file-name';name.textContent=file.name;preview.append(name);
      if(file.type.startsWith('image/')) {objectURL=URL.createObjectURL(file);const image=document.createElement('img');image.alt=file.name;image.src=objectURL;preview.append(image);}
      else if(file.size>1024*1024) {preview.append(document.createTextNode('Text preview is limited to files under 1 MB.'));}
      else if(file.type.startsWith('text/') || /\.(txt|md|json|csv|log|xml|yaml|yml)$/i.test(file.name)) {
        const text=document.createElement('div');text.textContent=await file.text();preview.append(text);
      } else preview.append(document.createTextNode('This file was selected. A preview is available for text and images.'));
    });
    entry.cleanup=()=>{if(objectURL) URL.revokeObjectURL(objectURL);};
  }
  function mountBrowser(target) {
    target.innerHTML=`<div class="browser-page"><form class="browser-bar"><button class="secondary-button browser-nav" type="button" data-nav="back" aria-label="Back">‹</button><button class="secondary-button browser-nav" type="button" data-nav="forward" aria-label="Forward">›</button><button class="secondary-button browser-nav" type="button" data-nav="reload" aria-label="Reload">↻</button><input type="text" aria-label="Web address or search" placeholder="Search the web or enter an address" autocomplete="off" autocapitalize="none"><button class="primary-button" type="submit">Go</button><button class="secondary-button" type="button" data-external>Safari</button></form><div class="browser-start">${icon('browser','browser-logo')}<h2>A little window to the web.</h2><p>Search or enter an address above. If a site does not work in the app, open it in Safari.</p></div><div class="native-browser-slot" hidden><div class="native-message">Select this window to show its web page.</div></div><iframe class="browser-frame" title="Website preview" sandbox="allow-forms allow-scripts allow-same-origin" hidden></iframe><div class="browser-hint" hidden>Some websites block embedded previews or in-app browsers. <button type="button" data-external>Open in Safari</button> if the page does not appear.</div></div>`;
    const form=$('form',target),input=$('input',target),frame=$('iframe',target),slot=$('.native-browser-slot',target),start=$('.browser-start',target),hint=$('.browser-hint',target);
    let current=null;
    function address() {const result=core.normalizeURL(input.value);if(!result){input.setCustomValidity('Enter a valid web address or search.');input.reportValidity();return null;}input.setCustomValidity('');return result;}
    input.addEventListener('input',()=>input.setCustomValidity(''));
    form.addEventListener('submit',event=>{
      event.preventDefault();const url=address();if(!url)return;current=url;start.hidden=true;hint.hidden=false;
      if(nativeBrowser){slot.hidden=false;nativeBrowser.postMessage({action:'navigate',url});syncNativeBrowser();}
      else {frame.src=url;frame.hidden=false;}
    });
    target.querySelectorAll('[data-nav]').forEach(button=>button.addEventListener('click',()=>{
      if(nativeBrowser) nativeBrowser.postMessage({action:button.dataset.nav});
      else if(button.dataset.nav==='reload' && current) frame.src=current;
    }));
    target.querySelectorAll('[data-external]').forEach(button=>button.addEventListener('click',()=>{
      const url=address() || current;if(!url)return;
      const bridge=window.webkit?.messageHandlers?.openExternal;
      if(bridge) bridge.postMessage(url); else window.open(url,'_blank','noopener,noreferrer');
    }));
  }
  function mountCalendar(target) {
    target.innerHTML='<div class="calendar-page"><div class="calendar-top"><strong></strong><div class="calendar-nav"><button data-month="-1" aria-label="Previous month">‹</button><button data-month="1" aria-label="Next month">›</button></div></div><div class="calendar-grid"></div></div>';
    let shown=new Date();shown=new Date(shown.getFullYear(),shown.getMonth(),1);
    function draw(){
      const now=new Date(),year=shown.getFullYear(),month=shown.getMonth(),first=new Date(year,month,1).getDay(),last=new Date(year,month+1,0).getDate();
      $('.calendar-top strong',target).textContent=shown.toLocaleDateString([],{month:'long',year:'numeric'});
      let html=['S','M','T','W','T','F','S'].map(day=>`<span class="weekday">${day}</span>`).join('');
      html+='<span></span>'.repeat(first);
      for(let day=1;day<=last;day++){const today=year===now.getFullYear()&&month===now.getMonth()&&day===now.getDate();html+=`<span class="${today?'today':''}">${day}</span>`;}
      $('.calendar-grid',target).innerHTML=html;
    }
    target.querySelectorAll('[data-month]').forEach(button=>button.addEventListener('click',()=>{shown=new Date(shown.getFullYear(),shown.getMonth()+Number(button.dataset.month),1);draw();}));draw();
  }
  function mountSettings(target) {
    const options=[['dusk','Dusk'],['ocean','Ocean'],['night','Night']];
    target.innerHTML=`<div class="settings-page"><h2 class="app-heading">Make it yours.</h2><p class="app-subtitle">Choose a backdrop for your desktop.</p><div class="wallpaper-options">${options.map(([id,label])=>`<button class="wallpaper-option" data-theme="${id}" aria-pressed="${document.body.dataset.wallpaper===id}"><span class="wallpaper-swatch"></span>${label}</button>`).join('')}</div><p class="settings-hint">Your wallpaper choice and notes are stored locally on this device. Your iOS system settings are unchanged.</p></div>`;
    target.querySelectorAll('[data-theme]').forEach(button=>button.addEventListener('click',()=>{document.body.dataset.wallpaper=button.dataset.theme;storage.set('wallpaper',button.dataset.theme);target.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
  }
  function mountHelp(target) {
    target.innerHTML='<div class="help-page"><h2>Your space, expanded.</h2><p>Pocket Desktop is a desktop-style workspace with its own tools. Open apps from the desktop or the grid in the taskbar.</p><h3>Move and manage windows</h3><p>Drag the title bar to move a window. Drag any edge or corner to resize it. The title bar can snap the window left or right, minimize, maximize, or close it. With a hardware keyboard, Control+Option+Left/Right attempts to snap the focused window.</p><h3>Use a larger display</h3><p>Connect a compatible iPhone to a monitor with an appropriate adapter, or use AirPlay screen mirroring. The screen is mirrored, not an independent desktop. On iPhone, turn on Settings → Accessibility → Touch → AssistiveTouch to use a USB or Bluetooth pointer. Pair Bluetooth keyboards in iOS Settings. A USB-C hub can connect wired peripherals and a display on compatible models.</p><h3>What stays inside iOS</h3><p>Installed iPhone apps, system notifications, and device settings remain under iOS control. They cannot be placed inside this app’s windows. Some websites also prevent embedded previews; use Open in Safari for them.</p><h3>Your data</h3><p>Notes and wallpaper are saved locally when storage is available. Imported files are shown for the current session only.</p></div>';
  }
  window.addEventListener('resize',()=>{
    const s=space();
    for(const entry of openWindows.values()) {
      if(entry.maximized) entry.bounds=core.maximizeBounds(s);
      else {entry.bounds.width=Math.min(entry.bounds.width,s.width);entry.bounds.height=Math.min(entry.bounds.height,s.height);entry.bounds=core.moveBounds(entry.bounds,0,0,s);}
      paint(entry);
    }
    syncNativeBrowser();
  });
  renderTasks();
})();
