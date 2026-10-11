// Funcții comune pentru configuratorul public (nu este expus ca endpoint: prefix "_").
import { createClient } from '@supabase/supabase-js';

export const CURS = ['MDL', 'RON', 'EUR'];
export const LANGS = ['ro', 'ru', 'en'];
export const ZONES = ['MD', 'RO', 'EU', 'INT'];
export const SETS = {
  lit: 'ABCDEFGHIJKLMNOPQRSTUVWXYZĂÂÎȘȚ',
  cyr: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
  dig: '0123456789',
  sym: '&!?.-+',
};
const EU = 'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT SK SI ES SE'.split(' ');
const INT = 'GB UA CH NO IS LI US CA IL TR GE AM AZ BY RU KZ RS ME MK AL BA XK AE AU JP CN KR'.split(' ');
export const COUNTRIES = { MD: 'MD', RO: 'RO', ...Object.fromEntries(EU.map(c => [c, 'EU'])), ...Object.fromEntries(INT.map(c => [c, 'INT'])) };

export function getAdmin() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function loadCfg(admin) {
  const { data } = await admin.from('site_config').select('data').eq('id', 'main').maybeSingle();
  return data && data.data ? data.data : null;
}

// Adrese de imagini permise: http(s), cale relativă sau imagine încorporată (data:image/...).
const okUrl = u => typeof u === 'string' && u.length <= 250000 && /^(https?:\/\/[^\s"'<>]+|\/[^\/\s"'<>][^\s"'<>]*|data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+\/=]+)$/i.test(u);

// text pe 3 limbi (acceptă și un simplu string, copiat în toate limbile)
const T3 = (x, max = 200) => {
  const o = {};
  for (const l of LANGS) {
    const v = x && typeof x === 'object' ? x[l] : x;
    o[l] = String(v == null ? '' : v).slice(0, max);
  }
  for (const l of LANGS) if (!o[l]) o[l] = o.ro || o.en || o.ru || '';
  return o;
};
// sumă pe 3 valute (acceptă și un simplu număr, copiat în toate valutele)
const M3 = x => {
  const o = {};
  for (const c of CURS) {
    const v = x && typeof x === 'object' ? x[c] : x;
    o[c] = Math.max(0, Number(v) || 0);
  }
  return o;
};

