document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    initializeConversations();
    initializeChat();
    initializeSearch();
    initializeNewMessage();
    initializeNotifications();
    initializeCallSystem();
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

// Initialisation des conversations
function initializeConversations() {
    const conversationsContainer = document.querySelector('.conversations');
    
    // Exemple de conversations
    const conversations = [
        {
            id: 1,
            name: 'Dr. Smith',
            avatar: 'images/default-avatar.png',
            lastMessage: 'Bonjour, comment allez-vous ?',
            timestamp: '10:30',
            unread: 2,
            online: true
        },
        {
            id: 2,
            name: 'Dr. Johnson',
            avatar: 'images/default-avatar.png',
            lastMessage: 'Votre prochain rendez-vous est confirmé',
            timestamp: 'Hier',
            unread: 0,
            online: false
        }
    ];

    conversationsContainer.innerHTML = conversations.map(conv => `
        <div class="conversation-item ${conv.unread ? 'unread' : ''}" data-id="${conv.id}">
            <div class="conversation-avatar">
                <img src="${conv.avatar}" alt="${conv.name}">
                ${conv.online ? '<span class="status-dot"></span>' : ''}
            </div>
            <div class="conversation-content">
                <div class="conversation-header">
                    <h4>${conv.name}</h4>
                    <span class="timestamp">${conv.timestamp}</span>
                </div>
                <p class="last-message">${conv.lastMessage}</p>
                ${conv.unread ? `<span class="unread-badge">${conv.unread}</span>` : ''}
            </div>
        </div>
    `).join('');

    // Gestion des clics sur les conversations
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            loadChat(item.dataset.id);
        });
    });
}

// Initialisation du chat
function initializeChat() {
    const textarea = document.querySelector('.message-input textarea');
    const sendButton = document.querySelector('.input-actions button:last-child');

    // Auto-resize du textarea
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    });

    // Envoi avec Entrée (Shift+Entrée pour nouvelle ligne)
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Envoi avec le bouton
    sendButton.addEventListener('click', sendMessage);
}

// Chargement des messages d'une conversation
function loadChat(conversationId) {
    const messagesContainer = document.querySelector('.chat-messages');
    
    // Exemple de messages
    const messages = [
        {
            id: 1,
            sender: 'Dr. Smith',
            content: 'Bonjour, comment allez-vous ?',
            timestamp: '10:30',
            type: 'received'
        },
        {
            id: 2,
            sender: 'Moi',
            content: 'Bonjour Dr. Smith, je vais bien merci. Et vous ?',
            timestamp: '10:31',
            type: 'sent'
        }
    ];

    messagesContainer.innerHTML = messages.map(msg => `
        <div class="message ${msg.type}">
            <div class="message-content">
                <p>${msg.content}</p>
                <span class="message-time">${msg.timestamp}</span>
            </div>
        </div>
    `).join('');

    // Scroll vers le bas
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Envoi d'un message
function sendMessage() {
    const textarea = document.querySelector('.message-input textarea');
    const content = textarea.value.trim();
    
    if (!content) return;

    const messagesContainer = document.querySelector('.chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message sent';
    messageElement.innerHTML = `
        <div class="message-content">
            <p>${content}</p>
            <span class="message-time">${formatTime(new Date())}</span>
        </div>
    `;

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    textarea.value = '';
    textarea.style.height = 'auto';
}

// Recherche de conversations
function initializeSearch() {
    const searchInput = document.querySelector('.search-bar input');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.conversation-item').forEach(item => {
            const name = item.querySelector('h4').textContent.toLowerCase();
            const message = item.querySelector('.last-message').textContent.toLowerCase();
            const match = name.includes(query) || message.includes(query);
            item.style.display = match ? 'flex' : 'none';
        });
    });
}

// Nouvelle conversation
function initializeNewMessage() {
    const newMessageBtn = document.querySelector('.new-message-btn');
    
    newMessageBtn.addEventListener('click', () => {
        // Ici, vous pourriez ouvrir une modale pour sélectionner un contact
        alert('Fonctionnalité en cours de développement');
    });
}

// Utilitaires
function formatTime(date) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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

// Système de notifications
function initializeNotifications() {
    // Demander la permission pour les notifications
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
    
    // Simuler la réception de notifications
    setInterval(() => {
        checkNewMessages();
    }, 10000); // Vérifier toutes les 10 secondes
}

function checkNewMessages() {
    // Simulation de nouveaux messages
    const hasNewMessage = Math.random() > 0.7;
    
    if (hasNewMessage && Notification.permission === 'granted') {
        const notification = new Notification('Nouveau message', {
            icon: 'images/default-avatar.png',
            body: 'Vous avez reçu un nouveau message'
        });
        
        notification.onclick = function() {
            window.focus();
            this.close();
        };
        
        updateUnreadCount();
    }
}

function updateUnreadCount() {
    const unreadBadge = document.querySelector('.unread-badge');
    if (unreadBadge) {
        const currentCount = parseInt(unreadBadge.textContent);
        unreadBadge.textContent = currentCount + 1;
    }
}

// Système d'appels audio/vidéo
function initializeCallSystem() {
    const audioCallBtn = document.querySelector('.chat-actions button:first-child');
    const videoCallBtn = document.querySelector('.chat-actions button:nth-child(2)');
    
    audioCallBtn.addEventListener('click', () => initiateCall('audio'));
    videoCallBtn.addEventListener('click', () => initiateCall('video'));
}

function initiateCall(type) {
    const contactName = document.querySelector('.chat-contact h3').textContent;
    
    // Simuler un appel
    const modal = document.createElement('div');
    modal.className = 'call-modal';
    modal.innerHTML = `
        <div class="call-content">
            <img src="images/default-avatar.png" alt="${contactName}">
            <h3>${type === 'audio' ? 'Appel audio' : 'Appel vidéo'} avec ${contactName}</h3>
            <p class="call-status">Appel en cours...</p>
            <div class="call-actions">
                <button class="end-call" title="Raccrocher">
                    <i class="fas fa-phone-slash"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gérer la fin d'appel
    modal.querySelector('.end-call').addEventListener('click', () => {
        modal.remove();
    });
    
    // Simuler une réponse après 3 secondes
    setTimeout(() => {
        if (document.contains(modal)) {
            modal.querySelector('.call-status').textContent = 
                'L\'utilisateur n\'est pas disponible pour le moment';
            setTimeout(() => modal.remove(), 2000);
        }
    }, 3000);
} 