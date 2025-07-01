/**
 * Utilitaires de sécurité pour MentalPlus
 * Fonctions de validation, sanitisation et protection côté client
 */

/**
 * Classe principale pour les utilitaires de sécurité
 */
class SecurityUtils {
  constructor() {
    this.csrfToken = this.generateCSRFToken();
    this.rateLimitStore = new Map();
    this.suspiciousActivityLog = [];
    
    console.log('🔒 Utilitaires de sécurité initialisés');
  }

  /**
   * Génération d'un token CSRF
   */
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Obtenir le token CSRF actuel
   */
  getCSRFToken() {
    return this.csrfToken;
  }

  /**
   * Validation stricte des emails
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email requis' };
    }
    
    // Nettoyer l'email
    email = email.trim().toLowerCase();
    
    // Regex stricte pour email
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Format d\'email invalide' };
    }
    
    // Vérifications supplémentaires
    if (email.length > 254) {
      return { isValid: false, error: 'Email trop long' };
    }
    
    // Vérifier les domaines suspects
    const suspiciousDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
    const domain = email.split('@')[1];
    
    if (suspiciousDomains.includes(domain)) {
      return { isValid: false, error: 'Domaine email non autorisé' };
    }
    
    return { isValid: true, email: email };
  }

  /**
   * Validation de la force du mot de passe
   */
  validatePassword(password) {
    const errors = [];
    const warnings = [];
    
    if (!password || typeof password !== 'string') {
      return { isValid: false, errors: ['Mot de passe requis'], score: 0 };
    }
    
    let score = 0;
    
    // Longueur minimum
    if (password.length < 8) {
      errors.push('Au moins 8 caractères requis');
    } else {
      score += 1;
      if (password.length >= 12) score += 1;
      if (password.length >= 16) score += 1;
    }
    
    // Caractères requis
    if (!/[a-z]/.test(password)) {
      errors.push('Au moins une minuscule requise');
    } else {
      score += 1;
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Au moins une majuscule requise');
    } else {
      score += 1;
    }
    
    if (!/\d/.test(password)) {
      errors.push('Au moins un chiffre requis');
    } else {
      score += 1;
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      warnings.push('Caractères spéciaux recommandés pour plus de sécurité');
    } else {
      score += 2;
    }
    
    // Vérifications de sécurité avancées
    if (/(..).*\1/.test(password)) {
      warnings.push('Évitez les répétitions de caractères');
      score -= 1;
    }
    
    if (/123|abc|qwe|asd|zxc/i.test(password)) {
      warnings.push('Évitez les séquences communes');
      score -= 1;
    }
    
    // Mots de passe communs
    const commonPasswords = [
      'password', 'motdepasse', '123456', 'azerty', 'qwerty',
      'admin', 'root', 'user', 'test', 'guest'
    ];
    
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Mot de passe trop commun');
      score = 0;
    }
    
