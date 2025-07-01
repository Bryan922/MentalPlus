// Script pour la page de profil avec intégration Supabase
import { clientService, appointmentService, paymentService, followUpService } from './supabase-config.js'

// Variables globales
let currentClient = null
let clientAppointments = []
let clientPayments = []
let clientFollowUps = []

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeProfilePage()
    setupEventListeners()
    loadClientData()
})

// Fonction d'initialisation
function initializeProfilePage() {
    console.log('Initialisation de la page de profil avec Supabase')
    
    // Vérifier si un client est connecté (simulation)
    const clientId = localStorage.getItem('currentClientId') || getClientIdFromUrl()
    
    if (!clientId) {
        showMessage('Veuillez vous connecter pour accéder à votre profil', 'warning')
        setTimeout(() => {
            window.location.href = 'index.html'
        }, 3000)
        return
    }
    
    window.currentClientId = clientId
}

// Récupération de l'ID client depuis l'URL
function getClientIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('client')
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Onglets de navigation
    const tabButtons = document.querySelectorAll('.tab-button')
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            switchTab(this.dataset.tab)
        })
    })
    
    // Formulaire de mise à jour du profil
    const profileForm = document.getElementById('profile-form')
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate)
    }
    
    // Bouton de déconnexion
    const logoutButton = document.getElementById('logout-button')
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout)
    }
    
    // Boutons d'action sur les rendez-vous
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('cancel-appointment')) {
            handleAppointmentCancellation(e.target.dataset.appointmentId)
        }
        if (e.target.classList.contains('reschedule-appointment')) {
            handleAppointmentReschedule(e.target.dataset.appointmentId)
        }
    })
}

// Chargement des données du client
async function loadClientData() {
    if (!window.currentClientId) return
    
    try {
        showLoading(true)
        
        // Charger les informations du client
        await loadClientInfo()
        
        // Charger l'historique des rendez-vous
        await loadAppointmentHistory()
        
        // Charger l'historique des paiements
        await loadPaymentHistory()
        
        // Charger les notes de suivi
        await loadFollowUpNotes()
        
        // Mettre à jour l'interface
        updateProfileDisplay()
        
        showLoading(false)
        
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        showMessage('Erreur lors du chargement de votre profil', 'error')
        showLoading(false)
    }
}

// Chargement des informations du client
async function loadClientInfo() {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', window.currentClientId)
        .single()
    
    if (error) throw error
    
    currentClient = data
    console.log('Informations client chargées:', currentClient)
}

