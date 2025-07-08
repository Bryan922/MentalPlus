// Script de correction automatique pour les problèmes de redirection et de navigation
// Ce fichier corrige automatiquement les problèmes courants identifiés

class AutoFix {
    constructor() {
        this.fixesApplied = [];
        this.init();
    }

    init() {
        console.log('🔧 Initialisation des corrections automatiques...');
        
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.applyFixes());
        } else {
            this.applyFixes();
        }
    }

    applyFixes() {
        console.log('🔧 Application des corrections automatiques...');
        
        this.fixNavigationIssues();
        this.fixAuthIssues();
        this.fixRendezVousIssues();
        this.fixFormIssues();
        this.fixLinkIssues();
        
        console.log(`✅ ${this.fixesApplied.length} correction(s) appliquée(s):`, this.fixesApplied);
    }

    // Correction des problèmes de navigation
    fixNavigationIssues() {
        // Corriger les liens de navigation manquants
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href === '#') {
                link.href = 'index.html';
                this.fixesApplied.push('Lien de navigation corrigé');
            }
        });

        // Corriger le menu mobile
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (navToggle && navMenu) {
            // Supprimer les anciens écouteurs pour éviter les doublons
            const newToggle = navToggle.cloneNode(true);
            navToggle.parentNode.replaceChild(newToggle, navToggle);
            
            newToggle.addEventListener('click', () => {
                newToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
                
                if (navMenu.classList.contains('active')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            });
            
            this.fixesApplied.push('Menu mobile corrigé');
        }

        // Corriger les liens actifs
        this.fixActiveLinks();
    }

    // Correction des liens actifs
    fixActiveLinks() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === currentPage) {
                link.classList.add('active');
            }
        });
        
        this.fixesApplied.push('Liens actifs corrigés');
    }

    // Correction des problèmes d'authentification
    fixAuthIssues() {
        // Corriger les boutons d'authentification
        const authButtons = document.querySelectorAll('.nav-cta, #auth-link');
        authButtons.forEach(button => {
            if (!button.href || button.href === '#') {
                button.href = 'auth.html';
                this.fixesApplied.push('Bouton d\'authentification corrigé');
            }
        });

        // Corriger les redirections d'authentification
        if (typeof window.authManager === 'undefined') {
            this.createAuthManager();
            this.fixesApplied.push('Gestionnaire d\'authentification créé');
        }

        // Corriger les pages protégées
        this.fixProtectedPages();
    }

    // Créer un gestionnaire d'authentification de base
    createAuthManager() {
        window.authManager = {
            isAuthenticated: async () => {
                const token = localStorage.getItem('token');
                return !!token;
            },
            
            redirectToLogin: () => {
                localStorage.setItem('redirectAfterLogin', window.location.href);
                window.location.href = 'auth.html';
            },
            
            logout: () => {
                localStorage.removeItem('token');
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            }
        };
    }

    // Correction des pages protégées
    fixProtectedPages() {
        const protectedPages = ['profile.html', 'messaging.html', 'confirmation.html', 'rendez-vous.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            const token = localStorage.getItem('token');
            if (!token) {
                this.fixesApplied.push('Redirection vers authentification');
                setTimeout(() => {
                    window.authManager.redirectToLogin();
                }, 100);
            }
        }
    }

    // Correction des problèmes de rendez-vous
    fixRendezVousIssues() {
        // Corriger les fonctions de navigation manquantes
        if (typeof nextStep !== 'function') {
            window.nextStep = function() {
                const currentStep = document.querySelector('.form-step.active');
                const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
                const nextStepNumber = currentStepNumber + 1;
                
                if (!validateStep(currentStepNumber)) {
                    return;
                }

                document.querySelector(`#step${currentStepNumber}`).classList.remove('active');
                document.querySelector(`#step${nextStepNumber}`).classList.add('active');
                updateStepIndicators(nextStepNumber);
            };
            this.fixesApplied.push('Fonction nextStep créée');
        }

        if (typeof prevStep !== 'function') {
            window.prevStep = function() {
                const currentStep = document.querySelector('.form-step.active');
                const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
                const prevStepNumber = currentStepNumber - 1;
                
                document.querySelector(`#step${currentStepNumber}`).classList.remove('active');
                document.querySelector(`#step${prevStepNumber}`).classList.add('active');
                updateStepIndicators(prevStepNumber);
            };
            this.fixesApplied.push('Fonction prevStep créée');
        }

        if (typeof updateStepIndicators !== 'function') {
            window.updateStepIndicators = function(activeStep) {
                document.querySelectorAll('.step').forEach(step => {
                    const stepNumber = parseInt(step.dataset.step);
                    step.classList.remove('active');
                    if (stepNumber === activeStep) {
                        step.classList.add('active');
                    }
                });
            };
            this.fixesApplied.push('Fonction updateStepIndicators créée');
        }

        if (typeof validateStep !== 'function') {
            window.validateStep = function(stepNumber) {
                switch(stepNumber) {
                    case 1:
                        const selectedDomain = document.querySelector('.domaine-card.selected');
                        if (!selectedDomain) {
                            alert('Veuillez sélectionner un domaine d\'intervention');
                            return false;
                        }
                        return true;
                    case 2:
                        const selectedDate = document.querySelector('.day.selected');
                        const selectedTime = document.querySelector('.time-slot.selected');
                        if (!selectedDate || !selectedTime) {
                            alert('Veuillez sélectionner une date et une heure');
                            return false;
                        }
                        return true;
                    default:
                        return true;
                }
            };
            this.fixesApplied.push('Fonction validateStep créée');
        }

        // Corriger les sélecteurs de domaine
        this.fixDomainSelection();
        
        // Corriger les sélecteurs de type de consultation
        this.fixConsultationTypeSelection();
    }

    // Correction de la sélection de domaine
    fixDomainSelection() {
        const domainCards = document.querySelectorAll('.domaine-card');
        domainCards.forEach(card => {
            // Supprimer les anciens écouteurs
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            newCard.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Retirer la sélection précédente
                document.querySelectorAll('.domaine-card').forEach(c => c.classList.remove('selected'));
                
                // Ajouter la sélection actuelle
                newCard.classList.add('selected');
                
                // Mettre à jour le résumé
                const domainText = newCard.querySelector('h3')?.textContent || 'Domaine sélectionné';
                const summaryDomain = document.getElementById('summary-domaine');
                if (summaryDomain) {
                    summaryDomain.textContent = domainText;
                }
                
                // Activer le bouton suivant
                const nextBtn = document.querySelector('.btn-next');
                if (nextBtn) {
                    nextBtn.disabled = false;
                    nextBtn.classList.remove('disabled');
                }
            });
        });
        
        this.fixesApplied.push('Sélection de domaine corrigée');
    }

    // Correction de la sélection de type de consultation
    fixConsultationTypeSelection() {
        const typeButtons = document.querySelectorAll('.type-btn');
        typeButtons.forEach(button => {
            // Supprimer les anciens écouteurs
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Retirer la sélection précédente
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                
                // Ajouter la sélection actuelle
                newButton.classList.add('active');
                
                // Mettre à jour le prix
                const type = newButton.dataset.type;
                const price = type === 'night' ? '80€' : '60€';
                const priceElement = document.getElementById('summary-price');
                if (priceElement) {
                    priceElement.textContent = price;
                }
            });
        });
        
        this.fixesApplied.push('Sélection de type de consultation corrigée');
    }

    // Correction des problèmes de formulaire
    fixFormIssues() {
        // Corriger les formulaires sans action
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (!form.action || form.action === '#') {
                form.action = 'javascript:void(0)';
                this.fixesApplied.push('Action de formulaire corrigée');
            }
        });

        // Corriger les boutons de soumission
        const submitButtons = document.querySelectorAll('button[type="submit"]');
        submitButtons.forEach(button => {
            if (!button.onclick && !button.form) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleFormSubmission(button);
                });
                this.fixesApplied.push('Bouton de soumission corrigé');
            }
        });
    }

    // Gestion de la soumission de formulaire
    handleFormSubmission(button) {
        const form = button.closest('form');
        if (form) {
            // Validation basique
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                } else {
                    field.classList.remove('error');
                }
            });
            
            if (isValid) {
                // Simuler la soumission
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
                
                setTimeout(() => {
                    // Rediriger vers la page appropriée selon le contexte
                    const currentPage = window.location.pathname.split('/').pop();
                    if (currentPage === 'rendez-vous.html') {
                        window.location.href = 'payment.html';
                    } else if (currentPage === 'auth.html') {
                        window.location.href = 'profile.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1000);
            }
        }
    }

    // Correction des problèmes de liens
    fixLinkIssues() {
        // Corriger les liens cassés
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            // Corriger les liens relatifs manquants
            if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('javascript:') && !href.includes('.')) {
                link.href = href + '.html';
                this.fixesApplied.push('Lien relatif corrigé');
            }
            
            // Corriger les liens vers des pages inexistantes
            if (href && href.includes('.html')) {
                const pageName = href.split('/').pop();
                const commonPages = [
                    'index.html', 'auth.html', 'profile.html', 'rendez-vous.html',
                    'payment.html', 'confirmation.html', 'contact.html', 'services.html',
                    'tarifs.html', 'messaging.html', 'espace-client.html'
                ];
                
                if (!commonPages.includes(pageName)) {
                    link.href = 'index.html';
                    this.fixesApplied.push('Lien vers page inexistante corrigé');
                }
            }
        });
    }

    // Obtenir le rapport des corrections
    getReport() {
        return {
            totalFixes: this.fixesApplied.length,
            fixes: this.fixesApplied,
            timestamp: new Date().toISOString()
        };
    }
}

// Initialiser les corrections automatiques
const autoFix = new AutoFix();

// Exposer globalement
window.autoFix = autoFix;

console.log('Corrections automatiques initialisées'); 