document.addEventListener('DOMContentLoaded', function() {
    initializePeriodSelector();
    initializeCharts();
    initializeExport();
});

// Gérer le sélecteur de période
function initializePeriodSelector() {
    const buttons = document.querySelectorAll('.period-selector button');
    
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            updateCharts(button.textContent.toLowerCase());
        });
    });
}

// Initialiser les graphiques
function initializeCharts() {
    // Configuration commune
    Chart.defaults.font.family = 'inherit';
    Chart.defaults.color = '#666';
    
    // Graphique des consultations par jour
    const consultationsCtx = document.getElementById('consultationsChart').getContext('2d');
    new Chart(consultationsCtx, {
        type: 'line',
        data: {
            labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
            datasets: [{
                label: 'Consultations',
                data: [8, 6, 7, 8, 6, 4, 0],
                borderColor: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    // Graphique des types de consultation
    const typesCtx = document.getElementById('consultationTypesChart').getContext('2d');
    new Chart(typesCtx, {
        type: 'doughnut',
        data: {
            labels: ['Jour', 'Nuit', 'Urgence'],
            datasets: [{
                data: [70, 25, 5],
                backgroundColor: ['#1976d2', '#3f51b5', '#f44336']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Graphique des revenus
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    new Chart(revenueCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
            datasets: [{
                label: 'Revenus (€)',
                data: [8200, 7800, 8500, 8900, 9360, 0],
                backgroundColor: '#2e7d32'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => value + '€'
                    }
                }
            }
        }
    });

    // Graphique du taux d'occupation
    const occupancyCtx = document.getElementById('occupancyChart').getContext('2d');
    new Chart(occupancyCtx, {
        type: 'line',
        data: {
            labels: ['8h', '10h', '12h', '14h', '16h', '18h', '20h'],
            datasets: [{
                label: 'Cette semaine',
                data: [0, 85, 90, 95, 85, 80, 70],
                borderColor: '#1976d2',
                tension: 0.4
            }, {
                label: 'Semaine dernière',
                data: [0, 80, 85, 90, 80, 75, 65],
                borderColor: '#ccc',
                borderDash: [5, 5],
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: value => value + '%'
                    }
                }
            }
        }
    });
}

// Mettre à jour les graphiques
function updateCharts(period) {
    // Simuler le chargement des données
    // En production, cela ferait une requête API
    console.log(`Mise à jour des graphiques pour la période : ${period}`);
}

// Gérer l'export et l'impression
function initializeExport() {
    // Export
    document.querySelector('.header-right .btn-secondary').addEventListener('click', () => {
        const data = {
            period: document.querySelector('.period-selector button.active').textContent,
            stats: {
                patients: 42,
                consultations: 156,
                hours: 182,
                revenue: 9360
            }
        };

        // Créer et télécharger le fichier
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statistiques_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Impression
    document.querySelector('.header-right .btn-primary').addEventListener('click', () => {
        window.print();
    });

    // Export des graphiques individuels
    document.querySelectorAll('.chart-actions .fa-download').forEach(icon => {
        icon.parentElement.addEventListener('click', () => {
            const canvas = icon.closest('.chart-card').querySelector('canvas');
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `graphique_${new Date().toISOString().split('T')[0]}.png`;
            a.click();
        });
    });
}

// Formater les nombres
function formatNumber(number) {
    return new Intl.NumberFormat('fr-FR').format(number);
}

// Formater les dates
function formatDate(date) {
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
} 