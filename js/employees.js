import { auth, db } from './firebase-config.js';
import { ref, set, get, remove, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Ajouter un employé
export async function addEmployee(employeeData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        // Vérifier que l'utilisateur est un admin
        const adminSnapshot = await get(ref(db, `users/${user.uid}`));
        const adminData = adminSnapshot.val();
        
        if (adminData.role !== 'super_admin' && adminData.role !== 'admin') {
            throw new Error('Non autorisé à ajouter des employés');
        }

        // Vérifier si l'email existe déjà
        const usersRef = ref(db, 'users');
        const emailQuery = query(usersRef, orderByChild('email'), equalTo(employeeData.email));
        const emailSnapshot = await get(emailQuery);
        
        if (emailSnapshot.exists()) {
            throw new Error('Un utilisateur avec cet email existe déjà');
        }

        // Créer l'employé
        const employeeRef = ref(db, `users/${employeeData.uid}`);
        const employee = {
            ...employeeData,
            role: 'employee',
            createdAt: new Date().toISOString(),
            createdBy: user.uid
        };

        await set(employeeRef, employee);
        return employee;
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'employé:', error);
        throw error;
    }
}

// Récupérer tous les employés
export async function getAllEmployees() {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        const usersRef = ref(db, 'users');
        const employeesQuery = query(usersRef, orderByChild('role'), equalTo('employee'));
        const snapshot = await get(employeesQuery);
        
        const employees = [];
        snapshot.forEach((child) => {
            employees.push({ id: child.key, ...child.val() });
        });
        
        return employees;
    } catch (error) {
        console.error('Erreur lors de la récupération des employés:', error);
        throw error;
    }
}

// Mettre à jour un employé
export async function updateEmployee(employeeId, updateData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        // Vérifier que l'utilisateur est un admin
        const adminSnapshot = await get(ref(db, `users/${user.uid}`));
        const adminData = adminSnapshot.val();
        
        if (adminData.role !== 'super_admin' && adminData.role !== 'admin') {
            throw new Error('Non autorisé à modifier les employés');
        }

        const employeeRef = ref(db, `users/${employeeId}`);
        const snapshot = await get(employeeRef);
        const employee = snapshot.val();

        if (!employee) throw new Error('Employé non trouvé');
        if (employee.role !== 'employee') throw new Error('L\'utilisateur n\'est pas un employé');

        await set(employeeRef, {
            ...employee,
            ...updateData,
            updatedAt: new Date().toISOString(),
            updatedBy: user.uid
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'employé:', error);
        throw error;
    }
}

// Supprimer un employé
export async function deleteEmployee(employeeId) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Utilisateur non connecté');

        // Vérifier que l'utilisateur est un admin
        const adminSnapshot = await get(ref(db, `users/${user.uid}`));
        const adminData = adminSnapshot.val();
        
        if (adminData.role !== 'super_admin' && adminData.role !== 'admin') {
            throw new Error('Non autorisé à supprimer des employés');
        }

        const employeeRef = ref(db, `users/${employeeId}`);
        const snapshot = await get(employeeRef);
        const employee = snapshot.val();

        if (!employee) throw new Error('Employé non trouvé');
        if (employee.role !== 'employee') throw new Error('L\'utilisateur n\'est pas un employé');

        await remove(employeeRef);
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'employé:', error);
        throw error;
    }
} 