# Documentation Technique - MentalPlus
## Guide d'intégration Supabase pour l'agence

---

## 📋 Vue d'ensemble du projet

**Nom du projet :** MentalPlus (Mental Serenity)
**Type :** Plateforme de prise de rendez-vous psychologiques
**Technologies :** HTML5, CSS3, JavaScript (ES6+), Supabase, Stripe

### Fonctionnalités principales
- Système d'authentification utilisateurs
- Prise de rendez-vous en ligne
- Gestion des profils clients et employés
- Système de paiement Stripe
- Messagerie interne
- Dashboard administrateur
- Gestion des consultations et notes

---

## 🗂️ Structure du projet

```
MENTALPLUS/
├── index.html                 # Page d'accueil
├── auth.html                  # Authentification
├── profile.html               # Profil utilisateur
├── rendez-vous.html          # Prise de RDV
├── employee.html             # Dashboard employé
├── admin.html                # Administration
├── payment.html              # Paiements
├── messaging.html            # Messagerie
├── css/                      # Styles CSS
├── js/                       # Scripts JavaScript
│   ├── supabase-config.js    # Configuration Supabase
│   ├── supabase-auth.js      # Authentification
│   ├── supabase-init.js      # Initialisation
│   ├── auth-fix.js           # Gestion auth
│   ├── profile-supabase.js   # Profils
│   ├── rendez-vous-supabase.js # RDV
│   ├── messaging-supabase.js # Messages
│   └── ...
├── api/                      # API PHP (legacy)
└── config/                   # Configuration
```

---

## 🔧 Configuration Supabase actuelle

### Fichiers de configuration principaux

1. **`js/supabase-config.js`** - Configuration principale
2. **`js/supabase-auth.js`** - Gestion authentification
3. **`js/supabase-init.js`** - Initialisation

### Variables d'environnement requises

```javascript
// Configuration Supabase (à fournir)
const SUPABASE_URL = 'https://votre-projet.supabase.co'
const SUPABASE_ANON_KEY = 'votre-clé-anonyme'
```

### Tables Supabase identifiées dans le code

- `clients` - Données clients
- `employees` - Données employés
- `appointments` - Rendez-vous
- `messages` - Messagerie
- `consultations` - Consultations
- `consultation_notes` - Notes de consultation
- `follow_ups` - Suivis
- `payments` - Paiements

---

## 📊 Schéma de base de données requis

### Table `clients`
```sql
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  nom VARCHAR(100),
  prenom VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  telephone VARCHAR(20),
  date_naissance DATE,
  adresse TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table `employees`
```sql
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  nom VARCHAR(100),
  prenom VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  specialite VARCHAR(100),
  telephone VARCHAR(20),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table `appointments`
```sql
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  employee_id UUID REFERENCES employees(id),
  date_rdv TIMESTAMP,
  duree INTEGER DEFAULT 60,
  type_consultation VARCHAR(50),
  statut VARCHAR(20) DEFAULT 'planifie',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table `messages`
```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID,
  receiver_id UUID,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Sécurité et authentification

### Row Level Security (RLS)
Le projet utilise RLS pour sécuriser les données :

```sql
-- Exemple pour la table clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON clients
  FOR UPDATE USING (auth.uid() = user_id);
```

### Rôles utilisateurs
- **Client** : Accès limité à ses propres données
- **Employé** : Accès aux données clients assignés
- **Admin** : Accès complet

---

## 🚀 Étapes d'intégration recommandées

### Phase 1 : Analyse et audit
1. **Audit du code existant**
   - Analyser les fichiers `js/supabase-*.js`
   - Identifier les requêtes et fonctions utilisées
   - Mapper les flux de données

2. **Analyse des besoins**
   - Définir le schéma de base de données complet
   - Identifier les politiques RLS nécessaires
   - Planifier la migration des données existantes

### Phase 2 : Configuration Supabase
1. **Création du projet Supabase**
   - Nouveau projet ou utilisation de l'existant
   - Configuration des variables d'environnement
   - Mise en place de l'authentification

2. **Création des tables**
   - Implémentation du schéma de base
   - Configuration des relations
   - Mise en place des triggers et fonctions

3. **Sécurité**
   - Configuration RLS
   - Définition des politiques d'accès
   - Tests de sécurité

### Phase 3 : Intégration et tests
1. **Connexion du frontend**
   - Configuration des clés API
   - Tests des fonctionnalités existantes
   - Débogage et optimisation

2. **Tests complets**
   - Tests d'authentification
   - Tests des CRUD operations
   - Tests de performance
   - Tests de sécurité

### Phase 4 : Déploiement
1. **Préparation production**
   - Configuration environnement de production
   - Optimisation des requêtes
   - Monitoring et logs

2. **Migration des données**
   - Sauvegarde des données existantes
   - Migration vers Supabase
   - Validation de l'intégrité

---

## 📋 Informations à fournir à l'agence

### Accès requis

1. **Accès Supabase**
   - URL du projet Supabase
   - Clés API (anon et service_role)
   - Accès au dashboard Supabase
   - Documentation des tables existantes

2. **Accès au code**
   - Repository Git (GitHub/GitLab)
   - Droits de lecture/écriture
   - Documentation technique existante

3. **Environnements**
   - Accès environnement de développement
   - Accès environnement de test
   - Configuration serveur de production

### Informations techniques

1. **Credentials Supabase**
```
URL: https://xfippugvmgnsmxssptmm.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaXBwdWd2bWduc214c3NwdG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDU5MTEsImV4cCI6MjA2NjI4MTkxMX0.xatYodv3YgmjH2wy9ixlB9f22a63q86rbiIDFsfY010
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaXBwdWd2bWduc214c3NwdG1tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDcwNTkxMSwiZXhwIjoyMDY2MjgxOTExfQ.sG7IqWQDUhAfHrycZbzzt0ZiAP8grEE_W6q757yjpM4
```

2. **Repository Git**
```
URL: https://github.com/Bryan922/MentalPlus
Branche principale: main/master
Collaborators: username, full name, or email À FOURNIR
```

3. **Autres services**
```
Stripe (paiements):
- Clé publique: [À FOURNIR]
- Clé secrète: [À FOURNIR - SENSIBLE]

Domaine de production: [À FOURNIR]
```

---

## 💰 Estimation des tâches

### Complexité identifiée

**Niveau de complexité : MOYEN à ÉLEVÉ**

Facteurs de complexité :
- Multiple fichiers JavaScript avec logique Supabase
- Système d'authentification multi-rôles
- Intégration paiements Stripe
- Gestion des rendez-vous avec calendrier
- Système de messagerie
- Dashboard administrateur complet
```