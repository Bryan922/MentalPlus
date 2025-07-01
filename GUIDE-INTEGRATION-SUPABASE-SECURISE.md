# Guide d'Intégration Supabase Sécurisé - MentalPlus
## Connexion complète et sécurisée avec authentification et gestion des rôles

---

## 🎯 Vue d'ensemble de l'architecture

### Fonctionnalités principales
- **Authentification sécurisée** (email/password via Supabase Auth)
- **Gestion des rôles** (clients et employés avec séparation stricte)
- **Prise de rendez-vous** par les clients
- **Visualisation des RDV** (clients : leurs RDV, employés : tous les RDV)
- **Sécurité renforcée** avec Row Level Security (RLS)
- **Validation complète** des données et gestion d'erreurs

---

## 🗄️ Schéma de base de données complet

### 1. Configuration initiale

```sql
-- Activation des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Création du schéma public si nécessaire
-- (Supabase utilise le schéma public par défaut)
```

### 2. Table des profils utilisateurs

```sql
-- Table principale des profils (liée à auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  telephone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'employee', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes de validation
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (telephone IS NULL OR telephone ~* '^[+]?[0-9\s\-\(\)]{8,20}$'),
  CONSTRAINT valid_names CHECK (LENGTH(nom) >= 2 AND LENGTH(prenom) >= 2)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_active ON public.profiles(is_active);
```

### 3. Table des informations clients étendues

```sql
-- Informations supplémentaires pour les clients
CREATE TABLE public.clients_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  date_naissance DATE,
  adresse TEXT,
  ville VARCHAR(100),
  code_postal VARCHAR(10),
  profession VARCHAR(100),
  situation_familiale VARCHAR(50),
  personne_contact_nom VARCHAR(100),
  personne_contact_tel VARCHAR(20),
  notes_medicales TEXT,
  preferences_rdv JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT valid_birthdate CHECK (date_naissance IS NULL OR date_naissance <= CURRENT_DATE - INTERVAL '16 years'),
  CONSTRAINT valid_postal_code CHECK (code_postal IS NULL OR code_postal ~* '^[0-9]{5}$')
);

-- Index
CREATE INDEX idx_clients_info_profile ON public.clients_info(profile_id);
```

### 4. Table des informations employés

```sql
-- Informations supplémentaires pour les employés
CREATE TABLE public.employees_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  specialite VARCHAR(100) NOT NULL,
  diplomes TEXT,
  numero_ordre VARCHAR(50),
  experience_annees INTEGER DEFAULT 0,
  tarif_consultation DECIMAL(10,2),
  horaires_travail JSONB DEFAULT '{}',
  jours_travail TEXT[] DEFAULT ARRAY['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
  bio TEXT,
  langues_parlees TEXT[] DEFAULT ARRAY['français'],
  is_accepting_patients BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT valid_experience CHECK (experience_annees >= 0 AND experience_annees <= 50),
  CONSTRAINT valid_tarif CHECK (tarif_consultation IS NULL OR tarif_consultation > 0)
);

-- Index
CREATE INDEX idx_employees_info_profile ON public.employees_info(profile_id);
CREATE INDEX idx_employees_specialite ON public.employees_info(specialite);
CREATE INDEX idx_employees_accepting ON public.employees_info(is_accepting_patients);
```

### 5. Table des rendez-vous

```sql
-- Table principale des rendez-vous
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_rdv TIMESTAMP WITH TIME ZONE NOT NULL,
  duree INTEGER DEFAULT 60, -- en minutes
  type_consultation VARCHAR(50) NOT NULL,
  motif TEXT,
  statut VARCHAR(20) DEFAULT 'planifie' CHECK (statut IN ('planifie', 'confirme', 'en_cours', 'termine', 'annule', 'reporte')),
  mode_consultation VARCHAR(20) DEFAULT 'presentiel' CHECK (mode_consultation IN ('presentiel', 'visio', 'telephone')),
  tarif DECIMAL(10,2),
  notes_rdv TEXT,
  rappel_envoye BOOLEAN DEFAULT FALSE,
  annulation_raison TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes de validation
  CONSTRAINT valid_duration CHECK (duree > 0 AND duree <= 480), -- max 8h
  CONSTRAINT valid_future_date CHECK (date_rdv > NOW()),
  CONSTRAINT valid_tarif_rdv CHECK (tarif IS NULL OR tarif > 0),
  CONSTRAINT different_users CHECK (client_id != employee_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_appointments_client ON public.appointments(client_id, date_rdv);
CREATE INDEX idx_appointments_employee ON public.appointments(employee_id, date_rdv);
CREATE INDEX idx_appointments_date ON public.appointments(date_rdv);
CREATE INDEX idx_appointments_statut ON public.appointments(statut);
```

### 6. Table des créneaux de disponibilité

```sql
-- Gestion des créneaux de disponibilité des employés
CREATE TABLE public.availability_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  jour_semaine INTEGER CHECK (jour_semaine BETWEEN 1 AND 7), -- 1=lundi, 7=dimanche
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT valid_time_range CHECK (heure_fin > heure_debut),
  CONSTRAINT unique_employee_slot UNIQUE (employee_id, jour_semaine, heure_debut)
);

-- Index
CREATE INDEX idx_availability_employee ON public.availability_slots(employee_id, jour_semaine);
```

### 7. Fonctions et triggers

```sql
-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Application des triggers
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_info_updated_at 
  BEFORE UPDATE ON public.clients_info 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_info_updated_at 
  BEFORE UPDATE ON public.employees_info 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON public.appointments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', 'Nom'),
    COALESCE(NEW.raw_user_meta_data->>'prenom', 'Prénom'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger pour créer automatiquement le profil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 🔐 Politiques de sécurité RLS (Row Level Security)

### 1. Activation RLS sur toutes les tables

```sql
-- Activation RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
```

### 2. Politiques pour la table profiles

```sql
-- Les utilisateurs peuvent voir et modifier leur propre profil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Les employés peuvent voir les profils des clients (pour les RDV)
CREATE POLICY "Employees can view client profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles emp 
      WHERE emp.id = auth.uid() 
      AND emp.role IN ('employee', 'admin')
    )
    AND role = 'client'
  );

-- Les employés peuvent voir les autres employés
CREATE POLICY "Employees can view other employees" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles emp 
      WHERE emp.id = auth.uid() 
      AND emp.role IN ('employee', 'admin')
    )
    AND role IN ('employee', 'admin')
  );

-- Insertion lors de la création de compte
CREATE POLICY "Enable insert for authenticated users" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 3. Politiques pour clients_info

```sql
-- Les clients peuvent voir et modifier leurs propres informations
CREATE POLICY "Clients can manage own info" ON public.clients_info
  FOR ALL USING (profile_id = auth.uid());

-- Les employés peuvent voir les informations des clients
CREATE POLICY "Employees can view client info" ON public.clients_info
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('employee', 'admin')
    )
  );
```

### 4. Politiques pour employees_info

