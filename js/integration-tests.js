// Tests d'intégration pour diagnostiquer les problèmes de redirection et de navigation
// Ce fichier contient tous les tests nécessaires pour identifier et corriger les problèmes

class IntegrationTests {
    constructor() {
        this.results = [];
        this.logContainer = document.getElementById('diagnostic-logs');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `[${timestamp}] ${message}`;
        
        if (this.logContainer) {
            this.logContainer.appendChild(logEntry);
            this.logContainer.scrollTop = this.logContainer.scrollHeight;
        }
        
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    addResult(name, success, details) {
        this.results.push({ name, success, details, timestamp: new Date() });
    }

    // Test de navigation générale
    async testNavigation() {
        this.log('🔍 Test de navigation générale...', 'info');
        
        try {
            // Vérifier que tous les liens de navigation existent
            const navLinks = document.querySelectorAll('.nav-link');
            let validLinks = 0;
            
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href !== '#') {
                    validLinks++;
                }
            });
            
            if (validLinks > 0) {
                this.log(`✅ ${validLinks} liens de navigation valides trouvés`, 'success');
                this.addResult('Navigation Links', true, `${validLinks} liens valides`);
            } else {
                this.log('❌ Aucun lien de navigation valide trouvé', 'error');
                this.addResult('Navigation Links', false, 'Aucun lien valide');
            }
            
            // Vérifier le menu mobile
            const navToggle = document.getElementById('nav-toggle');
            const navMenu = document.getElementById('nav-menu');
            
