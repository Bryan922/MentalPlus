// Gestionnaire unifié pour l'espace employé
// Utilise le système de base de données unifié

import { supabaseAuth } from './supabase-auth.js';
import { dbManager } from './unified-database-manager.js';

class UnifiedEmployeeSpace {
    constructor() {
        this.currentEmployee = null;
        this.currentSection = 'dashboard';
        this.selectedDate = new Date().toISOString().split('T')[0];
        this.init();
    }

    async init() {
        try {
            // Vérifier l'authentification
            const { success, session } = await supabaseAuth.getCurrentSession();
            if (!success || !session) {
                window.location.href = 'auth.html';
                return;
            }

            // Initialiser l'utilisateur dans le gestionnaire de base de données
            await dbManager.initializeUser(session.user, 'employee');

            // Charger les données de l'employé
            await this.loadEmployeeData(session.user.email);
            
            // Configurer l'interface
            this.setupInterface();
            this.setupEventListeners();
            
            // Charger les données du tableau de bord
            await this.loadDashboardData();
            
            console.log('Espace employé initialisé avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'espace employé:', error);
            this.showError('Erreur lors du chargement de l\'espace employé');
        }
    }

    async loadEmployeeData(email) {
        try {
            // TODO: Créer une fonction getEmployeeByEmail dans dbManager
            // Pour l'instant, on utilise des données par défaut
            this.currentEmployee = {
                id: 'default-employee-id',
                nom: 'Employé',
                prenom: 'MentalSerenity',
                email: email,
                role: 'accompagnateur'
            };
            this.updateEmployeeInfo();
        } catch (error) {
            console.error('Erreur lors du chargement des données employé:', error);
        }
    }

    updateEmployeeInfo() {
        if (this.currentEmployee) {
            const employeeNameElement = document.getElementById('employeeName');
            const employeeRoleElement = document.getElementById('employeeRole');
            
            if (employeeNameElement) {
                employeeNameElement.textContent = `${this.currentEmployee.prenom} ${this.currentEmployee.nom}`;
            }
            if (employeeRoleElement) {
                employeeRoleElement.textContent = this.currentEmployee.role;
            }
        }
    }

    setupInterface() {
        // Mettre à jour la navigation active
        this.updateNavigation();
        
        // Afficher la section par défaut
        this.showSection('dashboard');
        
        // Mettre à jour la date courante
        this.updateCurrentDateTime();
        
        // Afficher la date sélectionnée
        this.updateSelectedDate();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });

        // Navigation des dates
        const prevDayBtn = document.getElementById('prevDay');
        const nextDayBtn = document.getElementById('nextDay');
        
        if (prevDayBtn) {
            prevDayBtn.addEventListener('click', () => this.changeDate(-1));
        }
        if (nextDayBtn) {
            nextDayBtn.addEventListener('click', () => this.changeDate(1));
        }

        // Filtres
        const appointmentTypeFilter = document.getElementById('appointmentTypeFilter');
        if (appointmentTypeFilter) {
            appointmentTypeFilter.addEventListener('change', () => this.loadAppointmentsData());
        }

        // Bouton nouveau rendez-vous
        const newAppointmentBtn = document.getElementById('newAppointmentBtn');
        if (newAppointmentBtn) {
            newAppointmentBtn.addEventListener('click', () => {
                window.location.href = 'rendez-vous.html?mode=employee';
            });
        }

