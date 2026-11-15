(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DesktopCore = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const clamp = (n, min, max) => Math.min(Math.max(n, min), Math.max(min, max));

  function initialBounds(space, desired, index) {
    const pad = space.width < 550 ? 8 : 18;
    const width = Math.max(0, Math.min(desired.width, space.width - pad * 2));
    const height = Math.max(0, Math.min(desired.height, space.height - pad * 2));
    const offset = (index % 5) * 26;
    return {
      x: Math.round(clamp((space.width - width) / 2 + offset, pad, space.width - width - pad)),
      y: Math.round(clamp((space.height - height) / 2 + offset, pad, space.height - height - pad)),
      width, height
    };
  }

  function moveBounds(bounds, dx, dy, space) {
    const grab = Math.min(120, bounds.width, space.width);
    return {...bounds,
      x: Math.round(clamp(bounds.x + dx, -bounds.width + grab, space.width - grab)),
      y: Math.round(clamp(bounds.y + dy, 0, space.height - 44))
    };
  }

  function resizeBounds(bounds, dx, dy, space) {
    const maxW = Math.max(0, space.width - bounds.x);
    const maxH = Math.max(0, space.height - bounds.y);
    return {...bounds,
      width: Math.round(clamp(bounds.width + dx, Math.min(280,maxW), maxW)),
      height: Math.round(clamp(bounds.height + dy, Math.min(200,maxH), maxH))
    };
  }

  function maximizeBounds(space) { return {x:0,y:0,width:space.width,height:space.height}; }

  function resizeFromEdge(bounds, dx, dy, space, edge) {
    let left=bounds.x, top=bounds.y, right=bounds.x+bounds.width, bottom=bounds.y+bounds.height;
    const minWidth=Math.min(280,space.width), minHeight=Math.min(200,space.height);
    const minLeft = bounds.x < 0 ? Math.min(bounds.x,right-space.width) : 0;
    const maxRight = Math.max(space.width,left+minWidth);
    if (edge.includes('w')) left=clamp(bounds.x+dx,minLeft,Math.min(right-minWidth,space.width-Math.min(120,space.width)));
    if (edge.includes('e')) right=clamp(right+dx,left+minWidth,maxRight);
    if (edge.includes('n')) top=clamp(bounds.y+dy,0,Math.min(bottom-minHeight,Math.max(0,space.height-44)));
    if (edge.includes('s')) bottom=clamp(bottom+dy,top+minHeight,space.height);
    return {x:Math.round(left),y:Math.round(top),width:Math.round(right-left),height:Math.round(bottom-top)};
  }
  function snapBounds(space, side) {
    const half=Math.floor(space.width/2);
    return side==='right'?{x:half,y:0,width:space.width-half,height:space.height}:{x:0,y:0,width:half,height:space.height};
  }

  // Return non-overlapping parts of a web view that are not covered by higher windows.
  function visibleRegions(rect, clip, blockers) {
    function intersection(a, b) {
      const x=Math.max(a.x,b.x), y=Math.max(a.y,b.y);
      const right=Math.min(a.x+a.width,b.x+b.width), bottom=Math.min(a.y+a.height,b.y+b.height);
      return right>x && bottom>y ? {x,y,width:right-x,height:bottom-y} : null;
    }
    const first=intersection(rect,clip);
    let regions=first ? [first] : [];
    for(const blocker of blockers) {
      const next=[];
      for(const r of regions) {
        const overlap=intersection(r,blocker);
        if(!overlap) {next.push(r);continue;}
        const right=r.x+r.width, bottom=r.y+r.height;
        const candidates=[
          {x:r.x,y:r.y,width:r.width,height:overlap.y-r.y},
          {x:r.x,y:overlap.y+overlap.height,width:r.width,height:bottom-overlap.y-overlap.height},
          {x:r.x,y:overlap.y,width:overlap.x-r.x,height:overlap.height},
          {x:overlap.x+overlap.width,y:overlap.y,width:right-overlap.x-overlap.width,height:overlap.height}
        ];
        next.push(...candidates.filter(p=>p.width>0 && p.height>0));
      }
      regions=next;
    }
    return regions;
  }

  function normalizeURL(value) {
    const text = String(value || '').trim();
    if (!text) return null;
    if (/^[a-z][a-z\d+.-]*:/i.test(text) && !/^https?:\/\//i.test(text)) return null;
    if (/\s/.test(text) || (!text.includes('.') && !/^https?:\/\//i.test(text))) {
      return 'https://www.google.com/search?q=' + encodeURIComponent(text);
    }
    try {
      const url = new URL(/^https?:\/\//i.test(text) ? text : 'https://' + text);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch (_) { return null; }
  }

  class Calculator {
    constructor() { this.clear(); }
    clear() { this.display = '0'; this.pending = null; this.previous = null; this.replace = false; }
    press(key) {
      if (key === 'AC') { this.clear(); return this.display; }
      if (key === 'Backspace') {
        if (!this.replace && this.display !== 'Error') {
          this.display=this.display.slice(0,-1);
          if (!this.display || this.display === '-') this.display='0';
        }
        return this.display;
      }
      if (/^\d$/.test(key) || key === '.') {
        if (this.replace || this.display === 'Error') { this.display = '0'; this.replace = false; }
        if (key === '.') { if (!this.display.includes('.')) this.display += '.'; }
        else this.display = this.display === '0' ? key : (this.display.length < 16 ? this.display + key : this.display);
      } else if (key === '±' && this.display !== '0' && this.display !== 'Error') {
        this.display = this.display.startsWith('-') ? this.display.slice(1) : '-' + this.display;
      } else if (key === '%' && this.display !== 'Error') {
        this.display = this.format(Number(this.display) / 100);
      } else if (['+','−','×','÷'].includes(key)) {
        if (this.display === 'Error') return this.display;
        if (this.pending && !this.replace) this.calculate();
        if (this.display === 'Error') return this.display;
        this.previous = Number(this.display); this.pending = key; this.replace = true;
      } else if (key === '=' && this.pending && !this.replace) {
        this.calculate(); this.pending = null; this.previous = null; this.replace = true;
      }
      return this.display;
    }
    format(n) { return Number.isFinite(n) ? String(Number(n.toPrecision(12))) : 'Error'; }
    calculate() {
      const n = Number(this.display), a = this.previous;
      const result = this.pending === '+' ? a+n : this.pending === '−' ? a-n : this.pending === '×' ? a*n : n === 0 ? NaN : a/n;
      this.display = this.format(result);
    }
  }
  return {initialBounds, moveBounds, resizeBounds, resizeFromEdge, snapBounds, maximizeBounds, visibleRegions, normalizeURL, Calculator};
});
