// GET /api/config – configurația publică a configuratorului (fără date interne).
import { getAdmin, loadCfg, publicCfg } from './_shared.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Metodă nepermisă.' }); }
    const admin = getAdmin();
    if (!admin) return res.status(500).json({ error: 'Serverul nu este configurat.' });
    const cfg = await loadCfg(admin);
    if (!cfg) return res.status(503).json({ error: 'Configuratorul nu este încă setat.' });
    res.setHeader('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=60');
    return res.status(200).json(publicCfg(cfg));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Eroare de server.' });
  }
}
