import { auth, db } from './firebase-config.js';
import { getAllAppointments, updateAppointment, cancelAppointment } from './appointments.js';
import { getAllClients, getClientStats, searchClients } from './clients.js';
import { getAllEmployees, addEmployee, updateEmployee, deleteEmployee } from './employees.js';
import { getUnreadMessages, markMessageAsRead } from './messages.js';

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Vérifier l'authentification et les droits d'admin
        const user = auth.currentUser;
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }

        const userSnapshot = await get(ref(db, `users/${user.uid}`));
        const userData = userSnapshot.val();
        
        if (userData.role !== 'super_admin' && userData.role !== 'admin') {
            alert('Accès non autorisé');
            window.location.href = 'index.html';
            return;
        }

        // Initialiser les différentes sections
        initializeDashboard();
        initializeAppointments();
        initializeClients();
        initializeEmployees();
        initializeMessages();
        setupNavigation();
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        alert('Erreur lors du chargement de l\'interface admin');
    }
});

// Initialiser le tableau de bord
async function initializeDashboard() {
    try {
        const stats = await getClientStats();
        const appointments = await getAllAppointments();
        const unreadMessages = await getUnreadMessages();
        
        // Afficher les statistiques
        document.getElementById('total-clients').textContent = stats.totalClients;
        document.getElementById('active-clients').textContent = stats.activeClients;
        document.getElementById('new-clients').textContent = stats.newClientsThisMonth;
        
        // Afficher les rendez-vous du jour
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointments.filter(apt => apt.date === today);
        
        const appointmentsList = document.getElementById('today-appointments');
        appointmentsList.innerHTML = todayAppointments.length === 0 ? 
            '<p>Aucun rendez-vous aujourd\'hui</p>' :
            todayAppointments.map(apt => `
                <div class="appointment-card">
                    <h4>${apt.time} - ${apt.clientName || apt.clientEmail}</h4>
                    <p>${apt.type}</p>
                    ${apt.notes ? `<p class="notes">${apt.notes}</p>` : ''}
                    <div class="actions">
                        <button onclick="handleUpdateStatus('${apt.id}', 'completed')">Terminé</button>
                        <button onclick="handleCancelAppointment('${apt.id}')">Annuler</button>
                    </div>
                </div>
            `).join('');
            
        // Afficher les messages non lus
        const messagesList = document.getElementById('unread-messages');
        messagesList.innerHTML = unreadMessages.length === 0 ?
            '<p>Aucun message non lu</p>' :
            unreadMessages.map(msg => `
                <div class="message-card" onclick="handleReadMessage('${msg.id}')">
                    <p class="sender">${msg.senderName || msg.senderEmail}</p>
                    <p class="preview">${msg.content.substring(0, 50)}...</p>
                    <p class="time">${new Date(msg.timestamp).toLocaleString()}</p>
                </div>
            `).join('');
    } catch (error) {
        console.error('Erreur dashboard:', error);
    }
}

