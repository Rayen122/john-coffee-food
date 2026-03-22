// Script de test pour initialiser les timestamps d'occupation
// À exécuter dans la console du navigateur

console.log('🔧 Initialisation des timestamps d\'occupation...');

// Fonction pour initialiser les timestamps
async function initOccupationTimestamps() {
  try {
    const tables = await Tables.getAll();
    const now = new Date().toISOString();
    let updated = 0;
    
    for (const table of tables) {
      if (table.status === 'occupied' && !table.occupiedAt) {
        table.occupiedAt = now;
        await Tables.save(table);
        updated++;
        console.log(`✅ Table ${table.name || table.id} : timestamp ajouté`);
      }
    }
    
    console.log(`🎉 ${updated} table(s) mise(s) à jour`);
    
    // Rafraîchir l'affichage
    UI.renderTables();
    console.log('🔄 Affichage des tables rafraîchi');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter l'initialisation
initOccupationTimestamps();