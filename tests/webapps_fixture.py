#!/usr/bin/env python3
"""Local, credential-free test pages for the iOS Simulator only."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/set'):
            marker = 'POCKET_SESSION_SET'
            cookie = True
            label, result, field = 'Test left click', 'LEFT_CLICK_OK', 'Left web input'
        else:
            marker = 'POCKET_SESSION_OK' if 'pocket_test=success' in self.headers.get('Cookie', '') else 'POCKET_SESSION_MISSING'
            cookie = False
            label, result, field = 'Test right click', 'RIGHT_CLICK_OK', 'Right web input'
        body = f'<!doctype html><html><head><title>{marker}</title><meta name="viewport" content="width=device-width"></head><body style="font-family:sans-serif;background:#eef4ff;padding:20px"><h1>{marker}</h1><p>Local test content only.</p><button onclick="this.textContent=\'{result}\'">{label}</button><input aria-label="{field}" onkeydown="if(event.key === \'Enter\') this.blur()"></body></html>'.encode()
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        if cookie: self.send_header('Set-Cookie', 'pocket_test=success; Max-Age=3600; Path=/; SameSite=Lax')
        self.end_headers()
        self.wfile.write(body)

if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 18765), Handler).serve_forever()
