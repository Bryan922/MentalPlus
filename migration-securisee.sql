-- Script de Migration Sécurisée pour MentalSerenity
-- Ce script vérifie l'existant et ajoute seulement ce qui manque

-- ========================================
-- VÉRIFICATION DE L'EXISTANT
-- ========================================

-- Fonction pour vérifier si une table existe
CREATE OR REPLACE FUNCTION table_exists(p_table_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name
    );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CRÉATION DES TABLES MANQUANTES
-- ========================================

-- Table des clients (si elle n'existe pas)
DO $$
BEGIN
    IF NOT table_exists('clients') THEN
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
        RAISE NOTICE 'Table clients créée';
    ELSE
        RAISE NOTICE 'Table clients existe déjà';
    END IF;
END $$;

-- Table des employés (si elle n'existe pas)
DO $$
BEGIN
    IF NOT table_exists('employees') THEN
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
        RAISE NOTICE 'Table employees créée';
    ELSE
        RAISE NOTICE 'Table employees existe déjà';
    END IF;
END $$;

-- Table des rendez-vous (si elle n'existe pas)
DO $$
BEGIN
    IF NOT table_exists('appointments') THEN
        CREATE TABLE appointments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            employee_id UUID REFERENCES employees(id),
            date DATE NOT NULL,
            heure TIME NOT NULL,
            duree INTEGER DEFAULT 60,
            type VARCHAR(50) NOT NULL,
            domaine VARCHAR(100) NOT NULL,
            status VARCHAR(20) DEFAULT 'confirmé',
            notes TEXT,
            motif TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(client_id, date, heure)
        );
        RAISE NOTICE 'Table appointments créée';
    ELSE
        RAISE NOTICE 'Table appointments existe déjà';
    END IF;
END $$;

-- Table des paiements (si elle n'existe pas)
DO $$
BEGIN
    IF NOT table_exists('payments') THEN
        CREATE TABLE payments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
            client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            montant DECIMAL(10,2) NOT NULL,
            devise VARCHAR(3) DEFAULT 'EUR',
            methode_paiement VARCHAR(50) NOT NULL,
            status VARCHAR(20) DEFAULT 'en_attente',
            stripe_payment_intent_id VARCHAR(255),
            transaction_id VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Table payments créée';
    ELSE
        RAISE NOTICE 'Table payments existe déjà';
    END IF;
END $$;

-- Table des consultations (si elle n'existe pas)
DO $$
BEGIN
    IF NOT table_exists('consultations') THEN
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
        RAISE NOTICE 'Table consultations créée';
    ELSE
        RAISE NOTICE 'Table consultations existe déjà';
    END IF;
END $$;

-- Table des suivis (si elle n'existe pas)
DO $$
BEGIN
    IF NOT table_exists('follow_ups') THEN
        CREATE TABLE follow_ups (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            employee_id UUID NOT NULL REFERENCES employees(id),
            date_suivi DATE NOT NULL,
            type_suivi VARCHAR(50) NOT NULL,
            observations TEXT,
            evolution VARCHAR(20),
            actions_prises TEXT,
            prochaines_etapes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Table follow_ups créée';
    ELSE
        RAISE NOTICE 'Table follow_ups existe déjà';
    END IF;
END $$;

-- Table des documents (si elle n'existe pas)
DO $$
BEGIN
    IF NOT table_exists('documents') THEN
        CREATE TABLE documents (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            employee_id UUID REFERENCES employees(id),
            nom VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            mime_type VARCHAR(100),
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Table documents créée';
    ELSE
        RAISE NOTICE 'Table documents existe déjà';
    END IF;
END $$;

-- Table des messages (si elle n'existe pas)
DO $$
BEGIN
    IF NOT table_exists('messages') THEN
        CREATE TABLE messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            expediteur_id UUID NOT NULL,
            expediteur_type VARCHAR(20) NOT NULL,
            destinataire_id UUID NOT NULL,
            destinataire_type VARCHAR(20) NOT NULL,
            sujet VARCHAR(255),
            contenu TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Table messages créée';
    ELSE
        RAISE NOTICE 'Table messages existe déjà';
    END IF;
END $$;

-- Table des messages de contact (si elle n'existe pas)
DO $$
BEGIN
    IF NOT table_exists('contact_messages') THEN
        CREATE TABLE contact_messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            telephone VARCHAR(20),
            sujet VARCHAR(255),
            message TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'non_lu',
            employee_id UUID REFERENCES employees(id),
            reponse TEXT,
            date_reponse TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Table contact_messages créée';
    ELSE
        RAISE NOTICE 'Table contact_messages existe déjà';
    END IF;
END $$;

-- Table des notifications (si elle n'existe pas)
DO $$
BEGIN
    IF NOT table_exists('notifications') THEN
        CREATE TABLE notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
            user_type VARCHAR(20) NOT NULL,
            type VARCHAR(50) NOT NULL,
            titre VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP WITH TIME ZONE,
            data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Table notifications créée';
    ELSE
        RAISE NOTICE 'Table notifications existe déjà';
    END IF;
END $$;

-- Table des disponibilités (si elle n'existe pas)
DO $$
BEGIN
    IF NOT table_exists('availabilities') THEN
        CREATE TABLE availabilities (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            jour_semaine INTEGER NOT NULL,
            heure_debut TIME NOT NULL,
            heure_fin TIME NOT NULL,
            type_consultation VARCHAR(50) DEFAULT 'classique',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Table availabilities créée';
    ELSE
        RAISE NOTICE 'Table availabilities existe déjà';
    END IF;
END $$;

-- Table des indisponibilités (si elle n'existe pas)
DO $$
BEGIN
    IF NOT table_exists('unavailabilities') THEN
        CREATE TABLE unavailabilities (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            date_debut DATE NOT NULL,
            date_fin DATE NOT NULL,
            heure_debut TIME,
            heure_fin TIME,
            raison VARCHAR(255),
            type VARCHAR(50) DEFAULT 'conges',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Table unavailabilities créée';
    ELSE
        RAISE NOTICE 'Table unavailabilities existe déjà';
    END IF;
END $$;

-- Table des tarifs (si elle n'existe pas)
DO $$
BEGIN
    IF NOT table_exists('pricing') THEN
        CREATE TABLE pricing (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            type_consultation VARCHAR(50) NOT NULL UNIQUE,
            montant DECIMAL(10,2) NOT NULL,
            devise VARCHAR(3) DEFAULT 'EUR',
            duree INTEGER DEFAULT 60,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Table pricing créée';
    ELSE
        RAISE NOTICE 'Table pricing existe déjà';
    END IF;
END $$;

-- Table des statistiques (si elle n'existe pas)
DO $$
BEGIN
    IF NOT table_exists('statistics') THEN
        CREATE TABLE statistics (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            date_stat DATE NOT NULL,
            type_stat VARCHAR(50) NOT NULL,
            valeur INTEGER NOT NULL,
            donnees JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Table statistics créée';
    ELSE
        RAISE NOTICE 'Table statistics existe déjà';
    END IF;
END $$;

-- ========================================
-- CRÉATION DES INDEX MANQUANTS
-- ========================================

-- Index pour clients
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_clients_email') THEN
        CREATE INDEX idx_clients_email ON clients(email);
        RAISE NOTICE 'Index idx_clients_email créé';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_clients_nom') THEN
        CREATE INDEX idx_clients_nom ON clients(nom);
        RAISE NOTICE 'Index idx_clients_nom créé';
    END IF;
END $$;

-- Index pour appointments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_appointments_date') THEN
        CREATE INDEX idx_appointments_date ON appointments(date);
        RAISE NOTICE 'Index idx_appointments_date créé';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_appointments_client') THEN
        CREATE INDEX idx_appointments_client ON appointments(client_id);
        RAISE NOTICE 'Index idx_appointments_client créé';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_appointments_employee') THEN
        CREATE INDEX idx_appointments_employee ON appointments(employee_id);
        RAISE NOTICE 'Index idx_appointments_employee créé';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_appointments_status') THEN
        CREATE INDEX idx_appointments_status ON appointments(status);
        RAISE NOTICE 'Index idx_appointments_status créé';
    END IF;
END $$;

-- Index pour payments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_appointment') THEN
        CREATE INDEX idx_payments_appointment ON payments(appointment_id);
        RAISE NOTICE 'Index idx_payments_appointment créé';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_status') THEN
        CREATE INDEX idx_payments_status ON payments(status);
        RAISE NOTICE 'Index idx_payments_status créé';
    END IF;
END $$;

-- Index pour messages
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_destinataire') THEN
        CREATE INDEX idx_messages_destinataire ON messages(destinataire_id, destinataire_type);
        RAISE NOTICE 'Index idx_messages_destinataire créé';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_expediteur') THEN
        CREATE INDEX idx_messages_expediteur ON messages(expediteur_id, expediteur_type);
        RAISE NOTICE 'Index idx_messages_expediteur créé';
    END IF;
END $$;

-- Index pour notifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user') THEN
        CREATE INDEX idx_notifications_user ON notifications(user_id, user_type);
        RAISE NOTICE 'Index idx_notifications_user créé';
    END IF;
END $$;

-- ========================================
-- CRÉATION DES TRIGGERS MANQUANTS
-- ========================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
DO $$
BEGIN
    -- Trigger pour clients
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
        CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_clients_updated_at créé';
    END IF;
    
    -- Trigger pour employees
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_employees_updated_at') THEN
        CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_employees_updated_at créé';
    END IF;
    
    -- Trigger pour appointments
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_appointments_updated_at') THEN
        CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_appointments_updated_at créé';
    END IF;
    
    -- Trigger pour payments
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
        CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_payments_updated_at créé';
    END IF;
    
    -- Trigger pour consultations
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_consultations_updated_at') THEN
        CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_consultations_updated_at créé';
    END IF;
    
    -- Trigger pour pricing
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_pricing_updated_at') THEN
        CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_pricing_updated_at créé';
    END IF;
END $$;

-- ========================================
-- INSERTION DES DONNÉES DE BASE
-- ========================================

-- Données de tarification (si pas déjà présentes)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pricing WHERE type_consultation = 'classique') THEN
        INSERT INTO pricing (type_consultation, montant, duree, description) VALUES
        ('classique', 60.00, 60, 'Consultation classique de 1 heure'),
        ('nuit', 80.00, 60, 'Consultation de nuit de 1 heure'),
        ('urgence', 100.00, 60, 'Consultation d''urgence de 1 heure');
        RAISE NOTICE 'Données de tarification insérées';
    ELSE
        RAISE NOTICE 'Données de tarification existent déjà';
    END IF;
END $$;

-- Employé de test (si pas déjà présent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM employees WHERE email = 'marie.dupont@mentalserenity.fr') THEN
        INSERT INTO employees (nom, prenom, email, role, specialites, bio) VALUES
        ('Dupont', 'Marie', 'marie.dupont@mentalserenity.fr', 'accompagnateur', ARRAY['anxiété', 'dépression', 'stress'], 'Accompagnatrice expérimentée spécialisée dans la gestion du stress et de l''anxiété');
        RAISE NOTICE 'Employé de test créé';
    ELSE
        RAISE NOTICE 'Employé de test existe déjà';
    END IF;
END $$;

-- ========================================
-- ACTIVATION DU RLS
-- ========================================

-- Activer RLS sur toutes les tables
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('clients', 'employees', 'appointments', 'payments', 'consultations', 'follow_ups', 'documents', 'messages', 'contact_messages', 'notifications', 'availabilities', 'unavailabilities', 'pricing', 'statistics')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.tablename);
        RAISE NOTICE 'RLS activé sur la table %', table_record.tablename;
    END LOOP;
END $$;

-- ========================================
-- RAPPORT FINAL
-- ========================================

-- Afficher un rapport de migration
SELECT 
    'Migration terminée avec succès !' as status,
    COUNT(*) as total_tables,
    COUNT(CASE WHEN table_type = 'BASE TABLE' THEN 1 END) as base_tables,
    COUNT(CASE WHEN table_type = 'VIEW' THEN 1 END) as views
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Afficher les tables créées
SELECT 
    table_name,
    'Table prête' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clients', 'employees', 'appointments', 'payments', 'consultations', 'follow_ups', 'documents', 'messages', 'contact_messages', 'notifications', 'availabilities', 'unavailabilities', 'pricing', 'statistics')
ORDER BY table_name; 