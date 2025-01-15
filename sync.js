const { watch } = require('fs');
const { exec } = require('child_process');

// Dossiers à surveiller
const watchDirs = [
    './css',
    './js',
    '*.html'
];

// Fonction pour déployer
function deploy() {
    console.log('Modifications détectées, déploiement en cours...');
    exec('vercel deploy --prod', (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur de déploiement: ${error}`);
            return;
        }
        console.log(`Déploiement réussi: ${stdout}`);
    });
}

// Surveillance des fichiers
watchDirs.forEach(dir => {
    watch(dir, { recursive: true }, (eventType, filename) => {
        if (filename) {
            console.log(`Fichier modifié: ${filename}`);
            deploy();
        }
    });
});

console.log('Surveillance des modifications activée...'); 