/**
 * Module d'authentification JWT
 */

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
  var data = header + '.' + payload + '.' + JWT_SECRET;
  var hash = 0;
  for (var i = 0; i < data.length; i++) {
    var char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
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

  var expectedSig = createSignature(parts[0], parts[1]);
  if (parts[2] !== expectedSig) return false;

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
  document.querySelectorAll('.admin-only').forEach(function (el) {
    el.style.display = isAdmin ? '' : 'none';
  });
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

window.Auth = {
  checkAuth: checkAuth,
  showApp: showApp,
  logout: logout,
  generateToken: generateToken,
  applyRolePermissions: applyRolePermissions,
  AUTH_CREDENTIALS: AUTH_CREDENTIALS,
  currentUserRole: function() { return currentUserRole; },
  currentUserName: function() { return currentUserName; },
  setCurrentUser: function(role, name) {
    currentUserRole = role;
    currentUserName = name;
  }
};
