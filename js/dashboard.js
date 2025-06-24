document.addEventListener('DOMContentLoaded', function() {
    // Simuler le chargement des données utilisateur
    loadUserData();

    // Gérer la navigation
    handleNavigation();

    // Gérer les notifications
    handleNotifications();

    // Gérer les actions des rendez-vous
    handleAppointmentActions();

    // Gérer les documents
    handleDocuments();

    // Gérer les messages
    handleMessages();
});

// Charger les données utilisateur
function loadUserData() {
    // Simuler une requête API
    setTimeout(() => {
        document.getElementById('userName').textContent = 'Jean Dupont';
        document.getElementById('userEmail').textContent = 'jean.dupont@email.com';
    }, 1000);
}

// Gérer la navigation
function handleNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Retirer la classe active de tous les liens
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Ajouter la classe active au lien cliqué
            link.classList.add('active');
            
            // Simuler le chargement de la section
            const section = link.getAttribute('href').slice(1);
            console.log(`Navigation vers ${section}`);
        });
    });
}

// Gérer les notifications
function handleNotifications() {
    const notificationBtn = document.querySelector('.notification-btn');
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            // Simuler l'ouverture d'un panneau de notifications
            alert('Panneau de notifications à implémenter');
        });
    }
}

// Gérer les actions des rendez-vous
function handleAppointmentActions() {
    // Gérer le bouton "Nouveau rendez-vous"
    const newAppointmentBtn = document.querySelector('.header-actions .btn-primary');
    if (newAppointmentBtn) {
        newAppointmentBtn.addEventListener('click', () => {
            window.location.href = 'rendez-vous.html';
        });
    }

    // Gérer les boutons Modifier/Annuler
    const modifyBtn = document.querySelector('.appointment-actions .btn-secondary');
    const cancelBtn = document.querySelector('.appointment-actions .btn-danger');

    if (modifyBtn) {
        modifyBtn.addEventListener('click', () => {
            // Simuler la modification d'un rendez-vous
            if (confirm('Voulez-vous modifier ce rendez-vous ?')) {
                window.location.href = 'rendez-vous.html?mode=edit&id=123';
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            // Simuler l'annulation d'un rendez-vous
            if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
                alert('Rendez-vous annulé');
                // Actualiser l'interface
                cancelBtn.closest('.next-appointment').style.opacity = '0.5';
            }
        });
    }
}

// Gérer les documents
function handleDocuments() {
    const downloadButtons = document.querySelectorAll('.document-item .btn-icon');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const documentName = e.target.closest('.document-item')
                .querySelector('.document-name').textContent;
            
            // Simuler le téléchargement
            alert(`Téléchargement de "${documentName}" en cours...`);
        });
    });
}

// Gérer les messages
function handleMessages() {
    const messageItems = document.querySelectorAll('.message-item');
    
    messageItems.forEach(item => {
        item.addEventListener('click', () => {
            // Marquer comme lu si non lu
            if (item.classList.contains('unread')) {
                item.classList.remove('unread');
                
                // Mettre à jour le compteur de messages
                const badge = document.querySelector('.sidebar-nav .badge');
                const currentCount = parseInt(badge.textContent);
                badge.textContent = currentCount - 1;
                
                if (currentCount - 1 === 0) {
                    badge.style.display = 'none';
                }
            }
            
            // Simuler l'ouverture du message
            const sender = item.querySelector('.message-sender').textContent;
            const preview = item.querySelector('.message-preview').textContent;
            alert(`Message de ${sender}:\n${preview}`);
        });
    });
}

// Fonction utilitaire pour formater les dates
function formatDate(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(date).toLocaleDateString('fr-FR', options);
}

// Fonction utilitaire pour formater les heures
function formatTime(time) {
    return time.replace(/:00$/, 'h');
}

// Gérer le responsive
function handleResponsive() {
    const sidebar = document.querySelector('.sidebar');
    const menuButton = document.createElement('button');
    menuButton.className = 'menu-toggle';
    menuButton.innerHTML = '<i class="fas fa-bars"></i>';
    
    document.querySelector('.content-header').prepend(menuButton);
    
    menuButton.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });
    
    // Fermer le menu sur clic en dehors
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('show') && 
            !sidebar.contains(e.target) && 
            !menuButton.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });
} 