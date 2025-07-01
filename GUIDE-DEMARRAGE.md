# 🚀 Guide de démarrage du serveur MENTALPLUS

## ❌ Problème rencontré
Python n'est pas installé ou accessible sur votre système Windows.

## 🔧 Solutions disponibles

### Solution 1 : Installer Python (Recommandé)

1. **Télécharger Python** :
   - Allez sur https://python.org/downloads/
   - Téléchargez la dernière version de Python 3.x
   - **IMPORTANT** : Cochez "Add Python to PATH" lors de l'installation

2. **Vérifier l'installation** :
   ```cmd
   python --version
   ```

3. **Démarrer le serveur** :
   ```cmd
   cd "c:\Users\Windows 10\Music\Projets\MENTALPLUS"
   python server.py
   ```

### Solution 2 : Utiliser Node.js (Alternative)

1. **Télécharger Node.js** :
   - Allez sur https://nodejs.org/
   - Téléchargez la version LTS
   - Installez avec les paramètres par défaut

2. **Démarrer le serveur** :
   ```cmd
   cd "c:\Users\Windows 10\Music\Projets\MENTALPLUS"
   node simple-server.js
   ```

### Solution 3 : Fichiers batch automatiques

#### Pour Node.js :
- Double-cliquez sur `start-server.bat`
- Le script vérifiera automatiquement Node.js

#### Pour Python :
- Double-cliquez sur `start-server-python.bat`
- Le script vérifiera automatiquement Python

### Solution 4 : Serveur HTTP simple (Sans installation)

Si vous avez PowerShell (inclus dans Windows) :

```powershell
cd "c:\Users\Windows 10\Music\Projets\MENTALPLUS"
# Démarrer un serveur HTTP simple
python -m http.server 8000
```

Ou avec PowerShell uniquement :
```powershell
# Créer un serveur HTTP basique
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8000/')
$listener.Start()
Write-Host "Serveur démarré sur http://localhost:8000"
```

## 🌐 Accès au site

Une fois le serveur démarré, ouvrez votre navigateur et allez à :
**http://localhost:8000**

## 🔍 Diagnostic des problèmes

### Erreur "Port déjà utilisé"
```cmd
# Trouver le processus utilisant le port 8000
netstat -ano | findstr :8000
# Arrêter le processus (remplacez PID par le numéro trouvé)
taskkill /PID [PID] /F
```

### Erreur "Python introuvable"
- Réinstallez Python en cochant "Add to PATH"
- Redémarrez votre terminal/invite de commande
- Essayez `python3` au lieu de `python`

### Erreur "Node.js introuvable"
- Installez Node.js depuis https://nodejs.org/
- Redémarrez votre terminal
- Vérifiez avec `node --version`

## ✅ Fonctionnalités disponibles

Une fois le serveur lancé :

### 🔐 Authentification
- Connexion/déconnexion Supabase
- Sessions persistantes
- Protection des routes

### 👤 Espace client
- Gestion des rendez-vous
- Documents et paramètres
- Navigation complète

### 📋 Pages de test
- `test-espace-client.html` : Tests complets
- `auth.html` : Test d'authentification

## 🆘 Support

Si aucune solution ne fonctionne :
1. Vérifiez que vous êtes dans le bon dossier
2. Essayez de redémarrer votre ordinateur
3. Vérifiez les permissions du dossier
4. Contactez le support technique

---

**Note** : Ce guide couvre toutes les méthodes possibles pour démarrer le serveur MENTALPLUS sur Windows.