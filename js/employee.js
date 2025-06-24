document.addEventListener('DOMContentLoaded', function() {
    // Configuration des horaires
    const CONFIG = {
        startHour: 10, // Début à 10h
        endHour: 18,   // Fin à 18h
        slotDuration: 60, // Durée d'un RDV en minutes
        breakDuration: 30, // Pause entre les RDV en minutes
        excludedDays: [0, 6] // Dimanche (0) et Samedi (6)
    };
    
    // Initialiser la date courante
    let currentDate = new Date();
    
    // Initialiser l'interface
    updateDateDisplay();
    initializeTimeSlots();
    loadAppointments();
    initializeEventListeners();
    handleNotes();

    // Initialiser les créneaux horaires
    function initializeTimeSlots() {
        const sidebarSlots = document.querySelector('.time-slots');
        sidebarSlots.innerHTML = '';

        for (let hour = CONFIG.startHour; hour < CONFIG.endHour; hour++) {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'time-slot';
            slotDiv.textContent = `${hour.toString().padStart(2, '0')}:00`;
            sidebarSlots.appendChild(slotDiv);
        }
    }

    // Gérer la navigation dans le calendrier
    function handleCalendarNavigation() {
        const prevButton = document.getElementById('prevDay');
        const nextButton = document.getElementById('nextDay');

        prevButton.addEventListener('click', () => {
            currentDate.setDate(currentDate.getDate() - 1);
            updateDateDisplay();
            loadAppointments();
        });

        nextButton.addEventListener('click', () => {
            currentDate.setDate(currentDate.getDate() + 1);
            updateDateDisplay();
            loadAppointments();
        });
    }

    // Mettre à jour l'affichage de la date
    function updateDateDisplay() {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        document.getElementById('currentDate').textContent = 
            currentDate.toLocaleDateString('fr-FR', options);
    }

    // Vérifier si un créneau est disponible
    function isSlotAvailable(time, appointments) {
        // Convertir l'heure en minutes depuis le début de la journée
        const [hours, minutes] = time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;

        // Vérifier si l'heure est dans les horaires d'ouverture
        if (hours < CONFIG.startHour || hours >= CONFIG.endHour) {
            return false;
        }

        // Vérifier les conflits avec les autres RDV et les pauses
        return !appointments.some(appointment => {
            const [appHours, appMinutes] = appointment.time.split(':').map(Number);
            const appTimeInMinutes = appHours * 60 + appMinutes;
            
            // Vérifier si le créneau chevauche un RDV existant ou sa pause
            return (timeInMinutes >= appTimeInMinutes && 
                    timeInMinutes < appTimeInMinutes + CONFIG.slotDuration + CONFIG.breakDuration) ||
                   (timeInMinutes + CONFIG.slotDuration + CONFIG.breakDuration > appTimeInMinutes && 
                    timeInMinutes <= appTimeInMinutes);
        });
    }

    // Charger les rendez-vous (simulation)
    function loadAppointments() {
        // Ici, vous feriez normalement une requête API
        // Pour l'exemple, nous utilisons des données statiques
        const appointments = [
            {
                id: 1,
                time: '10:00',
                duration: CONFIG.slotDuration,
                patientName: 'Jean Dupont',
                type: 'Consultation standard',
                status: 'confirmed'
            },
            {
                id: 2,
                time: '14:00',
                duration: CONFIG.slotDuration,
                patientName: 'Marie Martin',
                type: 'Consultation urgente',
                status: 'pending'
            }
        ];

        renderAppointments(appointments);
    }

    // Afficher les rendez-vous dans le planning
    function renderAppointments(appointments) {
        const container = document.querySelector('.schedule-content');
        container.innerHTML = '';

        appointments.forEach(appointment => {
            const [hours, minutes] = appointment.time.split(':').map(Number);
            const top = (hours - CONFIG.startHour) * (60 + CONFIG.breakDuration) + minutes;
            const height = appointment.duration;

            const appointmentEl = document.createElement('div');
            appointmentEl.className = `appointment ${appointment.status === 'pending' ? 'urgent' : 'booked'}`;
            appointmentEl.style.top = `${top}px`;
            appointmentEl.style.height = `${height}px`;

            appointmentEl.innerHTML = `
                <div class="appointment-header">
                    <span class="time">${appointment.time} - ${getEndTime(appointment.time, appointment.duration)}</span>
                    <div class="appointment-actions">
                        <button class="btn-icon" data-id="${appointment.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" data-id="${appointment.id}"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <h3 class="patient-name">${appointment.patientName}</h3>
                <p class="appointment-type">${appointment.type}</p>
                <div class="appointment-status ${appointment.status}">${
                    appointment.status === 'confirmed' ? 'Confirmé' : 'En attente'
                }</div>
            `;

            // Ajouter un indicateur de pause
            const breakEl = document.createElement('div');
            breakEl.className = 'break-indicator';
            breakEl.innerHTML = `<span>Pause ${CONFIG.breakDuration} min</span>`;
            breakEl.style.top = `${top + height}px`;
            
            container.appendChild(appointmentEl);
            container.appendChild(breakEl);
        });
    }

    // Calculer l'heure de fin
    function getEndTime(startTime, duration) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const endMinutes = hours * 60 + minutes + duration;
        const endHours = Math.floor(endMinutes / 60);
        const remainingMinutes = endMinutes % 60;
        return `${endHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
    }

    // Initialiser les écouteurs d'événements
    function initializeEventListeners() {
        handleCalendarNavigation();
        handleAppointmentActions();
        handleNewAppointment();
        handleFilters();
        handleNotifications();
    }

    // Gérer les actions sur les rendez-vous
    function handleAppointmentActions() {
        document.querySelector('.schedule-content').addEventListener('click', (e) => {
            const button = e.target.closest('.btn-icon');
            if (!button) return;

            const appointmentId = button.dataset.id;
            const isEdit = button.querySelector('.fa-edit');

            if (isEdit) {
                editAppointment(appointmentId);
            } else {
                cancelAppointment(appointmentId);
            }
        });
    }

    // Éditer un rendez-vous
    function editAppointment(id) {
        // Simuler l'ouverture d'un formulaire d'édition
        alert(`Édition du rendez-vous #${id}`);
    }

    // Annuler un rendez-vous
    function cancelAppointment(id) {
        if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
            // Simuler l'annulation
            alert(`Rendez-vous #${id} annulé`);
            loadAppointments(); // Recharger le planning
        }
    }

    // Gérer le nouveau rendez-vous
    function handleNewAppointment() {
        const newAppointmentBtn = document.querySelector('.btn-primary');
        
        newAppointmentBtn.addEventListener('click', () => {
            openNewAppointmentForm();
        });
    }

    // Ouvrir le formulaire de nouveau rendez-vous
    function openNewAppointmentForm() {
        // Récupérer les créneaux disponibles
        const availableSlots = getAvailableSlots();
        alert('Création d'un nouveau rendez-vous\nCréneaux disponibles : ' + 
              availableSlots.map(slot => slot.time).join(', '));
    }

    // Obtenir les créneaux disponibles
    function getAvailableSlots() {
        const slots = [];
        const appointments = []; // À remplacer par les vrais RDV

        for (let hour = CONFIG.startHour; hour < CONFIG.endHour; hour++) {
            const time = `${hour.toString().padStart(2, '0')}:00`;
            if (isSlotAvailable(time, appointments)) {
                slots.push({ time, duration: CONFIG.slotDuration });
            }
        }

        return slots;
    }

    // Gérer les filtres
    function handleFilters() {
        const filterBtn = document.querySelector('.btn-secondary');
        filterBtn.addEventListener('click', () => {
            // Simuler l'ouverture des filtres
            alert('Filtres du planning');
        });
    }

    // Gérer les notifications
    function handleNotifications() {
        const notificationBtn = document.querySelector('.notification-btn');
        notificationBtn.addEventListener('click', () => {
            // Simuler l'ouverture du panneau de notifications
            alert('Notifications');
        });
    }

    // Gérer les notes rapides
    function handleNotes() {
        const textarea = document.querySelector('.notes-container textarea');
        const notesList = document.querySelector('.notes-list');

        textarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const noteText = textarea.value.trim();
                
                if (noteText) {
                    addNote(noteText);
                    textarea.value = '';
                }
            }
        });

        function addNote(text) {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.innerHTML = `
                <p>${text}</p>
                <span class="note-time">À l'instant</span>
            `;
            
            notesList.insertBefore(noteElement, notesList.firstChild);
        }
    }
}); 