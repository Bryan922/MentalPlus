// Configuration
const CONFIG = {
    appointmentStartHour: 8,
    appointmentEndHour: 20,
    slotDuration: 60, // minutes
    breakDuration: 15, // minutes
    excludedDays: [0], // Dimanche
    workingDays: [1, 2, 3, 4, 5, 6] // Lundi à Samedi
};

// État global de l'application
let currentDate = new Date();
let currentSection = 'dashboard';
let clients = [];
let appointments = [];
let currentClient = null;

// Données de démonstration
const demoClients = [
    {
        id: 1,
        firstName: 'Marie',
        lastName: 'Dubois',
        email: 'marie.dubois@email.com',
        phone: '06 12 34 56 78',
        address: '123 Rue de la Paix, 75001 Paris',
        registrationDate: '2024-01-15',
        sessions: [
            { date: '2024-01-20', score: 3, notes: 'Première séance, client anxieux mais motivé.' },
            { date: '2024-01-27', score: 4, notes: 'Amélioration notable, plus détendu.' },
            { date: '2024-02-03', score: 5, notes: 'Excellent progrès, techniques de relaxation maîtrisées.' }
        ],
        averageScore: 4
    },
    {
        id: 2,
        firstName: 'Pierre',
        lastName: 'Martin',
        email: 'pierre.martin@email.com',
        phone: '06 98 76 54 32',
        address: '456 Avenue des Champs, 75008 Paris',
        registrationDate: '2024-02-01',
        sessions: [
            { date: '2024-02-05', score: 2, notes: 'Difficultés importantes, besoin de soutien.' },
            { date: '2024-02-12', score: 3, notes: 'Légère amélioration, continue les exercices.' }
        ],
        averageScore: 2.5
    },
    {
        id: 3,
        firstName: 'Sophie',
        lastName: 'Leroy',
        email: 'sophie.leroy@email.com',
        phone: '06 11 22 33 44',
        address: '789 Boulevard Saint-Germain, 75006 Paris',
        registrationDate: '2024-01-10',
        sessions: [
            { date: '2024-01-15', score: 4, notes: 'Bonne première impression, objectifs clairs.' },
            { date: '2024-01-22', score: 4, notes: 'Progrès constants, très impliquée.' },
            { date: '2024-01-29', score: 5, notes: 'Excellente évolution, confiance retrouvée.' },
            { date: '2024-02-05', score: 5, notes: 'Maintient ses acquis, très positive.' }
        ],
        averageScore: 4.5
    }
];

const demoAppointments = [
    {
        id: 1,
        clientId: 1,
        clientName: 'Marie Dubois',
        date: '2024-02-15',
        time: '09:00',
        type: 'standard',
        status: 'confirmed',
        email: 'marie.dubois@email.com',
        phone: '06 12 34 56 78',
        address: '123 Rue de la Paix, 75001 Paris'
    },
    {
        id: 2,
        clientId: 2,
        clientName: 'Pierre Martin',
        date: '2024-02-15',
        time: '14:00',
        type: 'standard',
        status: 'confirmed',
        email: 'pierre.martin@email.com',
        phone: '06 98 76 54 32',
        address: '456 Avenue des Champs, 75008 Paris'
    },
    {
        id: 3,
        clientId: 3,
        clientName: 'Sophie Leroy',
        date: '2024-02-15',
        time: '16:00',
        type: 'night',
        status: 'pending',
        email: 'sophie.leroy@email.com',
        phone: '06 11 22 33 44',
        address: '789 Boulevard Saint-Germain, 75006 Paris'
    },
    {
        id: 4,
        clientId: 1,
        clientName: 'Marie Dubois',
        date: '2024-02-16',
        time: '10:00',
        type: 'standard',
        status: 'confirmed',
        email: 'marie.dubois@email.com',
        phone: '06 12 34 56 78',
        address: '123 Rue de la Paix, 75001 Paris'
    }
];

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Starting initialization...');
    initializeApp();
});

// Backup initialization si DOMContentLoaded a déjà été déclenché
if (document.readyState === 'loading') {
    // DOMContentLoaded sera déclenché
} else {
    // DOM déjà chargé
    console.log('🚀 DOM already loaded - Starting initialization immediately...');
    initializeApp();
}

// Fonction pour mettre à jour la date actuelle
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const currentDateTimeEl = document.getElementById('currentDateTime');
    if (currentDateTimeEl) {
        currentDateTimeEl.textContent = now.toLocaleDateString('fr-FR', options);
    }
    
    const currentDateEl = document.getElementById('currentDate');
    if (currentDateEl) {
        currentDateEl.textContent = now.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Fonction pour formater une date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
}

// Fonctions pour les actions
function refreshData() {
    updateDashboard();
    showNotification('Données actualisées', 'success');
}

function showNotifications() {
    const notificationsPanel = document.getElementById('notificationsPanel');
    if (!notificationsPanel) {
        createNotificationsPanel();
    } else {
        notificationsPanel.style.display = notificationsPanel.style.display === 'none' ? 'block' : 'none';
    }
    updateNotificationsList();
}

function createNotificationsPanel() {
    const panel = document.createElement('div');
    panel.id = 'notificationsPanel';
    panel.className = 'notifications-panel';
    panel.innerHTML = `
        <div class="notifications-header">
            <h3><i class="fas fa-bell"></i> Notifications</h3>
            <button onclick="closeNotificationsPanel()" class="close-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="notifications-content" id="notificationsContent">
            <!-- Les notifications seront ajoutées ici -->
        </div>
        <div class="notifications-footer">
            <button onclick="markAllAsRead()" class="btn-secondary">Tout marquer comme lu</button>
        </div>
    `;
    document.body.appendChild(panel);
}

function closeNotificationsPanel() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

function markAllAsRead() {
    const notifications = getStoredNotifications();
    notifications.forEach(notif => notif.read = true);
    localStorage.setItem('employeeNotifications', JSON.stringify(notifications));
    updateNotificationsList();
    updateNotificationBadge();
}

function updateNotificationsList() {
    const content = document.getElementById('notificationsContent');
    if (!content) return;
    
    const notifications = getStoredNotifications();
    
    if (notifications.length === 0) {
        content.innerHTML = '<div class="no-notifications">Aucune notification</div>';
        return;
    }
    
    content.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type}">
                <i class="fas fa-${getNotificationIcon(notif.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${formatNotificationTime(notif.timestamp)}</div>
            </div>
            <div class="notification-actions">
                ${notif.actionUrl ? `<button onclick="handleNotificationAction('${notif.actionUrl}', '${notif.id}')" class="btn-action">Voir</button>` : ''}
                <button onclick="deleteNotification('${notif.id}')" class="btn-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function getNotificationIcon(type) {
    const icons = {
        'appointment': 'calendar-alt',
        'message': 'envelope',
        'client': 'user',
        'system': 'cog',
        'reminder': 'clock'
    };
    return icons[type] || 'bell';
}

