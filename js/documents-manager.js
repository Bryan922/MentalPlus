// Gestionnaire des documents et paramètres
import { supabase } from './supabase-config.js';
import { supabaseAuth } from './supabase-auth.js';

class DocumentsManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        try {
            const { success, session } = await supabaseAuth.getCurrentSession();
            if (!success || !session) {
                window.location.href = 'auth.html';
                return;
            }

            this.currentUser = session.user;
            this.setupEventListeners();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du gestionnaire de documents:', error);
        }
    }

    setupEventListeners() {
        // Écouter les clics sur les liens de navigation
        const documentsLink = document.querySelector('a[href="#documents"]');
        const profileLink = document.querySelector('a[href="#profile"]');

        if (documentsLink) {
            documentsLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDocumentsModal();
            });
        }

        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSettingsModal();
            });
        }

        // Écouter les clics sur les boutons de téléchargement
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-icon')) {
                const documentItem = e.target.closest('.document-item');
                if (documentItem) {
                    this.handleDocumentDownload(documentItem);
                }
            }
        });
    }

    async showDocumentsModal() {
        const modal = this.createModal('Mes Documents', await this.getDocumentsContent());
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    async getDocumentsContent() {
        try {
            const { data: client } = await supabase
                .from('clients')
                .select('id')
                .eq('email', this.currentUser.email)
                .single();

            if (!client) {
                return '<p>Aucun document disponible</p>';
            }

            // Pour l'instant, simuler des documents
            const documents = [
                {
                    id: 1,
                    name: 'Compte-rendu de consultation - 10 Mai 2024',
                    type: 'pdf',
                    date: '2024-05-11',
                    size: '245 KB'
                },
                {
                    id: 2,
                    name: 'Facture #2024-05',
                    type: 'pdf',
                    date: '2024-05-10',
                    size: '128 KB'
                },
                {
                    id: 3,
                    name: 'Ordonnance - Dr. Martin',
                    type: 'pdf',
                    date: '2024-05-10',
                    size: '89 KB'
                }
            ];

            return `
                <div class="documents-grid">
                    ${documents.map(doc => `
                        <div class="document-card" data-doc-id="${doc.id}">
                            <div class="document-icon">
                                <i class="fas fa-file-pdf"></i>
                            </div>
                            <div class="document-details">
                                <h4>${doc.name}</h4>
                                <p class="document-meta">
                                    <span class="date">${new Date(doc.date).toLocaleDateString('fr-FR')}</span>
                                    <span class="size">${doc.size}</span>
                                </p>
                            </div>
                            <div class="document-actions">
                                <button class="btn-icon" onclick="documentsManager.downloadDocument(${doc.id})" title="Télécharger">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="btn-icon" onclick="documentsManager.viewDocument(${doc.id})" title="Voir">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <style>
                    .documents-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 1rem;
                        margin-top: 1rem;
                    }
                    .document-card {
                        background: #f8f9fa;
                        border: 1px solid #e9ecef;
                        border-radius: 8px;
                        padding: 1rem;
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        transition: all 0.3s ease;
                    }
                    .document-card:hover {
                        background: #e9ecef;
                        transform: translateY(-2px);
                    }
                    .document-icon {
                        font-size: 2rem;
                        color: #dc3545;
                    }
                    .document-details {
                        flex: 1;
                    }
                    .document-details h4 {
                        margin: 0 0 0.5rem 0;
                        font-size: 0.9rem;
                        color: #333;
                    }
                    .document-meta {
                        margin: 0;
                        font-size: 0.8rem;
                        color: #666;
                    }
                    .document-meta .date::after {
                        content: ' • ';
                        margin: 0 0.5rem;
                    }
                    .document-actions {
                        display: flex;
                        gap: 0.5rem;
                    }
                    .document-actions .btn-icon {
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 0.5rem;
                        cursor: pointer;
                        transition: background 0.3s ease;
                    }
                    .document-actions .btn-icon:hover {
                        background: #0056b3;
                    }
                </style>
            `;
        } catch (error) {
            console.error('Erreur lors du chargement des documents:', error);
            return '<p>Erreur lors du chargement des documents</p>';
        }
    }

    async showSettingsModal() {
        const modal = this.createModal('Paramètres', await this.getSettingsContent());
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    async getSettingsContent() {
        try {
            const { data: client } = await supabase
                .from('clients')
                .select('*')
                .eq('email', this.currentUser.email)
                .single();

            const userData = client || {
                nom: this.currentUser.user_metadata?.name || '',
                email: this.currentUser.email,
                telephone: ''
            };

            return `
                <form id="settingsForm" class="settings-form">
                    <div class="form-group">
                        <label for="userName">Nom complet</label>
                        <input type="text" id="userName" name="nom" value="${userData.nom}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="userEmail">Email</label>
                        <input type="email" id="userEmail" name="email" value="${userData.email}" readonly>
                        <small>L'email ne peut pas être modifié</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="userPhone">Téléphone</label>
                        <input type="tel" id="userPhone" name="telephone" value="${userData.telephone}">
                    </div>
                    
                    <div class="form-group">
                        <label for="notifications">Notifications</label>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" checked>
                                <span>Rappels de rendez-vous</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" checked>
                                <span>Nouveaux messages</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox">
                                <span>Newsletter</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="documentsManager.closeModal()">Annuler</button>
                        <button type="submit" class="btn-primary">Sauvegarder</button>
                    </div>
                </form>
                
                <style>
                    .settings-form {
                        max-width: 500px;
                        margin: 0 auto;
                    }
                    .form-group {
                        margin-bottom: 1.5rem;
                    }
                    .form-group label {
                        display: block;
                        margin-bottom: 0.5rem;
                        font-weight: 500;
                        color: #333;
                    }
                    .form-group input[type="text"],
                    .form-group input[type="email"],
                    .form-group input[type="tel"] {
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        font-size: 1rem;
                    }
                    .form-group input[readonly] {
                        background-color: #f8f9fa;
                        color: #6c757d;
                    }
                    .form-group small {
                        color: #6c757d;
                        font-size: 0.875rem;
                    }
                    .checkbox-group {
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                    }
                    .checkbox-label {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        cursor: pointer;
                    }
                    .form-actions {
                        display: flex;
                        gap: 1rem;
                        justify-content: flex-end;
                        margin-top: 2rem;
                    }
                    .btn-primary, .btn-secondary {
                        padding: 0.75rem 1.5rem;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                    }
                    .btn-primary {
                        background: #007bff;
                        color: white;
                    }
                    .btn-primary:hover {
                        background: #0056b3;
                    }
                    .btn-secondary {
                        background: #6c757d;
                        color: white;
                    }
                    .btn-secondary:hover {
                        background: #545b62;
                    }
                </style>
            `;
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
            return '<p>Erreur lors du chargement des paramètres</p>';
        }
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" onclick="documentsManager.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
            <style>
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    border-radius: 8px;
                    max-width: 90vw;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid #e9ecef;
                }
                .modal-header h2 {
                    margin: 0;
                    color: #333;
                }
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                    padding: 0.5rem;
                }
                .modal-close:hover {
                    color: #333;
                }
                .modal-body {
                    padding: 1.5rem;
                }
            </style>
        `;

        // Fermer la modal en cliquant sur l'overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Gérer la soumission du formulaire de paramètres
        modal.addEventListener('submit', (e) => {
            if (e.target.id === 'settingsForm') {
                e.preventDefault();
                this.saveSettings(e.target);
            }
        });

        return modal;
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    async saveSettings(form) {
        try {
            const formData = new FormData(form);
            const settings = {
                nom: formData.get('nom'),
                telephone: formData.get('telephone')
            };

            // Mettre à jour ou créer le profil client
            const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('email', this.currentUser.email)
                .single();

            if (existingClient) {
                // Mettre à jour
                const { error } = await supabase
                    .from('clients')
                    .update(settings)
                    .eq('email', this.currentUser.email);

                if (error) throw error;
            } else {
                // Créer
                const { error } = await supabase
                    .from('clients')
                    .insert([{
                        ...settings,
                        email: this.currentUser.email
                    }]);

                if (error) throw error;
            }

            alert('Paramètres sauvegardés avec succès!');
            this.closeModal();
            
            // Mettre à jour l'affichage du nom dans la sidebar
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = settings.nom;
            }

        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde des paramètres');
        }
    }

    downloadDocument(documentId) {
        // Simuler le téléchargement
        alert(`Téléchargement du document ${documentId} en cours...`);
        console.log(`Téléchargement du document ${documentId}`);
    }

    viewDocument(documentId) {
        // Simuler l'ouverture du document
        alert(`Ouverture du document ${documentId}...`);
        console.log(`Ouverture du document ${documentId}`);
    }

    handleDocumentDownload(documentItem) {
        const documentName = documentItem.querySelector('.document-name')?.textContent;
        if (documentName) {
            alert(`Téléchargement de "${documentName}" en cours...`);
        }
    }
}

// Initialiser le gestionnaire de documents
const documentsManager = new DocumentsManager();
window.documentsManager = documentsManager;

export default DocumentsManager;