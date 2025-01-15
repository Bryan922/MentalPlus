document.addEventListener('DOMContentLoaded', function() {
    // Vérification de l'authentification admin
    checkAdminAuth();

    // Éléments du DOM
    const addEmployeeBtn = document.querySelector('.add-employee-btn');
    const employeeModal = document.getElementById('employeeModal');
    const employeeForm = document.getElementById('employeeForm');
    const cancelBtn = employeeModal.querySelector('.cancel-btn');
    const searchInput = document.querySelector('.search-input');
    const filterSelect = document.querySelector('.filter-select');

    // Événements
    addEmployeeBtn.addEventListener('click', openModal);
    cancelBtn.addEventListener('click', closeModal);
    employeeForm.addEventListener('submit', handleEmployeeSubmit);
    searchInput.addEventListener('input', filterEmployees);
    filterSelect.addEventListener('change', filterEmployees);

    // Charger la liste des employés
    loadEmployees();
});

function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        window.location.href = 'auth.html';
    }
}

function openModal() {
    const modal = document.getElementById('employeeModal');
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('employeeModal');
    modal.classList.remove('active');
    document.getElementById('employeeForm').reset();
}

function handleEmployeeSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const employeeData = {
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
        status: formData.get('status')
    };

    // Sauvegarder l'employé
    saveEmployee(employeeData);
    closeModal();
}

function saveEmployee(employeeData) {
    // Récupérer la liste existante des employés
    let employees = JSON.parse(localStorage.getItem('employees') || '[]');
    
    // Ajouter le nouvel employé
    employees.push({
        id: Date.now(),
        ...employeeData,
        createdAt: new Date().toISOString()
    });

    // Sauvegarder la liste mise à jour
    localStorage.setItem('employees', JSON.stringify(employees));
    
    // Recharger la liste
    loadEmployees();
}

function loadEmployees() {
    const employees = JSON.parse(localStorage.getItem('employees') || '[]');
    const tbody = document.getElementById('employeesList');
    tbody.innerHTML = '';

    employees.forEach(employee => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${employee.name}</td>
            <td>${employee.email}</td>
            <td>${employee.role}</td>
            <td>
                <span class="status-badge ${employee.status}">
                    ${employee.status}
                </span>
            </td>
            <td>
                <button class="edit-btn" data-id="${employee.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${employee.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Ajouter les événements pour les boutons d'édition et de suppression
    addEmployeeEventListeners();
}

function addEmployeeEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editEmployee(btn.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteEmployee(btn.dataset.id));
    });
}

function editEmployee(id) {
    const employees = JSON.parse(localStorage.getItem('employees') || '[]');
    const employee = employees.find(emp => emp.id === parseInt(id));
    
    if (employee) {
        const form = document.getElementById('employeeForm');
        form.name.value = employee.name;
        form.email.value = employee.email;
        form.role.value = employee.role;
        form.status.value = employee.status;
        
        openModal();
    }
}

function deleteEmployee(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
        let employees = JSON.parse(localStorage.getItem('employees') || '[]');
        employees = employees.filter(emp => emp.id !== parseInt(id));
        localStorage.setItem('employees', JSON.stringify(employees));
        loadEmployees();
    }
}

function filterEmployees() {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase();
    const roleFilter = document.querySelector('.filter-select').value;
    const employees = JSON.parse(localStorage.getItem('employees') || '[]');
    const tbody = document.getElementById('employeesList');
    tbody.innerHTML = '';

    employees
        .filter(employee => {
            const matchesSearch = employee.name.toLowerCase().includes(searchTerm) ||
                                employee.email.toLowerCase().includes(searchTerm);
            const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
            return matchesSearch && matchesRole;
        })
        .forEach(employee => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${employee.name}</td>
                <td>${employee.email}</td>
                <td>${employee.role}</td>
                <td>
                    <span class="status-badge ${employee.status}">
                        ${employee.status}
                    </span>
                </td>
                <td>
                    <button class="edit-btn" data-id="${employee.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${employee.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    addEmployeeEventListeners();
} 