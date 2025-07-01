// Script pour la page rendez-vous avec intégration Supabase
import { 
    clientService, 
    appointmentService, 
    paymentService,
    validateClientData, 
    validateAppointmentData 
} from './supabase-config.js'

// Variables globales pour le formulaire
let currentStep = 1
let selectedDomain = null
let selectedType = 'classique'
let selectedDate = null
let selectedTime = null
let clientData = null
let appointmentData = null

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeForm()
    setupEventListeners()
    generateCalendar()
    
    // Vérifier si on est en mode édition
    const urlParams = new URLSearchParams(window.location.search)
    const mode = urlParams.get('mode')
    const appointmentId = urlParams.get('id')
    
    if (mode === 'edit' && appointmentId) {
        loadAppointmentForEdit(appointmentId)
    }
})

// Fonction d'initialisation du formulaire
function initializeForm() {
    console.log('Initialisation du formulaire de rendez-vous avec Supabase')
    
    // Réinitialiser les étapes
    updateStepIndicators()
    
    // Charger les créneaux disponibles
    loadAvailableSlots()
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Sélection du type de consultation
    const typeButtons = document.querySelectorAll('.type-btn')
    typeButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault()
            selectConsultationType(this.dataset.type)
        })
    })
    
    // Sélection du domaine
    const domaineCards = document.querySelectorAll('.domaine-card')
    domaineCards.forEach(card => {
        card.addEventListener('click', function() {
            selectDomain(this.dataset.domaine, this.querySelector('h3').textContent)
        })
    })
    
    // Soumission du formulaire
    const form = document.getElementById('rdv-form')
    form.addEventListener('submit', handleFormSubmission)
    
    // Validation en temps réel des champs
    const inputs = form.querySelectorAll('input, select, textarea')
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this)
        })
    })
}

// Sélection du type de consultation
function selectConsultationType(type) {
    selectedType = type === 'night' ? 'nuit' : 'classique'
    
    // Mettre à jour l'interface
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active')
    })
    document.querySelector(`[data-type="${type}"]`).classList.add('active')
    
    // Mettre à jour le prix dans le résumé
    const price = selectedType === 'nuit' ? '80€' : '60€'
    document.getElementById('summary-price').textContent = price
    
    // Recharger les créneaux disponibles
    if (selectedDate) {
        loadTimeSlotsForDate(selectedDate)
    }
    
    console.log('Type de consultation sélectionné:', selectedType)
}

// Sélection du domaine
function selectDomain(domain, domainText) {
    selectedDomain = domain
    
    // Mettre à jour l'interface
    document.querySelectorAll('.domaine-card').forEach(card => {
        card.classList.remove('selected')
    })
    document.querySelector(`[data-domaine="${domain}"]`).classList.add('selected')
    
    // Mettre à jour le résumé
    document.getElementById('summary-domaine').textContent = domainText
    
    console.log('Domaine sélectionné:', domain)
}

// Génération du calendrier
function generateCalendar() {
    const calendar = document.getElementById('calendar')
    if (!calendar) return
    
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    // Générer le calendrier pour les 2 prochains mois
    calendar.innerHTML = ''
    
    for (let monthOffset = 0; monthOffset < 2; monthOffset++) {
        const month = new Date(currentYear, currentMonth + monthOffset, 1)
        const monthDiv = createMonthCalendar(month)
        calendar.appendChild(monthDiv)
    }
}

