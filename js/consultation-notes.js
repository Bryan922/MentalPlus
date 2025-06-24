document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    initializeForm();
    initializeHistory();
    initializeAutoSave();
    initializePrint();
    loadPatientData();
    loadConsultationHistory();
    initializeCharts();
    initializeReminders();
    initializeDocuments();
    initializeGoals();
    initializeExport();
    initializeDocumentTags();
    initializeGoalReminders();
});

// Vérification de l'authentification
function checkAuth() {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuthenticated) {
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

// Initialisation du formulaire
function initializeForm() {
    const form = document.getElementById('notes-form');
    const saveBtn = document.querySelector('.save-btn');
    
    // Gérer la sauvegarde
    saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveNotes();
    });

    // Validation avant la soumission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveNotes();
    });

    // Ajuster automatiquement la hauteur des textareas
    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });
    });
}

// Initialisation de l'historique
function initializeHistory() {
    const historyItems = document.querySelectorAll('.history-list li');
    
    historyItems.forEach(item => {
        item.addEventListener('click', () => {
            // Retirer la classe active de tous les items
            historyItems.forEach(i => i.classList.remove('active'));
            // Ajouter la classe active à l'item cliqué
            item.classList.add('active');
            // Charger les notes de la consultation sélectionnée
            loadConsultationNotes(item);
        });
    });
}

// Sauvegarde automatique
function initializeAutoSave() {
    let timeout;
    const form = document.getElementById('notes-form');
    
    form.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            saveNotes(true); // true pour sauvegarde silencieuse
        }, 2000);
    });
}

// Initialisation de l'impression
function initializePrint() {
    const printBtn = document.querySelector('.print-btn');
    
    printBtn.addEventListener('click', () => {
        // Préparer le contenu à imprimer
        const printContent = preparePrintContent();
        
        // Créer une fenêtre d'impression
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Imprimer après le chargement du contenu
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
    });
}

// Charger les données du patient
function loadPatientData() {
    // Simuler le chargement des données depuis une API
    const patientData = {
        name: 'Jean Dupont',
        startDate: 'Janvier 2024',
        consultations: 12,
        averageDuration: 55,
        progress: 'Positif'
    };

    // Mettre à jour les statistiques
    document.querySelector('.stat-card:nth-child(1) p').textContent = 
        `${patientData.consultations} séances`;
    document.querySelector('.stat-card:nth-child(2) p').textContent = 
        `${patientData.averageDuration} minutes`;
    document.querySelector('.stat-card:nth-child(3) p').textContent = 
        patientData.progress;
}

// Charger l'historique des consultations
function loadConsultationHistory() {
    // Simuler le chargement depuis une API
    const consultations = [
        { date: '15 Jan 2024', type: 'Consultation standard' },
        { date: '8 Jan 2024', type: 'Première consultation' }
    ];

    // Mettre à jour l'historique si nécessaire
}

// Charger les notes d'une consultation
function loadConsultationNotes(historyItem) {
    const date = historyItem.querySelector('.date').textContent;
    const type = historyItem.querySelector('.type').textContent;

    // Simuler le chargement des notes depuis une API
    const notes = {
        date: date,
        type: type,
        emotionalState: 'stable',
        observations: 'Le patient montre des signes d\'amélioration...',
        progress: 'Progression constante dans la gestion du stress...',
        actionPlan: 'Continuer les exercices de respiration...',
        recommendations: 'Maintenir un journal quotidien...',
        confidentialNotes: 'Notes confidentielles...',
        nextObjectives: 'Travailler sur les techniques de relaxation...'
    };

    // Mettre à jour le formulaire
    document.querySelector('input[value="' + notes.date + '"]').value = notes.date;
    document.querySelector('input[value="' + notes.type + '"]').value = notes.type;
    document.querySelector('select').value = notes.emotionalState;
    document.querySelectorAll('textarea')[0].value = notes.observations;
    document.querySelectorAll('textarea')[1].value = notes.progress;
    document.querySelectorAll('textarea')[2].value = notes.actionPlan;
    document.querySelectorAll('textarea')[3].value = notes.recommendations;
    document.querySelectorAll('textarea')[4].value = notes.confidentialNotes;
    document.querySelectorAll('textarea')[5].value = notes.nextObjectives;

    // Ajuster la hauteur des textareas
    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    });
}

// Sauvegarder les notes
function saveNotes(silent = false) {
    const form = document.getElementById('notes-form');
    const formData = new FormData(form);
    
    // Simuler une sauvegarde API
    setTimeout(() => {
        if (!silent) {
            showNotification('success', 'Notes sauvegardées avec succès !');
        }
    }, 500);
}

