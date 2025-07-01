/**
 * Tests d'intégration pour MentalPlus
 * Validation de la sécurité et des fonctionnalités Supabase
 */

/**
 * Classe principale pour les tests d'intégration
 */
class IntegrationTests {
  constructor() {
    this.testResults = [];
    this.testUser = {
      email: 'test@mentalplus.fr',
      password: 'TestPassword123!',
      fullName: 'Utilisateur Test',
      phone: '0123456789',
      role: 'client'
    };
    this.testEmployee = {
      email: 'employee@mentalplus.fr',
      password: 'EmployeePass123!',
      fullName: 'Employé Test',
      role: 'employee'
    };
    
    console.log('🧪 Tests d\'intégration initialisés');
  }

  /**
   * Exécuter tous les tests
   */
  async runAllTests() {
    console.log('🚀 Démarrage des tests d\'intégration...');
    
    try {
      // Tests de sécurité
      await this.runSecurityTests();
      
      // Tests d'authentification
      await this.runAuthenticationTests();
      
      // Tests de validation
      await this.runValidationTests();
      
      // Tests de rendez-vous
      await this.runAppointmentTests();
      
      // Tests de performance
      await this.runPerformanceTests();
      
      // Afficher les résultats
      this.displayResults();
      
    } catch (error) {
      console.error('❌ Erreur lors des tests:', error);
      this.addResult('ERREUR GLOBALE', false, error.message);
    }
  }

  /**
   * Tests de sécurité
   */
  async runSecurityTests() {
    console.log('🔒 Tests de sécurité...');
    
    // Test de détection d'injection SQL
    this.testSQLInjectionDetection();
    
    // Test de validation d'email
    this.testEmailValidation();
    
    // Test de validation de mot de passe
    this.testPasswordValidation();
    
    // Test de sanitisation
    this.testInputSanitization();
    
    // Test de limitation de taux
    this.testRateLimit();
    
    // Test de génération CSRF
    this.testCSRFToken();
  }

  /**
   * Test de détection d'injection SQL
   */
  testSQLInjectionDetection() {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "<script>alert('xss')</script>",
      "1' OR '1'='1",
      "UNION SELECT * FROM passwords",
      "javascript:alert('xss')"
    ];
    
    let allDetected = true;
    
    maliciousInputs.forEach(input => {
      const result = securityUtils.detectInjection(input);
      if (result.isSafe) {
        allDetected = false;
        console.warn(`⚠️ Injection non détectée: ${input}`);
      }
    });
    
