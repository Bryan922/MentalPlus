import { stripe, initializePayment } from './stripe-config.js';

// Vérification de l'authentification
function checkAuth() {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    // Récupération des informations de l'utilisateur
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Pré-remplissage du formulaire avec les informations de l'utilisateur
    if (user) {
        const nomInput = document.getElementById('nom');
        const prenomInput = document.getElementById('prenom');
        const emailInput = document.getElementById('email');
        
        if (user.name) {
            const [prenom, nom] = user.name.split(' ');
            if (nomInput) nomInput.value = nom || '';
            if (prenomInput) prenomInput.value = prenom || '';
        }
        if (emailInput && user.email) emailInput.value = user.email;
    }

    initializeDomaines();
    initializeCalendar();
    initializeForm();
    updateSummary();
});

// Gestion des étapes du formulaire
let currentStep = 1;
let selectedDomaine = null;
let selectedDate = null;
let selectedTime = null;

function nextStep() {
    if (validateCurrentStep()) {
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
        document.querySelector(`#step${currentStep}`).classList.remove('active');
        currentStep++;
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');
        document.querySelector(`#step${currentStep}`).classList.add('active');
        updateSummary();
    }
}

function prevStep() {
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
    document.querySelector(`#step${currentStep}`).classList.remove('active');
    currentStep--;
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');
    document.querySelector(`#step${currentStep}`).classList.add('active');
}

function validateCurrentStep() {
    switch(currentStep) {
        case 1:
            if (!selectedDomaine) {
                alert('Veuillez sélectionner un domaine d\'intervention');
                return false;
            }
            return true;
        case 2:
            if (!selectedDate || !selectedTime) {
                alert('Veuillez sélectionner une date et une heure');
                return false;
            }
            return true;
        default:
            return true;
    }
}

// Rendre les fonctions disponibles globalement
window.nextStep = nextStep;
window.prevStep = prevStep;
window.prevMonth = prevMonth;
window.nextMonth = nextMonth;
window.selectDate = selectDate;
window.selectTime = selectTime;

// Gestion des domaines d'intervention
function initializeDomaines() {
    const domaines = document.querySelectorAll('.domaine-card');
    domaines.forEach(domaine => {
        domaine.addEventListener('click', () => {
            console.log('Domaine cliqué:', domaine.dataset.domaine);
            // Retirer la sélection précédente
            domaines.forEach(d => d.classList.remove('selected'));
            // Ajouter la sélection au domaine cliqué
            domaine.classList.add('selected');
            selectedDomaine = {
                id: domaine.dataset.domaine,
                name: domaine.querySelector('h3').textContent
            };
            console.log('Domaine sélectionné:', selectedDomaine);
            updateSummary();
        });
    });
}

// Gestion du calendrier
function initializeCalendar() {
    const calendar = document.getElementById('calendar');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    renderCalendar(currentMonth, currentYear);
    renderTimeSlots(today);
}

function renderCalendar(month, year) {
    const calendar = document.getElementById('calendar');
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const monthLength = lastDay.getDate();

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    let calendarHTML = `
        <div class="calendar-header">
            <button onclick="prevMonth()"><i class="fas fa-chevron-left"></i></button>
            <h3>${monthNames[month]} ${year}</h3>
            <button onclick="nextMonth()"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="calendar-grid">
            <div class="calendar-day-header">Lun</div>
            <div class="calendar-day-header">Mar</div>
            <div class="calendar-day-header">Mer</div>
            <div class="calendar-day-header">Jeu</div>
            <div class="calendar-day-header">Ven</div>
            <div class="calendar-day-header">Sam</div>
            <div class="calendar-day-header">Dim</div>
    `;

    // Remplir les jours
    let day = 1;
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < startingDay) {
                calendarHTML += '<div class="calendar-day empty"></div>';
            } else if (day > monthLength) {
                calendarHTML += '<div class="calendar-day empty"></div>';
            } else {
                const date = new Date(year, month, day);
                const isDisabled = isDateDisabled(date);
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                calendarHTML += `
                    <div class="calendar-day ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}"
                         onclick="${isDisabled ? '' : `selectDate(${year}, ${month}, ${day})`}">
                        ${day}
                    </div>`;
                day++;
            }
        }
    }

    calendarHTML += '</div>';
    calendar.innerHTML = calendarHTML;
}

function isDateDisabled(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = date.getDay();
    return date < today || day === 0 || day === 1; // Dimanche = 0, Lundi = 1
}

function selectDate(year, month, day) {
    selectedDate = new Date(year, month, day);
    renderCalendar(month, year);
    renderTimeSlots(selectedDate);
    updateSummary();
}

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function prevMonth() {
    if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
    } else {
        currentMonth--;
    }
    renderCalendar(currentMonth, currentYear);
}

