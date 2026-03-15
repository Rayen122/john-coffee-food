/**
 * Gestionnaires d'événements pour les tables
 */

function initTableHandlers() {
  // Add table button
  document.getElementById('addTableBtn').onclick = function () {
    document.getElementById('addTableForm').reset();
    var imgPreview = document.getElementById('addTableImagePreview');
    if (imgPreview) {
      imgPreview.src = '';
      imgPreview.style.display = 'none';
    }

    Tables.getAll().then(function (tables) {
      document.getElementById('addTableName').value = 'Table ' + (tables.length + 1);
      UI.openModal('addTableModal');
    });
  };

  // Add table form submit
  document.getElementById('addTableForm').onsubmit = function (e) {
    e.preventDefault();
    var name = document.getElementById('addTableName').value.trim();
    if (!name) return;

    Tables.getAll().then(function (tables) {
      var nameExists = tables.some(function (t) {
        return (t.name || ('Table ' + t.id)).trim().toLowerCase() === name.toLowerCase();
      });
      if (nameExists) {
        alert('Une table avec ce nom existe déjà.');
        return;
      }

      Tables.create(name).then(function () {
        UI.closeModal('addTableModal');
        UI.renderTables();
        UI.renderDashboard();
        UI.renderHistoryFilters();
      }).catch(function (error) {
        alert("Erreur d'ajout Firebase : " + error.message);
      });
    });
  };

  // Table edit form submit
  document.getElementById('tableEditForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var tableId = document.getElementById('tableEditId').value;
    var newName = document.getElementById('tableEditName').value.trim();
    if (!tableId || !newName) return;

    Tables.getAll().then(function (tables) {
      var nameExists = tables.some(function (t) {
        return t.id !== tableId && (t.name || ('Table ' + t.id)).trim().toLowerCase() === newName.toLowerCase();
      });
      if (nameExists) {
        alert('Une autre table porte déjà ce nom.');
        return;
      }

      Tables.get(tableId).then(function (table) {
        if (!table) return;
        table.name = newName;
        Tables.save(table).then(function () {
          UI.closeModal('tableEditModal');
          UI.renderTables();
          UI.renderDashboard();
          UI.renderHistoryFilters();
        });
      });
    });
  });

  // Delete specific table
  document.getElementById('deleteSpecificTableBtn').onclick = function () {
    var tableId = document.getElementById('tableEditId').value;
    if (!tableId) return;

    Tables.getAll().then(function (tables) {
      if (tables.length <= 1) {
        alert('Vous devez garder au moins une table.');
        return;
      }
      var tableStatus = document.getElementById('tableEditStatus').value;
      var tableName = document.getElementById('tableEditName').value;

      if (tableStatus === Tables.STATUS.OCCUPIED) {
        alert('La table « ' + tableName + ' » est occupée. Libérez-la d\'abord.');
        return;
      }

      UI.showConfirm(
        'Supprimer la table',
        'Supprimer « ' + tableName + ' » définitivement ?',
        function () {
          Tables.delete(tableId).then(function () {
            UI.closeModal('tableEditModal');
            UI.renderTables();
            UI.renderDashboard();
            UI.renderHistoryFilters();
          });
        }
      );
    });
  };

  // Cancel table edit
  document.getElementById('cancelTableEditBtn').onclick = function () {
    UI.closeModal('tableEditModal');
  };

  // Image upload preview
  var addTableImageEl = document.getElementById('addTableImage');
  if (addTableImageEl) {
    addTableImageEl.addEventListener('change', function (e) {
      var file = e.target.files[0];
      var preview = document.getElementById('addTableImagePreview');
      if (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        preview.src = '';
        preview.style.display = 'none';
      }
    });
  }
}

window.TableHandlers = {
  init: initTableHandlers
};
