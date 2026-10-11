// POST /api/order – plasare comandă din configuratorul public.
import { randomUUID } from 'node:crypto';
import { getAdmin, loadCfg, buildOrder } from './_shared.js';

const hits = new Map(); // limitare simplă per instanță: 5 comenzi / 10 minute / IP
function limited(ip) {
  const now = Date.now(), arr = (hits.get(ip) || []).filter(t => now - t < 600000);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 5;
}

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Metodă nepermisă.' }); }
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    if (b.website) return res.status(200).json({ ok: true }); // câmp-capcană pentru boți
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
    if (limited(ip)) return res.status(429).json({ error: 'Prea multe comenzi. Încearcă mai târziu.' });

    const admin = getAdmin();
    if (!admin) return res.status(500).json({ error: 'Serverul nu este configurat.' });
    const cfg = await loadCfg(admin);
    if (!cfg) return res.status(503).json({ error: 'Configuratorul nu este disponibil momentan.' });

    const r = buildOrder(cfg, b);
    if (r.error) return res.status(400).json({ error: r.error, code: r.code });

    const d = new Date(), pad = n => String(n).padStart(2, '0');
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const nr = `WEB-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join('')}`;
    const id = 'w' + randomUUID().replace(/-/g, '').slice(0, 10);
    const order = { id, nr, d: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, ts: d.getTime(), ...r.order };
    const { error } = await admin.from('web_orders').insert({ id, data: order });
    if (error) { console.error(error); return res.status(500).json({ error: 'Nu am putut salva comanda.' }); }
    return res.status(200).json({ ok: true, nr, total: order.total, sub: order.sub, delivery: order.delivery, cur: order.cur });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Eroare de server.' });
  }
}
