# ☕ John Coffee Food - Système de Gestion de Café
Application web complète pour la gestion d'un café/restaurant avec gestion des tables, commandes, produits, équipe et statistiques.

## 🚀 Fonctionnalités

### Gestion des Tables
- Visualisation en temps réel de l'état des tables (libre/occupée)
- Fusion de tables pour les groupes
- Transfert de commandes entre tables
- Édition et suppression de tables

### Gestion des Commandes
- Création et modification de commandes
- Ajout/suppression d'articles
- Paiement partiel ou total
- Modes de paiement (espèces/carte)
- Notes sur les commandes

### Gestion du Menu
- CRUD complet des produits
- Catégorisation des produits
- Gestion de la disponibilité
- Recherche et filtrage

### Historique et Recettes
- Historique complet des commandes
- Recette du jour avec détails
- Clôture de journée avec export PDF
- Statistiques par catégorie et produit

### Gestion de l'Équipe
- Création de comptes serveurs
- Authentification JWT
- Permissions par rôle (Admin/Serveur)
- Suivi des ventes par serveur

### Crédits Clients
- Gestion des crédits clients
- Calendrier mensuel
- Paiement et suivi des crédits

### Statistiques
- Graphiques de ventes
- Produits les plus vendus
- Meilleur jour du mois
- Calendrier des recettes

### Sauvegarde
- Export des données en JSON
- Import de données
- Export PDF de la recette
- Réinitialisation des données

## 🛠️ Technologies Utilisées

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Base de données**: IndexedDB (local) + Firebase Firestore (cloud)
- **Authentification**: JWT (JSON Web Tokens)
- **Graphiques**: Chart.js
- **Export PDF**: html2pdf.js
- **Responsive**: Design mobile-first

## 📁 Structure du Projet

```
cafe-app/
├── css/                    # Fichiers CSS
├── js/                     # Fichiers JavaScript
├── pages/                  # Composants HTML des pages
├── modals/                 # Composants HTML des modales
├── index.html             # Point d'entrée
└── README.md              # Ce fichier
```

## 🔥 Firebase (Optionnel)

L'application fonctionne entièrement hors ligne avec IndexedDB. Firebase est optionnel pour:
- Synchronisation cloud entre appareils
- Déploiement sur Firebase Hosting
- Backup automatique

**Pour configurer Firebase:**
1. Copiez `firebase.config.example.js` vers `firebase.config.js`
2. Ajoutez vos identifiants Firebase
3. Consultez [CONFIGURATION.md](CONFIGURATION.md) pour les détails

**Note**: Les fichiers de configuration Firebase sont exclus du repository pour des raisons de sécurité.

## 📱 Responsive Design

L'application est entièrement responsive et fonctionne sur :
- 💻 Desktop
- 📱 Tablettes
- 📱 Smartphones

## 🎨 Personnalisation

### Modifier le nom du café
Allez dans **Paramètres** > Nom du café

### Modifier les catégories
Allez dans **Paramètres** > Catégories

### Modifier la devise
Allez dans **Paramètres** > Devise

### Changer le logo
Remplacez le fichier `logo.jpg` par votre propre logo

## 🔧 Configuration

### Nombre de tables
Modifiable dans **Paramètres** > Nombre de tables

### Fond de caisse
Configurable dans **Recette du jour**

### Durée du token JWT
Modifiable dans `js/auth.js` (variable `JWT_EXPIRY_HOURS`)

## 📊 Fonctionnalités Avancées

### Mode Hors Ligne
L'application fonctionne entièrement hors ligne grâce à IndexedDB.

### Synchronisation Cloud
Si Firebase est configuré, les données sont synchronisées automatiquement.

### Export de Données
- Export JSON complet
- Export PDF de la recette du jour
- Export PDF des statistiques

## 🙏 Remerciements

- [Firebase](https://firebase.google.com/) pour la base de données cloud
- [Chart.js](https://www.chartjs.org/) pour les graphiques
- [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) pour l'export PDF
- [Google Fonts](https://fonts.google.com/) pour la typographie Inter

## 👨‍💻 Auteur
*
Développé avec ❤️ pour la gestion de cafés et restaurants