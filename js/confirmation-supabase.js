// Script pour la page de confirmation avec intégration Supabase
import { appointmentService, clientService, paymentService } from './supabase-config.js'

// Variables globales
let appointmentData = null
let clientData = null
let paymentData = null

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeConfirmationPage()
    loadAppointmentData()
    setupEventListeners()
})

// Fonction d'initialisation
function initializeConfirmationPage() {
    console.log('Initialisation de la page de confirmation avec Supabase')
    
    // Récupérer l'ID du rendez-vous depuis l'URL
    const urlParams = new URLSearchParams(window.location.search)
    const appointmentId = urlParams.get('appointment')
    
    if (!appointmentId) {
        showMessage('Aucun rendez-vous spécifié', 'error')
        setTimeout(() => {
            window.location.href = 'index.html'
        }, 3000)
        return
    }
    
    window.appointmentId = appointmentId
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Bouton de téléchargement de la confirmation
    const downloadButton = document.getElementById('download-confirmation')
    if (downloadButton) {
        downloadButton.addEventListener('click', downloadConfirmation)
    }
    
    // Bouton d'envoi par email
    const emailButton = document.getElementById('email-confirmation')
    if (emailButton) {
        emailButton.addEventListener('click', emailConfirmation)
    }
    
    // Bouton de retour à l'accueil
    const homeButton = document.getElementById('back-to-home')
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            window.location.href = 'index.html'
        })
    }
    
    // Bouton de nouveau rendez-vous
    const newAppointmentButton = document.getElementById('new-appointment')
    if (newAppointmentButton) {
        newAppointmentButton.addEventListener('click', () => {
            window.location.href = 'rendez-vous.html'
        })
    }
    
    // Bouton d'accès au profil
    const profileButton = document.getElementById('access-profile')
    if (profileButton) {
        profileButton.addEventListener('click', () => {
            if (clientData) {
                window.location.href = `profile.html?client=${clientData.id}`
            }
        })
    }
}