```sql
-- Les employés peuvent voir et modifier leurs propres informations
CREATE POLICY "Employees can manage own info" ON public.employees_info
  FOR ALL USING (profile_id = auth.uid());

-- Les clients peuvent voir les informations des employés (pour choisir)
CREATE POLICY "Clients can view employee info" ON public.employees_info
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'client'
    )
  );

-- Les employés peuvent voir les autres employés
CREATE POLICY "Employees can view other employees info" ON public.employees_info
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('employee', 'admin')
    )
  );
```

### 5. Politiques pour appointments (CRITIQUES)

```sql
-- Les clients peuvent voir leurs propres rendez-vous
CREATE POLICY "Clients can view own appointments" ON public.appointments
  FOR SELECT USING (client_id = auth.uid());

-- Les clients peuvent créer des rendez-vous pour eux-mêmes
CREATE POLICY "Clients can create own appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    client_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'client'
    )
  );

-- Les clients peuvent modifier leurs rendez-vous (si pas encore confirmés)
CREATE POLICY "Clients can update own appointments" ON public.appointments
  FOR UPDATE USING (
    client_id = auth.uid() 
    AND statut IN ('planifie', 'confirme')
  );

-- Les employés peuvent voir tous les rendez-vous
CREATE POLICY "Employees can view all appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('employee', 'admin')
    )
  );

-- Les employés peuvent modifier les rendez-vous qui les concernent
CREATE POLICY "Employees can update their appointments" ON public.appointments
  FOR UPDATE USING (
    employee_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('employee', 'admin')
    )
  );
```

### 6. Politiques pour availability_slots

```sql
-- Les employés peuvent gérer leurs créneaux
CREATE POLICY "Employees can manage own slots" ON public.availability_slots
  FOR ALL USING (employee_id = auth.uid());

-- Les clients peuvent voir les créneaux disponibles
CREATE POLICY "Clients can view availability" ON public.availability_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'client'
    )
    AND is_active = true
  );
```

---

## 🔧 Configuration Supabase côté client

### 1. Configuration initiale

```javascript
// js/supabase-config.js
/**
 * Configuration sécurisée de Supabase
 * IMPORTANT: Ne jamais exposer la clé service_role côté client
 */

// Configuration Supabase
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'votre-clé-anonyme-publique';

// Initialisation du client Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // Plus sécurisé
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Validation de la configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Configuration Supabase manquante');
}

// Export pour utilisation dans d'autres fichiers
window.supabaseClient = supabase;

console.log('✅ Supabase configuré avec succès');
```

### 2. Utilitaires de validation

```javascript
// js/validation-utils.js
/**
 * Utilitaires de validation sécurisée
 */

class ValidationUtils {
  /**
   * Valide une adresse email
   * @param {string} email 
   * @returns {boolean}
   */
  static isValidEmail(email) {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Valide un mot de passe sécurisé
   * @param {string} password 
   * @returns {object}
   */
  static validatePassword(password) {
    const result = {
      isValid: true,
      errors: []
    };

    if (password.length < 8) {
      result.errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      result.errors.push('Le mot de passe doit contenir au moins une majuscule');
    }
    if (!/[a-z]/.test(password)) {
      result.errors.push('Le mot de passe doit contenir au moins une minuscule');
    }
    if (!/[0-9]/.test(password)) {
      result.errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Valide un numéro de téléphone
   * @param {string} phone 
   * @returns {boolean}
   */
  static isValidPhone(phone) {
    if (!phone) return true; // Optionnel
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{8,20}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Sanitise une chaîne de caractères
   * @param {string} input 
   * @returns {string}
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>"'&]/g, '');
  }

  /**
   * Valide une date de rendez-vous
   * @param {string} dateString 
   * @returns {object}
   */
  static validateAppointmentDate(dateString) {
    const result = { isValid: true, errors: [] };
    const date = new Date(dateString);
    const now = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);

    if (isNaN(date.getTime())) {
      result.errors.push('Date invalide');
    } else if (date <= now) {
      result.errors.push('La date doit être dans le futur');
    } else if (date > maxDate) {
      result.errors.push('La date ne peut pas être à plus d\'un an');
    }

    result.isValid = result.errors.length === 0;
    return result;
  }
}

// Export
window.ValidationUtils = ValidationUtils;
```

---

## 🔐 Gestion de l'authentification sécurisée

### 1. Service d'authentification

