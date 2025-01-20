document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let selectedDomaine = null;
    let selectedDate = null;
    let selectedTime = null;
    let currentMonth = new Date();

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
            
            // Désactive les jours passés et le dimanche
            if (date < new Date().setHours(0,0,0,0) || date.getDay() === 0) {
                dayElement.classList.add('disabled');
            } else {
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

    // Fonction pour envoyer le rendez-vous à l'API
    async function submitAppointment() {
        const appointmentData = {
            date: selectedDate.toISOString().split('T')[0],
            time: selectedTime,
            type: selectedDomaine,
            notes: document.getElementById('appointment-notes')?.value || ''
        };

        try {
            const response = await fetch('/api/appointments.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(appointmentData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la création du rendez-vous');
            }

            // Afficher un message de succès
            alert('Rendez-vous créé avec succès !');
            // Rediriger vers la page de profil
            window.location.href = 'profile.html';

        } catch (error) {
            console.error('Erreur:', error);
            alert(error.message);
        }
    }

    // Ajouter le gestionnaire d'événements pour le formulaire
    document.querySelector('form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateStep(3)) {
            submitAppointment();
        }
    });
}); 