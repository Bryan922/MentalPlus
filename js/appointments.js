import { auth, db } from './firebase-config.js';
import { ref, set, get, push, remove, query, orderByChild } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Créer un rendez-vous
export async function createAppointment(appointmentData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Vous devez être connecté pour prendre un rendez-vous');

        const appointmentRef = push(ref(db, 'appointments'));
        const appointment = {
            ...appointmentData,
            id: appointmentRef.key,
            clientId: user.uid,
            clientEmail: user.email,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        await set(appointmentRef, appointment);
        return appointment;
    } catch (error) {
        console.error('Erreur lors de la création du rendez-vous:', error);
        throw error;
    }
}

// Récupérer les rendez-vous d'un client
export async function getClientAppointments() {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        const appointmentsRef = ref(db, 'appointments');
        const appointmentsQuery = query(appointmentsRef, orderByChild('clientId'), equalTo(user.uid));
        const snapshot = await get(appointmentsQuery);
        
        const appointments = [];
        snapshot.forEach((child) => {
            appointments.push({ id: child.key, ...child.val() });
        });
        
        return appointments;
    } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        throw error;
    }
}

// Récupérer tous les rendez-vous (pour l'admin)
export async function getAllAppointments() {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        const userSnapshot = await get(ref(db, `users/${user.uid}`));
        const userData = userSnapshot.val();
        
        if (userData.role !== 'super_admin' && userData.role !== 'admin') {
            throw new Error('Accès non autorisé');
        }

        const snapshot = await get(ref(db, 'appointments'));
        const appointments = [];
        snapshot.forEach((child) => {
            appointments.push({ id: child.key, ...child.val() });
        });
        
        return appointments;
    } catch (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        throw error;
    }
}

// Mettre à jour un rendez-vous
export async function updateAppointment(appointmentId, updateData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        const appointmentRef = ref(db, `appointments/${appointmentId}`);
        const snapshot = await get(appointmentRef);
        const appointment = snapshot.val();

        if (!appointment) throw new Error('Rendez-vous non trouvé');

        const userSnapshot = await get(ref(db, `users/${user.uid}`));
        const userData = userSnapshot.val();

        if (appointment.clientId !== user.uid && userData.role !== 'super_admin' && userData.role !== 'admin') {
            throw new Error('Non autorisé à modifier ce rendez-vous');
        }

        await set(appointmentRef, {
            ...appointment,
            ...updateData,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du rendez-vous:', error);
        throw error;
    }
}

// Annuler un rendez-vous
export async function cancelAppointment(appointmentId) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        const appointmentRef = ref(db, `appointments/${appointmentId}`);
        const snapshot = await get(appointmentRef);
        const appointment = snapshot.val();

        if (!appointment) throw new Error('Rendez-vous non trouvé');

        const userSnapshot = await get(ref(db, `users/${user.uid}`));
        const userData = userSnapshot.val();

        if (appointment.clientId !== user.uid && userData.role !== 'super_admin' && userData.role !== 'admin') {
            throw new Error('Non autorisé à annuler ce rendez-vous');
        }

        await set(appointmentRef, {
            ...appointment,
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erreur lors de l\'annulation du rendez-vous:', error);
        throw error;
    }
} 