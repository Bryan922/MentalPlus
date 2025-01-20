// Gestion des onglets de rendez-vous
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Mise à jour des boutons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Affichage de la table correspondante
        const tabType = button.dataset.tab;
        document.getElementById('regularAppointments').style.display = tabType === 'regular' ? 'table' : 'none';
        document.getElementById('nightAppointments').style.display = tabType === 'night' ? 'table' : 'none';

        // Chargement des données appropriées
        if (tabType === 'night') {
            loadNightAppointments();
        } else {
            loadRegularAppointments();
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