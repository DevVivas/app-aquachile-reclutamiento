create table public.candidatos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now()
);

create table public.solicitudes (
  id uuid primary key,
  candidato_id uuid not null references public.candidatos (id),
  cargo text not null,
  familia_cargo text not null,
  responsable text,
  estado text not null default 'Pendiente'
    check (estado in ('Pendiente', 'En proceso', 'Finalizada')),
  cv_path text,
  created_at timestamptz not null default now()
);

create index solicitudes_created_at_idx
  on public.solicitudes (created_at desc);

alter table public.candidatos enable row level security;
alter table public.solicitudes enable row level security;

insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do update set public = false;
