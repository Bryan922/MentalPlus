document.addEventListener('DOMContentLoaded', function() {
    // Gestion des onglets de rendez-vous
    const tabButtons = document.querySelectorAll('.appointment-tabs .tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Mise à jour des boutons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Mise à jour de l'affichage des tables
            const type = button.dataset.type;
            document.getElementById('regularAppointments').classList.remove('active');
            document.getElementById('nightAppointments').classList.remove('active');
            
            if (type === 'regular') {
                document.getElementById('regularAppointments').classList.add('active');
            } else {
                document.getElementById('nightAppointments').classList.add('active');
            }
        });
    });

    // Fonction pour charger les rendez-vous de nuit
    function loadNightAppointments() {
        // Données de test pour les rendez-vous de nuit
        const nightAppointments = [
            {
                id: 3,
                client: 'Thomas Martin',
                date: '02/03/2024 22:00',
                type: 'Consultation de nuit',
                phone: '+33 6 11 22 33 44',
                email: 'thomas@example.com',
                notes: 'Consultation urgente - Insomnie'
            },
            {
                id: 4,
                client: 'Julie Dubois',
                date: '03/03/2024 23:30',
                type: 'Suivi nocturne',
                phone: '+33 6 55 66 77 88',
                email: 'julie@example.com',
                notes: 'Suivi troubles du sommeil'
            }
        ];

        // Affichage des rendez-vous de nuit
        document.getElementById('upcomingNightAppointments').innerHTML = nightAppointments.map(apt => `
            <tr>
                <td>${apt.client}</td>
                <td>${apt.date}</td>
                <td>${apt.type}</td>
                <td><a href="#" class="btn-action" onclick="showAppointmentDetails(${apt.id})">Gérer</a></td>
            </tr>
        `).join('');
    }

    // Fonction pour charger les rendez-vous classiques
    function loadRegularAppointments() {
        document.getElementById('upcomingAppointments').innerHTML = testData.appointments.map(apt => `
            <tr>
                <td>${apt.client}</td>
                <td>${apt.date}</td>
                <td>${apt.type}</td>
                <td><a href="#" class="btn-action" onclick="showAppointmentDetails(${apt.id})">Gérer</a></td>
            </tr>
        `).join('');
    }

    // Chargement initial des rendez-vous classiques
    loadRegularAppointments();
}); 