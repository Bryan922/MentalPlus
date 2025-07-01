// Employee Dashboard - Supabase Integration
import { supabase, handleSupabaseError, showMessage } from './supabase-config.js';

class EmployeeDashboard {
    constructor() {
        this.currentView = 'dashboard';
        this.selectedClient = null;
        this.selectedAppointment = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadDashboard();
        this.injectCSS();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // Filters
        const dateFilter = document.getElementById('dateFilter');
        const typeFilter = document.getElementById('typeFilter');
        const statusFilter = document.getElementById('statusFilter');

        if (dateFilter) dateFilter.addEventListener('change', () => this.loadAppointments());
        if (typeFilter) typeFilter.addEventListener('change', () => this.loadAppointments());
        if (statusFilter) statusFilter.addEventListener('change', () => this.loadAppointments());

        // Search
        const searchInput = document.getElementById('clientSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchClients(e.target.value);
            });
        }

        // Follow-up form
        const followUpForm = document.getElementById('followUpForm');
        if (followUpForm) {
            followUpForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveFollowUp();
            });
        }
    }

    switchView(view) {
        this.currentView = view;
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Show/hide sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(`${view}Section`).style.display = 'block';

        // Load data based on view
        switch(view) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'appointments':
                this.loadAppointments();
                break;
            case 'clients':
                this.loadClients();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }

    async loadDashboard() {
        try {
            showMessage('Chargement du tableau de bord...', 'info');

            // Load today's appointments
            const today = new Date().toISOString().split('T')[0];
            const { data: todayAppointments, error: appointmentsError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    clients(*)
                `)
                .eq('date', today)
                .order('heure');

            if (appointmentsError) throw appointmentsError;

            // Load recent messages
            const { data: recentMessages, error: messagesError } = await supabase
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (messagesError) throw messagesError;

            // Load statistics
            const stats = await this.loadStatistics();

            this.updateDashboardDisplay(todayAppointments, recentMessages, stats);
            showMessage('Tableau de bord chargé avec succès', 'success');

        } catch (error) {
            console.error('Erreur lors du chargement du tableau de bord:', error);
            handleSupabaseError(error);
        }
    }

    async loadStatistics() {
        try {
            const today = new Date();
            const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

            // Total clients
            const { count: totalClients } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true });

            // This month's appointments
            const { count: monthlyAppointments } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .gte('date', `${thisMonth}-01`);

            // Pending payments
            const { count: pendingPayments } = await supabase
                .from('payments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'en_attente');

            // Unread messages
            const { count: unreadMessages } = await supabase
                .from('contact_messages')
                .select('*', { count: 'exact', head: true })
                .is('read_at', null);

            return {
                totalClients: totalClients || 0,
                monthlyAppointments: monthlyAppointments || 0,
                pendingPayments: pendingPayments || 0,
                unreadMessages: unreadMessages || 0
            };
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            return {
                totalClients: 0,
                monthlyAppointments: 0,
                pendingPayments: 0,
                unreadMessages: 0
            };
        }
    }

    updateDashboardDisplay(appointments, messages, stats) {
        // Update statistics
        const statsContainer = document.getElementById('dashboardStats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <h3>${stats.totalClients}</h3>
                    <p>Clients totaux</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.monthlyAppointments}</h3>
                    <p>RDV ce mois</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.pendingPayments}</h3>
                    <p>Paiements en attente</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.unreadMessages}</h3>
                    <p>Messages non lus</p>
                </div>
            `;
        }

        // Update today's appointments
        const appointmentsContainer = document.getElementById('todayAppointments');
        if (appointmentsContainer) {
            if (appointments.length === 0) {
                appointmentsContainer.innerHTML = '<p>Aucun rendez-vous aujourd\'hui</p>';
            } else {
                appointmentsContainer.innerHTML = appointments.map(apt => `
                    <div class="appointment-card" onclick="employeeDashboard.viewAppointment('${apt.id}')">
                        <div class="appointment-time">${apt.heure}</div>
                        <div class="appointment-details">
                            <h4>${apt.clients?.nom || 'Client inconnu'}</h4>
                            <p>${apt.type} - ${apt.status}</p>
                        </div>
                        <div class="appointment-actions">
                            <button onclick="event.stopPropagation(); employeeDashboard.editAppointment('${apt.id}')" class="btn-small">Modifier</button>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Update recent messages
        const messagesContainer = document.getElementById('recentMessages');
        if (messagesContainer) {
            if (messages.length === 0) {
                messagesContainer.innerHTML = '<p>Aucun message récent</p>';
            } else {
                messagesContainer.innerHTML = messages.map(msg => `
                    <div class="message-card ${!msg.read_at ? 'unread' : ''}" onclick="employeeDashboard.viewMessage('${msg.id}')">
                        <h4>${msg.nom}</h4>
                        <p>${msg.email}</p>
                        <p class="message-preview">${msg.message.substring(0, 100)}...</p>
                        <small>${this.formatDate(msg.created_at)}</small>
                    </div>
                `).join('');
            }
        }
    }

    async loadAppointments() {
        try {
            showMessage('Chargement des rendez-vous...', 'info');

            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    clients(*),
                    payments(*)
                `)
                .order('date', { ascending: false })
                .order('heure', { ascending: false });

            // Apply filters
            const dateFilter = document.getElementById('dateFilter')?.value;
            const typeFilter = document.getElementById('typeFilter')?.value;
            const statusFilter = document.getElementById('statusFilter')?.value;

            if (dateFilter) {
                query = query.eq('date', dateFilter);
            }
            if (typeFilter && typeFilter !== 'all') {
                query = query.eq('type', typeFilter);
            }
            if (statusFilter && statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data: appointments, error } = await query;
            if (error) throw error;

            this.displayAppointments(appointments);
            showMessage('Rendez-vous chargés avec succès', 'success');

        } catch (error) {
            console.error('Erreur lors du chargement des rendez-vous:', error);
            handleSupabaseError(error);
        }
    }

    displayAppointments(appointments) {
        const container = document.getElementById('appointmentsList');
        if (!container) return;

        if (appointments.length === 0) {
            container.innerHTML = '<p>Aucun rendez-vous trouvé</p>';
            return;
        }

        container.innerHTML = appointments.map(apt => `
            <div class="appointment-row">
                <div class="appointment-info">
                    <div class="appointment-date">${this.formatDate(apt.date)} à ${apt.heure}</div>
                    <div class="appointment-client">
                        <strong>${apt.clients?.nom || 'Client inconnu'}</strong>
                        <span>${apt.clients?.email || ''}</span>
                    </div>
                    <div class="appointment-type">${apt.type}</div>
                    <div class="appointment-status status-${apt.status}">${apt.status}</div>
                </div>
                <div class="appointment-actions">
                    <button onclick="employeeDashboard.viewClient('${apt.client_id}')" class="btn-small">Voir client</button>
                    <button onclick="employeeDashboard.addFollowUp('${apt.id}')" class="btn-small">Suivi</button>
                    <button onclick="employeeDashboard.editAppointment('${apt.id}')" class="btn-small">Modifier</button>
                </div>
            </div>
        `).join('');
    }

    async loadClients() {
        try {
            showMessage('Chargement des clients...', 'info');

            const { data: clients, error } = await supabase
                .from('clients')
                .select(`
                    *,
                    appointments(count),
                    follow_ups(*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.displayClients(clients);
            showMessage('Clients chargés avec succès', 'success');

        } catch (error) {
            console.error('Erreur lors du chargement des clients:', error);
            handleSupabaseError(error);
        }
    }

    displayClients(clients) {
        const container = document.getElementById('clientsList');
        if (!container) return;

        if (clients.length === 0) {
            container.innerHTML = '<p>Aucun client trouvé</p>';
            return;
        }

        container.innerHTML = clients.map(client => {
            const lastFollowUp = client.follow_ups?.[0];
            const appointmentCount = client.appointments?.[0]?.count || 0;

            return `
                <div class="client-card" onclick="employeeDashboard.viewClientDetails('${client.id}')">
                    <div class="client-info">
                        <h3>${client.nom}</h3>
                        <p>${client.email}</p>
                        <p>${client.telephone}</p>
                        <small>Client depuis: ${this.formatDate(client.created_at)}</small>
                    </div>
                    <div class="client-stats">
                        <div class="stat">
                            <span class="stat-number">${appointmentCount}</span>
                            <span class="stat-label">RDV</span>
                        </div>
                        ${lastFollowUp ? `
                            <div class="stat">
                                <span class="stat-number mental-state-${lastFollowUp.mental_state}">${lastFollowUp.score || 'N/A'}</span>
                                <span class="stat-label">Dernier score</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="client-actions">
                        <button onclick="event.stopPropagation(); employeeDashboard.viewClientProgress('${client.id}')" class="btn-small">Progression</button>
                        <button onclick="event.stopPropagation(); employeeDashboard.addFollowUpForClient('${client.id}')" class="btn-small">Nouveau suivi</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async viewClientDetails(clientId) {
        try {
            showMessage('Chargement des détails du client...', 'info');

            // Load client with all related data
            const { data: client, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', clientId)
                .single();

            if (clientError) throw clientError;

            // Load appointments
            const { data: appointments, error: appointmentsError } = await supabase
                .from('appointments')
                .select('*')
                .eq('client_id', clientId)
                .order('date', { ascending: false });

            if (appointmentsError) throw appointmentsError;

            // Load follow-ups
            const { data: followUps, error: followUpsError } = await supabase
                .from('follow_ups')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (followUpsError) throw followUpsError;

            // Load payments
            const { data: payments, error: paymentsError } = await supabase
                .from('payments')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (paymentsError) throw paymentsError;

            this.showClientModal(client, appointments, followUps, payments);
            showMessage('Détails du client chargés', 'success');

        } catch (error) {
            console.error('Erreur lors du chargement des détails du client:', error);
            handleSupabaseError(error);
        }
    }

    showClientModal(client, appointments, followUps, payments) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content client-modal">
                <div class="modal-header">
                    <h2>Dossier de ${client.nom}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="client-details-tabs">
                        <button class="tab-btn active" data-tab="info">Informations</button>
                        <button class="tab-btn" data-tab="appointments">Rendez-vous</button>
                        <button class="tab-btn" data-tab="followups">Suivi psychologique</button>
                        <button class="tab-btn" data-tab="payments">Paiements</button>
                        <button class="tab-btn" data-tab="progress">Progression</button>
                    </div>
                    
                    <div class="tab-content">
                        <div class="tab-pane active" id="info">
                            <div class="client-info-grid">
                                <div class="info-item">
                                    <label>Nom:</label>
                                    <span>${client.nom}</span>
                                </div>
                                <div class="info-item">
                                    <label>Email:</label>
                                    <span>${client.email}</span>
                                </div>
                                <div class="info-item">
                                    <label>Téléphone:</label>
                                    <span>${client.telephone}</span>
                                </div>
                                <div class="info-item">
                                    <label>Client depuis:</label>
                                    <span>${this.formatDate(client.created_at)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="tab-pane" id="appointments">
                            <div class="appointments-list">
                                ${appointments.map(apt => `
                                    <div class="appointment-item">
                                        <div class="appointment-date">${this.formatDate(apt.date)} à ${apt.heure}</div>
                                        <div class="appointment-type">${apt.type}</div>
                                        <div class="appointment-status">${apt.status}</div>
                                        <button onclick="employeeDashboard.addFollowUp('${apt.id}')" class="btn-small">Ajouter suivi</button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="tab-pane" id="followups">
                            <div class="followups-list">
                                ${followUps.map(followUp => `
                                    <div class="followup-item">
                                        <div class="followup-header">
                                            <span class="followup-date">${this.formatDate(followUp.created_at)}</span>
                                            <span class="mental-state mental-state-${followUp.mental_state}">${followUp.mental_state}</span>
                                            <span class="score">Score: ${followUp.score}/10</span>
                                        </div>
                                        <div class="followup-notes">${followUp.notes}</div>
                                    </div>
                                `).join('')}
                            </div>
                            <button onclick="employeeDashboard.addFollowUpForClient('${client.id}')" class="btn-primary">Nouveau suivi</button>
                        </div>
                        
                        <div class="tab-pane" id="payments">
                            <div class="payments-list">
                                ${payments.map(payment => `
                                    <div class="payment-item">
                                        <div class="payment-date">${this.formatDate(payment.created_at)}</div>
                                        <div class="payment-amount">${payment.montant}€</div>
                                        <div class="payment-status status-${payment.status}">${payment.status}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="tab-pane" id="progress">
                            <div class="progress-chart">
                                <canvas id="progressChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup modal events
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Setup tabs
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                
                modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                modal.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                e.target.classList.add('active');
                modal.querySelector(`#${tabId}`).classList.add('active');
                
                if (tabId === 'progress') {
                    this.drawProgressChart(followUps);
                }
            });
        });
    }

    drawProgressChart(followUps) {
        const canvas = document.getElementById('progressChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (followUps.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Aucune donnée de suivi disponible', width / 2, height / 2);
            return;
        }

        // Sort follow-ups by date
        const sortedFollowUps = followUps.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const scores = sortedFollowUps.map(f => f.score || 0);
        const maxScore = 10;
        const minScore = 0;

        // Draw axes
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, height - 50);
        ctx.lineTo(width - 50, height - 50);
        ctx.moveTo(50, 50);
        ctx.lineTo(50, height - 50);
        ctx.stroke();

        // Draw score line
        if (scores.length > 1) {
            ctx.strokeStyle = '#007bff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            scores.forEach((score, index) => {
                const x = 50 + (index * (width - 100) / (scores.length - 1));
                const y = height - 50 - ((score - minScore) * (height - 100) / (maxScore - minScore));
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Draw points
            ctx.fillStyle = '#007bff';
            scores.forEach((score, index) => {
                const x = 50 + (index * (width - 100) / (scores.length - 1));
                const y = height - 50 - ((score - minScore) * (height - 100) / (maxScore - minScore));
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            });
        }

        // Draw labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // Y-axis labels
        for (let i = 0; i <= 10; i += 2) {
            const y = height - 50 - (i * (height - 100) / 10);
            ctx.fillText(i.toString(), 30, y + 4);
        }
    }

    async addFollowUp(appointmentId) {
        this.selectedAppointment = appointmentId;
        this.showFollowUpModal();
    }

    async addFollowUpForClient(clientId) {
        this.selectedClient = clientId;
        this.showFollowUpModal();
    }

    showFollowUpModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content followup-modal">
                <div class="modal-header">
                    <h2>Nouveau suivi psychologique</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="followUpForm">
                        <div class="form-group">
                            <label for="mentalState">État mental:</label>
                            <select id="mentalState" required>
                                <option value="">Sélectionner...</option>
                                <option value="bas">Bas</option>
                                <option value="moyen">Moyen</option>
                                <option value="ameliore">Amélioré</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="score">Score (1-10):</label>
                            <input type="number" id="score" min="1" max="10" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="notes">Notes de séance:</label>
                            <textarea id="notes" rows="6" placeholder="Compte-rendu détaillé de la séance..." required></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary close-modal">Annuler</button>
                            <button type="submit" class="btn-primary">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup modal events
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Setup form submission
        modal.querySelector('#followUpForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveFollowUp(modal);
        });
    }

    async saveFollowUp(modal) {
        try {
            const mentalState = document.getElementById('mentalState').value;
            const score = parseInt(document.getElementById('score').value);
            const notes = document.getElementById('notes').value;

            let clientId = this.selectedClient;
            let appointmentId = this.selectedAppointment;

            // If we have an appointment ID, get the client ID
            if (appointmentId && !clientId) {
                const { data: appointment, error } = await supabase
                    .from('appointments')
                    .select('client_id')
                    .eq('id', appointmentId)
                    .single();

                if (error) throw error;
                clientId = appointment.client_id;
            }

            if (!clientId) {
                throw new Error('Client ID manquant');
            }

            const followUpData = {
                client_id: clientId,
                appointment_id: appointmentId,
                mental_state: mentalState,
                score: score,
                notes: notes
            };

            const { data, error } = await supabase
                .from('follow_ups')
                .insert([followUpData])
                .select();

            if (error) throw error;

            showMessage('Suivi enregistré avec succès', 'success');
            
            if (modal) {
                document.body.removeChild(modal);
            }

            // Refresh current view
            if (this.currentView === 'clients') {
                this.loadClients();
            } else if (this.currentView === 'appointments') {
                this.loadAppointments();
            }

            // Reset selections
            this.selectedClient = null;
            this.selectedAppointment = null;

        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du suivi:', error);
            handleSupabaseError(error);
        }
    }

    async searchClients(searchTerm) {
        if (!searchTerm.trim()) {
            this.loadClients();
            return;
        }

        try {
            const { data: clients, error } = await supabase
                .from('clients')
                .select(`
                    *,
                    appointments(count),
                    follow_ups(*)
                `)
                .or(`nom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telephone.ilike.%${searchTerm}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.displayClients(clients);

        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            handleSupabaseError(error);
        }
    }

    async loadAnalytics() {
        try {
            showMessage('Chargement des analyses...', 'info');

            // Get analytics data
            const analytics = await this.getAnalyticsData();
            this.displayAnalytics(analytics);

            showMessage('Analyses chargées avec succès', 'success');

        } catch (error) {
            console.error('Erreur lors du chargement des analyses:', error);
            handleSupabaseError(error);
        }
    }

    async getAnalyticsData() {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisYear = new Date(now.getFullYear(), 0, 1);

        // Monthly appointments
        const { data: monthlyAppointments } = await supabase
            .from('appointments')
            .select('date, type')
            .gte('created_at', thisMonth.toISOString());

        // Revenue this month
        const { data: monthlyPayments } = await supabase
            .from('payments')
            .select('montant')
            .eq('status', 'paye')
            .gte('created_at', thisMonth.toISOString());

        // Client satisfaction (average scores)
        const { data: followUps } = await supabase
            .from('follow_ups')
            .select('score, mental_state, created_at')
            .gte('created_at', thisYear.toISOString());

        // Most common appointment types
        const { data: appointmentTypes } = await supabase
            .from('appointments')
            .select('type')
            .gte('created_at', thisYear.toISOString());

        return {
            monthlyAppointments: monthlyAppointments || [],
            monthlyRevenue: monthlyPayments?.reduce((sum, p) => sum + (p.montant || 0), 0) || 0,
            followUps: followUps || [],
            appointmentTypes: appointmentTypes || []
        };
    }

    displayAnalytics(analytics) {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        const avgScore = analytics.followUps.length > 0 
            ? (analytics.followUps.reduce((sum, f) => sum + (f.score || 0), 0) / analytics.followUps.length).toFixed(1)
            : 'N/A';

        const typeStats = analytics.appointmentTypes.reduce((acc, apt) => {
            acc[apt.type] = (acc[apt.type] || 0) + 1;
            return acc;
        }, {});

        container.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h3>Ce mois</h3>
                    <div class="metric">
                        <span class="metric-value">${analytics.monthlyAppointments.length}</span>
                        <span class="metric-label">Rendez-vous</span>
                    </div>
                    <div class="metric">
                        <span class="metric-value">${analytics.monthlyRevenue}€</span>
                        <span class="metric-label">Revenus</span>
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>Satisfaction client</h3>
                    <div class="metric">
                        <span class="metric-value">${avgScore}</span>
                        <span class="metric-label">Score moyen</span>
                    </div>
                    <div class="satisfaction-breakdown">
                        ${Object.entries(analytics.followUps.reduce((acc, f) => {
                            acc[f.mental_state] = (acc[f.mental_state] || 0) + 1;
                            return acc;
                        }, {})).map(([state, count]) => `
                            <div class="satisfaction-item">
                                <span class="mental-state-${state}">${state}</span>: ${count}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="analytics-card">
                    <h3>Types de consultation</h3>
                    ${Object.entries(typeStats).map(([type, count]) => `
                        <div class="type-stat">
                            <span class="type-name">${type}</span>
                            <span class="type-count">${count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            .dashboard-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }

            .dashboard-nav {
                display: flex;
                gap: 10px;
                margin-bottom: 30px;
                border-bottom: 2px solid #eee;
                padding-bottom: 10px;
            }

            .nav-btn {
                padding: 10px 20px;
                background: #f8f9fa;
                border: 1px solid #ddd;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .nav-btn:hover {
                background: #e9ecef;
            }

            .nav-btn.active {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }

            .dashboard-section {
                display: none;
            }

            .dashboard-section.active {
                display: block;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .stat-card {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                text-align: center;
            }

            .stat-card h3 {
                font-size: 2em;
                margin: 0 0 10px 0;
                color: #007bff;
            }

            .appointment-card, .client-card, .message-card {
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-bottom: 10px;
                cursor: pointer;
                transition: transform 0.2s ease;
            }

            .appointment-card:hover, .client-card:hover, .message-card:hover {
                transform: translateY(-2px);
            }

            .appointment-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-bottom: 10px;
            }

            .appointment-info {
                display: flex;
                gap: 20px;
                align-items: center;
            }

            .appointment-actions {
                display: flex;
                gap: 10px;
            }

            .btn-small {
                padding: 5px 10px;
                font-size: 12px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .btn-small:hover {
                background: #f8f9fa;
            }

            .status-confirme { color: #28a745; }
            .status-en_attente { color: #ffc107; }
            .status-annule { color: #dc3545; }

            .mental-state-bas { color: #dc3545; }
            .mental-state-moyen { color: #ffc107; }
            .mental-state-ameliore { color: #28a745; }

            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }

            .modal-content {
                background: white;
                border-radius: 8px;
                max-width: 800px;
                width: 90%;
                max-height: 90%;
                overflow-y: auto;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #eee;
            }

            .close-modal {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }

            .modal-body {
                padding: 20px;
            }

            .client-details-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                border-bottom: 1px solid #eee;
            }

            .tab-btn {
                padding: 10px 15px;
                background: none;
                border: none;
                border-bottom: 2px solid transparent;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .tab-btn.active {
                border-bottom-color: #007bff;
                color: #007bff;
            }

            .tab-pane {
                display: none;
            }

            .tab-pane.active {
                display: block;
            }

            .client-info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }

            .info-item {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .info-item label {
                font-weight: bold;
                color: #666;
            }

            .followup-item {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 10px;
            }

            .followup-header {
                display: flex;
                gap: 15px;
                align-items: center;
                margin-bottom: 10px;
            }

            .score {
                background: #007bff;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
            }

            .form-group {
                margin-bottom: 15px;
            }

            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }

            .form-group input, .form-group select, .form-group textarea {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }

            .form-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }

            .btn-primary {
                background: #007bff;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s ease;
            }

            .btn-primary:hover {
                background: #0056b3;
            }

            .btn-secondary {
                background: #6c757d;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s ease;
            }

            .btn-secondary:hover {
                background: #545b62;
            }

            .filters {
                display: flex;
                gap: 15px;
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
            }

            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .filter-group label {
                font-size: 12px;
                color: #666;
                font-weight: bold;
            }

            .search-box {
                flex: 1;
                max-width: 300px;
            }

            .analytics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }

            .analytics-card {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .metric {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 15px;
            }

            .metric-value {
                font-size: 2em;
                font-weight: bold;
                color: #007bff;
            }

            .metric-label {
                color: #666;
                font-size: 14px;
            }

            .message-card.unread {
                border-left: 4px solid #007bff;
                background: #f8f9ff;
            }

            .message-preview {
                color: #666;
                font-size: 14px;
                margin: 5px 0;
            }

            @media (max-width: 768px) {
                .dashboard-nav {
                    flex-wrap: wrap;
                }
                
                .appointment-row {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                }
                
                .appointment-info {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 5px;
                }
                
                .filters {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize dashboard when DOM is loaded
let employeeDashboard;
document.addEventListener('DOMContentLoaded', () => {
    employeeDashboard = new EmployeeDashboard();
});

// Export for global access
window.employeeDashboard = employeeDashboard;