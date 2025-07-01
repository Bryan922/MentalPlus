// Profile Fix - Gestion du profil client sans conflits d'authentification
// Compatible avec auth-fix.js

class ProfileManager {
    constructor() {
        this.currentUser = null
        this.appointments = []
        this.documents = []
        this.init()
    }

    init() {
        // Attendre que auth-fix.js soit chargé
        if (window.authManager) {
            this.checkAuthAndInit()
        } else {
            // Attendre que authManager soit disponible
            const checkAuth = setInterval(() => {
                if (window.authManager) {
                    clearInterval(checkAuth)
                    this.checkAuthAndInit()
                }
            }, 100)
        }
    }

    checkAuthAndInit() {
        // Utiliser le gestionnaire d'authentification unifié
        if (!window.authManager.isAuthenticated()) {
            console.log('Utilisateur non authentifié, redirection...')
            localStorage.setItem('redirectAfterLogin', window.location.href)
            window.location.href = 'auth.html'
            return
        }

        this.currentUser = window.authManager.getCurrentUser()
        this.initializeProfile()
    }

    initializeProfile() {
        console.log('Initialisation du profil pour:', this.currentUser)
        
        this.initializeNavigation()
        this.loadUserData()
        this.initializeImageUpload()
        this.initializeForms()
        this.loadAppointments()
        this.loadDocuments()
        this.setupFilters()
        
        // Afficher les informations utilisateur
        this.displayUserInfo()
    }

    displayUserInfo() {
        const userNameElement = document.querySelector('.user-name')
        const userEmailElement = document.querySelector('.user-email')
        
        if (userNameElement && this.currentUser.name) {
            userNameElement.textContent = this.currentUser.name
        }
        
        if (userEmailElement && this.currentUser.email) {
            userEmailElement.textContent = this.currentUser.email
        }
    }

