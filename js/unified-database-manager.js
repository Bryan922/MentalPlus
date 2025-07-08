// Gestionnaire de base de données unifié pour MentalSerenity
// Ce fichier centralise toutes les opérations de base de données

import { supabase } from './supabase-config.js';

class UnifiedDatabaseManager {
    constructor() {
        this.currentUser = null;
        this.currentUserType = null; // 'client' ou 'employee'
    }

    // ========================================
    // GESTION DES UTILISATEURS ET AUTHENTIFICATION
    // ========================================

    async initializeUser(user, userType = 'client') {
        this.currentUser = user;
        this.currentUserType = userType;
        console.log(`Utilisateur initialisé: ${user.email} (${userType})`);
    }

    // ========================================
    // GESTION DES CLIENTS
    // ========================================

    async createClient(clientData) {
        try {
            const { data, error } = await supabase
                .from('clients')
                .insert([{
                    nom: clientData.nom,
                    prenom: clientData.prenom,
                    email: clientData.email,
                    telephone: clientData.telephone,
                    adresse: clientData.adresse,
                    ville: clientData.ville,
                    code_postal: clientData.code_postal,
                    pays: clientData.pays || 'France',
                    date_naissance: clientData.date_naissance,
                    genre: clientData.genre,
                    profession: clientData.profession,
                    situation_familiale: clientData.situation_familiale,
                    antecedents_medicaux: clientData.antecedents_medicaux,
                    allergies: clientData.allergies,
                    medicaments_actuels: clientData.medicaments_actuels,
                    motif_consultation: clientData.motif_consultation
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur création client:', error);
            return { success: false, error: error.message };
        }
    }

    async getClientByEmail(email) {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('email', email)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur récupération client:', error);
            return { success: false, error: error.message };
        }
    }

    async getClientById(clientId) {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', clientId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur récupération client par ID:', error);
            return { success: false, error: error.message };
        }
    }