function formatNotificationTime(timestamp) {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return notifTime.toLocaleDateString('fr-FR');
}

function handleNotificationAction(actionUrl, notificationId) {
    // Marquer comme lu
    markNotificationAsRead(notificationId);
    
    // Exécuter l'action
    if (actionUrl.startsWith('#')) {
        const section = actionUrl.substring(1);
        showSection(section);
    } else if (actionUrl.startsWith('client:')) {
        const clientId = parseInt(actionUrl.split(':')[1]);
        openClientModal(clientId);
    } else if (actionUrl.startsWith('appointment:')) {
        const appointmentId = parseInt(actionUrl.split(':')[1]);
        editAppointment(appointmentId);
    }
    
    closeNotificationsPanel();
}

function deleteNotification(notificationId) {
    let notifications = getStoredNotifications();
    notifications = notifications.filter(notif => notif.id !== notificationId);
    localStorage.setItem('employeeNotifications', JSON.stringify(notifications));
    updateNotificationsList();
    updateNotificationBadge();
}

function markNotificationAsRead(notificationId) {
    const notifications = getStoredNotifications();
    const notification = notifications.find(notif => notif.id === notificationId);
    if (notification) {
        notification.read = true;
        localStorage.setItem('employeeNotifications', JSON.stringify(notifications));
        updateNotificationBadge();
    }
}

function getStoredNotifications() {
    const stored = localStorage.getItem('employeeNotifications');
    return stored ? JSON.parse(stored) : [];
}

function addNotification(title, message, type = 'system', actionUrl = null) {
    const notifications = getStoredNotifications();
    const newNotification = {
        id: Date.now().toString(),
        title,
        message,
        type,
        actionUrl,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(newNotification);
    
    // Garder seulement les 50 dernières notifications
    if (notifications.length > 50) {
        notifications.splice(50);
    }
    
    localStorage.setItem('employeeNotifications', JSON.stringify(notifications));
    updateNotificationBadge();
    
    // Afficher une notification toast
    showNotification(title, type);
}

function updateNotificationBadge() {
    const notifications = getStoredNotifications();
    const unreadCount = notifications.filter(notif => !notif.read).length;
    
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

function showNotification(message, type = 'info') {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function initializeApp() {
    console.log('🚀 Employee dashboard initializing...');
    
    // Attendre un peu pour s'assurer que tous les styles sont appliqués
    setTimeout(function() {
        // Diagnostic des éléments DOM critiques
        runDOMDiagnostic();
        
        // Charger les données de démonstration
        clients = [...demoClients];
        appointments = [...demoAppointments];
        console.log('📊 Demo data loaded - Clients:', clients.length, 'Appointments:', appointments.length);
        
        // Initialiser les événements
        initializeEventListeners();
        
        // Initialiser les notifications
        updateNotificationBadge();
        
        // Ajouter une notification de bienvenue
        addNotification('Bienvenue dans l\'espace employé MentalPlus !', 'info', 'system');
        
        // Afficher le tableau de bord par défaut
        showSection('dashboard');
        
        // Mettre à jour l'affichage
        updateDashboard();
        updateCurrentDate();
        
        // S'assurer que le modal de disclaimer est caché
        const disclaimerModal = document.getElementById('disclaimerModal');
        if (disclaimerModal) {
            disclaimerModal.style.display = 'none';
            disclaimerModal.style.visibility = 'hidden';
            disclaimerModal.style.opacity = '0';
            disclaimerModal.classList.remove('show');
            console.log('🔒 Disclaimer modal forcibly hidden');
        }
        
        console.log('✅ Application initialization complete');
    }, 100);
}

function runDOMDiagnostic() {
    console.log('=== DOM DIAGNOSTIC ===');
    
    const criticalElements = [
        { selector: '.sidebar', name: 'Sidebar' },
        { selector: '.main-content', name: 'Main Content' },
        { selector: '.nav-link', name: 'Navigation Links', multiple: true },
        { selector: '.content-section', name: 'Content Sections', multiple: true },
        { selector: '#dashboard-section', name: 'Dashboard Section' },
        { selector: '#appointments-section', name: 'Appointments Section' },
        { selector: '#clients-section', name: 'Clients Section' },
        { selector: '#refreshDashboard', name: 'Refresh Button' },
        { selector: '.notification-btn', name: 'Notification Button' },
        { selector: '#acceptDisclaimer', name: 'Disclaimer Button' }
    ];
    
    let allElementsFound = true;
    
    criticalElements.forEach(element => {
        if (element.multiple) {
            const elements = document.querySelectorAll(element.selector);
            if (elements.length > 0) {
                console.log(`✓ ${element.name}: ${elements.length} found`);
            } else {
                console.error(`✗ ${element.name}: NOT FOUND`);
                allElementsFound = false;
            }
        } else {
            const el = document.querySelector(element.selector);
            if (el) {
                console.log(`✓ ${element.name}: Found`);
            } else {
                console.error(`✗ ${element.name}: NOT FOUND`);
                allElementsFound = false;
            }
        }
    });
    
    if (allElementsFound) {
        console.log('✓ All critical DOM elements found');
    } else {
        console.error('✗ Some critical DOM elements are missing');
    }
    
    console.log('=== END DIAGNOSTIC ===');
}

function initializeMobileMenu() {
    console.log('🔧 Initialisation du menu mobile...');
    
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileOverlay = document.querySelector('.mobile-overlay');
    const sidebar = document.querySelector('.sidebar');
    const navLinks = document.querySelectorAll('.nav-link');
    
    console.log('📱 Éléments du menu mobile:', {
        mobileToggle: !!mobileToggle,
        mobileOverlay: !!mobileOverlay,
        sidebar: !!sidebar,
        navLinks: navLinks.length
    });
    
    if (!mobileToggle || !mobileOverlay || !sidebar) {
        console.error('❌ Éléments du menu mobile non trouvés!');
        return;
    }
    
    // Toggle mobile menu
    mobileToggle.addEventListener('click', function(e) {
        console.log('📱 Clic sur le bouton mobile menu');
        e.preventDefault();
        e.stopPropagation();
        
        sidebar.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        
        console.log('📱 État après toggle:', {
            sidebarActive: sidebar.classList.contains('active'),
            overlayActive: mobileOverlay.classList.contains('active')
        });
    });
    
    // Close menu when clicking overlay
    mobileOverlay.addEventListener('click', function() {
        console.log('📱 Clic sur overlay - fermeture du menu');
        sidebar.classList.remove('active');
        mobileOverlay.classList.remove('active');
    });
    
    // Close menu when clicking nav links on mobile
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                console.log('📱 Fermeture du menu mobile après clic sur lien');
                sidebar.classList.remove('active');
                mobileOverlay.classList.remove('active');
            }
        });
    });
    
    console.log('✅ Menu mobile initialisé avec succès');
}

