// Correction des problèmes d'authentification et de session
// Ce fichier corrige les problèmes de déconnexion automatique

class AuthenticationManager {
    constructor() {
        this.init()
    }

    async init() {
        try {
            // Initialiser la session Supabase
            const { data: { session }, error } = await window.supabase.auth.getSession()
            if (error) throw error

            // Vérifier l'authentification au chargement de chaque page
            await this.checkAuthOnPageLoad()
            
            // Écouter les changements de session Supabase
            window.supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN') {
                    await this.login({ token: session.access_token, user: session.user })
                } else if (event === 'SIGNED_OUT') {
                    await this.logout()
                }
            })

            // Écouter les changements de localStorage (pour la synchronisation entre onglets)
            window.addEventListener('storage', async (e) => {
                if (e.key === 'token' || e.key === 'isAuthenticated') {
                    await this.handleAuthChange()
                }
            })
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error)
        }
    }

    async checkAuthOnPageLoad() {
        const currentPage = window.location.pathname.split('/').pop()
        const protectedPages = ['profile.html', 'messaging.html', 'confirmation.html', 'rendez-vous.html', 'patient-suivi.html']
        
        try {
            const { data: { session }, error } = await window.supabase.auth.getSession()
            if (error) throw error

            if (protectedPages.includes(currentPage) && !session) {
                this.redirectToLogin()
                return false
            }

            if (session) {
                // Rafraîchir le token si nécessaire
                const { data: { session: refreshedSession }, error: refreshError } = 
                    await window.supabase.auth.refreshSession()
                if (refreshError) throw refreshError

                // Mettre à jour les données de session
                localStorage.setItem('token', refreshedSession.access_token)
                localStorage.setItem('user', JSON.stringify(refreshedSession.user))
            }
            
            // Mettre à jour l'interface utilisateur
            await this.updateAuthUI()
            return true
        } catch (error) {
            console.error('Erreur lors de la vérification de la session:', error)
            if (protectedPages.includes(currentPage)) {
                this.redirectToLogin()
                return false
            }
            return true
        }
    }

    async isAuthenticated() {
        try {
            const { data: { session }, error } = await window.supabase.auth.getSession();
            if (error) throw error;
            return session !== null;
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'authentification:', error);
            return false;
        }
    }

    async login(userData) {
        try {
            const { data: { session }, error } = await window.supabase.auth.getSession();
            if (error) throw error;
            
            if (session) {
                localStorage.setItem('token', session.access_token);
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('user', JSON.stringify(session.user));
                
                // Mettre à jour l'interface
                await this.updateAuthUI();
                
                console.log('Utilisateur connecté avec succès');
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
        }
    }

    async logout() {
        try {
            const { error } = await window.supabase.auth.signOut();
            if (error) throw error;
            
            // Nettoyer toutes les données d'authentification
            localStorage.removeItem('token');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('user');
            localStorage.removeItem('isAdmin');
            
            // Rediriger vers la page d'accueil
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    }

    redirectToLogin() {
        // Sauvegarder la page actuelle pour redirection après connexion
        localStorage.setItem('redirectAfterLogin', window.location.href)
        window.location.href = 'auth.html'
    }

    async handleAuthChange() {
        try {
            const { data: { session }, error } = await window.supabase.auth.getSession()
            if (error) throw error

            const currentPage = window.location.pathname.split('/').pop()
            const protectedPages = ['profile.html', 'messaging.html', 'confirmation.html', 'rendez-vous.html', 'patient-suivi.html']
            
            if (!session && protectedPages.includes(currentPage)) {
                this.redirectToLogin()
                return
            }

            if (session) {
                // Mettre à jour les données de session dans le localStorage
                localStorage.setItem('token', session.access_token)
                localStorage.setItem('isAuthenticated', 'true')
                localStorage.setItem('user', JSON.stringify(session.user))
            }
            
            await this.updateAuthUI()
        } catch (error) {
            console.error('Erreur lors du changement d\'authentification:', error)
        }
    }

    async updateAuthUI() {
        try {
            const { data: { session }, error } = await window.supabase.auth.getSession()
            if (error) throw error

            // Mettre à jour les boutons d'authentification
            const authLinks = document.querySelectorAll('#auth-link, .nav-cta')
            
            authLinks.forEach(link => {
                if (session) {
                    const user = session.user
                    const userName = user.user_metadata?.name || user.email
                    link.innerHTML = `<a href="profile.html" class="btn-profile"><i class="fas fa-user"></i> ${userName}</a>`;
                } else {
                    link.innerHTML = `<a href="auth.html" class="nav-link nav-cta">Connexion</a>`
                }
            })

        // Ajouter bouton de déconnexion si connecté
        if (this.isAuthenticated()) {
            this.addLogoutButton()
        }
        } catch (error) {
            console.error(error);
        }
    }

    addLogoutButton() {
        // Ajouter un bouton de déconnexion dans le profil
        const profileMenus = document.querySelectorAll('.profile-menu, .profile-nav')
        
        profileMenus.forEach(menu => {
            // Vérifier si le bouton existe déjà
            if (!menu.querySelector('.logout-btn')) {
                const logoutItem = document.createElement('li')
                logoutItem.innerHTML = `
                    <a href="#" class="logout-btn" style="color: #e74c3c;">
                        <i class="fas fa-sign-out-alt"></i> Déconnexion
                    </a>
                `
                
                logoutItem.querySelector('.logout-btn').addEventListener('click', (e) => {
                    e.preventDefault()
                    this.logout()
                })
                
                menu.appendChild(logoutItem)
            }
        })
    }

    preventAutoLogout() {
        // Prévenir la déconnexion lors des actions utilisateur
        const actions = ['click', 'keydown', 'scroll', 'mousemove']
        
        actions.forEach(action => {
            document.addEventListener(action, () => {
                // Rafraîchir le token d'authentification
                if (this.isAuthenticated()) {
                    localStorage.setItem('lastActivity', Date.now().toString())
                }
            }, { passive: true })
        })

        // Vérifier périodiquement l'activité
        setInterval(() => {
            const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0')
            const now = Date.now()
            
            // Déconnecter après 2 heures d'inactivité
            if (this.isAuthenticated() && (now - lastActivity) > 2 * 60 * 60 * 1000) {
                console.log('Session expirée par inactivité')
                this.logout()
            }
        }, 60000) // Vérifier chaque minute
    }

    // Méthode pour simuler une connexion (pour les tests)
    simulateLogin(email = 'test@example.com', name = 'Utilisateur Test') {
        this.login({
            email: email,
            name: name,
            token: 'simulated_token_' + Date.now()
        })
    }
}

// Initialiser le gestionnaire d'authentification
const authManager = new AuthenticationManager()

// Exposer globalement pour compatibilité
window.authManager = authManager
window.checkAuth = () => authManager.isAuthenticated()
window.handleLogout = (e) => {
    e.preventDefault()
    authManager.logout()
}

// Auto-connexion pour les tests (à supprimer en production)
if (window.location.search.includes('auto-login=true')) {
    setTimeout(() => {
        authManager.simulateLogin()
        console.log('Connexion automatique activée pour les tests')
    }, 1000)
}

console.log('Gestionnaire d\'authentification initialisé')