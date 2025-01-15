document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
    initializeConversations();
    initializeChat();
    initializeResponsive();
});

// Gérer la recherche
function initializeSearch() {
    const searchInput = document.querySelector('.search-bar input');
    const conversations = document.querySelectorAll('.conversation-item');

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        conversations.forEach(conversation => {
            const name = conversation.querySelector('h3').textContent.toLowerCase();
            const preview = conversation.querySelector('.conversation-preview').textContent.toLowerCase();
            const shouldShow = name.includes(searchTerm) || preview.includes(searchTerm);
            conversation.style.display = shouldShow ? 'flex' : 'none';
        });
    });
}

// Gérer les conversations
function initializeConversations() {
    const conversations = document.querySelectorAll('.conversation-item');

    conversations.forEach(conversation => {
        conversation.addEventListener('click', () => {
            // Retirer la classe active des autres conversations
            conversations.forEach(c => c.classList.remove('active'));
            // Ajouter la classe active à la conversation cliquée
            conversation.classList.add('active');
            // Retirer la classe unread
            conversation.classList.remove('unread');
            // Charger la conversation
            loadConversation(conversation);
            // En mobile, masquer la liste des conversations
            if (window.innerWidth <= 768) {
                document.querySelector('.conversations-list').classList.remove('active');
            }
        });
    });
}

// Charger une conversation
function loadConversation(conversationElement) {
    const name = conversationElement.querySelector('h3').textContent;
    const avatar = conversationElement.querySelector('img').src;

    // Mettre à jour l'en-tête du chat
    document.querySelector('.chat-contact h3').textContent = name;
    document.querySelector('.contact-avatar').src = avatar;

    // Simuler le chargement des messages
    // En production, cela ferait une requête API
    console.log(`Chargement de la conversation avec ${name}`);
}

// Gérer le chat
function initializeChat() {
    const textarea = document.querySelector('.chat-input textarea');
    const sendButton = document.querySelector('.send-message');

    // Ajuster automatiquement la hauteur du textarea
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    });

    // Envoyer avec Entrée (sauf si Shift est pressé)
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Envoyer avec le bouton
    sendButton.addEventListener('click', sendMessage);

    // Gérer le bouton de fichier
    document.querySelector('.chat-input .fa-paperclip').parentElement.addEventListener('click', () => {
        // Simuler l'ouverture d'un sélecteur de fichier
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf,.doc,.docx';
        input.click();

        input.addEventListener('change', () => {
            if (input.files.length > 0) {
                // Simuler l'envoi du fichier
                // En production, cela ferait une requête API
                alert(`Fichier "${input.files[0].name}" joint avec succès`);
            }
        });
    });
}

// Envoyer un message
function sendMessage() {
    const textarea = document.querySelector('.chat-input textarea');
    const message = textarea.value.trim();

    if (message) {
        // Créer l'élément de message
        const messageElement = document.createElement('div');
        messageElement.className = 'message sent';
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
                <span class="message-time">${getCurrentTime()}</span>
            </div>
        `;

        // Ajouter le message à la conversation
        const chatMessages = document.querySelector('.chat-messages');
        chatMessages.appendChild(messageElement);
        
        // Scroller en bas
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Réinitialiser le textarea
        textarea.value = '';
        textarea.style.height = '40px';

        // Simuler une réponse après 1-3 secondes
        simulateResponse();
    }
}

// Simuler une réponse
function simulateResponse() {
    const responses = [
        "D'accord, je note.",
        "Merci pour votre message.",
        "Je reviens vers vous rapidement.",
        "C'est bien noté.",
        "Parfait, merci."
    ];

    setTimeout(() => {
        const response = responses[Math.floor(Math.random() * responses.length)];
        const messageElement = document.createElement('div');
        messageElement.className = 'message received';
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${response}</p>
                <span class="message-time">${getCurrentTime()}</span>
            </div>
        `;

        const chatMessages = document.querySelector('.chat-messages');
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000 + Math.random() * 2000);
}

// Obtenir l'heure actuelle
function getCurrentTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Gérer le responsive
function initializeResponsive() {
    if (window.innerWidth <= 768) {
        const backButton = document.createElement('button');
        backButton.className = 'btn-icon';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
        backButton.addEventListener('click', () => {
            document.querySelector('.conversations-list').classList.add('active');
        });

        document.querySelector('.chat-header').prepend(backButton);
    }
} 