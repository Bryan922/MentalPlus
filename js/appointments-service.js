/**
 * Service de gestion des rendez-vous sécurisé pour MentalPlus
 * Gestion complète des rendez-vous avec validation et sécurité
 */

// Vérification des dépendances
if (typeof supabaseClient === 'undefined') {
  console.error('❌ supabaseClient non trouvé. Assurez-vous que supabase-config.js est chargé.');
  throw new Error('Configuration Supabase manquante');
}

if (typeof authService === 'undefined') {
  console.error('❌ authService non trouvé. Assurez-vous que auth-service.js est chargé.');
  throw new Error('Service d\'authentification manquant');
}

/**
 * Service de gestion des rendez-vous
 */
class AppointmentsService {
  constructor() {
    this.isInitialized = false;
    this.availableTimeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];
    this.appointmentTypes = [
      { id: 'consultation', name: 'Consultation individuelle', duration: 60 },
      { id: 'couple', name: 'Thérapie de couple', duration: 90 },
      { id: 'family', name: 'Thérapie familiale', duration: 90 },
      { id: 'group', name: 'Thérapie de groupe', duration: 120 },
      { id: 'emergency', name: 'Consultation d\'urgence', duration: 45 }
    ];
    
    this.init();
  }

  /**
   * Initialisation du service
   */
  async init() {
    try {
      console.log('📅 Initialisation du service de rendez-vous...');
      this.isInitialized = true;
      console.log('✅ Service de rendez-vous initialisé');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du service de rendez-vous:', error);
    }
  }

  /**
   * Créer un nouveau rendez-vous
   */
  async createAppointment(appointmentData) {
    try {
      console.log('📅 Création d\'un nouveau rendez-vous...');
      
      // Vérifier l'authentification
      if (!authService.isAuthenticated()) {
        throw new Error('Vous devez être connecté pour prendre un rendez-vous');
      }
      
      // Validation des données
      const validation = this.validateAppointmentData(appointmentData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Vérifier la disponibilité
      const availability = await this.checkAvailability(
        appointmentData.date,
        appointmentData.time,
        appointmentData.employee_id
      );
      
      if (!availability.available) {
        throw new Error('Ce créneau n\'est pas disponible');
      }
      
      // Préparer les données du rendez-vous
      const currentUser = authService.getCurrentUser();
      const userProfile = authService.getUserProfile();
      
      const appointmentRecord = {
        client_id: currentUser.id,
        employee_id: appointmentData.employee_id,
        appointment_type: appointmentData.type,
        appointment_date: appointmentData.date,
        appointment_time: appointmentData.time,
        duration_minutes: this.getAppointmentDuration(appointmentData.type),
        status: 'scheduled',
        notes: appointmentData.notes || null,
        created_at: new Date().toISOString()
      };
      
      // Insérer le rendez-vous
      const { data, error } = await supabaseClient
        .from('appointments')
        .insert([appointmentRecord])
        .select(`
          *,
          client:profiles!appointments_client_id_fkey(full_name, email, phone),
          employee:profiles!appointments_employee_id_fkey(full_name, email)
        `)
        .single();
      
      if (error) {
        console.error('❌ Erreur lors de la création du rendez-vous:', error);
        throw error;
      }
      
      console.log('✅ Rendez-vous créé avec succès:', data.id);
      
      // Envoyer une notification (si implémentée)
      await this.sendAppointmentNotification(data, 'created');
      
      return {
        success: true,
        data: data,
        message: 'Rendez-vous créé avec succès!'
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la création du rendez-vous:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création du rendez-vous'
      };
    }
  }

  /**
   * Récupérer les rendez-vous d'un client
   */
  async getClientAppointments(clientId = null) {
    try {
      console.log('📋 Récupération des rendez-vous du client...');
      
      // Utiliser l'ID du client connecté si non spécifié
      const targetClientId = clientId || authService.getCurrentUser()?.id;
      
      if (!targetClientId) {
        throw new Error('ID client requis');
      }
      
      // Vérifier les permissions
      const currentUser = authService.getCurrentUser();
      const userProfile = authService.getUserProfile();
      
      if (userProfile?.role !== 'employee' && currentUser?.id !== targetClientId) {
        throw new Error('Accès non autorisé');
      }
      
      const { data, error } = await supabaseClient
        .from('appointments')
        .select(`
          *,
          employee:profiles!appointments_employee_id_fkey(full_name, email)
        `)
        .eq('client_id', targetClientId)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });
      
      if (error) {
        console.error('❌ Erreur lors de la récupération des rendez-vous:', error);
        throw error;
      }
      
      console.log(`✅ ${data.length} rendez-vous récupérés`);
      
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des rendez-vous:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des rendez-vous'
      };
    }
  }

  /**
   * Récupérer tous les rendez-vous (pour les employés)
   */
  async getAllAppointments(filters = {}) {
    try {
      console.log('📋 Récupération de tous les rendez-vous...');
      
      // Vérifier les permissions employé
      if (!authService.hasRole('employee')) {
        throw new Error('Accès réservé aux employés');
      }
      
      let query = supabaseClient
        .from('appointments')
        .select(`
          *,
          client:profiles!appointments_client_id_fkey(full_name, email, phone),
          employee:profiles!appointments_employee_id_fkey(full_name, email)
        `);
      
      // Appliquer les filtres
      if (filters.date) {
        query = query.eq('appointment_date', filters.date);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }
      
      if (filters.dateFrom) {
        query = query.gte('appointment_date', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('appointment_date', filters.dateTo);
      }
      
      const { data, error } = await query
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });
      
      if (error) {
        console.error('❌ Erreur lors de la récupération des rendez-vous:', error);
        throw error;
      }
      
      console.log(`✅ ${data.length} rendez-vous récupérés`);
      
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des rendez-vous:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des rendez-vous'
      };
    }
  }

  /**
   * Mettre à jour un rendez-vous
   */
  async updateAppointment(appointmentId, updates) {
    try {
      console.log('📝 Mise à jour du rendez-vous:', appointmentId);
      
      // Vérifier l'authentification
      if (!authService.isAuthenticated()) {
        throw new Error('Authentification requise');
      }
      
      // Récupérer le rendez-vous existant
      const { data: existingAppointment, error: fetchError } = await supabaseClient
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();
      
      if (fetchError) {
        throw new Error('Rendez-vous non trouvé');
      }
      
      // Vérifier les permissions
      const currentUser = authService.getCurrentUser();
      const userProfile = authService.getUserProfile();
      
      const canUpdate = userProfile?.role === 'employee' || 
                       currentUser?.id === existingAppointment.client_id;
      
      if (!canUpdate) {
        throw new Error('Permissions insuffisantes');
      }
      
      // Valider les mises à jour
      if (updates.appointment_date || updates.appointment_time) {
        const availability = await this.checkAvailability(
          updates.appointment_date || existingAppointment.appointment_date,
          updates.appointment_time || existingAppointment.appointment_time,
          updates.employee_id || existingAppointment.employee_id,
          appointmentId // Exclure le rendez-vous actuel
        );
        
        if (!availability.available) {
          throw new Error('Le nouveau créneau n\'est pas disponible');
        }
      }
      
      // Préparer les données de mise à jour
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Effectuer la mise à jour
      const { data, error } = await supabaseClient
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .select(`
          *,
          client:profiles!appointments_client_id_fkey(full_name, email, phone),
          employee:profiles!appointments_employee_id_fkey(full_name, email)
        `)
        .single();
      
      if (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
        throw error;
      }
      
      console.log('✅ Rendez-vous mis à jour avec succès');
      
      // Envoyer une notification
      await this.sendAppointmentNotification(data, 'updated');
      
      return {
        success: true,
        data: data,
        message: 'Rendez-vous mis à jour avec succès!'
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour du rendez-vous'
      };
    }
  }

  /**
   * Annuler un rendez-vous
   */
  async cancelAppointment(appointmentId, reason = null) {
    try {
      console.log('❌ Annulation du rendez-vous:', appointmentId);
      
      const result = await this.updateAppointment(appointmentId, {
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      });
      
      if (result.success) {
        await this.sendAppointmentNotification(result.data, 'cancelled');
        result.message = 'Rendez-vous annulé avec succès!';
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'annulation du rendez-vous'
      };
    }
  }

  /**
   * Vérifier la disponibilité d'un créneau
   */
  async checkAvailability(date, time, employeeId, excludeAppointmentId = null) {
    try {
      console.log('🔍 Vérification de disponibilité:', { date, time, employeeId });
      
      // Validation des paramètres
      if (!date || !time || !employeeId) {
        throw new Error('Date, heure et employé requis');
      }
      
      // Vérifier que la date n'est pas dans le passé
      const appointmentDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        return {
          available: false,
          reason: 'Impossible de prendre un rendez-vous dans le passé'
        };
      }
      
      // Vérifier les heures d'ouverture
      if (!this.availableTimeSlots.includes(time)) {
        return {
          available: false,
          reason: 'Créneau horaire non disponible'
        };
      }
      
      // Vérifier les conflits dans la base de données
      let query = supabaseClient
        .from('appointments')
        .select('id')
        .eq('appointment_date', date)
        .eq('appointment_time', time)
        .eq('employee_id', employeeId)
        .neq('status', 'cancelled');
      
      if (excludeAppointmentId) {
        query = query.neq('id', excludeAppointmentId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Erreur lors de la vérification:', error);
        throw error;
      }
      
      const isAvailable = data.length === 0;
      
      console.log('✅ Disponibilité vérifiée:', isAvailable);
      
      return {
        available: isAvailable,
        reason: isAvailable ? null : 'Créneau déjà réservé'
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de disponibilité:', error);
      return {
        available: false,
        reason: 'Erreur lors de la vérification'
      };
    }
  }

  /**
   * Récupérer les employés disponibles
   */
  async getAvailableEmployees() {
    try {
      console.log('👥 Récupération des employés disponibles...');
      
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('id, full_name, email, specialties')
        .eq('role', 'employee')
        .eq('is_active', true)
        .order('full_name');
      
      if (error) {
        console.error('❌ Erreur lors de la récupération des employés:', error);
        throw error;
      }
      
      console.log(`✅ ${data.length} employés récupérés`);
      
      return {
        success: true,
        data: data
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des employés:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des employés'
      };
    }
  }

  /**
   * Récupérer les créneaux disponibles pour une date et un employé
   */
  async getAvailableSlots(date, employeeId) {
    try {
      console.log('🕐 Récupération des créneaux disponibles:', { date, employeeId });
      
      // Récupérer les rendez-vous existants pour cette date et cet employé
      const { data: existingAppointments, error } = await supabaseClient
        .from('appointments')
        .select('appointment_time')
        .eq('appointment_date', date)
        .eq('employee_id', employeeId)
        .neq('status', 'cancelled');
      
      if (error) {
        console.error('❌ Erreur lors de la récupération des créneaux:', error);
        throw error;
      }
      
      // Filtrer les créneaux disponibles
      const bookedTimes = existingAppointments.map(apt => apt.appointment_time);
      const availableSlots = this.availableTimeSlots.filter(slot => !bookedTimes.includes(slot));
      
      console.log(`✅ ${availableSlots.length} créneaux disponibles`);
      
      return {
        success: true,
        data: availableSlots
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des créneaux:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des créneaux'
      };
    }
  }

  /**
   * Validation des données de rendez-vous
   */
  validateAppointmentData(data) {
    const errors = [];
    
    // Validation date
    if (!data.date) {
      errors.push('Date requise');
    } else {
      const appointmentDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        errors.push('La date ne peut pas être dans le passé');
      }
    }
    
    // Validation heure
    if (!data.time) {
      errors.push('Heure requise');
    } else if (!this.availableTimeSlots.includes(data.time)) {
      errors.push('Créneau horaire invalide');
    }
    
    // Validation type
    if (!data.type) {
      errors.push('Type de rendez-vous requis');
    } else if (!this.appointmentTypes.find(t => t.id === data.type)) {
      errors.push('Type de rendez-vous invalide');
    }
    
    // Validation employé
    if (!data.employee_id) {
      errors.push('Employé requis');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtenir la durée d'un type de rendez-vous
   */
  getAppointmentDuration(type) {
    const appointmentType = this.appointmentTypes.find(t => t.id === type);
    return appointmentType ? appointmentType.duration : 60;
  }

  /**
   * Envoyer une notification de rendez-vous (placeholder)
   */
  async sendAppointmentNotification(appointment, action) {
    try {
      console.log(`📧 Notification de rendez-vous (${action}):`, appointment.id);
      // Ici, vous pourriez implémenter l'envoi d'emails ou de notifications push
      // Pour l'instant, on log simplement l'action
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de notification:', error);
    }
  }

  /**
   * Obtenir les types de rendez-vous disponibles
   */
  getAppointmentTypes() {
    return this.appointmentTypes;
  }

  /**
   * Obtenir les créneaux horaires disponibles
   */
  getTimeSlots() {
    return this.availableTimeSlots;
  }
}

// Créer une instance globale du service de rendez-vous
window.appointmentsService = new AppointmentsService();

console.log('📅 Service de rendez-vous chargé');