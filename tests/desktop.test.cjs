const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, firefox, webkit } = require('playwright');
const engineName = process.env.BROWSER_ENGINE || 'chromium';
const engine = {chromium, firefox, webkit}[engineName];

let server, browser, url;
const root = path.resolve(__dirname, '../app');
before(async () => {
  server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
    const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
    res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}/`;
  if (!engine) throw new Error(`Unsupported browser engine: ${engineName}`);
  browser = await engine.launch({headless: true, ...(process.env.CHROMIUM_PATH && engineName==='chromium' ? {executablePath:process.env.CHROMIUM_PATH} : {}), ...(engineName==='chromium' ? {args:['--no-sandbox']} : {})});
});
after(async () => { if (browser) await browser.close(); if (server) await new Promise(r => server.close(r)); });

test('launcher opens a window, minimizing and restoring keeps it alive', async () => {
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  await page.goto(url);
  await page.getByRole('button', {name:'Open applications'}).click({timeout:10000});
  await page.locator('#launcher').getByRole('button', {name:'Open Notes'}).click();
  const win = page.locator('[data-window="notes"]');
  assert.equal(await win.isVisible(), true);
  await win.getByRole('button', {name:'Minimize'}).click();
  assert.equal(await win.isVisible(), false);
  await page.getByRole('button', {name:'Restore Notes'}).click();
  assert.equal(await win.isVisible(), true);
  await page.close();
});

test('notes persist after reload', async () => {
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  await page.goto(url);
  await page.getByRole('button', {name:'Open Notes'}).first().click({timeout:10000});
  await page.getByLabel('Note text').fill('A note that stays.');
  await page.reload();
  await page.getByRole('button', {name:'Open Notes'}).first().click();
  assert.equal(await page.getByLabel('Note text').inputValue(), 'A note that stays.');
  await page.close();
});

test('calculator computes an operation and handles division by zero', async () => {
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  await page.goto(url);
  await page.getByRole('button', {name:'Open Calculator'}).first().click({timeout:10000});
  const win = page.locator('[data-window="calculator"]');
  for (const key of ['8','×','7','=']) await win.getByRole('button', {name:key, exact:true}).click();
  assert.equal(await win.getByTestId('calculator-display').textContent(), '56');
  for (const key of ['AC','9','÷','0','=']) await win.getByRole('button', {name:key, exact:true}).click();
  assert.equal(await win.getByTestId('calculator-display').textContent(), 'Error');
  await page.close();
});

test('a local text file can be opened and previewed', async () => {
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  await page.goto(url);
  await page.getByRole('button', {name:'Open Files'}).first().click({timeout:10000});
  await page.locator('input[type=file]').setInputFiles({name:'hello.txt',mimeType:'text/plain',buffer:Buffer.from('Hello, Ahmad!')});
  assert.match(await page.locator('[data-file-preview]').innerText(), /Hello, Ahmad!/);
  await page.close();
});

test('window can move, maximize, restore and close', async () => {
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  await page.goto(url);
  await page.getByRole('button', {name:'Open Notes'}).first().click({timeout:10000});
  const win = page.locator('[data-window="notes"]');
  const header = win.locator('.window-titlebar');
  const box = await win.boundingBox(), title = await header.boundingBox();
  await page.mouse.move(title.x+100,title.y+15); await page.mouse.down(); await page.mouse.move(title.x+170,title.y+70,{steps:8}); await page.mouse.up();
  const moved = await win.boundingBox();
  assert.ok(moved.x > box.x+40 && moved.y > box.y+30, 'window moves when its title bar is dragged');
  await win.getByRole('button', {name:'Maximize'}).click();
  const maximized = await win.boundingBox();
  assert.ok(maximized.width > moved.width);
  await win.getByRole('button', {name:'Restore size'}).click();
  assert.ok(Math.abs((await win.boundingBox()).width - moved.width) < 3);
  await win.getByRole('button', {name:'Close'}).click();
  assert.equal(await win.count(), 0);
  await page.close();
});

test('a narrow phone viewport can open and close an app', async () => {
  const page = await browser.newPage({viewport:{width:390,height:844},hasTouch:true,...(engineName==='firefox'?{}:{isMobile:true})});
  await page.goto(url);
  await page.getByRole('button', {name:'Open Calculator'}).first().click({timeout:10000});
  const win = page.locator('[data-window="calculator"]');
  assert.equal(await win.isVisible(), true);
  const box = await win.boundingBox();
  assert.ok(box.x >= -1 && box.x + box.width <= 391, 'window fits within phone viewport');
  await win.getByRole('button', {name:'Close'}).click();
  assert.equal(await win.count(), 0);
  await page.close();
});

test('pointer resizing and snapping work for a window', async () => {
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  await page.goto(url);
  await page.getByRole('button', {name:'Open Notes'}).first().click({timeout:10000});
  const win=page.locator('[data-window="notes"]'), handle=win.locator('[data-edge="se"]');
  const before=await win.boundingBox(), corner=await handle.boundingBox();
  await page.mouse.move(corner.x+corner.width/2,corner.y+corner.height/2);
  await page.mouse.down(); await page.mouse.move(corner.x+75,corner.y+25,{steps:8}); await page.mouse.up();
  const larger=await win.boundingBox();
  assert.ok(larger.width > before.width+30,'south-east drag should increase window width');
  await win.getByRole('button',{name:'Snap right'}).click();
  const snapped=await win.boundingBox();
  assert.ok(Math.abs(snapped.x-640)<3 && Math.abs(snapped.width-640)<3);
  await page.close();
});

test('hardware-style keyboard events operate calculator and snapping', async () => {
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  await page.goto(url);
  await page.getByRole('button',{name:'Open Calculator'}).first().click({timeout:10000});
  const win=page.locator('[data-window="calculator"]');
  await page.keyboard.type('42'); await page.keyboard.press('Backspace'); await page.keyboard.type('+6'); await page.keyboard.press('Enter');
  assert.equal(await win.getByTestId('calculator-display').textContent(),'10');
  await page.keyboard.press('Control+Alt+ArrowRight');
  const box=await win.boundingBox();
  assert.ok(Math.abs(box.x-640)<3 && Math.abs(box.width-640)<3);
  await page.close();
});

test('each window edge and corner can be resized by pointer', async () => {
  const page=await browser.newPage({viewport:{width:1280,height:800}}); await page.goto(url);
  for(const edge of ['n','ne','e','se','s','sw','w','nw']) {
    await page.reload();
    await page.getByRole('button',{name:'Open Notes'}).first().click({timeout:10000});
    const win=page.locator('[data-window="notes"]'), handle=win.locator(`[data-edge="${edge}"]`);
    const initial=await win.boundingBox(), h=await handle.boundingBox();
    const dx=edge.includes('w')?-30:edge.includes('e')?30:0;
    const dy=edge.includes('n')?-30:edge.includes('s')?30:0;
    await page.mouse.move(h.x+h.width/2,h.y+h.height/2); await page.mouse.down();
    await page.mouse.move(h.x+h.width/2+dx,h.y+h.height/2+dy,{steps:5}); await page.mouse.up();
    const result=await win.boundingBox();
    if(dx) assert.ok(result.width>=initial.width+20,`${edge} changed width`);
    if(dy) assert.ok(result.height>=initial.height+20,`${edge} changed height`);
    await win.getByRole('button',{name:'Close'}).click();
  }
  await page.close();
});

test('native-browser bridge uses a separate view and clips it behind other windows', async () => {
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.addInitScript(()=>{
    window.__nativeCalls=[];
    Object.defineProperty(window,'webkit',{configurable:true,value:{messageHandlers:{nativeBrowser:{postMessage:(value)=>window.__nativeCalls.push(value)}}}});
  });
  await page.goto(url);
  await page.getByRole('button',{name:'Open Browser'}).first().click({timeout:10000});
  const win=page.locator('[data-window="browser"]');
  await win.getByLabel('Web address or search').fill('https://example.com');
  await win.getByRole('button',{name:'Go',exact:true}).click();
  assert.equal(await win.locator('.native-browser-slot').isVisible(),true);
  assert.equal(await win.locator('iframe').isVisible(),false);
  await page.waitForFunction(()=>window.__nativeCalls.some(call=>call.action==='sync' && call.views.some(view=>view.id==='browser' && view.width>0 && view.height>0)));
  const sent=await page.evaluate(()=>window.__nativeCalls);
  assert.ok(sent.some(call=>call.action==='navigate' && call.url==='https://example.com/'));
  assert.ok(sent.some(call=>call.action==='sync' && call.views.some(view=>view.id==='browser' && view.regions.length>0)));
  const previousSyncs=await page.evaluate(()=>window.__nativeCalls.filter(c=>c.action==='sync').length);
  await page.getByRole('button',{name:'Open Notes'}).last().click();
  await page.waitForFunction(count=>window.__nativeCalls.filter(c=>c.action==='sync').length>count,previousSyncs);
  const covered=await page.evaluate(()=>window.__nativeCalls.filter(c=>c.action==='sync').at(-1));
  const note=await page.locator('[data-window=notes]').boundingBox();
  for(const region of covered.views.find(v=>v.id==='browser')?.regions || []) {
    assert.ok(region.x+region.width<=note.x || region.x>=note.x+note.width || region.y+region.height<=note.y || region.y>=note.y+note.height, 'covered regions stay behind Notes');
  }
  await page.close();
});

test('all seven built-in app windows can be resized', async () => {
  const page=await browser.newPage({viewport:{width:1280,height:800}}); await page.goto(url);
  for(const [id,title] of [['browser','Browser'],['files','Files'],['notes','Notes'],['calendar','Calendar'],['calculator','Calculator'],['settings','Settings'],['help','Getting started']]) {
    await page.reload();
    await page.getByRole('button',{name:'Open applications'}).click();
    await page.locator('#launcher').getByRole('button',{name:`Open ${title}`}).click();
    const win=page.locator(`[data-window="${id}"]`), handle=win.locator('[data-edge="e"]');
    const before=await win.boundingBox(), grip=await handle.boundingBox();
    await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);await page.mouse.down();
    await page.mouse.move(grip.x+grip.width/2+40,grip.y+grip.height/2,{steps:5});await page.mouse.up();
    assert.ok((await win.boundingBox()).width>before.width+20,`${title} resized`);
  }
  await page.close();
});

test('app drawer search filters installed workspace tools', async () => {
  const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto(url);
  await page.getByRole('button',{name:'Open applications'}).click();
  await page.getByPlaceholder('Search applications').fill('calc',{timeout:2500});
  assert.equal(await page.locator('#launcher').getByRole('button',{name:'Open Calculator'}).isVisible(),true);
  assert.equal(await page.locator('#launcher').getByRole('button',{name:'Open Notes'}).isVisible(),false);
  await page.locator('#launcher').getByRole('button',{name:'Open Calculator'}).click();
  assert.equal(await page.locator('[data-window="calculator"]').isVisible(),true);
  await page.close();
});

test('show desktop minimizes windows and a taskbar icon restores them', async () => {
  const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto(url);
  await page.getByRole('button',{name:'Open Notes'}).first().click();
  await page.getByRole('button',{name:'Open Calculator'}).last().click();
  await page.getByRole('button',{name:'Show desktop'}).click({timeout:2500});
  assert.equal(await page.locator('[data-window="notes"]').isVisible(),false);
  assert.equal(await page.locator('[data-window="calculator"]').isVisible(),false);
  await page.getByRole('button',{name:'Restore Notes'}).click();
  assert.equal(await page.locator('[data-window="notes"]').isVisible(),true);
  await page.close();
});

test('right clicking desktop offers wallpaper settings and dismisses after selection', async () => {
  const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto(url);
  await page.locator('#desktop').click({button:'right',position:{x:1200,y:80}});
  const menu=page.getByRole('menu',{name:'Desktop menu'});
  assert.equal(await menu.isVisible({timeout:2000}),true);
  await menu.getByRole('button',{name:'Change wallpaper'}).click();
  assert.equal(await page.locator('[data-window="settings"]').isVisible(),true);
  assert.equal(await menu.isVisible(),false);
  await page.close();
});

test('Alt+Tab switches the active window and Alt+F4 closes it when delivered to the workspace', async () => {
  const page=await browser.newPage({viewport:{width:1280,height:800}});await page.goto(url);
  await page.getByRole('button',{name:'Open Notes'}).first().click();
  await page.getByRole('button',{name:'Open Calculator'}).last().click();
  assert.equal(await page.locator('[data-task="calculator"]').evaluate(el=>el.classList.contains('is-active')),true);
  await page.keyboard.press('Alt+Tab');
  assert.equal(await page.locator('[data-task="notes"]').evaluate(el=>el.classList.contains('is-active')),true);
  await page.keyboard.press('Alt+F4');
  assert.equal(await page.locator('[data-window="notes"]').count(),0);
  assert.equal(await page.locator('[data-window="calculator"]').isVisible(),true);
  await page.close();
});
