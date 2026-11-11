const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {webkit,devices}=require('playwright');
const root=path.resolve(__dirname,'../app');
let server,browser,base;
before(async()=>{
  server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
    const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}/`;
  browser=await webkit.launch({headless:true});
});
after(async()=>{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));});
const profiles=[
  ['iPhone 16 Pro landscape',devices['iPhone 16 Pro landscape']],
  ['iPhone 17 Pro landscape',devices['iPhone 17 Pro landscape']],
  // Apple lists the same 2622 x 1206 physical panel for 18 Pro; this is only a viewport approximation.
  ['iPhone 18 Pro-sized landscape (approximation)',devices['iPhone 17 Pro landscape']]
];
for(const [name,profile] of profiles){
  test(`${name}: touch opens tools and side-by-side windows fit`,async()=>{
    const context=await browser.newContext({...profile}); const page=await context.newPage();
    await page.goto(base);
    await page.getByRole('button',{name:'Open applications'}).tap({timeout:10000});
    await page.getByPlaceholder('Search applications').fill('notes');
    await page.locator('#launcher').getByRole('button',{name:'Open Notes'}).tap();
    const notes=page.locator('[data-window="notes"]');
    assert.equal(await notes.isVisible(),true);
    await notes.getByRole('button',{name:'Snap left'}).tap();
    await page.getByRole('button',{name:'Open Calculator'}).last().tap({timeout:10000});
    const calc=page.locator('[data-window="calculator"]');
    await calc.getByRole('button',{name:'Snap right'}).tap();
    await calc.getByRole('button',{name:'8',exact:true}).tap();
    await calc.getByRole('button',{name:'×',exact:true}).tap();
    await calc.getByRole('button',{name:'7',exact:true}).tap();
    await calc.getByRole('button',{name:'=',exact:true}).tap();
    assert.equal(await calc.getByTestId('calculator-display').textContent(),'56');
    const left=await notes.boundingBox(),right=await calc.boundingBox(),width=page.viewportSize().width;
    assert.ok(left.x>=-1 && right.x+right.width<=width+1,'both windows remain visible');
    assert.ok(Math.abs((left.x+left.width)-right.x)<3,'snapped windows meet');
    if(name.startsWith('iPhone 18')) await page.screenshot({path:path.join(os.tmpdir(),'pocket-mobile-webkit.png')});
    await context.close();
  });
}
