// Vérification de l'authentification admin
document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('isAdmin')) {
        window.location.href = 'auth.html';
        return;
    }
    initializeNavigation();
    initializeButtons();
    loadEmployeeList();
    loadClientList();
    loadCalendar();
    initializeChat();
});

// Gestion de la navigation
function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`[href="#${sectionId}"]`).classList.add('active');
}

// Gestion du calendrier
function loadCalendar() {
    const calendar = document.querySelector('.calendar-grid');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Récupérer tous les rendez-vous
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    console.log('Rendez-vous chargés:', appointments); // Debug
    
    // Mettre à jour l'affichage du mois courant
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    document.querySelector('.calendar-header h3').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Générer le calendrier
    renderCalendar(currentMonth, currentYear, appointments);
}

function renderCalendar(month, year, appointments) {
    const calendar = document.querySelector('.calendar-grid');
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay() || 7; // Convertir dimanche (0) en 7
    const monthLength = lastDay.getDate();
    
    let calendarHTML = '';
    
    // En-têtes des jours
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    days.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Remplir les jours
    let day = 1;
    const totalCells = Math.ceil((startingDay - 1 + monthLength) / 7) * 7;
    
    for (let i = 0; i < totalCells; i++) {
        if (i < startingDay - 1 || day > monthLength) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        } else {
            const date = new Date(year, month, day);
            const dayAppointments = appointments.filter(apt => {
                const aptDate = new Date(apt.date);
                return aptDate.getFullYear() === year &&
                       aptDate.getMonth() === month &&
                       aptDate.getDate() === day;
            });
            
            const isToday = date.toDateString() === new Date().toDateString();
            
            calendarHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${dayAppointments.length > 0 ? 'has-appointments' : ''}"
                     onclick="showDayAppointments(${year}, ${month}, ${day})">
                    ${day}
                    ${dayAppointments.length > 0 ? `<span class="appointment-count">${dayAppointments.length}</span>` : ''}
                </div>`;
            day++;
        }
    }
    
    calendar.innerHTML = calendarHTML;
}

function showDayAppointments(year, month, day) {
    const date = new Date(year, month, day);
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const dayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.getFullYear() === year &&
               aptDate.getMonth() === month &&
               aptDate.getDate() === day;
    });
    
    const appointmentsList = document.querySelector('.appointments-list');
    appointmentsList.innerHTML = `<h3>Rendez-vous du ${date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })}</h3>`;
    
    if (dayAppointments.length === 0) {
        appointmentsList.innerHTML += '<p class="no-appointments">Aucun rendez-vous pour cette date</p>';
        return;
    }
    
    // Trier les rendez-vous par heure
    dayAppointments.sort((a, b) => a.time.localeCompare(b.time));
    
    dayAppointments.forEach(apt => {
        appointmentsList.innerHTML += `
            <div class="appointment-card">
                <div class="appointment-header">
                    <h4>${apt.prenom} ${apt.nom}</h4>
                    <span class="appointment-time">${apt.time}</span>
                </div>
                <div class="appointment-details">
                    <p><i class="fas fa-envelope"></i> ${apt.clientEmail}</p>
                    <p><i class="fas fa-tag"></i> ${apt.domaine.name}</p>
                    ${apt.notes ? `<p><i class="fas fa-comment"></i> ${apt.notes}</p>` : ''}
                </div>
                <div class="appointment-actions">
                    <button class="btn-action" onclick="editAppointment('${apt.id}')">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn-action" onclick="cancelAppointment('${apt.id}')">
                        <i class="fas fa-times"></i> Annuler
                    </button>
                </div>
            </div>
        `;
    });
}

// Fonctions de navigation du calendrier
function previousMonth() {
    const header = document.querySelector('.calendar-header h3');
    const [month, year] = header.textContent.split(' ');
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const currentMonthIndex = monthNames.indexOf(month);
    
    let newMonth = currentMonthIndex - 1;
    let newYear = parseInt(year);
    
    if (newMonth < 0) {
        newMonth = 11;
        newYear--;
    }
    
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    renderCalendar(newMonth, newYear, appointments);
    header.textContent = `${monthNames[newMonth]} ${newYear}`;
}

function nextMonth() {
    const header = document.querySelector('.calendar-header h3');
    const [month, year] = header.textContent.split(' ');
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const currentMonthIndex = monthNames.indexOf(month);
    
    let newMonth = currentMonthIndex + 1;
    let newYear = parseInt(year);
    
    if (newMonth > 11) {
        newMonth = 0;
        newYear++;
    }
    
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    renderCalendar(newMonth, newYear, appointments);
    header.textContent = `${monthNames[newMonth]} ${newYear}`;
}

// Fonction de chargement des clients
function loadAllClients() {
    const clients = JSON.parse(localStorage.getItem('users') || '[]')
        .filter(user => user.role === 'client');
    
    const clientsList = document.querySelector('.clients-list');
    if (!clientsList) return;
    
    clientsList.innerHTML = '';
    clients.forEach(client => {
        clientsList.innerHTML += `
            <div class="client-card">
                <div class="client-info">
                    <h4>${client.name}</h4>
                    <p><i class="fas fa-envelope"></i> ${client.email}</p>
                    ${client.phone ? `<p><i class="fas fa-phone"></i> ${client.phone}</p>` : ''}
                </div>
                <div class="client-actions">
                    <button class="btn-action" onclick="viewClientDetails(${client.id})">
                        <i class="fas fa-eye"></i> Voir détails
                    </button>
                </div>
            </div>
        `;
    });
}

// Fonction d'initialisation des actions employés
function initializeEmployeeActions() {
    const addEmployeeBtn = document.querySelector('.add-employee-btn');
    if (addEmployeeBtn) {
        addEmployeeBtn.classList.add('btn-action');
        addEmployeeBtn.innerHTML = '<i class="fas fa-plus"></i> Ajouter un employé';
        addEmployeeBtn.onclick = showAddEmployeeModal;
    }
}

// Gestion des rendez-vous
function loadAppointments() {
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const appointmentsList = document.getElementById('appointments-list');
    appointmentsList.innerHTML = '';
    
    appointments.forEach(appointment => {
        const appointmentCard = document.createElement('div');
        appointmentCard.className = 'appointment-card';
        appointmentCard.innerHTML = `
            <div class="appointment-header">
                <h4>${appointment.clientName}</h4>
                <span class="appointment-date">${new Date(appointment.date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="appointment-details">
                <p><i class="fas fa-clock"></i> ${appointment.time}</p>
                <p><i class="fas fa-tag"></i> ${appointment.type}</p>
            </div>
        `;
        appointmentsList.appendChild(appointmentCard);
    });
}

// Gestion des clients
function loadClients() {
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const clientsList = document.getElementById('clients-list');
    clientsList.innerHTML = '';
    
    clients.forEach(client => {
        const clientCard = document.createElement('div');
        clientCard.className = 'client-card';
        clientCard.innerHTML = `
            <div class="client-info">
                <h4>${client.name}</h4>
                <p><i class="fas fa-envelope"></i> ${client.email}</p>
                <p><i class="fas fa-phone"></i> ${client.phone}</p>
            </div>
            <div class="client-actions">
                <button onclick="viewClientFile(${client.id})">
                    <i class="fas fa-folder-open"></i> Dossier
                </button>
                <button onclick="startChat(${client.id})">
                    <i class="fas fa-comments"></i> Message
                </button>
            </div>
        `;
        clientsList.appendChild(clientCard);
    });
}

function filterClients(query) {
    const clients = document.querySelectorAll('.client-card');
    clients.forEach(client => {
        const name = client.querySelector('h4').textContent.toLowerCase();
        if (name.includes(query.toLowerCase())) {
            client.style.display = 'flex';
        } else {
            client.style.display = 'none';
        }
    });
}

// Gestion des employés
function loadEmployees() {
    const employees = JSON.parse(localStorage.getItem('employees') || '[]');
    const employeesList = document.getElementById('employees-list');
    employeesList.innerHTML = '';
    
    employees.forEach(employee => {
        const employeeCard = document.createElement('div');
        employeeCard.className = 'employee-card';
        employeeCard.innerHTML = `
            <div class="employee-info">
                <h4>${employee.name}</h4>
                <p><i class="fas fa-envelope"></i> ${employee.email}</p>
                <p><i class="fas fa-user-tag"></i> ${employee.role}</p>
            </div>
            <div class="employee-status ${employee.status}">
                ${employee.status}
            </div>
            <div class="employee-actions">
                <button onclick="editEmployee(${employee.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteEmployee(${employee.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        employeesList.appendChild(employeeCard);
    });
}

