/**
 * Service d'authentification sécurisé pour MentalPlus
 * Gestion complète de l'authentification avec Supabase
 */

// Vérification que Supabase est configuré
if (typeof supabaseClient === 'undefined') {
  console.error('❌ supabaseClient non trouvé. Assurez-vous que supabase-config.js est chargé.');
  throw new Error('Configuration Supabase manquante');
}

/**
 * Service d'authentification principal
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.isInitialized = false;
    
    // Initialiser le service
    this.init();
  }

  /**
   * Initialisation du service d'authentification
   */
  async init() {
    try {
      console.log('🔐 Initialisation du service d\'authentification...');
      
      // Vérifier s'il y a une session existante
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error('❌ Erreur lors de la récupération de la session:', error);
        return;
      }
      
      if (session?.user) {
        console.log('✅ Session existante trouvée pour:', session.user.email);
        await this.loadUserProfile(session.user);
      } else {
        console.log('ℹ️ Aucune session active');
      }
      
      // Écouter les changements d'état d'authentification
      supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Changement d\'état auth:', event);
        await this.handleAuthStateChange(event, session);
      });
      
      this.isInitialized = true;
      console.log('✅ Service d\'authentification initialisé');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      throw error;
    }
  }

  /**
   * Gestion des changements d'état d'authentification
   */
  async handleAuthStateChange(event, session) {
    try {
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ Utilisateur connecté:', session.user.email);
          await this.loadUserProfile(session.user);
          this.redirectAfterLogin();
          break;
          
        case 'SIGNED_OUT':
          console.log('👋 Utilisateur déconnecté');
          this.currentUser = null;
          this.userProfile = null;
          this.redirectToLogin();
          break;
          
        case 'TOKEN_REFRESHED':
          console.log('🔄 Token rafraîchi');
          break;
          
        case 'USER_UPDATED':
          console.log('📝 Profil utilisateur mis à jour');
          if (session?.user) {
            await this.loadUserProfile(session.user);
          }
          break;
      }
    } catch (error) {
      console.error('❌ Erreur lors du changement d\'état auth:', error);
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp(email, password, userData) {
    try {
      console.log('📝 Tentative d\'inscription pour:', email);
      
      // Validation des données
      const validation = this.validateSignUpData(email, password, userData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Inscription avec Supabase
      const { data, error } = await supabaseClient.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
        options: {
          data: {
            full_name: userData.fullName,
            role: userData.role || 'client',
            phone: userData.phone || null
          }
        }
      });
      
      if (error) {
        console.error('❌ Erreur lors de l\'inscription:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('✅ Inscription réussie pour:', email);
        
        // Créer le profil utilisateur
        await this.createUserProfile(data.user, userData);
        
        return {
          success: true,
          user: data.user,
          message: 'Inscription réussie! Vérifiez votre email pour confirmer votre compte.'
        };
      }
      
    } catch (error) {
      console.error('❌ Erreur d\'inscription:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  async signIn(email, password) {
    try {
      console.log('🔑 Tentative de connexion pour:', email);
      
      // Validation basique
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }
      
      // Connexion avec Supabase
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });
      
      if (error) {
        console.error('❌ Erreur de connexion:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('✅ Connexion réussie pour:', email);
        return {
          success: true,
          user: data.user,
          message: 'Connexion réussie!'
        };
      }
      
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Déconnexion de l'utilisateur
   */
  async signOut() {
    try {
      console.log('👋 Déconnexion en cours...');
      
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        console.error('❌ Erreur lors de la déconnexion:', error);
        throw error;
      }
      
      console.log('✅ Déconnexion réussie');
      return {
        success: true,
        message: 'Déconnexion réussie'
      };
      
    } catch (error) {
      console.error('❌ Erreur de déconnexion:', error);
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Charger le profil utilisateur depuis la base de données
   */
  async loadUserProfile(user) {
    try {
      console.log('👤 Chargement du profil pour:', user.email);
      
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erreur lors du chargement du profil:', error);
        throw error;
      }
      
      this.currentUser = user;
      this.userProfile = data;
      
      console.log('✅ Profil chargé:', data?.role || 'Profil non trouvé');
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement du profil:', error);
    }
  }

  /**
   * Créer un profil utilisateur après inscription
   */
  async createUserProfile(user, userData) {
    try {
      console.log('👤 Création du profil pour:', user.email);
      
      const profileData = {
        id: user.id,
        email: user.email,
        full_name: userData.fullName,
        role: userData.role || 'client',
        phone: userData.phone || null,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabaseClient
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erreur lors de la création du profil:', error);
        throw error;
      }
      
      console.log('✅ Profil créé avec succès');
      this.userProfile = data;
      
    } catch (error) {
      console.error('❌ Erreur lors de la création du profil:', error);
      throw error;
    }
  }

  /**
   * Validation des données d'inscription
   */
  validateSignUpData(email, password, userData) {
    const errors = [];
    
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.push('Email invalide');
    }
    
    // Validation mot de passe
    if (!password || password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre');
    }
    
    // Validation nom complet
    if (!userData.fullName || userData.fullName.trim().length < 2) {
      errors.push('Nom complet requis (minimum 2 caractères)');
    }
    
    // Validation rôle
    if (userData.role && !['client', 'employee'].includes(userData.role)) {
      errors.push('Rôle invalide');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Redirection après connexion selon le rôle
   */
  redirectAfterLogin() {
    if (!this.userProfile) {
      console.warn('⚠️ Profil non chargé, redirection vers profil');
      window.location.href = '/profile.html';
      return;
    }
    
    const role = this.userProfile.role;
    console.log('🔄 Redirection selon le rôle:', role);
    
    switch (role) {
      case 'client':
        window.location.href = '/espace-client.html';
        break;
      case 'employee':
        window.location.href = '/espace-employe.html';
        break;
      default:
        window.location.href = '/profile.html';
    }
  }

  /**
   * Redirection vers la page de connexion
   */
  redirectToLogin() {
    if (window.location.pathname !== '/auth.html' && window.location.pathname !== '/') {
      console.log('🔄 Redirection vers la page de connexion');
      window.location.href = '/auth.html';
    }
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role) {
    return this.userProfile?.role === role;
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Obtenir le profil utilisateur actuel
   */
  getUserProfile() {
    return this.userProfile;
  }

  /**
   * Formater les messages d'erreur
   */
  getErrorMessage(error) {
    const errorMessages = {
      'Invalid login credentials': 'Email ou mot de passe incorrect',
      'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter',
      'User already registered': 'Un compte existe déjà avec cet email',
      'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
      'Invalid email': 'Format d\'email invalide',
      'Signup disabled': 'Les inscriptions sont temporairement désactivées'
    };
    
    return errorMessages[error.message] || error.message || 'Une erreur est survenue';
  }
}

// Créer une instance globale du service d'authentification
window.authService = new AuthService();

// Fonctions utilitaires globales
window.requireAuth = function(requiredRole = null) {
  if (!window.authService.isAuthenticated()) {
    console.warn('⚠️ Accès non autorisé - redirection vers connexion');
    window.authService.redirectToLogin();
    return false;
  }
  
  if (requiredRole && !window.authService.hasRole(requiredRole)) {
    console.warn('⚠️ Rôle insuffisant:', requiredRole);
    alert('Vous n\'avez pas les permissions nécessaires pour accéder à cette page.');
    window.authService.redirectAfterLogin();
    return false;
  }
  
  return true;
};

// Protection automatique des pages selon leur nom
window.addEventListener('DOMContentLoaded', function() {
  const pathname = window.location.pathname;
  
  // Pages nécessitant une authentification
  if (pathname.includes('espace-client') || pathname.includes('espace-employe') || pathname.includes('profile')) {
    setTimeout(() => {
      if (pathname.includes('espace-employe')) {
        window.requireAuth('employee');
      } else {
        window.requireAuth();
      }
    }, 1000); // Attendre que le service soit initialisé
  }
});

console.log('🔐 Service d\'authentification chargé');