```javascript
// js/auth-service.js
/**
 * Service d'authentification sécurisé avec Supabase
 */

class AuthService {
  constructor() {
    this.supabase = window.supabaseClient;
    this.currentUser = null;
    this.userProfile = null;
    
    // Écouter les changements d'état d'authentification
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.handleAuthStateChange(event, session);
    });
  }

  /**
   * Gestion des changements d'état d'authentification
   * @param {string} event 
   * @param {object} session 
   */
  async handleAuthStateChange(event, session) {
    console.log('🔐 Auth state changed:', event);
    
    if (event === 'SIGNED_IN' && session) {
      this.currentUser = session.user;
      await this.loadUserProfile();
      this.redirectAfterLogin();
    } else if (event === 'SIGNED_OUT') {
      this.currentUser = null;
      this.userProfile = null;
      this.redirectToLogin();
    }
  }

  /**
   * Inscription sécurisée
   * @param {object} userData 
   * @returns {object}
   */
  async signUp(userData) {
    try {
      // Validation des données
      const validation = this.validateSignUpData(userData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Sanitisation des données
      const sanitizedData = {
        email: userData.email.toLowerCase().trim(),
        password: userData.password,
        nom: ValidationUtils.sanitizeString(userData.nom),
        prenom: ValidationUtils.sanitizeString(userData.prenom),
        telephone: userData.telephone ? ValidationUtils.sanitizeString(userData.telephone) : null,
        role: userData.role || 'client'
      };

      // Inscription avec Supabase
      const { data, error } = await this.supabase.auth.signUp({
        email: sanitizedData.email,
        password: sanitizedData.password,
        options: {
          data: {
            nom: sanitizedData.nom,
            prenom: sanitizedData.prenom,
            telephone: sanitizedData.telephone,
            role: sanitizedData.role
          }
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Inscription réussie:', data.user?.email);
      
      return {
        success: true,
        message: 'Inscription réussie. Vérifiez votre email pour confirmer votre compte.',
        user: data.user
      };

    } catch (error) {
      console.error('❌ Erreur inscription:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error
      };
    }
  }

  /**
   * Connexion sécurisée
   * @param {string} email 
   * @param {string} password 
   * @returns {object}
   */
  async signIn(email, password) {
    try {
      // Validation
      if (!ValidationUtils.isValidEmail(email)) {
        throw new Error('Email invalide');
      }
      if (!password || password.length < 6) {
        throw new Error('Mot de passe requis');
      }

      // Connexion
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });

      if (error) {
        throw error;
      }

      console.log('✅ Connexion réussie:', data.user?.email);
      
      return {
        success: true,
        message: 'Connexion réussie',
        user: data.user
      };

    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error
      };
    }
  }

  /**
   * Déconnexion
   * @returns {object}
   */
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      console.log('✅ Déconnexion réussie');
      
      return {
        success: true,
        message: 'Déconnexion réussie'
      };

    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error
      };
    }
  }

  /**
   * Chargement du profil utilisateur
   */
  async loadUserProfile() {
    try {
      if (!this.currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select(`
          *,
          clients_info(*),
          employees_info(*)
        `)
        .eq('id', this.currentUser.id)
        .single();

      if (error) {
        throw error;
      }

      this.userProfile = data;
      console.log('✅ Profil chargé:', data.role);
      
      return data;

    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
      throw error;
    }
  }

  /**
   * Validation des données d'inscription
   * @param {object} userData 
   * @returns {object}
   */
  validateSignUpData(userData) {
    const errors = [];

    if (!ValidationUtils.isValidEmail(userData.email)) {
      errors.push('Email invalide');
    }

    const passwordValidation = ValidationUtils.validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    if (!userData.nom || userData.nom.length < 2) {
      errors.push('Nom requis (minimum 2 caractères)');
    }

    if (!userData.prenom || userData.prenom.length < 2) {
      errors.push('Prénom requis (minimum 2 caractères)');
    }

    if (userData.telephone && !ValidationUtils.isValidPhone(userData.telephone)) {
      errors.push('Numéro de téléphone invalide');
    }

    if (userData.role && !['client', 'employee'].includes(userData.role)) {
      errors.push('Rôle invalide');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Redirection après connexion selon le rôle
   */
  redirectAfterLogin() {
    if (!this.userProfile) return;

    const role = this.userProfile.role;
    const currentPage = window.location.pathname;

    // Éviter les redirections en boucle
    if (currentPage.includes('auth.html') || currentPage.includes('login.html')) {
      switch (role) {
        case 'client':
          window.location.href = 'profile.html';
          break;
        case 'employee':
        case 'admin':
          window.location.href = 'employee.html';
          break;
        default:
          window.location.href = 'index.html';
      }
    }
  }

  /**
   * Redirection vers la page de connexion
   */
  redirectToLogin() {
    const currentPage = window.location.pathname;
    const publicPages = ['index.html', 'auth.html', 'login.html', 'contact.html'];
    
    if (!publicPages.some(page => currentPage.includes(page))) {
      window.location.href = 'auth.html';
    }
  }

  /**
   * Vérification des permissions
   * @param {string} requiredRole 
   * @returns {boolean}
   */
  hasPermission(requiredRole) {
    if (!this.userProfile) return false;
    
    const userRole = this.userProfile.role;
    
    switch (requiredRole) {
      case 'client':
        return ['client', 'employee', 'admin'].includes(userRole);
      case 'employee':
        return ['employee', 'admin'].includes(userRole);
      case 'admin':
        return userRole === 'admin';
      default:
        return false;
    }
  }

  /**
   * Obtenir un message d'erreur convivial
   * @param {object} error 
   * @returns {string}
   */
  getErrorMessage(error) {
    const errorMessages = {
      'Invalid login credentials': 'Email ou mot de passe incorrect',
      'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter',
      'User already registered': 'Un compte existe déjà avec cet email',
      'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
      'Invalid email': 'Format d\'email invalide',
      'Network error': 'Erreur de connexion. Vérifiez votre connexion internet.'
    };

    return errorMessages[error.message] || error.message || 'Une erreur inattendue s\'est produite';
  }

  /**
   * Obtenir l'utilisateur actuel
   * @returns {object|null}
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Obtenir le profil utilisateur actuel
   * @returns {object|null}
   */
  getUserProfile() {
    return this.userProfile;
  }

  /**
   * Vérifier si l'utilisateur est connecté
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.currentUser;
  }
}

// Initialisation du service d'authentification
window.authService = new AuthService();

console.log('✅ Service d\'authentification initialisé');
```

---

## 📅 Gestion des rendez-vous sécurisée

### 1. Service de gestion des rendez-vous

