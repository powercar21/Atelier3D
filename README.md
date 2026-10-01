# Portal Atelier 3D

Portal de lucru pentru atelier de printare 3D: filament, materiale, produse, producție cu PDF,
comenzi cu control de calitate, vânzări, cheltuieli și profit.

**Stack:** site static (HTML/CSS/JS) · Supabase (Postgres + Auth + Realtime) · Vercel (hosting + funcție `/api/users`)

```
index.html, styles.css, app.js, fonts.js   aplicația
config.js                                  URL + cheia publică Supabase (de completat)
api/users.js                               funcție serverless: creare/resetare/ștergere utilizatori
supabase/schema.sql                        tabele + reguli de securitate (RLS)
supabase/demo-data.sql                     date de test (opțional)
```

## 1. Supabase

1. Creează un cont pe supabase.com → **New project** (alege o regiune din Europa).
2. **SQL Editor → New query**: lipește conținutul `supabase/schema.sql` → **Run**.
   (Opțional, pentru teste: rulează apoi `supabase/demo-data.sql`.)
3. **Authentication → Sign In / Providers → Email**: dezactivează **„Allow new users to sign up"**
   (altfel oricine își poate crea cont). Dezactivează și „Confirm email" dacă vrei.
4. **Authentication → Users → Add user → Create new user**: email + parolă, bifează *Auto Confirm User*.
   **Primul utilizator creat devine automat administrator.**
5. **Project Settings → API**: notează *Project URL*, cheia **anon public** și cheia **service_role** (secretă!).

## 2. GitHub

```bash
cd atelier-3d
git init
git add .
git commit -m "Portal Atelier 3D"
git branch -M main
git remote add origin https://github.com/<contul-tau>/atelier-3d.git
git push -u origin main
```

Înainte de commit, editează `config.js` și pune *Project URL* + cheia **anon**.
Cheia anon e publică prin design (protecția vine din regulile RLS). **Nu pune niciodată `service_role` în repo.**

## 3. Vercel

1. vercel.com → **Add New → Project** → importă repo-ul GitHub.
2. **Framework Preset: Other**, fără Build Command, fără Output Directory.
3. **Environment Variables** (Settings → Environment Variables):
   | Nume | Valoare |
   |---|---|
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | cheia service_role |
4. **Deploy**. Orice `git push` pe `main` redeployează automat.

## 4. Primul test

1. Intră pe linkul Vercel cu contul de admin creat la pasul 1.4.
2. **Cont → Adaugă utilizator**: creează un operator și un utilizator „Control calitate".
3. Verifică: operatorul vede doar *Comenzi* și *Stoc filament*; calitatea doar *Control calitate*.
4. Datele se sincronizează live între dispozitive.

## Migrare din versiunea veche (claude.ai)

În versiunea veche: **Panou → Descarcă copie de siguranță**. În versiunea nouă, ca admin:
**Panou → Importă copie** (înlocuiește datele curente). Conturile se recreează din pagina **Cont**.

## Securitate – ce trebuie să știi

- Autentificarea o face Supabase Auth. Accesul la date e impus de baza de date (RLS), nu de interfață.
- **Admin:** acces complet. **Operator:** citește datele necesare și poate schimba doar starea comenzilor.
  **Control calitate:** la fel, plus poate înregistra producția la aprobare.
- **Vânzările și cheltuielile sunt citibile doar de admin.**
- Atenție: operatorul și calitatea citesc tabelele de filamente, intrări și produse, deci tehnic pot vedea
  prețurile din ele dacă interoghează direct API-ul. Interfața le ascunde, baza de date nu. Dacă ai nevoie de
  ascundere strictă, se pot crea view-uri/funcții SQL dedicate.
- Planul gratuit Supabase pune proiectul în pauză după o perioadă de inactivitate – verifică politica curentă.
- Fă periodic copii de siguranță (butonul din Panou sau backup-urile Supabase).