// Préparer le contenu pour l'impression
function preparePrintContent() {
    const patient = document.querySelector('.patient-header h2').textContent;
    const date = document.querySelector('input[readonly]').value;
    const type = document.querySelector('input[readonly]:nth-of-type(2)').value;
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Notes de consultation - ${patient}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
                .section { margin-bottom: 20px; }
                .section h3 { color: #666; }
                .content { margin-left: 20px; }
            </style>
        </head>
        <body>
            <h1>Notes de consultation</h1>
            <div class="section">
                <h3>Patient</h3>
                <div class="content">${patient}</div>
            </div>
            <div class="section">
                <h3>Date</h3>
                <div class="content">${date}</div>
            </div>
            <div class="section">
                <h3>Type de consultation</h3>
                <div class="content">${type}</div>
            </div>
            ${Array.from(document.querySelectorAll('.form-group')).map(group => {
                const label = group.querySelector('label').textContent;
                const value = group.querySelector('textarea, select')?.value || '';
                if (label === 'Notes confidentielles') return ''; // Exclure les notes confidentielles
                return `
                    <div class="section">
                        <h3>${label}</h3>
                        <div class="content">${value}</div>
                    </div>
                `;
            }).join('')}
        </body>
        </html>
    `;
}

// Afficher une notification
function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <p>${message}</p>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Gestion de la déconnexion
document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
});

// Initialisation des graphiques
function initializeCharts() {
    // Graphique de progression
    const progressCtx = document.getElementById('progressChart').getContext('2d');
    const progressChart = new Chart(progressCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
            datasets: [{
                label: 'Progression globale',
                data: [3, 4, 5, 6, 7, 8],
                borderColor: '#4CAF50',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10
                }
            }
        }
    });

    // Graphique des états émotionnels
    const emotionalCtx = document.getElementById('emotionalStateChart').getContext('2d');
    const emotionalChart = new Chart(emotionalCtx, {
        type: 'bar',
        data: {
            labels: ['Stable', 'Anxieux', 'Dépressif', 'Agité', 'Calme'],
            datasets: [{
                label: 'Fréquence des états émotionnels',
                data: [8, 4, 2, 3, 6],
                backgroundColor: [
                    '#4CAF50',
                    '#FFC107',
                    '#9C27B0',
                    '#F44336',
                    '#2196F3'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Initialisation des rappels
function initializeReminders() {
    const addReminderBtn = document.querySelector('.add-reminder-btn');
    const modal = document.getElementById('reminderModal');
    const reminderForm = document.getElementById('reminderForm');
    const cancelBtn = modal.querySelector('.cancel-btn');

    // Ouvrir le modal
    addReminderBtn.addEventListener('click', () => {
        modal.classList.add('active');
        reminderForm.reset();
    });

    // Fermer le modal
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Gérer la soumission du formulaire
    reminderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(reminderForm);
        addReminder({
            type: formData.get('reminderType'),
            description: formData.get('description'),
            date: formData.get('date'),
            priority: formData.get('priority')
        });
        modal.classList.remove('active');
    });

    // Initialiser les boutons d'action des rappels existants
    initializeReminderActions();
}

// Ajouter un nouveau rappel
function addReminder(reminder) {
    const list = document.getElementById('remindersList');
    const li = document.createElement('li');
    li.innerHTML = `
        <i class="fas fa-${reminder.type === 'appointment' ? 'bell' : 'tasks'}"></i>
        <span>${reminder.description}</span>
        <div class="reminder-actions">
            <button class="edit-reminder" title="Modifier">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-reminder" title="Supprimer">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    list.appendChild(li);
    initializeReminderActions();
    
    // Programmer une notification
    scheduleNotification(reminder);
}

// Initialiser les actions des rappels
function initializeReminderActions() {
    document.querySelectorAll('.edit-reminder').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            const description = li.querySelector('span').textContent;
            openEditReminderModal(description, li);
        });
    });

    document.querySelectorAll('.delete-reminder').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce rappel ?')) {
                e.target.closest('li').remove();
            }
        });
    });
}

// Ouvrir le modal en mode édition
function openEditReminderModal(description, li) {
    const modal = document.getElementById('reminderModal');
    const form = document.getElementById('reminderForm');
    
    form.querySelector('[name="description"]').value = description;
    modal.classList.add('active');
    
    // Stocker une référence à l'élément en cours d'édition
    modal.dataset.editingId = li.dataset.id;
}

// Programmer une notification
function scheduleNotification(reminder) {
    const now = new Date();
    const reminderDate = new Date(reminder.date);
    
    if (reminderDate > now) {
        const delay = reminderDate - now;
        setTimeout(() => {
            if (Notification.permission === "granted") {
                new Notification("Rappel MentalSerenity", {
                    body: reminder.description,
                    icon: "/images/logo.png"
                });
            }
        }, delay);
    }
}

