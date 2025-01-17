# Configuration OVH et Migration

## 1. Hébergement OVH
- Plan choisi : Hébergement PRO
- Prix : 79.08€ HT/an (94.90€ TTC)
- Inclus : SSL Let's Encrypt, 4 bases de données MySQL

## 2. Création de la Base de Données
```sql
-- Table utilisateurs
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role ENUM('client', 'admin') DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Table rendez-vous
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type VARCHAR(50) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'rescheduled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table documents
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('appointment', 'document', 'system') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 3. Configuration PHP
1. Créer `config/database.php` :
```php
<?php
define('DB_HOST', 'votre_host_ovh');
define('DB_NAME', 'votre_db_name');
define('DB_USER', 'votre_username');
define('DB_PASS', 'votre_password');
define('JWT_SECRET', 'générer_une_clé_secrète_forte');
```

## 4. Migration du Site
1. Télécharger les fichiers via FTP
2. Configurer le domaine mentalserenity.fr
3. Activer SSL Let's Encrypt
4. Configurer les redirections HTTPS

## 5. Tests à Effectuer
- [ ] Création de compte
- [ ] Connexion client/admin
- [ ] Prise de rendez-vous
- [ ] Annulation/reprogrammation
- [ ] Upload/download documents
- [ ] Notifications
- [ ] Responsive design

## 6. Sécurité
1. Ajouter dans .htaccess :
```apache
# Forcer HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Protection des fichiers sensibles
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>

# Protection XSS et autres
Header set X-XSS-Protection "1; mode=block"
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set Referrer-Policy "strict-origin-when-cross-origin"
```

2. Vérifier les permissions des dossiers :
```bash
# Dossiers
chmod 755 public_html/
chmod 755 public_html/uploads/

# Fichiers PHP
chmod 644 *.php

# Fichiers de configuration
chmod 600 config/database.php
```

## 7. Maintenance
- Sauvegarder la base de données quotidiennement
- Monitorer les logs d'erreur
- Mettre à jour régulièrement les dépendances
- Vérifier les performances du site 