```javascript
// js/appointments-service.js
/**
 * Service de gestion des rendez-vous avec sécurité renforcée
 */

class AppointmentsService {
  constructor() {
    this.supabase = window.supabaseClient;
    this.authService = window.authService;
  }

  /**
   * Créer un nouveau rendez-vous (clients uniquement)
   * @param {object} appointmentData 
   * @returns {object}
   */
  async createAppointment(appointmentData) {
    try {
      // Vérification de l'authentification
      if (!this.authService.isAuthenticated()) {
        throw new Error('Vous devez être connecté pour prendre un rendez-vous');
      }

      // Vérification du rôle client
      if (!this.authService.hasPermission('client')) {
        throw new Error('Seuls les clients peuvent prendre des rendez-vous');
      }

      // Validation des données
      const validation = this.validateAppointmentData(appointmentData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Vérification de la disponibilité
      const isAvailable = await this.checkAvailability(
        appointmentData.employee_id,
        appointmentData.date_rdv,
        appointmentData.duree
      );

      if (!isAvailable) {
        throw new Error('Ce créneau n\'est pas disponible');
      }

      // Sanitisation des données
      const sanitizedData = {
        client_id: this.authService.getCurrentUser().id,
        employee_id: appointmentData.employee_id,
        date_rdv: new Date(appointmentData.date_rdv).toISOString(),
        duree: parseInt(appointmentData.duree) || 60,
        type_consultation: ValidationUtils.sanitizeString(appointmentData.type_consultation),
        motif: appointmentData.motif ? ValidationUtils.sanitizeString(appointmentData.motif) : null,
        mode_consultation: appointmentData.mode_consultation || 'presentiel',
        statut: 'planifie'
      };

      // Insertion en base
      const { data, error } = await this.supabase
        .from('appointments')
        .insert([sanitizedData])
        .select(`
          *,
          client:profiles!appointments_client_id_fkey(nom, prenom, email),
          employee:profiles!appointments_employee_id_fkey(nom, prenom)
        `)
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Rendez-vous créé:', data.id);

      // Notification (optionnel)
      await this.sendAppointmentNotification(data, 'created');

      return {
        success: true,
        message: 'Rendez-vous créé avec succès',
        appointment: data
      };

    } catch (error) {
      console.error('❌ Erreur création RDV:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error
      };
    }
  }

  /**
   * Récupérer les rendez-vous selon le rôle
   * @param {object} filters 
   * @returns {object}
   */
  async getAppointments(filters = {}) {
    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('Authentification requise');
      }

      const userProfile = this.authService.getUserProfile();
      let query = this.supabase
        .from('appointments')
        .select(`
          *,
          client:profiles!appointments_client_id_fkey(id, nom, prenom, email, telephone),
          employee:profiles!appointments_employee_id_fkey(id, nom, prenom, email),
          employee_info:employees_info!inner(specialite, tarif_consultation)
        `);

      // Filtrage selon le rôle
      if (userProfile.role === 'client') {
        // Les clients ne voient que leurs propres RDV
        query = query.eq('client_id', userProfile.id);
      } else if (userProfile.role === 'employee') {
        // Les employés voient tous les RDV (grâce aux policies RLS)
        // Optionnel: filtrer par employé spécifique
        if (filters.employee_only) {
          query = query.eq('employee_id', userProfile.id);
        }
      }
      // Les admins voient tout (grâce aux policies RLS)

      // Filtres additionnels
      if (filters.statut) {
        query = query.eq('statut', filters.statut);
      }

      if (filters.date_debut) {
        query = query.gte('date_rdv', filters.date_debut);
      }

      if (filters.date_fin) {
        query = query.lte('date_rdv', filters.date_fin);
      }

      // Tri par date
      query = query.order('date_rdv', { ascending: true });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      console.log(`✅ ${data.length} rendez-vous récupérés`);

      return {
        success: true,
        appointments: data,
        count: data.length
      };

    } catch (error) {
      console.error('❌ Erreur récupération RDV:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error
      };
    }
  }

  /**
   * Modifier un rendez-vous
   * @param {string} appointmentId 
   * @param {object} updateData 
   * @returns {object}
   */
  async updateAppointment(appointmentId, updateData) {
    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('Authentification requise');
      }

      // Vérification de l'existence du RDV
      const { data: existingAppointment, error: fetchError } = await this.supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (fetchError || !existingAppointment) {
        throw new Error('Rendez-vous introuvable');
      }

      // Vérification des permissions
      const userProfile = this.authService.getUserProfile();
      const canUpdate = 
        userProfile.role === 'admin' ||
        (userProfile.role === 'client' && existingAppointment.client_id === userProfile.id) ||
        (userProfile.role === 'employee' && existingAppointment.employee_id === userProfile.id);

      if (!canUpdate) {
        throw new Error('Vous n\'avez pas l\'autorisation de modifier ce rendez-vous');
      }

      // Validation des données de mise à jour
      const sanitizedData = {};
      
      if (updateData.date_rdv) {
        const dateValidation = ValidationUtils.validateAppointmentDate(updateData.date_rdv);
        if (!dateValidation.isValid) {
          throw new Error(dateValidation.errors.join(', '));
        }
        sanitizedData.date_rdv = new Date(updateData.date_rdv).toISOString();
      }

      if (updateData.statut) {
        const validStatuts = ['planifie', 'confirme', 'en_cours', 'termine', 'annule', 'reporte'];
        if (!validStatuts.includes(updateData.statut)) {
          throw new Error('Statut invalide');
        }
        sanitizedData.statut = updateData.statut;
      }

      if (updateData.notes_rdv !== undefined) {
        sanitizedData.notes_rdv = updateData.notes_rdv ? 
          ValidationUtils.sanitizeString(updateData.notes_rdv) : null;
      }

      if (updateData.annulation_raison !== undefined) {
        sanitizedData.annulation_raison = updateData.annulation_raison ? 
          ValidationUtils.sanitizeString(updateData.annulation_raison) : null;
      }

      // Mise à jour
      const { data, error } = await this.supabase
        .from('appointments')
        .update(sanitizedData)
        .eq('id', appointmentId)
        .select(`
          *,
          client:profiles!appointments_client_id_fkey(nom, prenom, email),
          employee:profiles!appointments_employee_id_fkey(nom, prenom)
        `)
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Rendez-vous modifié:', appointmentId);

      // Notification si changement de statut
      if (updateData.statut) {
        await this.sendAppointmentNotification(data, 'updated');
      }

      return {
        success: true,
        message: 'Rendez-vous modifié avec succès',
        appointment: data
      };

    } catch (error) {
      console.error('❌ Erreur modification RDV:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error
      };
    }
  }

  /**
   * Annuler un rendez-vous
   * @param {string} appointmentId 
   * @param {string} reason 
   * @returns {object}
   */
  async cancelAppointment(appointmentId, reason = '') {
    return await this.updateAppointment(appointmentId, {
      statut: 'annule',
      annulation_raison: reason
    });
  }

  /**
   * Vérifier la disponibilité d'un créneau
   * @param {string} employeeId 
   * @param {string} dateTime 
   * @param {number} duration 
   * @returns {boolean}
   */
  async checkAvailability(employeeId, dateTime, duration = 60) {
    try {
      const startTime = new Date(dateTime);
      const endTime = new Date(startTime.getTime() + duration * 60000);

      // Vérifier les conflits avec les RDV existants
      const { data: conflicts, error } = await this.supabase
        .from('appointments')
        .select('id, date_rdv, duree')
        .eq('employee_id', employeeId)
        .in('statut', ['planifie', 'confirme', 'en_cours'])
        .gte('date_rdv', startTime.toISOString())
        .lt('date_rdv', endTime.toISOString());

      if (error) {
        throw error;
      }

      // Vérifier aussi les RDV qui se terminent après le début du nouveau créneau
      const { data: overlaps, error: overlapError } = await this.supabase
        .from('appointments')
        .select('id, date_rdv, duree')
        .eq('employee_id', employeeId)
        .in('statut', ['planifie', 'confirme', 'en_cours'])
        .lt('date_rdv', startTime.toISOString());

      if (overlapError) {
        throw overlapError;
      }

      // Vérifier les chevauchements
      const hasOverlap = overlaps.some(appointment => {
        const appointmentEnd = new Date(
          new Date(appointment.date_rdv).getTime() + appointment.duree * 60000
        );
        return appointmentEnd > startTime;
      });

      return conflicts.length === 0 && !hasOverlap;

    } catch (error) {
      console.error('❌ Erreur vérification disponibilité:', error);
      return false;
    }
  }

  /**
   * Récupérer les employés disponibles
   * @returns {object}
   */
  async getAvailableEmployees() {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select(`
          *,
          employees_info!inner(*)
        `)
        .eq('role', 'employee')
        .eq('is_active', true)
        .eq('employees_info.is_accepting_patients', true);

      if (error) {
        throw error;
      }

      return {
        success: true,
        employees: data
      };

    } catch (error) {
      console.error('❌ Erreur récupération employés:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error
      };
    }
  }

  /**
   * Validation des données de rendez-vous
   * @param {object} appointmentData 
   * @returns {object}
   */
  validateAppointmentData(appointmentData) {
    const errors = [];

    if (!appointmentData.employee_id) {
      errors.push('Employé requis');
    }

    if (!appointmentData.date_rdv) {
      errors.push('Date et heure requises');
    } else {
      const dateValidation = ValidationUtils.validateAppointmentDate(appointmentData.date_rdv);
      if (!dateValidation.isValid) {
        errors.push(...dateValidation.errors);
      }
    }

    if (!appointmentData.type_consultation) {
      errors.push('Type de consultation requis');
    }

    if (appointmentData.duree && (appointmentData.duree < 15 || appointmentData.duree > 480)) {
      errors.push('Durée invalide (15-480 minutes)');
    }

    const validModes = ['presentiel', 'visio', 'telephone'];
    if (appointmentData.mode_consultation && !validModes.includes(appointmentData.mode_consultation)) {
      errors.push('Mode de consultation invalide');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Envoyer une notification de rendez-vous
   * @param {object} appointment 
   * @param {string} action 
   */
  async sendAppointmentNotification(appointment, action) {
    try {
      // Ici vous pouvez implémenter l'envoi d'emails, SMS, etc.
      console.log(`📧 Notification ${action} pour RDV:`, appointment.id);
      
      // Exemple d'intégration avec un service d'email
      // await emailService.sendAppointmentNotification(appointment, action);
      
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
      // Ne pas faire échouer l'opération principale pour une notification
    }
  }

  /**
   * Obtenir un message d'erreur convivial
   * @param {object} error 
   * @returns {string}
   */
  getErrorMessage(error) {
    const errorMessages = {
      'duplicate key value violates unique constraint': 'Ce créneau est déjà pris',
      'insert or update on table "appointments" violates foreign key constraint': 'Employé invalide',
      'new row for relation "appointments" violates check constraint': 'Données de rendez-vous invalides',
      'permission denied': 'Vous n\'avez pas l\'autorisation pour cette action'
    };

    const message = error.message || error.toString();
    
    for (const [key, value] of Object.entries(errorMessages)) {
      if (message.includes(key)) {
        return value;
      }
    }

    return message || 'Une erreur inattendue s\'est produite';
  }
}

// Initialisation du service
window.appointmentsService = new AppointmentsService();

console.log('✅ Service de rendez-vous initialisé');
```

