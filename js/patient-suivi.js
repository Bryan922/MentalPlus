document.addEventListener('DOMContentLoaded', () => {
    loadPatientData();
    loadConsultations();
    loadNotes();
    loadDocuments();
    initializeNoteForm();
});

// Chargement des données du patient
function loadPatientData() {
    // Simulation de chargement des données
    const patientData = {
        name: "Jean Dupont",
        id: "12345",
        status: "active",
        birthDate: "01/01/1990",
        phone: "06 12 34 56 78",
        email: "jean.dupont@email.com",
        address: "123 Rue Example, 75000 Paris"
    };

    document.getElementById('patientName').textContent = patientData.name;
    document.getElementById('patientId').textContent = `ID: #${patientData.id}`;
    document.getElementById('birthDate').textContent = patientData.birthDate;
    document.getElementById('phone').textContent = patientData.phone;
    document.getElementById('email').textContent = patientData.email;
    document.getElementById('address').textContent = patientData.address;
}

// Chargement de l'historique des consultations
function loadConsultations() {
    const consultations = [
        {
            date: "2024-01-15",
            type: "Consultation initiale",
            duration: "1h",
            notes: "Première consultation - Évaluation générale"
        },
        // Autres consultations...
    ];

    const timeline = document.querySelector('.consultation-timeline');
    timeline.innerHTML = consultations.map(consultation => `
        <div class="consultation-card">
            <div class="consultation-header">
                <span class="consultation-date">${formatDate(consultation.date)}</span>
                <span class="consultation-type">${consultation.type}</span>
            </div>
            <div class="consultation-details">
                <span class="consultation-duration">${consultation.duration}</span>
                <p class="consultation-notes">${consultation.notes}</p>
            </div>
        </div>
    `).join('');
}

// Chargement des notes de suivi
function loadNotes() {
    const notes = [
        {
            type: "consultation",
            date: "2024-01-15",
            content: "Le patient montre des signes d'amélioration..."
        },
        // Autres notes...
    ];

    const notesContainer = document.querySelector('.notes-container');
    notesContainer.innerHTML = notes.map(note => `
        <div class="note-card">
            <div class="note-header">
                <span class="note-type">${formatNoteType(note.type)}</span>
                <span class="note-date">${formatDate(note.date)}</span>
            </div>
            <div class="note-content">${note.content}</div>
        </div>
    `).join('');
}

// Chargement des documents
function loadDocuments() {
    const documents = [
        {
            name: "Bilan initial",
            type: "pdf",
            date: "2024-01-15"
        },
        // Autres documents...
    ];

    const documentsGrid = document.querySelector('.documents-grid');
    documentsGrid.innerHTML = documents.map(doc => `
        <div class="document-card" onclick="viewDocument('${doc.name}')">
            <i class="document-icon">${getDocumentIcon(doc.type)}</i>
            <div class="document-info">
                <div class="document-name">${doc.name}</div>
                <div class="document-date">${formatDate(doc.date)}</div>
            </div>
        </div>
    `).join('');
}

// Gestion du formulaire de notes
function initializeNoteForm() {
    const noteForm = document.getElementById('noteForm');
    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(noteForm);
        saveNote({
            type: formData.get('noteType'),
            content: formData.get('noteContent'),
            date: new Date().toISOString()
        });
        closeNoteModal();
        loadNotes(); // Recharger les notes
    });
}

// Fonctions utilitaires
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatNoteType(type) {
    const types = {
        consultation: "Note de consultation",
        evolution: "Évolution",
        traitement: "Traitement",
        autre: "Autre"
    };
    return types[type] || type;
}

function getDocumentIcon(type) {
    const icons = {
        pdf: "📄",
        image: "🖼️",
        doc: "📝"
    };
    return icons[type] || "📄";
}

// Gestion des modales
function addNote() {
    const modal = document.getElementById('noteModal');
    modal.style.display = 'block';
}

function closeNoteModal() {
    const modal = document.getElementById('noteModal');
    modal.style.display = 'none';
    document.getElementById('noteForm').reset();
}

function saveNote(note) {
    // Simulation de sauvegarde
    console.log('Note sauvegardée:', note);
    // Ici, vous ajouteriez la logique pour sauvegarder dans votre backend
}

function exportPatientFile() {
    // Simulation d'export
    console.log('Export du dossier patient...');
    alert('Le dossier patient a été exporté avec succès.');
}

function viewDocument(documentName) {
    // Simulation d'ouverture de document
    console.log('Ouverture du document:', documentName);
    alert(`Ouverture du document: ${documentName}`);
}

// Fermeture de la modale si on clique en dehors
window.onclick = function(event) {
    const modal = document.getElementById('noteModal');
    if (event.target === modal) {
        closeNoteModal();
    }
}; 