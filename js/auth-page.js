/**
 * Script pour la page d'authentification (auth.html)
 * Gestion sécurisée de l'inscription et de la connexion
 */

// Vérification des dépendances
if (typeof authService === 'undefined' || typeof securityUtils === 'undefined') {
  console.error('❌ Services requis non chargés');
  alert('Erreur de chargement. Veuillez rafraîchir la page.');
}

/**
 * Gestionnaire de la page d'authentification
 */
class AuthPageManager {
  constructor() {
    this.isSignUpMode = false;
    this.isLoading = false;
    this.passwordStrengthIndicator = null;
    
    this.init();
  }

  /**
   * Initialisation de la page
   */
  init() {
    console.log('🔐 Initialisation de la page d\'authentification...');
    
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupPage());
    } else {
      this.setupPage();
    }
  }

  /**
   * Configuration de la page
   */
  setupPage() {
    try {
      // Vérifier si l'utilisateur est déjà connecté
      if (authService.isAuthenticated()) {
        console.log('✅ Utilisateur déjà connecté, redirection...');
        authService.redirectAfterLogin();
        return;
      }
      
      this.setupFormElements();
      this.setupEventListeners();
      this.setupPasswordStrengthIndicator();
      
      console.log('✅ Page d\'authentification configurée');
      
    } catch (error) {
      console.error('❌ Erreur lors de la configuration:', error);
      this.showError('Erreur de configuration de la page');
    }
  }

  /**
   * Configuration des éléments du formulaire
   */
  setupFormElements() {
    // Créer le formulaire s'il n'existe pas
    if (!document.getElementById('authForm')) {
      this.createAuthForm();
    }
    
    // Références aux éléments
    this.form = document.getElementById('authForm');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.confirmPasswordInput = document.getElementById('confirmPassword');
    this.fullNameInput = document.getElementById('fullName');
    this.phoneInput = document.getElementById('phone');
    this.roleSelect = document.getElementById('role');
    this.submitButton = document.getElementById('submitButton');
    this.toggleButton = document.getElementById('toggleMode');
    this.errorContainer = document.getElementById('errorContainer');
    this.loadingIndicator = document.getElementById('loadingIndicator');
    
    // Configuration initiale
    this.updateFormMode();
  }

  /**
   * Création du formulaire d'authentification
   */
  createAuthForm() {
    const container = document.querySelector('.auth-container') || document.body;
    
    const formHTML = `
      <div class="auth-form-container">
        <h2 id="formTitle">Connexion</h2>
        
        <div id="errorContainer" class="error-container" style="display: none;"></div>
        <div id="loadingIndicator" class="loading-indicator" style="display: none;">
          <div class="spinner"></div>
          <span>Traitement en cours...</span>
        </div>
        
        <form id="authForm" class="auth-form">
          <!-- Champs communs -->
          <div class="form-group">
            <label for="email">Email *</label>
            <input type="email" id="email" name="email" required autocomplete="email">
            <div class="field-error" id="emailError"></div>
          </div>
          
          <div class="form-group">
            <label for="password">Mot de passe *</label>
            <input type="password" id="password" name="password" required autocomplete="current-password">
            <div class="password-strength" id="passwordStrength" style="display: none;"></div>
            <div class="field-error" id="passwordError"></div>
          </div>
          
          <!-- Champs pour inscription uniquement -->
          <div class="signup-fields" style="display: none;">
            <div class="form-group">
              <label for="confirmPassword">Confirmer le mot de passe *</label>
              <input type="password" id="confirmPassword" name="confirmPassword" autocomplete="new-password">
              <div class="field-error" id="confirmPasswordError"></div>
            </div>
            
            <div class="form-group">
              <label for="fullName">Nom complet *</label>
              <input type="text" id="fullName" name="fullName" autocomplete="name">
              <div class="field-error" id="fullNameError"></div>
            </div>
            
            <div class="form-group">
              <label for="phone">Téléphone</label>
              <input type="tel" id="phone" name="phone" autocomplete="tel">
              <div class="field-error" id="phoneError"></div>
            </div>
            
            <div class="form-group">
              <label for="role">Type de compte *</label>
              <select id="role" name="role">
                <option value="client">Client</option>
                <option value="employee">Employé</option>
              </select>
              <div class="field-error" id="roleError"></div>
            </div>
          </div>
          
          <button type="submit" id="submitButton" class="submit-button">
            Se connecter
          </button>
        </form>
        
        <div class="form-footer">
          <button type="button" id="toggleMode" class="toggle-button">
            Pas de compte ? S'inscrire
          </button>
        </div>
      </div>
    `;
    
    container.innerHTML = formHTML;
  }

  /**
   * Configuration des écouteurs d'événements
   */
  setupEventListeners() {
    // Soumission du formulaire
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Basculer entre connexion et inscription
    this.toggleButton.addEventListener('click', () => this.toggleMode());
    
    // Validation en temps réel
    this.emailInput.addEventListener('blur', () => this.validateField('email'));
    this.passwordInput.addEventListener('input', () => this.validatePassword());
    this.confirmPasswordInput?.addEventListener('blur', () => this.validateField('confirmPassword'));
    this.fullNameInput?.addEventListener('blur', () => this.validateField('fullName'));
    this.phoneInput?.addEventListener('blur', () => this.validateField('phone'));
    
    // Prévention des attaques par force brute
    this.form.addEventListener('submit', () => {
      const rateLimit = securityUtils.checkRateLimit('auth_attempt', 5, 300000); // 5 tentatives par 5 minutes
      if (!rateLimit.allowed) {
        this.showError(`Trop de tentatives. Réessayez dans ${rateLimit.retryAfter} secondes.`);
        return false;
      }
    });
  }

  /**
   * Configuration de l'indicateur de force du mot de passe
   */
  setupPasswordStrengthIndicator() {
    this.passwordStrengthIndicator = document.getElementById('passwordStrength');
    
    if (this.passwordInput) {
      this.passwordInput.addEventListener('input', () => {
        if (this.isSignUpMode) {
          this.updatePasswordStrength();
        }
      });
    }
  }

  /**
   * Mise à jour de l'indicateur de force du mot de passe
   */
  updatePasswordStrength() {
    const password = this.passwordInput.value;
    
    if (!password || !this.isSignUpMode) {
      this.passwordStrengthIndicator.style.display = 'none';
      return;
    }
    
    const validation = securityUtils.validatePassword(password);
    this.passwordStrengthIndicator.style.display = 'block';
    
    const strengthColors = {
      'Très faible': '#ff4444',
      'Faible': '#ff8800',
      'Moyen': '#ffaa00',
      'Fort': '#88cc00',
      'Très fort': '#00cc44'
    };
    
    this.passwordStrengthIndicator.innerHTML = `
      <div class="strength-bar">
        <div class="strength-fill" style="width: ${(validation.score / 8) * 100}%; background-color: ${strengthColors[validation.strength]}"></div>
      </div>
      <div class="strength-text" style="color: ${strengthColors[validation.strength]}">
        Force: ${validation.strength}
      </div>
      ${validation.warnings.length > 0 ? `<div class="strength-warnings">${validation.warnings.join(', ')}</div>` : ''}
    `;
  }

  /**
   * Basculer entre mode connexion et inscription
   */
  toggleMode() {
    this.isSignUpMode = !this.isSignUpMode;
    this.updateFormMode();
    this.clearErrors();
  }

  /**
   * Mettre à jour l'affichage selon le mode
   */
  updateFormMode() {
    const title = document.getElementById('formTitle');
    const signupFields = document.querySelector('.signup-fields');
    
    if (this.isSignUpMode) {
      title.textContent = 'Inscription';
      signupFields.style.display = 'block';
      this.submitButton.textContent = 'S\'inscrire';
      this.toggleButton.textContent = 'Déjà un compte ? Se connecter';
      this.passwordInput.setAttribute('autocomplete', 'new-password');
      this.passwordStrengthIndicator.style.display = 'block';
    } else {
      title.textContent = 'Connexion';
      signupFields.style.display = 'none';
      this.submitButton.textContent = 'Se connecter';
      this.toggleButton.textContent = 'Pas de compte ? S\'inscrire';
      this.passwordInput.setAttribute('autocomplete', 'current-password');
      this.passwordStrengthIndicator.style.display = 'none';
    }
  }

  /**
   * Gestion de la soumission du formulaire
   */
  async handleSubmit(event) {
    event.preventDefault();
    
    if (this.isLoading) {
      return;
    }
    
    try {
      this.setLoading(true);
      this.clearErrors();
      
      const formData = this.getFormData();
      
      if (this.isSignUpMode) {
        await this.handleSignUp(formData);
      } else {
        await this.handleSignIn(formData);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
      this.showError(error.message || 'Une erreur est survenue');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Récupération des données du formulaire
   */
  getFormData() {
    const formData = {
      email: this.emailInput.value.trim(),
      password: this.passwordInput.value
    };
    
    if (this.isSignUpMode) {
      formData.confirmPassword = this.confirmPasswordInput.value;
      formData.fullName = this.fullNameInput.value.trim();
      formData.phone = this.phoneInput.value.trim();
      formData.role = this.roleSelect.value;
    }
    
    return formData;
  }

  /**
   * Gestion de l'inscription
   */
  async handleSignUp(formData) {
    console.log('📝 Tentative d\'inscription...');
    
    // Validation côté client
    const validation = formValidator.validateSignUpForm(formData);
    
    if (!validation.isValid) {
      this.showValidationErrors(validation.errors);
      return;
    }
    
    if (validation.warnings.length > 0) {
      this.showWarnings(validation.warnings);
    }
    
    // Appel au service d'authentification
    const result = await authService.signUp(
      validation.sanitizedData.email,
      formData.password,
      validation.sanitizedData
    );
    
    if (result.success) {
      this.showSuccess(result.message);
      // Basculer vers le mode connexion après inscription réussie
      setTimeout(() => {
        this.isSignUpMode = false;
        this.updateFormMode();
        this.clearForm();
      }, 2000);
    } else {
      this.showError(result.error);
    }
  }

  /**
   * Gestion de la connexion
   */
  async handleSignIn(formData) {
    console.log('🔑 Tentative de connexion...');
    
    // Validation basique
    if (!formData.email || !formData.password) {
      this.showError('Email et mot de passe requis');
      return;
    }
    
    // Vérification de sécurité
    const emailCheck = securityUtils.detectInjection(formData.email);
    const passwordCheck = securityUtils.detectInjection(formData.password);
    
    if (!emailCheck.isSafe || !passwordCheck.isSafe) {
      this.showError('Données invalides détectées');
      return;
    }
    
    // Appel au service d'authentification
    const result = await authService.signIn(formData.email, formData.password);
    
    if (result.success) {
      this.showSuccess(result.message);
      // La redirection sera gérée automatiquement par authService
    } else {
      this.showError(result.error);
    }
  }

  /**
   * Validation d'un champ individuel
   */
  validateField(fieldName) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(`${fieldName}Error`);
    
    if (!field || !errorElement) return;
    
    let isValid = true;
    let errorMessage = '';
    
    switch (fieldName) {
      case 'email':
        const emailValidation = securityUtils.validateEmail(field.value);
        isValid = emailValidation.isValid;
        errorMessage = emailValidation.error || '';
        break;
        
      case 'confirmPassword':
        if (this.isSignUpMode && field.value !== this.passwordInput.value) {
          isValid = false;
          errorMessage = 'Les mots de passe ne correspondent pas';
        }
        break;
        
      case 'fullName':
        const sanitizedName = securityUtils.sanitizeInput(field.value, 'name');
        if (this.isSignUpMode && (!sanitizedName || sanitizedName.length < 2)) {
          isValid = false;
          errorMessage = 'Nom complet requis (minimum 2 caractères)';
        }
        break;
        
      case 'phone':
        if (field.value && this.isSignUpMode) {
          const phoneValidation = securityUtils.validatePhone(field.value);
          isValid = phoneValidation.isValid;
          errorMessage = phoneValidation.error || '';
        }
        break;
    }
    
    // Afficher/masquer l'erreur
    if (isValid) {
      errorElement.textContent = '';
      field.classList.remove('error');
    } else {
      errorElement.textContent = errorMessage;
      field.classList.add('error');
    }
    
    return isValid;
  }

  /**
   * Validation du mot de passe
   */
  validatePassword() {
    if (this.isSignUpMode) {
      this.updatePasswordStrength();
    }
    
    const errorElement = document.getElementById('passwordError');
    const password = this.passwordInput.value;
    
    if (this.isSignUpMode && password) {
      const validation = securityUtils.validatePassword(password);
      if (!validation.isValid) {
        errorElement.textContent = validation.errors[0];
        this.passwordInput.classList.add('error');
        return false;
      }
    }
    
    errorElement.textContent = '';
    this.passwordInput.classList.remove('error');
    return true;
  }

  /**
   * Affichage des erreurs de validation
   */
  showValidationErrors(errors) {
    const errorHtml = errors.map(error => `<div class="error-item">• ${error}</div>`).join('');
    this.showError(`<div class="validation-errors">${errorHtml}</div>`);
  }

  /**
   * Affichage des avertissements
   */
  showWarnings(warnings) {
    const warningHtml = warnings.map(warning => `<div class="warning-item">⚠️ ${warning}</div>`).join('');
    this.errorContainer.innerHTML = `<div class="warning-container">${warningHtml}</div>`;
    this.errorContainer.style.display = 'block';
  }

  /**
   * Affichage d'une erreur
   */
  showError(message) {
    this.errorContainer.innerHTML = `<div class="error-message">❌ ${message}</div>`;
    this.errorContainer.style.display = 'block';
    this.errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Affichage d'un message de succès
   */
  showSuccess(message) {
    this.errorContainer.innerHTML = `<div class="success-message">✅ ${message}</div>`;
    this.errorContainer.style.display = 'block';
  }

  /**
   * Effacer les erreurs
   */
  clearErrors() {
    this.errorContainer.style.display = 'none';
    this.errorContainer.innerHTML = '';
    
    // Effacer les erreurs de champs individuels
    const errorElements = document.querySelectorAll('.field-error');
    errorElements.forEach(element => {
      element.textContent = '';
    });
    
    // Retirer les classes d'erreur
    const errorFields = document.querySelectorAll('.error');
    errorFields.forEach(field => {
      field.classList.remove('error');
    });
  }

  /**
   * Vider le formulaire
   */
  clearForm() {
    this.form.reset();
    this.clearErrors();
    this.passwordStrengthIndicator.style.display = 'none';
  }

  /**
   * Gestion de l'état de chargement
   */
  setLoading(loading) {
    this.isLoading = loading;
    
    if (loading) {
      this.loadingIndicator.style.display = 'block';
      this.submitButton.disabled = true;
      this.submitButton.textContent = 'Traitement...';
    } else {
      this.loadingIndicator.style.display = 'none';
      this.submitButton.disabled = false;
      this.submitButton.textContent = this.isSignUpMode ? 'S\'inscrire' : 'Se connecter';
    }
  }
}

// Initialiser le gestionnaire de page
window.authPageManager = new AuthPageManager();

console.log('🔐 Script de la page d\'authentification chargé');