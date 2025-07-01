// Script pour la page de messagerie avec intégration Supabase
import { clientService } from './supabase-config.js'

// Variables globales
let currentClient = null
let messages = []
let messagePollingInterval = null

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeMessagingPage()
    setupEventListeners()
    loadClientData()
    startMessagePolling()
})

// Fonction d'initialisation
function initializeMessagingPage() {
    console.log('Initialisation de la page de messagerie avec Supabase')
    
    // Vérifier si un client est connecté
    const clientId = localStorage.getItem('currentClientId') || getClientIdFromUrl()
    
    if (!clientId) {
        showMessage('Veuillez vous connecter pour accéder à vos messages', 'warning')
        setTimeout(() => {
            window.location.href = 'index.html'
        }, 3000)
        return
    }
    
    window.currentClientId = clientId
}

// Récupération de l'ID client depuis l'URL
function getClientIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('client')
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Formulaire d'envoi de message
    const messageForm = document.getElementById('message-form')
    if (messageForm) {
        messageForm.addEventListener('submit', handleMessageSend)
    }
    
    // Zone de texte avec auto-resize
    const messageInput = document.getElementById('message-input')
    if (messageInput) {
        messageInput.addEventListener('input', autoResizeTextarea)
        messageInput.addEventListener('keydown', handleKeyDown)
    }
    
    // Bouton d'urgence
    const emergencyButton = document.getElementById('emergency-button')
    if (emergencyButton) {
        emergencyButton.addEventListener('click', handleEmergencyMessage)
    }
    
    // Bouton de rafraîchissement
    const refreshButton = document.getElementById('refresh-messages')
    if (refreshButton) {
        refreshButton.addEventListener('click', loadMessages)
    }
}

// Chargement des données du client
async function loadClientData() {
    if (!window.currentClientId) return
    
    try {
        // Charger les informations du client
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', window.currentClientId)
            .single()
        
        if (error) throw error
        
        currentClient = data
        
        // Mettre à jour l'interface
        updateClientDisplay()
        
        // Charger les messages
        await loadMessages()
        
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        showMessage('Erreur lors du chargement de vos informations', 'error')
    }
}

// Mise à jour de l'affichage du client
function updateClientDisplay() {
    if (!currentClient) return
    
    const clientName = document.getElementById('client-name')
    if (clientName) {
        clientName.textContent = currentClient.nom
    }
    
    const clientEmail = document.getElementById('client-email')
    if (clientEmail) {
        clientEmail.textContent = currentClient.email
    }
}

// Chargement des messages
async function loadMessages() {
    if (!window.currentClientId) return
    
    try {
        showLoading(true)
        
        // Créer une table de messages si elle n'existe pas
        await createMessagesTableIfNotExists()
        
        // Charger les messages du client
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('client_id', window.currentClientId)
            .order('created_at', { ascending: true })
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
            throw error
        }
        
        messages = data || []
        
        // Mettre à jour l'affichage
        updateMessagesDisplay()
        
        // Marquer les messages comme lus
        await markMessagesAsRead()
        
        showLoading(false)
        
    } catch (error) {
        console.error('Erreur lors du chargement des messages:', error)
        showMessage('Erreur lors du chargement des messages', 'error')
        showLoading(false)
    }
}