// Chargement des données du rendez-vous
async function loadAppointmentData() {
    if (!window.appointmentId) return
    
    try {
        showLoading(true)
        
        // Charger les détails du rendez-vous avec les données du client et du paiement
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                clients (*),
                payments (*)
            `)
            .eq('id', window.appointmentId)
            .single()
        
        if (error) throw error
        
        appointmentData = data
        clientData = data.clients
        paymentData = data.payments && data.payments.length > 0 ? data.payments[0] : null
        
        // Mettre à jour l'affichage
        updateConfirmationDisplay()
        
        // Envoyer une notification de confirmation (simulation)
        await sendConfirmationNotification()
        
        showLoading(false)
        
    } catch (error) {
        console.error('Erreur lors du chargement du rendez-vous:', error)
        showMessage('Erreur lors du chargement des données du rendez-vous', 'error')
        showLoading(false)
        
        // Fallback avec des données simulées
        loadFallbackData()
    }
}

// Chargement de données de fallback
function loadFallbackData() {
    // Données simulées pour la démonstration
    appointmentData = {
        id: window.appointmentId,
        date: new Date().toISOString().split('T')[0],
        heure: '14:00',
        type: 'classique',
        status: 'confirmé',
        notes: 'Première consultation',
        created_at: new Date().toISOString()
    }
    
    clientData = {
        id: 'client-demo',
        nom: 'Client Démo',
        email: 'client@example.com',
        telephone: '01 23 45 67 89'
    }
    
    paymentData = {
        id: 'payment-demo',
        montant: appointmentData.type === 'nuit' ? 80 : 60,
        status: 'payé',
        method: 'Carte bancaire',
        created_at: new Date().toISOString()
    }
    
    updateConfirmationDisplay()
    showMessage('Données de démonstration chargées', 'info')
}

// Mise à jour de l'affichage de la confirmation
function updateConfirmationDisplay() {
    if (!appointmentData || !clientData) return
    
    // Mettre à jour les informations du client
    updateElement('client-name', clientData.nom)
    updateElement('client-email', clientData.email)
    updateElement('client-phone', clientData.telephone)
    
    // Mettre à jour les détails du rendez-vous
    const appointmentDate = new Date(appointmentData.date)
    const dateStr = appointmentDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
    
    updateElement('appointment-date', dateStr)
    updateElement('appointment-time', appointmentData.heure)
    
    const typeText = appointmentData.type === 'nuit' ? 'Consultation de nuit' : 'Consultation standard'
    updateElement('appointment-type', typeText)
    
    const price = appointmentData.type === 'nuit' ? '80€' : '60€'
    updateElement('appointment-price', price)
    
    updateElement('appointment-status', appointmentData.status || 'Confirmé')
    
    // Mettre à jour les informations de paiement
    if (paymentData) {
        updateElement('payment-amount', `${paymentData.montant}€`)
        updateElement('payment-status', paymentData.status)
        updateElement('payment-method', paymentData.method || 'Carte bancaire')
        
        // Afficher/masquer les sections selon le statut de paiement
        const paymentSection = document.getElementById('payment-section')
        if (paymentSection) {
            paymentSection.style.display = 'block'
        }
    }
    
    // Mettre à jour le numéro de confirmation
    const confirmationNumber = generateConfirmationNumber(appointmentData.id)
    updateElement('confirmation-number', confirmationNumber)
    
    // Mettre à jour les instructions
    updateInstructions()
    
    // Générer le récapitulatif
    generateSummary()
}

// Mise à jour d'un élément du DOM
function updateElement(id, value) {
    const element = document.getElementById(id)
    if (element) {
        element.textContent = value
    }
}

// Génération du numéro de confirmation
function generateConfirmationNumber(appointmentId) {
    const prefix = 'MP'
    const timestamp = Date.now().toString().slice(-6)
    const idSuffix = appointmentId.toString().slice(-4)
    return `${prefix}${timestamp}${idSuffix}`.toUpperCase()
}

// Mise à jour des instructions
function updateInstructions() {
    const instructionsContainer = document.getElementById('instructions-container')
    if (!instructionsContainer) return
    
    const isNightConsultation = appointmentData.type === 'nuit'
    const appointmentDate = new Date(appointmentData.date)
    const isToday = appointmentDate.toDateString() === new Date().toDateString()
    
    let instructions = `
        <div class="instruction-item">
            <i class="fas fa-clock"></i>
            <div>
                <h4>Ponctualité</h4>
                <p>Merci d'arriver 10 minutes avant votre rendez-vous${isNightConsultation ? ' (consultation de nuit)' : ''}.</p>
            </div>
        </div>
        
        <div class="instruction-item">
            <i class="fas fa-map-marker-alt"></i>
            <div>
                <h4>Adresse</h4>
                <p>123 Rue de la Santé, 75014 Paris<br>
                Métro : Ligne 6, Station Glacière</p>
            </div>
        </div>
        
        <div class="instruction-item">
            <i class="fas fa-id-card"></i>
            <div>
                <h4>Documents à apporter</h4>
                <p>Pièce d'identité, carte vitale${paymentData?.status !== 'payé' ? ', moyen de paiement' : ''}.</p>
            </div>
        </div>
    `
    
    if (isNightConsultation) {
        instructions += `
            <div class="instruction-item night-consultation">
                <i class="fas fa-moon"></i>
                <div>
                    <h4>Consultation de nuit</h4>
                    <p>L'entrée se fait par la porte latérale (sonnette "Urgences"). Un professionnel vous accueillera.</p>
                </div>
            </div>
        `
    }
    
    if (isToday) {
        instructions = `
            <div class="instruction-item urgent">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <h4>Rendez-vous aujourd'hui</h4>
                    <p>Votre rendez-vous a lieu aujourd'hui à ${appointmentData.heure}. N'oubliez pas !</p>
                </div>
            </div>
        ` + instructions
    }
    
    instructionsContainer.innerHTML = instructions
}

// Génération du récapitulatif
function generateSummary() {
    const summaryContainer = document.getElementById('summary-container')
    if (!summaryContainer) return
    
    const appointmentDate = new Date(appointmentData.date)
    const formattedDate = appointmentDate.toLocaleDateString('fr-FR')
    
    summaryContainer.innerHTML = `
        <div class="summary-section">
            <h3><i class="fas fa-user"></i> Informations client</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="label">Nom :</span>
                    <span class="value">${clientData.nom}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Email :</span>
                    <span class="value">${clientData.email}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Téléphone :</span>
                    <span class="value">${clientData.telephone}</span>
                </div>
            </div>
        </div>
        
        <div class="summary-section">
            <h3><i class="fas fa-calendar-check"></i> Détails du rendez-vous</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="label">Date :</span>
                    <span class="value">${formattedDate}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Heure :</span>
                    <span class="value">${appointmentData.heure}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Type :</span>
                    <span class="value">${appointmentData.type === 'nuit' ? 'Consultation de nuit' : 'Consultation standard'}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Statut :</span>
                    <span class="value status-confirmed">${appointmentData.status || 'Confirmé'}</span>
                </div>
            </div>
        </div>
        
        ${paymentData ? `
            <div class="summary-section">
                <h3><i class="fas fa-credit-card"></i> Informations de paiement</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <span class="label">Montant :</span>
                        <span class="value">${paymentData.montant}€</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Statut :</span>
                        <span class="value status-${paymentData.status}">${paymentData.status}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Méthode :</span>
                        <span class="value">${paymentData.method}</span>
                    </div>
                </div>
            </div>
        ` : ''}
    `
}

// Envoi de la notification de confirmation
async function sendConfirmationNotification() {
    try {
        // Simulation d'envoi d'email de confirmation
        console.log('Envoi de la notification de confirmation...')
        
        // Dans un vrai système, cela enverrait un email via un service comme SendGrid
        const notificationData = {
            to: clientData.email,
            subject: 'Confirmation de votre rendez-vous - MentalPlus',
            template: 'appointment_confirmation',
            data: {
                clientName: clientData.nom,
                appointmentDate: appointmentData.date,
                appointmentTime: appointmentData.heure,
                appointmentType: appointmentData.type,
                confirmationNumber: generateConfirmationNumber(appointmentData.id)
            }
        }
        
        // Simuler un délai d'envoi
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.log('Notification envoyée:', notificationData)
        
        // Afficher un message de confirmation
        showMessage(`Email de confirmation envoyé à ${clientData.email}`, 'success')
        
    } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification:', error)
        showMessage('Erreur lors de l\'envoi de l\'email de confirmation', 'warning')
    }
}

// Téléchargement de la confirmation
function downloadConfirmation() {
    try {
        const confirmationContent = generateConfirmationPDF()
        
        // Créer un blob avec le contenu
        const blob = new Blob([confirmationContent], { type: 'text/plain' })
        
        // Créer un lien de téléchargement
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `confirmation-rdv-${generateConfirmationNumber(appointmentData.id)}.txt`
        
        // Déclencher le téléchargement
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        // Nettoyer l'URL
        window.URL.revokeObjectURL(url)
        
        showMessage('Confirmation téléchargée', 'success')
        
    } catch (error) {
        console.error('Erreur lors du téléchargement:', error)
        showMessage('Erreur lors du téléchargement', 'error')
    }
}

// Génération du contenu de confirmation
function generateConfirmationPDF() {
    const confirmationNumber = generateConfirmationNumber(appointmentData.id)
    const appointmentDate = new Date(appointmentData.date)
    const formattedDate = appointmentDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
    
    return `
MENTALPLUS - CONFIRMATION DE RENDEZ-VOUS
==========================================

Numéro de confirmation : ${confirmationNumber}
Date de création : ${new Date().toLocaleDateString('fr-FR')}

INFORMATIONS CLIENT
-------------------
Nom : ${clientData.nom}
Email : ${clientData.email}
Téléphone : ${clientData.telephone}

DÉTAILS DU RENDEZ-VOUS
----------------------
Date : ${formattedDate}
Heure : ${appointmentData.heure}
Type : ${appointmentData.type === 'nuit' ? 'Consultation de nuit' : 'Consultation standard'}
Statut : ${appointmentData.status || 'Confirmé'}

${paymentData ? `INFORMATIONS DE PAIEMENT
------------------------
Montant : ${paymentData.montant}€
Statut : ${paymentData.status}
Méthode : ${paymentData.method}

` : ''}ADRESSE DU CABINET
------------------
123 Rue de la Santé
75014 Paris
Métro : Ligne 6, Station Glacière

INSTRUCTIONS
------------
- Arrivez 10 minutes avant votre rendez-vous
- Apportez votre pièce d'identité et carte vitale
${appointmentData.type === 'nuit' ? '- Entrée par la porte latérale (sonnette "Urgences")\n' : ''}${paymentData?.status !== 'payé' ? '- Apportez votre moyen de paiement\n' : ''}
CONTACT
-------
Téléphone : 01 23 45 67 89
Email : contact@mentalplus.fr
Site web : www.mentalplus.fr

En cas d'urgence : 3114 (gratuit, 24h/24)

==========================================
Merci de votre confiance.
Équipe MentalPlus
    `
}

// Envoi par email de la confirmation
async function emailConfirmation() {
    const emailButton = document.getElementById('email-confirmation')
    const originalText = emailButton.innerHTML
    
    try {
        emailButton.disabled = true
        emailButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...'
        
        // Simuler l'envoi d'email
        await sendConfirmationNotification()
        
        showMessage('Email de confirmation renvoyé', 'success')
        
    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error)
        showMessage('Erreur lors de l\'envoi de l\'email', 'error')
    } finally {
        emailButton.disabled = false
        emailButton.innerHTML = originalText
    }
}

// Fonctions utilitaires
function showLoading(show) {
    const loader = document.getElementById('confirmation-loader')
    if (loader) {
        loader.style.display = show ? 'flex' : 'none'
    }
}

function showMessage(message, type = 'success') {
    // Supprimer les anciens messages
    const existingMessages = document.querySelectorAll('.confirmation-message')
    existingMessages.forEach(msg => msg.remove())
    
    // Créer le nouveau message
    const messageDiv = document.createElement('div')
    messageDiv.className = `confirmation-message ${type}`
    
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
.confirmation-message {
    padding: 12px 20px;
    margin-bottom: 20px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
}

.confirmation-message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.confirmation-message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.confirmation-message.info {
    background-color: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}

.confirmation-message.warning {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

.instruction-item {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 15px;
    border-left: 4px solid #007bff;
}

.instruction-item.urgent {
    background: #fff3cd;
    border-left-color: #ffc107;
}

.instruction-item.night-consultation {
    background: #e2e3f1;
    border-left-color: #6f42c1;
}

.instruction-item i {
    color: #007bff;
    font-size: 1.2rem;
    margin-top: 2px;
}

.instruction-item.urgent i {
    color: #ffc107;
}

.instruction-item.night-consultation i {
    color: #6f42c1;
}

.instruction-item h4 {
    margin: 0 0 5px 0;
    color: #333;
    font-size: 1rem;
}

.instruction-item p {
    margin: 0;
    color: #666;
    line-height: 1.4;
}

.summary-section {
    background: white;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.summary-section h3 {
    margin: 0 0 15px 0;
    color: #333;
    display: flex;
    align-items: center;
    gap: 10px;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
}

.summary-item:last-child {
    border-bottom: none;
}

.summary-item .label {
    font-weight: 600;
    color: #666;
}

.summary-item .value {
    color: #333;
    text-align: right;
}

.status-confirmed {
    color: #28a745 !important;
    font-weight: bold;
}

.status-payé {
    color: #28a745 !important;
    font-weight: bold;
}

.status-en-attente {
    color: #ffc107 !important;
    font-weight: bold;
}

.status-échoué {
    color: #dc3545 !important;
    font-weight: bold;
}

#confirmation-loader {
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

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.confirmation-message {
    animation: fadeIn 0.3s ease-out;
}
`

// Injecter les styles
const styleSheet = document.createElement('style')
styleSheet.textContent = styles
document.head.appendChild(styleSheet)

// Ajouter un loader si il n'existe pas
if (!document.getElementById('confirmation-loader')) {
    const loader = document.createElement('div')
    loader.id = 'confirmation-loader'
    loader.style.display = 'none'
    loader.innerHTML = '<div class="loader-spinner"></div>'
    document.body.appendChild(loader)
}