const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('../app/core.js');
const {initialBounds, moveBounds, resizeBounds, maximizeBounds, normalizeURL, Calculator} = require('../app/core.js');

test('initial windows fit inside a narrow phone viewport', () => {
  const b = initialBounds({width:390,height:740}, {width:720,height:500}, 0);
  assert.ok(b.x >= 0 && b.y >= 0 && b.x+b.width <= 390 && b.y+b.height <= 740);
});
test('dragging keeps the titlebar available at every edge', () => {
  const b = {x:100,y:100,width:400,height:300};
  assert.deepEqual(moveBounds(b,-1000,-1000,{width:1000,height:700}),{x:-280,y:0,width:400,height:300});
  assert.deepEqual(moveBounds(b,2000,2000,{width:1000,height:700}),{x:880,y:656,width:400,height:300});
});
test('resizing is constrained to the visible workspace and a usable minimum', () => {
  const b = {x:100,y:100,width:400,height:300};
  assert.deepEqual(resizeBounds(b,-900,-900,{width:1000,height:700}),{x:100,y:100,width:280,height:200});
  assert.deepEqual(resizeBounds(b,2000,2000,{width:1000,height:700}),{x:100,y:100,width:900,height:600});
});
test('maximized windows use the workspace', () => {
  assert.deepEqual(maximizeBounds({width:1000,height:700}),{x:0,y:0,width:1000,height:700});
});
test('calculator supports sequential arithmetic and safely rejects division by zero', () => {
  const calc = new Calculator();
  for (const key of ['8','×','7','=']) calc.press(key);
  assert.equal(calc.display, '56');
  for (const key of ['AC','9','÷','0','=']) calc.press(key);
  assert.equal(calc.display, 'Error');
  for (const key of ['AC','1','.','5','+','2','.','5','=']) calc.press(key);
  assert.equal(calc.display, '4');
});
test('web addresses cannot invoke unsafe URL schemes', () => {
  assert.equal(normalizeURL('example.org/path'), 'https://example.org/path');
  assert.equal(normalizeURL('http://example.org/'), 'http://example.org/');
  assert.equal(normalizeURL('javascript:alert(1)'), null);
  assert.match(normalizeURL('blue sky'), /^https:\/\/www\.google\.com\/search\?q=blue%20sky$/);
});

test('windows resize from any corner or edge while respecting minimum sizes', () => {
  const { resizeFromEdge } = require('../app/core.js');
  const original = {x:100,y:120,width:500,height:360}, viewport = {width:1000,height:700};
  assert.deepEqual(resizeFromEdge(original,80,50,viewport,'nw'),{x:180,y:170,width:420,height:310});
  assert.deepEqual(resizeFromEdge(original,-500,-500,viewport,'nw'),{x:0,y:0,width:600,height:480});
  assert.deepEqual(resizeFromEdge(original,500,500,viewport,'nw'),{x:320,y:280,width:280,height:200});
  assert.deepEqual(resizeFromEdge(original,700,700,viewport,'se'),{x:100,y:120,width:900,height:580});
  assert.deepEqual(resizeFromEdge(original,60,0,viewport,'w'),{x:160,y:120,width:440,height:360});
});
test('snapping leaves no gap even on an odd-sized workspace', () => {
  const { snapBounds } = require('../app/core.js');
  assert.deepEqual(snapBounds({width:1001,height:700},'left'),{x:0,y:0,width:500,height:700});
  assert.deepEqual(snapBounds({width:1001,height:700},'right'),{x:500,y:0,width:501,height:700});
});
test('calculator removes digits on keyboard backspace', () => {
  const calc = new Calculator();
  for (const key of ['4','2','Backspace']) calc.press(key);
  assert.equal(calc.display,'4');
  calc.press('Backspace');
  assert.equal(calc.display,'0');
});

test('resizing a partly offscreen window does not lose its minimum width', () => {
  const { resizeFromEdge } = require('../app/core.js');
  const original = {x:-280,y:0,width:400,height:300}, viewport = {width:1000,height:700};
  assert.deepEqual(resizeFromEdge(original,-10,0,viewport,'w'),{x:-290,y:0,width:410,height:300});
  assert.deepEqual(resizeFromEdge(original,300,0,viewport,'w'),{x:-160,y:0,width:280,height:300});
});

test('resizing the top or left edge keeps the title bar reachable', () => {
  const {resizeFromEdge}=require('../app/core.js');
  const view={width:1000,height:700};
  const low={x:100,y:650,width:400,height:500};
  assert.ok(resizeFromEdge(low,0,1000,view,'n').y<=656);
  const right={x:870,y:100,width:400,height:300};
  assert.ok(resizeFromEdge(right,1000,0,view,'w').x<=880);
});

test('native web windows exclude all higher window regions, including overlapping blockers', () => {
  assert.equal(typeof core.visibleRegions, 'function');
  const area={x:0,y:0,width:100,height:100};
  const blockers=[{x:20,y:20,width:50,height:50},{x:40,y:40,width:50,height:50}];
  const regions=core.visibleRegions(area,area,blockers);
  assert.equal(regions.reduce((sum,r)=>sum+r.width*r.height,0),5900);
  const visible=(x,y)=>regions.some(r=>x>=r.x && x<r.x+r.width && y>=r.y && y<r.y+r.height);
  assert.equal(visible(10,10),true);
  assert.equal(visible(25,25),false);
  assert.equal(visible(45,45),false);
  assert.equal(visible(85,85),false);
});

test('native web windows are clipped to the workspace', () => {
  assert.equal(typeof core.visibleRegions, 'function');
  const regions=core.visibleRegions({x:-20,y:10,width:70,height:40},{x:0,y:0,width:100,height:100},[]);
  assert.deepEqual(regions,[{x:0,y:10,width:50,height:40}]);
});