// Demander la permission pour les notifications
if ("Notification" in window) {
    Notification.requestPermission();
}

// Initialisation des documents
function initializeDocuments() {
    const uploadBtn = document.querySelector('.upload-btn');
    const uploadModal = document.getElementById('uploadModal');
    const uploadForm = document.getElementById('uploadForm');
    const cancelBtn = uploadModal.querySelector('.cancel-btn');

    // Ouvrir le modal
    uploadBtn.addEventListener('click', () => {
        uploadModal.classList.add('active');
    });

    // Fermer le modal
    cancelBtn.addEventListener('click', () => {
        uploadModal.classList.remove('active');
    });

    // Gérer le téléchargement
    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(uploadForm);
        uploadDocument(formData);
        uploadModal.classList.remove('active');
    });

    // Initialiser les actions des documents existants
    initializeDocumentActions();
}

// Télécharger un document
function uploadDocument(formData) {
    // Simuler un téléchargement
    showNotification('success', 'Document téléchargé avec succès');
    
    // Ajouter le document à la liste
    const documentsList = document.querySelector('.documents-list');
    const documentItem = createDocumentElement({
        name: formData.get('documentDescription'),
        type: formData.get('documentType'),
        date: new Date().toLocaleDateString('fr-FR'),
        visibility: formData.get('visibility')
    });
    
    documentsList.appendChild(documentItem);
}

// Créer un élément document
function createDocumentElement(doc) {
    const div = document.createElement('div');
    div.className = 'document-item';
    div.innerHTML = `
        <i class="fas fa-file-${getDocumentIcon(doc.type)}"></i>
        <div class="document-info">
            <span class="document-name">${doc.name}</span>
            <span class="document-date">${doc.date}</span>
        </div>
        <div class="document-actions">
            <button class="view-doc" title="Voir">
                <i class="fas fa-eye"></i>
            </button>
            <button class="download-doc" title="Télécharger">
                <i class="fas fa-download"></i>
            </button>
            <button class="delete-doc" title="Supprimer">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return div;
}

// Obtenir l'icône en fonction du type de document
function getDocumentIcon(type) {
    const icons = {
        'report': 'pdf',
        'assessment': 'chart-bar',
        'exercise': 'tasks',
        'other': 'file'
    };
    return icons[type] || 'file';
}

// Initialiser les actions des documents
function initializeDocumentActions() {
    document.querySelectorAll('.view-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const docName = e.target.closest('.document-item').querySelector('.document-name').textContent;
            // Simuler l'ouverture du document
            showNotification('info', `Ouverture de ${docName}`);
        });
    });

    document.querySelectorAll('.download-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const docName = e.target.closest('.document-item').querySelector('.document-name').textContent;
            // Simuler le téléchargement
            showNotification('success', `Téléchargement de ${docName}`);
        });
    });

    document.querySelectorAll('.delete-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
                e.target.closest('.document-item').remove();
                showNotification('success', 'Document supprimé');
            }
        });
    });
}

// Initialisation des objectifs
function initializeGoals() {
    const addGoalBtn = document.querySelector('.add-goal-btn');
    const goalModal = document.getElementById('goalModal');
    const goalForm = document.getElementById('goalForm');
    const cancelBtn = goalModal.querySelector('.cancel-btn');
    const progressInput = goalForm.querySelector('input[name="progress"]');
    const progressValue = goalForm.querySelector('.progress-value');

    // Mettre à jour la valeur de progression
    progressInput.addEventListener('input', (e) => {
        progressValue.textContent = `${e.target.value}%`;
    });

    // Ouvrir le modal
    addGoalBtn.addEventListener('click', () => {
        goalModal.classList.add('active');
        goalForm.reset();
        progressValue.textContent = '0%';
    });

    // Fermer le modal
    cancelBtn.addEventListener('click', () => {
        goalModal.classList.remove('active');
    });

    // Gérer la soumission du formulaire
    goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(goalForm);
        addGoal({
            title: formData.get('goalTitle'),
            description: formData.get('goalDescription'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            progress: formData.get('progress')
        });
        goalModal.classList.remove('active');
    });

    // Initialiser les actions des objectifs existants
    initializeGoalActions();
}

// Ajouter un nouvel objectif
function addGoal(goal) {
    const goalsList = document.querySelector('.goals-list');
    const goalItem = createGoalElement(goal);
    goalsList.appendChild(goalItem);
    showNotification('success', 'Objectif ajouté avec succès');
}

// Créer un élément objectif
function createGoalElement(goal) {
    const div = document.createElement('div');
    div.className = 'goal-item';
    div.innerHTML = `
        <div class="goal-header">
            <h4>${goal.title}</h4>
            <span class="goal-progress">${goal.progress}%</span>
        </div>
        <div class="progress-bar">
            <div class="progress" style="width: ${goal.progress}%"></div>
        </div>
        <p class="goal-description">${goal.description}</p>
        <div class="goal-details">
            <span class="goal-date">Début: ${formatDate(goal.startDate)}</span>
            <span class="goal-deadline">Objectif: ${formatDate(goal.endDate)}</span>
        </div>
        <div class="goal-actions">
            <button class="edit-goal" title="Modifier">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-goal" title="Supprimer">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return div;
}

