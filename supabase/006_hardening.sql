-- ============================================================
-- Fase 7 — Endurecimiento de citas
-- Pegar una vez en el SQL Editor de Supabase (después de 002).
-- ============================================================
-- Evita que un paciente inserte una cita con un estado arbitrario
-- o que modifique datos de la cita (solo puede cancelarla). El
-- profesional puede cambiar el estado dentro de los valores válidos
-- y el admin no tiene restricciones. La comprobación se hace en el
-- servidor, así que no depende del front.
--
-- Requiere los helpers is_admin() / is_professional() de 002.

create or replace function public.guard_appointments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  estados text[] := array['pendiente', 'proxima', 'confirmada', 'pasada', 'atendida', 'cancelada', 'no_asistio'];
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() then
      new.status := 'proxima';
    end if;
    if new.status is null or not (new.status = any(estados)) then
      raise exception 'Estado de cita no válido';
    end if;
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if public.is_professional() then
    if not (new.status = any(estados)) then
      raise exception 'Estado de cita no válido';
    end if;
    return new;
  end if;

  if new.user_id <> old.user_id
     or new.professional_id <> old.professional_id
     or new.date <> old.date
     or new.start_time <> old.start_time
     or new.end_time <> old.end_time
     or new.modality <> old.modality
     or new.service_label is distinct from old.service_label
     or new.notes is distinct from old.notes then
    raise exception 'No puedes modificar los datos de la cita';
  end if;

  if new.status <> old.status and new.status <> 'cancelada' then
    raise exception 'Solo puedes cancelar la cita';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_appointments on public.appointments;
create trigger trg_guard_appointments
  before insert or update on public.appointments
  for each row execute function public.guard_appointments();

revoke all on function public.guard_appointments() from public;
