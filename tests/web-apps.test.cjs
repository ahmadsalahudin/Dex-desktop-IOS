const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

let server, browser, base;
const root = path.resolve(__dirname, '../app');
before(async () => {
  server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), args:['--no-sandbox']});
});
after(async()=>{if(browser) await browser.close(); if(server) await new Promise(r=>server.close(r));});

async function openDirectory(page) {
  await page.getByRole('button',{name:'Open Web apps'}).first().click();
  return page.locator('[data-window="webapps"]');
}

test('web app directory is searchable and includes the experimental OS', async()=>{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.setDefaultTimeout(7000);
  await page.goto(base);
  const directory=await openDirectory(page);
  fs.mkdirSync('test-artifacts', {recursive:true});
  await page.screenshot({path:'test-artifacts/web-apps-directory.png'});
  const search=directory.getByRole('searchbox',{name:'Search web apps'});
  await search.fill('telegram');
  assert.equal(await directory.getByRole('button',{name:'Open Telegram',exact:true}).isVisible(),true);
  assert.equal(await directory.getByRole('button',{name:'Open WhatsApp',exact:true}).isVisible(),false);
  await search.fill('desktop os');
  assert.equal(await directory.getByRole('button',{name:'Open Desktop OS',exact:true}).isVisible(),true);
  await page.close();
});

test('web shortcuts use independent native views and keep both visible when snapped', async()=>{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.addInitScript(()=>{
    window.__nativeCalls=[];
    Object.defineProperty(window,'webkit',{configurable:true,value:{messageHandlers:{nativeBrowser:{postMessage:value=>window.__nativeCalls.push(value)}}}});
  });
  page.setDefaultTimeout(7000);
  await page.goto(base);
  let directory=await openDirectory(page);
  await directory.getByRole('button',{name:'Open Telegram',exact:true}).click();
  const telegram=page.locator('[data-window="web-telegram"]');
  assert.equal(await telegram.isVisible(),true);
  await telegram.getByRole('button',{name:'Snap left'}).click();
  await page.getByRole('button',{name:'Restore Web apps'}).click();
  directory=page.locator('[data-window="webapps"]');
  await directory.getByRole('button',{name:'Open WhatsApp',exact:true}).click();
  const whatsapp=page.locator('[data-window="web-whatsapp"]');
  await whatsapp.getByRole('button',{name:'Snap right'}).click();
  await page.waitForFunction(()=>{
    const call=window.__nativeCalls.filter(c=>c.action==='sync').at(-1);
    return call?.views?.some(v=>v.id==='web-telegram') && call.views.some(v=>v.id==='web-whatsapp');
  });
  const calls=await page.evaluate(()=>window.__nativeCalls);
  assert.ok(calls.some(c=>c.action==='navigate' && c.id==='web-telegram' && c.url==='https://web.telegram.org/k/'));
  assert.ok(calls.some(c=>c.action==='navigate' && c.id==='web-whatsapp' && c.url==='https://web.whatsapp.com/'));
  const sync=calls.filter(c=>c.action==='sync').at(-1);
  const left=sync.views.find(v=>v.id==='web-telegram'), right=sync.views.find(v=>v.id==='web-whatsapp');
  assert.ok(left.x+left.width<=right.x+2,'both web views fit side by side');
  await whatsapp.getByRole('button',{name:'Close'}).click();
  await page.waitForFunction(()=>window.__nativeCalls.some(c=>c.action==='close' && c.id==='web-whatsapp'));
  assert.equal(await telegram.isVisible(),true);
  await page.close();
});

test('native navigation updates the address and Safari fallback for the correct window', async()=>{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.addInitScript(()=>{
    window.__externalCalls=[];
    Object.defineProperty(window,'webkit',{configurable:true,value:{messageHandlers:{nativeBrowser:{postMessage:()=>{}},openExternal:{postMessage:value=>window.__externalCalls.push(value)}}}});
  });
  page.setDefaultTimeout(7000);
  await page.goto(base);
  await page.getByRole('button',{name:'Open Browser'}).first().click();
  const win=page.locator('[data-window="browser"]'), input=win.getByLabel('Web address or search');
  await input.fill('https://example.com/start');
  await win.getByRole('button',{name:'Go',exact:true}).click();
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('pocketdesktop:browser-url',{detail:{id:'browser',url:'https://example.com/after-redirect'}})));
  assert.equal(await input.inputValue(),'https://example.com/after-redirect');
  await win.getByRole('button',{name:'Safari',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>window.__externalCalls),['https://example.com/after-redirect']);
  await page.close();
});