    initializeNavigation() {
        const navLinks = document.querySelectorAll('.profile-nav a')
        const sections = document.querySelectorAll('.profile-section')
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault()
                
                // Empêcher la déconnexion lors de la navigation
                e.stopPropagation()
                
                const targetId = link.getAttribute('href').substring(1)
                
                // Mise à jour des classes actives
                navLinks.forEach(l => l.classList.remove('active'))
                sections.forEach(s => s.classList.remove('active'))
                
                link.classList.add('active')
                const targetSection = document.getElementById(targetId)
                if (targetSection) {
                    targetSection.classList.add('active')
                }
                
                // Charger les données spécifiques à la section
                this.loadSectionData(targetId)
            })
        })
    }

    loadSectionData(sectionId) {
        switch(sectionId) {
            case 'appointments':
                this.loadAppointments()
                break
            case 'documents':
                this.loadDocuments()
                break
            case 'settings':
                this.loadSettings()
                break
        }
    }

    setupFilters() {
        const filterButtons = document.querySelectorAll('.appointments-filter button')
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault()
                e.stopPropagation()
                
                filterButtons.forEach(btn => btn.classList.remove('active'))
                button.classList.add('active')
                
                const filter = button.dataset.filter
                this.loadAppointments(filter)
            })
        })
    }

    loadUserData() {
        // Simuler le chargement des données utilisateur
        const userData = {
            name: this.currentUser.name || 'Utilisateur',
            email: this.currentUser.email || 'email@example.com',
            phone: '+33 1 23 45 67 89',
            address: '123 Rue de la Paix, 75001 Paris',
            birthDate: '01/01/1990',
            emergencyContact: 'Contact d\'urgence: +33 1 98 76 54 32'
        }

        // Remplir les champs du profil
        Object.keys(userData).forEach(key => {
            const element = document.getElementById(key) || document.querySelector(`[data-field="${key}"]`)
            if (element) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.value = userData[key]
                } else {
                    element.textContent = userData[key]
                }
            }
        })
    }

    loadAppointments(filter = 'upcoming') {
        // Simuler le chargement des rendez-vous
        const allAppointments = [
            {
                id: 1,
                date: '2024-01-15',
                time: '14:00',
                type: 'Consultation classique',
                status: 'confirmed',
                doctor: 'Dr. Martin',
                notes: 'Consultation de suivi'
            },
            {
                id: 2,
                date: '2024-01-20',
                time: '16:30',
                type: 'Consultation de nuit',
                status: 'pending',
                doctor: 'Dr. Dubois',
                notes: 'Première consultation'
            }
        ]

        let filteredAppointments = allAppointments
        
        if (filter === 'upcoming') {
            filteredAppointments = allAppointments.filter(apt => new Date(apt.date) >= new Date())
        } else if (filter === 'past') {
            filteredAppointments = allAppointments.filter(apt => new Date(apt.date) < new Date())
        }

        this.displayAppointments(filteredAppointments)
    }

    displayAppointments(appointments) {
        const container = document.querySelector('.appointments-list') || document.getElementById('appointments-list')
        if (!container) return

        if (appointments.length === 0) {
            container.innerHTML = '<p class="no-data">Aucun rendez-vous trouvé.</p>'
            return
        }

        container.innerHTML = appointments.map(apt => `
            <div class="appointment-card" data-id="${apt.id}">
                <div class="appointment-header">
                    <h4>${apt.type}</h4>
                    <span class="status status-${apt.status}">${this.getStatusText(apt.status)}</span>
                </div>
                <div class="appointment-details">
                    <p><strong>Date:</strong> ${this.formatDate(apt.date)}</p>
                    <p><strong>Heure:</strong> ${apt.time}</p>
                    <p><strong>Praticien:</strong> ${apt.doctor}</p>
                    <p><strong>Notes:</strong> ${apt.notes}</p>
                </div>
                <div class="appointment-actions">
                    <button onclick="profileManager.viewAppointment(${apt.id})" class="btn-secondary">Voir</button>
                    ${apt.status === 'pending' ? `<button onclick="profileManager.cancelAppointment(${apt.id})" class="btn-danger">Annuler</button>` : ''}
                </div>
            </div>
        `).join('')
    }

    loadDocuments() {
        // Simuler le chargement des documents
        const documents = [
            {
                id: 1,
                name: 'Ordonnance du 15/01/2024',
                type: 'prescription',
                date: '2024-01-15',
                size: '245 KB'
            },
            {
                id: 2,
                name: 'Rapport de consultation',
                type: 'report',
                date: '2024-01-10',
                size: '1.2 MB'
            }
        ]

        this.displayDocuments(documents)
    }

    displayDocuments(documents) {
        const container = document.querySelector('.documents-list') || document.getElementById('documents-list')
        if (!container) return

        if (documents.length === 0) {
            container.innerHTML = '<p class="no-data">Aucun document disponible.</p>'
            return
        }

        container.innerHTML = documents.map(doc => `
            <div class="document-card" data-id="${doc.id}">
                <div class="document-icon">
                    <i class="fas fa-file-${this.getDocumentIcon(doc.type)}"></i>
                </div>
                <div class="document-info">
                    <h4>${doc.name}</h4>
                    <p>Date: ${this.formatDate(doc.date)} | Taille: ${doc.size}</p>
                </div>
                <div class="document-actions">
                    <button onclick="profileManager.downloadDocument(${doc.id})" class="btn-primary">Télécharger</button>
                </div>
            </div>
        `).join('')
    }

    initializeImageUpload() {
        const uploadInput = document.getElementById('profileImageUpload')
        const profileImage = document.querySelector('.profile-image img')
        
        if (uploadInput) {
            uploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0]
                if (file) {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                        if (profileImage) {
                            profileImage.src = e.target.result
                        }
                    }
                    reader.readAsDataURL(file)
                }
            })
        }
    }

    initializeForms() {
        // Formulaire de profil
        const profileForm = document.getElementById('profileForm')
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault()
                this.saveProfile()
            })
        }

        // Formulaire de paramètres
        const settingsForm = document.getElementById('settingsForm')
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault()
                this.saveSettings()
            })
        }
    }

    saveProfile() {
        // Simuler la sauvegarde du profil
        this.showMessage('Profil mis à jour avec succès !', 'success')
    }

    saveSettings() {
        // Simuler la sauvegarde des paramètres
        this.showMessage('Paramètres mis à jour avec succès !', 'success')
    }

    loadSettings() {
        // Charger les paramètres utilisateur
        const settings = {
            notifications: true,
            emailReminders: true,
            smsReminders: false,
            language: 'fr'
        }

        Object.keys(settings).forEach(key => {
            const element = document.getElementById(key)
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = settings[key]
                } else {
                    element.value = settings[key]
                }
            }
        })
    }

    // Méthodes utilitaires
    formatDate(dateString) {
        const date = new Date(dateString)
        return date.toLocaleDateString('fr-FR')
    }

    getStatusText(status) {
        const statusMap = {
            'confirmed': 'Confirmé',
            'pending': 'En attente',
            'cancelled': 'Annulé',
            'completed': 'Terminé'
        }
        return statusMap[status] || status
    }

    getDocumentIcon(type) {
        const iconMap = {
            'prescription': 'medical',
            'report': 'alt',
            'image': 'image',
            'pdf': 'pdf'
        }
        return iconMap[type] || 'alt'
    }

    showMessage(message, type = 'info') {
        // Créer ou utiliser un conteneur de messages existant
        let messageContainer = document.getElementById('messageContainer')
        if (!messageContainer) {
            messageContainer = document.createElement('div')
            messageContainer.id = 'messageContainer'
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 300px;
            `
            document.body.appendChild(messageContainer)
        }

        const messageElement = document.createElement('div')
        messageElement.className = `message message-${type}`
        messageElement.style.cssText = `
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 4px;
            animation: slideIn 0.3s ease-out;
        `
        messageElement.textContent = message

        messageContainer.appendChild(messageElement)

        // Supprimer le message après 5 secondes
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement)
            }
        }, 5000)
    }

    // Méthodes d'action
    viewAppointment(id) {
        console.log('Voir rendez-vous:', id)
        this.showMessage('Fonctionnalité en cours de développement', 'info')
    }

    cancelAppointment(id) {
        if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
            console.log('Annuler rendez-vous:', id)
            this.showMessage('Rendez-vous annulé', 'success')
            this.loadAppointments()
        }
    }

    downloadDocument(id) {
        console.log('Télécharger document:', id)
        this.showMessage('Téléchargement en cours...', 'info')
    }
}

// Initialisation globale
let profileManager

document.addEventListener('DOMContentLoaded', function() {
    profileManager = new ProfileManager()
})

// Exposer globalement pour les boutons
window.profileManager = profileManager

// Ajouter les styles CSS nécessaires
const style = document.createElement('style')
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .no-data {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 20px;
    }
    
    .appointment-card, .document-card {
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .appointment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }
    
    .status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
    }
    
    .status-confirmed { background: #d4edda; color: #155724; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-cancelled { background: #f8d7da; color: #721c24; }
    
    .appointment-actions, .document-actions {
        margin-top: 10px;
        display: flex;
        gap: 10px;
    }
    
    .btn-primary, .btn-secondary, .btn-danger {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    }
    
    .btn-primary { background: #007bff; color: white; }
    .btn-secondary { background: #6c757d; color: white; }
    .btn-danger { background: #dc3545; color: white; }
    
    .document-card {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .document-icon {
        font-size: 24px;
        color: #007bff;
    }
    
    .document-info {
        flex: 1;
    }
    
    .document-info h4 {
        margin: 0 0 5px 0;
    }
    
    .document-info p {
        margin: 0;
        color: #666;
        font-size: 14px;
    }
`
document.head.appendChild(style)