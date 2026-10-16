-- Endurecimiento: usuarios autorizados, catálogo de familias, plantillas,
-- documentos por solicitud, creación atómica y límites de Storage.
-- Todas las tablas tienen RLS activado y SIN políticas: solo la API (service role)
-- accede a los datos. No expongas estas tablas con las claves anon/authenticated.

-- 1) Usuarios autorizados (allowlist). Un usuario de Supabase Auth sin fila aquí
--    no puede usar la aplicación.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol text not null default 'analista' check (rol in ('admin', 'analista')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- 2) Catálogo de familias de cargo (misma lista que src/pages/formulario/constants.js).
create table public.familias_cargo (
  nombre text primary key
);
alter table public.familias_cargo enable row level security;

insert into public.familias_cargo (nombre) values
  ('Operaciones y Logística'),
  ('Administración y Finanzas'),
  ('Comercial y Ventas'),
  ('Tecnología e Informática'),
  ('Jefaturas y Gerencia');

-- not valid: no revalida filas existentes (por si hay datos de prueba); aplica a las nuevas.
alter table public.solicitudes
  add constraint solicitudes_familia_cargo_fkey
  foreign key (familia_cargo) references public.familias_cargo (nombre)
  on update cascade
  not valid;

-- 3) Responsable como referencia a un perfil (antes texto libre).
alter table public.solicitudes
  add column responsable_id uuid references public.profiles (id) on delete set null;
alter table public.solicitudes drop column responsable;

-- 4) Límites de texto.
alter table public.candidatos
  add constraint candidatos_nombre_largo check (char_length(nombre) between 1 and 120);
alter table public.solicitudes
  add constraint solicitudes_cargo_largo check (char_length(cargo) between 1 and 120);

-- 5) Catálogo de plantillas fijas (los archivos viven en el bucket 'plantillas').
create table public.plantillas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  version int not null default 1,
  storage_path text not null unique,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  unique (nombre, version)
);
alter table public.plantillas enable row level security;

-- 6) Documentos por solicitud (CV y, si se necesita, plantillas completadas).
create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes (id) on delete cascade,
  tipo text not null check (tipo in ('cv', 'plantilla')),
  plantilla_id uuid references public.plantillas (id),
  bucket text not null default 'cvs',
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  unique (bucket, storage_path)
);
alter table public.documentos enable row level security;

create index documentos_solicitud_id_idx on public.documentos (solicitud_id);
create unique index documentos_un_cv_por_solicitud
  on public.documentos (solicitud_id) where tipo = 'cv';

-- Migra los CV ya guardados en solicitudes.cv_path y elimina la columna.
insert into public.documentos (solicitud_id, tipo, bucket, storage_path)
select id, 'cv', 'cvs', cv_path
from public.solicitudes
where cv_path is not null;

alter table public.solicitudes drop column cv_path;

-- 7) Índices.
create index solicitudes_candidato_id_idx on public.solicitudes (candidato_id);

-- 8) Creación atómica: candidato + solicitud + documento en una sola transacción.
create or replace function public.crear_solicitud(
  p_solicitud_id uuid,
  p_nombre text,
  p_cargo text,
  p_familia_cargo text,
  p_cv_path text,
  p_cv_mime text,
  p_cv_size bigint
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidato_id uuid;
begin
  insert into public.candidatos (nombre)
  values (p_nombre)
  returning id into v_candidato_id;

  insert into public.solicitudes (id, candidato_id, cargo, familia_cargo, estado)
  values (p_solicitud_id, v_candidato_id, p_cargo, p_familia_cargo, 'Pendiente');

  insert into public.documentos (solicitud_id, tipo, bucket, storage_path, mime_type, size_bytes)
  values (p_solicitud_id, 'cv', 'cvs', p_cv_path, p_cv_mime, p_cv_size);

  return p_solicitud_id;
end;
$$;

revoke all on function public.crear_solicitud(uuid, text, text, text, text, text, bigint)
  from public, anon, authenticated;
grant execute on function public.crear_solicitud(uuid, text, text, text, text, text, bigint)
  to service_role;

-- 9) Buckets privados con límites de tamaño y tipos permitidos.
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
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'plantillas', 'plantillas', false, 20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