function initializeEventListeners() {
    console.log('🔗 Initializing event listeners...');
    
    // Mobile menu toggle
    initializeMobileMenu();
    
    // Navigation sidebar
    const navLinks = document.querySelectorAll('.nav-link');
    console.log('🔍 Found nav links:', navLinks.length);
    
    if (navLinks.length === 0) {
        console.error('❌ No navigation links found! Check CSS selectors.');
        return;
    }
    
    navLinks.forEach((item, index) => {
        const section = item.getAttribute('data-section');
        console.log(`🔗 Setting up nav link ${index + 1}: ${section}`);
        
        // Vérifier que l'élément est cliquable
        const style = window.getComputedStyle(item);
        console.log(`   - Pointer events: ${style.pointerEvents}`);
        console.log(`   - Z-index: ${style.zIndex}`);
        console.log(`   - Position: ${style.position}`);
        
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🖱️ Nav link clicked:', section, 'by element:', this);
            
            if (section) {
                showSection(section);
            } else {
                console.error('❌ No data-section attribute found on nav link');
            }
        });
        
        // Ajouter un événement de test pour vérifier que l'élément répond
        item.addEventListener('mouseenter', function() {
            console.log('🖱️ Mouse entered nav link:', section);
        });
    });
    
    // Boutons d'action
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
        console.log('Refresh button event listener added');
    } else {
        console.warn('Refresh button not found: #refreshDashboard');
    }
    
    // Bouton nouveau rendez-vous
    const newAppointmentBtn = document.getElementById('newAppointmentBtn');
    if (newAppointmentBtn) {
        newAppointmentBtn.addEventListener('click', createNewAppointment);
        console.log('New appointment button event listener added');
    } else {
        console.warn('New appointment button not found: #newAppointmentBtn');
    }
    
    // Bouton composer message
    const composeMessageBtn = document.getElementById('composeMessageBtn');
    if (composeMessageBtn) {
        composeMessageBtn.addEventListener('click', composeMessage);
        console.log('Compose message button event listener added');
    } else {
        console.warn('Compose message button not found: #composeMessageBtn');
    }
    
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', showNotifications);
        console.log('Notification button event listener added');
    } else {
        console.warn('Notification button not found: .notification-btn');
    }
    
    // Bouton disclaimer
    const acceptDisclaimer = document.getElementById('acceptDisclaimer');
    if (acceptDisclaimer) {
        acceptDisclaimer.addEventListener('click', function() {
            const disclaimerModal = document.getElementById('disclaimerModal');
            if (disclaimerModal) {
                disclaimerModal.style.display = 'none';
                console.log('Disclaimer modal closed');
            }
        });
        console.log('Disclaimer button event listener added');
    } else {
        console.warn('Disclaimer button not found: #acceptDisclaimer');
    }
    
    // Filtres
    const typeFilter = document.getElementById('appointmentTypeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', filterAppointments);
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterAppointments);
    }
    
    // Boutons de navigation de date
    const prevDayBtn = document.getElementById('prevDay');
    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', () => {
            currentDate.setDate(currentDate.getDate() - 1);
            updateCurrentDate();
            loadAppointments();
        });
    }
    
    const nextDayBtn = document.getElementById('nextDay');
    if (nextDayBtn) {
        nextDayBtn.addEventListener('click', () => {
            currentDate.setDate(currentDate.getDate() + 1);
            updateCurrentDate();
            loadAppointments();
        });
    }
    
    // Bouton nouveau rendez-vous
    const newAppointmentBtn = document.getElementById('newAppointmentBtn');
    if (newAppointmentBtn) {
        newAppointmentBtn.addEventListener('click', () => {
            showNotification('Fonctionnalité en développement', 'info');
        });
    }
    
    // Recherche
    const searchInput = document.getElementById('clientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', searchClients);
    }
    
    // Modal de détail client
    const clientModal = document.getElementById('clientDetailModal');
    if (clientModal) {
        clientModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeClientModal();
            }
        });
    }
    
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeClientModal);
    }
    
    // Onglets du modal client
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            showTab(tabName);
        });
    });
}

function showSection(sectionName) {
    try {
        console.log('Switching to section:', sectionName);
        
        // Masquer toutes les sections
        const allSections = document.querySelectorAll('.content-section');
        console.log('Found sections:', allSections.length);
        
        allSections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        // Afficher la section demandée
        const targetSection = document.getElementById(sectionName + '-section');
        console.log('Target section:', targetSection);
        
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
            console.log('Section activated:', sectionName);
        } else {
            console.error('Section not found:', sectionName + '-section');
            return;
        }
        
        // Mettre à jour la navigation
        const allNavLinks = document.querySelectorAll('.nav-link');
        console.log('Found nav links:', allNavLinks.length);
        
        allNavLinks.forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
        console.log('Active nav item:', activeNavItem);
        
        if (activeNavItem) {
            activeNavItem.classList.add('active');
            console.log('Nav item activated');
        } else {
            console.error('Nav item not found for section:', sectionName);
        }
        
        currentSection = sectionName;
    } catch (error) {
        console.error('Error in showSection:', error);
    }
    
    // Charger le contenu spécifique à la section
    switch(sectionName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'clients':
            loadClients();
            break;
        case 'consultations':
            loadConsultations();
            break;
        case 'statistics':
            loadStatistics();
            break;
        case 'messages':
            loadMessages();
            break;
    }
}

function updateDashboard() {
    updateStats();
    updateTodayAppointments();
}

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(apt => apt.date === today);
    const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
    const nightConsultations = appointments.filter(apt => apt.type === 'night');
    const totalClients = clients.length;
    
    // Mettre à jour les cartes de statistiques
    const todayAppointmentsEl = document.getElementById('todayAppointments');
    if (todayAppointmentsEl) {
        todayAppointmentsEl.textContent = todayAppointments.length;
    }
    
    const totalClientsEl = document.getElementById('totalClients');
    if (totalClientsEl) {
        totalClientsEl.textContent = totalClients;
    }
    
    const pendingAppointmentsEl = document.getElementById('pendingAppointments');
    if (pendingAppointmentsEl) {
        pendingAppointmentsEl.textContent = pendingAppointments.length;
    }
    
    const nightConsultationsEl = document.getElementById('nightConsultations');
    if (nightConsultationsEl) {
        nightConsultationsEl.textContent = nightConsultations.length;
    }
}

function updateTodayAppointments() {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(apt => apt.date === today);
    
    const appointmentsList = document.getElementById('todayAppointmentsList');
    if (!appointmentsList) return;
    
    appointmentsList.innerHTML = '';
    
    if (todayAppointments.length === 0) {
        appointmentsList.innerHTML = '<div class="no-appointments"><p>Aucun rendez-vous aujourd\'hui</p></div>';
        return;
    }
    
    todayAppointments.forEach(appointment => {
        const appointmentElement = createAppointmentElement(appointment);
        appointmentsList.appendChild(appointmentElement);
    });
}