---

## 🧪 Tests d'intégration et validation

### 1. Suite de tests automatisés

```javascript
// js/integration-tests.js
/**
 * Tests d'intégration pour valider la sécurité et le fonctionnement
 */

class IntegrationTests {
  constructor() {
    this.authService = window.authService;
    this.appointmentsService = window.appointmentsService;
    this.testResults = [];
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests() {
    console.log('🧪 Début des tests d\'intégration');
    
    this.testResults = [];
    
    try {
      await this.testAuthentication();
      await this.testRoleBasedAccess();
      await this.testAppointmentCreation();
      await this.testAppointmentSecurity();
      await this.testDataValidation();
      await this.testErrorHandling();
      
      this.displayResults();
      
    } catch (error) {
      console.error('❌ Erreur lors des tests:', error);
    }
  }

  /**
   * Tests d'authentification
   */
  async testAuthentication() {
    console.log('🔐 Test d\'authentification...');
    
    // Test 1: Inscription avec données valides
    const signUpResult = await this.authService.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      nom: 'Test',
      prenom: 'User',
      role: 'client'
    });
    
    this.addTestResult('Inscription avec données valides', signUpResult.success);
    
    // Test 2: Inscription avec email invalide
    const invalidEmailResult = await this.authService.signUp({
      email: 'email-invalide',
      password: 'TestPassword123!',
      nom: 'Test',
      prenom: 'User'
    });
    
    this.addTestResult('Rejet email invalide', !invalidEmailResult.success);
    
    // Test 3: Inscription avec mot de passe faible
    const weakPasswordResult = await this.authService.signUp({
      email: `test-weak-${Date.now()}@example.com`,
      password: '123',
      nom: 'Test',
      prenom: 'User'
    });
    
    this.addTestResult('Rejet mot de passe faible', !weakPasswordResult.success);
  }

  /**
   * Tests d'accès basé sur les rôles
   */
  async testRoleBasedAccess() {
    console.log('👥 Test des accès basés sur les rôles...');
    
    // Simuler différents rôles
    const originalProfile = this.authService.userProfile;
    
    // Test client
    this.authService.userProfile = { role: 'client', id: 'test-client-id' };
    const clientPermission = this.authService.hasPermission('client');
    const clientEmployeePermission = this.authService.hasPermission('employee');
    
    this.addTestResult('Client a accès client', clientPermission);
    this.addTestResult('Client n\'a pas accès employé', !clientEmployeePermission);
    
    // Test employé
    this.authService.userProfile = { role: 'employee', id: 'test-employee-id' };
    const employeePermission = this.authService.hasPermission('employee');
    const employeeClientPermission = this.authService.hasPermission('client');
    
    this.addTestResult('Employé a accès employé', employeePermission);
    this.addTestResult('Employé a accès client', employeeClientPermission);
    
    // Restaurer le profil original
    this.authService.userProfile = originalProfile;
  }

  /**
   * Tests de création de rendez-vous
   */
  async testAppointmentCreation() {
    console.log('📅 Test de création de rendez-vous...');
    
    // Simuler un utilisateur client connecté
    const originalUser = this.authService.currentUser;
    const originalProfile = this.authService.userProfile;
    
    this.authService.currentUser = { id: 'test-client-id' };
    this.authService.userProfile = { role: 'client', id: 'test-client-id' };
    
    // Test avec données valides
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    const validAppointment = {
      employee_id: 'test-employee-id',
      date_rdv: futureDate.toISOString(),
      duree: 60,
      type_consultation: 'Consultation initiale',
      mode_consultation: 'presentiel'
    };
    
    const validation = this.appointmentsService.validateAppointmentData(validAppointment);
    this.addTestResult('Validation données RDV valides', validation.isValid);
    
    // Test avec date passée
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const pastAppointment = {
      employee_id: 'test-employee-id',
      date_rdv: pastDate.toISOString(),
      type_consultation: 'Test'
    };
    
    const pastValidation = this.appointmentsService.validateAppointmentData(pastAppointment);
    this.addTestResult('Rejet date passée', !pastValidation.isValid);
    
    // Restaurer les valeurs originales
    this.authService.currentUser = originalUser;
    this.authService.userProfile = originalProfile;
  }

  /**
   * Tests de sécurité des rendez-vous
   */
  async testAppointmentSecurity() {
    console.log('🔒 Test de sécurité des rendez-vous...');
    
    // Test injection SQL dans les données
    const maliciousData = {
      employee_id: "'; DROP TABLE appointments; --",
      date_rdv: new Date(Date.now() + 86400000).toISOString(),
      type_consultation: "<script>alert('XSS')</script>",
      motif: "'; DELETE FROM profiles; --"
    };
    
    const sanitizedMotif = ValidationUtils.sanitizeString(maliciousData.motif);
    const sanitizedType = ValidationUtils.sanitizeString(maliciousData.type_consultation);
    
    this.addTestResult('Sanitisation motif', !sanitizedMotif.includes('DELETE'));
    this.addTestResult('Sanitisation type', !sanitizedType.includes('<script>'));
  }

  /**
   * Tests de validation des données
   */
  async testDataValidation() {
    console.log('✅ Test de validation des données...');
    
    // Test validation email
    const validEmails = ['test@example.com', 'user.name@domain.co.uk'];
    const invalidEmails = ['invalid-email', '@domain.com', 'user@'];
    
    validEmails.forEach(email => {
      this.addTestResult(`Email valide: ${email}`, ValidationUtils.isValidEmail(email));
    });
    
    invalidEmails.forEach(email => {
      this.addTestResult(`Email invalide: ${email}`, !ValidationUtils.isValidEmail(email));
    });
    
    // Test validation téléphone
    const validPhones = ['+33123456789', '01 23 45 67 89', '0123456789'];
    const invalidPhones = ['123', 'abc123', '+33 abc'];
    
    validPhones.forEach(phone => {
      this.addTestResult(`Téléphone valide: ${phone}`, ValidationUtils.isValidPhone(phone));
    });
    
    invalidPhones.forEach(phone => {
      this.addTestResult(`Téléphone invalide: ${phone}`, !ValidationUtils.isValidPhone(phone));
    });
    
    // Test validation mot de passe
    const strongPassword = ValidationUtils.validatePassword('StrongPass123!');
    const weakPassword = ValidationUtils.validatePassword('weak');
    
    this.addTestResult('Mot de passe fort accepté', strongPassword.isValid);
    this.addTestResult('Mot de passe faible rejeté', !weakPassword.isValid);
  }

  /**
   * Tests de gestion d'erreurs
   */
  async testErrorHandling() {
    console.log('⚠️ Test de gestion d\'erreurs...');
    
    // Test gestion erreur réseau (simulation)
    try {
      const networkError = new Error('Network error');
      const errorMessage = this.authService.getErrorMessage(networkError);
      this.addTestResult('Gestion erreur réseau', errorMessage.includes('connexion'));
    } catch (error) {
      this.addTestResult('Gestion erreur réseau', false);
    }
    
    // Test gestion erreur authentification
    const authError = new Error('Invalid login credentials');
    const authErrorMessage = this.authService.getErrorMessage(authError);
    this.addTestResult('Message erreur auth convivial', authErrorMessage.includes('incorrect'));
  }

  /**
   * Ajouter un résultat de test
   * @param {string} testName 
   * @param {boolean} passed 
   */
  addTestResult(testName, passed) {
    this.testResults.push({
      name: testName,
      passed: passed,
      timestamp: new Date().toISOString()
    });
    
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${passed ? 'PASS' : 'FAIL'}`);
  }

  /**
   * Afficher les résultats des tests
   */
  displayResults() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(test => test.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log('\n📊 RÉSULTATS DES TESTS:');
    console.log(`Total: ${totalTests}`);
    console.log(`✅ Réussis: ${passedTests}`);
    console.log(`❌ Échoués: ${failedTests}`);
    console.log(`📈 Taux de réussite: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Tests échoués:');
      this.testResults
        .filter(test => !test.passed)
        .forEach(test => console.log(`- ${test.name}`));
    }
    
    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: (passedTests / totalTests) * 100
    };
  }

  /**
   * Test de performance (optionnel)
   */
  async testPerformance() {
    console.log('⚡ Test de performance...');
    
    const startTime = performance.now();
    
    // Simuler plusieurs opérations
    for (let i = 0; i < 10; i++) {
      ValidationUtils.isValidEmail(`test${i}@example.com`);
      ValidationUtils.validatePassword('TestPassword123!');
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.addTestResult('Performance validation (<100ms)', duration < 100);
    console.log(`⏱️ Temps d'exécution: ${duration.toFixed(2)}ms`);
  }
}

