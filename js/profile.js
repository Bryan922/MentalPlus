// Correction : attendre la vérification asynchrone de Supabase avant de rediriger

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.checkAuth === 'function') {
        const isAuth = await window.checkAuth();
        if (!isAuth) {
            window.location.href = 'auth.html';
            return;
        }
    } else {
        // Fallback localStorage (pour compatibilité)
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        if (!isAuthenticated) {
            window.location.href = 'auth.html';
            return;
        }
    }
    initializeNavigation();
    loadUserData();
    initializeImageUpload();
    initializeForms();
    loadAppointments();
    loadDocuments();
    // Initialisation des filtres de rendez-vous
    const filterButtons = document.querySelectorAll('.appointments-filter button');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            loadAppointments(button.dataset.filter);
        });
    });
    // Chargement initial des rendez-vous
    loadAppointments('upcoming');
});

// Supprimer la fonction checkAuth locale (utiliser window.checkAuth)

// Correction navigation profil
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.profile-menu a');
    const sections = document.querySelectorAll('.profile-section > section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            // Mise à jour des classes actives
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            // Affichage/masquage des sections
            sections.forEach(s => {
                if (s.id === targetId) {
                    s.style.display = 'block';
                } else {
                    s.style.display = 'none';
                }
            });
        });
    });
    // Afficher la première section par défaut
    sections.forEach((s, i) => s.style.display = i === 0 ? 'block' : 'none');
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
    const profileImage = document.getElementById('profile-image');
    const editAvatarBtn = document.querySelector('.edit-avatar');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    // Charger l'image sauvegardée si elle existe
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
        profileImage.src = savedImage;
    }

    editAvatarBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profileImage.src = e.target.result;
                // Sauvegarder l'image dans localStorage
                localStorage.setItem('profileImage', e.target.result);
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
function loadAppointments(filter = 'upcoming') {
    const appointmentsList = document.querySelector('.appointments-list');
    let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Filtrer les rendez-vous pour ne montrer que ceux du client connecté
    appointments = appointments.filter(apt => apt.clientEmail === currentUser.email);
    
    appointmentsList.innerHTML = '';

    if (appointments.length === 0) {
        appointmentsList.innerHTML = '<p class="no-appointments">Aucun rendez-vous</p>';
        return;
    }

    appointments
        .filter(apt => apt.status === filter)
        .forEach(appointment => {
            const card = document.createElement('div');
            card.className = 'appointment-card';
            
            const date = new Date(appointment.date);
            const formattedDate = date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            card.innerHTML = `
                <div class="appointment-header">
                    <span class="appointment-type">${appointment.type}</span>
                    <span class="appointment-date">${formattedDate} à ${appointment.time}</span>
                </div>
                ${appointment.status === 'upcoming' ? `
                    <div class="appointment-actions">
                        <button class="btn-reschedule" onclick="rescheduleAppointment(${appointment.id})">
                            <i class="fas fa-calendar-alt"></i> Reprogrammer
                        </button>
                        <button class="btn-cancel" onclick="cancelAppointment(${appointment.id})">
                            <i class="fas fa-times"></i> Annuler
                        </button>
                    </div>
                ` : ''}
            `;
            
            appointmentsList.appendChild(card);
        });
}

// Fonctions pour gérer les actions sur les rendez-vous
function rescheduleAppointment(appointmentId) {
    // Créer le modal de reprogrammation
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Reprogrammer le rendez-vous</h3>
            <form id="reschedule-form">
                <div class="form-group">
                    <label>Nouvelle date</label>
                    <input type="date" name="new-date" required min="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Nouvelle heure</label>
                    <select name="new-time" required>
                        ${generateTimeSlots()}
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="closeModal()">Annuler</button>
                    <button type="submit" class="btn-primary">Confirmer</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Gérer la soumission du formulaire
    document.getElementById('reschedule-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newDate = formData.get('new-date');
        const newTime = formData.get('new-time');

        // Mettre à jour le rendez-vous dans le localStorage
        let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        appointments = appointments.map(apt => {
            if (apt.id === appointmentId) {
                return { ...apt, date: newDate, time: newTime };
            }
            return apt;
        });
        localStorage.setItem('appointments', JSON.stringify(appointments));

        // Fermer le modal et recharger les rendez-vous
        closeModal();
        loadAppointments('upcoming');
    });
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

function generateTimeSlots() {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
        for (let minute of ['00', '30']) {
            const time = `${hour.toString().padStart(2, '0')}:${minute}`;
            slots.push(`<option value="${time}">${time}</option>`);
        }
    }
    return slots.join('');
}

function cancelAppointment(appointmentId) {
    if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
        // Supprimer le rendez-vous du localStorage
        let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        appointments = appointments.filter(apt => apt.id !== appointmentId);
        localStorage.setItem('appointments', JSON.stringify(appointments));

        // Recharger la liste des rendez-vous
        loadAppointments('upcoming');
    }
}

// Chargement des documents
function loadDocuments() {
    const documentsList = document.querySelector('.documents-list');
    if (!documentsList) return;
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
    documentsList.innerHTML = documents.map(doc => `
        <li class="document-item">
            <div class="document-icon">${doc.type.toUpperCase()}</div>
            <div class="document-info">
                <div class="document-name">${doc.name}</div>
                <div class="document-date">Ajouté le ${formatDate(doc.date)}</div>
            </div>
            <div class="document-actions">
                <button class="btn-download" onclick="downloadDocument('${doc.name}')">Télécharger</button>
            </div>
        </li>
    `).join('');
}

// Utilitaires
function formatDate(dateStr) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('fr-FR', options);
}

// Gestion de la déconnexion
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        }
    });
} 

// Correction updateAppointmentStatus (HTML inline -> JS global)
window.updateAppointmentStatus = function(appointmentId, newStatus) {
    // Simulation de mise à jour vers l'API
    let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;
    const statusMessages = {
        'cancelled': 'Rendez-vous annulé',
        'rescheduled': 'Rendez-vous reprogrammé',
        'confirmed': 'Rendez-vous confirmé'
    };
    // Mise à jour locale
    appointment.status = newStatus;
    // Mise à jour de l'affichage
    const card = document.querySelector(`[data-appointment-id="${appointmentId}"]`);
    if (card) {
        const statusBadge = card.querySelector('.appointment-status');
        statusBadge.className = `appointment-status status-${newStatus}`;
        statusBadge.textContent = statusMessages[newStatus];
        // Si le rendez-vous est annulé, on désactive les boutons
        if (newStatus === 'cancelled') {
            const actions = card.querySelector('.appointment-actions');
            if (actions) actions.innerHTML = '<span class="text-muted">Rendez-vous annulé</span>';
        }
    }
    // Notification de l'admin (simulation)
    console.log(`Admin notifié: Rendez-vous ${appointmentId} ${statusMessages[newStatus].toLowerCase()}`);
    // Feedback utilisateur
    alert(statusMessages[newStatus]);
} 