// Initialiser les actions des objectifs
function initializeGoalActions() {
    document.querySelectorAll('.edit-goal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const goalItem = e.target.closest('.goal-item');
            openEditGoalModal(goalItem);
        });
    });

    document.querySelectorAll('.delete-goal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
                e.target.closest('.goal-item').remove();
                showNotification('success', 'Objectif supprimé');
            }
        });
    });
}

// Ouvrir le modal en mode édition pour un objectif
function openEditGoalModal(goalItem) {
    const modal = document.getElementById('goalModal');
    const form = document.getElementById('goalForm');
    
    // Remplir le formulaire avec les données existantes
    form.querySelector('[name="goalTitle"]').value = goalItem.querySelector('h4').textContent;
    form.querySelector('[name="goalDescription"]').value = goalItem.querySelector('.goal-description').textContent;
    form.querySelector('[name="progress"]').value = parseInt(goalItem.querySelector('.goal-progress').textContent);
    form.querySelector('.progress-value').textContent = goalItem.querySelector('.goal-progress').textContent;
    
    // Extraire et formater les dates
    const startDate = goalItem.querySelector('.goal-date').textContent.split(': ')[1];
    const endDate = goalItem.querySelector('.goal-deadline').textContent.split(': ')[1];
    form.querySelector('[name="startDate"]').value = formatDateForInput(startDate);
    form.querySelector('[name="endDate"]').value = formatDateForInput(endDate);
    
    modal.classList.add('active');
    modal.dataset.editingId = goalItem.dataset.id;
}

// Formater une date pour l'input date
function formatDateForInput(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Export des données
function initializeExport() {
    const exportBtn = document.createElement('button');
    exportBtn.className = 'export-btn';
    exportBtn.innerHTML = '<i class="fas fa-file-export"></i> Exporter les données';
    document.querySelector('.quick-stats').prepend(exportBtn);

    exportBtn.addEventListener('click', () => {
        const data = {
            patient: loadPatientData(),
            consultations: loadConsultationHistory(),
            documents: getDocumentsData(),
            goals: getGoalsData(),
            statistics: getDetailedStatistics()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patient_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

// Statistiques détaillées
function getDetailedStatistics() {
    return {
        consultationCount: 12,
        averageDuration: 55,
        progressTrend: 'positive',
        emotionalStates: {
            stable: 8,
            anxieux: 4,
            depressif: 2,
            agite: 3,
            calme: 6
        },
        goalsProgress: {
            completed: 3,
            inProgress: 2,
            notStarted: 1
        },
        documentsCount: {
            reports: 5,
            exercises: 3,
            assessments: 2
        }
    };
}

// Système de tags pour les documents
function initializeDocumentTags() {
    const tagInput = document.createElement('input');
    tagInput.type = 'text';
    tagInput.placeholder = 'Ajouter des tags (séparés par des virgules)';
    document.querySelector('#uploadForm .form-group:last-child').before(createTagFormGroup());

    document.querySelectorAll('.document-item').forEach(doc => {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'document-tags';
        doc.querySelector('.document-info').appendChild(tagsContainer);
    });
}

function createTagFormGroup() {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `
        <label>Tags</label>
        <input type="text" name="documentTags" placeholder="Ex: important, suivi, exercice">
        <small>Séparez les tags par des virgules</small>
    `;
    return div;
}

// Rappels automatiques pour les objectifs
function initializeGoalReminders() {
    const reminderToggle = document.createElement('div');
    reminderToggle.className = 'form-group';
    reminderToggle.innerHTML = `
        <label>Rappels automatiques</label>
        <select name="reminderFrequency">
            <option value="none">Aucun rappel</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="biweekly">Bi-hebdomadaire</option>
            <option value="monthly">Mensuel</option>
        </select>
    `;
    document.querySelector('#goalForm .form-actions').before(reminderToggle);

    // Ajouter la gestion des rappels aux objectifs existants
    document.querySelectorAll('.goal-item').forEach(goal => {
        const reminderBtn = document.createElement('button');
        reminderBtn.className = 'reminder-toggle';
        reminderBtn.innerHTML = '<i class="fas fa-bell"></i>';
        goal.querySelector('.goal-actions').prepend(reminderBtn);
    });
} 