// Initialisation des tests
window.integrationTests = new IntegrationTests();

// Fonction pour lancer les tests manuellement
window.runTests = () => {
  window.integrationTests.runAllTests();
};

console.log('✅ Tests d\'intégration initialisés');
console.log('💡 Utilisez runTests() pour lancer les tests');
```

---

## 🎨 Exemples d'implémentation dans les pages HTML

### 1. Page d'authentification (auth.html)

```html
<!-- Section d'inscription -->
<form id="signup-form" class="auth-form">
  <h2>Créer un compte</h2>
  
  <div class="form-group">
    <label for="signup-email">Email *</label>
    <input type="email" id="signup-email" required>
    <span class="error-message" id="signup-email-error"></span>
  </div>
  
  <div class="form-group">
    <label for="signup-password">Mot de passe *</label>
    <input type="password" id="signup-password" required>
    <div class="password-strength" id="password-strength"></div>
    <span class="error-message" id="signup-password-error"></span>
  </div>
  
  <div class="form-group">
    <label for="signup-nom">Nom *</label>
    <input type="text" id="signup-nom" required>
    <span class="error-message" id="signup-nom-error"></span>
  </div>
  
  <div class="form-group">
    <label for="signup-prenom">Prénom *</label>
    <input type="text" id="signup-prenom" required>
    <span class="error-message" id="signup-prenom-error"></span>
  </div>
  
  <div class="form-group">
    <label for="signup-telephone">Téléphone</label>
    <input type="tel" id="signup-telephone">
    <span class="error-message" id="signup-telephone-error"></span>
  </div>
  
  <div class="form-group">
    <label for="signup-role">Je suis *</label>
    <select id="signup-role" required>
      <option value="client">Client</option>
      <option value="employee">Employé</option>
    </select>
  </div>
  
  <button type="submit" class="btn-primary">Créer mon compte</button>
  <div class="loading" id="signup-loading" style="display: none;">Création en cours...</div>
</form>

<script>
// Gestion du formulaire d'inscription
document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Réinitialiser les erreurs
  clearErrors();
  
  // Récupérer les données
  const formData = {
    email: document.getElementById('signup-email').value,
    password: document.getElementById('signup-password').value,
    nom: document.getElementById('signup-nom').value,
    prenom: document.getElementById('signup-prenom').value,
    telephone: document.getElementById('signup-telephone').value,
    role: document.getElementById('signup-role').value
  };
  
  // Validation côté client
  if (!validateSignupForm(formData)) {
    return;
  }
  
  // Afficher le loading
  showLoading('signup-loading');
  
  try {
    // Inscription via le service
    const result = await window.authService.signUp(formData);
    
    if (result.success) {
      showSuccess('Compte créé avec succès! Vérifiez votre email.');
      document.getElementById('signup-form').reset();
    } else {
      showError(result.message);
    }
  } catch (error) {
    showError('Une erreur inattendue s\'est produite');
  } finally {
    hideLoading('signup-loading');
  }
});

// Validation en temps réel du mot de passe
document.getElementById('signup-password').addEventListener('input', (e) => {
  const password = e.target.value;
  const validation = ValidationUtils.validatePassword(password);
  
  const strengthDiv = document.getElementById('password-strength');
  
  if (password.length === 0) {
    strengthDiv.innerHTML = '';
    return;
  }
  
  if (validation.isValid) {
    strengthDiv.innerHTML = '<span class="strength-strong">✅ Mot de passe fort</span>';
  } else {
    const errors = validation.errors.slice(0, 2); // Afficher max 2 erreurs
    strengthDiv.innerHTML = `<span class="strength-weak">⚠️ ${errors.join(', ')}</span>`;
  }
});

