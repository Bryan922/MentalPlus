-- Schéma de base de données Supabase pour MentalSerenity
-- Ce fichier contient toutes les tables nécessaires pour le fonctionnement complet du site

-- Table des clients
CREATE TABLE clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    ville VARCHAR(100),
    code_postal VARCHAR(10),
    pays VARCHAR(50) DEFAULT 'France',
    date_naissance DATE,
    genre VARCHAR(20),
    profession VARCHAR(100),
    situation_familiale VARCHAR(50),
    antecedents_medicaux TEXT,
    allergies TEXT,
    medicaments_actuels TEXT,
    motif_consultation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Table des employés
CREATE TABLE employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'accompagnateur',
    specialites TEXT[],
    bio TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Table des rendez-vous
CREATE TABLE appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id),
    date DATE NOT NULL,
    heure TIME NOT NULL,
    duree INTEGER DEFAULT 60, -- durée en minutes
    type VARCHAR(50) NOT NULL, -- 'classique', 'nuit', 'urgence'
    domaine VARCHAR(100) NOT NULL, -- domaine d'intervention
    status VARCHAR(20) DEFAULT 'confirmé', -- 'en_attente', 'confirmé', 'annulé', 'terminé'
    notes TEXT,
    motif TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, date, heure)
);

-- Table des paiements
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    montant DECIMAL(10,2) NOT NULL,
    devise VARCHAR(3) DEFAULT 'EUR',
    methode_paiement VARCHAR(50) NOT NULL, -- 'carte', 'virement', 'especes'
    status VARCHAR(20) DEFAULT 'en_attente', -- 'en_attente', 'payé', 'annulé', 'remboursé'
    stripe_payment_intent_id VARCHAR(255),
    transaction_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des consultations
CREATE TABLE consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    date_consultation DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME,
    observations TEXT,
    diagnostic TEXT,
    recommandations TEXT,
    prochain_rdv DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des suivis
CREATE TABLE follow_ups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id),
    date_suivi DATE NOT NULL,
    type_suivi VARCHAR(50) NOT NULL, -- 'telephone', 'email', 'rdv'
    observations TEXT,
    evolution VARCHAR(20), -- 'amelioration', 'stabilisation', 'aggravation'
    actions_prises TEXT,
    prochaines_etapes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des documents
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id),
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'compte_rendu', 'facture', 'ordonnance', 'autre'
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expediteur_id UUID NOT NULL,
    expediteur_type VARCHAR(20) NOT NULL, -- 'client', 'employee'
    destinataire_id UUID NOT NULL,
    destinataire_type VARCHAR(20) NOT NULL, -- 'client', 'employee'
    sujet VARCHAR(255),
    contenu TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages de contact (formulaire de contact)
CREATE TABLE contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    sujet VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'non_lu', -- 'non_lu', 'lu', 'repondu', 'traite'
    employee_id UUID REFERENCES employees(id),
    reponse TEXT,
    date_reponse TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'client', 'employee'
    type VARCHAR(50) NOT NULL, -- 'rdv_confirme', 'rdv_annule', 'nouveau_message', etc.
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    data JSONB, -- données supplémentaires
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des disponibilités des employés
CREATE TABLE availabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    jour_semaine INTEGER NOT NULL, -- 0 = Dimanche, 1 = Lundi, etc.
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    type_consultation VARCHAR(50) DEFAULT 'classique', -- 'classique', 'nuit', 'tous'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des congés et indisponibilités
CREATE TABLE unavailabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    heure_debut TIME,
    heure_fin TIME,
    raison VARCHAR(255),
    type VARCHAR(50) DEFAULT 'conges', -- 'conges', 'formation', 'maladie', 'autre'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tarifs
CREATE TABLE pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type_consultation VARCHAR(50) NOT NULL UNIQUE, -- 'classique', 'nuit', 'urgence'
    montant DECIMAL(10,2) NOT NULL,
    devise VARCHAR(3) DEFAULT 'EUR',
    duree INTEGER DEFAULT 60, -- durée en minutes
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des statistiques
CREATE TABLE statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date_stat DATE NOT NULL,
    type_stat VARCHAR(50) NOT NULL, -- 'rdv_jour', 'clients_nouveaux', 'revenus', etc.
    valeur INTEGER NOT NULL,
    donnees JSONB, -- données détaillées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_nom ON clients(nom);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_employee ON appointments(employee_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_payments_appointment ON payments(appointment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_consultations_appointment ON consultations(appointment_id);
CREATE INDEX idx_follow_ups_client ON follow_ups(client_id);
CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_messages_destinataire ON messages(destinataire_id, destinataire_type);
CREATE INDEX idx_messages_expediteur ON messages(expediteur_id, expediteur_type);
CREATE INDEX idx_notifications_user ON notifications(user_id, user_type);
CREATE INDEX idx_availabilities_employee ON availabilities(employee_id);
CREATE INDEX idx_unavailabilities_employee ON unavailabilities(employee_id);

-- Triggers pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion des données de base
INSERT INTO pricing (type_consultation, montant, duree, description) VALUES
('classique', 60.00, 60, 'Consultation classique de 1 heure'),
('nuit', 80.00, 60, 'Consultation de nuit de 1 heure'),
('urgence', 100.00, 60, 'Consultation d''urgence de 1 heure');

-- Insertion d'un employé de test
INSERT INTO employees (nom, prenom, email, role, specialites, bio) VALUES
('Dupont', 'Marie', 'marie.dupont@mentalserenity.fr', 'accompagnateur', ARRAY['anxiété', 'dépression', 'stress'], 'Accompagnatrice expérimentée spécialisée dans la gestion du stress et de l''anxiété');

-- RLS (Row Level Security) - À configurer selon les besoins
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE unavailabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY; 