function createAppointmentElement(appointment) {
    const div = document.createElement('div');
    div.className = 'appointment-item';
    
    div.innerHTML = `
        <div class="appointment-time">${appointment.time}</div>
        <div class="appointment-details">
            <h4>${appointment.clientName}</h4>
            <p>${appointment.phone} • ${appointment.email}</p>
        </div>
        <span class="appointment-type ${appointment.type}">
            ${appointment.type === 'standard' ? 'Standard' : 'Nuit'}
        </span>
    `;
    
    return div;
}

function loadAppointments() {
    const tableBody = document.getElementById('appointmentsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    appointments.forEach(appointment => {
        const row = createAppointmentRow(appointment);
        tableBody.appendChild(row);
    });
}

function createAppointmentRow(appointment) {
    const tr = document.createElement('tr');
    
    const statusClass = appointment.status === 'confirmed' ? 'confirmed' : 
                       appointment.status === 'pending' ? 'pending' : 'cancelled';
    
    const statusText = appointment.status === 'confirmed' ? 'Confirmé' : 
                      appointment.status === 'pending' ? 'En attente' : 'Annulé';
    
    tr.innerHTML = `
        <td>${appointment.time}</td>
        <td>${appointment.clientName}</td>
        <td>
            <span class="appointment-type ${appointment.type}">
                ${appointment.type === 'standard' ? 'Standard' : 'Nuit'}
            </span>
        </td>
        <td>
            <div class="contact-info">
                <div>${appointment.phone}</div>
                <div>${appointment.email}</div>
            </div>
        </td>
        <td>
            <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td>
            <div class="action-buttons">
                <button class="btn-icon" onclick="editAppointment(${appointment.id})" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="deleteAppointment(${appointment.id})" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return tr;
}

function loadClients() {
    const clientsGrid = document.getElementById('clientsGrid');
    if (!clientsGrid) return;
    
    clientsGrid.innerHTML = '';
    
    clients.forEach(client => {
        const clientCard = createClientCard(client);
        clientsGrid.appendChild(clientCard);
    });
}

function createClientCard(client) {
    const div = document.createElement('div');
    div.className = 'client-card';
    
    const initials = getInitials(client.firstName, client.lastName);
    const averageScore = client.averageScore || 0;
    const scoreClass = averageScore >= 4 ? 'good' : averageScore >= 3 ? 'average' : 'low';
    
    div.innerHTML = `
        <div class="client-avatar">
            <span class="initials">${initials}</span>
        </div>
        <div class="client-info">
            <h3>${client.firstName} ${client.lastName}</h3>
            <p class="client-email">${client.email}</p>
            <p class="client-phone">${client.phone}</p>
            <div class="client-stats">
                <span class="sessions-count">${client.sessions.length} séances</span>
                <span class="score-badge ${scoreClass}">${averageScore.toFixed(1)}/5</span>
            </div>
        </div>
        <div class="client-actions">
            <button class="btn-primary btn-sm" onclick="showClientDetails(${client.id})">
                <i class="fas fa-eye"></i> Voir détails
            </button>
        </div>
    `;
    
    return div;
}

function showClientDetails(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    // Remplir les informations du modal
    document.getElementById('clientDetailName').textContent = `${client.firstName} ${client.lastName}`;
    document.getElementById('clientFullName').textContent = `${client.firstName} ${client.lastName}`;
    document.getElementById('clientEmail').textContent = client.email;
    document.getElementById('clientPhone').textContent = client.phone;
    document.getElementById('clientAddress').textContent = client.address;
    document.getElementById('clientRegistrationDate').textContent = formatDate(client.registrationDate);
    
    // Afficher le modal
    document.getElementById('clientDetailModal').style.display = 'block';
    
    // Charger l'onglet par défaut
    showClientTab('info');
}

function showClientTab(tabName) {
    // Masquer tous les onglets
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Désactiver tous les boutons d'onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Afficher l'onglet sélectionné
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Activer le bouton d'onglet
    const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
}

// Fonction pour fermer le modal client
function closeClientModal() {
    document.getElementById('clientDetailModal').style.display = 'none';
}

// Ajouter les event listeners pour les onglets du modal client
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners pour les onglets du modal client
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            showClientTab(tabName);
        });
    });
    
    // Event listener pour fermer le modal
    const closeBtn = document.querySelector('#clientDetailModal .close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeClientModal);
    }
    
    // Event listener pour fermer le modal en cliquant à l'extérieur
    document.getElementById('clientDetailModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeClientModal();
        }
    });
});

function createClientCard(client) {
    const div = document.createElement('div');
    div.className = 'client-card';
    div.onclick = () => openClientModal(client.id);
    
    const initials = (client.firstName.charAt(0) + client.lastName.charAt(0)).toUpperCase();
    
    div.innerHTML = `
        <div class="client-header">
            <div class="client-avatar">${initials}</div>
            <div class="client-info">
                <h4>${client.firstName} ${client.lastName}</h4>
                <p>Inscrit le ${formatDate(client.registrationDate)}</p>
            </div>
        </div>
        <div class="client-stats">
            <div class="client-stat">
                <div class="number">${client.sessions.length}</div>
                <div class="label">Séances</div>
            </div>
            <div class="client-stat">
                <div class="number">${client.averageScore}/5</div>
                <div class="label">Score moyen</div>
            </div>
        </div>
    `;
    
    return div;
}

function openClientModal(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    currentClient = client;
    
    // Remplir les informations du client
    const modal = document.getElementById('clientDetailModal');
    const avatar = modal.querySelector('.client-detail-avatar');
    const name = modal.querySelector('.client-detail-text h2');
    const info = modal.querySelector('.client-detail-text p');
    
    const initials = (client.firstName.charAt(0) + client.lastName.charAt(0)).toUpperCase();
    avatar.textContent = initials;
    name.textContent = `${client.firstName} ${client.lastName}`;
    info.textContent = `Inscrit le ${formatDate(client.registrationDate)}`;
    
    // Remplir les onglets
    fillClientTabs(client);
    
    // Afficher le premier onglet
    showTab('info');
    
    // Afficher le modal
    modal.style.display = 'flex';
}

function fillClientTabs(client) {
    // Onglet Informations
    const clientFullName = document.getElementById('clientFullName');
    const clientEmail = document.getElementById('clientEmail');
    const clientPhone = document.getElementById('clientPhone');
    const clientAddress = document.getElementById('clientAddress');
    const clientRegistrationDate = document.getElementById('clientRegistrationDate');
    
    if (clientFullName) clientFullName.textContent = `${client.firstName} ${client.lastName}`;
    if (clientEmail) clientEmail.textContent = client.email;
    if (clientPhone) clientPhone.textContent = client.phone;
    if (clientAddress) clientAddress.textContent = client.address;
    if (clientRegistrationDate) clientRegistrationDate.textContent = formatDate(client.registrationDate);
    
    // Onglet Historique
    const historyTab = document.getElementById('clientAppointmentHistory');
    if (historyTab) {
        const appointmentHistory = appointments.filter(apt => apt.clientId === client.id);
        let historyHTML = '<h4>Historique des rendez-vous</h4>';
        
        if (appointmentHistory.length === 0) {
            historyHTML += '<p>Aucun rendez-vous enregistré</p>';
        } else {
            historyHTML += '<div class="appointments-history">';
            appointmentHistory.forEach(apt => {
                historyHTML += `
                    <div class="appointment-history-item">
                        <strong>${formatDate(apt.date)} à ${apt.time}</strong>
                        <span class="appointment-type ${apt.type}">
                            ${apt.type === 'standard' ? 'Standard' : 'Nuit'}
                        </span>
                        <span class="status-badge ${apt.status}">
                            ${apt.status === 'confirmed' ? 'Confirmé' : apt.status === 'pending' ? 'En attente' : 'Annulé'}
                        </span>
                    </div>
                `;
            });
            historyHTML += '</div>';
        }
        
        historyTab.innerHTML = historyHTML;
    }
    
    // Onglet Progression et Notes seront implémentés plus tard
     console.log('Onglets progression et notes à implémenter');
}

function showTab(tabName) {
    // Masquer tous les contenus d'onglets
    document.querySelectorAll('.tab-pane').forEach(content => {
        content.classList.remove('active');
    });
    
    // Désactiver tous les boutons d'onglets
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.classList.remove('active');
    });
    
    // Activer l'onglet sélectionné
    const activeTab = document.getElementById(tabName + '-tab');
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    
    if (activeTab) activeTab.classList.add('active');
    if (activeButton) activeButton.classList.add('active');
}

function closeClientModal() {
    const modal = document.getElementById('clientDetailModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentClient = null;
}

function addSessionNote(event) {
    event.preventDefault();
    
    if (!currentClient) return;
    
    const date = document.getElementById('sessionDate').value;
    const score = parseInt(document.getElementById('sessionScore').value);
    const notes = document.getElementById('sessionNotes').value;
    
    // Ajouter la nouvelle session
    currentClient.sessions.push({ date, score, notes });
    
    // Recalculer le score moyen
    const totalScore = currentClient.sessions.reduce((sum, session) => sum + session.score, 0);
    currentClient.averageScore = Math.round((totalScore / currentClient.sessions.length) * 10) / 10;
    
    // Mettre à jour l'affichage
    fillClientTabs(currentClient);
    showTab('progress');
    
    // Réinitialiser le formulaire
    event.target.reset();
    
    alert('Note de séance ajoutée avec succès!');
}

function loadConsultations() {
    // Implémentation pour la section consultations
    console.log('Chargement des consultations...');
}

function loadStatistics() {
    // Implémentation pour la section statistiques
    console.log('Chargement des statistiques...');
}

function loadMessages() {
    // Implémentation pour la section messages
    console.log('Chargement des messages...');
}

function refreshData() {
    updateDashboard();
    if (currentSection === 'appointments') {
        loadAppointments();
    } else if (currentSection === 'clients') {
        loadClients();
    }
    
    // Animation du bouton de rafraîchissement
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            refreshBtn.style.transform = 'rotate(0deg)';
        }, 500);
    }
}

function showNotifications() {
    alert('Fonctionnalité de notifications à implémenter');
}

function filterAppointments() {
    const typeFilter = document.getElementById('typeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredAppointments = [...appointments];
    
    if (typeFilter) {
        filteredAppointments = filteredAppointments.filter(apt => apt.type === typeFilter);
    }
    
    if (statusFilter) {
        filteredAppointments = filteredAppointments.filter(apt => apt.status === statusFilter);
    }
    
    // Mettre à jour le tableau
    const tableBody = document.querySelector('#appointmentsTable tbody');
    if (tableBody) {
        tableBody.innerHTML = '';
        filteredAppointments.forEach(appointment => {
            const row = createAppointmentRow(appointment);
            tableBody.appendChild(row);
        });
    }
}

function searchClients() {
    const searchTerm = document.getElementById('clientSearch').value.toLowerCase();
    
    const filteredClients = clients.filter(client => 
        client.firstName.toLowerCase().includes(searchTerm) ||
        client.lastName.toLowerCase().includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm) ||
        client.phone.includes(searchTerm)
    );
    
    const clientsGrid = document.getElementById('clientsGrid');
    if (clientsGrid) {
        clientsGrid.innerHTML = '';
        filteredClients.forEach(client => {
            const clientCard = createClientCard(client);
            clientsGrid.appendChild(clientCard);
        });
    }
}

function filterAppointments() {
    const typeFilter = document.getElementById('appointmentTypeFilter');
    const selectedType = typeFilter ? typeFilter.value : 'all';
    
    let filteredAppointments = appointments;
    
    if (selectedType !== 'all') {
        filteredAppointments = appointments.filter(apt => apt.type === selectedType);
    }
    
    const tableBody = document.getElementById('appointmentsTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        filteredAppointments.forEach(appointment => {
            const row = createAppointmentRow(appointment);
            tableBody.appendChild(row);
        });
    }
}

// Fonctions pour les autres sections
function loadConsultations() {
    console.log('Chargement des consultations...');
    // Implémentation future
}

function loadStatistics() {
    console.log('Chargement des statistiques...');
    
    // Calculer les statistiques
    const stats = calculateStatistics();
    
    // Mettre à jour l'affichage des statistiques
    updateStatisticsDisplay(stats);
    
    // Notification pour les statistiques importantes
    if (stats.todayAppointments > 5) {
        addNotification(
            'Journée chargée',
            `Vous avez ${stats.todayAppointments} rendez-vous aujourd'hui`,
            'reminder',
            '#appointments'
        );
    }
    
    if (stats.pendingAppointments > 3) {
        addNotification(
            'Rendez-vous en attente',
            `${stats.pendingAppointments} rendez-vous nécessitent une confirmation`,
            'reminder',
            '#appointments'
        );
    }
}