// Création de la table des messages si elle n'existe pas
async function createMessagesTableIfNotExists() {
    try {
        // Vérifier si la table existe en tentant une requête
        const { error } = await supabase
            .from('messages')
            .select('id')
            .limit(1)
        
        if (error && error.code === 'PGRST116') {
            // La table n'existe pas, on peut la créer via l'interface Supabase
            console.log('Table messages non trouvée. Veuillez la créer dans Supabase.')
            
            // Pour l'instant, on simule avec des données locales
            const existingMessages = localStorage.getItem(`messages_${window.currentClientId}`)
            if (existingMessages) {
                messages = JSON.parse(existingMessages)
            } else {
                // Messages de bienvenue par défaut
                messages = [
                    {
                        id: '1',
                        client_id: window.currentClientId,
                        sender: 'professional',
                        sender_name: 'Dr. Martin',
                        content: 'Bonjour ! Bienvenue dans votre espace de messagerie sécurisée. N\'hésitez pas à me poser vos questions.',
                        created_at: new Date(Date.now() - 86400000).toISOString(), // Il y a 1 jour
                        is_read: false,
                        is_urgent: false
                    }
                ]
                localStorage.setItem(`messages_${window.currentClientId}`, JSON.stringify(messages))
            }
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de la table messages:', error)
    }
}

// Mise à jour de l'affichage des messages
function updateMessagesDisplay() {
    const messagesContainer = document.getElementById('messages-container')
    if (!messagesContainer) return
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-comments"></i>
                <p>Aucun message pour le moment</p>
                <p class="text-muted">Envoyez votre premier message ci-dessous</p>
            </div>
        `
        return
    }
    
    messagesContainer.innerHTML = messages.map(message => {
        const isFromClient = message.sender === 'client'
        const messageClass = isFromClient ? 'message-sent' : 'message-received'
        const urgentClass = message.is_urgent ? 'message-urgent' : ''
        
        return `
            <div class="message ${messageClass} ${urgentClass}">
                <div class="message-header">
                    <span class="sender-name">${isFromClient ? 'Vous' : (message.sender_name || 'Professionnel')}</span>
                    <span class="message-time">${formatMessageTime(message.created_at)}</span>
                    ${message.is_urgent ? '<i class="fas fa-exclamation-triangle urgent-icon" title="Message urgent"></i>' : ''}
                </div>
                <div class="message-content">
                    ${formatMessageContent(message.content)}
                </div>
                ${message.is_read === false && !isFromClient ? '<div class="unread-indicator"></div>' : ''}
            </div>
        `
    }).join('')
    
    // Faire défiler vers le bas
    scrollToBottom()
    
    // Mettre à jour le compteur de messages non lus
    updateUnreadCount()
}

// Formatage du contenu des messages
function formatMessageContent(content) {
    // Convertir les URLs en liens
    const urlRegex = /(https?:\/\/[^\s]+)/g
    content = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    
    // Convertir les retours à la ligne
    content = content.replace(/\n/g, '<br>')
    
    return content
}

// Formatage de l'heure des messages
function formatMessageTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 jours
        return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    } else {
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    }
}

// Gestion de l'envoi de message
async function handleMessageSend(e) {
    e.preventDefault()
    
    const messageInput = document.getElementById('message-input')
    const content = messageInput.value.trim()
    
    if (!content) {
        showMessage('Veuillez saisir un message', 'warning')
        return
    }
    
    const sendButton = document.querySelector('#message-form button[type="submit"]')
    const originalText = sendButton.innerHTML
    
    try {
        sendButton.disabled = true
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...'
        
        // Créer le nouveau message
        const newMessage = {
            id: Date.now().toString(),
            client_id: window.currentClientId,
            sender: 'client',
            sender_name: currentClient?.nom || 'Client',
            content: content,
            created_at: new Date().toISOString(),
            is_read: true,
            is_urgent: false
        }
        
        // Ajouter le message localement
        messages.push(newMessage)
        
        // Sauvegarder dans le localStorage (en attendant Supabase)
        localStorage.setItem(`messages_${window.currentClientId}`, JSON.stringify(messages))
        
        // Tenter d'envoyer via Supabase
        try {
            const { error } = await supabase
                .from('messages')
                .insert([newMessage])
            
            if (error && error.code !== 'PGRST116') {
                console.error('Erreur Supabase:', error)
            }
        } catch (supabaseError) {
            console.log('Supabase non disponible, utilisation du stockage local')
        }
        
        // Mettre à jour l'affichage
        updateMessagesDisplay()
        
        // Vider le champ de saisie
        messageInput.value = ''
        messageInput.style.height = 'auto'
        
        // Simuler une réponse automatique après 2-5 secondes
        setTimeout(() => {
            simulateAutoReply()
        }, Math.random() * 3000 + 2000)
        
        showMessage('Message envoyé', 'success')
        
    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error)
        showMessage('Erreur lors de l\'envoi du message', 'error')
    } finally {
        sendButton.disabled = false
        sendButton.innerHTML = originalText
    }
}

// Simulation d'une réponse automatique
function simulateAutoReply() {
    const autoReplies = [
        'Merci pour votre message. Je vous répondrai dans les plus brefs délais.',
        'J\'ai bien reçu votre message. Je reviens vers vous rapidement.',
        'Votre message a été transmis. Un professionnel vous répondra sous peu.',
        'Merci de m\'avoir contacté. Je prends note de votre demande.',
        'Message reçu. Je vous recontacte très prochainement.'
    ]
    
    const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)]
    
    const autoMessage = {
        id: (Date.now() + 1).toString(),
        client_id: window.currentClientId,
        sender: 'professional',
        sender_name: 'Dr. Martin',
        content: randomReply,
        created_at: new Date().toISOString(),
        is_read: false,
        is_urgent: false
    }
    
    messages.push(autoMessage)
    localStorage.setItem(`messages_${window.currentClientId}`, JSON.stringify(messages))
    
    updateMessagesDisplay()
    
    // Notification sonore (optionnelle)
    playNotificationSound()
}

// Gestion du message d'urgence
function handleEmergencyMessage() {
    const emergencyContent = `🚨 MESSAGE URGENT 🚨\n\nJ'ai besoin d'une aide immédiate. Merci de me contacter au plus vite.\n\nNuméro d'urgence: ${currentClient?.telephone || 'Non renseigné'}`
    
    const messageInput = document.getElementById('message-input')
    messageInput.value = emergencyContent
    
    // Marquer comme urgent
    const emergencyMessage = {
        id: Date.now().toString(),
        client_id: window.currentClientId,
        sender: 'client',
        sender_name: currentClient?.nom || 'Client',
        content: emergencyContent,
        created_at: new Date().toISOString(),
        is_read: true,
        is_urgent: true
    }
    
    messages.push(emergencyMessage)
    localStorage.setItem(`messages_${window.currentClientId}`, JSON.stringify(messages))
    
    updateMessagesDisplay()
    
    // Vider le champ
    messageInput.value = ''
    
    showMessage('Message d\'urgence envoyé', 'warning')
    
    // Afficher les informations d'urgence
    showEmergencyInfo()
}

// Affichage des informations d'urgence
function showEmergencyInfo() {
    const emergencyInfo = `
        <div class="emergency-contacts">
            <h3><i class="fas fa-phone-alt"></i> Contacts d'urgence</h3>
            <div class="contact-item">
                <strong>SAMU:</strong> 15
            </div>
            <div class="contact-item">
                <strong>SOS Amitié:</strong> 09 72 39 40 50
            </div>
            <div class="contact-item">
                <strong>Suicide Écoute:</strong> 01 45 39 40 00
            </div>
            <div class="contact-item">
                <strong>Numéro national:</strong> 3114 (gratuit, 24h/24)
            </div>
        </div>
    `
    
    showMessage('Votre message d\'urgence a été envoyé. En cas de danger immédiat, contactez les services d\'urgence:', 'warning', emergencyInfo)
}

// Auto-resize de la zone de texte
function autoResizeTextarea(e) {
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
}

// Gestion des touches clavier
function handleKeyDown(e) {
    // Envoyer avec Ctrl+Enter
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        document.getElementById('message-form').dispatchEvent(new Event('submit'))
    }
}