        // Bouton actualiser
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadDashboardData());
        }

        // Déconnexion
        const logoutBtn = document.querySelector('.logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.logout();
            });
        }

        // Disclaimer modal
        const acceptDisclaimerBtn = document.getElementById('acceptDisclaimer');
        if (acceptDisclaimerBtn) {
            acceptDisclaimerBtn.addEventListener('click', () => {
                this.hideDisclaimerModal();
            });
        }
    }

    updateNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${this.currentSection}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    updateCurrentDateTime() {
        const dateTimeElement = document.getElementById('currentDateTime');
        if (dateTimeElement) {
            const now = new Date();
            dateTimeElement.textContent = now.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    updateSelectedDate() {
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            const date = new Date(this.selectedDate);
            currentDateElement.textContent = date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    changeDate(days) {
        const currentDate = new Date(this.selectedDate);
        currentDate.setDate(currentDate.getDate() + days);
        this.selectedDate = currentDate.toISOString().split('T')[0];
        this.updateSelectedDate();
        this.loadAppointmentsData();
    }

    async navigateToSection(section) {
        this.currentSection = section;
        this.updateNavigation();
        this.showSection(section);
        
        // Charger les données spécifiques à la section
        switch (section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'appointments':
                await this.loadAppointmentsData();
                break;
            case 'clients':
                await this.loadClientsData();
                break;
            case 'consultations':
                await this.loadConsultationsData();
                break;
            case 'statistics':
                await this.loadStatisticsData();
                break;
            case 'messages':
                await this.loadMessagesData();
                break;
        }
    }

    showSection(section) {
        // Masquer toutes les sections
        document.querySelectorAll('.content-section').forEach(sectionEl => {
            sectionEl.style.display = 'none';
        });
        
        // Afficher la section demandée
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadTodayAppointments(),
                this.loadDashboardStats(),
                this.loadRecentMessages(),
                this.loadNotifications()
            ]);
        } catch (error) {
            console.error('Erreur lors du chargement du tableau de bord:', error);
        }
    }

    async loadTodayAppointments() {
        try {
            const { success, data } = await dbManager.getAppointmentsByDate(this.selectedDate);
            
            if (success && data) {
                this.displayTodayAppointments(data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des rendez-vous du jour:', error);
        }
    }

    displayTodayAppointments(appointments) {
        const container = document.getElementById('todayAppointmentsList');
        if (!container) return;

        if (appointments.length === 0) {
            container.innerHTML = '<p>Aucun rendez-vous aujourd\'hui</p>';
            return;
        }

        container.innerHTML = appointments.map(appointment => {
            const time = appointment.heure;
            const statusClass = appointment.status === 'terminé' ? 'completed' : 
                               appointment.status === 'annulé' ? 'cancelled' : 'scheduled';
            
            return `
                <div class="appointment-item ${statusClass}" onclick="employeeSpace.viewAppointmentDetails('${appointment.id}')">
                    <div class="appointment-time">${time}</div>
                    <div class="appointment-info">
                        <h4>${appointment.clients?.prenom} ${appointment.clients?.nom}</h4>
                        <p>${appointment.domaine} - ${appointment.type}</p>
                    </div>
                    <div class="appointment-status">
                        <span class="status-badge">${appointment.status}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadDashboardStats() {
        try {
            const { success, data } = await dbManager.getDashboardStats();
            
            if (success && data) {
                this.updateDashboardStats(data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
        }
    }

    updateDashboardStats(stats) {
        const todayAppointmentsElement = document.getElementById('todayAppointments');
        const totalClientsElement = document.getElementById('totalClients');
        const pendingAppointmentsElement = document.getElementById('pendingAppointments');
        const nightConsultationsElement = document.getElementById('nightConsultations');

        if (todayAppointmentsElement) {
            todayAppointmentsElement.textContent = stats.todayAppointments;
        }
        if (totalClientsElement) {
            totalClientsElement.textContent = stats.totalClients;
        }
        if (pendingAppointmentsElement) {
            pendingAppointmentsElement.textContent = stats.pendingAppointments;
        }
        if (nightConsultationsElement) {
            // TODO: Calculer les consultations de nuit
            nightConsultationsElement.textContent = '0';
        }
    }

    async loadRecentMessages() {
        // TODO: Implémenter le chargement des messages récents
    }

    async loadNotifications() {
        if (!this.currentEmployee) return;

        try {
            const { success, data } = await dbManager.getNotificationsForUser(this.currentEmployee.id, 'employee');
            
            if (success && data) {
                const unreadCount = data.filter(n => !n.is_read).length;
                this.updateNotificationCount(unreadCount);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des notifications:', error);
        }
    }

    updateNotificationCount(count) {
        const notificationCountElement = document.getElementById('notificationCount');
        if (notificationCountElement) {
            notificationCountElement.textContent = count;
        }
    }

    async loadAppointmentsData() {
        try {
            const { success, data } = await dbManager.getAllAppointments();
            
            if (success && data) {
                this.displayAllAppointments(data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des rendez-vous:', error);
        }
    }

    displayAllAppointments(appointments) {
        const container = document.getElementById('appointments-list');
        if (!container) return;

        if (appointments.length === 0) {
            container.innerHTML = '<p>Aucun rendez-vous trouvé</p>';
            return;
        }

        container.innerHTML = appointments.map(appointment => {
            const date = dbManager.formatDate(appointment.date);
            const statusClass = appointment.status === 'terminé' ? 'completed' : 
                               appointment.status === 'annulé' ? 'cancelled' : 'scheduled';
            
            return `
                <div class="appointment-card ${statusClass}" onclick="employeeSpace.viewAppointmentDetails('${appointment.id}')">
                    <div class="appointment-header">
                        <h3>${appointment.clients?.prenom} ${appointment.clients?.nom}</h3>
                        <span class="status">${appointment.status}</span>
                    </div>
                    <div class="appointment-details">
                        <p><i class="fas fa-calendar"></i> ${date}</p>
                        <p><i class="fas fa-clock"></i> ${appointment.heure}</p>
                        <p><i class="fas fa-tag"></i> ${appointment.domaine}</p>
                        <p><i class="fas fa-user"></i> ${appointment.type}</p>
                    </div>
                    <div class="appointment-actions">
                        <button class="btn-secondary" onclick="employeeSpace.editAppointment('${appointment.id}')">Modifier</button>
                        <button class="btn-primary" onclick="employeeSpace.startConsultation('${appointment.id}')">Consultation</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadClientsData() {
        try {
            const { success, data } = await dbManager.getAllClients();
            
            if (success && data) {
                this.displayAllClients(data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des clients:', error);
        }
    }

    displayAllClients(clients) {
        const container = document.getElementById('clients-list');
        if (!container) return;

        if (clients.length === 0) {
            container.innerHTML = '<p>Aucun client trouvé</p>';
            return;
        }

        container.innerHTML = clients.map(client => {
            return `
                <div class="client-card" onclick="employeeSpace.viewClientDetails('${client.id}')">
                    <div class="client-header">
                        <h3>${client.prenom} ${client.nom}</h3>
                        <span class="client-status">${client.is_active ? 'Actif' : 'Inactif'}</span>
                    </div>
                    <div class="client-details">
                        <p><i class="fas fa-envelope"></i> ${client.email}</p>
                        <p><i class="fas fa-phone"></i> ${client.telephone || 'Non renseigné'}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${client.ville || 'Non renseigné'}</p>
                    </div>
                    <div class="client-actions">
                        <button class="btn-secondary" onclick="employeeSpace.editClient('${client.id}')">Modifier</button>
                        <button class="btn-primary" onclick="employeeSpace.viewClientHistory('${client.id}')">Historique</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadConsultationsData() {
        // TODO: Implémenter le chargement des consultations
        const container = document.getElementById('consultations-list');
        if (container) {
            container.innerHTML = '<p>Aucune consultation trouvée</p>';
        }
    }

    async loadStatisticsData() {
        // TODO: Implémenter le chargement des statistiques détaillées
        const container = document.getElementById('statistics-container');
        if (container) {
            container.innerHTML = '<p>Statistiques en cours de développement</p>';
        }
    }

    async loadMessagesData() {
        if (!this.currentEmployee) return;

        try {
            const { success, data } = await dbManager.getMessagesForUser(this.currentEmployee.id, 'employee');
            
            if (success && data) {
                this.displayAllMessages(data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
        }
    }

    displayAllMessages(messages) {
        const container = document.getElementById('messages-list');
        if (!container) return;

        if (messages.length === 0) {
            container.innerHTML = '<p>Aucun message</p>';
            return;
        }

        container.innerHTML = messages.map(message => {
            const date = dbManager.formatDate(message.created_at);
            const unreadClass = !message.is_read ? 'unread' : '';
            
            return `
                <div class="message-card ${unreadClass}" onclick="employeeSpace.openMessage('${message.id}')">
                    <div class="message-header">
                        <h4>${message.sujet || 'Sans sujet'}</h4>
                        <span class="date">${date}</span>
                    </div>
                    <p class="message-preview">${message.contenu.substring(0, 100)}...</p>
                    ${!message.is_read ? '<span class="unread-badge">Nouveau</span>' : ''}
                </div>
            `;
        }).join('');
    }

    // Actions sur les rendez-vous
    async viewAppointmentDetails(appointmentId) {
        try {
            // TODO: Ouvrir une modal avec les détails du rendez-vous
            console.log('Affichage des détails du rendez-vous:', appointmentId);
        } catch (error) {
            console.error('Erreur lors de l\'affichage des détails:', error);
        }
    }

    async editAppointment(appointmentId) {
        window.location.href = `rendez-vous.html?mode=edit&id=${appointmentId}`;
    }

    async startConsultation(appointmentId) {
        // TODO: Rediriger vers la page de consultation
        console.log('Début de consultation pour le rendez-vous:', appointmentId);
    }

    // Actions sur les clients
    async viewClientDetails(clientId) {
        try {
            // TODO: Ouvrir une modal avec les détails du client
            console.log('Affichage des détails du client:', clientId);
        } catch (error) {
            console.error('Erreur lors de l\'affichage des détails client:', error);
        }
    }

    async editClient(clientId) {
        // TODO: Ouvrir une modal d'édition du client
        console.log('Édition du client:', clientId);
    }

    async viewClientHistory(clientId) {
        // TODO: Afficher l'historique complet du client
        console.log('Historique du client:', clientId);
    }

    // Actions sur les messages
    async openMessage(messageId) {
        try {
            // Marquer comme lu
            await dbManager.markMessageAsRead(messageId);
            
            // TODO: Ouvrir le message dans une modal
            console.log('Ouverture du message:', messageId);
        } catch (error) {
            console.error('Erreur lors de l\'ouverture du message:', error);
        }
    }

    // Gestion du disclaimer
    hideDisclaimerModal() {
        const modal = document.getElementById('disclaimerModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async logout() {
        try {
            await supabaseAuth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    }

    // Utilitaires
    showSuccess(message) {
        // TODO: Implémenter l'affichage des messages de succès
        console.log('Succès:', message);
    }

    showError(message) {
        // TODO: Implémenter l'affichage des messages d'erreur
        console.error('Erreur:', message);
    }
}

// Instance globale
export const employeeSpace = new UnifiedEmployeeSpace();

// Fonctions globales pour les boutons
window.viewAppointmentDetails = (appointmentId) => employeeSpace.viewAppointmentDetails(appointmentId);
window.editAppointment = (appointmentId) => employeeSpace.editAppointment(appointmentId);
window.startConsultation = (appointmentId) => employeeSpace.startConsultation(appointmentId);
window.viewClientDetails = (clientId) => employeeSpace.viewClientDetails(clientId);
window.editClient = (clientId) => employeeSpace.editClient(clientId);
window.viewClientHistory = (clientId) => employeeSpace.viewClientHistory(clientId);
window.openMessage = (messageId) => employeeSpace.openMessage(messageId); 