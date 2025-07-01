// Script pour la page de paiement avec intégration Supabase
import { paymentService, appointmentService, clientService } from './supabase-config.js'

// Variables globales
let currentAppointment = null
let currentPayment = null
let selectedPaymentMethod = 'card'

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initializePaymentPage()
    setupEventListeners()
    loadAppointmentData()
})

// Fonction d'initialisation
function initializePaymentPage() {
    console.log('Initialisation de la page de paiement avec Supabase')
    
    // Récupérer l'ID du rendez-vous depuis l'URL
    const urlParams = new URLSearchParams(window.location.search)
    const appointmentId = urlParams.get('appointment')
    
    if (!appointmentId) {
        showMessage('Aucun rendez-vous spécifié', 'error')
        setTimeout(() => {
            window.location.href = 'rendez-vous.html'
        }, 3000)
        return
    }
    
    // Stocker l'ID du rendez-vous
    window.appointmentId = appointmentId
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Sélection du moyen de paiement
    const paymentOptions = document.querySelectorAll('.payment-option')
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            selectPaymentMethod(this.dataset.method)
        })
    })
    
    // Soumission du formulaire de paiement
    const paymentForm = document.getElementById('payment-form')
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmission)
    }
    
    // Formatage automatique des champs de carte
    setupCardFormatting()
}

