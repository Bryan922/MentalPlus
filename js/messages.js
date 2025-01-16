import { auth, db } from './firebase-config.js';
import { ref, set, get, push, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Envoyer un message
export async function sendMessage(recipientId, content) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Vous devez être connecté pour envoyer un message');

        const messageRef = push(ref(db, 'messages'));
        const message = {
            id: messageRef.key,
            senderId: user.uid,
            recipientId: recipientId,
            content: content,
            timestamp: new Date().toISOString(),
            read: false
        };

        await set(messageRef, message);
        return message;
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        throw error;
    }
}

// Récupérer les messages d'une conversation
export async function getConversation(otherUserId) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        const messagesRef = ref(db, 'messages');
        const snapshot = await get(messagesRef);
        
        const messages = [];
        snapshot.forEach((child) => {
            const message = child.val();
            if ((message.senderId === user.uid && message.recipientId === otherUserId) ||
                (message.senderId === otherUserId && message.recipientId === user.uid)) {
                messages.push({ id: child.key, ...message });
            }
        });
        
        return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        throw error;
    }
}

// Marquer un message comme lu
export async function markMessageAsRead(messageId) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        const messageRef = ref(db, `messages/${messageId}`);
        const snapshot = await get(messageRef);
        const message = snapshot.val();

        if (!message) throw new Error('Message non trouvé');
        if (message.recipientId !== user.uid) throw new Error('Non autorisé');

        await set(messageRef, {
            ...message,
            read: true,
            readAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erreur lors du marquage du message:', error);
        throw error;
    }
}

// Récupérer les messages non lus
export async function getUnreadMessages() {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        const messagesRef = ref(db, 'messages');
        const messagesQuery = query(
            messagesRef, 
            orderByChild('recipientId'), 
            equalTo(user.uid)
        );
        
        const snapshot = await get(messagesQuery);
        const unreadMessages = [];
        
        snapshot.forEach((child) => {
            const message = child.val();
            if (!message.read) {
                unreadMessages.push({ id: child.key, ...message });
            }
        });
        
        return unreadMessages;
    } catch (error) {
        console.error('Erreur lors de la récupération des messages non lus:', error);
        throw error;
    }
} 