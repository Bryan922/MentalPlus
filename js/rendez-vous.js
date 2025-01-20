document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let selectedDomaine = null;
    let selectedDate = null;
    let selectedTime = null;
    let currentMonth = new Date();
    let appointmentType = 'regular';

    // Initialisation du calendrier
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
        const slotsGrid = document.querySelector('.slots-grid');
        if (!slotsGrid) return;

        slotsGrid.innerHTML = '';
        
        // Horaires disponibles (9h-18h)
        const hours = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
        
        hours.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;

            // Vérifie si le créneau est déjà sélectionné
            if (selectedTime === time) {
                slot.classList.add('selected');
            }

            slot.addEventListener('click', () => {
                // Désélectionne tous les créneaux
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                // Sélectionne le créneau cliqué
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

    // Mise à jour de la fonction submitAppointment
    async function submitAppointment() {
        const submitButton = document.querySelector('.btn-submit');
        const errorElement = document.getElementById('card-errors');
        
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Traitement en cours...';

            // Créer l'intention de paiement
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    amount: 5000, // 50€ en centimes
                    description: `Consultation ${selectedDomaine} - ${selectedDate.toLocaleDateString()} ${selectedTime}`,
                })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la création du paiement');
            }

            const { clientSecret } = await response.json();

            // Confirmer le paiement
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: `${document.getElementById('prenom').value} ${document.getElementById('nom').value}`,
                        email: document.getElementById('email').value,
                        phone: document.getElementById('telephone').value,
                    },
                },
            });

            if (error) {
                throw error;
            }

            // Créer le rendez-vous
            const appointmentResponse = await fetch('/api/appointments.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    date: selectedDate.toISOString().split('T')[0],
                    time: selectedTime,
                    type: selectedDomaine,
                    appointmentType: appointmentType,
                    notes: document.getElementById('notes')?.value || '',
                    payment_intent_id: paymentIntent.id
                })
            });

            if (!appointmentResponse.ok) {
                throw new Error('Erreur lors de la création du rendez-vous');
            }

            // Redirection avec message de succès
            window.location.href = 'profile.html?success=true';

        } catch (error) {
            errorElement.textContent = error.message || 'Une erreur est survenue, veuillez réessayer.';
            submitButton.disabled = false;
            submitButton.textContent = 'Confirmer et payer';
        }
    }

    // Ajouter le gestionnaire d'événements pour le formulaire
    document.querySelector('form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateStep(3)) {
            submitAppointment();
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
                updateTimeSlots(selectedDate);
            }
            
            // Mise à jour du résumé
            updateSummary();
        });
    });

    function updateTimeSlots(selectedDate) {
        const timeSlotContainer = document.querySelector('.time-slots');
        timeSlotContainer.innerHTML = '';
        
        const date = new Date(selectedDate);
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

        if (appointmentType === 'night') {
            // Horaires de nuit (20h-6h) tous les jours sauf dimanche
            // Créneaux du soir
            for (let hour = 20; hour <= 23; hour++) {
                addTimeSlot(hour, slotsGrid);
            }
            // Créneaux du matin
            for (let hour = 0; hour <= 6; hour++) {
                addTimeSlot(hour, slotsGrid);
            }
        } else {
            // Horaires de jour
            const startHour = 10;
            const endHour = dayOfWeek === 6 ? 16 : 18; // 16h le samedi, 18h en semaine

            for (let hour = startHour; hour <= endHour; hour++) {
                addTimeSlot(hour, slotsGrid);
            }
        }
    }

    function addTimeSlot(hour, container) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        const formattedHour = hour.toString().padStart(2, '0');
        timeSlot.textContent = `${formattedHour}:00`;
        timeSlot.dataset.time = `${formattedHour}:00`;
        
        // Vérifie si le créneau est déjà sélectionné
        if (selectedTime === `${formattedHour}:00`) {
            timeSlot.classList.add('selected');
        }
        
        timeSlot.addEventListener('click', function() {
            document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
            this.classList.add('selected');
            selectedTime = this.dataset.time;
            updateSummary();
        });
        
        container.appendChild(timeSlot);
    }
}); 