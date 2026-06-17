// Admin Auth — extracted from server.js (Session 16 refactor)
// Endpoints: GET /api/v1/admin/status, POST /api/v1/admin/setup, /login, /verify, /logout
import path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

export default function register(app, { DATA_DIR, hashPwd }) {
  const SUPER_ADMIN_FILE = path.join(DATA_DIR, 'super_admin.json');
  const adminSessions = new Map(); // token → { email, name, role, created_at }
  const ADMIN_SESSION_TTL = 24 * 60 * 60 * 1000; // 24h

  function loadSuperAdmin() {
    try {
      if (existsSync(SUPER_ADMIN_FILE)) return JSON.parse(readFileSync(SUPER_ADMIN_FILE, 'utf-8'));
    } catch (err) { console.error('Error loading super admin:', err); }
    return null;
  }

  function saveSuperAdmin(admin) {
    try { writeFileSync(SUPER_ADMIN_FILE, JSON.stringify(admin, null, 2), 'utf-8'); }
    catch (err) { console.error('Error saving super admin:', err); }
  }

  function generateSessionToken() {
    return createHash('sha256')
      .update(Math.random().toString() + Date.now().toString() + Math.random().toString())
      .digest('hex');
  }

  // Clean expired sessions every 30 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [token, session] of adminSessions) {
      if (now - new Date(session.created_at).getTime() > ADMIN_SESSION_TTL) {
        adminSessions.delete(token);
      }
    }
  }, 30 * 60 * 1000);

  app.get('/api/v1/admin/status', (req, res) => {
    const admin = loadSuperAdmin();
    res.json({ configured: !!admin });
  });

  app.post('/api/v1/admin/setup', (req, res) => {
    const existing = loadSuperAdmin();
    if (existing) return res.status(403).json({ success: false, message: 'Super admin déjà configuré.' });

    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ success: false, message: 'Email, nom et mot de passe requis.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Adresse email invalide.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const admin = {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      passwordHash: hashPwd(password),
      role: 'super_admin',
      created_at: new Date().toISOString(),
    };
    saveSuperAdmin(admin);
    console.log(`[Admin] Super admin created: ${admin.email}`);
    res.json({ success: true, message: 'Super admin créé avec succès.' });
  });

  app.post('/api/v1/admin/login', (req, res) => {
    const admin = loadSuperAdmin();
    if (!admin) return res.status(403).json({ success: false, message: 'Super admin non configuré.' });

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
    }
    if (admin.email !== email.trim().toLowerCase() || admin.passwordHash !== hashPwd(password)) {
      return res.json({ success: false, message: 'Email ou mot de passe incorrect.' });
    }

    const token = generateSessionToken();
    adminSessions.set(token, {
      email: admin.email,
      name: admin.name,
      role: admin.role,
      created_at: new Date().toISOString(),
    });
    console.log(`[Admin] Login successful: ${admin.email}`);
    res.json({ success: true, token, admin: { email: admin.email, name: admin.name, role: admin.role } });
  });

  app.post('/api/v1/admin/verify', (req, res) => {
    const { token } = req.body;
    if (!token) return res.json({ valid: false });
    const session = adminSessions.get(token);
    if (!session) return res.json({ valid: false });
    if (Date.now() - new Date(session.created_at).getTime() > ADMIN_SESSION_TTL) {
      adminSessions.delete(token);
      return res.json({ valid: false });
    }
    res.json({ valid: true, admin: { email: session.email, name: session.name, role: session.role } });
  });

  app.post('/api/v1/admin/logout', (req, res) => {
    const { token } = req.body;
    if (token) adminSessions.delete(token);
    res.json({ success: true });
  });
}
