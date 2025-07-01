// Configuration et gestion de l'authentification Supabase
import { supabase } from './supabase-config.js';

class SupabaseAuthManager {
    constructor() {
        this.supabase = supabase;
        this.initializeAuth();
    }

    async initializeAuth() {
        try {
            // Vérifier s'il y a une session existante
            const { data: { session }, error } = await this.supabase.auth.getSession();
            if (error) throw error;

            if (session) {
                // Configurer le refresh automatique du token
                this.setupTokenRefresh();
            }

            // Écouter les changements d'état d'authentification
            this.supabase.auth.onAuthStateChange((event, session) => {
                this.handleAuthStateChange(event, session);
            });

        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
        }
    }

    setupTokenRefresh() {
        // Rafraîchir le token 5 minutes avant son expiration
        setInterval(async () => {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            if (error) {
                console.error('Erreur lors de la récupération de la session:', error);
                return;
            }

            if (session) {
                const { data, error: refreshError } = await this.supabase.auth.refreshSession();
                if (refreshError) {
                    console.error('Erreur lors du rafraîchissement de la session:', refreshError);
                }
            }
        }, 4 * 60 * 1000); // Vérifier toutes les 4 minutes
    }

    async handleAuthStateChange(event, session) {
        switch (event) {
            case 'SIGNED_IN':
                if (session) {
                    localStorage.setItem('token', session.access_token);
                    localStorage.setItem('isAuthenticated', 'true');
                    localStorage.setItem('user', JSON.stringify(session.user));
                    this.setupTokenRefresh();
                }
                break;

            case 'SIGNED_OUT':
            case 'USER_DELETED':
                localStorage.removeItem('token');
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('user');
                break;

            case 'TOKEN_REFRESHED':
                if (session) {
                    localStorage.setItem('token', session.access_token);
                }
                break;
        }
    }

    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            });

            if (error) throw error;
            return { success: true, data };

        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            return { success: true, data };

        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            return { success: true };

        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            return { success: false, error: error.message };
        }
    }

    async resetPassword(email) {
        try {
            const { data, error } = await this.supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            return { success: true, data };

        } catch (error) {
            console.error('Erreur lors de la réinitialisation du mot de passe:', error);
            return { success: false, error: error.message };
        }
    }

    async getCurrentSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            if (error) throw error;
            return { success: true, session };

        } catch (error) {
            console.error('Erreur lors de la récupération de la session:', error);
            return { success: false, error: error.message };
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error) throw error;
            return { success: true, user };

        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            return { success: false, error: error.message };
        }
    }
}

// Créer et exporter une instance unique du gestionnaire d'authentification
export const supabaseAuth = new SupabaseAuthManager();