// Configurația publică: fără câmpuri interne (filament, grame/literă, cursuri).
export function publicCfg(c) {
  const sizes = (c.sizes || []).filter(s => s.on).map(s => ({ id: s.id, label: String(s.label || '').slice(0, 40), h: Number(s.h) || 0, price: M3(s.price) }));
  const currencies = CURS.filter(cu => sizes.length && sizes.every(s => s.price[cu] > 0));
  return {
    title: T3(c.title, 120), sub: T3(c.sub, 240), note: T3(c.note, 300),
    intro: {
      text: T3(c.intro && c.intro.text, 2000),
      images: ((c.intro && c.intro.images) || []).filter(i => i && okUrl(i.url)).slice(0, 4).map(i => ({ url: i.url, cap: T3(i.cap, 80) })),
    },
    phone: String(c.phone || '').slice(0, 40), email: String(c.email || '').slice(0, 120),
    max: Number(c.max) || 20, min: M3(c.min), freeOver: M3(c.freeOver),
    sets: { lit: !!(c.sets && c.sets.lit), cyr: !!(c.sets && c.sets.cyr), dig: !!(c.sets && c.sets.dig), sym: !!(c.sets && c.sets.sym) },
    sizes, currencies,
    colors: (c.colors || []).filter(x => x.on).map(x => ({ id: x.id, name: T3(x.name, 40), hex: /^#[0-9a-f]{6}$/i.test(x.hex) ? x.hex : '#888888', extra: M3(x.extra) })),
    deliv: (c.deliv || []).filter(d => d.on).map(d => ({ id: d.id, label: T3(d.label, 80), price: M3(d.price), addr: !!d.addr, zones: Array.isArray(d.zones) && d.zones.length ? d.zones.filter(z => ZONES.includes(z)) : ZONES.slice() })),
  };
}

const r2 = v => Math.round(v * 100) / 100;
const norm = ch => ({ 'ş': 'Ș', 'ţ': 'Ț', 'ș': 'Ș', 'ț': 'Ț', 'ă': 'Ă', 'â': 'Â', 'î': 'Î' }[ch] || ch.toUpperCase());
const err = (code, error) => ({ error, code });

// Validează comanda și RECALCULEAZĂ prețul pe server (prețul trimis de client este ignorat).
export function buildOrder(cfgRaw, b) {
  const c = publicCfg(cfgRaw);
  const str = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  const cur = String(b.cur || '').toUpperCase();
  if (!c.currencies.includes(cur)) return err('cur', 'Valută indisponibilă.');
  const lang = LANGS.includes(b.lang) ? b.lang : 'ro';
  const allowed = Object.keys(SETS).filter(k => c.sets[k]).map(k => SETS[k]).join('');
  const raw = Array.isArray(b.letters) ? b.letters : [];
  if (raw.length > c.max + 15) return err('long', 'Text prea lung.');
  const rawColors = cfgRaw.colors || [];
  const letters = [];
  for (const l of raw) {
    const ch = norm(String((l && l.ch) || '').slice(0, 1));
    if (ch === ' ') { if (letters.length && letters[letters.length - 1].ch !== ' ') letters.push({ ch: ' ' }); continue; }
    if (!ch || !allowed.includes(ch)) return err('chars', 'Caracter nepermis: ' + (ch || '?'));
    const col = c.colors.find(x => x.id === l.c);
    if (!col) return err('color', 'Culoare indisponibilă.');
    const rc = rawColors.find(x => x.id === col.id) || {};
    letters.push({ ch, c: col.id, cn: col.name.ro, hex: col.hex, ex: col.extra[cur], fil: rc.fil || '' });
  }
  while (letters.length && letters[letters.length - 1].ch === ' ') letters.pop();
  const n = letters.filter(l => l.ch !== ' ').length;
  if (n < 1) return err('empty', 'Alege cel puțin o literă.');
  if (n > c.max) return err('max', `Maximum ${c.max} litere.`);
  const size = c.sizes.find(s => s.id === b.size);
  if (!size) return err('size', 'Mărime indisponibilă.');
  const rawSize = (cfgRaw.sizes || []).find(s => s.id === size.id) || {};

  const country = String(b.country || '').toUpperCase();
  const zone = COUNTRIES[country];
  if (!zone) return err('country', 'Țară indisponibilă.');
  const dl = c.deliv.find(d => d.id === b.deliv);
  if (!dl || !dl.zones.includes(zone)) return err('deliv', 'Livrarea aleasă nu este disponibilă pentru această țară.');

  const base = r2(n * size.price[cur]);
  const extras = r2(letters.reduce((a, l) => a + (l.ex || 0), 0));
  const sub = r2(base + extras);
  if (c.min[cur] > 0 && sub < c.min[cur]) return err('min', `Comanda minimă este ${c.min[cur]} ${cur}.`);
  const delivery = c.freeOver[cur] > 0 && sub >= c.freeOver[cur] ? 0 : dl.price[cur];

  const name = str(b.name, 80), phone = str(b.phone, 25), email = str(b.email, 120);
  if (name.length < 2) return err('name', 'Completează numele.');
  if (!/^[+()\d\s.-]{9,25}$/.test(phone)) return err('phone', 'Număr de telefon invalid.');
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err('email', 'Email invalid.');
  const city = str(b.city, 80), addr = str(b.addr, 200), zip = str(b.zip, 16);
  if (dl.addr && (city.length < 2 || addr.length < 4)) return err('addr', 'Completează orașul și adresa de livrare.');
  if (b.terms !== true) return err('terms', 'Trebuie să accepți termenii.');

  const rates = cfgRaw.rates || {};
  const rate = cur === 'MDL' ? 1 : Math.max(0, Number(rates[cur]) || 0);   // MDL pentru 1 unitate din valuta comenzii
  return {
    order: {
      text: letters.map(l => l.ch).join(''), letters,
      size: { id: size.id, label: size.label, h: size.h, price: size.price[cur], g: Number(rawSize.g) || 0 },
      deliv: { id: dl.id, label: dl.label.ro, price: delivery, addr: dl.addr },
      cur, lang, country, zone, rate,
      name, phone, email, city, addr, zip, note: str(b.note, 500),
      n, base, extras, sub, delivery, total: r2(sub + delivery), st: 'new',
    },
  };
}
