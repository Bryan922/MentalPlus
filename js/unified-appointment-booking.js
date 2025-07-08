// Gestionnaire unifié pour la prise de rendez-vous
// Utilise le système de base de données unifié

import { supabaseAuth } from './supabase-auth.js';
import { dbManager } from './unified-database-manager.js';

class UnifiedAppointmentBooking {
    constructor() {
        this.currentStep = 1;
        this.selectedType = 'classique';
        this.selectedDomain = null;
        this.selectedDate = null;
        this.selectedTime = null;
        this.clientData = null;
        this.appointmentData = null;
        this.pricing = null;
        this.init();
    }

    async init() {
        try {
            // Charger les tarifs
            await this.loadPricing();
            
            // Configurer l'interface
            this.setupInterface();
            this.setupEventListeners();
            
            // Vérifier si on est en mode édition
            this.checkEditMode();
            
            console.log('Système de prise de rendez-vous initialisé');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
        }
    }

    async loadPricing() {
        try {
            const { success, data } = await dbManager.getPricing();
            if (success && data) {
                this.pricing = data;
                console.log('Tarifs chargés:', this.pricing);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des tarifs:', error);
        }
    }

    setupInterface() {
        // Initialiser les étapes
        this.updateStepIndicators();
        
        // Afficher la première étape
        this.showStep(1);
        
        // Générer le calendrier
        this.generateCalendar();
    }

    setupEventListeners() {
        // Sélection du type de consultation
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectConsultationType(e.currentTarget.dataset.type);
            });
        });

        // Sélection du domaine
        document.querySelectorAll('.domaine-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectDomain(card.dataset.domaine, card.querySelector('h3').textContent);
            });
        });

        // Soumission du formulaire
        const form = document.getElementById('rdv-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission();
            });
        }

        // Validation en temps réel des champs
        const inputs = form?.querySelectorAll('input, select, textarea');
        if (inputs) {
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
            });
        }
    }

    checkEditMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const appointmentId = urlParams.get('id');
        
        if (mode === 'edit' && appointmentId) {
            this.loadAppointmentForEdit(appointmentId);
        }
    }

    selectConsultationType(type) {
        this.selectedType = type === 'night' ? 'nuit' : 'classique';
        
        // Mettre à jour l'interface
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');
        
        // Mettre à jour le prix dans le résumé
        this.updatePriceDisplay();
        
        // Recharger les créneaux disponibles
        if (this.selectedDate) {
            this.loadTimeSlotsForDate(this.selectedDate);
        }
        
        console.log('Type de consultation sélectionné:', this.selectedType);
    }

    selectDomain(domain, domainText) {
        this.selectedDomain = domain;
        
        // Mettre à jour l'interface
        document.querySelectorAll('.domaine-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-domaine="${domain}"]`).classList.add('selected');
        
        // Mettre à jour le résumé
        const summaryDomain = document.getElementById('summary-domaine');
        if (summaryDomain) {
            summaryDomain.textContent = domainText;
        }
        
        console.log('Domaine sélectionné:', domain);
    }

    generateCalendar() {
        const calendar = document.getElementById('calendar');
        if (!calendar) return;
        
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Générer le calendrier pour les 2 prochains mois
        calendar.innerHTML = '';
        
        for (let monthOffset = 0; monthOffset < 2; monthOffset++) {
            const month = new Date(currentYear, currentMonth + monthOffset, 1);
            const monthDiv = this.createMonthCalendar(month);
            calendar.appendChild(monthDiv);
        }
    }

    createMonthCalendar(month) {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'calendar-month';
        
        const monthName = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
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
        `;
        
        const grid = monthDiv.querySelector('.calendar-grid');
        
        // Ajouter les jours du mois
        const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
        const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - (firstDay.getDay() || 7) + 1);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = currentDate.getDate();
            
            // Vérifier si le jour est dans le mois courant
            if (currentDate.getMonth() !== month.getMonth()) {
                dayDiv.classList.add('other-month');
            }
            
            // Vérifier si le jour est dans le passé
            if (currentDate < today) {
                dayDiv.classList.add('past');
            } else {
                dayDiv.classList.add('available');
                dayDiv.addEventListener('click', () => this.selectDate(currentDate));
            }
            
            grid.appendChild(dayDiv);
        }
        
        return monthDiv;
    }

    async selectDate(date) {
        this.selectedDate = date;
        
        // Mettre à jour l'interface
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
        event.target.classList.add('selected');
        
        // Charger les créneaux disponibles
        await this.loadTimeSlotsForDate(date);
        
        console.log('Date sélectionnée:', date.toISOString().split('T')[0]);
    }

    async loadTimeSlotsForDate(date) {
        try {
            const dateString = date.toISOString().split('T')[0];
            const slots = this.generateTimeSlots(this.selectedType);
            
            // Vérifier la disponibilité pour chaque créneau
            const availableSlots = [];
            
            for (const slot of slots) {
                const { success, available } = await dbManager.checkAvailability(dateString, slot);
                if (success && available) {
                    availableSlots.push(slot);
                }
            }
            
            this.displayTimeSlots(availableSlots);
        } catch (error) {
            console.error('Erreur lors du chargement des créneaux:', error);
        }
    }

    generateTimeSlots(type) {
        const slots = [];
        const startHour = type === 'nuit' ? 20 : 9; // 20h pour la nuit, 9h pour le jour
        const endHour = type === 'nuit' ? 23 : 18; // 23h pour la nuit, 18h pour le jour
        
        for (let hour = startHour; hour < endHour; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        
        return slots;
    }

    displayTimeSlots(slots) {
        const slotsContainer = document.querySelector('.slots-grid');
        if (!slotsContainer) return;
        
        if (slots.length === 0) {
            slotsContainer.innerHTML = '<p>Aucun créneau disponible pour cette date</p>';
            return;
        }
        
        slotsContainer.innerHTML = slots.map(slot => `
            <button class="time-slot" onclick="appointmentBooking.selectTimeSlot('${slot}')">
                ${slot}
            </button>
        `).join('');
    }

    selectTimeSlot(time) {
        this.selectedTime = time;
        
        // Mettre à jour l'interface
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        event.target.classList.add('selected');
        
        // Mettre à jour le résumé
        const summaryTime = document.getElementById('summary-time');
        if (summaryTime) {
            summaryTime.textContent = `${dbManager.formatDate(this.selectedDate)} à ${time}`;
        }
        
        console.log('Heure sélectionnée:', time);
    }

    updateStepIndicators() {
        document.querySelectorAll('.step').forEach((step, index) => {
            const stepNumber = index + 1;
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    showStep(step) {
        // Masquer toutes les étapes
        document.querySelectorAll('.form-step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });
        
        // Afficher l'étape demandée
        const targetStep = document.getElementById(`step${step}`);
        if (targetStep) {
            targetStep.classList.add('active');
        }
        
        this.currentStep = step;
        this.updateStepIndicators();
    }

    updatePriceDisplay() {
        if (!this.pricing) return;
        
        const priceInfo = this.pricing.find(p => p.type_consultation === this.selectedType);
        if (priceInfo) {
            const summaryPrice = document.getElementById('summary-price');
            if (summaryPrice) {
                summaryPrice.textContent = `${priceInfo.montant}€`;
            }
        }
    }

    async handleFormSubmission() {
        try {
            // Collecter les données du formulaire
            const formData = this.collectFormData();
            
            // Valider les données
            const validation = this.validateFormData(formData);
            if (!validation.isValid) {
                this.showError(validation.errors.join(', '));
                return;
            }
            
            // Créer ou mettre à jour le client
            const clientResult = await this.createOrUpdateClient(formData);
            if (!clientResult.success) {
                this.showError('Erreur lors de la création du client');
                return;
            }
            
            // Créer le rendez-vous
            const appointmentResult = await this.createAppointment(clientResult.data.id, formData);
            if (!appointmentResult.success) {
                this.showError('Erreur lors de la création du rendez-vous');
                return;
            }
            
            // Créer le paiement
            const paymentResult = await this.createPayment(clientResult.data.id, appointmentResult.data.id, formData);
            if (!paymentResult.success) {
                this.showError('Erreur lors de la création du paiement');
                return;
            }
            
            // Rediriger vers la page de confirmation
            window.location.href = `confirmation.html?appointment_id=${appointmentResult.data.id}`;
            
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            this.showError('Une erreur est survenue lors de la prise de rendez-vous');
        }
    }

    collectFormData() {
        const form = document.getElementById('rdv-form');
        const formData = new FormData(form);
        
        return {
            // Données client
            nom: formData.get('nom'),
            prenom: formData.get('prenom'),
            email: formData.get('email'),
            telephone: formData.get('telephone'),
            adresse: formData.get('adresse'),
            ville: formData.get('ville'),
            code_postal: formData.get('code_postal'),
            pays: formData.get('pays'),
            
            // Données rendez-vous
            type: this.selectedType,
            domaine: this.selectedDomain,
            date: this.selectedDate?.toISOString().split('T')[0],
            heure: this.selectedTime,
            
            // Prix
            prix: this.getPriceForType(this.selectedType)
        };
    }

    validateFormData(data) {
        const errors = [];
        
        // Validation des champs obligatoires
        const requiredFields = ['nom', 'prenom', 'email', 'telephone', 'adresse', 'ville', 'code_postal'];
        requiredFields.forEach(field => {
            if (!data[field] || data[field].trim() === '') {
                errors.push(`Le champ ${field} est obligatoire`);
            }
        });
        
        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (data.email && !emailRegex.test(data.email)) {
            errors.push('L\'adresse email n\'est pas valide');
        }
        
        // Validation de la date et heure
        if (!data.date || !data.heure) {
            errors.push('Veuillez sélectionner une date et une heure');
        }
        
        // Validation du domaine
        if (!data.domaine) {
            errors.push('Veuillez sélectionner un domaine d\'intervention');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    async createOrUpdateClient(data) {
        try {
            // Vérifier si le client existe déjà
            const { success, data: existingClient } = await dbManager.getClientByEmail(data.email);
            
            if (success && existingClient) {
                // Mettre à jour le client existant
                return await dbManager.updateClient(existingClient.id, {
                    nom: data.nom,
                    prenom: data.prenom,
                    telephone: data.telephone,
                    adresse: data.adresse,
                    ville: data.ville,
                    code_postal: data.code_postal,
                    pays: data.pays
                });
            } else {
                // Créer un nouveau client
                return await dbManager.createClient(data);
            }
        } catch (error) {
            console.error('Erreur lors de la création/mise à jour du client:', error);
            return { success: false, error: error.message };
        }
    }

    async createAppointment(clientId, data) {
        try {
            const appointmentData = {
                client_id: clientId,
                date: data.date,
                heure: data.heure,
                type: data.type,
                domaine: data.domaine,
                status: 'confirmé'
            };
            
            return await dbManager.createAppointment(appointmentData);
        } catch (error) {
            console.error('Erreur lors de la création du rendez-vous:', error);
            return { success: false, error: error.message };
        }
    }

    async createPayment(clientId, appointmentId, data) {
        try {
            const paymentData = {
                appointment_id: appointmentId,
                client_id: clientId,
                montant: data.prix,
                methode_paiement: 'carte',
                status: 'en_attente'
            };
            
            return await dbManager.createPayment(paymentData);
        } catch (error) {
            console.error('Erreur lors de la création du paiement:', error);
            return { success: false, error: error.message };
        }
    }

    getPriceForType(type) {
        if (!this.pricing) return 0;
        
        const priceInfo = this.pricing.find(p => p.type_consultation === type);
        return priceInfo ? priceInfo.montant : 0;
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        
        // Supprimer les erreurs précédentes
        this.clearFieldError(field);
        
        // Validation selon le type de champ
        let isValid = true;
        let errorMessage = '';
        
        switch (fieldName) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (value && !emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Adresse email invalide';
                }
                break;
                
            case 'telephone':
                const phoneRegex = /^[0-9+\s\-\(\)]{10,}$/;
                if (value && !phoneRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Numéro de téléphone invalide';
                }
                break;
                
            case 'code_postal':
                const postalRegex = /^[0-9]{5}$/;
                if (value && !postalRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Code postal invalide (5 chiffres)';
                }
                break;
                
            default:
                if (field.required && !value) {
                    isValid = false;
                    errorMessage = 'Ce champ est obligatoire';
                }
        }
        
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }
        
        return isValid;
    }

    showFieldError(field, message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = 'red';
        errorDiv.style.fontSize = '0.8em';
        errorDiv.style.marginTop = '5px';
        
        field.parentNode.appendChild(errorDiv);
        field.classList.add('error');
    }

    clearFieldError(field) {
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
        field.classList.remove('error');
    }

    async loadAppointmentForEdit(appointmentId) {
        try {
            // TODO: Implémenter le chargement d'un rendez-vous pour édition
            console.log('Chargement du rendez-vous pour édition:', appointmentId);
        } catch (error) {
            console.error('Erreur lors du chargement du rendez-vous:', error);
        }
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
export const appointmentBooking = new UnifiedAppointmentBooking();

// Fonctions globales pour la navigation
window.nextStep = () => {
    if (appointmentBooking.currentStep < 3) {
        appointmentBooking.showStep(appointmentBooking.currentStep + 1);
    }
};

window.prevStep = () => {
    if (appointmentBooking.currentStep > 1) {
        appointmentBooking.showStep(appointmentBooking.currentStep - 1);
    }
};

window.selectTimeSlot = (time) => appointmentBooking.selectTimeSlot(time); 