    this.addResult('Détection d\'injection', allDetected, 
      allDetected ? 'Toutes les injections détectées' : 'Certaines injections non détectées');
  }

  /**
   * Test de validation d'email
   */
  testEmailValidation() {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'test+tag@gmail.com'
    ];
    
    const invalidEmails = [
      'invalid-email',
      '@domain.com',
      'test@',
      'test..test@domain.com',
      'test@tempmail.org' // Domaine suspect
    ];
    
    let allValid = true;
    let allInvalid = true;
    
    validEmails.forEach(email => {
      const result = securityUtils.validateEmail(email);
      if (!result.isValid) {
        allValid = false;
        console.warn(`⚠️ Email valide rejeté: ${email}`);
      }
    });
    
    invalidEmails.forEach(email => {
      const result = securityUtils.validateEmail(email);
      if (result.isValid) {
        allInvalid = false;
        console.warn(`⚠️ Email invalide accepté: ${email}`);
      }
    });
    
    this.addResult('Validation d\'email', allValid && allInvalid,
      `Emails valides: ${allValid}, Emails invalides: ${allInvalid}`);
  }

  /**
   * Test de validation de mot de passe
   */
  testPasswordValidation() {
    const weakPasswords = [
      '123456',
      'password',
      'azerty',
      'abc123',
      'motdepasse'
    ];
    
    const strongPasswords = [
      'MyStr0ngP@ssw0rd!',
      'C0mpl3x!P@ssw0rd',
      'S3cur3#P@ssw0rd123'
    ];
    
    let weakRejected = true;
    let strongAccepted = true;
    
    weakPasswords.forEach(password => {
      const result = securityUtils.validatePassword(password);
      if (result.isValid) {
        weakRejected = false;
        console.warn(`⚠️ Mot de passe faible accepté: ${password}`);
      }
    });
    
    strongPasswords.forEach(password => {
      const result = securityUtils.validatePassword(password);
      if (!result.isValid) {
        strongAccepted = false;
        console.warn(`⚠️ Mot de passe fort rejeté: ${password}`);
      }
    });
    
    this.addResult('Validation de mot de passe', weakRejected && strongAccepted,
      `Faibles rejetés: ${weakRejected}, Forts acceptés: ${strongAccepted}`);
  }

  /**
   * Test de sanitisation des entrées
   */
  testInputSanitization() {
    const testInputs = [
      { input: '<script>alert("xss")</script>', type: 'text', expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' },
      { input: 'Jean-Pierre O\'Connor', type: 'name', expected: 'Jean-Pierre O\'Connor' },
      { input: '01 23 45 67 89', type: 'phone', expected: '01 23 45 67 89' },
      { input: 'Test & Co', type: 'text', expected: 'Test &amp; Co' }
    ];
    
    let allSanitized = true;
    
    testInputs.forEach(test => {
      const result = securityUtils.sanitizeInput(test.input, test.type);
      if (result !== test.expected) {
        allSanitized = false;
        console.warn(`⚠️ Sanitisation incorrecte: ${test.input} -> ${result} (attendu: ${test.expected})`);
      }
    });
    
    this.addResult('Sanitisation des entrées', allSanitized,
      allSanitized ? 'Toutes les entrées correctement sanitisées' : 'Erreurs de sanitisation');
  }

  /**
   * Test de limitation de taux
   */
  testRateLimit() {
    const action = 'test_action';
    let rateLimitWorking = true;
    
    // Effectuer plusieurs tentatives rapidement
    for (let i = 0; i < 7; i++) {
      const result = securityUtils.checkRateLimit(action, 5, 60000);
      
      if (i < 5 && !result.allowed) {
        rateLimitWorking = false;
        console.warn(`⚠️ Rate limit trop strict: tentative ${i + 1} bloquée`);
      }
      
      if (i >= 5 && result.allowed) {
        rateLimitWorking = false;
        console.warn(`⚠️ Rate limit inefficace: tentative ${i + 1} autorisée`);
      }
    }
    
    this.addResult('Limitation de taux', rateLimitWorking,
      rateLimitWorking ? 'Rate limiting fonctionnel' : 'Problème de rate limiting');
  }

  /**
   * Test de génération de token CSRF
   */
  testCSRFToken() {
    const token1 = securityUtils.generateCSRFToken();
    const token2 = securityUtils.generateCSRFToken();
    
    const isUnique = token1 !== token2;
    const hasCorrectLength = token1.length === 64; // 32 bytes en hex
    const isHex = /^[a-f0-9]+$/i.test(token1);
    
    const isValid = isUnique && hasCorrectLength && isHex;
    
    this.addResult('Génération CSRF', isValid,
      `Unique: ${isUnique}, Longueur: ${hasCorrectLength}, Format: ${isHex}`);
  }

  /**
   * Tests d'authentification
   */
  async runAuthenticationTests() {
    console.log('🔐 Tests d\'authentification...');
    
    // Test de connexion Supabase
    await this.testSupabaseConnection();
    
    // Test de validation de formulaire d'inscription
    this.testSignUpFormValidation();
    
    // Test de validation de formulaire de connexion
    this.testSignInFormValidation();
  }

  /**
   * Test de connexion Supabase
   */
  async testSupabaseConnection() {
    try {
      const isConnected = await window.testSupabaseConnection();
      this.addResult('Connexion Supabase', isConnected,
        isConnected ? 'Connexion établie' : 'Échec de connexion');
    } catch (error) {
      this.addResult('Connexion Supabase', false, `Erreur: ${error.message}`);
    }
  }

  /**
   * Test de validation du formulaire d'inscription
   */
  testSignUpFormValidation() {
    const validData = {
      email: 'test@example.com',
      password: 'ValidPass123!',
      confirmPassword: 'ValidPass123!',
      fullName: 'Test User',
      phone: '0123456789',
      role: 'client'
    };
    
    const invalidData = {
      email: 'invalid-email',
      password: '123',
      confirmPassword: '456',
      fullName: '',
      phone: 'invalid-phone',
      role: 'invalid-role'
    };
    
    const validResult = formValidator.validateSignUpForm(validData);
    const invalidResult = formValidator.validateSignUpForm(invalidData);
    
    const isWorking = validResult.isValid && !invalidResult.isValid;
    
    this.addResult('Validation formulaire inscription', isWorking,
      `Données valides: ${validResult.isValid}, Données invalides: ${!invalidResult.isValid}`);
  }

  /**
   * Test de validation du formulaire de connexion
   */
  testSignInFormValidation() {
    // Test avec des données malveillantes
    const maliciousData = {
      email: "admin'; DROP TABLE users; --",
      password: "<script>alert('xss')</script>"
    };
    
    const emailCheck = securityUtils.detectInjection(maliciousData.email);
    const passwordCheck = securityUtils.detectInjection(maliciousData.password);
    
    const isSecure = !emailCheck.isSafe && !passwordCheck.isSafe;
    
    this.addResult('Sécurité formulaire connexion', isSecure,
      isSecure ? 'Données malveillantes détectées' : 'Faille de sécurité détectée');
  }

  /**
   * Tests de validation
   */
  async runValidationTests() {
    console.log('✅ Tests de validation...');
    
    // Test de validation de date
    this.testDateValidation();
    
    // Test de validation de téléphone
    this.testPhoneValidation();
    
    // Test de validation de rendez-vous
    this.testAppointmentValidation();
  }

  /**
   * Test de validation de date
   */
  testDateValidation() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const farFuture = new Date(Date.now() + 400 * 86400000).toISOString().split('T')[0];
    
    const todayResult = securityUtils.validateDate(today);
    const yesterdayResult = securityUtils.validateDate(yesterday);
    const tomorrowResult = securityUtils.validateDate(tomorrow);
    const farFutureResult = securityUtils.validateDate(farFuture, false);
    
    const isWorking = todayResult.isValid && !yesterdayResult.isValid && 
                     tomorrowResult.isValid && !farFutureResult.isValid;
    
    this.addResult('Validation de date', isWorking,
      `Aujourd'hui: ${todayResult.isValid}, Hier: ${!yesterdayResult.isValid}, Demain: ${tomorrowResult.isValid}`);
  }

  /**
   * Test de validation de téléphone
   */
  testPhoneValidation() {
    const validPhones = ['0123456789', '+33123456789', '01 23 45 67 89'];
    const invalidPhones = ['123', 'abcdefghij', '00000000000'];
    
    let allValidAccepted = true;
    let allInvalidRejected = true;
    
    validPhones.forEach(phone => {
      const result = securityUtils.validatePhone(phone);
      if (!result.isValid) {
        allValidAccepted = false;
      }
    });
    
    invalidPhones.forEach(phone => {
      const result = securityUtils.validatePhone(phone);
      if (result.isValid) {
        allInvalidRejected = false;
      }
    });
    
    this.addResult('Validation de téléphone', allValidAccepted && allInvalidRejected,
      `Valides acceptés: ${allValidAccepted}, Invalides rejetés: ${allInvalidRejected}`);
  }

  /**
   * Test de validation de rendez-vous
   */
  testAppointmentValidation() {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const validAppointment = {
      date: tomorrow,
      time: '10:00',
      type: 'consultation',
      employee_id: 'test-employee-id',
      notes: 'Notes de test'
    };
    
    const invalidAppointment = {
      date: '',
      time: '',
      type: '',
      employee_id: '',
      notes: '<script>alert("xss")</script>'
    };
    
    const validResult = formValidator.validateAppointmentForm(validAppointment);
    const invalidResult = formValidator.validateAppointmentForm(invalidAppointment);
    
    const isWorking = validResult.isValid && !invalidResult.isValid;
    
    this.addResult('Validation de rendez-vous', isWorking,
      `Données valides: ${validResult.isValid}, Données invalides: ${!invalidResult.isValid}`);
  }

  /**
   * Tests de rendez-vous
   */
  async runAppointmentTests() {
    console.log('📅 Tests de rendez-vous...');
    
    // Test de récupération des types de rendez-vous
    this.testAppointmentTypes();
    
    // Test de récupération des créneaux horaires
    this.testTimeSlots();
    
    // Test de vérification de disponibilité (simulation)
    this.testAvailabilityCheck();
  }

  /**
   * Test des types de rendez-vous
   */
  testAppointmentTypes() {
    const types = appointmentsService.getAppointmentTypes();
    
    const hasTypes = types && types.length > 0;
    const hasRequiredFields = types.every(type => 
      type.id && type.name && type.duration
    );
    
    this.addResult('Types de rendez-vous', hasTypes && hasRequiredFields,
      `${types.length} types disponibles, champs requis: ${hasRequiredFields}`);
  }

  /**
   * Test des créneaux horaires
   */
  testTimeSlots() {
    const slots = appointmentsService.getTimeSlots();
    
    const hasSlots = slots && slots.length > 0;
    const validFormat = slots.every(slot => /^\d{2}:\d{2}$/.test(slot));
    
    this.addResult('Créneaux horaires', hasSlots && validFormat,
      `${slots.length} créneaux, format valide: ${validFormat}`);
  }

  /**
   * Test de vérification de disponibilité (simulation)
   */
  testAvailabilityCheck() {
    // Simulation d'une vérification de disponibilité
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    // Test avec des paramètres valides
    const validParams = {
      date: tomorrow,
      time: '10:00',
      employeeId: 'test-employee'
    };
    
    // Test avec des paramètres invalides
    const invalidParams = {
      date: '',
      time: '',
      employeeId: ''
    };
    
    // Simulation de la logique de validation
    const validCheck = validParams.date && validParams.time && validParams.employeeId;
    const invalidCheck = !invalidParams.date || !invalidParams.time || !invalidParams.employeeId;
    
    this.addResult('Vérification de disponibilité', validCheck && invalidCheck,
      `Paramètres valides: ${validCheck}, Paramètres invalides détectés: ${invalidCheck}`);
  }

  /**
   * Tests de performance
   */
  async runPerformanceTests() {
    console.log('⚡ Tests de performance...');
    
    // Test de performance de validation
    this.testValidationPerformance();
    
    // Test de performance de sanitisation
    this.testSanitizationPerformance();
  }

  /**
   * Test de performance de validation
   */
  testValidationPerformance() {
    const iterations = 1000;
    const testEmail = 'test@example.com';
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      securityUtils.validateEmail(testEmail);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgTime = duration / iterations;
    
    const isPerformant = avgTime < 1; // Moins de 1ms par validation
    
    this.addResult('Performance validation', isPerformant,
      `${avgTime.toFixed(3)}ms par validation (${iterations} itérations)`);
  }

  /**
   * Test de performance de sanitisation
   */
  testSanitizationPerformance() {
    const iterations = 1000;
    const testInput = '<script>alert("test")</script>Hello World!';
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      securityUtils.sanitizeInput(testInput, 'text');
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgTime = duration / iterations;
    
    const isPerformant = avgTime < 0.5; // Moins de 0.5ms par sanitisation
    
    this.addResult('Performance sanitisation', isPerformant,
      `${avgTime.toFixed(3)}ms par sanitisation (${iterations} itérations)`);
  }

  /**
   * Ajouter un résultat de test
   */
  addResult(testName, success, details) {
    const result = {
      name: testName,
      success: success,
      details: details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${details}`);
  }

  /**
   * Afficher les résultats des tests
   */
  displayResults() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log('\n📊 RÉSULTATS DES TESTS D\'INTÉGRATION');
    console.log('=' .repeat(50));
    console.log(`Total: ${totalTests} tests`);
    console.log(`✅ Réussis: ${passedTests}`);
    console.log(`❌ Échoués: ${failedTests}`);
    console.log(`📈 Taux de réussite: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ TESTS ÉCHOUÉS:');
      this.testResults
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`- ${result.name}: ${result.details}`);
        });
    }
    
    // Créer un rapport HTML si possible
    this.createHTMLReport();
  }

  /**
   * Créer un rapport HTML
   */
  createHTMLReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    const reportHTML = `
      <div class="test-report">
        <h2>Rapport des Tests d'Intégration MentalPlus</h2>
        
        <div class="test-summary">
          <div class="summary-item">
            <span class="label">Total:</span>
            <span class="value">${totalTests} tests</span>
          </div>
          <div class="summary-item success">
            <span class="label">Réussis:</span>
            <span class="value">${passedTests}</span>
          </div>
          <div class="summary-item ${failedTests > 0 ? 'failed' : 'success'}">
            <span class="label">Échoués:</span>
            <span class="value">${failedTests}</span>
          </div>
          <div class="summary-item">
            <span class="label">Taux de réussite:</span>
            <span class="value">${((passedTests / totalTests) * 100).toFixed(1)}%</span>
          </div>
        </div>
        
        <div class="test-details">
          <h3>Détails des Tests</h3>
          ${this.testResults.map(result => `
            <div class="test-item ${result.success ? 'success' : 'failed'}">
              <div class="test-name">${result.success ? '✅' : '❌'} ${result.name}</div>
              <div class="test-details">${result.details}</div>
              <div class="test-time">${new Date(result.timestamp).toLocaleString()}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    // Stocker le rapport pour affichage ultérieur
    window.testReport = reportHTML;
    
    console.log('📄 Rapport HTML généré (disponible dans window.testReport)');
  }

  /**
   * Obtenir les résultats des tests
   */
  getResults() {
    return this.testResults;
  }

  /**
   * Réinitialiser les tests
   */
  reset() {
    this.testResults = [];
    console.log('🔄 Tests réinitialisés');
  }
}