function calculateStatistics() {
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = getWeekDates();
    const thisMonth = new Date().getMonth();
    
    return {
        totalClients: clients.length,
        totalAppointments: appointments.length,
        todayAppointments: appointments.filter(apt => apt.date === today).length,
        weekAppointments: appointments.filter(apt => thisWeek.includes(apt.date)).length,
        monthAppointments: appointments.filter(apt => new Date(apt.date).getMonth() === thisMonth).length,
        pendingAppointments: appointments.filter(apt => apt.status === 'pending').length,
        completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
        cancelledAppointments: appointments.filter(apt => apt.status === 'cancelled').length,
        averageSessionScore: calculateAverageScore(),
        clientsWithHighScores: clients.filter(client => client.averageScore >= 4).length,
        clientsNeedingAttention: clients.filter(client => client.averageScore <= 2).length
    };
}

function getWeekDates() {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
}

function calculateAverageScore() {
    const allScores = clients.flatMap(client => 
        client.sessions ? client.sessions.map(session => session.score) : []
    );
    
    if (allScores.length === 0) return 0;
    
    return (allScores.reduce((sum, score) => sum + score, 0) / allScores.length).toFixed(1);
}

function updateStatisticsDisplay(stats) {
    const statsSection = document.getElementById('statistics-section');
    if (!statsSection) return;
    
    statsSection.innerHTML = `
        <div class="statistics-grid">
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-users"></i></div>
                <div class="stat-content">
                    <div class="stat-number">${stats.totalClients}</div>
                    <div class="stat-label">Clients total</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-calendar-day"></i></div>
                <div class="stat-content">
                    <div class="stat-number">${stats.todayAppointments}</div>
                    <div class="stat-label">RDV aujourd'hui</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-calendar-week"></i></div>
                <div class="stat-content">
                    <div class="stat-number">${stats.weekAppointments}</div>
                    <div class="stat-label">RDV cette semaine</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-clock"></i></div>
                <div class="stat-content">
                    <div class="stat-number">${stats.pendingAppointments}</div>
                    <div class="stat-label">En attente</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                <div class="stat-content">
                    <div class="stat-number">${stats.completedAppointments}</div>
                    <div class="stat-label">Terminés</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-star"></i></div>
                <div class="stat-content">
                    <div class="stat-number">${stats.averageSessionScore}</div>
                    <div class="stat-label">Score moyen</div>
                </div>
            </div>
            
            <div class="stat-card ${stats.clientsNeedingAttention > 0 ? 'attention' : ''}">
                <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="stat-content">
                    <div class="stat-number">${stats.clientsNeedingAttention}</div>
                    <div class="stat-label">Clients à suivre</div>
                </div>
            </div>
            
            <div class="stat-card success">
                <div class="stat-icon"><i class="fas fa-thumbs-up"></i></div>
                <div class="stat-content">
                    <div class="stat-number">${stats.clientsWithHighScores}</div>
                    <div class="stat-label">Clients satisfaits</div>
                </div>
            </div>
        </div>
        
        <div class="statistics-charts">
            <div class="chart-container">
                <canvas id="appointmentsChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="scoresChart"></canvas>
            </div>
        </div>
    `;
    
    // Créer les graphiques
    createAppointmentsChart(stats);
    createScoresChart();
}

