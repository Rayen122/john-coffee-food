/**
 * Point d'entrée - authentification JWT, initialisation et navigation
 */

// --- JWT Authentication ---
var AUTH_CREDENTIALS = { email: 'john', password: 'john' };
var JWT_SECRET = 'JohnCoffeeFood2024!SecretKey';
var JWT_EXPIRY_HOURS = 300;

function base64Encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function base64Decode(str) {
  try { return decodeURIComponent(escape(atob(str))); }
  catch (e) { return null; }
}

function createSignature(header, payload) {
  
  // Simple HMAC-like hash using the secret key
  var data = header + '.' + payload + '.' + JWT_SECRET;
  var hash = 0;
  for (var i = 0; i < data.length; i++) {
    var char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return base64Encode(Math.abs(hash).toString(36) + '_' + JWT_SECRET.length);
}

function generateToken(user, role, displayName) {
  var header = base64Encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  var now = Date.now();
  var payload = base64Encode(JSON.stringify({
    sub: user,
    role: role || 'admin',
    name: displayName || user,
    iat: now,
    exp: now + (JWT_EXPIRY_HOURS * 60 * 60 * 1000)
  }));
  var signature = createSignature(header, payload);
  return header + '.' + payload + '.' + signature;
}

function verifyToken(token) {
  if (!token) return false;
  var parts = token.split('.');
  if (parts.length !== 3) return false;

  // Verify signature
  var expectedSig = createSignature(parts[0], parts[1]);
  if (parts[2] !== expectedSig) return false;

  // Verify expiration
  var payloadStr = base64Decode(parts[1]);
  if (!payloadStr) return false;
  try {
    var payload = JSON.parse(payloadStr);
    if (Date.now() > payload.exp) return false;
    return payload;
  } catch (e) {
    return false;
  }
}

// Global user state
var currentUserRole = 'admin';
var currentUserName = '';

function checkAuth() {
  var token = localStorage.getItem('cafe_jwt');
  var payload = verifyToken(token);
  if (payload) {
    currentUserRole = payload.role || 'admin';
    currentUserName = payload.name || payload.sub || '';
  }
  return payload;
}

function applyRolePermissions() {
  var isAdmin = currentUserRole === 'admin';
  // Show/hide admin-only elements
  document.querySelectorAll('.admin-only').forEach(function (el) {
    el.style.display = isAdmin ? '' : 'none';
  });
  // Show user name in sidebar
  var userInfoEl = document.getElementById('sidebarUserInfo');
  if (userInfoEl) {
    userInfoEl.textContent = currentUserName + (isAdmin ? ' (Admin)' : ' (Serveur)');
  }
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'flex';
  applyRolePermissions();
  if (typeof UI !== 'undefined' && UI.updateNotifBadge) {
    UI.updateNotifBadge();
  }
}

function logout() {
  localStorage.removeItem('cafe_jwt');
  currentUserRole = 'admin';
  currentUserName = '';
  location.reload();
}

window.getCurrentUserRole = function () { return currentUserRole; };
window.getCurrentUserName = function () { return currentUserName; };

document.addEventListener('DOMContentLoaded', function () {
  // Check if already authenticated via JWT
  if (checkAuth()) {
    showApp();
  }

  // Login form handler
  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var username = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var errorEl = document.getElementById('loginError');

    // 1. Check admin credentials first
    if (username === AUTH_CREDENTIALS.email && password === AUTH_CREDENTIALS.password) {
      currentUserRole = 'admin';
      currentUserName = 'John (Admin)';
      var token = generateToken(username, 'admin', 'John (Admin)');
      localStorage.setItem('cafe_jwt', token);
      errorEl.textContent = '';
      showApp();
      return;
    }

    // 2. Check Firestore users (serveurs)
    CafeDB.open().then(function () {
      return Users.findByUsername(username);
    }).then(function (user) {
      if (user && user.password === password) {
        currentUserRole = user.role || 'serveur';
        currentUserName = user.name || username;
        var token = generateToken(username, user.role || 'serveur', user.name || username);
        localStorage.setItem('cafe_jwt', token);
        errorEl.textContent = '';
        showApp();
      } else {
        errorEl.textContent = 'Identifiant ou mot de passe incorrect.';
        document.getElementById('loginPassword').value = '';
      }
    }).catch(function () {
      errorEl.textContent = 'Identifiant ou mot de passe incorrect.';
      document.getElementById('loginPassword').value = '';
    });
  });


  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', function () {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
  });


  // Mobile sidebar toggle
  var sidebar = document.getElementById('sidebar');
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var sidebarOverlay = document.getElementById('sidebarOverlay');
  function toggleSidebar() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
    hamburgerBtn.classList.toggle('active');
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    hamburgerBtn.classList.remove('active');
  }
  hamburgerBtn.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);
  // Close sidebar when a nav link is clicked (mobile)
  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', closeSidebar);
  });


  CafeDB.open().then(function () {
    return Settings.getAll();
  }).then(function (settings) {
    UI.setCafeName(settings.cafeName);
    UI.currencySymbol = settings.currency || 'DT';
    var numTables = parseInt(settings.numTables, 10) || 8;
    return Promise.all([
      Tables.ensureDemo(numTables),
      Products.ensureDemo()
    ]);
  }).then(function () {
    UI.renderDashboard();
    UI.renderTables();
    UI.renderMenu();
    UI.renderHistoryFilters();
    UI.renderHistory();
    UI.renderRevenue();
    UI.renderSettings();
    UI.setupBackup();
    if (currentUserRole === 'admin') {
      UI.renderTeam();
    }
    // Hide add product button for servers
    var addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn && currentUserRole !== 'admin') {
      addProductBtn.style.display = 'none';
    }
  }).catch(function (err) {
    console.error(err);
    alert('Erreur au chargement : ' + (err.message || err));
  });

  document.querySelector('.sidebar-nav').addEventListener('click', function (e) {
    var link = e.target.closest('.nav-link[data-page]');
    if (!link) return;
    e.preventDefault();
    var page = link.getAttribute('data-page');
    UI.showPage(page);
    if (page === 'dashboard') UI.renderDashboard();
    if (page === 'tables') UI.renderTables();
    if (page === 'menu') UI.renderMenu();
    if (page === 'history') {
      UI.renderHistoryFilters();
      UI.renderHistory();
    }
    if (page === 'revenue') UI.renderRevenue();
    if (page === 'settings') UI.renderSettings();
    if (page === 'team') UI.renderTeam();
    if (page === 'notifications') UI.renderNotifications();
    if (page === 'credits') UI.renderCreditsCalendar();
    if (page === 'stats') {
      Stats.renderProductCurve();
      UI.renderStatsCalendar();
    }
  });

  document.querySelector('.main-content').addEventListener('click', function (e) {
    var link = e.target.closest('[data-page]');
    if (!link || !link.classList.contains('btn')) return;
    e.preventDefault();
    var page = link.getAttribute('data-page');
    UI.showPage(page);
    if (page === 'tables') UI.renderTables();
    if (page === 'menu') UI.renderMenu();
    if (page === 'history') {
      UI.renderHistoryFilters();
      UI.renderHistory();
    }
    if (page === 'revenue') UI.renderRevenue();
    if (page === 'notifications') UI.renderNotifications();
    if (page === 'credits') UI.renderCreditsCalendar();
    if (page === 'stats') {
      Stats.renderProductCurve();
      UI.renderStatsCalendar();
    }
    if (page === 'backup') { /* déjà prêt */ }
  });

  document.getElementById('backToTables').onclick = function (e) {
    e.preventDefault();
    UI.showPage('tables');
    UI.renderTables();
  };

  // Image upload preview for table
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

  document.getElementById('addTableBtn').onclick = function () {
    // Reset form
    document.getElementById('addTableForm').reset();
    var imgPreview = document.getElementById('addTableImagePreview');
    if (imgPreview) {
      imgPreview.src = '';
      imgPreview.style.display = 'none';
    }

    // Auto-fill next table name
    Tables.getAll().then(function (tables) {
      document.getElementById('addTableName').value = 'Table ' + (tables.length + 1);
      UI.openModal('addTableModal');
    });
  };

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

  // Generic modal close handlers
  document.querySelectorAll('.close-modal').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var modalId = e.target.getAttribute('data-modal');
      if (modalId) {
        UI.closeModal(modalId);
      }
    });
  });

  // === Staff Management ===
  document.getElementById('addStaffBtn').onclick = function () {
    document.getElementById('staffFormTitle').textContent = '👥 Ajouter un serveur';
    document.getElementById('staffFormId').value = '';
    document.getElementById('staffForm').reset();
    UI.openModal('staffFormModal');
  };

  document.getElementById('staffFormCancel').onclick = function () {
    UI.closeModal('staffFormModal');
  };

  document.getElementById('staffForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var id = document.getElementById('staffFormId').value;
    var name = document.getElementById('staffFormName').value.trim();
    var username = document.getElementById('staffFormUsername').value.trim();
    var password = document.getElementById('staffFormPassword').value.trim();

    if (!name || !username || !password) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    if (username === 'john') {
      alert('Cet identifiant est réservé à l\'administrateur.');
      return;
    }

    if (id) {
      // Editing existing user
      Users.get(id).then(function (user) {
        if (!user) return;
        user.name = name;
        user.username = username;
        user.password = password;
        return Users.save(user);
      }).then(function () {
        UI.closeModal('staffFormModal');
        UI.renderTeam();
      }).catch(function (err) {
        alert('Erreur : ' + (err.message || err));
      });
    } else {
      // Creating new user
      Users.create(name, username, password).then(function () {
        UI.closeModal('staffFormModal');
        UI.renderTeam();
      }).catch(function (err) {
        alert('Erreur : ' + (err.message || err));
      });
    }
  });

  // === Table Edit Modal: Rename ===
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

  // === Table Edit Modal: Delete specific table ===
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

  // === Table Edit Modal: Cancel ===
  document.getElementById('cancelTableEditBtn').onclick = function () {
    UI.closeModal('tableEditModal');
  };

  document.getElementById('clearHistoryBtn').onclick = function () {
    UI.showConfirm(
      'Supprimer l\'historique',
      'Toutes les commandes payées seront supprimées définitivement. Cette action est irréversible. Continuer ?',
      function () {
        Orders.getAll().then(function (orders) {
          var paidOrders = orders.filter(function (o) { return o.status === Orders.ORDER_STATUS.PAID; });
          var promises = [];
          paidOrders.forEach(function (o) {
            promises.push(
              Orders.getItems(o.id).then(function (items) {
                var itemPromises = items.map(function (item) {
                  return CafeDB.remove(CafeDB.STORES.orderItems, item.id);
                });
                return Promise.all(itemPromises);
              }).then(function () {
                return CafeDB.remove(CafeDB.STORES.orders, o.id);
              })
            );
          });
          return Promise.all(promises);
        }).then(function () {
          UI.renderHistory();
          UI.renderDashboard();
          alert('Historique supprimé avec succès.');
        });
      }
    );
  };

  document.getElementById('historyFilterBtn').onclick = function () {
    UI.renderHistory();
  };

  var confirmAddImportedBtn = document.getElementById('confirmAddImportedCafeBtn');
  if (confirmAddImportedBtn) {
    confirmAddImportedBtn.onclick = function () {
      Orders.create('direct_sale').then(function (order) {
        return Orders.addItem(order.id, 'import_cafe', 'Café importé', 2.50, 1).then(function () {
          return Orders.pay(order.id);
        });
      }).then(function () {
        window.location.reload();
      }).catch(function (err) {
        console.error(err);
        alert('Erreur: ' + err);
      });
    };
  }

  // --- Credits Logics ---
  var creditForm = document.getElementById('creditForm');

  if (creditForm) {
    creditForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var clientName = document.getElementById('creditClientName').value.trim();
      var amount = document.getElementById('creditAmount').value;
      var date = document.getElementById('creditDate').value;
      var note = document.getElementById('creditNote').value.trim();

      if (!clientName || !amount || !date) return;

      Credits.add(clientName, amount, date, note).then(function () {
        UI.closeModal('creditFormModal');
        creditForm.reset();
        UI.renderCreditsCalendar(); // Refresh calendar
      }).catch(function (err) {
        console.error(err);
        alert('Erreur lors de l\'ajout du crédit: ' + err);
      });
    });
  }

  // --- Calendar Navigation ---
  var prevMonthBtn = document.getElementById('prevMonthBtn');
  var nextMonthBtn = document.getElementById('nextMonthBtn');
  if (prevMonthBtn && nextMonthBtn) {
    prevMonthBtn.addEventListener('click', function () {
      // currentCreditMonth and currentCreditYear are defined in ui.js
      if (typeof currentCreditMonth !== 'undefined') {
        currentCreditMonth--;
        if (currentCreditMonth < 0) {
          currentCreditMonth = 11;
          currentCreditYear--;
        }
        UI.renderCreditsCalendar();
      }
    });

    nextMonthBtn.addEventListener('click', function () {
      if (typeof currentCreditMonth !== 'undefined') {
        currentCreditMonth++;
        if (currentCreditMonth > 11) {
          currentCreditMonth = 0;
          currentCreditYear++;
        }
        UI.renderCreditsCalendar();
      }
    });
  }

});


window.payCredit = function (id, client, amount) {
  // 1. Create a "direct_sale" dummy order to inject cash into revenue
  Orders.create('direct_sale').then(function (order) {
    // 2. Add an item representing the credit payment
    return Orders.addItem(order.id, 'credit_payment', 'Paiement crédit : ' + client, parseFloat(amount), 1).then(function () {
      // 3. Pay the order using 'cash' (or desired method)
      return Orders.pay(order.id, 'cash', parseFloat(amount));
    });
  }).then(function () {
    // 4. Delete the credit from the database
    return Credits.delete(id);
  }).then(function () {
    // 5. Close the day view modal and refresh the calendar view
    UI.closeModal('dayCreditsModal');
    UI.renderCreditsCalendar();

    // Optional: show a small non-blocking toast or rely on visual update
    console.log('Crédit de ' + client + ' remboursé et ajouté à la recette avec succès.');
  }).catch(function (err) {
    console.error(err);
    alert('Erreur lors du paiement du crédit : ' + err.message);
  });
};
