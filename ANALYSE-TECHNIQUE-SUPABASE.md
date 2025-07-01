# Analyse Technique Détaillée - Intégration Supabase
## MentalPlus - Fichiers et fonctionnalités existantes

---

## 📁 Fichiers JavaScript Supabase identifiés

### 1. `js/supabase-config.js`
**Rôle :** Configuration principale de Supabase
**Contenu attendu :**
- URL du projet Supabase
- Clé API anonyme
- Initialisation du client Supabase

### 2. `js/supabase-auth.js`
**Rôle :** Gestion de l'authentification
**Fonctionnalités :**
- Connexion/déconnexion utilisateurs
- Inscription nouveaux utilisateurs
- Gestion des sessions
- Récupération des données utilisateur

### 3. `js/supabase-init.js`
**Rôle :** Initialisation et utilitaires
**Fonctionnalités :**
- Initialisation de l'application
- Vérification de l'état de connexion
- Redirection selon le rôle utilisateur

### 4. `js/auth-fix.js`
**Rôle :** Corrections et améliorations auth
**Fonctionnalités :**
- Gestion des erreurs d'authentification
- Validation des formulaires
- Amélioration UX authentification

### 5. `js/profile-supabase.js`
**Rôle :** Gestion des profils utilisateurs
**Fonctionnalités :**
- Affichage profil client/employé
- Modification des informations personnelles
- Upload d'avatar/photos
- Gestion des préférences

### 6. `js/rendez-vous-supabase.js`
**Rôle :** Système de rendez-vous
**Fonctionnalités :**
- Création de nouveaux RDV
- Affichage du calendrier
- Modification/annulation RDV
- Notifications RDV
- Gestion des créneaux disponibles

### 7. `js/messaging-supabase.js`
**Rôle :** Système de messagerie
**Fonctionnalités :**
- Envoi/réception messages
- Conversations en temps réel
- Notifications messages
- Historique des conversations

---

## 🔍 Analyse des fonctionnalités par page

### Page d'authentification (`auth.html`)
**Fichiers JS utilisés :**
- `supabase-config.js`
- `supabase-auth.js`
- `auth-fix.js`

**Fonctionnalités :**
- Formulaire de connexion
- Formulaire d'inscription
- Récupération mot de passe
- Validation côté client
- Redirection post-authentification