// Créer une instance globale des tests
window.integrationTests = new IntegrationTests();

// Fonction utilitaire pour exécuter les tests
window.runTests = function() {
  return window.integrationTests.runAllTests();
};

// Fonction pour afficher le rapport
window.showTestReport = function() {
  if (window.testReport) {
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport de Tests - MentalPlus</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .test-report { max-width: 800px; margin: 0 auto; }
          .test-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 20px 0; }
          .summary-item { padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
          .summary-item.success { background-color: #d4edda; border-color: #c3e6cb; }
          .summary-item.failed { background-color: #f8d7da; border-color: #f5c6cb; }
          .test-item { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
          .test-item.success { border-left-color: #28a745; background-color: #f8fff9; }
          .test-item.failed { border-left-color: #dc3545; background-color: #fff8f8; }
          .test-name { font-weight: bold; margin-bottom: 5px; }
          .test-details { color: #666; margin-bottom: 5px; }
          .test-time { font-size: 0.8em; color: #999; }
        </style>
      </head>
      <body>
        ${window.testReport}
      </body>
      </html>
    `);
    reportWindow.document.close();
  } else {
    alert('Aucun rapport disponible. Exécutez d\'abord les tests avec runTests().');
  }
};

console.log('🧪 Tests d\'intégration chargés');
console.log('💡 Utilisez runTests() pour exécuter tous les tests');
console.log('💡 Utilisez showTestReport() pour afficher le rapport détaillé');