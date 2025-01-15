document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    initializeNavigation();
    loadUserData();
    initializeImageUpload();
    initializeForms();
    loadAppointments();
    loadDocuments();
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

// Navigation entre les sections
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.profile-nav a');
    const sections = document.querySelectorAll('.profile-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            // Mise à jour des classes actives
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            link.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// Chargement des données utilisateur
function loadUserData() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    // Mise à jour des informations affichées
    document.getElementById('user-name').textContent = user.name || 'Utilisateur';
    document.getElementById('user-email').textContent = user.email || '';

    // Pré-remplissage du formulaire
    const form = document.getElementById('personal-info-form');
    if (form) {
        if (user.name) {
            const [firstname, name] = user.name.split(' ');
            form.querySelector('#name').value = name || '';
            form.querySelector('#firstname').value = firstname || '';
        }
        form.querySelector('#email').value = user.email || '';
        form.querySelector('#phone').value = user.phone || '';
        form.querySelector('#address').value = user.address || '';
    }
}

// Gestion de l'upload d'image
function initializeImageUpload() {
    const editButton = document.querySelector('.edit-avatar');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    editButton.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('profile-image').src = e.target.result;
                // Ici, vous pourriez envoyer l'image à votre serveur
            };
            reader.readAsDataURL(file);
        }
    });
}

// Gestion des formulaires
function initializeForms() {
    // Formulaire d'informations personnelles
    const personalInfoForm = document.getElementById('personal-info-form');
    personalInfoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: `${formData.get('firstname')} ${formData.get('name')}`,
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address')
        };
        
        // Mise à jour du localStorage
        const user = JSON.parse(localStorage.getItem('user')) || {};
        localStorage.setItem('user', JSON.stringify({...user, ...data}));
        
        alert('Informations mises à jour avec succès !');
    });

    // Formulaire de sécurité
    const securityForm = document.getElementById('security-form');
    securityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const currentPassword = formData.get('current-password');
        const newPassword = formData.get('new-password');
        const confirmPassword = formData.get('confirm-password');

        if (newPassword !== confirmPassword) {
            alert('Les mots de passe ne correspondent pas.');
            return;
        }

        // Simulation de changement de mot de passe
        alert('Mot de passe modifié avec succès !');
        e.target.reset();
    });
}

// Chargement des rendez-vous
function loadAppointments() {
    const appointmentsList = document.querySelector('.appointments-list');
    const filterButtons = document.querySelectorAll('.appointments-filter button');
    
    // Exemple de données de rendez-vous
    const appointments = [
        {
            date: '2024-01-20',
            time: '14:00',
            type: 'Consultation standard',
            status: 'upcoming'
        },
        {
            date: '2024-01-15',
            time: '10:00',
            type: 'Suivi',
            status: 'past'
        }
    ];

    function renderAppointments(status = 'upcoming') {
        const filteredAppointments = appointments.filter(apt => apt.status === status);
        appointmentsList.innerHTML = filteredAppointments.map(apt => `
            <div class="appointment-card">
                <div class="appointment-info">
                    <h3>${apt.type}</h3>
                    <p>Date: ${formatDate(apt.date)}</p>
                    <p>Heure: ${apt.time}</p>
                </div>
                ${status === 'upcoming' ? `
                    <div class="appointment-actions">
                        <button class="btn-secondary" onclick="rescheduleAppointment('${apt.date}')">Reprogrammer</button>
                        <button class="btn-danger" onclick="cancelAppointment('${apt.date}')">Annuler</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderAppointments(button.dataset.filter);
        });
    });

    // Affichage initial des rendez-vous à venir
    renderAppointments('upcoming');
}

// Chargement des documents
function loadDocuments() {
    const documentsGrid = document.querySelector('.documents-grid');
    
    // Exemple de documents
    const documents = [
        {
            name: 'Compte-rendu consultation',
            date: '2024-01-15',
            type: 'pdf'
        },
        {
            name: 'Facture',
            date: '2024-01-15',
            type: 'pdf'
        }
    ];

    documentsGrid.innerHTML = documents.map(doc => `
        <div class="document-card">
            <div class="document-icon">
                <i class="fas fa-file-${doc.type}"></i>
            </div>
            <div class="document-info">
                <h4>${doc.name}</h4>
                <p>${formatDate(doc.date)}</p>
            </div>
            <button class="btn-download" onclick="downloadDocument('${doc.name}')">
                <i class="fas fa-download"></i>
            </button>
        </div>
    `).join('');
}

// Utilitaires
function formatDate(dateStr) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('fr-FR', options);
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