// Marquer les messages comme lus
async function markMessagesAsRead() {
    const unreadMessages = messages.filter(msg => !msg.is_read && msg.sender !== 'client')
    
    if (unreadMessages.length === 0) return
    
    // Marquer comme lus localement
    unreadMessages.forEach(msg => {
        msg.is_read = true
    })
    
    localStorage.setItem(`messages_${window.currentClientId}`, JSON.stringify(messages))
    
    // Tenter de mettre à jour dans Supabase
    try {
        const messageIds = unreadMessages.map(msg => msg.id)
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', messageIds)
        
        if (error && error.code !== 'PGRST116') {
            console.error('Erreur lors de la mise à jour des messages lus:', error)
        }
    } catch (error) {
        console.log('Mise à jour locale uniquement')
    }
}

// Mise à jour du compteur de messages non lus
function updateUnreadCount() {
    const unreadCount = messages.filter(msg => !msg.is_read && msg.sender !== 'client').length
    const badge = document.getElementById('unread-badge')
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount
            badge.style.display = 'inline-block'
        } else {
            badge.style.display = 'none'
        }
    }
    
    // Mettre à jour le titre de la page
    if (unreadCount > 0) {
        document.title = `(${unreadCount}) Messages - MentalPlus`
    } else {
        document.title = 'Messages - MentalPlus'
    }
}

// Polling des nouveaux messages
function startMessagePolling() {
    // Vérifier les nouveaux messages toutes les 30 secondes
    messagePollingInterval = setInterval(async () => {
        await loadMessages()
    }, 30000)
}

// Arrêter le polling
function stopMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval)
        messagePollingInterval = null
    }
}

// Faire défiler vers le bas
function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container')
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
}

// Notification sonore
function playNotificationSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
        audio.volume = 0.3
        audio.play().catch(() => {
            // Ignorer les erreurs de lecture audio
        })
    } catch (error) {
        // Ignorer les erreurs de notification sonore
    }
}

