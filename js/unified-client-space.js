// Gestionnaire unifié pour l'espace client
// Utilise le système de base de données unifié

import { supabaseAuth } from './supabase-auth.js';
import { dbManager } from './unified-database-manager.js';

class UnifiedClientSpace {
    constructor() {
        this.currentClient = null;
        this.currentSection = 'dashboard';
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
            await dbManager.initializeUser(session.user, 'client');

            // Charger les données du client
            await this.loadClientData(session.user.email);
            
            // Configurer l'interface
            this.setupInterface();
            this.setupEventListeners();
            
            // Charger les données du tableau de bord
            await this.loadDashboardData();
            
            console.log('Espace client initialisé avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'espace client:', error);
            this.showError('Erreur lors du chargement de l\'espace client');
        }
    }

    async loadClientData(email) {
        try {
            const { success, data } = await dbManager.getClientByEmail(email);
            
            if (success && data) {
                this.currentClient = data;
                this.updateUserInfo();
            } else {
                // Créer le profil client s'il n'existe pas
                await this.createClientProfile(email);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données client:', error);
        }
    }

    async createClientProfile(email) {
        try {
            const user = supabaseAuth.getCurrentUser();
            const clientData = {
                nom: user?.user_metadata?.name || 'Utilisateur',
                prenom: user?.user_metadata?.name || 'Utilisateur',
                email: email,
                telephone: '',
                pays: 'France'
            };

            const { success, data } = await dbManager.createClient(clientData);
            if (success) {
                this.currentClient = data;
                this.updateUserInfo();
            }
        } catch (error) {
            console.error('Erreur lors de la création du profil client:', error);
        }
    }

    updateUserInfo() {
        if (this.currentClient) {
            const userNameElement = document.getElementById('userName');
            const userEmailElement = document.getElementById('userEmail');
            
            if (userNameElement) {
                userNameElement.textContent = `${this.currentClient.prenom} ${this.currentClient.nom}`;
            }
            if (userEmailElement) {
                userEmailElement.textContent = this.currentClient.email;
            }
        }
    }

    setupInterface() {
        // Mettre à jour la navigation active
        this.updateNavigation();
        
        // Afficher la section par défaut
        this.showSection('dashboard');
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('href').substring(1);
                this.navigateToSection(section);
            });
        });

        // Bouton nouveau rendez-vous
        const newAppointmentBtn = document.querySelector('.btn-primary');
        if (newAppointmentBtn) {
            newAppointmentBtn.addEventListener('click', () => {
                window.location.href = 'rendez-vous.html';
            });
        }

        // Déconnexion
        const logoutBtn = document.querySelector('.logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.logout();
            });
        }
    }

    updateNavigation() {
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[href="#${this.currentSection}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
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
            case 'documents':
                await this.loadDocumentsData();
                break;
            case 'profile':
                await this.loadProfileData();
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
                this.loadNextAppointment(),
                this.loadAppointmentHistory(),
                this.loadRecentDocuments(),
                this.loadRecentMessages(),
                this.loadStatistics()
            ]);
        } catch (error) {
            console.error('Erreur lors du chargement du tableau de bord:', error);
        }
    }

    async loadNextAppointment() {
        if (!this.currentClient) return;

        try {
            const { success, data } = await dbManager.getAppointmentsByClient(this.currentClient.id);
            
            if (success && data) {
                const nextAppointment = data.find(apt => 
                    apt.status === 'confirmé' && 
                    new Date(apt.date) >= new Date()
                );

                if (nextAppointment) {
                    this.displayNextAppointment(nextAppointment);
                } else {
                    this.displayNoAppointment();
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement du prochain rendez-vous:', error);
        }
    }

    displayNextAppointment(appointment) {
        const appointmentCard = document.querySelector('.next-appointment');
        if (!appointmentCard) return;

        const date = new Date(appointment.date);
        const day = date.getDate();
        const month = date.toLocaleDateString('fr-FR', { month: 'short' });

        appointmentCard.innerHTML = `
            <h2>Prochain rendez-vous</h2>
            <div class="appointment-info">
                <div class="date-badge">
                    <span class="day">${day}</span>
                    <span class="month">${month}</span>
                </div>
                <div class="appointment-details">
                    <p class="time"><i class="fas fa-clock"></i> ${appointment.heure}</p>
                    <p class="type">${appointment.domaine}</p>
                </div>
            </div>
            <div class="appointment-actions">
                <button class="btn-secondary" onclick="clientSpace.modifyAppointment('${appointment.id}')">Modifier</button>
                <button class="btn-danger" onclick="clientSpace.cancelAppointment('${appointment.id}')">Annuler</button>
            </div>
        `;
    }

    displayNoAppointment() {
        const appointmentCard = document.querySelector('.next-appointment');
        if (!appointmentCard) return;

        appointmentCard.innerHTML = `
            <h2>Prochain rendez-vous</h2>
            <div class="no-appointment">
                <p>Aucun rendez-vous programmé</p>
                <button class="btn-primary" onclick="window.location.href='rendez-vous.html'">
                    <i class="fas fa-plus"></i> Prendre rendez-vous
                </button>
            </div>
        `;
    }

    async loadAppointmentHistory() {
        if (!this.currentClient) return;

        try {
            const { success, data } = await dbManager.getAppointmentsByClient(this.currentClient.id);
            
            if (success && data) {
                this.displayAppointmentHistory(data.slice(0, 5)); // Limiter à 5 derniers
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique:', error);
        }
    }

    displayAppointmentHistory(appointments) {
        const historyContainer = document.querySelector('.appointment-list');
        if (!historyContainer) return;
        
        if (appointments.length === 0) {
            historyContainer.innerHTML = '<p>Aucun rendez-vous dans l\'historique</p>';
            return;
        }

        historyContainer.innerHTML = appointments.map(appointment => {
            const date = dbManager.formatDate(appointment.date);
            const statusClass = appointment.status === 'terminé' ? 'completed' : 
                               appointment.status === 'annulé' ? 'cancelled' : 'scheduled';
            
            return `
                <div class="appointment-item ${statusClass}">
                    <div class="appointment-status"></div>
                    <p class="date">${date}</p>
                    <p class="time">${appointment.heure}</p>
                    <span class="status">${appointment.status}</span>
                </div>
            `;
        }).join('');
    }

    async loadRecentDocuments() {
        // TODO: Implémenter quand la table documents sera créée
        const documentsContainer = document.querySelector('.document-list');
        if (documentsContainer) {
            documentsContainer.innerHTML = '<p>Aucun document récent</p>';
        }
    }

    async loadRecentMessages() {
        if (!this.currentClient) return;

        try {
            const { success, data } = await dbManager.getMessagesForUser(this.currentClient.id, 'client');
            
            if (success && data) {
                this.displayRecentMessages(data.slice(0, 3)); // Limiter à 3 derniers
            }
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
        }
    }

    displayRecentMessages(messages) {
        const messagesContainer = document.querySelector('.message-list');
        if (!messagesContainer) return;

        if (messages.length === 0) {
            messagesContainer.innerHTML = '<p>Aucun message récent</p>';
            return;
        }

        messagesContainer.innerHTML = messages.map(message => {
            const timeAgo = this.getTimeAgo(message.created_at);
            const unreadClass = !message.is_read ? 'unread' : '';
            
            return `
                <div class="message-item ${unreadClass}">
                    <div class="message-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="message-content">
                        <p class="message-sender">${message.expediteur_type === 'employee' ? 'Accompagnateur' : 'Système'}</p>
                        <p class="message-preview">${message.contenu.substring(0, 50)}...</p>
                    </div>
                    <p class="message-time">${timeAgo}</p>
                </div>
            `;
        }).join('');
    }

    async loadStatistics() {
        // TODO: Implémenter les statistiques personnalisées du client
    }

    async loadAppointmentsData() {
        if (!this.currentClient) return;

        try {
            const { success, data } = await dbManager.getAppointmentsByClient(this.currentClient.id);
            
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
                <div class="appointment-card ${statusClass}">
                    <div class="appointment-header">
                        <h3>${appointment.domaine}</h3>
                        <span class="status">${appointment.status}</span>
                    </div>
                    <div class="appointment-details">
                        <p><i class="fas fa-calendar"></i> ${date}</p>
                        <p><i class="fas fa-clock"></i> ${appointment.heure}</p>
                        <p><i class="fas fa-user"></i> ${appointment.type}</p>
                    </div>
                    <div class="appointment-actions">
                        ${appointment.status === 'confirmé' ? `
                            <button class="btn-secondary" onclick="clientSpace.modifyAppointment('${appointment.id}')">Modifier</button>
                            <button class="btn-danger" onclick="clientSpace.cancelAppointment('${appointment.id}')">Annuler</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadDocumentsData() {
        // TODO: Implémenter quand la table documents sera créée
        const container = document.getElementById('documents-list');
        if (container) {
            container.innerHTML = '<p>Aucun document disponible</p>';
        }
    }

    async loadProfileData() {
        if (!this.currentClient) return;

        // Remplir le formulaire de profil avec les données actuelles
        this.populateProfileForm();
    }

    populateProfileForm() {
        const form = document.getElementById('profile-form');
        if (!form || !this.currentClient) return;

        // Remplir les champs avec les données du client
        Object.keys(this.currentClient).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = this.currentClient[key] || '';
            }
        });
    }

    async loadMessagesData() {
        if (!this.currentClient) return;

        try {
            const { success, data } = await dbManager.getMessagesForUser(this.currentClient.id, 'client');
            
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
                <div class="message-card ${unreadClass}" onclick="clientSpace.openMessage('${message.id}')">
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
    async modifyAppointment(appointmentId) {
        window.location.href = `rendez-vous.html?mode=edit&id=${appointmentId}`;
    }

    async cancelAppointment(appointmentId) {
        if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
            try {
                const { success } = await dbManager.cancelAppointment(appointmentId);
                
                if (success) {
                    this.showSuccess('Rendez-vous annulé avec succès');
                    await this.loadDashboardData();
                } else {
                    this.showError('Erreur lors de l\'annulation du rendez-vous');
                }
            } catch (error) {
                console.error('Erreur lors de l\'annulation:', error);
                this.showError('Erreur lors de l\'annulation du rendez-vous');
            }
        }
    }

    async openMessage(messageId) {
        try {
            // Marquer comme lu
            await dbManager.markMessageAsRead(messageId);
            
            // TODO: Ouvrir le message dans une modal ou nouvelle page
            console.log('Ouverture du message:', messageId);
        } catch (error) {
            console.error('Erreur lors de l\'ouverture du message:', error);
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
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'À l\'instant';
        if (diffInHours < 24) return `Il y a ${diffInHours}h`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `Il y a ${diffInDays}j`;
        
        return dbManager.formatDate(dateString);
    }

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
export const clientSpace = new UnifiedClientSpace();

// Fonctions globales pour les boutons
window.modifyAppointment = (appointmentId) => clientSpace.modifyAppointment(appointmentId);
window.cancelAppointment = (appointmentId) => clientSpace.cancelAppointment(appointmentId);
window.openMessage = (messageId) => clientSpace.openMessage(messageId); 