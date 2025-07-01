// Script d'initialisation des tables Supabase pour MentalPlus
import { supabase } from './supabase-config.js'

// Fonction pour créer les tables si elles n'existent pas
export const initializeDatabase = async () => {
    console.log('Initialisation de la base de données Supabase...')
    
    try {
        // Vérifier si les tables existent en tentant une requête simple
        const tables = ['clients', 'appointments', 'contact_messages', 'payments', 'follow_ups']
        const results = []
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('count', { count: 'exact', head: true })
                
                if (error) {
                    console.warn(`Table ${table} n'existe pas ou erreur:`, error.message)
                    results.push({ table, exists: false, error: error.message })
                } else {
                    console.log(`Table ${table} existe`)
                    results.push({ table, exists: true })
                }
            } catch (err) {
                console.warn(`Erreur lors de la vérification de ${table}:`, err)
                results.push({ table, exists: false, error: err.message })
            }
        }
        
        return {
            success: true,
            message: 'Vérification des tables terminée',
            results
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

// Fonction pour insérer des données de test
export const insertTestData = async () => {
    console.log('Insertion de données de test...')
    
    try {
        // Créer un client de test
        const { data: testClient, error: clientError } = await supabase
            .from('clients')
            .upsert([
                {
                    nom: 'Client Test',
                    email: 'test@mentalplus.com',
                    telephone: '0123456789'
                }
            ], { onConflict: 'email' })
            .select()
            .single()
        
        if (clientError) {
            console.warn('Erreur création client test:', clientError.message)
        } else {
            console.log('Client test créé:', testClient)
        }
        
        // Créer un message de contact de test
        const { data: testMessage, error: messageError } = await supabase
            .from('contact_messages')
            .insert([
                {
                    nom: 'Test Contact',
                    email: 'contact@test.com',
                    message: 'Message de test pour vérifier le fonctionnement du formulaire de contact.'
                }
            ])
            .select()
            .single()
        
        if (messageError) {
            console.warn('Erreur création message test:', messageError.message)
        } else {
            console.log('Message test créé:', testMessage)
        }
        
        return {
            success: true,
            message: 'Données de test insérées avec succès'
        }
    } catch (error) {
        console.error('Erreur lors de l\'insertion des données de test:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

// Fonction pour afficher les statistiques de la base de données
export const getDatabaseStats = async () => {
    try {
        const stats = {}
        const tables = ['clients', 'appointments', 'contact_messages', 'payments', 'follow_ups']
        
        for (const table of tables) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true })
                
                if (error) {
                    stats[table] = { count: 0, error: error.message }
                } else {
                    stats[table] = { count: count || 0 }
                }
            } catch (err) {
                stats[table] = { count: 0, error: err.message }
            }
        }
        
        return {
            success: true,
            stats
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        }
    }
}

// Fonction utilitaire pour formater les dates
export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR')
}

// Fonction utilitaire pour formater les heures
export const formatTime = (time) => {
    return time.substring(0, 5) // Format HH:MM
}

// Fonction pour valider les données avant insertion
export const validateClientData = (data) => {
    const errors = []
    
    if (!data.nom || data.nom.trim().length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères')
    }
    
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('L\'email n\'est pas valide')
    }
    
    if (!data.telephone || !/^[0-9+\-\s]{10,}$/.test(data.telephone)) {
        errors.push('Le numéro de téléphone n\'est pas valide')
    }
    
    return {
        isValid: errors.length === 0,
        errors
    }
}

// Fonction pour valider les données de rendez-vous
export const validateAppointmentData = (data) => {
    const errors = []
    
    if (!data.type || !['classique', 'nuit'].includes(data.type)) {
        errors.push('Le type de consultation doit être "classique" ou "nuit"')
    }
    
    if (!data.date || new Date(data.date) < new Date()) {
        errors.push('La date doit être dans le futur')
    }
    
    if (!data.heure || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.heure)) {
        errors.push('L\'heure doit être au format HH:MM')
    }
    
    return {
        isValid: errors.length === 0,
        errors
    }
}

// Initialisation automatique au chargement
if (typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
        console.log('Démarrage de l\'initialisation Supabase...')
        const initResult = await initializeDatabase()
        console.log('Résultat initialisation:', initResult)
        
        const statsResult = await getDatabaseStats()
        console.log('Statistiques base de données:', statsResult)
    })
}