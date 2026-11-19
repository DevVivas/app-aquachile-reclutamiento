-- AquaChile · Reclutamiento — esquema base
-- Postulaciones públicas (vía Edge Function), equipo reclutador con aprobación,
-- pipeline de etapas, asignación de evaluador, notas, auditoría y análisis IA del CV.

-- ───────────────────────── Equipo ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  email text not null,
  role text not null default 'reclutador'
    check (role in ('admin', 'reclutador', 'rrhh', 'psicologo')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ¿El usuario actual es miembro aprobado del equipo?
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and approved)
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and approved and role = 'admin')
$$;

-- Alta automática del perfil al registrarse. El primer usuario es admin aprobado;
-- el resto queda pendiente hasta que un admin lo apruebe (los CV son datos personales).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_first boolean;
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'reclutador');
begin
  select not exists (select 1 from public.profiles) into v_first;
  if v_role not in ('reclutador', 'rrhh', 'psicologo') then
    v_role := 'reclutador';
  end if;

  insert into public.profiles (id, full_name, email, role, approved)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)), 120),
    new.email,
    case when v_first then 'admin' else v_role end,
    v_first
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "staff ve al equipo" on public.profiles
  for select to authenticated using (public.is_staff() or id = auth.uid());

create policy "cada uno edita su nombre" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;

-- Solo un admin cambia rol o aprobación.
create or replace function public.admin_update_profile(p_id uuid, p_role text, p_approved boolean)
returns public.profiles
language plpgsql security definer set search_path = ''
as $$
declare
  v_row public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede gestionar el equipo' using errcode = '42501';
  end if;
  if p_id = auth.uid() and (p_role <> 'admin' or not p_approved) then
    raise exception 'No puedes quitarte tu propio acceso de administrador' using errcode = '42501';
  end if;
  update public.profiles set role = p_role, approved = p_approved where id = p_id returning * into v_row;
  return v_row;
end;
$$;

revoke all on function public.admin_update_profile(uuid, text, boolean) from public, anon;
grant execute on function public.admin_update_profile(uuid, text, boolean) to authenticated;

-- ───────────────────────── Postulaciones ─────────────────────────
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  candidate_name text not null check (char_length(candidate_name) between 2 and 120),
  candidate_email text check (candidate_email is null or candidate_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  candidate_phone text check (candidate_phone is null or char_length(candidate_phone) <= 30),
  job_family text not null check (job_family in (
    'Operaciones y Logística', 'Administración y Finanzas', 'Comercial y Ventas',
    'Tecnología e Informática', 'Jefaturas y Gerencia')),
  job_title text not null check (char_length(job_title) between 2 and 120),
  cv_folder text not null,
  cv_path text not null unique,
  cv_file_name text not null,
  cv_mime text not null,
  cv_size integer not null,
  stage text not null default 'recibido' check (stage in (
    'recibido', 'revision_cv', 'entrevista', 'evaluacion_psicolaboral', 'oferta', 'contratado', 'descartado')),
  assigned_to uuid references public.profiles (id) on delete set null,
  -- Análisis IA (solo lo escribe la Edge Function con service role)
  ai_status text not null default 'pending' check (ai_status in ('pending', 'processing', 'done', 'error')),
  ai_score smallint check (ai_score between 0 and 100),
  ai_fit text check (ai_fit in ('alto', 'medio', 'bajo')),
  ai_summary text,
  ai_analysis jsonb,
  ai_model text,
  ai_error text,
  ai_analyzed_at timestamptz,
  cv_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.applications enable row level security;

create index applications_created_at_idx on public.applications (created_at desc);
create index applications_stage_idx on public.applications (stage);
create index applications_assigned_to_idx on public.applications (assigned_to);

create policy "staff lee postulaciones" on public.applications
  for select to authenticated using (public.is_staff());

create policy "staff mueve y asigna" on public.applications
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "admin elimina" on public.applications
  for delete to authenticated using (public.is_admin());

-- El equipo solo puede cambiar etapa y responsable; el resto lo escribe el backend.
revoke insert, update on public.applications from authenticated, anon;
grant update (stage, assigned_to) on public.applications to authenticated;

-- ───────────────────────── Notas y auditoría ─────────────────────────
create table public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
alter table public.application_notes enable row level security;
create index application_notes_application_idx on public.application_notes (application_id, created_at);

create policy "staff lee notas" on public.application_notes
  for select to authenticated using (public.is_staff());
create policy "staff escribe notas propias" on public.application_notes
  for insert to authenticated with check (public.is_staff() and author_id = auth.uid());
create policy "autor borra su nota" on public.application_notes
  for delete to authenticated using (author_id = auth.uid());

create table public.application_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null check (type in ('created', 'stage_changed', 'assigned', 'ai_analyzed', 'note_added')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.application_events enable row level security;
create index application_events_application_idx on public.application_events (application_id, created_at);

create policy "staff lee historial" on public.application_events
  for select to authenticated using (public.is_staff());
-- Sin políticas de escritura: solo triggers (security definer) insertan eventos.

create or replace function public.applications_audit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.application_events (application_id, type, payload)
    values (new.id, 'created', jsonb_build_object('job_title', new.job_title, 'job_family', new.job_family));
    return new;
  end if;

  new.updated_at := now();

  if new.assigned_to is distinct from old.assigned_to then
    if new.assigned_to is not null and not exists (
      select 1 from public.profiles where id = new.assigned_to and approved
    ) then
      raise exception 'El responsable debe ser un miembro aprobado del equipo' using errcode = '23503';
    end if;
    insert into public.application_events (application_id, actor_id, type, payload)
    values (new.id, auth.uid(), 'assigned', jsonb_build_object('from', old.assigned_to, 'to', new.assigned_to));
  end if;

  if new.stage is distinct from old.stage then
    insert into public.application_events (application_id, actor_id, type, payload)
    values (new.id, auth.uid(), 'stage_changed', jsonb_build_object('from', old.stage, 'to', new.stage));
  end if;

  if new.ai_status = 'done' and old.ai_status is distinct from 'done' then
    insert into public.application_events (application_id, type, payload)
    values (new.id, 'ai_analyzed', jsonb_build_object('score', new.ai_score, 'fit', new.ai_fit, 'model', new.ai_model));
  end if;

  return new;
end;
$$;

create trigger applications_audit_insert after insert on public.applications
  for each row execute function public.applications_audit();
create trigger applications_audit_update before update on public.applications
  for each row execute function public.applications_audit();

create or replace function public.notes_audit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.application_events (application_id, actor_id, type, payload)
  values (new.application_id, new.author_id, 'note_added', jsonb_build_object('note_id', new.id));
  return new;
end;
$$;

create trigger notes_audit after insert on public.application_notes
  for each row execute function public.notes_audit();

-- Las funciones de trigger no deben poder llamarse por RPC.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.applications_audit() from public, anon, authenticated;
revoke all on function public.notes_audit() from public, anon, authenticated;

-- ───────────────────────── Storage ─────────────────────────
-- Bucket privado; cada CV vive en una carpeta con el nombre del postulante:
--   cvs/<nombre-del-postulante>/<fecha>_<cargo>.<ext>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cvs', 'cvs', false, 10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- El equipo puede leer (URLs firmadas); subir solo lo hace la Edge Function (service role).
create policy "staff lee CVs" on storage.objects
  for select to authenticated using (bucket_id = 'cvs' and public.is_staff());

-- ───────────────────────── Realtime ─────────────────────────
alter publication supabase_realtime add table public.applications;
