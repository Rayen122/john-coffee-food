

## 🚀 Installation Rapide

### 1. Cloner le Repository

```bash
git clone https://github.com/votre-username/john-coffee-food.git
cd john-coffee-food
```

### 2. Ouvrir l'Application

**Option A: Directement dans le navigateur**
- Ouvrez le fichier `index.html` dans votre navigateur

**Option B: Avec un serveur local (recommandé)**

```bash
# Avec Python
python -m http.server 8000

# Avec Node.js
npx http-server

# Avec PHP
php -S localhost:8000
```

Puis ouvrez `http://localhost:8000` dans votre navigateur.

### 3. Connexion Initiale

**Identifiants par défaut:**
- Identifiant: `john`
- Mot de passe: `john`

⚠️ **Important**: Changez ces identifiants avant de déployer en production!

## 🔥 Configuration Firebase (Optionnel)

Firebase permet la synchronisation cloud et le déploiement. Si vous souhaitez l'utiliser :

### Étape 1: Créer un Projet Firebase

1. Allez sur https://console.firebase.google.com
2. Cliquez sur "Ajouter un projet"
3. Suivez les étapes de création
4. Activez Firestore Database dans votre projet

### Étape 2: Obtenir les Identifiants

1. Dans la console Firebase, allez dans "Paramètres du projet"
2. Faites défiler jusqu'à "Vos applications"
3. Cliquez sur l'icône Web `</>`
4. Copiez la configuration Firebase

### Étape 3: Configurer l'Application

1. **Copiez le fichier d'exemple:**
```bash
cp firebase.config.example.js firebase.config.js
```

2. **Modifiez `firebase.config.js`** avec vos identifiants:
```javascript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

3. **Incluez le fichier dans `index.html`** (avant les autres scripts):
```html
<script src="firebase.config.js"></script>
```

4. **Modifiez `js/db.js`** pour utiliser votre configuration:
```javascript
// Remplacez la configuration existante par:
firebase.initializeApp(window.firebaseConfig || {
  // Configuration par défaut si firebase.config.js n'est pas chargé
});
```

### Étape 4: Configuration du Hosting (Optionnel)

Pour déployer sur Firebase Hosting:

1. **Installez Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Connectez-vous:**
```bash
firebase login
```

3. **Copiez les fichiers de configuration:**
```bash
cp .firebaserc.example .firebaserc
cp firebase.json.example firebase.json
```

4. **Modifiez `.firebaserc`** avec votre projet ID:
```json
{
  "projects": {
    "default": "votre-projet-id"
  }
}
```

5. **Déployez:**
```bash
firebase deploy
```

## 🔐 Sécurité

### Changer les Identifiants Admin

Modifiez le fichier `js/auth.js`:

```javascript
// Ligne 5-6
var AUTH_CREDENTIALS = { 
  email: 'votre-identifiant', 
  password: 'votre-mot-de-passe-securise' 
};
```

### Changer la Clé JWT

Modifiez le fichier `js/auth.js`:

```javascript
// Ligne 7
var JWT_SECRET = 'VotreCleSecreteTresLongueEtComplexe2024!';
```

### Règles de Sécurité Firestore

Si vous utilisez Firebase, configurez les règles de sécurité dans la console Firebase:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Autoriser uniquement les utilisateurs authentifiés
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
## ⚙️ Personnalisation

### Modifier le Nom du Café

1. Connectez-vous en tant qu'admin
2. Allez dans **Paramètres**
3. Modifiez "Nom du café"

### Modifier le Logo

Remplacez le fichier `logo.jpg` par votre propre logo (format JPG, PNG recommandé).

### Modifier les Catégories

1. Allez dans **Paramètres**
2. Modifiez la liste des catégories (une par ligne)

### Modifier la Devise

1. Allez dans **Paramètres**
2. Modifiez le champ "Devise" (ex: €, $, DT)

### Modifier le Nombre de Tables

1. Allez dans **Paramètres**
2. Modifiez "Nombre de tables"

## 🎨 Personnalisation Avancée

### Modifier les Couleurs

Éditez `css/style.css` et modifiez les variables CSS:

```css
:root {
  --accent: #3B82F6;        /* Couleur principale */
  --accent-glow: #DBEAFE;   /* Couleur secondaire */
  --bg-body: #F8FAFC;       /* Fond de page */
  --bg-card: #FFFFFF;       /* Fond des cartes */
  --text-primary: #1E293B;  /* Texte principal */
  --text-secondary: #64748B; /* Texte secondaire */
}
```

### Ajouter des Fonctionnalités

Le code est modulaire et bien organisé. Consultez `README_STRUCTURE.md` pour comprendre l'architecture.

## 📱 Mode Hors Ligne

L'application fonctionne entièrement hors ligne grâce à IndexedDB. Aucune configuration supplémentaire n'est nécessaire.

## 🐛 Dépannage

### L'application ne se charge pas

1. Vérifiez la console du navigateur (F12)
2. Assurez-vous que tous les fichiers sont présents
3. Essayez avec un serveur local au lieu d'ouvrir directement le fichier

### Firebase ne fonctionne pas

1. Vérifiez que `firebase.config.js` est correctement configuré
2. Vérifiez que Firestore est activé dans votre projet Firebase
3. Vérifiez les règles de sécurité Firestore

### Les données ne se sauvegardent pas

1. Vérifiez que IndexedDB est activé dans votre navigateur
2. Vérifiez que vous n'êtes pas en mode navigation privée
3. Essayez de vider le cache du navigateur

### Erreur de connexion

1. Vérifiez les identifiants dans `js/auth.js`
2. Videz le cache du navigateur
3. Supprimez le localStorage: `localStorage.clear()` dans la console

## 📞 Support

Pour toute question ou problème:
- Ouvrez une issue sur GitHub
- Consultez la documentation complète dans `README.md`
- Vérifiez les logs dans la console du navigateur (F12)

## 🔄 Mise à Jour

Pour mettre à jour vers la dernière version:

```bash
git pull origin main
```

⚠️ **Attention**: Sauvegardez vos données avant de mettre à jour!

---

**Bon déploiement! 🚀**