function validateSignupForm(data) {
  let isValid = true;
  
  // Validation email
  if (!ValidationUtils.isValidEmail(data.email)) {
    showFieldError('signup-email-error', 'Email invalide');
    isValid = false;
  }
  
  // Validation mot de passe
  const passwordValidation = ValidationUtils.validatePassword(data.password);
  if (!passwordValidation.isValid) {
    showFieldError('signup-password-error', passwordValidation.errors[0]);
    isValid = false;
  }
  
  // Validation nom/prénom
  if (data.nom.length < 2) {
    showFieldError('signup-nom-error', 'Nom requis (min. 2 caractères)');
    isValid = false;
  }
  
  if (data.prenom.length < 2) {
    showFieldError('signup-prenom-error', 'Prénom requis (min. 2 caractères)');
    isValid = false;
  }
  
  // Validation téléphone (optionnel)
  if (data.telephone && !ValidationUtils.isValidPhone(data.telephone)) {
    showFieldError('signup-telephone-error', 'Format de téléphone invalide');
    isValid = false;
  }
  
  return isValid;
}
</script>
```

### 2. Page de prise de rendez-vous (rendez-vous.html)

```html
<form id="appointment-form" class="appointment-form">
  <h2>Prendre un rendez-vous</h2>
  
  <div class="form-group">
    <label for="employee-select">Choisir un praticien *</label>
    <select id="employee-select" required>
      <option value="">Sélectionnez un praticien</option>
    </select>
    <span class="error-message" id="employee-error"></span>
  </div>
  
  <div class="form-group">
    <label for="appointment-date">Date *</label>
    <input type="date" id="appointment-date" required>
    <span class="error-message" id="date-error"></span>
  </div>
  
  <div class="form-group">
    <label for="appointment-time">Heure *</label>
    <select id="appointment-time" required>
      <option value="">Sélectionnez une heure</option>
    </select>
    <span class="error-message" id="time-error"></span>
  </div>
  
  <div class="form-group">
    <label for="consultation-type">Type de consultation *</label>
    <select id="consultation-type" required>
      <option value="">Sélectionnez le type</option>
      <option value="Consultation initiale">Consultation initiale</option>
      <option value="Suivi">Suivi</option>
      <option value="Urgence">Urgence</option>
    </select>
  </div>
  
  <div class="form-group">
    <label for="consultation-mode">Mode de consultation</label>
    <select id="consultation-mode">
      <option value="presentiel">Présentiel</option>
      <option value="visio">Visioconférence</option>
      <option value="telephone">Téléphone</option>
    </select>
  </div>
  
  <div class="form-group">
    <label for="appointment-motif">Motif (optionnel)</label>
    <textarea id="appointment-motif" rows="3" maxlength="500"></textarea>
    <small>Maximum 500 caractères</small>
  </div>
  
  <button type="submit" class="btn-primary">Confirmer le rendez-vous</button>
  <div class="loading" id="appointment-loading" style="display: none;">Création en cours...</div>
</form>

<script>
// Initialisation de la page
document.addEventListener('DOMContentLoaded', async () => {
  // Vérifier l'authentification
  if (!window.authService.isAuthenticated()) {
    window.location.href = 'auth.html';
    return;
  }
  
  // Vérifier le rôle client
  if (!window.authService.hasPermission('client')) {
    showError('Seuls les clients peuvent prendre des rendez-vous');
    return;
  }
  
  // Charger les employés disponibles
  await loadAvailableEmployees();
  
  // Configurer la date minimum (aujourd'hui)
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('appointment-date').min = today;
});

// Charger les employés disponibles
async function loadAvailableEmployees() {
  try {
    const result = await window.appointmentsService.getAvailableEmployees();
    
    if (result.success) {
      const select = document.getElementById('employee-select');
      
      result.employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = `${employee.prenom} ${employee.nom} - ${employee.employees_info.specialite}`;
        select.appendChild(option);
      });
    } else {
      showError('Erreur lors du chargement des praticiens');
    }
  } catch (error) {
    showError('Erreur lors du chargement des praticiens');
  }
}

// Gestion du changement de date
document.getElementById('appointment-date').addEventListener('change', async (e) => {
  const selectedDate = e.target.value;
  const employeeId = document.getElementById('employee-select').value;
  
  if (selectedDate && employeeId) {
    await loadAvailableTimeSlots(employeeId, selectedDate);
  }
});

// Gestion du changement d'employé
document.getElementById('employee-select').addEventListener('change', async (e) => {
  const employeeId = e.target.value;
  const selectedDate = document.getElementById('appointment-date').value;
  
  if (selectedDate && employeeId) {
    await loadAvailableTimeSlots(employeeId, selectedDate);
  }
});

// Charger les créneaux disponibles
async function loadAvailableTimeSlots(employeeId, date) {
  const timeSelect = document.getElementById('appointment-time');
  timeSelect.innerHTML = '<option value="">Chargement...</option>';
  
  try {
    // Générer les créneaux de 9h à 17h par tranches de 30 minutes
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const dateTime = `${date}T${timeString}:00`;
        
        // Vérifier la disponibilité
        const isAvailable = await window.appointmentsService.checkAvailability(
          employeeId, 
          dateTime, 
          60
        );
        
        if (isAvailable) {
          slots.push({ time: timeString, dateTime: dateTime });
        }
      }
    }
    
    // Remplir le select
    timeSelect.innerHTML = '<option value="">Sélectionnez une heure</option>';
    
    if (slots.length === 0) {
      timeSelect.innerHTML = '<option value="">Aucun créneau disponible</option>';
    } else {
      slots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.dateTime;
        option.textContent = slot.time;
        timeSelect.appendChild(option);
      });
    }
    
  } catch (error) {
    timeSelect.innerHTML = '<option value="">Erreur de chargement</option>';
    console.error('Erreur chargement créneaux:', error);
  }
}

// Gestion du formulaire de rendez-vous
document.getElementById('appointment-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Réinitialiser les erreurs
  clearErrors();
  
  // Récupérer les données
  const formData = {
    employee_id: document.getElementById('employee-select').value,
    date_rdv: document.getElementById('appointment-time').value,
    type_consultation: document.getElementById('consultation-type').value,
    mode_consultation: document.getElementById('consultation-mode').value,
    motif: document.getElementById('appointment-motif').value,
    duree: 60
  };
  
  // Validation côté client
  if (!validateAppointmentForm(formData)) {
    return;
  }
  
  // Afficher le loading
  showLoading('appointment-loading');
  
  try {
    // Créer le rendez-vous
    const result = await window.appointmentsService.createAppointment(formData);
    
    if (result.success) {
      showSuccess('Rendez-vous créé avec succès!');
      document.getElementById('appointment-form').reset();
      
      // Rediriger vers la liste des RDV après 2 secondes
      setTimeout(() => {
        window.location.href = 'profile.html#appointments';
      }, 2000);
    } else {
      showError(result.message);
    }
  } catch (error) {
    showError('Une erreur inattendue s\'est produite');
  } finally {
    hideLoading('appointment-loading');
  }
});

function validateAppointmentForm(data) {
  let isValid = true;
  
  if (!data.employee_id) {
    showFieldError('employee-error', 'Veuillez sélectionner un praticien');
    isValid = false;
  }
  
  if (!data.date_rdv) {
    showFieldError('time-error', 'Veuillez sélectionner une date et heure');
    isValid = false;
  }
  
  if (!data.type_consultation) {
    showError('Veuillez sélectionner un type de consultation');
    isValid = false;
  }
  
  return isValid;
}
</script>
```

---

## 🔒 Conseils de sécurité avancés

### 1. Protection contre les attaques courantes

```javascript
// js/security-utils.js
/**
 * Utilitaires de sécurité avancés
 */

