/**
 * Script pour la page de prise de rendez-vous (rendez-vous.html)
 * Gestion sécurisée de la réservation de rendez-vous
 */

// Vérification des dépendances
if (typeof appointmentsService === 'undefined' || typeof authService === 'undefined') {
  console.error('❌ Services requis non chargés');
  alert('Erreur de chargement. Veuillez rafraîchir la page.');
}

/**
 * Gestionnaire de la page de rendez-vous
 */
class AppointmentsPageManager {
  constructor() {
    this.isLoading = false;
    this.selectedDate = null;
    this.selectedTime = null;
    this.selectedEmployee = null;
    this.availableSlots = [];
    this.employees = [];
    
    this.init();
  }

  /**
   * Initialisation de la page
   */
  init() {
    console.log('📅 Initialisation de la page de rendez-vous...');
    
    // Vérifier l'authentification
    if (!authService.isAuthenticated()) {
      console.warn('⚠️ Utilisateur non connecté');
      authService.redirectToLogin();
      return;
    }
    
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupPage());
    } else {
      this.setupPage();
    }
  }

  /**
   * Configuration de la page
   */
  async setupPage() {
    try {
      this.setupFormElements();
      this.setupEventListeners();
      await this.loadEmployees();
      this.setupDatePicker();
      
      console.log('✅ Page de rendez-vous configurée');
      
    } catch (error) {
      console.error('❌ Erreur lors de la configuration:', error);
      this.showError('Erreur de configuration de la page');
    }
  }

  /**
   * Configuration des éléments du formulaire
   */
  setupFormElements() {
    // Créer le formulaire s'il n'existe pas
    if (!document.getElementById('appointmentForm')) {
      this.createAppointmentForm();
    }
    
    // Références aux éléments
    this.form = document.getElementById('appointmentForm');
    this.employeeSelect = document.getElementById('employee');
    this.appointmentTypeSelect = document.getElementById('appointmentType');
    this.dateInput = document.getElementById('appointmentDate');
    this.timeContainer = document.getElementById('timeSlots');
    this.notesTextarea = document.getElementById('notes');
    this.submitButton = document.getElementById('submitAppointment');
    this.errorContainer = document.getElementById('errorContainer');
    this.loadingIndicator = document.getElementById('loadingIndicator');
    this.summaryContainer = document.getElementById('appointmentSummary');
    
    // Remplir les types de rendez-vous
    this.populateAppointmentTypes();
  }

  /**
   * Création du formulaire de rendez-vous
   */
  createAppointmentForm() {
    const container = document.querySelector('.appointment-container') || document.body;
    
    const formHTML = `
      <div class="appointment-form-container">
        <h2>Prendre un rendez-vous</h2>
        
        <div id="errorContainer" class="error-container" style="display: none;"></div>
        <div id="loadingIndicator" class="loading-indicator" style="display: none;">
          <div class="spinner"></div>
          <span>Chargement...</span>
        </div>
        
        <form id="appointmentForm" class="appointment-form">
          <div class="form-row">
            <div class="form-group">
              <label for="employee">Praticien *</label>
              <select id="employee" name="employee" required>
                <option value="">Sélectionnez un praticien</option>
              </select>
              <div class="field-error" id="employeeError"></div>
            </div>
            
            <div class="form-group">
              <label for="appointmentType">Type de consultation *</label>
              <select id="appointmentType" name="appointmentType" required>
                <option value="">Sélectionnez le type</option>
              </select>
              <div class="field-error" id="appointmentTypeError"></div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="appointmentDate">Date *</label>
              <input type="date" id="appointmentDate" name="appointmentDate" required>
              <div class="field-error" id="appointmentDateError"></div>
            </div>
          </div>
          
          <div class="form-group">
            <label>Créneaux disponibles *</label>
            <div id="timeSlots" class="time-slots-container">
              <div class="no-slots-message">Sélectionnez d'abord un praticien et une date</div>
            </div>
            <div class="field-error" id="timeSlotsError"></div>
          </div>
          
          <div class="form-group">
            <label for="notes">Notes ou demandes particulières</label>
            <textarea id="notes" name="notes" rows="4" maxlength="500" 
                      placeholder="Décrivez brièvement le motif de votre consultation ou toute information importante..."></textarea>
            <div class="character-count">0/500 caractères</div>
            <div class="field-error" id="notesError"></div>
          </div>
          
          <div id="appointmentSummary" class="appointment-summary" style="display: none;">
            <h3>Récapitulatif de votre rendez-vous</h3>
            <div class="summary-content"></div>
          </div>
          
          <button type="submit" id="submitAppointment" class="submit-button" disabled>
            Confirmer le rendez-vous
          </button>
        </form>
        
        <div class="form-footer">
          <p class="info-text">
            <strong>Important :</strong> Vous recevrez une confirmation par email. 
            En cas d'empêchement, merci de nous prévenir au moins 24h à l'avance.
          </p>
        </div>
      </div>
    `;
    
    container.innerHTML = formHTML;
  }

  /**
   * Configuration des écouteurs d'événements
   */
  setupEventListeners() {
    // Soumission du formulaire
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Changement d'employé
    this.employeeSelect.addEventListener('change', () => this.handleEmployeeChange());
    
    // Changement de date
    this.dateInput.addEventListener('change', () => this.handleDateChange());
    
    // Changement de type de rendez-vous
    this.appointmentTypeSelect.addEventListener('change', () => this.updateSummary());
    
    // Compteur de caractères pour les notes
    this.notesTextarea.addEventListener('input', () => this.updateCharacterCount());
    
    // Validation en temps réel
    this.notesTextarea.addEventListener('blur', () => this.validateNotes());
  }

  /**
   * Configuration du sélecteur de date
   */
  setupDatePicker() {
    // Définir la date minimum (aujourd'hui)
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    this.dateInput.setAttribute('min', minDate);
    
    // Définir la date maximum (1 an dans le futur)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    this.dateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
  }

  /**
   * Chargement des employés disponibles
   */
  async loadEmployees() {
    try {
      console.log('👥 Chargement des employés...');
      this.setLoading(true);
      
      const result = await appointmentsService.getAvailableEmployees();
      
      if (result.success) {
        this.employees = result.data;
        this.populateEmployeeSelect();
        console.log(`✅ ${this.employees.length} employés chargés`);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des employés:', error);
      this.showError('Impossible de charger la liste des praticiens');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Remplissage du sélecteur d'employés
   */
  populateEmployeeSelect() {
    // Vider les options existantes (sauf la première)
    while (this.employeeSelect.children.length > 1) {
      this.employeeSelect.removeChild(this.employeeSelect.lastChild);
    }
    
    // Ajouter les employés
    this.employees.forEach(employee => {
      const option = document.createElement('option');
      option.value = employee.id;
      option.textContent = employee.full_name;
      
      if (employee.specialties) {
        option.textContent += ` - ${employee.specialties}`;
      }
      
      this.employeeSelect.appendChild(option);
    });
  }

  /**
   * Remplissage des types de rendez-vous
   */
  populateAppointmentTypes() {
    const types = appointmentsService.getAppointmentTypes();
    
    types.forEach(type => {
      const option = document.createElement('option');
      option.value = type.id;
      option.textContent = `${type.name} (${type.duration} min)`;
      this.appointmentTypeSelect.appendChild(option);
    });
  }

  /**
   * Gestion du changement d'employé
   */
  async handleEmployeeChange() {
    this.selectedEmployee = this.employeeSelect.value;
    this.clearTimeSlots();
    
    if (this.selectedEmployee && this.selectedDate) {
      await this.loadAvailableSlots();
    }
    
    this.updateSubmitButton();
    this.updateSummary();
  }

  /**
   * Gestion du changement de date
   */
  async handleDateChange() {
    const dateValue = this.dateInput.value;
    
    // Validation de la date
    const dateValidation = securityUtils.validateDate(dateValue);
    if (!dateValidation.isValid) {
      this.showFieldError('appointmentDate', dateValidation.error);
      return;
    }
    
    this.selectedDate = dateValue;
    this.clearTimeSlots();
    
    if (this.selectedEmployee && this.selectedDate) {
      await this.loadAvailableSlots();
    }
    
    this.updateSubmitButton();
    this.updateSummary();
  }

  /**
   * Chargement des créneaux disponibles
   */
  async loadAvailableSlots() {
    try {
      console.log('🕐 Chargement des créneaux disponibles...');
      this.setTimeSlotLoading(true);
      
      const result = await appointmentsService.getAvailableSlots(
        this.selectedDate,
        this.selectedEmployee
      );
      
      if (result.success) {
        this.availableSlots = result.data;
        this.displayTimeSlots();
        console.log(`✅ ${this.availableSlots.length} créneaux disponibles`);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des créneaux:', error);
      this.showError('Impossible de charger les créneaux disponibles');
    } finally {
      this.setTimeSlotLoading(false);
    }
  }

  /**
   * Affichage des créneaux horaires
   */
  displayTimeSlots() {
    this.timeContainer.innerHTML = '';
    
    if (this.availableSlots.length === 0) {
      this.timeContainer.innerHTML = '<div class="no-slots-message">Aucun créneau disponible pour cette date</div>';
      return;
    }
    
    this.availableSlots.forEach(slot => {
      const slotButton = document.createElement('button');
      slotButton.type = 'button';
      slotButton.className = 'time-slot';
      slotButton.textContent = slot;
      slotButton.value = slot;
      
      slotButton.addEventListener('click', () => this.selectTimeSlot(slot, slotButton));
      
      this.timeContainer.appendChild(slotButton);
    });
  }

  /**
   * Sélection d'un créneau horaire
   */
  selectTimeSlot(time, buttonElement) {
    // Désélectionner les autres créneaux
    const allSlots = this.timeContainer.querySelectorAll('.time-slot');
    allSlots.forEach(slot => slot.classList.remove('selected'));
    
    // Sélectionner le créneau actuel
    buttonElement.classList.add('selected');
    this.selectedTime = time;
    
    this.updateSubmitButton();
    this.updateSummary();
  }

  /**
   * Mise à jour du récapitulatif
   */
  updateSummary() {
    if (!this.selectedEmployee || !this.selectedDate || !this.selectedTime || !this.appointmentTypeSelect.value) {
      this.summaryContainer.style.display = 'none';
      return;
    }
    
    const employee = this.employees.find(emp => emp.id === this.selectedEmployee);
    const appointmentType = appointmentsService.getAppointmentTypes().find(type => type.id === this.appointmentTypeSelect.value);
    
    const summaryHTML = `
      <div class="summary-item">
        <strong>Praticien :</strong> ${employee?.full_name || 'Non sélectionné'}
      </div>
      <div class="summary-item">
        <strong>Type :</strong> ${appointmentType?.name || 'Non sélectionné'}
      </div>
      <div class="summary-item">
        <strong>Date :</strong> ${this.formatDate(this.selectedDate)}
      </div>
      <div class="summary-item">
        <strong>Heure :</strong> ${this.selectedTime}
      </div>
      <div class="summary-item">
        <strong>Durée :</strong> ${appointmentType?.duration || 0} minutes
      </div>
    `;
    
    this.summaryContainer.querySelector('.summary-content').innerHTML = summaryHTML;
    this.summaryContainer.style.display = 'block';
  }

  /**
   * Formatage de la date
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Mise à jour du bouton de soumission
   */
  updateSubmitButton() {
    const isFormValid = this.selectedEmployee && 
                       this.selectedDate && 
                       this.selectedTime && 
                       this.appointmentTypeSelect.value;
    
    this.submitButton.disabled = !isFormValid || this.isLoading;
  }

  /**
   * Gestion de la soumission du formulaire
   */
  async handleSubmit(event) {
    event.preventDefault();
    
    if (this.isLoading) {
      return;
    }
    
    try {
      this.setLoading(true);
      this.clearErrors();
      
      // Validation finale
      if (!this.validateForm()) {
        return;
      }
      
      const appointmentData = this.getAppointmentData();
      
      // Validation côté client
      const validation = formValidator.validateAppointmentForm(appointmentData);
      
      if (!validation.isValid) {
        this.showValidationErrors(validation.errors);
        return;
      }
      
      // Créer le rendez-vous
      const result = await appointmentsService.createAppointment(validation.sanitizedData);
      
      if (result.success) {
        this.showSuccess('Rendez-vous créé avec succès!');
        this.handleSuccessfulBooking(result.data);
      } else {
        this.showError(result.error);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la création du rendez-vous:', error);
      this.showError('Une erreur est survenue lors de la création du rendez-vous');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Récupération des données du rendez-vous
   */
  getAppointmentData() {
    return {
      employee_id: this.selectedEmployee,
      type: this.appointmentTypeSelect.value,
      date: this.selectedDate,
      time: this.selectedTime,
      notes: this.notesTextarea.value.trim()
    };
  }

  /**
   * Validation du formulaire
   */
  validateForm() {
    let isValid = true;
    
    // Validation employé
    if (!this.selectedEmployee) {
      this.showFieldError('employee', 'Veuillez sélectionner un praticien');
      isValid = false;
    }
    
    // Validation type
    if (!this.appointmentTypeSelect.value) {
      this.showFieldError('appointmentType', 'Veuillez sélectionner un type de consultation');
      isValid = false;
    }
    
    // Validation date
    if (!this.selectedDate) {
      this.showFieldError('appointmentDate', 'Veuillez sélectionner une date');
      isValid = false;
    }
    
    // Validation heure
    if (!this.selectedTime) {
      this.showFieldError('timeSlots', 'Veuillez sélectionner un créneau horaire');
      isValid = false;
    }
    
    // Validation notes
    if (!this.validateNotes()) {
      isValid = false;
    }
    
    return isValid;
  }

  /**
   * Validation des notes
   */
  validateNotes() {
    const notes = this.notesTextarea.value;
    
    if (notes) {
      // Vérification de sécurité
      const injectionCheck = securityUtils.detectInjection(notes);
      if (!injectionCheck.isSafe) {
        this.showFieldError('notes', 'Contenu non autorisé détecté dans les notes');
        return false;
      }
      
      // Vérification de la longueur
      if (notes.length > 500) {
        this.showFieldError('notes', 'Les notes ne peuvent pas dépasser 500 caractères');
        return false;
      }
    }
    
    this.clearFieldError('notes');
    return true;
  }

  /**
   * Mise à jour du compteur de caractères
   */
  updateCharacterCount() {
    const count = this.notesTextarea.value.length;
    const counter = document.querySelector('.character-count');
    
    if (counter) {
      counter.textContent = `${count}/500 caractères`;
      counter.style.color = count > 450 ? '#ff4444' : count > 400 ? '#ff8800' : '#666';
    }
  }

  /**
   * Gestion du succès de la réservation
   */
  handleSuccessfulBooking(appointmentData) {
    // Afficher un message de confirmation détaillé
    const employee = this.employees.find(emp => emp.id === appointmentData.employee_id);
    const appointmentType = appointmentsService.getAppointmentTypes().find(type => type.id === appointmentData.appointment_type);
    
    const confirmationHTML = `
      <div class="booking-confirmation">
        <h3>✅ Rendez-vous confirmé</h3>
        <div class="confirmation-details">
          <p><strong>Praticien :</strong> ${employee?.full_name}</p>
          <p><strong>Type :</strong> ${appointmentType?.name}</p>
          <p><strong>Date :</strong> ${this.formatDate(appointmentData.appointment_date)}</p>
          <p><strong>Heure :</strong> ${appointmentData.appointment_time}</p>
          <p><strong>Référence :</strong> #${appointmentData.id}</p>
        </div>
        <p class="confirmation-note">
          Un email de confirmation vous a été envoyé. 
          Vous pouvez consulter vos rendez-vous dans votre espace client.
        </p>
        <div class="confirmation-actions">
          <button onclick="window.location.href='/espace-client.html'" class="btn-primary">
            Voir mes rendez-vous
          </button>
          <button onclick="window.location.reload()" class="btn-secondary">
            Prendre un autre rendez-vous
          </button>
        </div>
      </div>
    `;
    
    // Remplacer le formulaire par la confirmation
    this.form.style.display = 'none';
    this.errorContainer.innerHTML = confirmationHTML;
    this.errorContainer.style.display = 'block';
  }

  /**
   * Effacement des créneaux horaires
   */
  clearTimeSlots() {
    this.timeContainer.innerHTML = '<div class="no-slots-message">Sélectionnez d\'abord un praticien et une date</div>';
    this.selectedTime = null;
  }

  /**
   * Affichage d'une erreur de champ
   */
  showFieldError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  /**
   * Effacement d'une erreur de champ
   */
  clearFieldError(fieldName) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    if (errorElement) {
      errorElement.textContent = '';
    }
  }

  /**
   * Affichage des erreurs de validation
   */
  showValidationErrors(errors) {
    const errorHtml = errors.map(error => `<div class="error-item">• ${error}</div>`).join('');
    this.showError(`<div class="validation-errors">${errorHtml}</div>`);
  }

  /**
   * Affichage d'une erreur
   */
  showError(message) {
    this.errorContainer.innerHTML = `<div class="error-message">❌ ${message}</div>`;
    this.errorContainer.style.display = 'block';
    this.errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Affichage d'un message de succès
   */
  showSuccess(message) {
    this.errorContainer.innerHTML = `<div class="success-message">✅ ${message}</div>`;
    this.errorContainer.style.display = 'block';
  }

  /**
   * Effacer les erreurs
   */
  clearErrors() {
    this.errorContainer.style.display = 'none';
    this.errorContainer.innerHTML = '';
    
    // Effacer les erreurs de champs individuels
    const errorElements = document.querySelectorAll('.field-error');
    errorElements.forEach(element => {
      element.textContent = '';
    });
  }

  /**
   * Gestion de l'état de chargement
   */
  setLoading(loading) {
    this.isLoading = loading;
    
    if (loading) {
      this.loadingIndicator.style.display = 'block';
      this.submitButton.disabled = true;
    } else {
      this.loadingIndicator.style.display = 'none';
      this.updateSubmitButton();
    }
  }

  /**
   * Gestion du chargement des créneaux
   */
  setTimeSlotLoading(loading) {
    if (loading) {
      this.timeContainer.innerHTML = '<div class="loading-slots">Chargement des créneaux...</div>';
    }
  }
}

// Initialiser le gestionnaire de page
window.appointmentsPageManager = new AppointmentsPageManager();

console.log('📅 Script de la page de rendez-vous chargé');