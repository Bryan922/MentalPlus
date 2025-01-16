import { auth, db } from './firebase-config.js';
import { ref, set, get, remove, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Récupérer tous les clients (pour l'admin)
export async function getAllClients() {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        // Vérifier que l'utilisateur est un admin
        const adminSnapshot = await get(ref(db, `users/${user.uid}`));
        const adminData = adminSnapshot.val();
        
        if (adminData.role !== 'super_admin' && adminData.role !== 'admin') {
            throw new Error('Non autorisé à voir les clients');
        }

        const usersRef = ref(db, 'users');
        const clientsQuery = query(usersRef, orderByChild('role'), equalTo('client'));
        const snapshot = await get(clientsQuery);
        
        const clients = [];
        snapshot.forEach((child) => {
            clients.push({ id: child.key, ...child.val() });
        });
        
        return clients;
    } catch (error) {
        console.error('Erreur lors de la récupération des clients:', error);
        throw error;
    }
}

// Récupérer un client spécifique
export async function getClient(clientId) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        const userSnapshot = await get(ref(db, `users/${user.uid}`));
        const userData = userSnapshot.val();
        
        // Vérifier les autorisations
        if (user.uid !== clientId && userData.role !== 'super_admin' && userData.role !== 'admin') {
            throw new Error('Non autorisé à voir ce client');
        }

        const clientSnapshot = await get(ref(db, `users/${clientId}`));
        if (!clientSnapshot.exists()) throw new Error('Client non trouvé');
        
        const clientData = clientSnapshot.val();
        if (clientData.role !== 'client') throw new Error('L\'utilisateur n\'est pas un client');
        
        return { id: clientId, ...clientData };
    } catch (error) {
        console.error('Erreur lors de la récupération du client:', error);
        throw error;
    }
}

// Mettre à jour un client
export async function updateClient(clientId, updateData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        // Vérifier les autorisations
        const userSnapshot = await get(ref(db, `users/${user.uid}`));
        const userData = userSnapshot.val();
        
        if (user.uid !== clientId && userData.role !== 'super_admin' && userData.role !== 'admin') {
            throw new Error('Non autorisé à modifier ce client');
        }

        const clientRef = ref(db, `users/${clientId}`);
        const clientSnapshot = await get(clientRef);
        
        if (!clientSnapshot.exists()) throw new Error('Client non trouvé');
        const clientData = clientSnapshot.val();
        
        if (clientData.role !== 'client') throw new Error('L\'utilisateur n\'est pas un client');

        // Empêcher la modification du rôle
        if (updateData.role && updateData.role !== 'client') {
            throw new Error('Impossible de modifier le rôle du client');
        }

        await set(clientRef, {
            ...clientData,
            ...updateData,
            role: 'client', // Forcer le rôle client
            updatedAt: new Date().toISOString(),
            updatedBy: user.uid
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du client:', error);
        throw error;
    }
}

// Désactiver un client
export async function deactivateClient(clientId) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        // Vérifier que l'utilisateur est un admin
        const adminSnapshot = await get(ref(db, `users/${user.uid}`));
        const adminData = adminSnapshot.val();
        
        if (adminData.role !== 'super_admin' && adminData.role !== 'admin') {
            throw new Error('Non autorisé à désactiver des clients');
        }

        const clientRef = ref(db, `users/${clientId}`);
        const clientSnapshot = await get(clientRef);
        
        if (!clientSnapshot.exists()) throw new Error('Client non trouvé');
        const clientData = clientSnapshot.val();
        
        if (clientData.role !== 'client') throw new Error('L\'utilisateur n\'est pas un client');

        await set(clientRef, {
            ...clientData,
            status: 'inactive',
            deactivatedAt: new Date().toISOString(),
            deactivatedBy: user.uid
        });
    } catch (error) {
        console.error('Erreur lors de la désactivation du client:', error);
        throw error;
    }
}

// Rechercher des clients
export async function searchClients(searchTerm) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        // Vérifier que l'utilisateur est un admin
        const adminSnapshot = await get(ref(db, `users/${user.uid}`));
        const adminData = adminSnapshot.val();
        
        if (adminData.role !== 'super_admin' && adminData.role !== 'admin') {
            throw new Error('Non autorisé à rechercher des clients');
        }

        const usersRef = ref(db, 'users');
        const clientsQuery = query(usersRef, orderByChild('role'), equalTo('client'));
        const snapshot = await get(clientsQuery);
        
        const clients = [];
        snapshot.forEach((child) => {
            const clientData = child.val();
            // Recherche dans le nom, email ou téléphone
            if (clientData.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                clientData.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                clientData.phone?.includes(searchTerm)) {
                clients.push({ id: child.key, ...clientData });
            }
        });
        
        return clients;
    } catch (error) {
        console.error('Erreur lors de la recherche des clients:', error);
        throw error;
    }
}

// Obtenir les statistiques des clients
export async function getClientStats() {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        // Vérifier que l'utilisateur est un admin
        const adminSnapshot = await get(ref(db, `users/${user.uid}`));
        const adminData = adminSnapshot.val();
        
        if (adminData.role !== 'super_admin' && adminData.role !== 'admin') {
            throw new Error('Non autorisé à voir les statistiques');
        }

        const usersRef = ref(db, 'users');
        const clientsQuery = query(usersRef, orderByChild('role'), equalTo('client'));
        const snapshot = await get(clientsQuery);
        
        let totalClients = 0;
        let activeClients = 0;
        let newClientsThisMonth = 0;
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        snapshot.forEach((child) => {
            const clientData = child.val();
            totalClients++;
            
            if (clientData.status !== 'inactive') {
                activeClients++;
            }
            
            const createdAt = new Date(clientData.createdAt);
            if (createdAt >= startOfMonth) {
                newClientsThisMonth++;
            }
        });
        
        return {
            totalClients,
            activeClients,
            newClientsThisMonth,
            inactiveClients: totalClients - activeClients
        };
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        throw error;
    }
} 