# Migration vers OVH

## Plan choisi : Hébergement PRO OVH
- Prix : 79,08€ HT/an (94,90€ TTC)
- Soit environ 7,90€ TTC/mois

## Configuration à sélectionner
1. **CMS** : "Sans module pré-installé"
2. **CDN** : Aucun (pas nécessaire pour l'instant)
3. **SSL** : Let's Encrypt (inclus gratuitement)
4. **Base de données** : Sans instance Web Cloud Databases
   - Utiliser les 4 bases MySQL de 1 Go incluses

## Étapes de commande
1. Commander l'hébergement PRO
2. Ignorer l'étape du nom de domaine
3. Utiliser le domaine existant (mentalserenity.fr)

## Après la commande
1. Configurer les bases de données
   - 4 bases de 1 Go chacune
   - Migration des données depuis Railway

2. Migration des fichiers
   - Transférer tous les fichiers PHP
   - Configurer les accès FTP
   - Vérifier les permissions

3. Configuration DNS
   - Pointer mentalserenity.fr vers OVH
   - Configurer les sous-domaines si nécessaire

4. Tests
   - Vérifier la connexion à la base de données
   - Tester l'authentification
   - Vérifier les rendez-vous
   - Tester la messagerie
   - Vérifier les notifications

## Structure actuelle de la base de données
1. Table `users`
   - Données utilisateurs
   - Authentification
   - Rôles

2. Table `appointments`
   - Rendez-vous
   - Liaison avec utilisateurs

3. Table `messages`
   - Messagerie interne
   - Communication client/professionnel

4. Table `notifications`
   - Alertes système
   - Notifications utilisateurs 