// Gestion du chat
function initChat() {
    loadChatRecipients();
    loadMessages();
}

function loadChatRecipients() {
    const select = document.getElementById('chat-recipient');
    const employeesGroup = select.querySelector('optgroup[label="Employés"]');
    const clientsGroup = select.querySelector('optgroup[label="Clients"]');
    
    // Charger les employés
    const employees = JSON.parse(localStorage.getItem('employees') || '[]');
    employeesGroup.innerHTML = employees.map(emp => 
        `<option value="emp_${emp.id}">${emp.name} (${emp.role})</option>`
    ).join('');
    
    // Charger les clients
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    clientsGroup.innerHTML = clients.map(client => 
        `<option value="client_${client.id}">${client.name}</option>`
    ).join('');
}

function loadMessages() {
    const recipientId = document.getElementById('chat-recipient').value;
    if (!recipientId) {
        document.getElementById('chat-messages').innerHTML = 
            '<div class="chat-placeholder">Sélectionnez un destinataire pour voir les messages</div>';
        return;
    }
    
    const messages = JSON.parse(localStorage.getItem('messages') || '[]')
        .filter(msg => msg.recipientId === recipientId || msg.senderId === recipientId);
    
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${message.senderId === 'admin' ? 'sent' : 'received'}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${message.content}</p>
                <span class="message-time">${new Date(message.timestamp).toLocaleTimeString('fr-FR')}</span>
            </div>
        `;
        chatMessages.appendChild(messageElement);
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function changeRecipient() {
    loadMessages();
}

function sendMessage() {
    const recipientId = document.getElementById('chat-recipient').value;
    if (!recipientId) {
        alert('Veuillez sélectionner un destinataire');
        return;
    }
    
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    
    if (content) {
        const message = {
            content,
            senderId: 'admin',
            recipientId,
            timestamp: new Date().toISOString()
        };
        
        const messages = JSON.parse(localStorage.getItem('messages') || '[]');
        messages.push(message);
        localStorage.setItem('messages', JSON.stringify(messages));
        
        input.value = '';
        loadMessages();
    }
}

// Gestion des paramètres
function saveSettings() {
    // Implémenter la sauvegarde des paramètres
    alert('Paramètres enregistrés avec succès !');
}

// Fonction de déconnexion
function logout() {
    localStorage.removeItem('isAdmin');
    window.location.href = 'index.html';
}

function initializeButtons() {
    // Bouton d'ajout d'employé
    const addEmployeeBtn = document.querySelector('.add-employee-btn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', () => {
            const btn = addEmployeeBtn;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ajout...';
            
            setTimeout(() => {
                showAddEmployeeModal();
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-plus"></i> Ajouter un employé';
            }, 500);
        });
    }

    // Boutons d'action des employés
    document.querySelectorAll('.employee-actions button').forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const employeeId = e.target.closest('.employee-card').dataset.id;
            
            button.disabled = true;
            const originalContent = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            setTimeout(() => {
                handleEmployeeAction(action, employeeId);
                button.disabled = false;
                button.innerHTML = originalContent;
            }, 500);
        });
    });

    // Boutons d'envoi de message
    const sendMessageBtn = document.querySelector('.chat-input button');
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', () => {
            const input = document.querySelector('.chat-input input');
            const message = input.value.trim();
            const recipient = document.querySelector('.chat-recipient-select').value;
            
            if (message && recipient) {
                sendMessageBtn.disabled = true;
                sendMessageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                
                setTimeout(() => {
                    sendMessage(message, recipient);
                    input.value = '';
                    sendMessageBtn.disabled = false;
                    sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
                }, 500);
            }
        });
    }
}

function showAddEmployeeModal() {
    // Implémentation du modal d'ajout d'employé
    console.log('Affichage du modal d\'ajout d\'employé');
}

function handleEmployeeAction(action, employeeId) {
    // Implémentation des actions sur les employés
    console.log(`Action ${action} sur l'employé ${employeeId}`);
}

function sendMessage(message, recipient) {
    // Implémentation de l'envoi de message
    console.log(`Message envoyé à ${recipient}: ${message}`);
    
    // Ajouter le message à la conversation
    const chatMessages = document.querySelector('.chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message sent';
    messageElement.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
            <span class="message-time">${new Date().toLocaleTimeString()}</span>
        </div>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
} 