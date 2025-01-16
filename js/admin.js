// Vérification de l'authentification admin
document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('isAdmin')) {
        window.location.href = 'auth.html';
        return;
    }
    loadCalendar();
    loadAppointments();
    loadClients();
    loadEmployees();
    initChat();
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
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    document.getElementById('current-month').textContent = new Date(currentYear, currentMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    const calendarGrid = document.getElementById('calendar-grid');
    calendarGrid.innerHTML = '';
    
    // En-têtes des jours
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    days.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-header-cell';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Jours du mois
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = i;
        if (i === today.getDate() && currentMonth === today.getMonth()) {
            dayCell.classList.add('today');
        }
        dayCell.onclick = () => showDayAppointments(new Date(currentYear, currentMonth, i));
        calendarGrid.appendChild(dayCell);
    }
}

function previousMonth() {
    // Implémenter le changement de mois précédent
}

function nextMonth() {
    // Implémenter le changement de mois suivant
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
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${message.sender === 'admin' ? 'sent' : 'received'}`;
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

function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    
    if (content) {
        const message = {
            content,
            sender: 'admin',
            timestamp: new Date().toISOString()
        };
        
        const messages = JSON.parse(localStorage.getItem('messages') || '[]');
        messages.push(message);
        localStorage.setItem('messages', JSON.stringify(messages));
        
        input.value = '';
        initChat();
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