    async updateClient(clientId, updates) {
        try {
            const { data, error } = await supabase
                .from('clients')
                .update(updates)
                .eq('id', clientId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur mise à jour client:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllClients() {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('nom', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur récupération tous clients:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // GESTION DES RENDEZ-VOUS
    // ========================================

    async createAppointment(appointmentData) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .insert([{
                    client_id: appointmentData.client_id,
                    employee_id: appointmentData.employee_id,
                    appointment_date: appointmentData.date,
                    heure: appointmentData.heure,
                    duree: appointmentData.duree || 60,
                    type: appointmentData.type,
                    domaine: appointmentData.domaine,
                    status: appointmentData.status || 'confirmé',
                    notes: appointmentData.notes,
                    motif: appointmentData.motif
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur création rendez-vous:', error);
            return { success: false, error: error.message };
        }
    }

    async getAppointmentsByClient(clientId) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    employees (nom, prenom, email)
                `)
                .eq('client_id', clientId)
                .order('appointment_date', { ascending: false })
                .order('heure', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur récupération rendez-vous client:', error);
            return { success: false, error: error.message };
        }
    }

    async getAppointmentsByEmployee(employeeId) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    clients (nom, prenom, email, telephone)
                `)
                .eq('employee_id', employeeId)
                .order('appointment_date', { ascending: true })
                .order('heure', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur récupération rendez-vous employé:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllAppointments() {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    clients (nom, prenom, email, telephone),
                    employees (nom, prenom, email)
                `)
                .order('appointment_date', { ascending: true })
                .order('heure', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur récupération tous rendez-vous:', error);
            return { success: false, error: error.message };
        }
    }

    async getAppointmentsByDate(date) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    clients (nom, prenom, email, telephone),
                    employees (nom, prenom, email)
                `)
                .eq('appointment_date', date)
                .order('heure', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur récupération rendez-vous par date:', error);
            return { success: false, error: error.message };
        }
    }

    async updateAppointment(appointmentId, updates) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .update(updates)
                .eq('id', appointmentId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur mise à jour rendez-vous:', error);
            return { success: false, error: error.message };
        }
    }

    async cancelAppointment(appointmentId) {
        return await this.updateAppointment(appointmentId, { status: 'annulé' });
    }

    async checkAvailability(date, heure, employeeId = null) {
        try {
            let query = supabase
                .from('appointments')
                .select('id')
                .eq('appointment_date', date)
                .eq('heure', heure)
                .neq('status', 'annulé');

            if (employeeId) {
                query = query.eq('employee_id', employeeId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, available: data.length === 0 };
        } catch (error) {
            console.error('Erreur vérification disponibilité:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // GESTION DES PAIEMENTS
    // ========================================

    async createPayment(paymentData) {
        try {
            const { data, error } = await supabase
                .from('payments')
                .insert([{
                    appointment_id: paymentData.appointment_id,
                    client_id: paymentData.client_id,
                    montant: paymentData.montant,
                    devise: paymentData.devise || 'EUR',
                    methode_paiement: paymentData.methode_paiement,
                    status: paymentData.status || 'en_attente',
                    stripe_payment_intent_id: paymentData.stripe_payment_intent_id,
                    transaction_id: paymentData.transaction_id
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur création paiement:', error);
            return { success: false, error: error.message };
        }
    }

    async getPaymentsByClient(clientId) {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    *,
                    appointments (appointment_date, heure, type, domaine)
                `)
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur récupération paiements client:', error);
            return { success: false, error: error.message };
        }
    }

    async updatePaymentStatus(paymentId, status) {
        try {
            const { data, error } = await supabase
                .from('payments')
                .update({ status })
                .eq('id', paymentId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur mise à jour statut paiement:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // GESTION DES CONSULTATIONS
    // ========================================

    async createConsultation(consultationData) {
        try {
            const { data, error } = await supabase
                .from('consultations')
                .insert([{
                    appointment_id: consultationData.appointment_id,
                    employee_id: consultationData.employee_id,
                    date_consultation: consultationData.date_consultation,
                    heure_debut: consultationData.heure_debut,
                    heure_fin: consultationData.heure_fin,
                    observations: consultationData.observations,
                    diagnostic: consultationData.diagnostic,
                    recommandations: consultationData.recommandations,
                    prochain_rdv: consultationData.prochain_rdv
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur création consultation:', error);
            return { success: false, error: error.message };
        }
    }

    async getConsultationsByClient(clientId) {
        try {
            const { data, error } = await supabase
                .from('consultations')
                .select(`
                    *,
                    appointments (appointment_date, heure, type, domaine),
                    employees (nom, prenom)
                `)
                .eq('appointments.client_id', clientId)
                .order('date_consultation', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur récupération consultations client:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // GESTION DES SUIVIS
    // ========================================

    async createFollowUp(followUpData) {
        try {
            const { data, error } = await supabase
                .from('follow_ups')
                .insert([{
                    client_id: followUpData.client_id,
                    employee_id: followUpData.employee_id,
                    date_suivi: followUpData.date_suivi,
                    type_suivi: followUpData.type_suivi,
                    observations: followUpData.observations,
                    evolution: followUpData.evolution,
                    actions_prises: followUpData.actions_prises,
                    prochaines_etapes: followUpData.prochaines_etapes
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur création suivi:', error);
            return { success: false, error: error.message };
        }
    }

    async getFollowUpsByClient(clientId) {
        try {
            const { data, error } = await supabase
                .from('follow_ups')
                .select(`
                    *,
                    employees (nom, prenom)
                `)
                .eq('client_id', clientId)
                .order('date_suivi', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur récupération suivis client:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // GESTION DES MESSAGES
    // ========================================

    async createMessage(messageData) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([{
                    expediteur_id: messageData.expediteur_id,
                    expediteur_type: messageData.expediteur_type,
                    destinataire_id: messageData.destinataire_id,
                    destinataire_type: messageData.destinataire_type,
                    sujet: messageData.sujet,
                    contenu: messageData.contenu
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur création message:', error);
            return { success: false, error: error.message };
        }
    }

    async getMessagesForUser(userId, userType) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('destinataire_id', userId)
                .eq('destinataire_type', userType)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur récupération messages:', error);
            return { success: false, error: error.message };
        }
    }

    async markMessageAsRead(messageId) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .update({ 
                    is_read: true, 
                    read_at: new Date().toISOString() 
                })
                .eq('id', messageId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur marquage message lu:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // GESTION DES NOTIFICATIONS
    // ========================================

    async createNotification(notificationData) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert([{
                    user_id: notificationData.user_id,
                    user_type: notificationData.user_type,
                    type: notificationData.type,
                    titre: notificationData.titre,
                    message: notificationData.message,
                    data: notificationData.data
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur création notification:', error);
            return { success: false, error: error.message };
        }
    }

    async getNotificationsForUser(userId, userType) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .eq('user_type', userType)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur récupération notifications:', error);
            return { success: false, error: error.message };
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .update({ 
                    is_read: true, 
                    read_at: new Date().toISOString() 
                })
                .eq('id', notificationId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur marquage notification lue:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // GESTION DES TARIFS
    // ========================================

    async getPricing() {
        try {
            const { data, error } = await supabase
                .from('pricing')
                .select('*')
                .eq('is_active', true)
                .order('montant', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur récupération tarifs:', error);
            return { success: false, error: error.message };
        }
    }

    async getPriceByType(type) {
        try {
            const { data, error } = await supabase
                .from('pricing')
                .select('*')
                .eq('type_consultation', type)
                .eq('is_active', true)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erreur récupération tarif par type:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // STATISTIQUES ET RAPPORTS
    // ========================================

    async getDashboardStats() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Rendez-vous aujourd'hui
            const { count: todayAppointments } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('appointment_date', today);

            // Total clients
            const { count: totalClients } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true });

            // Rendez-vous en attente
            const { count: pendingAppointments } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'en_attente');

            // Messages non lus
            const { count: unreadMessages } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false);

            return {
                success: true,
                data: {
                    todayAppointments: todayAppointments || 0,
                    totalClients: totalClients || 0,
                    pendingAppointments: pendingAppointments || 0,
                    unreadMessages: unreadMessages || 0
                }
            };
        } catch (error) {
            console.error('Erreur récupération statistiques:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // UTILITAIRES
    // ========================================

    async testConnection() {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('count', { count: 'exact', head: true });
            
            if (error) throw error;
            return { success: true, message: 'Connexion réussie' };
        } catch (error) {
            console.error('Erreur test connexion:', error);
            return { success: false, error: error.message };
        }
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('fr-FR');
    }

    formatTime(time) {
        return time.substring(0, 5); // Format HH:MM
    }

    formatDateTime(date, time) {
        return `${this.formatDate(date)} à ${this.formatTime(time)}`;
    }
}

// Instance globale
export const dbManager = new UnifiedDatabaseManager();

// Fonctions utilitaires exportées
export const {
    createClient,
    getClientByEmail,
    getClientById,
    updateClient,
    getAllClients,
    createAppointment,
    getAppointmentsByClient,
    getAppointmentsByEmployee,
    getAllAppointments,
    getAppointmentsByDate,
    updateAppointment,
    cancelAppointment,
    checkAvailability,
    createPayment,
    getPaymentsByClient,
    updatePaymentStatus,
    createConsultation,
    getConsultationsByClient,
    createFollowUp,
    getFollowUpsByClient,
    createMessage,
    getMessagesForUser,
    markMessageAsRead,
    createNotification,
    getNotificationsForUser,
    markNotificationAsRead,
    getPricing,
    getPriceByType,
    getDashboardStats,
    testConnection
} = dbManager; 