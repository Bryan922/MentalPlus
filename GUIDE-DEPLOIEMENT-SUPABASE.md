# 🚀 Guide de Déploiement Supabase - MentalSerenity

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :
- ✅ Un compte Supabase (gratuit sur [supabase.com](https://supabase.com))
- ✅ Un projet Supabase créé
- ✅ Les clés d'API de votre projet

## 🔧 Étape 1 : Configuration du Projet Supabase

### 1.1 Créer un Projet Supabase

1. **Aller sur [supabase.com](https://supabase.com)**
2. **Se connecter** avec votre compte
3. **Cliquer sur "New Project"**
4. **Remplir les informations :**
   - **Organization** : Votre organisation
   - **Name** : `mentalserenity`
   - **Database Password** : Créer un mot de passe fort
   - **Region** : Choisir la région la plus proche (ex: West Europe)
5. **Cliquer sur "Create new project"**

### 1.2 Récupérer les Clés d'API

1. **Dans votre projet Supabase, aller dans Settings > API**
2. **Noter les informations suivantes :**
   - **Project URL** : `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🗄️ Étape 2 : Déployer le Schéma de Base de Données

### 2.1 Accéder à l'Éditeur SQL

1. **Dans votre projet Supabase, aller dans SQL Editor**
2. **Cliquer sur "New query"**

### 2.2 Exécuter le Schéma Complet

1. **Copier le contenu du fichier `database-schema-supabase.sql`**
2. **Coller dans l'éditeur SQL**
3. **Cliquer sur "Run"**

### 2.3 Vérifier le Déploiement

Après l'exécution, vous devriez voir :
- ✅ 15 tables créées
- ✅ Index créés
- ✅ Triggers créés
- ✅ Données de base insérées

## ⚙️ Étape 3 : Configurer les Variables d'Environnement

### 3.1 Mettre à Jour la Configuration JavaScript

**Éditer le fichier `js/supabase-config.js` :**

```javascript
// Remplacez ces valeurs par vos vraies clés Supabase
const SUPABASE_URL = 'https://VOTRE_PROJECT_ID.supabase.co'
const SUPABASE_ANON_KEY = 'VOTRE_CLE_ANON_PUBLIC'
```

### 3.2 Configuration pour le Déploiement

**Si vous déployez sur OVH ou autre serveur :**

1. **Créer un fichier `.env` (si supporté) :**
```env
SUPABASE_URL=https://VOTRE_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=VOTRE_CLE_ANON_PUBLIC
STRIPE_PUBLISHABLE_KEY=VOTRE_CLE_STRIPE
```

2. **Ou modifier directement dans `js/supabase-config.js` :**
```javascript
const SUPABASE_URL = 'https://VOTRE_PROJECT_ID.supabase.co'
const SUPABASE_ANON_KEY = 'VOTRE_CLE_ANON_PUBLIC'
```

## 🔐 Étape 4 : Configuration de l'Authentification

### 4.1 Configurer l'Auth dans Supabase

1. **Aller dans Authentication > Settings**
2. **Configurer les URLs autorisées :**
   - **Site URL** : `https://votre-domaine.com`
   - **Redirect URLs** : 
     - `https://votre-domaine.com/auth.html`
     - `https://votre-domaine.com/espace-client.html`
     - `https://votre-domaine.com/espace-employe.html`

### 4.2 Activer les Méthodes d'Authentification

1. **Dans Authentication > Providers**
2. **Activer Email :**
   - ✅ Enable email confirmations
   - ✅ Enable secure email change
3. **Configurer les templates d'email si nécessaire**

## 🛡️ Étape 5 : Configuration de la Sécurité (RLS)

### 5.1 Activer Row Level Security

Le RLS est déjà activé dans le schéma. Vérifiez dans **Authentication > Policies** :

1. **Table `clients` :**
   - Les clients peuvent voir/modifier leurs propres données
   - Les employés peuvent voir tous les clients

2. **Table `appointments` :**
   - Les clients peuvent voir leurs propres rendez-vous
   - Les employés peuvent voir tous les rendez-vous

3. **Table `payments` :**
   - Les clients peuvent voir leurs propres paiements
   - Les employés peuvent voir tous les paiements

## 🧪 Étape 6 : Tests de Validation

### 6.1 Test de Connexion

1. **Ouvrir `test-systeme-complet.html`**
2. **Cliquer sur "Tester la Connexion"**
3. **Vérifier que la connexion réussit**

### 6.2 Test des Fonctionnalités

1. **Lancer tous les tests :**
   - Test d'authentification
   - Test des opérations CRUD
   - Test des rendez-vous
   - Test des paiements

### 6.3 Test Manuel

1. **Créer un compte client :**
   - Aller sur `auth.html`
   - Créer un compte
   - Vérifier la redirection vers l'espace client

2. **Prendre un rendez-vous :**
   - Aller sur `rendez-vous.html`
   - Suivre le processus complet
   - Vérifier la création en base

## 📊 Étape 7 : Configuration des Statistiques

### 7.1 Vérifier les Données de Base

Dans **Table Editor**, vérifier que les tables contiennent :

1. **Table `pricing` :**
   - Consultation classique : 60€
   - Consultation de nuit : 80€
   - Consultation d'urgence : 100€

2. **Table `employees` :**
   - Au moins un employé de test

### 7.2 Configurer les Disponibilités

1. **Aller dans Table Editor > `availabilities`**
2. **Ajouter les disponibilités des employés :**
```sql
INSERT INTO availabilities (employee_id, jour_semaine, heure_debut, heure_fin, type_consultation)
VALUES 
('EMPLOYEE_ID', 1, '09:00', '18:00', 'classique'),
('EMPLOYEE_ID', 2, '09:00', '18:00', 'classique'),
('EMPLOYEE_ID', 3, '09:00', '18:00', 'classique'),
('EMPLOYEE_ID', 4, '09:00', '18:00', 'classique'),
('EMPLOYEE_ID', 5, '09:00', '18:00', 'classique');
```

## 🚀 Étape 8 : Déploiement en Production

### 8.1 Préparer les Fichiers

1. **Vérifier que tous les fichiers sont à jour :**
   - `js/supabase-config.js` avec les bonnes clés
   - `js/unified-*.js` (tous les gestionnaires)
   - Pages HTML mises à jour

2. **Tester localement :**
   - Ouvrir `test-systeme-complet.html`
   - Lancer tous les tests
   - Vérifier que tout fonctionne

### 8.2 Déployer sur le Serveur

1. **Uploader tous les fichiers sur votre serveur**
2. **Vérifier les permissions des fichiers**
3. **Tester l'accès aux pages**

### 8.3 Configuration Finale

1. **Mettre à jour les URLs dans Supabase :**
   - Site URL : `https://votre-domaine.com`
   - Redirect URLs : Toutes vos pages d'authentification

2. **Tester en production :**
   - Créer un compte
   - Prendre un rendez-vous
   - Vérifier l'espace employé

## 🔍 Étape 9 : Monitoring et Maintenance

### 9.1 Surveiller les Logs

1. **Dans Supabase > Logs :**
   - Vérifier les erreurs d'authentification
   - Surveiller les requêtes lentes
   - Contrôler l'utilisation

### 9.2 Sauvegardes

1. **Configurer les sauvegardes automatiques :**
   - Supabase fait des sauvegardes automatiques
   - Vérifier dans Settings > Database

### 9.3 Performance

1. **Surveiller les métriques :**
   - Temps de réponse des requêtes
   - Utilisation de la base de données
   - Limites de l'API

## 🆘 Dépannage

### Problèmes Courants

1. **Erreur de connexion :**
   - Vérifier les clés Supabase
   - Vérifier l'URL du projet
   - Contrôler les permissions RLS

2. **Erreur d'authentification :**
   - Vérifier les URLs de redirection
   - Contrôler la configuration Auth
   - Vérifier les templates d'email

3. **Erreur de base de données :**
   - Vérifier que le schéma est déployé
   - Contrôler les permissions des tables
   - Vérifier les contraintes

### Support

- **Documentation Supabase :** [supabase.com/docs](https://supabase.com/docs)
- **Support MentalSerenity :** mentalplussos@gmail.com
- **Logs d'erreurs :** Supabase > Logs

## ✅ Checklist de Validation

- [ ] Projet Supabase créé
- [ ] Clés d'API récupérées
- [ ] Schéma de base de données déployé
- [ ] Configuration JavaScript mise à jour
- [ ] Authentification configurée
- [ ] RLS activé et configuré
- [ ] Tests de connexion réussis
- [ ] Tests fonctionnels OK
- [ ] Déploiement en production
- [ ] Tests en production OK
- [ ] Monitoring configuré

---

**🎉 Félicitations ! Votre système MentalSerenity est maintenant opérationnel !**

**Date de création :** $(date)
**Version :** 1.0
**Statut :** ✅ Prêt pour production 