// Chargement de l'historique des rendez-vous
async function loadAppointmentHistory() {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            payments (*),
            follow_ups (*)
        `)
        .eq('client_id', window.currentClientId)
        .order('date', { ascending: false })
    
    if (error) throw error
    
    clientAppointments = data
    console.log('Historique des rendez-vous chargé:', clientAppointments)
}

// Chargement de l'historique des paiements
async function loadPaymentHistory() {
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', window.currentClientId)
        .order('created_at', { ascending: false })
    
    if (error) throw error
    
    clientPayments = data
    console.log('Historique des paiements chargé:', clientPayments)
}

// Chargement des notes de suivi
async function loadFollowUpNotes() {
    const { data, error } = await supabase
        .from('follow_ups')
        .select(`
            *,
            appointments (date, heure, type)
        `)
        .eq('client_id', window.currentClientId)
        .order('created_at', { ascending: false })
    
    if (error) throw error
    
    clientFollowUps = data
    console.log('Notes de suivi chargées:', clientFollowUps)
}

// Mise à jour de l'affichage du profil
function updateProfileDisplay() {
    if (!currentClient) return
    
    // Mettre à jour les informations personnelles
    document.getElementById('client-name').textContent = currentClient.nom
    document.getElementById('client-email').textContent = currentClient.email
    document.getElementById('client-phone').textContent = currentClient.telephone || 'Non renseigné'
    document.getElementById('member-since').textContent = formatDate(currentClient.created_at)
    
    // Remplir le formulaire de modification
    document.getElementById('profile-name').value = currentClient.nom
    document.getElementById('profile-email').value = currentClient.email
    document.getElementById('profile-phone').value = currentClient.telephone || ''
    
    // Mettre à jour les statistiques
    updateStatistics()
    
    // Mettre à jour les onglets
    updateAppointmentsTab()
    updatePaymentsTab()
    updateFollowUpsTab()
}

// Mise à jour des statistiques
function updateStatistics() {
    const totalAppointments = clientAppointments.length
    const upcomingAppointments = clientAppointments.filter(apt => new Date(apt.date) > new Date()).length
    const totalPayments = clientPayments.reduce((sum, payment) => sum + (payment.montant || 0), 0)
    
    document.getElementById('total-appointments').textContent = totalAppointments
    document.getElementById('upcoming-appointments').textContent = upcomingAppointments
    document.getElementById('total-spent').textContent = `${totalPayments}€`
}

// Mise à jour de l'onglet des rendez-vous
function updateAppointmentsTab() {
    const container = document.getElementById('appointments-list')
    if (!container) return
    
    if (clientAppointments.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun rendez-vous trouvé.</p>'
        return
    }
    
    container.innerHTML = clientAppointments.map(appointment => {
        const appointmentDate = new Date(appointment.date)
        const isUpcoming = appointmentDate > new Date()
        const statusClass = isUpcoming ? 'upcoming' : 'past'
        
        return `
            <div class="appointment-card ${statusClass}">
                <div class="appointment-header">
                    <h3>${formatDate(appointment.date)} à ${appointment.heure}</h3>
                    <span class="appointment-type">${appointment.type === 'nuit' ? 'Consultation de nuit' : 'Consultation standard'}</span>
                </div>
                <div class="appointment-details">
                    <p><strong>Statut:</strong> ${getAppointmentStatus(appointment)}</p>
                    <p><strong>Paiement:</strong> ${getPaymentStatus(appointment)}</p>
                    ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
                </div>
                ${isUpcoming ? `
                    <div class="appointment-actions">
                        <button class="btn-secondary cancel-appointment" data-appointment-id="${appointment.id}">
                            <i class="fas fa-times"></i> Annuler
                        </button>
                        <button class="btn-primary reschedule-appointment" data-appointment-id="${appointment.id}">
                            <i class="fas fa-calendar-alt"></i> Reporter
                        </button>
                    </div>
                ` : ''}
                ${appointment.follow_ups && appointment.follow_ups.length > 0 ? `
                    <div class="follow-up-summary">
                        <p><strong>Dernière évaluation:</strong> ${appointment.follow_ups[0].mental_state}</p>
                        <p><strong>Score:</strong> ${appointment.follow_ups[0].score}/10</p>
                    </div>
                ` : ''}
            </div>
        `
    }).join('')
}

// Mise à jour de l'onglet des paiements
function updatePaymentsTab() {
    const container = document.getElementById('payments-list')
    if (!container) return
    
    if (clientPayments.length === 0) {
        container.innerHTML = '<p class="no-data">Aucun paiement trouvé.</p>'
        return
    }
    
    container.innerHTML = clientPayments.map(payment => {
        const statusClass = payment.status === 'payé' ? 'paid' : payment.status === 'échoué' ? 'failed' : 'pending'
        
        return `
            <div class="payment-card ${statusClass}">
                <div class="payment-header">
                    <h3>${payment.montant}€</h3>
                    <span class="payment-status">${payment.status}</span>
                </div>
                <div class="payment-details">
                    <p><strong>Date:</strong> ${formatDate(payment.created_at)}</p>
                    <p><strong>Méthode:</strong> ${payment.method || 'Carte bancaire'}</p>
                    ${payment.transaction_id ? `<p><strong>Transaction:</strong> ${payment.transaction_id}</p>` : ''}
                </div>
            </div>
        `
    }).join('')
}

// Mise à jour de l'onglet des notes de suivi
function updateFollowUpsTab() {
    const container = document.getElementById('followups-list')
    if (!container) return
    
    if (clientFollowUps.length === 0) {
        container.innerHTML = '<p class="no-data">Aucune note de suivi disponible.</p>'
        return
    }
    
    container.innerHTML = clientFollowUps.map(followUp => {
        const stateClass = followUp.mental_state === 'amélioré' ? 'improved' : 
                          followUp.mental_state === 'moyen' ? 'stable' : 'low'
        
        return `
            <div class="followup-card ${stateClass}">
                <div class="followup-header">
                    <h3>Séance du ${formatDate(followUp.appointments.date)}</h3>
                    <div class="mental-state">
                        <span class="state-label">${followUp.mental_state}</span>
                        <span class="score">${followUp.score}/10</span>
                    </div>
                </div>
                <div class="followup-content">
                    <p>${followUp.notes}</p>
                </div>
                <div class="followup-date">
                    <small>Rédigé le ${formatDate(followUp.created_at)}</small>
                </div>
            </div>
        `
    }).join('')
    
    // Générer le graphique de progression
    generateProgressChart()
}

// Génération du graphique de progression
function generateProgressChart() {
    const chartContainer = document.getElementById('progress-chart')
    if (!chartContainer || clientFollowUps.length === 0) return
    
    const scores = clientFollowUps.reverse().map(fu => fu.score)
    const dates = clientFollowUps.map(fu => formatDate(fu.created_at, true))
    
    // Créer un graphique simple avec CSS
    const maxScore = Math.max(...scores)
    const minScore = Math.min(...scores)
    
    chartContainer.innerHTML = `
        <div class="chart-header">
            <h3>Évolution de votre état mental</h3>
            <p>Score moyen: ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}/10</p>
        </div>
        <div class="chart-content">
            ${scores.map((score, index) => `
                <div class="chart-point" style="height: ${(score / 10) * 100}%" title="${dates[index]}: ${score}/10">
                    <span class="point-value">${score}</span>
                </div>
            `).join('')}
        </div>
        <div class="chart-labels">
            ${dates.map(date => `<span class="chart-label">${date}</span>`).join('')}
        </div>
    `
}

// Changement d'onglet
function switchTab(tabName) {
    // Mettre à jour les boutons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active')
    })
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active')
    
    // Mettre à jour le contenu
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active')
    })
    document.getElementById(`${tabName}-tab`).classList.add('active')
}

// Gestion de la mise à jour du profil
async function handleProfileUpdate(e) {
    e.preventDefault()
    
    const submitButton = e.target.querySelector('button[type="submit"]')
    const originalText = submitButton.textContent
    
    try {
        submitButton.disabled = true
        submitButton.textContent = 'Mise à jour...'
        
        const formData = new FormData(e.target)
        const updateData = {
            nom: formData.get('name'),
            email: formData.get('email'),
            telephone: formData.get('phone')
        }
        
        // Valider les données
        const validation = validateProfileData(updateData)
        if (!validation.isValid) {
            throw new Error(validation.errors.join('\n'))
        }
        
        // Mettre à jour dans Supabase
        const result = await clientService.update(window.currentClientId, updateData)
        
        if (!result.success) {
            throw new Error(result.error)
        }
        
        // Mettre à jour les données locales
        currentClient = { ...currentClient, ...updateData }
        updateProfileDisplay()
        
        showMessage('Profil mis à jour avec succès', 'success')
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error)
        showMessage(error.message, 'error')
    } finally {
        submitButton.disabled = false
        submitButton.textContent = originalText
    }
}

// Validation des données de profil
function validateProfileData(data) {
    const errors = []
    
    if (!data.nom || data.nom.trim().length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères')
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!data.email || !emailRegex.test(data.email)) {
        errors.push('Veuillez saisir une adresse email valide')
    }
    
    if (data.telephone && !/^[0-9+\s-()]{10,}$/.test(data.telephone)) {
        errors.push('Le numéro de téléphone n\'est pas valide')
    }
    
    return {
        isValid: errors.length === 0,
        errors
    }
}

// Gestion de l'annulation de rendez-vous
async function handleAppointmentCancellation(appointmentId) {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
        return
    }
    
    try {
        const result = await appointmentService.updateStatus(appointmentId, 'annulé')
        
        if (!result.success) {
            throw new Error(result.error)
        }
        
        showMessage('Rendez-vous annulé avec succès', 'success')
        
        // Recharger les données
        await loadAppointmentHistory()
        updateAppointmentsTab()
        
    } catch (error) {
        console.error('Erreur lors de l\'annulation:', error)
        showMessage('Erreur lors de l\'annulation du rendez-vous', 'error')
    }
}

// Gestion du report de rendez-vous
function handleAppointmentReschedule(appointmentId) {
    showMessage('Fonctionnalité de report en cours de développement', 'info')
    // Rediriger vers la page de prise de rendez-vous avec l'ID existant
    // window.location.href = `rendez-vous.html?reschedule=${appointmentId}`
}

// Gestion de la déconnexion
function handleLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        localStorage.removeItem('currentClientId')
        showMessage('Déconnexion réussie', 'success')
        setTimeout(() => {
            window.location.href = 'index.html'
        }, 1500)
    }
}

// Fonctions utilitaires
function getAppointmentStatus(appointment) {
    if (appointment.status) {
        return appointment.status
    }
    
    const appointmentDate = new Date(appointment.date)
    const now = new Date()
    
    if (appointmentDate > now) {
        return 'À venir'
    } else {
        return 'Terminé'
    }
}

function getPaymentStatus(appointment) {
    if (appointment.payments && appointment.payments.length > 0) {
        return appointment.payments[0].status
    }
    return 'Non payé'
}

function formatDate(dateString, short = false) {
    const date = new Date(dateString)
    if (short) {
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    }
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

function showLoading(show) {
    const loader = document.getElementById('profile-loader')
    if (loader) {
        loader.style.display = show ? 'flex' : 'none'
    }
}

function showMessage(message, type = 'success') {
    // Supprimer les anciens messages
    const existingMessages = document.querySelectorAll('.profile-message')
    existingMessages.forEach(msg => msg.remove())
    
    // Créer le nouveau message
    const messageDiv = document.createElement('div')
    messageDiv.className = `profile-message ${type}`
    
    const icon = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'info': 'fa-info-circle',
        'warning': 'fa-exclamation-triangle'
    }[type] || 'fa-info-circle'
    
    messageDiv.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `
    
    // Insérer le message
    const main = document.querySelector('main')
    main.insertBefore(messageDiv, main.firstChild)
    
    // Supprimer le message après 5 secondes
    setTimeout(() => {
        messageDiv.remove()
    }, 5000)
}

