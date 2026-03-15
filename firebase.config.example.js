/**
 * Configuration Firebase - EXEMPLE
 * 
 * Instructions:
 * 1. Créez un projet Firebase sur https://console.firebase.google.com
 * 2. Copiez ce fichier et renommez-le en 'firebase.config.js'
 * 3. Remplacez les valeurs ci-dessous par vos propres identifiants Firebase
 * 4. Le fichier 'firebase.config.js' sera automatiquement ignoré par Git
 */

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Ne modifiez pas cette ligne
if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
}
