from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/':
            self.path = '/coming-soon.html'
        return super().do_GET()

port = 8000
print(f"Serveur démarré sur http://localhost:{port}")
print("Pour arrêter le serveur, appuyez sur Ctrl+C")
HTTPServer(('localhost', port), CORSRequestHandler).serve_forever() 