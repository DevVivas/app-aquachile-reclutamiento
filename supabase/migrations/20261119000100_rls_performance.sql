-- Advisors de Supabase (performance):
-- 1) Índices para claves foráneas sin cubrir.
-- 2) Políticas RLS: (select auth.uid()) y (select public.is_staff()) se evalúan una vez
--    por consulta (initplan) en vez de una vez por fila.

create index if not exists application_events_actor_id_idx on public.application_events (actor_id);
create index if not exists application_notes_author_id_idx on public.application_notes (author_id);

-- profiles
drop policy if exists "staff ve al equipo" on public.profiles;
create policy "staff ve al equipo" on public.profiles
  for select to authenticated using ((select public.is_staff()) or id = (select auth.uid()));

drop policy if exists "cada uno edita su nombre" on public.profiles;
create policy "cada uno edita su nombre" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- applications
drop policy if exists "staff lee postulaciones" on public.applications;
create policy "staff lee postulaciones" on public.applications
  for select to authenticated using ((select public.is_staff()));

drop policy if exists "staff mueve y asigna" on public.applications;
create policy "staff mueve y asigna" on public.applications
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

drop policy if exists "admin elimina" on public.applications;
create policy "admin elimina" on public.applications
  for delete to authenticated using ((select public.is_admin()));

-- application_notes
drop policy if exists "staff lee notas" on public.application_notes;
create policy "staff lee notas" on public.application_notes
  for select to authenticated using ((select public.is_staff()));

drop policy if exists "staff escribe notas propias" on public.application_notes;
create policy "staff escribe notas propias" on public.application_notes
  for insert to authenticated with check ((select public.is_staff()) and author_id = (select auth.uid()));

drop policy if exists "autor borra su nota" on public.application_notes;
create policy "autor borra su nota" on public.application_notes
  for delete to authenticated using (author_id = (select auth.uid()));

-- application_events
drop policy if exists "staff lee historial" on public.application_events;
create policy "staff lee historial" on public.application_events
  for select to authenticated using ((select public.is_staff()));

-- storage
drop policy if exists "staff lee CVs" on storage.objects;
create policy "staff lee CVs" on storage.objects
  for select to authenticated using (bucket_id = 'cvs' and (select public.is_staff()));