**Tables Supabase impliquées :**
- `auth.users` (table système Supabase)
- `clients` ou `employees` (selon le type d'utilisateur)

### Page profil (`profile.html`)
**Fichiers JS utilisés :**
- `supabase-config.js`
- `supabase-auth.js`
- `profile-supabase.js`

**Fonctionnalités :**
- Affichage informations personnelles
- Modification profil
- Changement mot de passe
- Gestion avatar
- Historique des consultations

**Tables Supabase impliquées :**
- `clients`
- `employees`
- `appointments` (historique)

### Page rendez-vous (`rendez-vous.html`)
**Fichiers JS utilisés :**
- `supabase-config.js`
- `supabase-auth.js`
- `rendez-vous-supabase.js`

**Fonctionnalités :**
- Calendrier interactif
- Sélection créneaux disponibles
- Choix du praticien
- Type de consultation
- Confirmation RDV
- Paiement en ligne (Stripe)

**Tables Supabase impliquées :**
- `appointments`
- `employees`
- `clients`
- `payments`

### Dashboard employé (`employee.html`)
**Fichiers JS utilisés :**
- `supabase-config.js`
- `supabase-auth.js`
- `profile-supabase.js`
- `rendez-vous-supabase.js`
- `messaging-supabase.js`

**Fonctionnalités :**
- Planning personnel
- Liste des patients
- Gestion des consultations
- Prise de notes
- Messagerie avec patients
- Statistiques personnelles

**Tables Supabase impliquées :**
- `employees`
- `appointments`
- `clients`
- `consultations`
- `consultation_notes`
- `messages`

### Page messagerie (`messaging.html`)
**Fichiers JS utilisés :**
- `supabase-config.js`
- `supabase-auth.js`
- `messaging-supabase.js`

**Fonctionnalités :**
- Interface de chat
- Liste des conversations
- Envoi de messages
- Notifications en temps réel
- Recherche dans l'historique

**Tables Supabase impliquées :**
- `messages`
- `clients`
- `employees`

---

## 🗄️ Schéma de base de données détaillé

### Tables principales identifiées

#### 1. Table `clients`
```sql
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telephone VARCHAR(20),
  date_naissance DATE,
  adresse TEXT,
  ville VARCHAR(100),
  code_postal VARCHAR(10),
  profession VARCHAR(100),
  situation_familiale VARCHAR(50),
  personne_contact_nom VARCHAR(100),
  personne_contact_tel VARCHAR(20),
  notes_medicales TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Table `employees`
```sql
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telephone VARCHAR(20),
  specialite VARCHAR(100),
  diplomes TEXT,
  experience_annees INTEGER,
  tarif_consultation DECIMAL(10,2),
  horaires_travail JSONB,
  jours_travail TEXT[], -- ['lundi', 'mardi', ...]
  bio TEXT,
  photo_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. Table `appointments`
```sql
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  date_rdv TIMESTAMP NOT NULL,
  duree INTEGER DEFAULT 60, -- en minutes
  type_consultation VARCHAR(50) NOT NULL,
  motif TEXT,
  statut VARCHAR(20) DEFAULT 'planifie', -- planifie, confirme, en_cours, termine, annule
  mode_consultation VARCHAR(20) DEFAULT 'presentiel', -- presentiel, visio, telephone
  tarif DECIMAL(10,2),
  notes_rdv TEXT,
  rappel_envoye BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. Table `consultations`
```sql
CREATE TABLE consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  date_consultation TIMESTAMP DEFAULT NOW(),
  duree_reelle INTEGER, -- durée réelle en minutes
  diagnostic TEXT,
  traitement_propose TEXT,
  medicaments TEXT,
  prochaine_consultation DATE,
  statut VARCHAR(20) DEFAULT 'en_cours', -- en_cours, termine
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. Table `consultation_notes`
```sql
CREATE TABLE consultation_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  type_note VARCHAR(50), -- observation, diagnostic, traitement, suivi
  contenu TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE, -- visible par le client ou non
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. Table `messages`
```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID,
  sender_id UUID NOT NULL, -- peut être client ou employee
  sender_type VARCHAR(20) NOT NULL, -- 'client' ou 'employee'
  receiver_id UUID NOT NULL,
  receiver_type VARCHAR(20) NOT NULL,
  subject VARCHAR(200),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- text, file, image
  file_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_urgent BOOLEAN DEFAULT FALSE,
  parent_message_id UUID REFERENCES messages(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. Table `payments`
```sql
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  montant DECIMAL(10,2) NOT NULL,
  devise VARCHAR(3) DEFAULT 'EUR',
  statut VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  methode_paiement VARCHAR(50), -- card, bank_transfer, cash
  date_paiement TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 8. Table `follow_ups`
```sql
CREATE TABLE follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES consultations(id),
  type_suivi VARCHAR(50), -- rappel, controle, urgence
  date_prevue DATE,
  statut VARCHAR(20) DEFAULT 'planifie', -- planifie, effectue, reporte, annule
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Politiques de sécurité RLS

### Politiques pour la table `clients`
```sql
-- Activation RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Les clients peuvent voir et modifier leurs propres données
CREATE POLICY "clients_own_data" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- Les employés peuvent voir les données de leurs clients
CREATE POLICY "employees_client_data" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e 
      WHERE e.user_id = auth.uid()
    )
  );
```

### Politiques pour la table `appointments`
```sql
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Les clients peuvent voir leurs propres RDV
CREATE POLICY "clients_own_appointments" ON appointments
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Les employés peuvent voir leurs RDV
CREATE POLICY "employees_own_appointments" ON appointments
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );
```

### Politiques pour la table `messages`
```sql
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les messages qu'ils ont envoyés ou reçus
CREATE POLICY "users_own_messages" ON messages
  FOR ALL USING (
    (sender_type = 'client' AND sender_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )) OR
    (sender_type = 'employee' AND sender_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )) OR
    (receiver_type = 'client' AND receiver_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )) OR
    (receiver_type = 'employee' AND receiver_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    ))
  );
```

---

## 🔧 Fonctions et triggers nécessaires

### Fonction de mise à jour automatique
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Application aux tables
CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at 
  BEFORE UPDATE ON employees 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON appointments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Fonction de notification en temps réel
```sql
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('new_message', json_build_object(
    'id', NEW.id,
    'sender_id', NEW.sender_id,
    'receiver_id', NEW.receiver_id,
    'content', NEW.content
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();
```

---

## 📊 Requêtes types identifiées

### Authentification
```javascript
// Connexion
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});

// Récupération profil utilisateur
const { data: profile } = await supabase
  .from('clients')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

### Gestion des rendez-vous
```javascript
// Créer un RDV
const { data, error } = await supabase
  .from('appointments')
  .insert({
    client_id: clientId,
    employee_id: employeeId,
    date_rdv: dateRdv,
    type_consultation: type,
    motif: motif
  });

// Récupérer les RDV d'un client
const { data: appointments } = await supabase
  .from('appointments')
  .select(`
    *,
    employees(nom, prenom, specialite),
    clients(nom, prenom)
  `)
  .eq('client_id', clientId)
  .order('date_rdv', { ascending: true });
```

### Messagerie
```javascript
// Envoyer un message
const { data, error } = await supabase
  .from('messages')
  .insert({
    sender_id: senderId,
    sender_type: 'client',
    receiver_id: receiverId,
    receiver_type: 'employee',
    content: message
  });

// Écouter les nouveaux messages
const subscription = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `receiver_id=eq.${userId}`
  }, (payload) => {
    // Traiter le nouveau message
  })
  .subscribe();
```

---

## ⚡ Points d'attention pour l'intégration

### Performance
1. **Index recommandés :**
   - `clients(user_id)`
   - `employees(user_id)`
   - `appointments(client_id, date_rdv)`
   - `appointments(employee_id, date_rdv)`
   - `messages(receiver_id, created_at)`

2. **Optimisations :**
   - Pagination pour les listes longues
   - Cache pour les données statiques
   - Compression des images

### Sécurité
1. **Validation côté serveur :**
   - Validation des données avant insertion
   - Sanitisation des entrées utilisateur
   - Limitation des requêtes (rate limiting)

2. **Gestion des erreurs :**
   - Logs détaillés côté serveur
   - Messages d'erreur utilisateur friendly
   - Fallback en cas d'échec

### Monitoring
1. **Métriques à surveiller :**
   - Temps de réponse des requêtes
   - Nombre de connexions simultanées
   - Erreurs d'authentification
   - Volume de messages échangés

---

*Document technique généré pour l'analyse Supabase*
*Version : 1.0*
*Date : [DATE]*