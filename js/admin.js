// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    console.log('Current user:', user); // Debug

    if (!user || !user.isAdmin) {
        alert('Vous devez être connecté en tant qu\'administrateur pour accéder à cette page.');
        window.location.href = 'auth.html';
        return;
    }

    // Si l'utilisateur est admin, initialiser l'interface
    initializeNavigation();
    loadStats();
    loadTodayAppointments();
    initializeCalendar();
    loadAdmins();
});

// Vérification des droits d'accès
function checkAdminAccess() {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    console.log('Checking admin access for user:', user); // Debug

    if (!user) return false;
    if (user.isSuperAdmin) return true; // Super admin a accès à tout
    if (!user.isAdmin) return false;

    // Vérifier les permissions spécifiques
    const currentSection = document.querySelector('.admin-section.active')?.classList[1];
    console.log('Current section:', currentSection); // Debug
    
    if (currentSection && user.permissions) {
        const hasAccess = user.permissions.includes(currentSection);
        console.log('Has access to section:', hasAccess); // Debug
        return hasAccess;
    }

    return true; // Par défaut, autoriser l'accès si pas de permissions spécifiques
}

// Navigation
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            console.log('Navigating to section:', section); // Debug
            
            if (!checkSectionAccess(section)) {
                alert('Vous n\'avez pas accès à cette section');
                return;
            }
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.remove('active');
            });
            document.querySelector(`.${section}-section`).classList.add('active');
        });
    });
}

function checkSectionAccess(section) {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    console.log('Checking section access:', section, 'for user:', user); // Debug

    if (!user) return false;
    if (user.isSuperAdmin) return true;
    if (!user.isAdmin) return false;
    
    return !user.permissions || user.permissions.includes(section);
}

// Gestion des administrateurs
function loadAdmins() {
    const adminsList = document.querySelector('.admins-list');
    if (!adminsList) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const admins = users.filter(user => user.isAdmin);

    adminsList.innerHTML = '';
    admins.forEach(admin => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <div class="admin-avatar">
                <i class="fas fa-user-shield"></i>
            </div>
            <div class="admin-info">
                <h4>${admin.name}</h4>
                <p>${admin.email}</p>
                <div class="admin-permissions">
                    ${admin.permissions ? admin.permissions.map(perm => `
                        <span class="permission-badge">${formatPermission(perm)}</span>
                    `).join('') : '<span class="permission-badge">Accès total</span>'}
                </div>
            </div>
            <div class="admin-actions">
                <button class="btn-action btn-edit" onclick="editAdmin('${admin.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                ${!admin.isSuperAdmin ? `
                    <button class="btn-action btn-cancel" onclick="deleteAdmin('${admin.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        `;
        adminsList.appendChild(card);
    });
}

function formatPermission(permission) {
    const permissions = {
        dashboard: 'Tableau de bord',
        appointments: 'Rendez-vous',
        clients: 'Clients',
        employees: 'Employés',
        admins: 'Administrateurs'
    };
    return permissions[permission] || permission;
}

function showAddAdminModal() {
    const template = document.getElementById('add-admin-modal');
    const modal = template.content.cloneNode(true);
    document.body.appendChild(modal);

    const form = document.getElementById('add-admin-form');
    form.addEventListener('submit', handleAddAdmin);
}

async function handleAddAdmin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const permissions = [];
    formData.getAll('permissions').forEach(perm => permissions.push(perm));

    const newAdmin = {
        id: Date.now().toString(),
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        isAdmin: true,
        permissions: permissions.length > 0 ? permissions : null,
        createdAt: new Date().toISOString()
    };

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(user => user.email === newAdmin.email)) {
        alert('Un utilisateur existe déjà avec cet email');
        return;
    }

    users.push(newAdmin);
    localStorage.setItem('users', JSON.stringify(users));
    
    closeModal();
    loadAdmins();
    alert('Administrateur ajouté avec succès !');
}

function editAdmin(adminId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const admin = users.find(user => user.id === adminId);
    if (!admin) return;

    const template = document.getElementById('add-admin-modal');
    const modal = template.content.cloneNode(true);
    
    // Pré-remplir le formulaire
    const form = modal.querySelector('#add-admin-form');
    form.querySelector('[name="name"]').value = admin.name;
    form.querySelector('[name="email"]').value = admin.email;
    form.querySelector('[name="email"]').disabled = true;
    
    // Cocher les permissions existantes
    if (admin.permissions) {
        admin.permissions.forEach(perm => {
            const checkbox = form.querySelector(`[value="${perm}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }

    // Changer le titre et le bouton
    modal.querySelector('h3').textContent = 'Modifier l\'administrateur';
    modal.querySelector('button[type="submit"]').textContent = 'Enregistrer';

    // Gérer la soumission
    form.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const permissions = [];
        formData.getAll('permissions').forEach(perm => permissions.push(perm));

        const updatedAdmin = {
            ...admin,
            name: formData.get('name'),
            permissions: permissions.length > 0 ? permissions : null,
            updatedAt: new Date().toISOString()
        };

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const index = users.findIndex(user => user.id === adminId);
        users[index] = updatedAdmin;
        localStorage.setItem('users', JSON.stringify(users));
        
        closeModal();
        loadAdmins();
        alert('Administrateur modifié avec succès !');
    };

    document.body.appendChild(modal);
}

function deleteAdmin(adminId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet administrateur ?')) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.filter(user => user.id !== adminId);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    loadAdmins();
    alert('Administrateur supprimé avec succès !');
}

// ... Le reste du code existant ... 