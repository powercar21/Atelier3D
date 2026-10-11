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

## 3b. Configuratorul public de litere bubble 3D

Pagina publică este la `https://<domeniul-tau>/configurator` (fișierele `configurator.html/css/js`, `i18n.js`, `letters.js`).

- **Litere bubble reale:** forma literelor vine din modelele tale (STL A–M și alfabetul rusesc din 3MF), cu litere
  generate în același stil pentru N–Z, cifre, simboluri, Ă Â Î Ș Ț și Ё. Previzualizarea se luminează 3D în browser,
  în culoarea aleasă pentru fiecare literă. (Verifică ca licența modelelor tale să permită folosirea formelor pe site.)
- **3 limbi:** română, rusă, engleză (comutator RO/RU/EN; limba se alege și după browser sau cu `?lang=ru`).
  Tastatura din pagină are și litere chirilice (se activează în setări).
- **3 valute:** MDL, RON, EUR. Prețurile se setează în admin pentru fiecare valută; o valută apare doar dacă
  toate mărimile active au preț în ea. Butonul „Completează RON și EUR din MDL” folosește cursurile setate.
- **Comenzi și din afara Moldovei:** clientul alege țara; livrările au zone (Moldova, România, UE, Alte țări) și
  preț pe valută. Dacă pentru o zonă nu există livrare activă, clienții din acea țară nu pot comanda.
- **Setările** se fac în portal, la **Setări configurator** (doar administrator): texte pe limbi, text + poze sus,
  mărimi, culori (cu supliment și **filamentul** folosit), livrare, minim comandă, livrare gratuită, caractere permise.
- Comenzile apar în portal la **Comenzi online site**, în timp real, cu valuta, țara și limba clientului. Le poți
  **confirma**, **anula** sau **prelua în producție**: se creează produsul și comanda internă din „Comenzi”, cu
  **mai multe filamente** (câte unul pentru fiecare culoare folosită), care trece prin controlul de calitate și
  scade stocul fiecărui filament.
- Pentru „Preia în producție” setează **grame / literă** (pe mărime) și **filamentul fiecărei culori**
  (sau un filament implicit).
- **Securitate:** pagina publică nu are acces direct la baza de date. Citește configurația prin `/api/config`
  (fără date interne) și trimite comenzile prin `/api/order`, care validează tot și **recalculează prețul pe
  server**, în valuta aleasă. Include câmp-capcană anti-boți și limită de 5 comenzi / 10 minute / IP (best effort).
- Dacă ai rulat deja `schema.sql`, nu e nevoie de modificări noi pentru aceste funcții.

## 3c. Comenzi interne cu mai multe tipuri de plastic

În **Comenzi** (admin) poți bifa „Mai multe tipuri de plastic în această comandă” și alege mai multe filamente cu
grame pe bucată. Controlul de calitate scade din stoc fiecare filament, iar PDF-ul de producție arată fiecare
filament cu consumul, stocul înainte și stocul rămas.

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