function createAppointmentsChart(stats) {
    const ctx = document.getElementById('appointmentsChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Confirmés', 'En attente', 'Terminés', 'Annulés'],
            datasets: [{
                data: [
                    appointments.filter(apt => apt.status === 'confirmed').length,
                    stats.pendingAppointments,
                    stats.completedAppointments,
                    stats.cancelledAppointments
                ],
                backgroundColor: ['#4CAF50', '#FF9800', '#2196F3', '#F44336']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Répartition des rendez-vous'
                }
            }
        }
    });
}

function createScoresChart() {
    const ctx = document.getElementById('scoresChart');
    if (!ctx) return;
    
    const scoreDistribution = [0, 0, 0, 0, 0]; // scores 1-5
    
    clients.forEach(client => {
        if (client.sessions) {
            client.sessions.forEach(session => {
                if (session.score >= 1 && session.score <= 5) {
                    scoreDistribution[session.score - 1]++;
                }
            });
        }
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Score 1', 'Score 2', 'Score 3', 'Score 4', 'Score 5'],
            datasets: [{
                label: 'Nombre de sessions',
                data: scoreDistribution,
                backgroundColor: ['#F44336', '#FF9800', '#FFC107', '#4CAF50', '#2196F3']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution des scores de session'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function loadMessages() {
    console.log('Chargement des messages...');
    
    // Simuler des messages
    const messages = getStoredMessages();
    
    // Afficher les messages
    updateMessagesDisplay(messages);
    
    // Vérifier les nouveaux messages
    checkForNewMessages();
}

function getStoredMessages() {
    const stored = localStorage.getItem('employeeMessages');
    return stored ? JSON.parse(stored) : [
        {
            id: 1,
            from: 'Marie Dubois',
            subject: 'Question sur ma prochaine séance',
            message: 'Bonjour, j\'aimerais savoir si nous pouvons décaler ma séance de demain à jeudi ?',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            read: false,
            clientId: 1
        },
        {
            id: 2,
            from: 'Pierre Martin',
            subject: 'Merci pour la dernière séance',
            message: 'Je voulais vous remercier pour la séance d\'hier. Les techniques que vous m\'avez montrées m\'aident beaucoup.',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            read: true,
            clientId: 2
        },
        {
            id: 3,
            from: 'Sophie Leroy',
            subject: 'Demande de rendez-vous urgent',
            message: 'Bonjour, j\'aurais besoin d\'un rendez-vous en urgence si possible. Je traverse une période difficile.',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            read: false,
            clientId: 3
        }
    ];
}

function updateMessagesDisplay(messages) {
    const messagesSection = document.getElementById('messages-section');
    if (!messagesSection) return;
    
    const unreadCount = messages.filter(msg => !msg.read).length;
    
    messagesSection.innerHTML = `
        <div class="messages-header">
            <h3><i class="fas fa-envelope"></i> Messages (${unreadCount} non lus)</h3>
            <button onclick="composeMessage()" class="btn-primary">
                <i class="fas fa-plus"></i> Nouveau message
            </button>
        </div>
        
        <div class="messages-list">
            ${messages.length === 0 ? 
                '<div class="no-messages">Aucun message</div>' :
                messages.map(msg => `
                    <div class="message-item ${msg.read ? 'read' : 'unread'}" onclick="openMessage(${msg.id})">
                        <div class="message-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="message-content">
                            <div class="message-header">
                                <span class="message-from">${msg.from}</span>
                                <span class="message-time">${formatNotificationTime(msg.timestamp)}</span>
                            </div>
                            <div class="message-subject">${msg.subject}</div>
                            <div class="message-preview">${msg.message.substring(0, 100)}${msg.message.length > 100 ? '...' : ''}</div>
                        </div>
                        <div class="message-actions">
                            ${!msg.read ? '<div class="unread-indicator"></div>' : ''}
                            <button onclick="deleteMessage(${msg.id}); event.stopPropagation();" class="btn-delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')
            }
        </div>
    `;
}

function checkForNewMessages() {
    const messages = getStoredMessages();
    const unreadMessages = messages.filter(msg => !msg.read);
    
    unreadMessages.forEach(msg => {
        // Vérifier si c'est un nouveau message (moins de 5 minutes)
        const messageTime = new Date(msg.timestamp);
        const now = new Date();
        const diffMinutes = (now - messageTime) / (1000 * 60);
        
        if (diffMinutes < 5) {
            addNotification(
                'Nouveau message',
                `${msg.from}: ${msg.subject}`,
                'message',
                `client:${msg.clientId}`
            );
        }
    });
}

function openMessage(messageId) {
    const messages = getStoredMessages();
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message) return;
    
    // Marquer comme lu
    message.read = true;
    localStorage.setItem('employeeMessages', JSON.stringify(messages));
    
    // Ouvrir le modal de message
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'messageModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-envelope"></i> ${message.subject}</h2>
                <button onclick="closeMessageModal()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="message-details">
                    <div class="message-from-full">
                        <strong>De:</strong> ${message.from}
                    </div>
                    <div class="message-time-full">
                        <strong>Reçu:</strong> ${new Date(message.timestamp).toLocaleString('fr-FR')}
                    </div>
                </div>
                <div class="message-content-full">
                    ${message.message}
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="closeMessageModal()" class="btn-secondary">Fermer</button>
                <button onclick="replyToMessage(${message.clientId})" class="btn-primary">
                    <i class="fas fa-reply"></i> Répondre
                </button>
                <button onclick="openClientModal(${message.clientId}); closeMessageModal();" class="btn-info">
                    <i class="fas fa-user"></i> Voir le dossier
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Mettre à jour l'affichage des messages
    loadMessages();
}

function closeMessageModal() {
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.remove();
    }
}

function replyToMessage(clientId) {
    closeMessageModal();
    composeMessage(clientId);
}

function composeMessage(clientId = null) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'composeMessageModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-edit"></i> Nouveau message</h2>
                <button onclick="closeComposeMessageModal()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="composeMessageForm">
                    <div class="form-group">
                        <label for="messageRecipient">Destinataire</label>
                        <select id="messageRecipient" required>
                            <option value="">Sélectionner un client</option>
                            ${clients.map(client => `
                                <option value="${client.id}" ${clientId === client.id ? 'selected' : ''}>
                                    ${client.firstName} ${client.lastName}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="messageSubject">Sujet</label>
                        <input type="text" id="messageSubject" required placeholder="Sujet du message">
                    </div>
                    <div class="form-group">
                        <label for="messageContent">Message</label>
                        <textarea id="messageContent" rows="6" required placeholder="Votre message..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button onclick="closeComposeMessageModal()" class="btn-secondary">Annuler</button>
                <button onclick="sendMessage()" class="btn-primary">
                    <i class="fas fa-paper-plane"></i> Envoyer
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeComposeMessageModal() {
    const modal = document.getElementById('composeMessageModal');
    if (modal) {
        modal.remove();
    }
}

function sendMessage() {
    const recipientId = parseInt(document.getElementById('messageRecipient').value);
    const subject = document.getElementById('messageSubject').value;
    const content = document.getElementById('messageContent').value;
    
    if (!recipientId || !subject || !content) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    const recipient = clients.find(c => c.id === recipientId);
    if (!recipient) {
        showNotification('Destinataire non trouvé', 'error');
        return;
    }
    
    // Simuler l'envoi du message
    addNotification(
        'Message envoyé',
        `Message envoyé à ${recipient.firstName} ${recipient.lastName}`,
        'message',
        `client:${recipientId}`
    );
    
    showNotification('Message envoyé avec succès', 'success');
    closeComposeMessageModal();
}

function deleteMessage(messageId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
        let messages = getStoredMessages();
        messages = messages.filter(msg => msg.id !== messageId);
        localStorage.setItem('employeeMessages', JSON.stringify(messages));
        loadMessages();
        showNotification('Message supprimé', 'success');
    }
}

// Fonctions d'action pour les rendez-vous
function editAppointment(id) {
    const appointment = appointments.find(apt => apt.id === id);
    if (appointment) {
        openEditAppointmentModal(appointment);
    }
}

function openEditAppointmentModal(appointment) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'editAppointmentModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-edit"></i> Modifier le rendez-vous</h2>
                <button onclick="closeEditAppointmentModal()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="editAppointmentForm">
                    <div class="form-group">
                        <label for="editClientName">Client</label>
                        <input type="text" id="editClientName" value="${appointment.clientName}" readonly>
                    </div>
                    <div class="form-group">
                        <label for="editDate">Date</label>
                        <input type="date" id="editDate" value="${appointment.date}" required>
                    </div>
                    <div class="form-group">
                        <label for="editTime">Heure</label>
                        <input type="time" id="editTime" value="${appointment.time}" required>
                    </div>
                    <div class="form-group">
                        <label for="editType">Type</label>
                        <select id="editType" required>
                            <option value="standard" ${appointment.type === 'standard' ? 'selected' : ''}>Standard</option>
                            <option value="night" ${appointment.type === 'night' ? 'selected' : ''}>Consultation de nuit</option>
                            <option value="urgent" ${appointment.type === 'urgent' ? 'selected' : ''}>Urgence</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editStatus">Statut</label>
                        <select id="editStatus" required>
                            <option value="pending" ${appointment.status === 'pending' ? 'selected' : ''}>En attente</option>
                            <option value="confirmed" ${appointment.status === 'confirmed' ? 'selected' : ''}>Confirmé</option>
                            <option value="completed" ${appointment.status === 'completed' ? 'selected' : ''}>Terminé</option>
                            <option value="cancelled" ${appointment.status === 'cancelled' ? 'selected' : ''}>Annulé</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button onclick="closeEditAppointmentModal()" class="btn-secondary">Annuler</button>
                <button onclick="saveAppointmentChanges(${appointment.id})" class="btn-primary">Sauvegarder</button>
                <button onclick="startConsultation(${appointment.id})" class="btn-success">
                    <i class="fas fa-play"></i> Démarrer consultation
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeEditAppointmentModal() {
    const modal = document.getElementById('editAppointmentModal');
    if (modal) {
        modal.remove();
    }
}

function saveAppointmentChanges(appointmentId) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;
    
    const oldDate = appointment.date;
    const oldTime = appointment.time;
    const oldStatus = appointment.status;
    
    // Récupérer les nouvelles valeurs
    appointment.date = document.getElementById('editDate').value;
    appointment.time = document.getElementById('editTime').value;
    appointment.type = document.getElementById('editType').value;
    appointment.status = document.getElementById('editStatus').value;
    
    // Vérifier s'il y a eu des changements
    const dateChanged = oldDate !== appointment.date || oldTime !== appointment.time;
    const statusChanged = oldStatus !== appointment.status;
    
    // Mettre à jour l'affichage
    loadAppointments();
    updateDashboard();
    closeEditAppointmentModal();
    
    // Créer les notifications appropriées
    if (dateChanged) {
        addNotification(
            'Rendez-vous modifié',
            `Le RDV de ${appointment.clientName} a été reprogrammé au ${formatDate(appointment.date)} à ${appointment.time}`,
            'appointment',
            `appointment:${appointmentId}`
        );
    }
    
    if (statusChanged) {
        const statusMessages = {
            'confirmed': 'confirmé',
            'pending': 'mis en attente',
            'completed': 'marqué comme terminé',
            'cancelled': 'annulé'
        };
        addNotification(
            'Statut mis à jour',
            `Le RDV de ${appointment.clientName} a été ${statusMessages[appointment.status]}`,
            'appointment',
            `appointment:${appointmentId}`
        );
    }
    
    showNotification('Rendez-vous modifié avec succès', 'success');
}

function startConsultation(appointmentId) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;
    
    // Marquer comme en cours
    appointment.status = 'in-progress';
    appointment.startTime = new Date().toISOString();
    
    // Fermer le modal
    closeEditAppointmentModal();
    
    // Ouvrir l'interface de consultation
    openConsultationInterface(appointment);
    
    // Notification
    addNotification(
        'Consultation démarrée',
        `Consultation avec ${appointment.clientName} en cours`,
        'appointment',
        `client:${appointment.clientId}`
    );
    
    showNotification(`Consultation avec ${appointment.clientName} démarrée`, 'success');
}

function openConsultationInterface(appointment) {
    // Ouvrir le dossier client et passer en mode consultation
    openClientModal(appointment.clientId);
    
    // Ajouter un indicateur de consultation en cours
    const modal = document.querySelector('.client-modal');
    if (modal) {
        const header = modal.querySelector('.modal-header h2');
        if (header) {
            header.innerHTML = `
                <i class="fas fa-user"></i> ${appointment.clientName}
                <span class="consultation-indicator">
                    <i class="fas fa-circle text-success"></i> Consultation en cours
                </span>
            `;
        }
        
        // Ajouter un bouton pour terminer la consultation
        const footer = modal.querySelector('.modal-footer');
        if (footer) {
            const endBtn = document.createElement('button');
            endBtn.className = 'btn-warning';
            endBtn.innerHTML = '<i class="fas fa-stop"></i> Terminer consultation';
            endBtn.onclick = () => endConsultation(appointment.id);
            footer.appendChild(endBtn);
        }
    }
}

function endConsultation(appointmentId) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;
    
    appointment.status = 'completed';
    appointment.endTime = new Date().toISOString();
    
    // Calculer la durée
    const duration = Math.round((new Date(appointment.endTime) - new Date(appointment.startTime)) / 60000);
    
    addNotification(
        'Consultation terminée',
        `Consultation avec ${appointment.clientName} terminée (${duration} min)`,
        'appointment',
        `client:${appointment.clientId}`
    );
    
    showNotification('Consultation terminée', 'success');
    
    // Mettre à jour l'affichage
    loadAppointments();
    updateDashboard();
    closeClientModal();
}