    // Calculer le niveau de sécurité
    let strength = 'Très faible';
    if (score >= 8) strength = 'Très fort';
    else if (score >= 6) strength = 'Fort';
    else if (score >= 4) strength = 'Moyen';
    else if (score >= 2) strength = 'Faible';
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
      strength
    };
  }

  /**
   * Sanitisation des entrées utilisateur
   */
  sanitizeInput(input, type = 'text') {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Nettoyer les espaces
    input = input.trim();
    
    switch (type) {
      case 'name':
        // Autoriser seulement lettres, espaces, tirets et apostrophes
        return input.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '').substring(0, 100);
        
      case 'phone':
        // Autoriser seulement chiffres, espaces, tirets et parenthèses
        return input.replace(/[^0-9\s\-\(\)\+]/g, '').substring(0, 20);
        
      case 'text':
        // Échapper les caractères HTML dangereux
        return input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .substring(0, 1000);
        
      case 'notes':
        // Pour les notes, autoriser plus de caractères mais limiter la taille
        return input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .substring(0, 2000);
        
      default:
        return input.substring(0, 255);
    }
  }

  /**
   * Détection d'injections potentielles
   */
  detectInjection(input) {
    if (!input || typeof input !== 'string') {
      return { isSafe: true };
    }
    
    const sqlPatterns = [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
      /(script|javascript|vbscript|onload|onerror|onclick)/i,
      /(<|>|&lt;|&gt;)/i
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        this.logSuspiciousActivity('injection_attempt', { input: input.substring(0, 100) });
        return {
          isSafe: false,
          reason: 'Contenu potentiellement dangereux détecté'
        };
      }
    }
    
    return { isSafe: true };
  }

  /**
   * Limitation de taux côté client
   */
  checkRateLimit(action, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    const key = `${action}_${this.getClientFingerprint()}`;
    
    if (!this.rateLimitStore.has(key)) {
      this.rateLimitStore.set(key, []);
    }
    
    const attempts = this.rateLimitStore.get(key);
    
    // Nettoyer les anciennes tentatives
    const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      this.logSuspiciousActivity('rate_limit_exceeded', { action, attempts: validAttempts.length });
      return {
        allowed: false,
        retryAfter: Math.ceil((validAttempts[0] + windowMs - now) / 1000)
      };
    }
    
    validAttempts.push(now);
    this.rateLimitStore.set(key, validAttempts);
    
    return { allowed: true };
  }

  /**
   * Génération d'une empreinte client simple
   */
  getClientFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Client fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Hacher l'empreinte
    return this.simpleHash(fingerprint);
  }

  /**
   * Fonction de hachage simple
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32bit
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Chiffrement simple côté client (pour données non critiques)
   */
  async encryptData(data, key = null) {
    try {
      if (!key) {
        key = await this.generateEncryptionKey();
      }
      
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
        key,
        dataBuffer
      );
      
      return {
        encrypted: Array.from(new Uint8Array(encrypted)),
        key: await crypto.subtle.exportKey('raw', key)
      };
      
    } catch (error) {
      console.error('❌ Erreur de chiffrement:', error);
      return null;
    }
  }

  /**
   * Génération d'une clé de chiffrement
   */
  async generateEncryptionKey() {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Validation de date
   */
  validateDate(dateString, allowPast = false) {
    if (!dateString) {
      return { isValid: false, error: 'Date requise' };
    }
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Format de date invalide' };
    }
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (!allowPast && date < now) {
      return { isValid: false, error: 'La date ne peut pas être dans le passé' };
    }
    
    // Vérifier que la date n'est pas trop loin dans le futur (1 an max)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    
    if (date > maxDate) {
      return { isValid: false, error: 'Date trop éloignée dans le futur' };
    }
    
    return { isValid: true, date };
  }

  /**
   * Validation de numéro de téléphone
   */
  validatePhone(phone) {
    if (!phone) {
      return { isValid: false, error: 'Numéro de téléphone requis' };
    }
    
    // Nettoyer le numéro
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    
    // Vérifier le format français
    const frenchPhoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/;
    
    if (!frenchPhoneRegex.test(cleanPhone)) {
      return { isValid: false, error: 'Format de téléphone invalide' };
    }
    
    return { isValid: true, phone: cleanPhone };
  }

  /**
   * Journalisation des activités suspectes
   */
  logSuspiciousActivity(type, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      details,
      fingerprint: this.getClientFingerprint(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.suspiciousActivityLog.push(logEntry);
    
    // Garder seulement les 100 dernières entrées
    if (this.suspiciousActivityLog.length > 100) {
      this.suspiciousActivityLog.shift();
    }
    
    console.warn('⚠️ Activité suspecte détectée:', type, details);
    
    // En production, vous pourriez envoyer cela à votre serveur
    // this.sendSecurityAlert(logEntry);
  }

  /**
   * Obtenir le journal des activités suspectes
   */
  getSuspiciousActivityLog() {
    return this.suspiciousActivityLog;
  }

  /**
   * Nettoyer les données de sécurité
   */
  cleanup() {
    this.rateLimitStore.clear();
    this.suspiciousActivityLog.length = 0;
    console.log('🧹 Données de sécurité nettoyées');
  }

  /**
   * Vérification de l'intégrité de la page
   */
  checkPageIntegrity() {
    // Vérifier si des scripts externes non autorisés ont été ajoutés
    const scripts = document.querySelectorAll('script[src]');
    const allowedDomains = [
      window.location.hostname,
      'cdn.jsdelivr.net',
      'unpkg.com',
      'cdn.skypack.dev',
      'supabase.co'
    ];
    
    for (const script of scripts) {
      const src = script.src;
      const isAllowed = allowedDomains.some(domain => src.includes(domain));
      
      if (!isAllowed) {
        this.logSuspiciousActivity('unauthorized_script', { src });
        console.warn('⚠️ Script non autorisé détecté:', src);
      }
    }
  }
}

