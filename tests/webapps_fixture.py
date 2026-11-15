#!/usr/bin/env python3
"""Local, credential-free test pages for the iOS Simulator only."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/redirect'):
            self.send_response(302)
            self.send_header('Location', '/set')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return
        if self.path.startswith('/popup'):
            html = '''<!doctype html><html><head><title>Local popup</title></head><body>
            <button onclick="if(window.opener) window.opener.postMessage('pocket-popup-ok',location.origin); window.close()">Complete popup</button>
            </body></html>'''
            cookie = False
        else:
            if self.path.startswith('/set'):
                marker, cookie = 'POCKET_SESSION_SET', True
                label, result, field = 'Test left click', 'LEFT_CLICK_OK', 'Left web input'
                popup_button = '<button onclick="openPopup()">Open left popup</button><span id="popup-result"></span>'
            else:
                marker = 'POCKET_SESSION_OK' if 'pocket_test=success' in self.headers.get('Cookie', '') else 'POCKET_SESSION_MISSING'
                cookie = False
                label, result, field = 'Test right click', 'RIGHT_CLICK_OK', 'Right web input'
                popup_button = ''
            html = f'''<!doctype html><html><head><title>{marker}</title><meta name="viewport" content="width=device-width"></head>
            <body style="font-family:sans-serif;background:#eef4ff;padding:20px"><h1>{marker}</h1><p>Local test content only.</p>
            <button onclick="this.textContent='{result}'">{label}</button>
            <input aria-label="{field}" onkeydown="if(event.key === 'Enter') this.blur()">{popup_button}
            <script>
            function openPopup() {{ const p=window.open('about:blank','_blank'); if(p) p.location.href='/popup'; }}
            window.addEventListener('message', e => {{ if(e.origin===location.origin && e.data==='pocket-popup-ok') document.getElementById('popup-result').textContent='POPUP_ROUNDTRIP_OK'; }});
            </script></body></html>'''
        body = html.encode()
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        if cookie: self.send_header('Set-Cookie', 'pocket_test=success; Max-Age=3600; Path=/; SameSite=Lax')
        self.end_headers()
        self.wfile.write(body)

if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 18765), Handler).serve_forever()