// Styles CSS pour les nouveaux éléments
const styles = `
.profile-message {
    padding: 12px 20px;
    margin-bottom: 20px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
}

.profile-message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.profile-message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.profile-message.info {
    background-color: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}

.profile-message.warning {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

.appointment-card, .payment-card, .followup-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 15px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    border-left: 4px solid #ddd;
}

.appointment-card.upcoming {
    border-left-color: #28a745;
}

.appointment-card.past {
    border-left-color: #6c757d;
}

.payment-card.paid {
    border-left-color: #28a745;
}

.payment-card.failed {
    border-left-color: #dc3545;
}

.payment-card.pending {
    border-left-color: #ffc107;
}

.followup-card.improved {
    border-left-color: #28a745;
}

.followup-card.stable {
    border-left-color: #ffc107;
}

.followup-card.low {
    border-left-color: #dc3545;
}

.chart-content {
    display: flex;
    align-items: end;
    height: 200px;
    gap: 10px;
    padding: 20px 0;
    border-bottom: 2px solid #ddd;
}

.chart-point {
    flex: 1;
    background: linear-gradient(to top, #007bff, #0056b3);
    border-radius: 4px 4px 0 0;
    position: relative;
    min-height: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.chart-point:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,123,255,0.3);
}

.point-value {
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    font-weight: bold;
    color: #333;
}

.chart-labels {
    display: flex;
    gap: 10px;
    margin-top: 10px;
}

.chart-label {
    flex: 1;
    text-align: center;
    font-size: 12px;
    color: #666;
}

.no-data {
    text-align: center;
    color: #666;
    font-style: italic;
    padding: 40px 20px;
}

#profile-loader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255,255,255,0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.loader-spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`

// Injecter les styles
const styleSheet = document.createElement('style')
styleSheet.textContent = styles
document.head.appendChild(styleSheet)

// Ajouter un loader si il n'existe pas
if (!document.getElementById('profile-loader')) {
    const loader = document.createElement('div')
    loader.id = 'profile-loader'
    loader.style.display = 'none'
    loader.innerHTML = '<div class="loader-spinner"></div>'
    document.body.appendChild(loader)
}