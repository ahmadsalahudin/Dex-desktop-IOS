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
  await page.goto(base);
  const directory=await openDirectory(page);
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