// Initialiser la section des rendez-vous
async function initializeAppointments() {
    try {
        const appointments = await getAllAppointments();
        const appointmentsList = document.getElementById('appointments-list');
        
        appointmentsList.innerHTML = appointments
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(apt => `
                <div class="appointment-card ${apt.status}">
                    <div class="appointment-header">
                        <h4>${new Date(apt.date).toLocaleDateString('fr-FR')} à ${apt.time}</h4>
                        <span class="status ${apt.status}">${apt.status}</span>
                    </div>
                    <div class="appointment-details">
                        <p><strong>Client:</strong> ${apt.clientName || apt.clientEmail}</p>
                        <p><strong>Type:</strong> ${apt.type}</p>
                        ${apt.notes ? `<p><strong>Notes:</strong> ${apt.notes}</p>` : ''}
                    </div>
                    <div class="appointment-actions">
                        ${apt.status === 'pending' ? `
                            <button onclick="handleUpdateStatus('${apt.id}', 'completed')">Marquer comme terminé</button>
                            <button onclick="handleCancelAppointment('${apt.id}')">Annuler</button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
    } catch (error) {
        console.error('Erreur rendez-vous:', error);
    }
}

// Initialiser la section des clients
async function initializeClients() {
    try {
        const clients = await getAllClients();
        const clientsList = document.getElementById('clients-list');
        
        clientsList.innerHTML = clients.map(client => `
            <div class="client-card">
                <div class="client-info">
                    <h4>${client.name}</h4>
                    <p>${client.email}</p>
                    ${client.phone ? `<p>${client.phone}</p>` : ''}
                </div>
                <div class="client-actions">
                    <button onclick="showClientDetails('${client.id}')">Détails</button>
                    <button onclick="showClientAppointments('${client.id}')">Rendez-vous</button>
                </div>
            </div>
        `).join('');

        // Ajouter la recherche
        const searchInput = document.getElementById('client-search');
        if (searchInput) {
            searchInput.addEventListener('input', async (e) => {
                const searchTerm = e.target.value;
                if (searchTerm.length >= 2) {
                    const results = await searchClients(searchTerm);
                    clientsList.innerHTML = results.map(client => `
                        <div class="client-card">
                            <div class="client-info">
                                <h4>${client.name}</h4>
                                <p>${client.email}</p>
                                ${client.phone ? `<p>${client.phone}</p>` : ''}
                            </div>
                            <div class="client-actions">
                                <button onclick="showClientDetails('${client.id}')">Détails</button>
                                <button onclick="showClientAppointments('${client.id}')">Rendez-vous</button>
                            </div>
                        </div>
                    `).join('');
                }
            });
        }
    } catch (error) {
        console.error('Erreur clients:', error);
    }
}

// Initialiser la section des employés
async function initializeEmployees() {
    try {
        const employees = await getAllEmployees();
        const employeesList = document.getElementById('employees-list');
        
        employeesList.innerHTML = employees.map(employee => `
            <div class="employee-card">
                <div class="employee-info">
                    <h4>${employee.name}</h4>
                    <p>${employee.email}</p>
                    <p>Statut: ${employee.status || 'Actif'}</p>
                </div>
                <div class="employee-actions">
                    <button onclick="showEmployeeForm('${employee.id}')">Modifier</button>
                    <button onclick="handleDeleteEmployee('${employee.id}')">Supprimer</button>
                </div>
            </div>
        `).join('');

        // Initialiser le formulaire d'ajout d'employé
        const addEmployeeForm = document.getElementById('add-employee-form');
        if (addEmployeeForm) {
            addEmployeeForm.addEventListener('submit', handleAddEmployee);
        }
    } catch (error) {
        console.error('Erreur employés:', error);
    }
}

// Initialiser la section des messages
async function initializeMessages() {
    try {
        const unreadMessages = await getUnreadMessages();
        const messagesList = document.getElementById('messages-list');
        
        messagesList.innerHTML = unreadMessages.map(msg => `
            <div class="message-card ${msg.read ? '' : 'unread'}" onclick="handleReadMessage('${msg.id}')">
                <div class="message-header">
                    <h4>${msg.senderName || msg.senderEmail}</h4>
                    <span class="time">${new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <div class="message-content">
                    <p>${msg.content}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur messages:', error);
    }
}

// Gérer la navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav a');
    const sections = document.querySelectorAll('.admin-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            sections.forEach(section => {
                section.classList.remove('active');
            });
            navLinks.forEach(link => {
                link.classList.remove('active');
            });
            
            document.getElementById(targetId).classList.add('active');
            link.classList.add('active');
        });
    });
}

// Fonctions de gestion des événements
async function handleUpdateStatus(appointmentId, status) {
    try {
        await updateAppointment(appointmentId, { status });
        initializeAppointments();
        initializeDashboard();
    } catch (error) {
        alert('Erreur lors de la mise à jour du statut: ' + error.message);
    }
}

async function handleCancelAppointment(appointmentId) {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;
    
    try {
        await cancelAppointment(appointmentId);
        initializeAppointments();
        initializeDashboard();
    } catch (error) {
        alert('Erreur lors de l\'annulation du rendez-vous: ' + error.message);
    }
}

async function handleReadMessage(messageId) {
    try {
        await markMessageAsRead(messageId);
        initializeMessages();
        initializeDashboard();
    } catch (error) {
        alert('Erreur lors du marquage du message: ' + error.message);
    }
}

async function handleAddEmployee(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const employeeData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            status: 'active'
        };

        await addEmployee(employeeData);
        alert('Employé ajouté avec succès');
        e.target.reset();
        initializeEmployees();
    } catch (error) {
        alert('Erreur lors de l\'ajout de l\'employé: ' + error.message);
    }
}

// Exporter les fonctions nécessaires
window.handleUpdateStatus = handleUpdateStatus;
window.handleCancelAppointment = handleCancelAppointment;
window.handleReadMessage = handleReadMessage;
window.showClientDetails = showClientDetails;
window.showClientAppointments = showClientAppointments;
window.showEmployeeForm = showEmployeeForm;
window.handleDeleteEmployee = handleDeleteEmployee; 