class SecurityUtils {
  /**
   * Protection contre les attaques CSRF
   */
  static generateCSRFToken() {
    return crypto.getRandomValues(new Uint8Array(32))
      .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
  }
  
  /**
   * Validation et sanitisation stricte
   */
  static strictSanitize(input, type = 'text') {
    if (typeof input !== 'string') return '';
    
    let sanitized = input.trim();
    
    switch (type) {
      case 'email':
        sanitized = sanitized.toLowerCase().replace(/[^a-z0-9@._-]/g, '');
        break;
      case 'name':
        sanitized = sanitized.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '');
        break;
      case 'phone':
        sanitized = sanitized.replace(/[^0-9+\s()-]/g, '');
        break;
      case 'text':
      default:
        sanitized = sanitized.replace(/[<>"'&]/g, '');
        break;
    }
    
    return sanitized.substring(0, 1000); // Limite de longueur
  }
  
  /**
   * Détection de tentatives d'injection
   */
  static detectInjection(input) {
    const sqlPatterns = [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i
    ];
    
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];
    
    const allPatterns = [...sqlPatterns, ...xssPatterns];
    
    return allPatterns.some(pattern => pattern.test(input));
  }
  
  /**
   * Limitation du taux de requêtes (côté client)
   */
  static createRateLimiter(maxRequests = 10, windowMs = 60000) {
    const requests = new Map();
    
    return function rateLimiter(identifier) {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Nettoyer les anciennes entrées
      for (const [key, timestamps] of requests.entries()) {
        const validTimestamps = timestamps.filter(ts => ts > windowStart);
        if (validTimestamps.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, validTimestamps);
        }
      }
      
      // Vérifier la limite pour cet identifiant
      const userRequests = requests.get(identifier) || [];
      
      if (userRequests.length >= maxRequests) {
        return false; // Limite atteinte
      }
      
      // Ajouter cette requête
      userRequests.push(now);
      requests.set(identifier, userRequests);
      
      return true; // Autorisé
    };
  }
  
  /**
   * Chiffrement côté client (pour données sensibles)
   */
  static async encryptSensitiveData(data, password) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const passwordBuffer = encoder.encode(password);
    
    // Générer une clé à partir du mot de passe
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      dataBuffer
    );
    
    // Combiner salt, iv et données chiffrées
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    return btoa(String.fromCharCode(...result));
  }
}

// Initialisation du limiteur de taux global
const globalRateLimiter = SecurityUtils.createRateLimiter(50, 60000); // 50 req/min

window.SecurityUtils = SecurityUtils;
window.globalRateLimiter = globalRateLimiter;
```

### 2. Configuration de sécurité Supabase

```sql
-- Configuration de sécurité avancée

-- 1. Limitation des connexions par IP
CREATE OR REPLACE FUNCTION limit_connections_per_ip()
RETURNS TRIGGER AS $$
DECLARE
  connection_count INTEGER;
BEGIN
  -- Compter les connexions actives pour cette IP
  SELECT COUNT(*) INTO connection_count
  FROM pg_stat_activity
  WHERE client_addr = inet_client_addr()
  AND state = 'active';
  
  -- Limiter à 10 connexions par IP
  IF connection_count > 10 THEN
    RAISE EXCEPTION 'Trop de connexions simultanées depuis cette IP';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Audit des actions sensibles
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction d'audit
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Application de l'audit sur les tables sensibles
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION audit_changes();

CREATE TRIGGER audit_appointments
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION audit_changes();

-- 3. Politique de mot de passe renforcée
CREATE OR REPLACE FUNCTION validate_password_strength(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Minimum 8 caractères
  IF LENGTH(password) < 8 THEN
    RETURN FALSE;
  END IF;
  
  -- Au moins une majuscule
  IF password !~ '[A-Z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Au moins une minuscule
  IF password !~ '[a-z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Au moins un chiffre
  IF password !~ '[0-9]' THEN
    RETURN FALSE;
  END IF;
  
  -- Au moins un caractère spécial
  IF password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 4. Détection d'activité suspecte
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TRIGGER AS $$
DECLARE
  recent_failures INTEGER;
  recent_logins INTEGER;
BEGIN
  -- Compter les échecs de connexion récents
  SELECT COUNT(*) INTO recent_failures
  FROM auth.audit_log_entries
  WHERE created_at > NOW() - INTERVAL '15 minutes'
  AND ip_address = inet_client_addr()
  AND payload->>'error_code' = 'invalid_credentials';
  
  -- Bloquer après 5 tentatives échouées
  IF recent_failures >= 5 THEN
    RAISE EXCEPTION 'Compte temporairement bloqué pour activité suspecte';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📋 Checklist de déploiement sécurisé

### ✅ Avant la mise en production

**Configuration Supabase:**
- [ ] RLS activé sur toutes les tables
- [ ] Policies testées pour chaque rôle
- [ ] Clés API configurées (anon key uniquement côté client)
- [ ] Authentification configurée avec confirmation email
- [ ] Audit log activé
- [ ] Limitations de taux configurées

**Code côté client:**
- [ ] Validation stricte de tous les inputs
- [ ] Sanitisation des données
- [ ] Gestion d'erreurs complète
- [ ] Messages d'erreur non révélateurs
- [ ] Rate limiting côté client
- [ ] HTTPS uniquement

**Tests de sécurité:**
- [ ] Tests d'injection SQL
- [ ] Tests XSS
- [ ] Tests d'autorisation
- [ ] Tests de performance
- [ ] Tests de charge

**Monitoring:**
- [ ] Logs d'audit configurés
- [ ] Alertes sur activités suspectes
- [ ] Monitoring des performances
- [ ] Sauvegarde automatique

---

## 🚀 Commandes de déploiement

```bash
# 1. Exécuter les migrations SQL
psql -h db.xxx.supabase.co -U postgres -d postgres -f schema.sql

# 2. Configurer les variables d'environnement
echo "SUPABASE_URL=https://xxx.supabase.co" > .env
echo "SUPABASE_ANON_KEY=xxx" >> .env

# 3. Tester la configuration
node test-connection.js

# 4. Lancer les tests d'intégration
open tests.html

# 5. Déployer
# (selon votre plateforme: Vercel, Netlify, etc.)
```

---

## 📞 Support et maintenance

### Contacts techniques
- **Développeur principal:** [Votre nom]
- **Support Supabase:** support@supabase.io
- **Documentation:** https://supabase.com/docs

### Maintenance recommandée
- **Quotidienne:** Vérification des logs d'erreur
- **Hebdomadaire:** Analyse des performances
- **Mensuelle:** Audit de sécurité
- **Trimestrielle:** Mise à jour des dépendances

---

**🎉 Félicitations! Votre intégration Supabase est maintenant sécurisée et prête pour la production.**

*Ce guide couvre tous les aspects essentiels pour une intégration robuste et sécurisée. N'hésitez pas à l'adapter selon vos besoins spécifiques.*