// Funcție serverless Vercel – gestionare utilizatori (doar pentru administratori).
// Folosește cheia service_role, care rămâne DOAR pe server (variabilă de mediu Vercel).
import { createClient } from '@supabase/supabase-js';

const ROLES = ['admin', 'op', 'qc'];

export default async function handler(req, res) {
  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Serverul nu este configurat (variabile de mediu lipsă).' });
    }
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Neautentificat.' });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: u, error: ue } = await admin.auth.getUser(token);
    if (ue || !u || !u.user) return res.status(401).json({ error: 'Sesiune invalidă.' });

    const { data: me } = await admin.from('profiles').select('role').eq('id', u.user.id).maybeSingle();
    if (!me || me.role !== 'admin') {
      return res.status(403).json({ error: 'Doar administratorul poate gestiona utilizatorii.' });
    }

    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    if (req.method === 'POST') {
      const email = String(b.email || '').trim().toLowerCase();
      const password = String(b.password || '');
      const name = String(b.name || '').trim() || email.split('@')[0];
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Email invalid.' });
      if (password.length < 6) return res.status(400).json({ error: 'Parola trebuie să aibă minim 6 caractere.' });
      if (!ROLES.includes(b.role)) return res.status(400).json({ error: 'Rol invalid.' });
      const { data, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        app_metadata: { role: b.role }, user_metadata: { name },
      });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ id: data.user.id });
    }

    if (req.method === 'PATCH') {
      if (!b.id) return res.status(400).json({ error: 'Lipsește utilizatorul.' });
      if (String(b.password || '').length < 6) return res.status(400).json({ error: 'Parola trebuie să aibă minim 6 caractere.' });
      const { error } = await admin.auth.admin.updateUserById(b.id, { password: b.password });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      if (!b.id) return res.status(400).json({ error: 'Lipsește utilizatorul.' });
      if (b.id === u.user.id) return res.status(400).json({ error: 'Nu îți poți șterge propriul cont.' });
      const { error } = await admin.auth.admin.deleteUser(b.id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Metodă nepermisă.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Eroare de server.' });
  }
}