// Création d'un mois du calendrier
function createMonthCalendar(month) {
    const monthDiv = document.createElement('div')
    monthDiv.className = 'calendar-month'
    
    const monthName = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    monthDiv.innerHTML = `
        <h3>${monthName}</h3>
        <div class="calendar-grid">
            <div class="day-header">Lun</div>
            <div class="day-header">Mar</div>
            <div class="day-header">Mer</div>
            <div class="day-header">Jeu</div>
            <div class="day-header">Ven</div>
            <div class="day-header">Sam</div>
            <div class="day-header">Dim</div>
        </div>
    `
    
    const grid = monthDiv.querySelector('.calendar-grid')
    
    // Ajouter les jours du mois
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - (firstDay.getDay() || 7) + 1)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + i)
        
        const dayDiv = document.createElement('div')
        dayDiv.className = 'calendar-day'
        dayDiv.textContent = currentDate.getDate()
        
        // Vérifier si le jour est dans le mois courant
        if (currentDate.getMonth() !== month.getMonth()) {
            dayDiv.classList.add('other-month')
        }
        
        // Vérifier si le jour est dans le passé
        if (currentDate < today) {
            dayDiv.classList.add('past')
        } else {
            dayDiv.classList.add('available')
            dayDiv.addEventListener('click', () => selectDate(currentDate))
        }
        
        grid.appendChild(dayDiv)
    }
    
    return monthDiv
}

// Sélection d'une date
async function selectDate(date) {
    selectedDate = date
    
    // Mettre à jour l'interface
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected')
    })
    event.target.classList.add('selected')
    
    // Mettre à jour le résumé
    const dateStr = date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
    document.getElementById('summary-date').textContent = dateStr
    
    // Charger les créneaux disponibles pour cette date
    await loadTimeSlotsForDate(date)
    
    console.log('Date sélectionnée:', date)
}

// Chargement des créneaux horaires pour une date
async function loadTimeSlotsForDate(date) {
    const slotsContainer = document.querySelector('.slots-grid')
    if (!slotsContainer) return
    
    // Afficher un indicateur de chargement
    slotsContainer.innerHTML = '<div class="loading">Chargement des créneaux...</div>'
    
    try {
        // Générer les créneaux selon le type de consultation
        const slots = generateTimeSlots(selectedType)
        
        // Vérifier la disponibilité de chaque créneau
        const availableSlots = []
        
        for (const slot of slots) {
            const availability = await appointmentService.checkAvailability(
                date.toISOString().split('T')[0],
                slot
            )
            
            if (availability.success && availability.available) {
                availableSlots.push(slot)
            }
        }
        
        // Afficher les créneaux disponibles
        displayTimeSlots(availableSlots)
        
    } catch (error) {
        console.error('Erreur lors du chargement des créneaux:', error)
        slotsContainer.innerHTML = '<div class="error">Erreur lors du chargement des créneaux</div>'
    }
}