/**
 * Classe pour la validation des formulaires
 */
class FormValidator {
  constructor(securityUtils) {
    this.security = securityUtils;
  }

  /**
   * Validation complète d'un formulaire d'inscription
   */
  validateSignUpForm(formData) {
    const errors = [];
    const warnings = [];
    
    // Validation email
    const emailValidation = this.security.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.push(`Email: ${emailValidation.error}`);
    }
    
    // Validation mot de passe
    const passwordValidation = this.security.validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors.map(e => `Mot de passe: ${e}`));
    }
    warnings.push(...passwordValidation.warnings);
    
    // Validation confirmation mot de passe
    if (formData.password !== formData.confirmPassword) {
      errors.push('Les mots de passe ne correspondent pas');
    }
    
    // Validation nom
    const sanitizedName = this.security.sanitizeInput(formData.fullName, 'name');
    if (!sanitizedName || sanitizedName.length < 2) {
      errors.push('Nom complet requis (minimum 2 caractères)');
    }
    
    // Validation téléphone (optionnel)
    if (formData.phone) {
      const phoneValidation = this.security.validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        errors.push(`Téléphone: ${phoneValidation.error}`);
      }
    }
    
    // Vérification d'injection
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        const injectionCheck = this.security.detectInjection(value);
        if (!injectionCheck.isSafe) {
          errors.push(`${key}: ${injectionCheck.reason}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: {
        email: emailValidation.email,
        fullName: sanitizedName,
        phone: formData.phone ? this.security.sanitizeInput(formData.phone, 'phone') : null,
        role: formData.role || 'client'
      }
    };
  }

  /**
   * Validation d'un formulaire de rendez-vous
   */
  validateAppointmentForm(formData) {
    const errors = [];
    
    // Validation date
    const dateValidation = this.security.validateDate(formData.date);
    if (!dateValidation.isValid) {
      errors.push(`Date: ${dateValidation.error}`);
    }
    
    // Validation heure
    if (!formData.time) {
      errors.push('Heure requise');
    }
    
    // Validation type
    if (!formData.type) {
      errors.push('Type de rendez-vous requis');
    }
    
    // Validation employé
    if (!formData.employee_id) {
      errors.push('Employé requis');
    }
    
    // Validation notes (optionnel)
    let sanitizedNotes = null;
    if (formData.notes) {
      sanitizedNotes = this.security.sanitizeInput(formData.notes, 'notes');
      const injectionCheck = this.security.detectInjection(formData.notes);
      if (!injectionCheck.isSafe) {
        errors.push(`Notes: ${injectionCheck.reason}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: {
        date: formData.date,
        time: formData.time,
        type: formData.type,
        employee_id: formData.employee_id,
        notes: sanitizedNotes
      }
    };
  }
}

// Créer les instances globales
window.securityUtils = new SecurityUtils();
window.formValidator = new FormValidator(window.securityUtils);

// Vérification périodique de l'intégrité
setInterval(() => {
  window.securityUtils.checkPageIntegrity();
}, 30000); // Toutes les 30 secondes

// Nettoyage périodique
setInterval(() => {
  window.securityUtils.cleanup();
}, 300000); // Toutes les 5 minutes

console.log('🔒 Utilitaires de sécurité chargés et actifs');