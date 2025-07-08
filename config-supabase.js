// Script de configuration automatique pour Supabase
// Ce fichier aide à configurer rapidement les variables d'environnement

class SupabaseConfigurator {
    constructor() {
        this.config = {
            SUPABASE_URL: '',
            SUPABASE_ANON_KEY: '',
            STRIPE_PUBLISHABLE_KEY: ''
        };
        this.init();
    }

    init() {
        this.createConfigInterface();
        this.loadExistingConfig();
    }

    createConfigInterface() {
        // Créer l'interface de configuration si elle n'existe pas
        if (!document.getElementById('supabase-config-interface')) {
            const interface = document.createElement('div');
            interface.id = 'supabase-config-interface';
            interface.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 400px;
                    background: white;
                    border: 2px solid #3498db;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    z-index: 10000;
                    font-family: Arial, sans-serif;
                ">
                    <h3 style="margin: 0 0 15px 0; color: #2c3e50;">
                        <i class="fas fa-cog"></i> Configuration Supabase
                    </h3>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                            Project URL:
                        </label>
                        <input type="text" id="supabase-url" placeholder="https://xxxxxxxxxxxxx.supabase.co" 
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                            Anon Key:
                        </label>
                        <input type="text" id="supabase-anon-key" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                            Stripe Key (optionnel):
                        </label>
                        <input type="text" id="stripe-key" placeholder="pk_test_..." 
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button onclick="supabaseConfig.saveConfig()" 
                                style="flex: 1; padding: 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-save"></i> Sauvegarder
                        </button>
                        <button onclick="supabaseConfig.testConfig()" 
                                style="flex: 1; padding: 10px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-test"></i> Tester
                        </button>
                        <button onclick="supabaseConfig.hideInterface()" 
                                style="padding: 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div id="config-status" style="margin-top: 15px; padding: 10px; border-radius: 4px; display: none;"></div>
                </div>
            `;
            document.body.appendChild(interface);
        }
    }

    loadExistingConfig() {
        // Essayer de charger la configuration existante
        try {
            // Lire depuis localStorage si disponible
            const savedConfig = localStorage.getItem('supabaseConfig');
            if (savedConfig) {
                this.config = JSON.parse(savedConfig);
                this.updateInterface();
            }
        } catch (error) {
            console.log('Aucune configuration existante trouvée');
        }
    }

    updateInterface() {
        const urlInput = document.getElementById('supabase-url');
        const anonKeyInput = document.getElementById('supabase-anon-key');
        const stripeKeyInput = document.getElementById('stripe-key');
        
        if (urlInput) urlInput.value = this.config.SUPABASE_URL;
        if (anonKeyInput) anonKeyInput.value = this.config.SUPABASE_ANON_KEY;
        if (stripeKeyInput) stripeKeyInput.value = this.config.STRIPE_PUBLISHABLE_KEY;
    }

    saveConfig() {
        const urlInput = document.getElementById('supabase-url');
        const anonKeyInput = document.getElementById('supabase-anon-key');
        const stripeKeyInput = document.getElementById('stripe-key');
        
        this.config.SUPABASE_URL = urlInput.value.trim();
        this.config.SUPABASE_ANON_KEY = anonKeyInput.value.trim();
        this.config.STRIPE_PUBLISHABLE_KEY = stripeKeyInput.value.trim();
        
        // Valider la configuration
        if (!this.config.SUPABASE_URL || !this.config.SUPABASE_ANON_KEY) {
            this.showStatus('Veuillez remplir l\'URL et la clé Supabase', 'error');
            return;
        }
        
        // Sauvegarder dans localStorage
        try {
            localStorage.setItem('supabaseConfig', JSON.stringify(this.config));
            this.showStatus('Configuration sauvegardée avec succès !', 'success');
            
            // Mettre à jour le fichier de configuration
            this.updateConfigFile();
        } catch (error) {
            this.showStatus('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    }

    async testConfig() {
        if (!this.config.SUPABASE_URL || !this.config.SUPABASE_ANON_KEY) {
            this.showStatus('Veuillez d\'abord sauvegarder la configuration', 'error');
            return;
        }
        
        this.showStatus('Test de connexion en cours...', 'info');
        
        try {
            // Créer un client Supabase temporaire pour le test
            const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
            const supabase = createClient(this.config.SUPABASE_URL, this.config.SUPABASE_ANON_KEY);
            
            // Tester la connexion
            const { data, error } = await supabase.from('clients').select('count', { count: 'exact', head: true });
            
            if (error) throw error;
            
            this.showStatus('✅ Connexion réussie ! Configuration valide.', 'success');
        } catch (error) {
            this.showStatus('❌ Erreur de connexion: ' + error.message, 'error');
        }
    }

    updateConfigFile() {
        // Créer le contenu du fichier de configuration
        const configContent = `// Configuration Supabase pour MentalSerenity
// Ce fichier a été généré automatiquement

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

// Configuration Supabase
const SUPABASE_URL = '${this.config.SUPABASE_URL}'
const SUPABASE_ANON_KEY = '${this.config.SUPABASE_ANON_KEY}'

// Créer le client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Configuration Stripe (optionnel)
export const STRIPE_PUBLISHABLE_KEY = '${this.config.STRIPE_PUBLISHABLE_KEY}'

// Fonctions utilitaires pour la gestion des erreurs
export const handleSupabaseError = (error, context = '') => {
    console.error(\`Erreur Supabase \${context}:\`, error)
    return {
        success: false,
        error: error.message || 'Une erreur est survenue'
    }
}

// Fonction pour vérifier la connexion
export const testConnection = async () => {
    try {
        const { data, error } = await supabase.from('clients').select('count', { count: 'exact', head: true })
        if (error) throw error
        console.log('Connexion Supabase réussie')
        return { success: true }
    } catch (error) {
        return handleSupabaseError(error, 'test de connexion')
    }
}

// ... (reste du fichier avec toutes les fonctions)`;

        // Créer un lien de téléchargement
        const blob = new Blob([configContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'supabase-config-updated.js';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showStatus('📁 Fichier de configuration généré et téléchargé', 'success');
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('config-status');
        if (statusDiv) {
            statusDiv.style.display = 'block';
            statusDiv.textContent = message;
            statusDiv.className = `status-${type}`;
            statusDiv.style.backgroundColor = type === 'success' ? '#d4edda' : 
                                            type === 'error' ? '#f8d7da' : 
                                            type === 'warning' ? '#fff3cd' : '#d1ecf1';
            statusDiv.style.color = type === 'success' ? '#155724' : 
                                   type === 'error' ? '#721c24' : 
                                   type === 'warning' ? '#856404' : '#0c5460';
        }
    }

    hideInterface() {
        const interface = document.getElementById('supabase-config-interface');
        if (interface) {
            interface.style.display = 'none';
        }
    }

    showInterface() {
        const interface = document.getElementById('supabase-config-interface');
        if (interface) {
            interface.style.display = 'block';
        }
    }
}

// Instance globale
const supabaseConfig = new SupabaseConfigurator();

// Fonctions globales
window.showSupabaseConfig = () => supabaseConfig.showInterface();
window.hideSupabaseConfig = () => supabaseConfig.hideInterface();

// Afficher automatiquement l'interface si pas de configuration
document.addEventListener('DOMContentLoaded', () => {
    const savedConfig = localStorage.getItem('supabaseConfig');
    if (!savedConfig) {
        setTimeout(() => {
            supabaseConfig.showInterface();
        }, 1000);
    }
});

console.log('🔧 Configuration Supabase chargée. Utilisez showSupabaseConfig() pour afficher l\'interface.'); 