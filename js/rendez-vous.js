document.addEventListener('DOMContentLoaded', function() {
    // Gestion de l'affichage du bouton de connexion
    function updateAuthButton() {
        const authLink = document.getElementById('auth-link');
        const token = localStorage.getItem('token');
        
        if (token) {
            // L'utilisateur est connecté
            authLink.innerHTML = `
                <a href="profile.html" class="btn-profile">
                    <i class="fas fa-user"></i> Mon Profil
                </a>
            `;
        }
    }

    // Appel de la fonction au chargement
    updateAuthButton();

    // Variables globales
    let selectedDomaine = null;
    let selectedDate = null;
    let selectedTime = null;
    let currentMonth = new Date();
    let appointmentType = 'regular';

    // Détection du type de consultation depuis l'URL
    function initAppointmentType() {
        const urlParams = new URLSearchParams(window.location.search);
        const typeParam = urlParams.get('type');
        
        if (typeParam === 'night') {
            appointmentType = 'night';
            // Sélectionner automatiquement le bouton consultation de nuit
            const nightBtn = document.querySelector('.type-btn[data-type="night"]');
            const regularBtn = document.querySelector('.type-btn[data-type="regular"]');
            
            if (nightBtn && regularBtn) {
                regularBtn.classList.remove('active');
                nightBtn.classList.add('active');
            }
        }
        
        // Mettre à jour l'indicateur visuel
        updateTypeIndicator();
    }
    
    // Fonction updateTypeIndicator supprimée - indicateur retiré du HTML
    
    // Gestion des clics sur les boutons de type
    function initTypeButtons() {
        const typeButtons = document.querySelectorAll('.type-btn');
        
        console.log('Found type buttons:', typeButtons.length);
        
        typeButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Type button clicked:', this.dataset.type);
                
                // Retirer la classe active de tous les boutons
                typeButtons.forEach(b => b.classList.remove('active'));
                
                // Ajouter la classe active au bouton cliqué
                this.classList.add('active');
                
                // Mettre à jour le type de rendez-vous
                appointmentType = this.dataset.type;
                console.log('Appointment type updated to:', appointmentType);
            });
        });
    }

    // Appel de l'initialisation au chargement
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM Content Loaded - Initializing appointment system');
        
        initAppointmentType();
        initTypeButtons();
        initCalendar();
    });// Initialisation du calendrier
    function initCalendar() {
        const calendar = document.getElementById('calendar');
        if (!calendar) return;

        // Création de l'en-tête du calendrier
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.innerHTML = `
            <button class="prev-month"><i class="fas fa-chevron-left"></i></button>
            <h3>${formatMonth(currentMonth)}</h3>
            <button class="next-month"><i class="fas fa-chevron-right"></i></button>
        `;
        calendar.appendChild(header);

        // Création de la grille des jours
        const daysGrid = document.createElement('div');
        daysGrid.className = 'calendar-grid';
        
        // En-têtes des jours
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            daysGrid.appendChild(dayHeader);
        });

        calendar.appendChild(daysGrid);

        // Gestionnaires d'événements pour la navigation
        header.querySelector('.prev-month').addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
            renderCalendar();
        });

        header.querySelector('.next-month').addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
            renderCalendar();
        });

        renderCalendar();
    }

    function renderCalendar() {
        const calendar = document.getElementById('calendar');
        const grid = calendar.querySelector('.calendar-grid');
        const header = calendar.querySelector('.calendar-header h3');
        
        // Mise à jour du titre
        header.textContent = formatMonth(currentMonth);

        // Supprime les jours existants
        while (grid.children.length > 7) {
            grid.removeChild(grid.lastChild);
        }

        // Calcul des jours du mois
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const startingDay = firstDay.getDay();
        
        // Jours du mois précédent
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            grid.appendChild(emptyDay);
        }

        // Jours du mois actuel
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dayOfWeek = date.getDay();
            
            // Désactive les jours passés
            if (date < new Date().setHours(0,0,0,0)) {
                dayElement.classList.add('disabled');
            } 
            // Marque les dimanches en rouge et les désactive
            else if (dayOfWeek === 0) {
                dayElement.classList.add('sunday');
                dayElement.classList.add('disabled');
            }
            // Marque les samedis
            else if (dayOfWeek === 6) {
                dayElement.classList.add('saturday');
                dayElement.addEventListener('click', () => selectDate(date));
            }
            else {
                dayElement.addEventListener('click', () => selectDate(date));
            }

            if (selectedDate && isSameDay(date, selectedDate)) {
                dayElement.classList.add('selected');
            }

            grid.appendChild(dayElement);
        }
    }

    function selectDate(date) {
        selectedDate = date;
        renderCalendar();
        generateTimeSlots(date);
        updateSummary();
    }

    function generateTimeSlots(date) {
        const timeSlotContainer = document.querySelector('.time-slots');
        if (!timeSlotContainer) return;

        timeSlotContainer.innerHTML = '';
        
        const dayOfWeek = date.getDay(); // 0 = Dimanche
        const appointmentType = document.querySelector('.type-btn.active').dataset.type;

        // Si c'est dimanche, on n'affiche aucun créneau
        if (dayOfWeek === 0) {
            const message = document.createElement('p');
            message.className = 'closed-message';
            message.textContent = 'Fermé le dimanche';
            timeSlotContainer.appendChild(message);
            return;
        }

        // Titre des créneaux
        const title = document.createElement('h3');
        title.textContent = appointmentType === 'night' ? 'Créneaux de nuit disponibles' : 'Créneaux disponibles';
        timeSlotContainer.appendChild(title);

        // Création de la grille des créneaux
        const slotsGrid = document.createElement('div');
        slotsGrid.className = 'slots-grid';
        timeSlotContainer.appendChild(slotsGrid);

        let hours = [];
        if (appointmentType === 'night') {
            // Horaires de nuit (20h-6h) - pas de restriction selon les horaires d'ouverture
            for (let h = 20; h <= 23; h++) {
                hours.push(h.toString().padStart(2, '0') + ':00');
            }
            for (let h = 0; h <= 6; h++) {
                hours.push(h.toString().padStart(2, '0') + ':00');
            }
        } else {
            // Horaires de jour selon les horaires de consultation
             if (dayOfWeek === 6) {
                 // Samedi : 9h00 - 17h00
                 for (let h = 9; h <= 16; h++) {
                     hours.push(h.toString().padStart(2, '0') + ':00');
                 }
             } else {
                 // Lundi - Vendredi : 9h00 - 19h00
                 for (let h = 9; h <= 19; h++) {
                     hours.push(h.toString().padStart(2, '0') + ':00');
                 }
             }
        }

        hours.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;
            
            // Vérifie si le créneau est déjà sélectionné
            if (selectedTime === time) {
                slot.classList.add('selected');
            }

            slot.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                selectedTime = time;
                updateSummary();
            });

            slotsGrid.appendChild(slot);
        });
    }

    // Fonctions utilitaires
    function formatMonth(date) {
        return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }

    function isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    function updateSummary() {
        if (selectedDomaine) {
            const selectedCard = document.querySelector(`.domaine-card[data-domaine="${selectedDomaine}"]`);
            document.getElementById('summary-domaine').textContent = selectedCard.querySelector('h3').textContent;
        }
        if (selectedDate) {
            document.getElementById('summary-date').textContent = selectedDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        if (selectedTime) {
            document.getElementById('summary-time').textContent = selectedTime;
        }
        
        // Mise à jour du prix selon le type de consultation
        updatePrice();
    }
    
    function updatePrice() {
        const appointmentType = document.querySelector('.type-btn.active').dataset.type;
        const priceElement = document.getElementById('summary-price');
        const submitButton = document.querySelector('.btn-submit');
        
        if (appointmentType === 'night') {
             priceElement.textContent = '80€';
             submitButton.innerHTML = '<i class="fas fa-lock"></i> Confirmer et payer 80€';
         } else {
             priceElement.textContent = '60€';
             submitButton.innerHTML = '<i class="fas fa-lock"></i> Confirmer et payer 60€';
         }
    }

    // Sélection des domaines
    const domaineCards = document.querySelectorAll('.domaine-card');
    domaineCards.forEach(card => {
        card.addEventListener('click', function() {
            domaineCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedDomaine = this.dataset.domaine;
            updateSummary();
            document.querySelector('#step1 .btn-next').disabled = false;
        });
    });

    // Navigation entre les étapes
    function nextStep() {
        const currentStep = document.querySelector('.form-step.active');
        const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
        const nextStepNumber = currentStepNumber + 1;
        
        if (!validateStep(currentStepNumber)) {
            return;
        }

        document.querySelector(`#step${currentStepNumber}`).classList.remove('active');
        document.querySelector(`#step${nextStepNumber}`).classList.add('active');
        updateStepIndicators(nextStepNumber);
        // Correction : remonter le formulaire Stripe si on arrive à l'étape 3
        if (nextStepNumber === 3 && document.getElementById('card-element')) {
            setTimeout(() => { cardElement.mount('#card-element'); }, 100);
        }
    }

    function prevStep() {
        const currentStep = document.querySelector('.form-step.active');
        const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
        const prevStepNumber = currentStepNumber - 1;
        
        document.querySelector(`#step${currentStepNumber}`).classList.remove('active');
        document.querySelector(`#step${prevStepNumber}`).classList.add('active');
        updateStepIndicators(prevStepNumber);
    }

    function updateStepIndicators(activeStep) {
        document.querySelectorAll('.step').forEach(step => {
            const stepNumber = parseInt(step.dataset.step);
            step.classList.remove('active');
            if (stepNumber === activeStep) {
                step.classList.add('active');
            }
        });
    }

    function validateStep(stepNumber) {
        switch(stepNumber) {
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

    // Gestionnaires d'événements pour les boutons
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', nextStep);
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', prevStep);
    });

    // Initialisation
    document.querySelector('#step1 .btn-next').disabled = true;
    initCalendar();
    updateSummary();
    updatePrice(); // Initialiser le prix au chargement

    // Initialisation de Stripe Elements
    const stripe = Stripe('pk_live_51QhYTQG6ANFCmFDzl7XLynpC5qx0tplCUpTFy90KkZNNGbkNkgKSzr22sUKy3L8OCJJIJz84bOvvLn12D4OFQYg000jn8pCue7');
    const elements = stripe.elements({
        locale: 'fr',
        appearance: {
            theme: 'stripe',
            variables: {
                colorPrimary: '#4361ee',
                colorBackground: '#ffffff',
                colorText: '#1a1a1a',
                colorDanger: '#df1b41',
                fontFamily: 'Poppins, system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px',
            },
        },
    });

    const cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#1a1a1a',
                '::placeholder': {
                    color: '#87868c',
                },
            },
        },
        hidePostalCode: true,
    });

    cardElement.mount('#card-element');

    cardElement.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });

    // Montants de paiement en centimes
     const PAYMENT_AMOUNTS = {
         regular: 6000, // 60€ = 6000 centimes
         night: 8000    // 80€ = 8000 centimes
     };

    document.getElementById('rdv-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = document.querySelector('.btn-submit');
        const errorElement = document.getElementById('card-errors');
        
        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement en cours...';

            // Déterminer le montant selon le type de consultation
            const appointmentType = document.querySelector('.type-btn.active').dataset.type;
            const paymentAmount = PAYMENT_AMOUNTS[appointmentType];
            
            // Créer l'intention de paiement
            const response = await fetch('http://localhost:3000/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: paymentAmount,
                    currency: 'eur'
                })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la création du paiement');
            }

            const { clientSecret } = await response.json();

            // Confirmer le paiement avec Stripe
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: `${document.getElementById('prenom').value} ${document.getElementById('nom').value}`,
                        email: document.getElementById('email').value,
                        phone: document.getElementById('telephone').value
                    }
                }
            });

            if (error) {
                throw error;
            }

            if (paymentIntent.status === 'succeeded') {
                // Paiement réussi
                submitButton.innerHTML = '<i class="fas fa-check"></i> Paiement réussi !';
                window.location.href = 'confirmation.html';
            }

        } catch (error) {
            console.error('Erreur:', error);
            errorElement.textContent = error.message || "Une erreur est survenue lors du paiement.";
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-lock"></i> Réessayer le paiement';
        }
    });

    // Gestion du type de rendez-vous (classique/nuit)
    document.querySelectorAll('.type-btn').forEach(button => {
        button.addEventListener('click', () => {
            // Mise à jour des boutons
            document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Mise à jour du type de rendez-vous
            appointmentType = button.dataset.type;

            // Gestion du mode nuit/jour
            const calendarContainer = document.querySelector('.calendar-container');
            if (appointmentType === 'night') {
                calendarContainer.classList.add('night-mode');
            } else {
                calendarContainer.classList.remove('night-mode');
            }

            // Réinitialisation de la sélection
            selectedTime = null;

            // Mise à jour des créneaux horaires disponibles
            if (selectedDate) {
                generateTimeSlots(selectedDate);
            }
            
            // Mise à jour du résumé et du prix
            updateSummary();
            updatePrice();
        });
    });
});