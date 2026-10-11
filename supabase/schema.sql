-- =====================================================================
--  Portal Atelier 3D – schema Supabase (rulează o singură dată în
--  Supabase Dashboard → SQL Editor → New query → Run)
-- =====================================================================

-- 1) Profiluri (rolul fiecărui utilizator) --------------------------------
create table if not exists public.profiles (
  id    uuid primary key references auth.users(id) on delete cascade,
  email text,
  name  text,
  role  text not null default 'none' check (role in ('admin','op','qc','none'))
);

-- Primul utilizator creat devine ADMIN. Ceilalți primesc rolul din
-- app_metadata (setat doar de serverul tău, prin /api/users) sau 'none'.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text;
begin
  r := coalesce(
        new.raw_app_meta_data->>'role',
        case when exists (select 1 from public.profiles where role = 'admin') then 'none' else 'admin' end
      );
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), r);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- 2) Tabele de date (aceeași structură: id + document JSON) -----------------
do $$
declare t text;
begin
  foreach t in array array['fil','receipts','prod','mk','sal','exp','ord','mat','mi','settings'] loop
    execute format($f$
      create table if not exists public.%I (
        seq        bigint generated always as identity,
        id         text primary key,
        data       jsonb not null,
        updated_at timestamptz not null default now()
      )$f$, t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
-- settings=setări companie (numele de pe PDF), fil=filamente, receipts=intrări filament, prod=produse, mk=producție,
-- sal=vânzări, exp=cheltuieli, ord=comenzi, mat=materiale, mi=intrări materiale

-- 3) Reguli de acces (RLS) -------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_self_read  on public.profiles;
drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_self_read  on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_admin_read on public.profiles for select to authenticated using (public.my_role() = 'admin');
-- (rolurile se modifică doar prin serverul /api/users, cu cheia service_role)

do $$
declare t text;
begin
  foreach t in array array['fil','receipts','prod','mk','sal','exp','ord','mat','mi','settings'] loop
    execute format('drop policy if exists admin_all on public.%I', t);
    execute format($f$create policy admin_all on public.%I for all to authenticated
                      using (public.my_role() = 'admin') with check (public.my_role() = 'admin')$f$, t);
  end loop;

  -- operator și control calitate: pot CITI datele de care are nevoie interfața lor
  foreach t in array array['fil','receipts','prod','mk','mat','mi','ord','settings'] loop
    execute format('drop policy if exists staff_read on public.%I', t);
    execute format($f$create policy staff_read on public.%I for select to authenticated
                      using (public.my_role() in ('op','qc'))$f$, t);
  end loop;
end $$;

-- operator + calitate: pot schimba starea comenzilor
drop policy if exists staff_update_ord on public.ord;
create policy staff_update_ord on public.ord for update to authenticated
  using (public.my_role() in ('op','qc')) with check (public.my_role() in ('op','qc'));

-- calitate: poate înregistra producția la aprobare
drop policy if exists qc_insert_mk on public.mk;
create policy qc_insert_mk on public.mk for insert to authenticated
  with check (public.my_role() = 'qc');

-- Vânzările (sal) și cheltuielile (exp) sunt vizibile DOAR pentru admin.

-- 4) Permisiuni de bază + sincronizare live -----------------------------------
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

do $$
declare t text;
begin
  foreach t in array array['fil','receipts','prod','mk','sal','exp','ord','mat','mi','settings'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- 5) Configurator public: setări + comenzi online -----------------------------
--    Pagina publică NU accesează baza de date direct: citește configurația prin /api/config
--    și trimite comenzile prin /api/order (funcții pe server, cu cheia service_role).
do $$
declare t text;
begin
  foreach t in array array['site_config','web_orders'] loop
    execute format($f$
      create table if not exists public.%I (
        seq        bigint generated always as identity,
        id         text primary key,
        data       jsonb not null,
        updated_at timestamptz not null default now()
      )$f$, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists admin_all on public.%I', t);
    execute format($f$create policy admin_all on public.%I for all to authenticated
                      using (public.my_role() = 'admin') with check (public.my_role() = 'admin')$f$, t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
-- site_config = setările configuratorului (mărimi, culori, prețuri, livrare)
-- web_orders  = comenzile primite de pe pagina publică (vizibile doar pentru admin)
