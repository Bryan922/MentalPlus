document.addEventListener('DOMContentLoaded', function() {
    let currentDate = new Date();
    let selectedDate = null;
    let selectedTimeSlot = null;

    // Éléments du DOM
    const calendar = document.getElementById('calendar');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const timeSlotsContainer = document.getElementById('timeSlots');
    const selectedDateElement = document.getElementById('selectedDate');
    const selectedTimeElement = document.getElementById('selectedTime');
    const confirmButton = document.getElementById('confirmBooking');

    // Configuration
    const timeSlots = [
        '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
    ];

    // Initialisation
    renderCalendar(currentDate);
    renderTimeSlots();

    // Gestionnaires d'événements
    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    confirmButton.addEventListener('click', () => {
        if (selectedDate && selectedTimeSlot) {
            // Redirection vers la page de paiement
            window.location.href = `payment.html?date=${selectedDate.toISOString()}&time=${selectedTimeSlot}`;
        }
    });

    // Fonctions
    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // Mise à jour du titre du mois
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        currentMonthElement.textContent = `${monthNames[month]} ${year}`;

        // Vider le calendrier
        calendar.innerHTML = '';

        // Ajouter les noms des jours
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        dayNames.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'day-name';
            dayElement.textContent = day;
            calendar.appendChild(dayElement);
        });

        // Obtenir le premier jour du mois
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Ajouter les jours vides du début
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day';
            calendar.appendChild(emptyDay);
        }

        // Ajouter les jours du mois
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = day;

            const currentDayDate = new Date(year, month, day);
            
            // Désactiver les jours passés et les dimanches/lundis
            if (currentDayDate < new Date().setHours(0,0,0,0) || 
                currentDayDate.getDay() === 0 || 
                currentDayDate.getDay() === 1) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => selectDate(currentDayDate, dayElement));
            }

            if (selectedDate && 
                currentDayDate.getDate() === selectedDate.getDate() &&
                currentDayDate.getMonth() === selectedDate.getMonth() &&
                currentDayDate.getFullYear() === selectedDate.getFullYear()) {
                dayElement.classList.add('selected');
            }

            calendar.appendChild(dayElement);
        }
    }

    function renderTimeSlots() {
        timeSlotsContainer.innerHTML = '';
        
        timeSlots.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;

            if (selectedDate) {
                // Simuler des créneaux déjà réservés aléatoirement
                const isBooked = Math.random() < 0.3;
                if (isBooked) {
                    slot.classList.add('disabled');
                } else {
                    slot.addEventListener('click', () => selectTimeSlot(time, slot));
                }

                if (selectedTimeSlot === time) {
                    slot.classList.add('selected');
                }
            } else {
                slot.classList.add('disabled');
            }

            timeSlotsContainer.appendChild(slot);
        });
    }

    function selectDate(date, element) {
        // Désélectionner la date précédente
        const previousSelected = calendar.querySelector('.day.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }

        // Sélectionner la nouvelle date
        selectedDate = date;
        element.classList.add('selected');
        
        // Mettre à jour l'affichage
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        selectedDateElement.textContent = date.toLocaleDateString('fr-FR', options);
        
        // Réinitialiser le créneau horaire
        selectedTimeSlot = null;
        selectedTimeElement.textContent = 'Non sélectionnée';
        confirmButton.disabled = true;

        // Mettre à jour les créneaux disponibles
        renderTimeSlots();
    }

    function selectTimeSlot(time, element) {
        // Désélectionner le créneau précédent
        const previousSelected = timeSlotsContainer.querySelector('.time-slot.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }

        // Sélectionner le nouveau créneau
        selectedTimeSlot = time;
        element.classList.add('selected');
        
        // Mettre à jour l'affichage
        selectedTimeElement.textContent = time;
        confirmButton.disabled = false;
    }
}); 