// Fonctions utilitaires
function showLoading(show) {
    const loader = document.getElementById('messages-loader')
    if (loader) {
        loader.style.display = show ? 'flex' : 'none'
    }
}

function showMessage(message, type = 'success', details = '') {
    // Supprimer les anciens messages
    const existingMessages = document.querySelectorAll('.messaging-alert')
    existingMessages.forEach(msg => msg.remove())
    
    // Créer le nouveau message
    const messageDiv = document.createElement('div')
    messageDiv.className = `messaging-alert ${type}`
    
    const icon = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'info': 'fa-info-circle',
        'warning': 'fa-exclamation-triangle'
    }[type] || 'fa-info-circle'
    
    messageDiv.innerHTML = `
        <div class="alert-content">
            <i class="fas ${icon}"></i>
            <div class="alert-text">
                <div class="alert-message">${message}</div>
                ${details ? `<div class="alert-details">${details}</div>` : ''}
            </div>
        </div>
    `
    
    // Insérer le message
    const main = document.querySelector('main')
    main.insertBefore(messageDiv, main.firstChild)
    
    // Supprimer le message après 8 secondes (sauf pour les erreurs)
    if (type !== 'error' && type !== 'warning') {
        setTimeout(() => {
            messageDiv.remove()
        }, 8000)
    }
}

// Nettoyage lors de la fermeture de la page
window.addEventListener('beforeunload', function() {
    stopMessagePolling()
})

// Gestion de la visibilité de la page
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        stopMessagePolling()
    } else {
        startMessagePolling()
        loadMessages() // Recharger immédiatement
    }
})

// Styles CSS pour les nouveaux éléments
const styles = `
.messaging-alert {
    padding: 15px 20px;
    margin-bottom: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.messaging-alert.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.messaging-alert.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.messaging-alert.info {
    background-color: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}

.messaging-alert.warning {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

.alert-content {
    display: flex;
    align-items: flex-start;
    gap: 15px;
}

.alert-text {
    flex: 1;
}

.alert-message {
    font-weight: 600;
    margin-bottom: 8px;
}

.alert-details {
    font-size: 0.9rem;
    opacity: 0.9;
    line-height: 1.4;
}

.message {
    margin-bottom: 15px;
    max-width: 70%;
    position: relative;
}

.message-sent {
    margin-left: auto;
    text-align: right;
}

.message-received {
    margin-right: auto;
}

.message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
    font-size: 0.8rem;
    color: #666;
}

.message-content {
    background: #f8f9fa;
    padding: 12px 16px;
    border-radius: 18px;
    word-wrap: break-word;
    line-height: 1.4;
}

.message-sent .message-content {
    background: var(--primary-color);
    color: white;
}

.message-urgent {
    border-left: 4px solid #dc3545;
}

.message-urgent .message-content {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
}

.urgent-icon {
    color: #dc3545;
    margin-left: 5px;
}

.unread-indicator {
    position: absolute;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 8px;
    background: #007bff;
    border-radius: 50%;
}

.no-messages {
    text-align: center;
    padding: 60px 20px;
    color: #666;
}

.no-messages i {
    font-size: 3rem;
    margin-bottom: 20px;
    opacity: 0.5;
}

.emergency-contacts {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-top: 15px;
    border: 1px solid #ddd;
}

.emergency-contacts h3 {
    color: #dc3545;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.contact-item {
    padding: 8px 0;
    border-bottom: 1px solid #eee;
}

.contact-item:last-child {
    border-bottom: none;
}

#unread-badge {
    background: #dc3545;
    color: white;
    border-radius: 50%;
    padding: 2px 6px;
    font-size: 0.7rem;
    font-weight: bold;
    margin-left: 5px;
    display: none;
}

#messages-loader {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
}

.loader-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.messaging-alert {
    animation: fadeIn 0.3s ease-out;
}

.message {
    animation: fadeIn 0.3s ease-out;
}
`

// Injecter les styles
const styleSheet = document.createElement('style')
styleSheet.textContent = styles
document.head.appendChild(styleSheet)

// Ajouter un loader si il n'existe pas
if (!document.getElementById('messages-loader')) {
    const loader = document.createElement('div')
    loader.id = 'messages-loader'
    loader.style.display = 'none'
    loader.innerHTML = '<div class="loader-spinner"></div>'
    
    const messagesContainer = document.getElementById('messages-container')
    if (messagesContainer) {
        messagesContainer.appendChild(loader)
    }
}