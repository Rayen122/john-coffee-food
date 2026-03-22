# Structure du Projet - John Coffee Food

## Organisation des fichiers

Le projet a été organisé pour faciliter la compréhension et la maintenance du code.

### Dossier `pages/`
Contient les fichiers HTML de chaque page de l'application :

- `login.html` - Écran de connexion
- `sidebar.html` - Menu de navigation latéral
- `dashboard.html` - Tableau de bord principal
- `tables.html` - Gestion des tables
- `order.html` - Page de commande
- `menu.html` - Gestion du menu/produits
- `history.html` - Historique des commandes
- `revenue.html` - Recette du jour
- `team.html` - Gestion de l'équipe
- `credits.html` - Crédits clients
- `backup.html` - Sauvegarde et restauration
- `settings.html` - Paramètres
- `notifications.html` - Notifications
- `stats.html` - Statistiques de ventes

### Dossier `modals/`
Contient les modales réutilisables :

- `confirm-modal.html` - Modal de confirmation générique
- `table-edit-modal.html` - Édition de table
- `add-table-modal.html` - Ajout de table
- `product-form-modal.html` - Formulaire produit
- `order-detail-modal.html` - Détails d'une commande
- `staff-form-modal.html` - Formulaire serveur

### Dossier `js/` (Modules JavaScript)
Le fichier `app.js` a été séparé en modules logiques :

- `auth.js` - Authentification JWT et gestion des utilisateurs
- `login-handler.js` - Gestionnaire de connexion/déconnexion
- `navigation.js` - Navigation et sidebar mobile
- `table-handlers.js` - Gestionnaires pour les tables
- `staff-handlers.js` - Gestionnaires pour l'équipe
- `history-handlers.js` - Gestionnaires pour l'historique
- `credits-handlers.js` - Gestionnaires pour les crédits clients
- `modal-handlers.js` - Gestionnaires génériques des modales
- `app-init.js` - Initialisation de l'application

### Fichiers JavaScript principaux
- `db.js` - Gestion de la base de données
- `tables.js` - Logique des tables
- `orders.js` - Logique des commandes
- `products.js` - Logique des produits
- `users.js` - Gestion des utilisateurs
- `credits.js` - Gestion des crédits
- `notifications.js` - Système de notifications
- `dashboard.js` - Logique du tableau de bord
- `history.js` - Logique de l'historique
- `revenue.js` - Logique de la recette
- `stats.js` - Statistiques
- `backup.js` - Sauvegarde/restauration
- `settings.js` - Paramètres
- `ui.js` - Gestion de l'interface utilisateur

### Fichier principal
- `index.html` - Fichier HTML principal qui charge tous les composants
- `app.js` - Fichier original (toujours fonctionnel)

## Comment utiliser cette structure

### Pour le HTML
Les fichiers dans `pages/` et `modals/` sont des composants HTML séparés pour faciliter la lecture et la maintenance. Le fichier `index.html` original contient toujours tout le code complet et fonctionnel.

### Pour le JavaScript
Les fichiers dans `js/` sont des modules séparés du fichier `app.js` original. Pour utiliser les modules au lieu du fichier monolithique :

1. **Remplacer dans index.html** :
```html
<!-- Ancien -->
<script src="app.js?v=6"></script>

<!-- Nouveau -->
<script src="js/auth.js?v=6"></script>
<script src="js/login-handler.js?v=6"></script>
<script src="js/navigation.js?v=6"></script>
<script src="js/table-handlers.js?v=6"></script>
<script src="js/staff-handlers.js?v=6"></script>
<script src="js/history-handlers.js?v=6"></script>
<script src="js/credits-handlers.js?v=6"></script>
<script src="js/modal-handlers.js?v=6"></script>
<script src="js/app-init.js?v=6"></script>
```

## Avantages de cette organisation

1. **Lisibilité** - Chaque fichier a une responsabilité claire
2. **Maintenance** - Plus facile de trouver et modifier du code spécifique
3. **Réutilisabilité** - Les composants peuvent être réutilisés facilement
4. **Collaboration** - Plusieurs développeurs peuvent travailler sur différents modules
5. **Débogage** - Plus facile d'isoler et corriger les bugs

## Ordre de chargement des scripts

L'ordre est important pour les dépendances :

1. Firebase SDKs
2. Bibliothèques tierces (html2pdf, Chart.js)
3. Modules de base (db.js, products.js, tables.js, etc.)
4. Modules d'authentification (auth.js)
5. Gestionnaires d'événements (handlers)
6. Initialisation (app-init.js)
https://mon-cafe-john.firebaseapp.com