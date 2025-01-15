document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
    initializeFilters();
    initializePatientCards();
    initializeDocuments();
    handleNewPatient();
});

// Gérer la recherche de patients
function initializeSearch() {
    const searchInput = document.querySelector('.search-bar input');
    const patientCards = document.querySelectorAll('.patient-card');

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        patientCards.forEach(card => {
            const patientName = card.querySelector('.patient-details h3').textContent.toLowerCase();
            card.style.display = patientName.includes(searchTerm) ? 'flex' : 'none';
        });
    });
}

// Gérer les filtres
function initializeFilters() {
    const filterSelect = document.querySelector('.list-filters select');
    const patientCards = document.querySelectorAll('.patient-card');

    filterSelect.addEventListener('change', (e) => {
        const filterValue = e.target.value.toLowerCase();

        patientCards.forEach(card => {
            if (filterValue === 'tous les patients') {
                card.style.display = 'flex';
            } else {
                const isActive = card.classList.contains('active');
                card.style.display = 
                    (filterValue === 'actifs' && isActive) || 
                    (filterValue === 'inactifs' && !isActive)
                    ? 'flex' : 'none';
            }
        });
    });
}

// Gérer les cartes patients
function initializePatientCards() {
    const patientCards = document.querySelectorAll('.patient-card');

    patientCards.forEach(card => {
        // Gérer le clic sur le dossier
        const folderBtn = card.querySelector('.fa-folder-open').closest('button');
        folderBtn.addEventListener('click', () => {
            // Activer la carte sélectionnée
            patientCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            // Charger les données du patient
            loadPatientFile(card.querySelector('.patient-details h3').textContent);
        });

        // Gérer le clic sur le message
        const messageBtn = card.querySelector('.fa-envelope').closest('button');
        messageBtn.addEventListener('click', () => {
            openMessageDialog(card.querySelector('.patient-details h3').textContent);
        });
    });
}

// Charger les données du patient
function loadPatientFile(patientName) {
    // Simuler le chargement des données
    // En production, cela ferait une requête API
    console.log(`Chargement du dossier de ${patientName}`);
}

// Ouvrir la boîte de dialogue de message
function openMessageDialog(patientName) {
    alert(`Envoyer un message à ${patientName}`);
}

// Gérer les documents
function initializeDocuments() {
    const downloadBtns = document.querySelectorAll('.document-card .btn-icon');

    downloadBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const documentName = btn.closest('.document-card')
                .querySelector('.document-info h4').textContent;
            downloadDocument(documentName);
        });
    });
}

// Simuler le téléchargement d'un document
function downloadDocument(documentName) {
    alert(`Téléchargement de ${documentName}`);
}

// Gérer le nouveau patient
function handleNewPatient() {
    const newPatientBtn = document.querySelector('.btn-primary');
    
    newPatientBtn.addEventListener('click', () => {
        openNewPatientForm();
    });
}

// Ouvrir le formulaire de nouveau patient
function openNewPatientForm() {
    alert('Ouverture du formulaire de nouveau patient');
}

// Gérer l'impression du dossier
document.querySelector('.btn-secondary').addEventListener('click', () => {
    window.print();
});

// Gérer la modification du dossier
document.querySelector('.file-actions .btn-primary').addEventListener('click', () => {
    alert('Modification du dossier patient');
}); 