function deleteAppointment(id) {
    const appointment = appointments.find(apt => apt.id === id);
    if (!appointment) return;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer le rendez-vous de ${appointment.clientName} ?`)) {
        appointments = appointments.filter(apt => apt.id !== id);
        loadAppointments();
        updateDashboard();
        
        // Notification de suppression
        addNotification(
            'Rendez-vous supprimé',
            `Le RDV de ${appointment.clientName} du ${formatDate(appointment.date)} à ${appointment.time} a été supprimé`,
            'appointment'
        );
        
        showNotification('Rendez-vous supprimé', 'success');
    }
}

function createNewAppointment() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'newAppointmentModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-plus"></i> Nouveau rendez-vous</h2>
                <button onclick="closeNewAppointmentModal()" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="newAppointmentForm">
                    <div class="form-group">
                        <label for="newClientSelect">Client</label>
                        <select id="newClientSelect" required>
                            <option value="">Sélectionner un client</option>
                            ${clients.map(client => `
                                <option value="${client.id}">${client.firstName} ${client.lastName}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="newDate">Date</label>
                        <input type="date" id="newDate" required min="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label for="newTime">Heure</label>
                        <input type="time" id="newTime" required>
                    </div>
                    <div class="form-group">
                        <label for="newType">Type</label>
                        <select id="newType" required>
                            <option value="standard">Standard</option>
                            <option value="night">Consultation de nuit</option>
                            <option value="urgent">Urgence</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="newNotes">Notes (optionnel)</label>
                        <textarea id="newNotes" rows="3" placeholder="Notes sur le rendez-vous..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button onclick="closeNewAppointmentModal()" class="btn-secondary">Annuler</button>
                <button onclick="saveNewAppointment()" class="btn-primary">Créer le rendez-vous</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeNewAppointmentModal() {
    const modal = document.getElementById('newAppointmentModal');
    if (modal) {
        modal.remove();
    }
}

function saveNewAppointment() {
    const clientId = parseInt(document.getElementById('newClientSelect').value);
    const date = document.getElementById('newDate').value;
    const time = document.getElementById('newTime').value;
    const type = document.getElementById('newType').value;
    const notes = document.getElementById('newNotes').value;
    
    if (!clientId || !date || !time) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    const client = clients.find(c => c.id === clientId);
    if (!client) {
        showNotification('Client non trouvé', 'error');
        return;
    }
    
    const newAppointment = {
        id: Date.now(),
        clientId: clientId,
        clientName: `${client.firstName} ${client.lastName}`,
        date: date,
        time: time,
        type: type,
        status: 'pending',
        notes: notes,
        email: client.email,
        phone: client.phone,
        address: client.address
    };
    
    appointments.push(newAppointment);
    loadAppointments();
    updateDashboard();
    closeNewAppointmentModal();
    
    // Notification de création
    addNotification(
        'Nouveau rendez-vous créé',
        `RDV avec ${client.firstName} ${client.lastName} programmé le ${formatDate(date)} à ${time}`,
        'appointment',
        `appointment:${newAppointment.id}`
    );
    
    showNotification('Rendez-vous créé avec succès', 'success');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Fonctions utilitaires
function getInitials(firstName, lastName) {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// Export des fonctions pour utilisation globale
window.showSection = showSection;
window.openClientModal = openClientModal;
window.closeClientModal = closeClientModal;
window.showTab = showTab;
window.addSessionNote = addSessionNote;
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;
window.refreshData = refreshData;
window.showNotifications = showNotifications;
window.filterAppointments = filterAppointments;
window.searchClients = searchClients;

// Nouvelles fonctions de notifications
window.closeNotificationsPanel = closeNotificationsPanel;
window.markAllAsRead = markAllAsRead;
window.handleNotificationAction = handleNotificationAction;
window.deleteNotification = deleteNotification;
window.addNotification = addNotification;

// Fonctions de gestion des rendez-vous
window.createNewAppointment = createNewAppointment;
window.closeEditAppointmentModal = closeEditAppointmentModal;
window.closeNewAppointmentModal = closeNewAppointmentModal;
window.saveAppointmentChanges = saveAppointmentChanges;
window.saveNewAppointment = saveNewAppointment;
window.startConsultation = startConsultation;
window.endConsultation = endConsultation;

// Fonctions de messages
window.openMessage = openMessage;
window.closeMessageModal = closeMessageModal;
window.replyToMessage = replyToMessage;
window.composeMessage = composeMessage;
window.closeComposeMessageModal = closeComposeMessageModal;
window.sendMessage = sendMessage;
window.deleteMessage = deleteMessage;

// Fonctions de statistiques
window.loadStatistics = loadStatistics;
window.loadMessages = loadMessages;

// Mettre à jour l'heure toutes les minutes
setInterval(updateCurrentDate, 60000);