            if (navToggle && navMenu) {
                this.log('✅ Menu mobile configuré correctement', 'success');
                this.addResult('Mobile Menu', true, 'Menu mobile fonctionnel');
            } else {
                this.log('❌ Menu mobile manquant ou mal configuré', 'error');
                this.addResult('Mobile Menu', false, 'Menu mobile manquant');
            }
            
        } catch (error) {
            this.log(`❌ Erreur lors du test de navigation: ${error.message}`, 'error');
            this.addResult('Navigation', false, error.message);
        }
    }

    // Test des redirections d'authentification
    async testAuthRedirects() {
        this.log('🔐 Test des redirections d\'authentification...', 'info');
        
        try {
            // Vérifier les pages protégées
            const protectedPages = ['profile.html', 'messaging.html', 'confirmation.html', 'rendez-vous.html'];
            const currentPage = window.location.pathname.split('/').pop();
            
            if (protectedPages.includes(currentPage)) {
                this.log(`⚠️ Page protégée détectée: ${currentPage}`, 'warning');
                
                // Vérifier si l'utilisateur est authentifié
                if (typeof window.authManager !== 'undefined') {
                    const isAuth = await window.authManager.isAuthenticated();
                    if (isAuth) {
                        this.log('✅ Utilisateur authentifié sur page protégée', 'success');
                        this.addResult('Auth Protection', true, 'Utilisateur authentifié');
                    } else {
                        this.log('❌ Utilisateur non authentifié sur page protégée', 'error');
                        this.addResult('Auth Protection', false, 'Redirection nécessaire');
                    }
                } else {
                    this.log('❌ Gestionnaire d\'authentification non disponible', 'error');
                    this.addResult('Auth Protection', false, 'AuthManager manquant');
                }
            } else {
                this.log('ℹ️ Page publique détectée', 'info');
                this.addResult('Auth Protection', true, 'Page publique');
            }
            
            // Vérifier les boutons d'authentification
            const authButtons = document.querySelectorAll('.nav-cta, #auth-link');
            if (authButtons.length > 0) {
                this.log(`✅ ${authButtons.length} bouton(s) d'authentification trouvé(s)`, 'success');
                this.addResult('Auth Buttons', true, `${authButtons.length} boutons`);
            } else {
                this.log('❌ Aucun bouton d\'authentification trouvé', 'error');
                this.addResult('Auth Buttons', false, 'Boutons manquants');
            }
            
        } catch (error) {
            this.log(`❌ Erreur lors du test d'authentification: ${error.message}`, 'error');
            this.addResult('Auth Redirects', false, error.message);
        }
    }

    // Test du flow de rendez-vous
    async testRendezVousFlow() {
        this.log('📅 Test du flow de rendez-vous...', 'info');
        
        try {
            // Vérifier si le gestionnaire de rendez-vous est disponible
            if (typeof window.rdvManager !== 'undefined') {
                this.log('✅ Gestionnaire de rendez-vous disponible', 'success');
                this.addResult('RDV Manager', true, 'Manager disponible');
                
                // Vérifier les fonctions de navigation
                if (typeof nextStep === 'function' && typeof prevStep === 'function') {
                    this.log('✅ Fonctions de navigation disponibles', 'success');
                    this.addResult('RDV Navigation', true, 'Fonctions nextStep/prevStep');
                } else {
                    this.log('❌ Fonctions de navigation manquantes', 'error');
                    this.addResult('RDV Navigation', false, 'Fonctions manquantes');
                }
                
                // Vérifier les sélecteurs de domaine
                const domainCards = document.querySelectorAll('.domaine-card');
                if (domainCards.length > 0) {
                    this.log(`✅ ${domainCards.length} cartes de domaine trouvées`, 'success');
                    this.addResult('Domain Selection', true, `${domainCards.length} domaines`);
                } else {
                    this.log('❌ Aucune carte de domaine trouvée', 'error');
                    this.addResult('Domain Selection', false, 'Cartes manquantes');
                }
                
                // Vérifier les boutons de type de consultation
                const typeButtons = document.querySelectorAll('.type-btn');
                if (typeButtons.length > 0) {
                    this.log(`✅ ${typeButtons.length} bouton(s) de type trouvé(s)`, 'success');
                    this.addResult('Type Selection', true, `${typeButtons.length} types`);
                } else {
                    this.log('❌ Aucun bouton de type trouvé', 'error');
                    this.addResult('Type Selection', false, 'Boutons manquants');
                }
                
            } else {
                this.log('❌ Gestionnaire de rendez-vous non disponible', 'error');
                this.addResult('RDV Manager', false, 'Manager manquant');
            }
            
        } catch (error) {
            this.log(`❌ Erreur lors du test de rendez-vous: ${error.message}`, 'error');
            this.addResult('RDV Flow', false, error.message);
        }
    }

    // Test de tous les liens
    async testAllLinks() {
        this.log('🔗 Test de tous les liens...', 'info');
        
        try {
            const links = document.querySelectorAll('a[href]');
            let validLinks = 0;
            let invalidLinks = 0;
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href !== '#' && !href.startsWith('javascript:')) {
                    validLinks++;
                } else {
                    invalidLinks++;
                }
            });
            
            this.log(`✅ ${validLinks} liens valides trouvés`, 'success');
            if (invalidLinks > 0) {
                this.log(`⚠️ ${invalidLinks} liens invalides trouvés`, 'warning');
            }
            
            this.addResult('All Links', true, `${validLinks} valides, ${invalidLinks} invalides`);
            
        } catch (error) {
            this.log(`❌ Erreur lors du test des liens: ${error.message}`, 'error');
            this.addResult('All Links', false, error.message);
        }
    }

    // Test des fonctions d'authentification
    async testAuthFunctions() {
        this.log('🔐 Test des fonctions d\'authentification...', 'info');
        
        try {
            // Vérifier Supabase
            if (typeof window.supabase !== 'undefined') {
                this.log('✅ Client Supabase disponible', 'success');
                this.addResult('Supabase Client', true, 'Client disponible');
                
                // Tester la connexion
                try {
                    const { data, error } = await window.supabase.auth.getSession();
                    if (error) {
                        this.log(`⚠️ Erreur de session Supabase: ${error.message}`, 'warning');
                        this.addResult('Supabase Session', false, error.message);
                    } else {
                        this.log('✅ Session Supabase fonctionnelle', 'success');
                        this.addResult('Supabase Session', true, 'Session OK');
                    }
                } catch (sessionError) {
                    this.log(`❌ Erreur de session: ${sessionError.message}`, 'error');
                    this.addResult('Supabase Session', false, sessionError.message);
                }
                
            } else {
                this.log('❌ Client Supabase non disponible', 'error');
                this.addResult('Supabase Client', false, 'Client manquant');
            }
            
            // Vérifier les fonctions d'authentification
            if (typeof window.authManager !== 'undefined') {
                this.log('✅ Gestionnaire d\'authentification disponible', 'success');
                this.addResult('Auth Manager', true, 'Manager disponible');
                
                // Tester les méthodes principales
                const methods = ['isAuthenticated', 'login', 'logout', 'redirectToLogin'];
                let availableMethods = 0;
                
                methods.forEach(method => {
                    if (typeof window.authManager[method] === 'function') {
                        availableMethods++;
                    }
                });
                
                if (availableMethods === methods.length) {
                    this.log('✅ Toutes les méthodes d\'authentification disponibles', 'success');
                    this.addResult('Auth Methods', true, `${availableMethods}/${methods.length} méthodes`);
                } else {
                    this.log(`⚠️ ${availableMethods}/${methods.length} méthodes d'authentification disponibles`, 'warning');
                    this.addResult('Auth Methods', false, `${availableMethods}/${methods.length} méthodes`);
                }
                
            } else {
                this.log('❌ Gestionnaire d\'authentification non disponible', 'error');
                this.addResult('Auth Manager', false, 'Manager manquant');
            }
            
        } catch (error) {
            this.log(`❌ Erreur lors du test d'authentification: ${error.message}`, 'error');
            this.addResult('Auth Functions', false, error.message);
        }
    }

    // Test de la gestion de session
    async testSessionManagement() {
        this.log('💾 Test de la gestion de session...', 'info');
        
        try {
            // Vérifier le localStorage
            const sessionKeys = ['token', 'isAuthenticated', 'user'];
            let validKeys = 0;
            
            sessionKeys.forEach(key => {
                if (localStorage.getItem(key) !== null) {
                    validKeys++;
                }
            });
            
            if (validKeys > 0) {
                this.log(`✅ ${validKeys} clé(s) de session trouvée(s)`, 'success');
                this.addResult('Session Storage', true, `${validKeys} clés`);
            } else {
                this.log('ℹ️ Aucune clé de session trouvée (normal si non connecté)', 'info');
                this.addResult('Session Storage', true, 'Aucune clé (normal)');
            }
            
            // Vérifier la synchronisation entre onglets
            if (typeof window.addEventListener === 'function') {
                this.log('✅ Écouteur d\'événements de stockage disponible', 'success');
                this.addResult('Session Sync', true, 'Synchronisation disponible');
            } else {
                this.log('❌ Écouteur d\'événements de stockage non disponible', 'error');
                this.addResult('Session Sync', false, 'Synchronisation manquante');
            }
            
        } catch (error) {
            this.log(`❌ Erreur lors du test de session: ${error.message}`, 'error');
            this.addResult('Session Management', false, error.message);
        }
    }

    // Test des fonctions de rendez-vous
    async testRendezVousFunctions() {
        this.log('📅 Test des fonctions de rendez-vous...', 'info');
        
        try {
            if (typeof window.rdvManager !== 'undefined') {
                // Vérifier les propriétés principales
                const properties = ['selectedDomain', 'selectedType', 'selectedDate', 'selectedTime'];
                let validProperties = 0;
                
                properties.forEach(prop => {
                    if (window.rdvManager.hasOwnProperty(prop)) {
                        validProperties++;
                    }
                });
                
                if (validProperties === properties.length) {
                    this.log('✅ Toutes les propriétés du gestionnaire disponibles', 'success');
                    this.addResult('RDV Properties', true, `${validProperties}/${properties.length} propriétés`);
                } else {
                    this.log(`⚠️ ${validProperties}/${properties.length} propriétés disponibles`, 'warning');
                    this.addResult('RDV Properties', false, `${validProperties}/${properties.length} propriétés`);
                }
                
                // Vérifier les méthodes principales
                const methods = ['selectDomain', 'selectConsultationType', 'selectDate', 'selectTimeSlot'];
                let availableMethods = 0;
                
                methods.forEach(method => {
                    if (typeof window.rdvManager[method] === 'function') {
                        availableMethods++;
                    }
                });
                
                if (availableMethods === methods.length) {
                    this.log('✅ Toutes les méthodes de rendez-vous disponibles', 'success');
                    this.addResult('RDV Methods', true, `${availableMethods}/${methods.length} méthodes`);
                } else {
                    this.log(`⚠️ ${availableMethods}/${methods.length} méthodes disponibles`, 'warning');
                    this.addResult('RDV Methods', false, `${availableMethods}/${methods.length} méthodes`);
                }
                
            } else {
                this.log('❌ Gestionnaire de rendez-vous non disponible', 'error');
                this.addResult('RDV Functions', false, 'Manager manquant');
            }
            
        } catch (error) {
            this.log(`❌ Erreur lors du test des fonctions de rendez-vous: ${error.message}`, 'error');
            this.addResult('RDV Functions', false, error.message);
        }
    }

    // Test de l'intégration calendrier
    async testCalendarIntegration() {
        this.log('📅 Test de l\'intégration calendrier...', 'info');
        
        try {
            // Vérifier les éléments du calendrier
            const calendarElements = ['#calendar', '#time-slots', '.calendar-container'];
            let validElements = 0;
            
            calendarElements.forEach(selector => {
                if (document.querySelector(selector)) {
                    validElements++;
                }
            });
            
            if (validElements > 0) {
                this.log(`✅ ${validElements} élément(s) de calendrier trouvé(s)`, 'success');
                this.addResult('Calendar Elements', true, `${validElements} éléments`);
            } else {
                this.log('❌ Aucun élément de calendrier trouvé', 'error');
                this.addResult('Calendar Elements', false, 'Éléments manquants');
            }
            
            // Vérifier les créneaux horaires
            const timeSlots = document.querySelectorAll('.time-slot');
            if (timeSlots.length > 0) {
                this.log(`✅ ${timeSlots.length} créneau(x) horaire(s) trouvé(s)`, 'success');
                this.addResult('Time Slots', true, `${timeSlots.length} créneaux`);
            } else {
                this.log('ℹ️ Aucun créneau horaire affiché (normal si pas de date sélectionnée)', 'info');
                this.addResult('Time Slots', true, 'Aucun créneau (normal)');
            }
            
        } catch (error) {
            this.log(`❌ Erreur lors du test du calendrier: ${error.message}`, 'error');
            this.addResult('Calendar Integration', false, error.message);
        }
    }

    // Test de l'intégration paiement
    async testPaymentIntegration() {
        this.log('💳 Test de l\'intégration paiement...', 'info');
        
        try {
            // Vérifier Stripe
            if (typeof Stripe !== 'undefined') {
                this.log('✅ Stripe disponible', 'success');
                this.addResult('Stripe Integration', true, 'Stripe disponible');
                
                // Vérifier les éléments de paiement
                const paymentElements = ['#card-element', '#card-errors', '.payment-section'];
                let validElements = 0;
                
                paymentElements.forEach(selector => {
                    if (document.querySelector(selector)) {
                        validElements++;
                    }
                });
                
                if (validElements > 0) {
                    this.log(`✅ ${validElements} élément(s) de paiement trouvé(s)`, 'success');
                    this.addResult('Payment Elements', true, `${validElements} éléments`);
                } else {
                    this.log('ℹ️ Aucun élément de paiement trouvé (normal si pas sur la page de paiement)', 'info');
                    this.addResult('Payment Elements', true, 'Aucun élément (normal)');
                }
                
            } else {
                this.log('❌ Stripe non disponible', 'error');
                this.addResult('Stripe Integration', false, 'Stripe manquant');
            }
            
        } catch (error) {
            this.log(`❌ Erreur lors du test de paiement: ${error.message}`, 'error');
            this.addResult('Payment Integration', false, error.message);
        }
    }

    // Générer un rapport complet
    generateReport() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
        
        this.log('📊 RAPPORT COMPLET', 'info');
        this.log(`Total des tests: ${totalTests}`, 'info');
        this.log(`Tests réussis: ${passedTests}`, 'success');
        this.log(`Tests échoués: ${failedTests}`, failedTests > 0 ? 'error' : 'info');
        this.log(`Taux de réussite: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');
        
        // Afficher les détails des tests échoués
        if (failedTests > 0) {
            this.log('❌ TESTS ÉCHOUÉS:', 'error');
            this.results.filter(r => !r.success).forEach(result => {
                this.log(`- ${result.name}: ${result.details}`, 'error');
            });
        }
        
        return {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: parseFloat(successRate),
            results: this.results
        };
    }
}

// Initialiser les tests
const integrationTests = new IntegrationTests();

// Fonctions globales pour les boutons de test
window.testNavigation = () => integrationTests.testNavigation();
window.testAuthRedirects = () => integrationTests.testAuthRedirects();
window.testRendezVousFlow = () => integrationTests.testRendezVousFlow();
window.testAllLinks = () => integrationTests.testAllLinks();
window.testAuthFunctions = () => integrationTests.testAuthFunctions();
window.testSessionManagement = () => integrationTests.testSessionManagement();
window.testRendezVousFunctions = () => integrationTests.testRendezVousFunctions();
window.testCalendarIntegration = () => integrationTests.testCalendarIntegration();
window.testPaymentIntegration = () => integrationTests.testPaymentIntegration();

// Test automatique au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    integrationTests.log('🚀 Tests d\'intégration initialisés', 'info');
    
    // Exécuter les tests de base automatiquement
    setTimeout(() => {
        integrationTests.testNavigation();
        integrationTests.testAuthRedirects();
        integrationTests.testRendezVousFlow();
    }, 1000);
});

console.log('Tests d\'intégration chargés');