// Génération des créneaux horaires
function generateTimeSlots(type) {
    const slots = []
    
    if (type === 'classique') {
        // Créneaux de jour : 9h-19h
        for (let hour = 9; hour < 19; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`)
            slots.push(`${hour.toString().padStart(2, '0')}:30`)
        }
    } else {
        // Créneaux de nuit : 20h-6h
        for (let hour = 20; hour < 24; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`)
            slots.push(`${hour.toString().padStart(2, '0')}:30`)
        }
        for (let hour = 0; hour < 6; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`)
            slots.push(`${hour.toString().padStart(2, '0')}:30`)
        }
    }
    
    return slots
}

// Affichage des créneaux horaires
function displayTimeSlots(slots) {
    const slotsContainer = document.querySelector('.slots-grid')
    
    if (slots.length === 0) {
        slotsContainer.innerHTML = '<div class="no-slots">Aucun créneau disponible pour cette date</div>'
        return
    }
    
    slotsContainer.innerHTML = ''
    
    slots.forEach(slot => {
        const slotDiv = document.createElement('div')
        slotDiv.className = 'time-slot'
        slotDiv.textContent = slot
        slotDiv.addEventListener('click', () => selectTimeSlot(slot))
        slotsContainer.appendChild(slotDiv)
    })
}

// Sélection d'un créneau horaire
function selectTimeSlot(time) {
    selectedTime = time
    
    // Mettre à jour l'interface
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected')
    })
    event.target.classList.add('selected')
    
    // Mettre à jour le résumé
    document.getElementById('summary-time').textContent = time
    
    console.log('Créneau sélectionné:', time)
}

// Chargement des créneaux disponibles (fonction générale)
async function loadAvailableSlots() {
    try {
        console.log('Chargement des créneaux disponibles depuis Supabase')
        // Cette fonction peut être utilisée pour pré-charger des données
    } catch (error) {
        console.error('Erreur lors du chargement des créneaux:', error)
    }
}

// Navigation entre les étapes
window.nextStep = function() {
    if (currentStep === 1) {
        if (!selectedDomain) {
            showMessage('Veuillez sélectionner un domaine d\'intervention', 'error')
            return
        }
    } else if (currentStep === 2) {
        if (!selectedDate || !selectedTime) {
            showMessage('Veuillez sélectionner une date et un créneau horaire', 'error')
            return
        }
    }
    
    if (currentStep < 3) {
        currentStep++
        updateStepIndicators()
        showStep(currentStep)
    }
}

window.prevStep = function() {
    if (currentStep > 1) {
        currentStep--
        updateStepIndicators()
        showStep(currentStep)
    }
}

// Mise à jour des indicateurs d'étapes
function updateStepIndicators() {
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed')
        if (index + 1 === currentStep) {
            step.classList.add('active')
        } else if (index + 1 < currentStep) {
            step.classList.add('completed')
        }
    })
}

// Affichage d'une étape
function showStep(step) {
    document.querySelectorAll('.form-step').forEach((stepDiv, index) => {
        stepDiv.classList.remove('active')
        if (index + 1 === step) {
            stepDiv.classList.add('active')
        }
    })
}

// Gestion de la soumission du formulaire
async function handleFormSubmission(e) {
    e.preventDefault()
    
    const submitButton = document.querySelector('.btn-submit')
    const originalText = submitButton.innerHTML
    
    try {
        // Désactiver le bouton pendant le traitement
        submitButton.disabled = true
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement en cours...'
        
        // Récupérer les données du formulaire
        const formData = collectFormData()
        
        // Valider les données
        const validation = validateFormData(formData)
        if (!validation.isValid) {
            throw new Error(validation.errors.join('\n'))
        }
        
        // Créer ou récupérer le client
        const client = await createOrUpdateClient(formData)
        if (!client.success) {
            throw new Error(client.error)
        }
        
        // Créer le rendez-vous
        const appointment = await createAppointment(client.data.id, formData)
        if (!appointment.success) {
            throw new Error(appointment.error)
        }
        
        // Créer l'enregistrement de paiement
        const payment = await createPayment(client.data.id, appointment.data.id)
        if (!payment.success) {
            throw new Error(payment.error)
        }
        
        // Rediriger vers la page de confirmation
        window.location.href = `confirmation.html?appointment=${appointment.data.id}`
        
    } catch (error) {
        console.error('Erreur lors de la soumission:', error)
        showMessage(error.message, 'error')
        
        // Réactiver le bouton
        submitButton.disabled = false
        submitButton.innerHTML = originalText
    }
}

// Collecte des données du formulaire
function collectFormData() {
    return {
        // Données du rendez-vous
        domain: selectedDomain,
        type: selectedType,
        date: selectedDate,
        time: selectedTime,
        
        // Données du client
        nom: document.getElementById('nom').value.trim(),
        prenom: document.getElementById('prenom').value.trim(),
        email: document.getElementById('email').value.trim(),
        telephone: document.getElementById('telephone').value.trim(),
        adresse: document.getElementById('adresse').value.trim(),
        ville: document.getElementById('ville').value.trim(),
        code_postal: document.getElementById('code_postal').value.trim(),
        pays: document.getElementById('pays').value,
        notes: document.getElementById('notes').value.trim()
    }
}

// Validation des données du formulaire
function validateFormData(data) {
    const errors = []
    
    // Validation des données de rendez-vous
    if (!data.domain) errors.push('Veuillez sélectionner un domaine')
    if (!data.date) errors.push('Veuillez sélectionner une date')
    if (!data.time) errors.push('Veuillez sélectionner un créneau horaire')
    
    // Validation des données client
    const clientValidation = validateClientData({
        nom: `${data.prenom} ${data.nom}`,
        email: data.email,
        telephone: data.telephone
    })
    
    if (!clientValidation.isValid) {
        errors.push(...clientValidation.errors)
    }
    
    // Validation des données de rendez-vous
    const appointmentValidation = validateAppointmentData({
        type: data.type,
        date: data.date.toISOString().split('T')[0],
        heure: data.time
    })
    
    if (!appointmentValidation.isValid) {
        errors.push(...appointmentValidation.errors)
    }
    
    return {
        isValid: errors.length === 0,
        errors
    }
}

// Création ou mise à jour du client
async function createOrUpdateClient(data) {
    try {
        // Vérifier si le client existe déjà
        const existingClient = await clientService.getByEmail(data.email)
        
        if (existingClient.success && existingClient.data) {
            // Mettre à jour le client existant
            return await clientService.update(existingClient.data.id, {
                nom: `${data.prenom} ${data.nom}`,
                telephone: data.telephone
            })
        } else {
            // Créer un nouveau client
            return await clientService.create({
                nom: `${data.prenom} ${data.nom}`,
                email: data.email,
                telephone: data.telephone
            })
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// Création du rendez-vous
async function createAppointment(clientId, data) {
    return await appointmentService.create({
        client_id: clientId,
        type: data.type,
        date: data.date.toISOString().split('T')[0],
        heure: data.time
    })
}

// Création de l'enregistrement de paiement
async function createPayment(clientId, appointmentId) {
    const montant = selectedType === 'nuit' ? 80 : 60
    
    return await paymentService.create({
        client_id: clientId,
        appointment_id: appointmentId,
        montant: montant,
        status: 'en attente'
    })
}

// Validation d'un champ individuel
function validateField(field) {
    const value = field.value.trim()
    let isValid = true
    let errorMessage = ''
    
    // Supprimer les erreurs existantes
    clearFieldError(field)
    
    switch (field.id) {
        case 'nom':
        case 'prenom':
            if (value.length < 2) {
                isValid = false
                errorMessage = 'Ce champ doit contenir au moins 2 caractères'
            }
            break
            
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(value)) {
                isValid = false
                errorMessage = 'Veuillez saisir une adresse email valide'
            }
            break
            
        case 'telephone':
            const phoneRegex = /^[0-9+\-\s]{10,}$/
            if (!phoneRegex.test(value)) {
                isValid = false
                errorMessage = 'Veuillez saisir un numéro de téléphone valide'
            }
            break
            
        case 'code_postal':
            const postalRegex = /^[0-9]{5}$/
            if (!postalRegex.test(value)) {
                isValid = false
                errorMessage = 'Le code postal doit contenir 5 chiffres'
            }
            break
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage)
    }
    
    return isValid
}

// Affichage d'une erreur sur un champ
function showFieldError(field, message) {
    field.classList.add('error')
    
    const errorDiv = document.createElement('div')
    errorDiv.className = 'field-error'
    errorDiv.textContent = message
    
    field.parentNode.appendChild(errorDiv)
}

// Suppression de l'erreur d'un champ
function clearFieldError(field) {
    field.classList.remove('error')
    
    const errorDiv = field.parentNode.querySelector('.field-error')
    if (errorDiv) {
        errorDiv.remove()
    }
}

// Affichage des messages
function showMessage(message, type = 'success') {
    // Supprimer les anciens messages
    const existingMessages = document.querySelectorAll('.form-message')
    existingMessages.forEach(msg => msg.remove())
    
    // Créer le nouveau message
    const messageDiv = document.createElement('div')
    messageDiv.className = `form-message ${type}`
    messageDiv.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `
    
    // Insérer le message au début du formulaire
    const form = document.getElementById('rdv-form')
    form.parentNode.insertBefore(messageDiv, form)
    
    // Faire défiler vers le message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })
    
    // Supprimer le message après 5 secondes
    setTimeout(() => {
        messageDiv.remove()
    }, 5000)
}

// Styles CSS pour les nouveaux éléments
const styles = `
.domaine-card.selected {
    border-color: var(--primary-color);
    background-color: var(--primary-light);
    transform: translateY(-2px);
}

.calendar-day.selected {
    background-color: var(--primary-color);
    color: white;
}

.time-slot.selected {
    background-color: var(--primary-color);
    color: white;
}

.form-message {
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
}

.form-message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.form-message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.field-error {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 5px;
}

input.error, select.error, textarea.error {
    border-color: #dc3545;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.loading, .error, .no-slots {
    text-align: center;
    padding: 20px;
    color: #666;
    font-style: italic;
}

.error {
    color: #dc3545;
}
`

// Injecter les styles
const styleSheet = document.createElement('style')
styleSheet.textContent = styles
document.head.appendChild(styleSheet)

// Fonctions pour la modification et l'annulation des rendez-vous
async function loadAppointmentForEdit(appointmentId) {
    try {
        showMessage('Chargement du rendez-vous...', 'info')
        
        const { data: appointment, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', appointmentId)
            .single()
        
        if (error) throw error
        
        if (!appointment) {
            showMessage('Rendez-vous introuvable', 'error')
            return
        }
        
        // Pré-remplir le formulaire avec les données existantes
        await populateFormWithAppointment(appointment)
        
        // Changer le titre et le bouton
        const title = document.querySelector('h1')
        if (title) title.textContent = 'Modifier mon rendez-vous'
        
        const submitBtn = document.querySelector('.btn-submit')
        if (submitBtn) {
            submitBtn.textContent = 'Modifier le rendez-vous'
            submitBtn.onclick = () => updateAppointment(appointmentId)
        }
        
        // Ajouter un bouton d'annulation
        addCancelButton(appointmentId)
        
        showMessage('Rendez-vous chargé avec succès', 'success')
        
    } catch (error) {
        console.error('Erreur lors du chargement du rendez-vous:', error)
        showMessage('Erreur lors du chargement du rendez-vous', 'error')
    }
}

async function populateFormWithAppointment(appointment) {
    try {
        // Sélectionner le type de consultation
        selectedType = appointment.type || 'classique'
        const typeBtn = document.querySelector(`[data-type="${selectedType}"]`)
        if (typeBtn) {
            selectConsultationType(selectedType)
        }
        
        // Sélectionner le domaine
        selectedDomain = appointment.domaine
        const domaineCard = document.querySelector(`[data-domaine="${selectedDomain}"]`)
        if (domaineCard) {
            selectDomaine(selectedDomain)
        }
        
        // Sélectionner la date
        selectedDate = appointment.date
        const dateInput = document.getElementById('selected-date')
        if (dateInput) {
            dateInput.value = selectedDate
        }
        
        // Sélectionner l'heure
        selectedTime = appointment.heure
        const timeInput = document.getElementById('selected-time')
        if (timeInput) {
            timeInput.value = selectedTime
        }
        
        // Remplir les informations client
        const { data: client } = await supabase
            .from('clients')
            .select('*')
            .eq('id', appointment.client_id)
            .single()
        
        if (client) {
            const nomInput = document.getElementById('nom')
            const emailInput = document.getElementById('email')
            const telephoneInput = document.getElementById('telephone')
            
            if (nomInput) nomInput.value = client.nom || ''
            if (emailInput) emailInput.value = client.email || ''
            if (telephoneInput) telephoneInput.value = client.telephone || ''
        }
        
        // Aller à la dernière étape
        currentStep = 4
        updateStepIndicators()
        showStep(4)
        
    } catch (error) {
        console.error('Erreur lors du pré-remplissage:', error)
        showMessage('Erreur lors du pré-remplissage du formulaire', 'error')
    }
}

async function updateAppointment(appointmentId) {
    try {
        // Valider les données
        if (!validateAppointmentForm()) {
            return
        }
        
        showMessage('Modification en cours...', 'info')
        
        // Préparer les données de mise à jour
        const updateData = {
            type: selectedType,
            domaine: selectedDomain,
            date: selectedDate,
            heure: selectedTime,
            status: 'confirmé'
        }
        
        // Mettre à jour le rendez-vous
        const { error: appointmentError } = await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', appointmentId)
        
        if (appointmentError) throw appointmentError
        
        // Mettre à jour les informations client si nécessaire
        const clientUpdateData = {
            nom: document.getElementById('nom').value,
            telephone: document.getElementById('telephone').value
        }
        
        const { data: appointment } = await supabase
            .from('appointments')
            .select('client_id')
            .eq('id', appointmentId)
            .single()
        
        if (appointment) {
            const { error: clientError } = await supabase
                .from('clients')
                .update(clientUpdateData)
                .eq('id', appointment.client_id)
            
            if (clientError) console.warn('Erreur lors de la mise à jour du client:', clientError)
        }
        
        showMessage('Rendez-vous modifié avec succès!', 'success')
        
        // Rediriger vers l'espace client après 2 secondes
        setTimeout(() => {
            window.location.href = 'espace-client.html'
        }, 2000)
        
    } catch (error) {
        console.error('Erreur lors de la modification:', error)
        showMessage('Erreur lors de la modification du rendez-vous', 'error')
    }
}

function addCancelButton(appointmentId) {
    const submitBtn = document.querySelector('.btn-submit')
    if (submitBtn && submitBtn.parentNode) {
        const cancelBtn = document.createElement('button')
        cancelBtn.type = 'button'
        cancelBtn.className = 'btn-danger'
        cancelBtn.textContent = 'Annuler le rendez-vous'
        cancelBtn.style.marginLeft = '10px'
        cancelBtn.onclick = () => cancelAppointment(appointmentId)
        
        submitBtn.parentNode.appendChild(cancelBtn)
    }
}

async function cancelAppointment(appointmentId) {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
        return
    }
    
    try {
        showMessage('Annulation en cours...', 'info')
        
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'annulé' })
            .eq('id', appointmentId)
        
        if (error) throw error
        
        showMessage('Rendez-vous annulé avec succès', 'success')
        
        // Rediriger vers l'espace client après 2 secondes
        setTimeout(() => {
            window.location.href = 'espace-client.html'
        }, 2000)
        
    } catch (error) {
        console.error('Erreur lors de l\'annulation:', error)
        showMessage('Erreur lors de l\'annulation du rendez-vous', 'error')
    }
}

function validateAppointmentForm() {
    let isValid = true
    
    // Vérifier que tous les champs requis sont remplis
    if (!selectedType) {
        showMessage('Veuillez sélectionner un type de consultation', 'error')
        isValid = false
    }
    
    if (!selectedDomain) {
        showMessage('Veuillez sélectionner un domaine', 'error')
        isValid = false
    }
    
    if (!selectedDate) {
        showMessage('Veuillez sélectionner une date', 'error')
        isValid = false
    }
    
    if (!selectedTime) {
        showMessage('Veuillez sélectionner une heure', 'error')
        isValid = false
    }
    
    const nom = document.getElementById('nom')?.value
    const email = document.getElementById('email')?.value
    
    if (!nom || !email) {
        showMessage('Veuillez remplir tous les champs obligatoires', 'error')
        isValid = false
    }
    
    return isValid
}

// Exposer les fonctions globalement pour les appels depuis l'espace client
window.loadAppointmentForEdit = loadAppointmentForEdit
window.updateAppointment = updateAppointment
window.cancelAppointment = cancelAppointment