test('browser sends a custom-port address to its native web window', async()=>{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.addInitScript(()=>{
    window.__nativeCalls=[];
    Object.defineProperty(window,'webkit',{configurable:true,value:{messageHandlers:{nativeBrowser:{postMessage:value=>window.__nativeCalls.push(value)}}}});
  });
  await page.goto(base);
  await page.getByRole('button',{name:'Open Browser'}).first().click();
  const win=page.locator('[data-window="browser"]');
  await win.getByLabel('Web address or search').fill('example.org:8443/path');
  await win.getByRole('button',{name:'Go',exact:true}).click();
  assert.ok(await page.evaluate(()=>window.__nativeCalls.some(call=>
    call.action==='navigate' && call.id==='browser' && call.url==='https://example.org:8443/path')));
  await page.close();
});

test('a redirect while the address bar is focused opens the current page in Safari', async()=>{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.addInitScript(()=>{
    window.__externalCalls=[];
    Object.defineProperty(window,'webkit',{configurable:true,value:{messageHandlers:{nativeBrowser:{postMessage:()=>{}},openExternal:{postMessage:value=>window.__externalCalls.push(value)}}}});
  });
  await page.goto(base);
  await page.getByRole('button',{name:'Open Browser'}).first().click();
  const win=page.locator('[data-window="browser"]'), input=win.getByLabel('Web address or search');
  await input.fill('https://example.com/start');
  await win.getByRole('button',{name:'Go',exact:true}).click();
  await input.focus();
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('pocketdesktop:browser-url',{detail:{id:'browser',url:'https://example.com/redirected'}})));
  await win.getByRole('button',{name:'Safari',exact:true}).click();
  assert.equal(await input.inputValue(),'https://example.com/redirected');
  assert.deepEqual(await page.evaluate(()=>window.__externalCalls),['https://example.com/redirected']);
  await page.close();
});

test('a non-web popup does not show or open the previous web address', async()=>{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.addInitScript(()=>{
    window.__externalCalls=[];
    Object.defineProperty(window,'webkit',{configurable:true,value:{messageHandlers:{nativeBrowser:{postMessage:()=>{}},openExternal:{postMessage:value=>window.__externalCalls.push(value)}}}});
  });
  await page.goto(base);
  await page.getByRole('button',{name:'Open Browser'}).first().click();
  const win=page.locator('[data-window="browser"]'), input=win.getByLabel('Web address or search');
  await input.fill('https://example.com/start');
  await win.getByRole('button',{name:'Go',exact:true}).click();
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('pocketdesktop:browser-url',{detail:{id:'browser',nonWeb:true}})));
  assert.equal(await input.inputValue(),'Page without a web address');
  assert.equal(await win.getByRole('button',{name:'Safari',exact:true}).isDisabled(),true);
  assert.deepEqual(await page.evaluate(()=>window.__externalCalls),[]);
  await page.close();
});

test('a native popup offers a control to return to its originating page', async()=>{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.addInitScript(()=>{
    window.__nativeCalls=[];
    Object.defineProperty(window,'webkit',{configurable:true,value:{messageHandlers:{nativeBrowser:{postMessage:value=>window.__nativeCalls.push(value)}}}});
  });
  page.setDefaultTimeout(7000);
  await page.goto(base);
  await page.getByRole('button',{name:'Open Browser'}).first().click();
  const win=page.locator('[data-window="browser"]');
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('pocketdesktop:browser-popup',{detail:{id:'browser',open:true}})));
  const closePopup=win.getByRole('button',{name:'Close pop-up',exact:true});
  assert.equal(await closePopup.isVisible(),true);
  await closePopup.click();
  assert.ok(await page.evaluate(()=>window.__nativeCalls.some(call=>call.action==='close-popup' && call.id==='browser')));
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('pocketdesktop:browser-popup',{detail:{id:'browser',open:false}})));
  assert.equal(await closePopup.isVisible(),false);
  await page.close();
});
