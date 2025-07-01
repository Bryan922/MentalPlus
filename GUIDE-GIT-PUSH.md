# Guide de Push vers GitHub - MentalPlus

## 🚀 Méthode automatique (Recommandée)

### Utilisation du script batch
1. **Double-cliquez** sur le fichier `push-to-git.bat`
2. **Suivez les instructions** à l'écran
3. **Entrez votre message de commit** (ou laissez vide pour le message par défaut)
4. Le script s'occupera du reste automatiquement

---

## 🔧 Méthode manuelle (Si le script ne fonctionne pas)

### Prérequis
1. **Git installé** sur votre système
   - Télécharger depuis: https://git-scm.com/download/win
   - Vérifier l'installation: `git --version`

2. **Authentification GitHub configurée**
   - Token d'accès personnel OU
   - SSH key configurée

### Étapes détaillées

#### 1. Ouvrir le terminal
```bash
# Naviguez vers le dossier du projet
cd "c:\Users\Windows 10\Music\Projets\MENTALPLUS"
```

#### 2. Vérifier le repository
```bash
# Vérifier si c'est un repository Git
git status

# Si ce n'est pas un repository, l'initialiser
git init
git remote add origin https://github.com/Bryan922/MentalPlus.git
```

#### 3. Ajouter les fichiers
```bash
# Ajouter tous les fichiers modifiés
git add .

# Ou ajouter des fichiers spécifiques
git add DOCUMENTATION-AGENCE.md
git add ANALYSE-TECHNIQUE-SUPABASE.md
git add CHECKLIST-AGENCE.md
```

#### 4. Vérifier les modifications
```bash
# Voir les fichiers qui seront commités
git status

# Voir les différences
git diff --cached
```

#### 5. Créer le commit
```bash
# Commit avec message descriptif
git commit -m "Ajout documentation complète pour agence - intégration Supabase"

# Ou commit plus détaillé
git commit -m "Documentation agence: analyse technique Supabase et checklist intégration

- Ajout DOCUMENTATION-AGENCE.md: guide complet projet MentalPlus
- Ajout ANALYSE-TECHNIQUE-SUPABASE.md: détails techniques fichiers JS
- Ajout CHECKLIST-AGENCE.md: checklist accès et informations
- Estimation 44-64h pour intégration complète
- Schéma DB avec 8+ tables et politiques RLS"
```

#### 6. Pousser vers GitHub
```bash
# Push vers la branche principale
git push -u origin main

# Si erreur, essayer avec master
git push -u origin master

# Pour les pushs suivants (après le premier)
git push
```

---

## 🔐 Configuration de l'authentification

### Option 1: Token d'accès personnel (Recommandé)
1. **Aller sur GitHub** → Settings → Developer settings → Personal access tokens
2. **Générer un nouveau token** avec les permissions:
   - `repo` (accès complet aux repositories)
   - `workflow` (si vous utilisez GitHub Actions)
3. **Utiliser le token** comme mot de passe lors du push

### Option 2: SSH Key
```bash
# Générer une clé SSH
ssh-keygen -t ed25519 -C "votre-email@example.com"

# Ajouter la clé à l'agent SSH
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copier la clé publique
cat ~/.ssh/id_ed25519.pub

# Ajouter la clé sur GitHub: Settings → SSH and GPG keys
```

---

## 📋 Vérification du push

### Après le push réussi
1. **Vérifier sur GitHub**: https://github.com/Bryan922/MentalPlus
2. **Confirmer la présence des nouveaux fichiers**:
   - `DOCUMENTATION-AGENCE.md`
   - `ANALYSE-TECHNIQUE-SUPABASE.md`
   - `CHECKLIST-AGENCE.md`
3. **Vérifier le message de commit**
4. **Tester les liens** dans la documentation

---

## 🚨 Résolution des problèmes courants

### Erreur: "Git not found"
```bash
# Vérifier l'installation
where git

# Réinstaller Git si nécessaire
# Télécharger depuis: https://git-scm.com/download/win
```

### Erreur: "Authentication failed"
```bash
# Vérifier les credentials
git config --global user.name "Votre Nom"
git config --global user.email "votre-email@example.com"

# Utiliser un token d'accès personnel
# Username: votre-username-github
# Password: votre-token-personnel
```

### Erreur: "Repository not found"
```bash
# Vérifier l'URL du repository
git remote -v

# Corriger l'URL si nécessaire
git remote set-url origin https://github.com/Bryan922/MentalPlus.git
```

### Erreur: "Branch diverged"
```bash
# Récupérer les dernières modifications
git fetch origin

# Merger ou rebaser
git pull origin main
# OU
git rebase origin/main

# Puis pousser
git push origin main
```

### Erreur: "Large files"
```bash
# Voir les gros fichiers
git ls-files | xargs ls -la | sort -k5 -rn | head

# Utiliser Git LFS pour les gros fichiers
git lfs track "*.png"
git lfs track "*.jpg"
git add .gitattributes
```

---

## 📁 Fichiers ajoutés dans ce push

### Documentation créée
- **DOCUMENTATION-AGENCE.md** (Guide principal)
- **ANALYSE-TECHNIQUE-SUPABASE.md** (Analyse technique)
- **CHECKLIST-AGENCE.md** (Checklist pratique)
- **push-to-git.bat** (Script automatique)
- **GUIDE-GIT-PUSH.md** (Ce guide)

### Contenu de la documentation
- Vue d'ensemble complète du projet MentalPlus
- Architecture Supabase détaillée
- Schéma de base de données (8+ tables)
- Politiques de sécurité RLS
- Estimation de complexité (44-64 heures)
- Checklist des accès à fournir
- Template d'email pour l'agence
- Guide de négociation et suivi

---

## 🎯 Prochaines étapes après le push

1. **Vérifier le repository** sur GitHub
2. **Partager le lien** avec l'agence: https://github.com/Bryan922/MentalPlus
3. **Fournir les accès** listés dans CHECKLIST-AGENCE.md
4. **Organiser une réunion** de cadrage
5. **Suivre le processus** décrit dans la documentation

---

*Guide créé pour faciliter le push vers GitHub*
*Repository: https://github.com/Bryan922/MentalPlus*
*Date: [DATE]*