// Chargement des données du rendez-vous
async function loadAppointmentData() {
    if (!window.appointmentId) return
    
    try {
        // Récupérer les détails du rendez-vous
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                clients (nom, email, telephone),
                payments (*)
            `)
            .eq('id', window.appointmentId)
            .single()
        
        if (error) throw error
        
        currentAppointment = data
        
        // Mettre à jour l'interface avec les données du rendez-vous
        updateAppointmentDisplay(data)
        
        // Vérifier s'il y a déjà un paiement en cours
        if (data.payments && data.payments.length > 0) {
            currentPayment = data.payments[0]
            updatePaymentStatus(currentPayment)
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement du rendez-vous:', error)
        showMessage('Erreur lors du chargement des données du rendez-vous', 'error')
    }
}

// Mise à jour de l'affichage du rendez-vous
function updateAppointmentDisplay(appointment) {
    // Mettre à jour la date
    const appointmentDate = new Date(appointment.date)
    const dateStr = appointmentDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
    document.getElementById('appointment-date').textContent = dateStr
    
    // Mettre à jour l'heure
    document.getElementById('appointment-time').textContent = appointment.heure
    
    // Mettre à jour le type
    const typeText = appointment.type === 'nuit' ? 'Consultation de nuit' : 'Consultation standard'
    document.getElementById('appointment-type').textContent = typeText
    
    // Mettre à jour le prix
    const price = appointment.type === 'nuit' ? '80€' : '60€'
    document.getElementById('appointment-price').textContent = price
    
    // Mettre à jour le bouton de paiement
    const payButton = document.querySelector('.pay-button')
    if (payButton) {
        payButton.innerHTML = `<i class="fas fa-lock"></i> Payer ${price}`
    }
}

// Sélection du moyen de paiement
function selectPaymentMethod(method) {
    selectedPaymentMethod = method
    
    // Mettre à jour l'interface
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('active')
    })
    document.querySelector(`[data-method="${method}"]`).classList.add('active')
    
    // Afficher/masquer le formulaire de carte
    const cardForm = document.getElementById('card-payment-form')
    if (method === 'card') {
        cardForm.style.display = 'block'
    } else {
        cardForm.style.display = 'none'
        showAlternativePaymentInfo(method)
    }
    
    console.log('Moyen de paiement sélectionné:', method)
}

// Affichage des informations pour les moyens de paiement alternatifs
function showAlternativePaymentInfo(method) {
    let message = ''
    let instructions = ''
    
    switch (method) {
        case 'cash':
            message = 'Paiement en espèces'
            instructions = 'Vous pourrez régler en espèces directement lors de votre rendez-vous. Votre réservation est confirmée.'
            break
        case 'check':
            message = 'Paiement par chèque'
            instructions = 'Vous pourrez régler par chèque lors de votre rendez-vous. Merci de libeller le chèque à l\'ordre de "MentalPlus".'
            break
        case 'transfer':
            message = 'Paiement par virement'
            instructions = 'Coordonnées bancaires :<br>IBAN : FR76 1234 5678 9012 3456 7890 123<br>BIC : ABCDEFGH<br>Référence : RDV-' + (window.appointmentId || '').substring(0, 8)
            break
    }
    
    showMessage(message, 'info', instructions)
    
    // Marquer le paiement comme confirmé pour les moyens alternatifs
    if (method !== 'card') {
        setTimeout(() => {
            confirmAlternativePayment(method)
        }, 2000)
    }
}

// Confirmation des paiements alternatifs
async function confirmAlternativePayment(method) {
    try {
        if (currentPayment) {
            // Mettre à jour le statut du paiement existant
            const result = await paymentService.updateStatus(currentPayment.id, 'en attente')
            if (result.success) {
                showMessage('Votre réservation est confirmée !', 'success')
                setTimeout(() => {
                    window.location.href = `confirmation.html?appointment=${window.appointmentId}`
                }, 2000)
            }
        }
    } catch (error) {
        console.error('Erreur lors de la confirmation du paiement alternatif:', error)
        showMessage('Erreur lors de la confirmation', 'error')
    }
}

// Gestion de la soumission du paiement par carte
async function handlePaymentSubmission(e) {
    e.preventDefault()
    
    const submitButton = document.querySelector('.pay-button')
    const originalText = submitButton.innerHTML
    
    try {
        // Désactiver le bouton pendant le traitement
        submitButton.disabled = true
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement en cours...'
        
        // Valider les données de la carte
        const cardData = collectCardData()
        const validation = validateCardData(cardData)
        
        if (!validation.isValid) {
            throw new Error(validation.errors.join('\n'))
        }
        
        // Simuler le traitement du paiement
        await simulatePaymentProcessing(cardData)
        
        // Mettre à jour le statut du paiement dans Supabase
        if (currentPayment) {
            const result = await paymentService.updateStatus(currentPayment.id, 'payé')
            if (!result.success) {
                throw new Error(result.error)
            }
        }
        
        // Afficher le succès et rediriger
        showMessage('Paiement effectué avec succès !', 'success')
        
        setTimeout(() => {
            window.location.href = `confirmation.html?appointment=${window.appointmentId}`
        }, 2000)
        
    } catch (error) {
        console.error('Erreur lors du paiement:', error)
        showMessage(error.message, 'error')
        
        // Réactiver le bouton
        submitButton.disabled = false
        submitButton.innerHTML = originalText
    }
}

// Collecte des données de la carte
function collectCardData() {
    return {
        holder: document.getElementById('card-holder').value.trim(),
        number: document.getElementById('card-number').value.replace(/\s/g, ''),
        expiry: document.getElementById('expiry').value,
        cvv: document.getElementById('cvv').value
    }
}

// Validation des données de la carte
function validateCardData(data) {
    const errors = []
    
    // Validation du titulaire
    if (!data.holder || data.holder.length < 2) {
        errors.push('Le nom du titulaire est requis')
    }
    
    // Validation du numéro de carte (algorithme de Luhn simplifié)
    if (!data.number || data.number.length < 13 || data.number.length > 19) {
        errors.push('Le numéro de carte n\'est pas valide')
    }
    
    // Validation de la date d'expiration
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/
    if (!expiryRegex.test(data.expiry)) {
        errors.push('La date d\'expiration doit être au format MM/AA')
    } else {
        const [month, year] = data.expiry.split('/')
        const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1)
        const now = new Date()
        if (expiryDate < now) {
            errors.push('La carte a expiré')
        }
    }
    
    // Validation du CVV
    if (!data.cvv || !/^[0-9]{3,4}$/.test(data.cvv)) {
        errors.push('Le CVV doit contenir 3 ou 4 chiffres')
    }
    
    return {
        isValid: errors.length === 0,
        errors
    }
}

// Simulation du traitement du paiement
async function simulatePaymentProcessing(cardData) {
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Simuler une réponse de paiement (en réalité, cela passerait par Stripe ou un autre processeur)
    const success = Math.random() > 0.1 // 90% de chance de succès
    
    if (!success) {
        throw new Error('Le paiement a été refusé. Veuillez vérifier vos informations de carte.')
    }
    
    console.log('Paiement simulé avec succès')
    return { success: true, transactionId: 'sim_' + Date.now() }
}

// Mise à jour du statut de paiement
function updatePaymentStatus(payment) {
    const statusText = {
        'en attente': 'En attente de paiement',
        'payé': 'Paiement confirmé',
        'échoué': 'Paiement échoué',
        'remboursé': 'Remboursé'
    }
    
    const status = payment.status
    const text = statusText[status] || status
    
    // Afficher le statut dans l'interface
    showMessage(`Statut du paiement : ${text}`, status === 'payé' ? 'success' : 'info')
    
    // Si le paiement est déjà effectué, rediriger vers la confirmation
    if (status === 'payé') {
        setTimeout(() => {
            window.location.href = `confirmation.html?appointment=${window.appointmentId}`
        }, 2000)
    }
}

// Configuration du formatage automatique des champs de carte
function setupCardFormatting() {
    // Formatage du numéro de carte
    const cardNumberInput = document.getElementById('card-number')
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '')
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value
            e.target.value = formattedValue
        })
    }
    
    // Formatage de la date d'expiration
    const expiryInput = document.getElementById('expiry')
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '')
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4)
            }
            e.target.value = value
        })
    }
    
    // Restriction du CVV aux chiffres uniquement
    const cvvInput = document.getElementById('cvv')
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '')
        })
    }
}

// Affichage des messages
function showMessage(message, type = 'success', details = '') {
    // Supprimer les anciens messages
    const existingMessages = document.querySelectorAll('.payment-message')
    existingMessages.forEach(msg => msg.remove())
    
    // Créer le nouveau message
    const messageDiv = document.createElement('div')
    messageDiv.className = `payment-message ${type}`
    
    const icon = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'info': 'fa-info-circle',
        'warning': 'fa-exclamation-triangle'
    }[type] || 'fa-info-circle'
    
    messageDiv.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="message-content">
            <div class="message-text">${message}</div>
            ${details ? `<div class="message-details">${details}</div>` : ''}
        </div>
    `
    
    // Insérer le message au début de la page
    const main = document.querySelector('main')
    main.insertBefore(messageDiv, main.firstChild)
    
    // Faire défiler vers le message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })
    
    // Supprimer le message après 10 secondes (sauf pour les erreurs)
    if (type !== 'error') {
        setTimeout(() => {
            messageDiv.remove()
        }, 10000)
    }
}

// Fonction pour gérer les erreurs de connexion
window.addEventListener('online', function() {
    showMessage('Connexion rétablie', 'success')
})

window.addEventListener('offline', function() {
    showMessage('Connexion perdue. Veuillez vérifier votre connexion internet.', 'warning')
})

// Styles CSS pour les nouveaux éléments
const styles = `
.payment-message {
    padding: 15px 20px;
    margin-bottom: 20px;
    border-radius: 8px;
    display: flex;
    align-items: flex-start;
    gap: 15px;
    font-weight: 500;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.payment-message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.payment-message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.payment-message.info {
    background-color: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}

.payment-message.warning {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

.payment-message i {
    font-size: 1.2rem;
    margin-top: 2px;
}

.message-content {
    flex: 1;
}

.message-text {
    font-weight: 600;
    margin-bottom: 5px;
}

.message-details {
    font-size: 0.9rem;
    opacity: 0.9;
    line-height: 1.4;
}

.payment-option.active {
    background-color: var(--primary-color);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.form-group input.error {
    border-color: #dc3545;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.payment-message {
    animation: fadeIn 0.3s ease-out;
}
`

// Injecter les styles
const styleSheet = document.createElement('style')
styleSheet.textContent = styles
document.head.appendChild(styleSheet)