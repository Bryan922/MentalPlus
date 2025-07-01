// Configuration Supabase pour MentalPlus
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

// Configuration Supabase
const SUPABASE_URL = 'https://xfippugvmgnsmxssptmm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaXBwdWd2bWduc214c3NwdG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDU5MTEsImV4cCI6MjA2NjI4MTkxMX0.xatYodv3YgmjH2wy9ixlB9f22a63q86rbiIDFsfY010'

// Créer le client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Fonctions utilitaires pour la gestion des erreurs
export const handleSupabaseError = (error, context = '') => {
    console.error(`Erreur Supabase ${context}:`, error)
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

// Fonctions pour la gestion des clients
export const clientService = {
    // Créer un nouveau client
    async create(clientData) {
        try {
            const { data, error } = await supabase
                .from('clients')
                .insert([
                    {
                        nom: clientData.nom,
                        email: clientData.email,
                        telephone: clientData.telephone
                    }
                ])
                .select()
                .single()
            
            if (error) throw error
            return { success: true, data }
        } catch (error) {
            return handleSupabaseError(error, 'création client')
        }
    },

    // Récupérer un client par email
    async getByEmail(email) {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('email', email)
                .single()
            
            if (error && error.code !== 'PGRST116') throw error
            return { success: true, data }
        } catch (error) {
            return handleSupabaseError(error, 'récupération client')
        }
    },

    // Mettre à jour un client
    async update(clientId, updates) {
        try {
            const { data, error } = await supabase
                .from('clients')
                .update(updates)
                .eq('id', clientId)
                .select()
                .single()
            
            if (error) throw error
            return { success: true, data }
        } catch (error) {
            return handleSupabaseError(error, 'mise à jour client')
        }
    }
}

// Fonctions pour la gestion des rendez-vous
export const appointmentService = {
    // Créer un nouveau rendez-vous
    async create(appointmentData) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .insert([
                    {
                        client_id: appointmentData.client_id,
                        type: appointmentData.type,
                        date: appointmentData.date,
                        heure: appointmentData.heure,
                        status: 'confirmé'
                    }
                ])
                .select()
                .single()
            
            if (error) throw error
            return { success: true, data }
        } catch (error) {
            return handleSupabaseError(error, 'création rendez-vous')
        }
    },

    // Vérifier la disponibilité d'un créneau
    async checkAvailability(date, heure) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('id')
                .eq('date', date)
                .eq('heure', heure)
                .neq('status', 'annulé')
            
            if (error) throw error
            return { success: true, available: data.length === 0 }
        } catch (error) {
            return handleSupabaseError(error, 'vérification disponibilité')
        }
    },

    // Récupérer les rendez-vous d'un client
    async getByClient(clientId) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('client_id', clientId)
                .order('date', { ascending: true })
            
            if (error) throw error
            return { success: true, data }
        } catch (error) {
            return handleSupabaseError(error, 'récupération rendez-vous client')
        }
    },

    // Récupérer tous les rendez-vous (pour l'espace employé)
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    clients (nom, email, telephone)
                `)
                .order('date', { ascending: true })
            
            if (error) throw error
            return { success: true, data }
        } catch (error) {
            return handleSupabaseError(error, 'récupération tous rendez-vous')
        }
    }
}

// Fonctions pour la gestion des messages de contact
export const contactService = {
    // Créer un nouveau message de contact
    async create(messageData) {
        try {
            const { data, error } = await supabase
                .from('contact_messages')
                .insert([
                    {
                        nom: messageData.nom,
                        email: messageData.email,
                        message: messageData.message
                    }
                ])
                .select()
                .single()
            
            if (error) throw error
            return { success: true, data }
        } catch (error) {
            return handleSupabaseError(error, 'création message contact')
        }
    },

    // Récupérer tous les messages (pour l'espace employé)
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false })
            
            if (error) throw error
            return { success: true, data }
        } catch (error) {
            return handleSupabaseError(error, 'récupération messages contact')
        }
    }
}

// Fonctions pour la gestion des paiements
export const paymentService = {
    // Créer un nouveau paiement
    async create(paymentData) {
        try {
            const { data, error } = await supabase
                .from('payments')
                .insert([
                    {
                        client_id: paymentData.client_id,
                        appointment_id: paymentData.appointment_id,
                        montant: paymentData.montant,
                        status: paymentData.status || 'en attente'
                    }
                ])
                .select()
                .single()
            
            if (error) throw error
            return { success: true, data }
        } catch (error) {
            return handleSupabaseError(error, 'création paiement')
        }
    },

    // Mettre à jour le statut d'un paiement
    async updateStatus(paymentId, status) {
        try {
            const { data, error } = await supabase
                .from('payments')
                .update({ status })
                .eq('id', paymentId)
                .select()
                .single()
            
            if (error) throw error
            return { success: true, data }
        } catch (error) {
            return handleSupabaseError(error, 'mise à jour statut paiement')
        }
    }
}

// Fonctions pour la gestion du suivi psychologique
export const followUpService = {
    // Créer un nouveau suivi
    async create(followUpData) {
        try {
            const { data, error } = await supabase
                .from('follow_ups')
                .insert([
                    {
                        client_id: followUpData.client_id,
                        appointment_id: followUpData.appointment_id,
                        mental_state: followUpData.mental_state,
                        score: followUpData.score,
                        notes: followUpData.notes
                    }
                ])
                .select()
                .single()
            
            if (error) throw error
            return { success: true, data }
        } catch (error) {
            return handleSupabaseError(error, 'création suivi')
        }
    },

    // Récupérer le suivi d'un client
    async getByClient(clientId) {
        try {
            const { data, error } = await supabase
                .from('follow_ups')
                .select(`
                    *,
                    appointments (date, heure, type)
                `)
                .eq('client_id', clientId)
                .order('created_at', { ascending: true })
            
            if (error) throw error
            return { success: true, data }
        } catch (error) {
            return handleSupabaseError(error, 'récupération suivi client')
        }
    }
}

// Initialisation et test de connexion au chargement
document.addEventListener('DOMContentLoaded', async () => {
    const result = await testConnection()
    if (!result.success) {
        console.error('Échec de la connexion à Supabase:', result.error)
    }
})