function nextMonth() {
    if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
    } else {
        currentMonth++;
    }
    renderCalendar(currentMonth, currentYear);
}

function generateTimeSlots() {
    const slots = [];
    // Matin
    for (let hour = 10; hour < 13; hour++) {
        slots.push(`${hour}:00`);
    }
    // Pause déjeuner 13:00-14:00
    // Après-midi
    for (let hour = 14; hour < 18; hour++) {
        slots.push(`${hour}:00`);
    }
    return slots;
}

function renderTimeSlots(date) {
    if (!date) return;

    const slotsGrid = document.querySelector('.slots-grid');
    const timeSlots = generateTimeSlots();
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    slotsGrid.innerHTML = timeSlots.map(slot => {
        const [hours] = slot.split(':').map(Number);
        const slotDate = new Date(date);
        slotDate.setHours(hours, 0);

        const isDisabled = isToday && slotDate < now;
        
        return `
            <div class="time-slot ${selectedTime === slot ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                 onclick="${isDisabled ? '' : `selectTime('${slot}')`}">
                ${slot}
            </div>
        `;
    }).join('');
}

function selectTime(time) {
    selectedTime = time;
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.toggle('selected', slot.textContent === time);
    });
    updateSummary();
}

// Gestion du formulaire
function initializeForm() {
    const form = document.getElementById('rdv-form');
    form.addEventListener('submit', handleSubmit);
}

function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        domaine: selectedDomaine,
        date: selectedDate,
        time: selectedTime,
        nom: formData.get('nom'),
        prenom: formData.get('prenom'),
        email: formData.get('email'),
        telephone: formData.get('telephone'),
        notes: formData.get('notes')
    };
    
    console.log('Données du rendez-vous:', data);
    // Ici, vous ajouteriez la logique pour envoyer les données au serveur
    alert('Rendez-vous confirmé ! Vous allez recevoir un email de confirmation.');
    window.location.href = 'confirmation.html';
}

// Mise à jour du résumé
function updateSummary() {
    console.log('Mise à jour du résumé:', {
        domaine: selectedDomaine,
        date: selectedDate,
        time: selectedTime
    });
    
    const domaineElement = document.getElementById('summary-domaine');
    const dateElement = document.getElementById('summary-date');
    const timeElement = document.getElementById('summary-time');
    
    if (domaineElement) domaineElement.textContent = selectedDomaine ? selectedDomaine.name : '-';
    if (dateElement) dateElement.textContent = selectedDate ? selectedDate.toLocaleDateString('fr-FR') : '-';
    if (timeElement) timeElement.textContent = selectedTime || '-';
}

// Initialisation des éléments Stripe
const elements = stripe.elements();
const card = elements.create('card', {
    style: {
        base: {
            fontSize: '16px',
            color: '#32325d',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            '::placeholder': {
                color: '#aab7c4'
            }
        },
        invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
        }
    }
});

// Monter l'élément carte dans le DOM
card.mount('#card-element');

// Gérer les erreurs de validation en temps réel
card.on('change', function(event) {
    const displayError = document.getElementById('card-errors');
    if (event.error) {
        displayError.textContent = event.error.message;
    } else {
        displayError.textContent = '';
    }
});

// Gérer la soumission du formulaire
document.getElementById('rdv-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const submitButton = document.querySelector('.btn-submit');
    submitButton.disabled = true;
    submitButton.textContent = 'Traitement en cours...';

    try {
        // Récupérer les informations du rendez-vous
        const domaine = document.getElementById('summary-domaine').textContent;
        const date = document.getElementById('summary-date').textContent;
        const time = document.getElementById('summary-time').textContent;
        const amount = 5000; // 50€ en centimes

        // Initialiser le paiement
        const clientSecret = await initializePayment(amount, `Consultation ${domaine} - ${date} ${time}`);

        // Confirmer le paiement
        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: card,
                billing_details: {
                    name: document.getElementById('nom').value + ' ' + document.getElementById('prenom').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('telephone').value
                }
            }
        });

        if (result.error) {
            // Gérer les erreurs
            const errorElement = document.getElementById('card-errors');
            errorElement.textContent = result.error.message;
            submitButton.disabled = false;
            submitButton.textContent = 'Confirmer et payer';
        } else {
            // Paiement réussi
            window.location.href = '/confirmation.html';
        }
    } catch (error) {
        console.error('Erreur:', error);
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = 'Une erreur est survenue. Veuillez réessayer.';
        submitButton.disabled = false;
        submitButton.textContent = 'Confirmer et payer';
    }
}); 