// Système d'authentification unifié pour MentalSerenity
// Ce fichier corrige tous les problèmes de persistance de session

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

// Configuration Supabase
const SUPABASE_URL = 'https://xfippugvmgnsmxssptmm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaXBwdWd2bWduc214c3NwdG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDU5MTEsImV4cCI6MjA2NjI4MTkxMX0.xatYodv3YgmjH2wy9ixlB9f22a63q86rbiIDFsfY010'

// Créer le client Supabase avec persistance de session
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage
    }
})

class UnifiedAuthManager {
    constructor() {
        this.supabase = supabase
        this.currentUser = null
        this.currentSession = null
        this.isInitialized = false
        
        this.init()
    }

    async init() {
        console.log('🔐 Initialisation du système d\'authentification unifié...')
        
        try {
            // Vérifier la session existante au chargement
            await this.checkExistingSession()
            
            // Configurer les écouteurs d'événements d'authentification
            this.setupAuthListeners()
            
            // Configurer le refresh automatique des tokens
            this.setupTokenRefresh()
            
            // Synchroniser avec le localStorage
            this.syncWithLocalStorage()
            
            this.isInitialized = true
            console.log('✅ Système d\'authentification initialisé avec succès')
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de l\'authentification:', error)
        }
    }

    async checkExistingSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession()
            
            if (error) {
                console.warn('⚠️ Erreur lors de la récupération de la session:', error)
                return
            }

            if (session) {
                console.log('✅ Session existante trouvée:', session.user.email)
                this.currentSession = session
                this.currentUser = session.user
                this.updateLocalStorage(session)
                this.updateUI()
            } else {
                console.log('ℹ️ Aucune session existante')
                this.clearLocalStorage()
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de la vérification de session:', error)
        }
    }

    setupAuthListeners() {
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔄 Changement d\'état d\'authentification:', event, session?.user?.email)
            
            switch (event) {
                case 'SIGNED_IN':
                    if (session) {
                        this.currentSession = session
                        this.currentUser = session.user
                        this.updateLocalStorage(session)
                        this.updateUI()
                        console.log('✅ Utilisateur connecté:', session.user.email)
                    }
                    break

                case 'SIGNED_OUT':
                case 'USER_DELETED':
                    this.currentSession = null
                    this.currentUser = null
                    this.clearLocalStorage()
                    this.updateUI()
                    console.log('🚪 Utilisateur déconnecté')
                    break

                case 'TOKEN_REFRESHED':
                    if (session) {
                        this.currentSession = session
                        this.updateLocalStorage(session)
                        console.log('🔄 Token rafraîchi')
                    }
                    break

                case 'USER_UPDATED':
                    if (session) {
                        this.currentUser = session.user
                        this.updateLocalStorage(session)
                        this.updateUI()
                        console.log('👤 Utilisateur mis à jour')
                    }
                    break
            }
        })
    }

    setupTokenRefresh() {
        // Rafraîchir le token 5 minutes avant expiration
        setInterval(async () => {
            if (this.currentSession) {
                try {
                    const { data, error } = await this.supabase.auth.refreshSession()
                    if (error) {
                        console.warn('⚠️ Erreur lors du rafraîchissement du token:', error)
                    } else if (data.session) {
                        console.log('🔄 Token rafraîchi automatiquement')
                        this.currentSession = data.session
                        this.updateLocalStorage(data.session)
                    }
                } catch (error) {
                    console.error('❌ Erreur lors du rafraîchissement automatique:', error)
                }
            }
        }, 4 * 60 * 1000) // Vérifier toutes les 4 minutes
    }

    updateLocalStorage(session) {
        if (session) {
            localStorage.setItem('supabase.auth.token', session.access_token)
            localStorage.setItem('supabase.auth.refresh_token', session.refresh_token)
            localStorage.setItem('user', JSON.stringify(session.user))
            localStorage.setItem('isAuthenticated', 'true')
            localStorage.setItem('sessionExpiresAt', session.expires_at)
        }
    }

    clearLocalStorage() {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('supabase.auth.refresh_token')
        localStorage.removeItem('user')
        localStorage.removeItem('isAuthenticated')
        localStorage.removeItem('sessionExpiresAt')
        localStorage.removeItem('isAdmin')
    }

    syncWithLocalStorage() {
        // Synchroniser avec les anciennes données si nécessaire
        const oldToken = localStorage.getItem('token')
        const oldUser = localStorage.getItem('user')
        
        if (oldToken && oldUser && !this.currentSession) {
            console.log('🔄 Synchronisation avec les anciennes données...')
            try {
                const user = JSON.parse(oldUser)
                localStorage.setItem('user', JSON.stringify(user))
                localStorage.setItem('isAuthenticated', 'true')
            } catch (error) {
                console.warn('⚠️ Erreur lors de la synchronisation:', error)
            }
        }
    }

    updateUI() {
        // Mettre à jour l'interface utilisateur selon l'état d'authentification
        const authLinks = document.querySelectorAll('#auth-link, .nav-cta')
        
        authLinks.forEach(link => {
            if (this.currentUser) {
                const userName = this.currentUser.user_metadata?.name || this.currentUser.email
                link.innerHTML = `
                    <a href="profile.html" class="btn-profile">
                        <i class="fas fa-user"></i> ${userName}
                    </a>
                `
            } else {
                link.innerHTML = `<a href="auth.html" class="nav-link nav-cta">Connexion</a>`
            }
        })

        // Ajouter bouton de déconnexion si connecté
        if (this.currentUser) {
            this.addLogoutButton()
        }
    }

    addLogoutButton() {
        const profileMenus = document.querySelectorAll('.profile-menu, .profile-nav')
        
        profileMenus.forEach(menu => {
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

    // Méthodes d'authentification
    async signUp(email, password, userData = {}) {
        try {
            console.log('📝 Tentative d\'inscription:', email)
            
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            })

            if (error) throw error

            console.log('✅ Inscription réussie:', data.user?.email)
            return { success: true, data }

        } catch (error) {
            console.error('❌ Erreur lors de l\'inscription:', error)
            return { success: false, error: error.message }
        }
    }

    async signIn(email, password) {
        try {
            console.log('🔑 Tentative de connexion:', email)
            
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) throw error

            console.log('✅ Connexion réussie:', data.user?.email)
            return { success: true, data }

        } catch (error) {
            console.error('❌ Erreur lors de la connexion:', error)
            return { success: false, error: error.message }
        }
    }

    async signOut() {
        try {
            console.log('🚪 Tentative de déconnexion')
            
            const { error } = await this.supabase.auth.signOut()
            if (error) throw error

            console.log('✅ Déconnexion réussie')
            return { success: true }

        } catch (error) {
            console.error('❌ Erreur lors de la déconnexion:', error)
            return { success: false, error: error.message }
        }
    }

    async resetPassword(email) {
        try {
            console.log('🔧 Tentative de réinitialisation de mot de passe:', email)
            
            const { data, error } = await this.supabase.auth.resetPasswordForEmail(email)
            if (error) throw error

            console.log('✅ Email de réinitialisation envoyé')
            return { success: true, data }

        } catch (error) {
            console.error('❌ Erreur lors de la réinitialisation:', error)
            return { success: false, error: error.message }
        }
    }

    // Méthodes utilitaires
    async getCurrentSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession()
            if (error) throw error
            return { success: true, session }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser()
            if (error) throw error
            return { success: true, user }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    isAuthenticated() {
        return !!this.currentSession && !!this.currentUser
    }

    getCurrentUserData() {
        return this.currentUser
    }

    // Méthodes de redirection
    redirectToLogin() {
        localStorage.setItem('redirectAfterLogin', window.location.href)
        window.location.href = 'auth.html'
    }

    async logout() {
        const result = await this.signOut()
        if (result.success) {
            window.location.href = 'index.html'
        }
    }

    // Méthode pour vérifier l'authentification sur les pages protégées
    async checkAuthOnPageLoad() {
        const currentPage = window.location.pathname.split('/').pop()
        const protectedPages = ['profile.html', 'messaging.html', 'confirmation.html', 'rendez-vous.html', 'patient-suivi.html']
        
        if (protectedPages.includes(currentPage)) {
            if (!this.isAuthenticated()) {
                console.log('🚫 Page protégée - redirection vers authentification')
                this.redirectToLogin()
                return false
            }
        }
        
        return true
    }
}

// Créer et exporter une instance unique
const unifiedAuth = new UnifiedAuthManager()

// Exposer globalement pour compatibilité
window.supabase = supabase
window.unifiedAuth = unifiedAuth
window.authManager = unifiedAuth

// Fonctions globales pour compatibilité
window.checkAuth = () => unifiedAuth.isAuthenticated()
window.handleLogout = (e) => {
    e.preventDefault()
    unifiedAuth.logout()
}

console.log('🔐 Système d\'authentification unifié chargé')

export { unifiedAuth, supabase } 