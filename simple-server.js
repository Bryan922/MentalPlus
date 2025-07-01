const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;

// Types MIME
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Gérer les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Parser l'URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Rediriger la racine vers index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Construire le chemin du fichier
    const filePath = path.join(__dirname, pathname);
    
    // Vérifier si le fichier existe
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // Fichier non trouvé
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<!DOCTYPE html>
<html>
<head>
    <title>404 - Page non trouvée</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>404 - Page non trouvée</h1>
    <p>Le fichier demandé n'existe pas : ${pathname}</p>
    <a href="/">Retour à l'accueil</a>
</body>
</html>`);
            return;
        }
        
        // Lire le fichier
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`<!DOCTYPE html>
<html>
<head>
    <title>500 - Erreur serveur</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>500 - Erreur serveur</h1>
    <p>Impossible de lire le fichier : ${err.message}</p>
</body>
</html>`);
                return;
            }
            
            // Déterminer le type MIME
            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            
            // Envoyer la réponse
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
});

// Gérer les erreurs du serveur
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Le port ${PORT} est déjà utilisé.`);
        console.log('Essayez de fermer les autres serveurs ou utilisez un autre port.');
        process.exit(1);
    } else {
        console.log('❌ Erreur serveur:', err.message);
    }
});

// Démarrer le serveur
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré avec succès !`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📁 Dossier: ${__dirname}`);
    console.log('⏹️  Appuyez sur Ctrl+C pour arrêter le serveur');
    console.log('\n' + '='.repeat(50));
});

// Gérer l'arrêt propre du serveur
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement.');
        process.exit(0);
    });
});