-- ============================================================
-- Fase 6 — Realtime de citas
-- Pegar una vez en el SQL Editor de Supabase.
-- ============================================================
-- Habilita la tabla public.appointments en la publicación Realtime
-- para que los portales (paciente, profesional, admin) y el formulario
-- de reserva se actualicen en vivo cuando se crea o cambia una cita.
--
-- Notas:
--  * Realtime respeta RLS: cada cliente solo recibe cambios de filas
--    que su sesión puede leer (paciente -> sus citas, profesional ->
--    las de su ficha, admin -> todas).
--  * replica identity full permite recibir la fila completa en UPDATE
--    y DELETE (necesario para detectar qué cambió).
--  * Este bloque es idempotente: puede ejecutarse más de una vez.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;
end $$;

alter table public.appointments replica identity full;
