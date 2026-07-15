// User management routes (extracted from server.js — Session 42).
// Persistence helpers (loadUsers/saveUsers/hashPwd) stay in server.js because
// they are used by 15+ other call-sites (payments, grants…); injected here.
export default function registerUserRoutes(app, deps) {
  const {
    loadUsers, saveUsers, hashPwd,
    ensureUserReferralCode,
    getResendClient, buildWelcomeEmailHtml,
    trackServerEvent, sendChatNotification, recordAffiliationConversion,
  } = deps;

  // ─── POST /api/users/login ───
  app.post('/api/users/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Nom d\'utilisateur et mot de passe requis.' });
    }

    const users = loadUsers();
    const hash = hashPwd(password.trim());
    const user = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.passwordHash === hash
    );

    if (!user) {
      return res.json({ success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
    }

    // Track last login timestamp (mutate in place, persist immediately)
    user.lastLoginAt = new Date().toISOString();
    user.loginCount = (user.loginCount || 0) + 1;
    saveUsers(users);

    // Return user info (without passwordHash)
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // ─── POST /api/users/create ───
  app.post('/api/users/create', async (req, res) => {
    const { username, password, role, plan, email, ref_code } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Nom d\'utilisateur requis.' });
    }

    const users = loadUsers();
    if (users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
      return res.json({ success: false, message: 'Utilisateur déjà existant.' });
    }

    const tempPwd = password || Math.random().toString(36).slice(-8);
    const now = new Date();
    const newUser = {
      username: username.trim(),
      passwordHash: hashPwd(tempPwd),
      role: role || 'user',
      plan: plan || 'free',
      email: (email && typeof email === 'string' && email.includes('@')) ? email.trim() : null,
      created_at: now.toISOString().split('T')[0],
      freeMonthsCredit: 0,
    };
    // ─── Generate unique referral code for every new user ───
    ensureUserReferralCode(newUser, users);

    if (newUser.plan !== 'free') {
      const end = new Date();
      end.setFullYear(end.getFullYear() + 1);
      newUser.subscription_end = end.toISOString().split('T')[0];
    }

    users.push(newUser);
    saveUsers(users);

    // ─── Send welcome email (fire & forget, never block the response) ───
    const recipientEmail = (email && typeof email === 'string' && email.includes('@'))
      ? email.trim()
      : (username.includes('@') ? username.trim() : null);
    if (recipientEmail) {
      (async () => {
        try {
          const client = await getResendClient();
          if (!client) return;
          const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
          const result = await client.emails.send({
            from: sender,
            to: [recipientEmail],
            subject: '👋 Bienvenue sur CryptoIA — Votre code -20% à l\'intérieur',
            html: buildWelcomeEmailHtml(newUser.username.split('@')[0]),
          });
          if (result?.error) {
            console.error('[Resend] Auto-send error:', result.error?.message || result.error);
            trackServerEvent('email_welcome_failed', { email: recipientEmail, error: result.error?.message || 'unknown' });
          } else {
            console.log(`[Resend] Auto welcome email sent to ${recipientEmail} (id=${result?.data?.id || 'n/a'})`);
            trackServerEvent('email_welcome_sent', { email: recipientEmail, id: result?.data?.id || null });
          }
        } catch (e) {
          console.error('[Resend] Auto-send exception:', e?.message);
          trackServerEvent('email_welcome_failed', { email: recipientEmail, error: e?.message || 'exception' });
        }
      })();
    }

    // Also track signup completion regardless of email
    trackServerEvent('signup_completed', { plan: newUser.plan, role: newUser.role });

    // Discord/Slack notification for new signup
    sendChatNotification({
      title: `🎉 Nouvel inscrit !`,
      lines: `**User** : ${newUser.username}\n**Plan** : ${newUser.plan}\n**Rôle** : ${newUser.role}${ref_code ? `\n**Parrainé par** : ${ref_code}` : ''}`,
      color: 0x6366f1, // indigo
    }).catch(() => {});

    // ─── 🤝 Affiliation conversion tracking ───
    if (ref_code && typeof ref_code === 'string' && ref_code.trim().length >= 4) {
      try {
        recordAffiliationConversion({
          code: ref_code,
          type: 'signup',
          email: recipientEmail || newUser.username,
        });
        console.log(`[Affiliation] Signup conversion tracked: ref=${ref_code} user=${newUser.username}`);
      } catch (e) {
        console.error('[Affiliation] tracking error:', e?.message);
      }
    }

    res.json({ success: true, temp_password: tempPwd, email_sent: !!recipientEmail });
  });

  // ─── POST /api/users/reset-password ───
  app.post('/api/users/reset-password', (req, res) => {
    const { username, newPassword } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Nom d\'utilisateur requis.' });
    }

    const users = loadUsers();
    const user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      return res.json({ success: false, message: 'Utilisateur introuvable.' });
    }

    const tempPwd = newPassword || Math.random().toString(36).slice(-8);
    user.passwordHash = hashPwd(tempPwd);
    saveUsers(users);

    res.json({ success: true, temp_password: tempPwd });
  });

  // ─── GET /api/users ───
  app.get('/api/users', (req, res) => {
    const users = loadUsers();
    // Return users without passwordHash
    const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
    res.json({ users: safeUsers });
  });

  // ─── DELETE /api/users/:username ───
  app.delete('/api/users/:username', (req, res) => {
    const { username } = req.params;
    const users = loadUsers();
    const filtered = users.filter((u) => u.username.toLowerCase() !== username.toLowerCase());
    if (filtered.length === users.length) {
      return res.json({ success: false, message: 'Utilisateur introuvable.' });
    }
    saveUsers(filtered);
    res.json({ success: true });
  });

  // ─── PUT /api/users/:username/plan ───
  app.put('/api/users/:username/plan', (req, res) => {
    const { username } = req.params;
    const { plan } = req.body;
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Plan requis.' });
    }

    const users = loadUsers();
    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      return res.json({ success: false, message: 'Utilisateur introuvable.' });
    }

    user.plan = plan;
    if (plan !== 'free') {
      const end = new Date();
      end.setFullYear(end.getFullYear() + 1);
      user.subscription_end = end.toISOString().split('T')[0];
    } else {
      delete user.subscription_end;
    }

    saveUsers(users);
    res.json({ success: true, subscription_end: user.subscription_end });
  });

  console.log('[Users] ✅ Routes registered (/api/users/*)');
}
