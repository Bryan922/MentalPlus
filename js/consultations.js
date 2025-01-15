document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
    initializeFilters();
    initializeConsultationCards();
    initializeReportForm();
    initializeBilling();
});

// Gérer la recherche
function initializeSearch() {
    const searchInput = document.querySelector('.search-bar input');
    const consultationCards = document.querySelectorAll('.consultation-card');

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        consultationCards.forEach(card => {
            const patientName = card.querySelector('.patient-info h3').textContent.toLowerCase();
            const consultationType = card.querySelector('.consultation-type').textContent.toLowerCase();
            const shouldShow = patientName.includes(searchTerm) || consultationType.includes(searchTerm);
            card.style.display = shouldShow ? 'block' : 'none';
        });
    });
}

// Gérer les filtres
function initializeFilters() {
    const periodFilter = document.querySelector('.period-filter');
    const typeFilter = document.querySelector('.type-filter');
    const consultationCards = document.querySelectorAll('.consultation-card');

    function applyFilters() {
        const periodValue = periodFilter.value;
        const typeValue = typeFilter.value;

        consultationCards.forEach(card => {
            const date = new Date(card.querySelector('.consultation-date').textContent.split(' - ')[0]);
            const type = card.querySelector('.consultation-type').classList.contains('night') ? 'night' : 'day';
            
            const matchesPeriod = periodValue === 'all' || checkPeriod(date, periodValue);
            const matchesType = typeValue === 'all' || type === typeValue;

            card.style.display = matchesPeriod && matchesType ? 'block' : 'none';
        });
    }

    periodFilter.addEventListener('change', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
}

// Vérifier la période
function checkPeriod(date, period) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    switch (period) {
        case 'today':
            return date >= startOfDay;
        case 'week':
            return date >= startOfWeek;
        case 'month':
            return date >= startOfMonth;
        default:
            return true;
    }
}

// Gérer les cartes de consultation
function initializeConsultationCards() {
    const cards = document.querySelectorAll('.consultation-card');

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Ne pas déclencher si on clique sur un bouton
            if (!e.target.closest('button')) {
                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                loadConsultationDetails(card.dataset.id);
            }
        });
    });
}

// Charger les détails d'une consultation
function loadConsultationDetails(consultationId) {
    // Simuler le chargement des données
    // En production, cela ferait une requête API
    console.log(`Chargement des détails de la consultation #${consultationId}`);
}

// Gérer le formulaire de compte-rendu
function initializeReportForm() {
    const form = document.querySelector('.report-form');
    const saveButton = document.querySelector('.details-actions .btn-primary');

    if (form && saveButton) {
        saveButton.addEventListener('click', () => {
            saveReport(form);
        });

        // Sauvegarde automatique
        let saveTimeout;
        form.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    saveReport(form, true);
                }, 2000);
            });
        });
    }
}

// Sauvegarder le compte-rendu
function saveReport(form, isAutoSave = false) {
    // Simuler la sauvegarde
    // En production, cela ferait une requête API
    console.log('Sauvegarde du compte-rendu...');
    
    if (!isAutoSave) {
        alert('Compte-rendu sauvegardé avec succès');
    }
}

// Gérer la facturation
function initializeBilling() {
    const downloadButton = document.querySelector('.billing-actions .btn-secondary');
    const emailButton = document.querySelector('.billing-actions .btn-primary');

    if (downloadButton) {
        downloadButton.addEventListener('click', () => {
            downloadInvoice();
        });
    }

    if (emailButton) {
        emailButton.addEventListener('click', () => {
            emailInvoice();
        });
    }
}

// Télécharger la facture
function downloadInvoice() {
    // Simuler le téléchargement
    // En production, cela déclencherait le téléchargement d'un PDF
    alert('Téléchargement de la facture...');
}

// Envoyer la facture par email
function emailInvoice() {
    // Simuler l'envoi
    // En production, cela ferait une requête API
    alert('Facture envoyée par email avec succès');
}

// Ouvrir le compte-rendu
function openReport(consultationId) {
    // Simuler l'ouverture
    loadConsultationDetails(consultationId);
    document.querySelector('.consultation-details').scrollIntoView({ behavior: 'smooth' });
}

// Générer une facture
function generateInvoice(consultationId) {
    // Simuler la génération
    alert(`Génération de la facture pour la consultation #${consultationId}`);
}

// Imprimer le compte-rendu
document.querySelector('.details-actions .btn-secondary').addEventListener('click', () => {
    window.print();
}); 