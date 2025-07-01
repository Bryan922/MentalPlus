#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse
import mimetypes

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def end_headers(self):
        # Ajouter les headers CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Gérer les requêtes preflight CORS
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        # Rediriger la racine vers index.html
        if self.path == '/':
            self.path = '/index.html'
        
        # Vérifier si le fichier existe
        file_path = self.path.lstrip('/')
        if not os.path.exists(file_path):
            self.send_error(404, f"Fichier non trouvé: {self.path}")
            return
        
        super().do_GET()
    
    def log_message(self, format, *args):
        # Personnaliser les logs
        print(f"📄 {args[0]} - {args[1]} - {args[2]}")

def main():
    PORT = 8000
    
    print("🚀 Démarrage du serveur MENTALPLUS...")
    print(f"📁 Dossier: {os.getcwd()}")
    
    try:
        with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
            print(f"📍 Serveur démarré sur: http://localhost:{PORT}")
            print("⏹️  Appuyez sur Ctrl+C pour arrêter le serveur")
            print("=" * 50)
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 98 or e.errno == 10048:  # Port déjà utilisé
            print(f"❌ Le port {PORT} est déjà utilisé.")
            print("Essayez de fermer les autres serveurs ou utilisez un autre port.")
        else:
            print(f"❌ Erreur: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du serveur...")
        print("✅ Serveur arrêté proprement.")
        sys.exit(0)

if __name__ == "__main__":
    main()