// Gestion de l'espace client avec Supabase
import { supabase } from './supabase-config.js';
import { supabaseAuth } from './supabase-auth.js';

class EspaceClientManager {
    constructor() {
        this.currentUser = null;
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

            this.currentUser = session.user;
            await this.loadUserData();
            this.setupEventListeners();
            await this.loadDashboardData();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
        }
    }

    async loadUserData() {
        try {
            // Charger les informations utilisateur depuis Supabase
            const { data: client, error } = await supabase
                .from('clients')
                .select('*')
                .eq('email', this.currentUser.email)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (client) {
                document.getElementById('userName').textContent = client.nom || this.currentUser.user_metadata?.name || 'Utilisateur';
                document.getElementById('userEmail').textContent = client.email;
            } else {
                // Créer le client s'il n'existe pas
                await this.createClientProfile();
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données utilisateur:', error);
            document.getElementById('userName').textContent = this.currentUser.user_metadata?.name || 'Utilisateur';
            document.getElementById('userEmail').textContent = this.currentUser.email;
        }
    }

    async createClientProfile() {
        try {
            const { data, error } = await supabase
                .from('clients')
                .insert([
                    {
                        nom: this.currentUser.user_metadata?.name || 'Utilisateur',
                        email: this.currentUser.email,
                        telephone: ''
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            console.log('Profil client créé:', data);
        } catch (error) {
            console.error('Erreur lors de la création du profil client:', error);
        }
    }

    async loadDashboardData() {
        await Promise.all([
            this.loadNextAppointment(),
            this.loadAppointmentHistory(),
            this.loadRecentDocuments(),
            this.loadRecentMessages()
        ]);
    }

    async loadNextAppointment() {
        try {
            const { data: client } = await supabase
                .from('clients')
                .select('id')
                .eq('email', this.currentUser.email)
                .single();

            if (!client) return;

            const { data: appointments, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('client_id', client.id)
                .eq('status', 'confirmé')
                .gte('date', new Date().toISOString().split('T')[0])
                .order('date', { ascending: true })
                .order('heure', { ascending: true })
                .limit(1);

            if (error) throw error;

            if (appointments && appointments.length > 0) {
                this.displayNextAppointment(appointments[0]);
            } else {
                this.displayNoAppointment();
            }
        } catch (error) {
            console.error('Erreur lors du chargement du prochain rendez-vous:', error);
        }
    }

    displayNextAppointment(appointment) {
        const appointmentCard = document.querySelector('.next-appointment');
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
                    <p class="type">${appointment.type}</p>
                </div>
            </div>
            <div class="appointment-actions">
                <button class="btn-secondary" onclick="espaceClient.modifyAppointment(${appointment.id})">Modifier</button>
                <button class="btn-danger" onclick="espaceClient.cancelAppointment(${appointment.id})">Annuler</button>
            </div>
        `;
    }

    displayNoAppointment() {
        const appointmentCard = document.querySelector('.next-appointment');
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
        try {
            const { data: client } = await supabase
                .from('clients')
                .select('id')
                .eq('email', this.currentUser.email)
                .single();

            if (!client) return;

            const { data: appointments, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('client_id', client.id)
                .order('date', { ascending: false })
                .limit(5);

            if (error) throw error;

            this.displayAppointmentHistory(appointments || []);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique:', error);
        }
    }

    displayAppointmentHistory(appointments) {
        const historyContainer = document.querySelector('.appointment-list');
        
        if (appointments.length === 0) {
            historyContainer.innerHTML = '<p>Aucun rendez-vous dans l\'historique</p>';
            return;
        }

        historyContainer.innerHTML = appointments.map(appointment => {
            const date = new Date(appointment.date).toLocaleDateString('fr-FR');
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
        try {
            const { data: client } = await supabase
                .from('clients')
                .select('id')
                .eq('email', this.currentUser.email)
                .single();

            if (!client) return;

            // Simuler des documents pour l'instant
            const documents = [
                {
                    id: 1,
                    name: 'Compte-rendu de consultation',
                    type: 'pdf',
                    date: new Date().toISOString(),
                    url: '#'
                }
            ];

            this.displayRecentDocuments(documents);
        } catch (error) {
            console.error('Erreur lors du chargement des documents:', error);
        }
    }

    displayRecentDocuments(documents) {
        const documentsContainer = document.querySelector('.document-list');
        
        if (documents.length === 0) {
            documentsContainer.innerHTML = '<p>Aucun document disponible</p>';
            return;
        }

        documentsContainer.innerHTML = documents.map(doc => {
            const icon = doc.type === 'pdf' ? 'fa-file-pdf' : 'fa-file-alt';
            const date = new Date(doc.date).toLocaleDateString('fr-FR');
            
            return `
                <div class="document-item">
                    <i class="fas ${icon}"></i>
                    <div class="document-info">
                        <p class="document-name">${doc.name}</p>
                        <p class="document-date">${date}</p>
                    </div>
                    <button class="btn-icon" onclick="espaceClient.downloadDocument(${doc.id})">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    async loadRecentMessages() {
        try {
            // Simuler des messages pour l'instant
            const messages = [
                {
                    id: 1,
                    sender: 'Dr. Martin',
                    preview: 'Confirmation de votre prochain rendez-vous...',
                    time: 'Il y a 2h',
                    unread: true
                }
            ];

            this.displayRecentMessages(messages);
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
        }
    }

    displayRecentMessages(messages) {
        const messagesContainer = document.querySelector('.message-list');
        
        if (messages.length === 0) {
            messagesContainer.innerHTML = '<p>Aucun message</p>';
            return;
        }

        messagesContainer.innerHTML = messages.map(message => {
            const unreadClass = message.unread ? 'unread' : '';
            
            return `
                <div class="message-item ${unreadClass}" onclick="espaceClient.openMessage(${message.id})">
                    <div class="message-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="message-content">
                        <p class="message-sender">${message.sender}</p>
                        <p class="message-preview">${message.preview}</p>
                    </div>
                    <p class="message-time">${message.time}</p>
                </div>
            `;
        }).join('');
    }

    setupEventListeners() {
        // Navigation
        this.setupNavigation();
        
        // Nouveau rendez-vous
        const newAppointmentBtn = document.querySelector('.header-actions .btn-primary');
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
                if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                    await supabaseAuth.signOut();
                    window.location.href = 'index.html';
                }
            });
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Retirer la classe active de tous les liens
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Ajouter la classe active au lien cliqué
                link.classList.add('active');
                
                // Gérer la navigation
                const section = link.getAttribute('href').slice(1);
                this.navigateToSection(section);
            });
        });
    }

    navigateToSection(section) {
        switch (section) {
            case 'appointments':
                window.location.href = 'rendez-vous.html';
                break;
            case 'documents':
                this.showDocumentsSection();
                break;
            case 'profile':
                this.showSettingsSection();
                break;
            case 'messages':
                window.location.href = 'messaging.html';
                break;
            default:
                // Rester sur le dashboard
                break;
        }
    }

    showDocumentsSection() {
        // Utiliser le gestionnaire de documents pour afficher la modal
        if (window.documentsManager) {
            window.documentsManager.showDocumentsModal();
        } else {
            alert('Gestionnaire de documents non disponible');
        }
    }

    showSettingsSection() {
        // Utiliser le gestionnaire de documents pour afficher la modal des paramètres
        if (window.documentsManager) {
            window.documentsManager.showSettingsModal();
        } else {
            alert('Gestionnaire de paramètres non disponible');
        }
    }

    async modifyAppointment(appointmentId) {
        if (confirm('Voulez-vous modifier ce rendez-vous ?')) {
            window.location.href = `rendez-vous.html?mode=edit&id=${appointmentId}`;
        }
    }

    async cancelAppointment(appointmentId) {
        if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
            try {
                const { error } = await supabase
                    .from('appointments')
                    .update({ status: 'annulé' })
                    .eq('id', appointmentId);

                if (error) throw error;

                alert('Rendez-vous annulé avec succès');
                await this.loadNextAppointment();
                await this.loadAppointmentHistory();
            } catch (error) {
                console.error('Erreur lors de l\'annulation:', error);
                alert('Erreur lors de l\'annulation du rendez-vous');
            }
        }
    }

    downloadDocument(documentId) {
        // Simuler le téléchargement pour l'instant
        alert(`Téléchargement du document ${documentId} en cours...`);
    }

    openMessage(messageId) {
        // Rediriger vers la messagerie
        window.location.href = `messaging.html?message=${messageId}`;
    }
}

// Initialiser l'espace client
const espaceClient = new EspaceClientManager();
window.espaceClient = espaceClient;

export default EspaceClientManager;