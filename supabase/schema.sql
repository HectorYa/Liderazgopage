-- ============================================================
-- EXCELENTEMENTE · Esquema Supabase (Postgres + Auth + RLS)
-- Pegar completo en: Supabase Dashboard → SQL Editor → New query
-- Ejecutar UNA sola vez. Las secciones de seed son idempotentes.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. CATÁLOGO PÚBLICO (lectura para todos)
-- ============================================================

create table if not exists public.professionals (
  id          text primary key,
  name        text not null,
  role        text not null,
  category    text not null check (category in ('psiquiatria', 'psicologia', 'nutricion', 'fisioterapia')),
  degree      text not null,
  specialty   text not null,
  bio         text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.schedule_blocks (
  id              bigint generated always as identity primary key,
  professional_id text not null references public.professionals(id) on delete cascade,
  day             text not null check (day in ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')),
  start_time      time not null,
  end_time        time not null,
  check (end_time > start_time),
  unique (professional_id, day, start_time)
);

create table if not exists public.services (
  id          bigint generated always as identity primary key,
  category    text not null check (category in ('psiquiatria', 'psicologia', 'terapias', 'nutricion', 'fisioterapia', 'cursos')),
  name        text not null,
  icon        text,
  description text not null,
  detail      text,
  rating      numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  reviews     integer not null default 0 check (reviews >= 0),
  unique (category, name)
);

-- ============================================================
-- 2. CUENTAS (auth.users + perfil público)
-- ============================================================

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  lastname   text not null,
  email      text not null,
  phone      text,
  role       text not null default 'paciente' check (role in ('paciente', 'admin')),
  created_at timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse en Supabase Auth.
-- El front debe enviar { data: { name, lastname, phone } } en signUp.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, lastname, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'lastname', ''),
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. CITAS
-- ============================================================

create table if not exists public.appointments (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  professional_id text not null references public.professionals(id),
  service_label   text,
  modality        text not null check (modality in ('presencial', 'virtual')),
  date            date not null,
  start_time      time not null,
  end_time        time not null,
  status          text not null default 'proxima' check (status in ('proxima', 'pasada', 'cancelada')),
  created_at      timestamptz not null default now(),
  check (end_time > start_time)
);

-- Evita doble reserva del mismo profesional/fecha/bloque.
create unique index if not exists appointments_slot_unique
  on public.appointments (professional_id, date, start_time)
  where status <> 'cancelada';

create index if not exists appointments_user_idx on public.appointments (user_id);

-- ============================================================
-- 4. COMENTARIOS
-- ============================================================

create table if not exists public.comments (
  id              bigint generated always as identity primary key,
  professional_id text not null references public.professionals(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete set null,
  author_name     text not null,
  stars           smallint not null check (stars between 1 and 5),
  body            text not null,
  created_at      timestamptz not null default now(),
  unique (professional_id, author_name, created_at)
);

create index if not exists comments_professional_idx on public.comments (professional_id);

-- ============================================================
-- 5. RLS
-- ============================================================

alter table public.professionals   enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.services        enable row level security;
alter table public.profiles        enable row level security;
alter table public.appointments    enable row level security;
alter table public.comments        enable row level security;

-- Catálogo: lectura pública
drop policy if exists "catalogo: leer profesionales" on public.professionals;
create policy "catalogo: leer profesionales"
  on public.professionals for select to anon, authenticated using (true);

drop policy if exists "catalogo: leer horarios" on public.schedule_blocks;
create policy "catalogo: leer horarios"
  on public.schedule_blocks for select to anon, authenticated using (true);

drop policy if exists "catalogo: leer servicios" on public.services;
create policy "catalogo: leer servicios"
  on public.services for select to anon, authenticated using (true);

-- Perfiles: cada usuario ve y edita el suyo
drop policy if exists "perfiles: leer propio" on public.profiles;
create policy "perfiles: leer propio"
  on public.profiles for select to authenticated using (auth.uid() = id);

drop policy if exists "perfiles: editar propio" on public.profiles;
create policy "perfiles: editar propio"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Citas: cada usuario gestiona las suyas
drop policy if exists "citas: leer propias" on public.appointments;
create policy "citas: leer propias"
  on public.appointments for select to authenticated using (auth.uid() = user_id);

drop policy if exists "citas: crear propias" on public.appointments;
create policy "citas: crear propias"
  on public.appointments for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "citas: editar propias" on public.appointments;
create policy "citas: editar propias"
  on public.appointments for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "citas: borrar propias" on public.appointments;
create policy "citas: borrar propias"
  on public.appointments for delete to authenticated using (auth.uid() = user_id);

-- Comentarios: lectura pública; crear solo autenticado como uno mismo
drop policy if exists "comentarios: leer" on public.comments;
create policy "comentarios: leer"
  on public.comments for select to anon, authenticated using (true);

drop policy if exists "comentarios: crear" on public.comments;
create policy "comentarios: crear"
  on public.comments for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "comentarios: editar propio" on public.comments;
create policy "comentarios: editar propio"
  on public.comments for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "comentarios: borrar propio" on public.comments;
create policy "comentarios: borrar propio"
  on public.comments for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- 6. GRANTS
-- ============================================================

grant select on public.professionals, public.schedule_blocks, public.services, public.comments to anon, authenticated;
grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;
grant select, update on public.profiles to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ============================================================
-- 7. SEED · PROFESIONALES (23)
-- ============================================================

insert into public.professionals (id, name, role, category, degree, specialty, bio) values
('wilbert-barzola', 'Wilbert Barzola Huamán', 'Médico Psiquiatra', 'psiquiatria',
 'Médico Cirujano · Especialista en Psiquiatría · Maestría en Terapia Sistémica Familiar y de Parejas',
 'Terapia familiar y de parejas, salud mental',
 'Médico Psiquiatra con amplia trayectoria en el acompañamiento de familias y parejas. Su enfoque integra la psiquiatría clínica con psicoterapia sistémica, ayudando a sus pacientes a reconstruir vínculos y fortalecer su bienestar emocional.'),
('hernan-sinche', 'Hernan Sinche Espinal', 'Médico Psiquiatra', 'psiquiatria',
 'Médico Cirujano · Especialista en Psiquiatría Infantil y del Adolescente · Diplomado en Salud Mental Comunitaria',
 'Salud mental, psiquiatría clínica, infantil y del adolescente',
 'Psiquiatra con especialización en psiquiatría clínica, infantil y del adolescente. Atiende a pacientes de todas las edades con un trato cercano y basado en la evidencia, priorizando siempre el acompañamiento a la familia.'),
('patricia-quispe', 'Patricia Quispe Baltazar', 'Médico Psiquiatra', 'psiquiatria',
 'Médico Cirujano · Especialista en Psiquiatría · Diplomado en Trauma y Psicotraumatología',
 'Trauma psicológico, duelo y resiliencia',
 'Especialista en el abordaje del trauma psicológico, los procesos de duelo y la resiliencia. Su práctica se centra en crear un espacio seguro para que sus pacientes puedan sanar a su propio ritmo.'),
('ursula-jara', 'Ursula Victoria Jara Huancaya', 'Médico Psiquiatra', 'psiquiatria',
 'Médico Cirujano · Especialista en Psiquiatría · Maestría en Gestión del Bienestar Ocupacional',
 'Psiquiatría clínica y bienestar ocupacional',
 'Psiquiatra clínica con interés en el bienestar ocupacional y el manejo del estrés laboral. Orientada a prevenir el desgaste emocional y a promover una vida equilibrada.'),
('wendy-villaverde', 'Wendy Grethel Villaverde', 'Médico Psiquiatra', 'psiquiatria',
 'Médico Cirujano · Especialista en Psiquiatría Clínica · Diplomado en Psicofarmacología',
 'Salud mental y psiquiatría clínica',
 'Médico Psiquiatra dedicada al diagnóstico y tratamiento de los principales trastornos de salud mental. Su atención se caracteriza por la escucha activa y el seguimiento cercano de cada paciente.'),
('erika-morales', 'Erika Morales Zenteno', 'Médico Psiquiatra', 'psiquiatria',
 'Médico Cirujano · Especialista en Psiquiatría · Formación en Psicoterapia Psicoanalítica y Multifamiliar',
 'Psicoterapia psicoanalítica y multifamiliar',
 'Psiquiatra con formación en psicoterapia psicoanalítica y enfoque multifamiliar. Trabaja con profundidad los procesos inconscientes y las dinámicas familiares que sostienen los conflictos.'),
('grecia-choque', 'Grecia Choque Zamata', 'Médico Psiquiatra', 'psiquiatria',
 'Médico Cirujano · Especialista en Psiquiatría · Certificación en Terapia de Esquemas y Mindfulness',
 'Terapia de Esquemas y Mindfulness',
 'Especialista en Terapia de Esquemas y Mindfulness. Integra la psiquiatría con prácticas de atención plena para el tratamiento de la ansiedad, la depresión y los patrones emocionales repetitivos.'),
('dennys-caceres', 'Dennys Caceres Nuñez', 'Psicólogo', 'psicologia',
 'Licenciado en Psicología · Especialización en Análisis de la Conducta · Diplomado en Terapia Racional Emotiva Conductual (TREC)',
 'Conducta y TREC en población infanto-juvenil',
 'Psicólogo especializado en el análisis de la conducta y la Terapia Racional Emotiva Conductual (TREC) en niños y adolescentes. Ayuda a sus pacientes a identificar creencias que limitan y a desarrollar habilidades emocionales.'),
('elizabeth-chirinos', 'Elizabeth Chirinos Espinoza', 'Psicóloga', 'psicologia',
 'Licenciada en Psicología · Maestría en Psicología Clínica · Especialización en Evaluación Psicológica Infantil',
 'Evaluación clínica y terapia infantil',
 'Psicóloga clínica especialista en evaluación psicológica y terapia infantil. Cuenta con experiencia en el diagnóstico temprano de dificultades emocionales y del desarrollo en la primera infancia.'),
('erick-garay', 'Erick Garay Alvarado', 'Psicólogo', 'psicologia',
 'Licenciado en Psicología · Maestría en Psicología Clínica · Diplomado en Tratamiento de Ansiedad y Depresión',
 'Ansiedad y depresión',
 'Psicólogo clínico enfocado en el tratamiento de la ansiedad y la depresión. Combina técnicas cognitivo conductuales con estrategias de regulación emocional para que sus pacientes recuperen su calidad de vida.'),
('diana-perez', 'Diana Perez Saboya', 'Psicóloga', 'psicologia',
 'Licenciada en Psicología · Especialización en Psicología Forense · Diplomado en Peritaje Psicológico',
 'Evaluación psicológica forense',
 'Psicóloga especialista en evaluación psicológica forense. Realiza peritajes e informes con rigor científico, además de intervenciones clínicas basadas en la evidencia.'),
('fanny-leon', 'Fanny León Nuñez', 'Psicóloga', 'psicologia',
 'Licenciada en Psicología · Diplomado en Terapia Cognitivo Conductual · Formación en TCC de tercera generación',
 'Terapia Cognitivo Conductual (TCC)',
 'Psicóloga con sólida formación en Terapia Cognitivo Conductual. Ayuda a sus pacientes a identificar y modificar patrones de pensamiento y conducta que generan malestar.'),
('leslie-soto', 'Leslie Soto Hurtado', 'Psicóloga', 'psicologia',
 'Licenciada en Psicología · Especialización en DBT · Diplomado en Regulación Emocional',
 'Terapia Dialéctico Conductual (DBT) y Psicología Clínica',
 'Psicóloga clínica especialista en Terapia Dialéctico Conductual (DBT). Trabaja con personas con desregulación emocional intensa, brindando herramientas concretas para el manejo de emociones fuertes.'),
('maria-carrasco', 'Maria Carrasco Araujo', 'Psicóloga', 'psicologia',
 'Licenciada en Psicología · Maestría en Psicoterapia · Especialización en Psicología Clínica',
 'Psicología Clínica y Psicoterapia Clínica',
 'Psicóloga clínica dedicada a la psicoterapia individual de adultos. Acompaña procesos de autoconocimiento, manejo de crisis y fortalecimiento de la autoestima.'),
('morgana-yupanqui', 'Morgana Yupanqui García', 'Psicóloga', 'psicologia',
 'Licenciada en Psicología · Diplomado en TCC · Formación en Terapia de Aceptación y Compromiso',
 'Terapia Cognitivo Conductual',
 'Psicóloga con formación en Terapia Cognitivo Conductual. Orienta su trabajo a la reestructuración de pensamientos negativos y al desarrollo de estrategias de afrontamiento efectivas.'),
('nohely-segura', 'Nohely Segura Ortega', 'Psicóloga', 'psicologia',
 'Licenciada en Psicología · Especialización en Psicoterapia Cognitivo Conductual',
 'Psicoterapia cognitivo conductual',
 'Psicóloga especialista en psicoterapia cognitivo conductual para niños, adolescentes y adultos. Enfocada en resultados medibles y en la participación activa del paciente en su proceso.'),
('sandra-tapara', 'Sandra Tapara Aquino', 'Psicóloga', 'psicologia',
 'Licenciada en Psicología · Maestría en Terapia de Pareja · Diplomado en Enfoque Multimodal',
 'Terapias de pareja desde un enfoque Multimodal',
 'Psicóloga especialista en terapia de parejas desde un enfoque multimodal. Acompaña a las parejas en la resolución de conflictos, la comunicación y el fortalecimiento del vínculo.'),
('yurith-guidotti', 'Yurith Guidotti Palacios', 'Psicóloga', 'psicologia',
 'Licenciada en Psicología · Maestría en Psicología Clínica · Diplomado en Inteligencia Emocional',
 'Psicología Clínica y Terapia Emocional',
 'Psicóloga clínica enfocada en la terapia emocional y el trabajo de la inteligencia emocional. Acompaña procesos de duelo, ansiedad y desarrollo personal.'),
('zenaida-miguel', 'Zenaida Miguel Contreras', 'Psicóloga', 'psicologia',
 'Licenciada en Psicología · Especialización en DBT · Certificación en Terapia de Aceptación y Compromiso (ACT)',
 'Psicología Clínica, DBT y Terapia de Aceptación y Compromiso (ACT)',
 'Psicóloga clínica con formación en Terapia Dialéctico Conductual (DBT) y Terapia de Aceptación y Compromiso (ACT). Combina el mindfulness con el trabajo de valores personales.'),
('marilia-nunez', 'Marilia Núñez Sotelo', 'Psicóloga', 'psicologia',
 'Licenciada en Psicología · Especialización en Psicología Educativa y Clínica · Diplomado en TCC',
 'Psicología Educativa, Clínica y TCC',
 'Psicóloga con formación en psicología educativa, clínica y terapia cognitivo conductual. Apoya tanto el ámbito académico como el emocional de niños, jóvenes y adultos.'),
('victor-solano', 'Victor Solano Gallardo', 'Psicólogo', 'psicologia',
 'Licenciado en Psicología · Maestría en Psicología Clínica · Certificación en Terapia de Aceptación y Compromiso (ACT)',
 'Terapia de Aceptación y Compromiso (ACT)',
 'Psicólogo especialista en Terapia de Aceptación y Compromiso (ACT). Su trabajo se centra en ayudar a las personas a convivir con sus pensamientos difíciles y a dirigir su vida hacia sus valores.'),
('kelly-alvarez', 'Kelly Alvarez Ramón', 'Nutrióloga', 'nutricion',
 'Licenciada en Nutrición · Especialización en Nutrición Clínica · Diplomado en Nutrición Deportiva',
 'Nutrición clínica, control de peso y alimentación saludable',
 'Nutrióloga con experiencia en nutrición clínica y educación alimentaria. Ayuda a sus pacientes a construir hábitos sostenibles que mejoren su salud y energía sin dietas restrictivas.'),
('carol-casas', 'Carol Casas Mayta', 'Fisioterapeuta', 'fisioterapia',
 'Licenciada en Tecnología Médica · Terapia Física y Rehabilitación · Diplomado en Rehabilitación Postural',
 'Rehabilitación integral y cuidado postural',
 'Fisioterapeuta con experiencia en rehabilitación integral y cuidado postural. Atiende lesiones musculoesqueléticas, dolores de espalda y procesos de recuperación postquirúrgica.')
on conflict (id) do nothing;

-- ============================================================
-- 8. SEED · HORARIOS
-- ============================================================

insert into public.schedule_blocks (professional_id, day, start_time, end_time)
select v.professional_id, v.day, v.start_time::time, v.end_time::time
from (values
  -- wilbert-barzola
  ('wilbert-barzola','Lunes','10:00','12:00'), ('wilbert-barzola','Lunes','12:00','13:00'),
  ('wilbert-barzola','Lunes','15:00','16:00'), ('wilbert-barzola','Lunes','16:00','17:30'),
  ('wilbert-barzola','Miércoles','15:00','16:00'), ('wilbert-barzola','Miércoles','16:00','17:30'), ('wilbert-barzola','Miércoles','17:30','19:00'),
  ('wilbert-barzola','Viernes','09:00','10:00'), ('wilbert-barzola','Viernes','10:00','12:00'), ('wilbert-barzola','Viernes','12:00','13:00'),
  -- hernan-sinche
  ('hernan-sinche','Martes','15:00','17:00'), ('hernan-sinche','Martes','17:00','18:00'), ('hernan-sinche','Martes','18:00','19:00'),
  ('hernan-sinche','Jueves','08:00','09:00'), ('hernan-sinche','Jueves','09:00','10:30'), ('hernan-sinche','Jueves','10:30','12:00'), ('hernan-sinche','Jueves','12:00','13:00'),
  ('hernan-sinche','Sábado','12:00','13:00'), ('hernan-sinche','Sábado','13:00','14:30'),
  -- patricia-quispe
  ('patricia-quispe','Lunes','15:00','16:00'), ('patricia-quispe','Lunes','16:00','17:30'), ('patricia-quispe','Lunes','17:30','19:00'),
  ('patricia-quispe','Miércoles','12:00','14:00'),
  ('patricia-quispe','Viernes','08:00','09:30'), ('patricia-quispe','Viernes','12:00','14:00'), ('patricia-quispe','Viernes','17:00','19:00'),
  -- ursula-jara
  ('ursula-jara','Martes','09:00','10:00'), ('ursula-jara','Martes','10:00','12:00'), ('ursula-jara','Martes','12:00','13:00'),
  ('ursula-jara','Jueves','09:00','10:30'), ('ursula-jara','Jueves','12:00','14:00'), ('ursula-jara','Jueves','15:00','17:00'),
  ('ursula-jara','Sábado','16:00','17:00'), ('ursula-jara','Sábado','17:00','19:00'),
  -- wendy-villaverde
  ('wendy-villaverde','Lunes','08:00','09:00'), ('wendy-villaverde','Lunes','09:00','10:30'), ('wendy-villaverde','Lunes','10:30','12:00'), ('wendy-villaverde','Lunes','12:00','13:00'),
  ('wendy-villaverde','Miércoles','15:00','17:00'), ('wendy-villaverde','Miércoles','17:00','18:00'), ('wendy-villaverde','Miércoles','18:00','19:00'),
  ('wendy-villaverde','Viernes','12:00','13:00'), ('wendy-villaverde','Viernes','13:00','14:30'),
  -- erika-morales
  ('erika-morales','Martes','08:00','09:30'), ('erika-morales','Martes','12:00','14:00'), ('erika-morales','Martes','17:00','19:00'),
  ('erika-morales','Jueves','09:00','10:00'), ('erika-morales','Jueves','10:00','12:00'), ('erika-morales','Jueves','12:00','13:00'),
  ('erika-morales','Sábado','15:00','16:00'), ('erika-morales','Sábado','16:00','17:30'), ('erika-morales','Sábado','17:30','19:00'),
  -- grecia-choque
  ('grecia-choque','Lunes','16:00','17:00'), ('grecia-choque','Lunes','17:00','19:00'),
  ('grecia-choque','Miércoles','10:00','12:00'), ('grecia-choque','Miércoles','12:00','13:00'), ('grecia-choque','Miércoles','15:00','16:00'), ('grecia-choque','Miércoles','16:00','17:30'),
  ('grecia-choque','Viernes','12:00','14:00'),
  -- dennys-caceres
  ('dennys-caceres','Martes','08:00','09:00'), ('dennys-caceres','Martes','09:00','10:30'), ('dennys-caceres','Martes','10:30','12:00'), ('dennys-caceres','Martes','12:00','13:00'),
  ('dennys-caceres','Jueves','15:00','16:00'), ('dennys-caceres','Jueves','16:00','17:30'), ('dennys-caceres','Jueves','17:30','19:00'),
  ('dennys-caceres','Sábado','09:00','10:00'), ('dennys-caceres','Sábado','10:00','12:00'), ('dennys-caceres','Sábado','12:00','13:00'),
  -- elizabeth-chirinos
  ('elizabeth-chirinos','Lunes','09:00','10:00'), ('elizabeth-chirinos','Lunes','10:00','12:00'), ('elizabeth-chirinos','Lunes','12:00','13:00'),
  ('elizabeth-chirinos','Miércoles','12:00','13:00'), ('elizabeth-chirinos','Miércoles','13:00','14:30'),
  ('elizabeth-chirinos','Viernes','09:00','10:30'), ('elizabeth-chirinos','Viernes','12:00','14:00'), ('elizabeth-chirinos','Viernes','15:00','17:00'),
  -- erick-garay
  ('erick-garay','Martes','10:00','12:00'), ('erick-garay','Martes','12:00','13:00'), ('erick-garay','Martes','15:00','16:00'), ('erick-garay','Martes','16:00','17:30'),
  ('erick-garay','Jueves','15:00','17:00'), ('erick-garay','Jueves','17:00','18:00'), ('erick-garay','Jueves','18:00','19:00'),
  ('erick-garay','Sábado','12:00','14:00'),
  -- diana-perez
  ('diana-perez','Lunes','16:00','17:00'), ('diana-perez','Lunes','17:00','19:00'),
  ('diana-perez','Miércoles','08:00','09:00'), ('diana-perez','Miércoles','09:00','10:30'), ('diana-perez','Miércoles','10:30','12:00'), ('diana-perez','Miércoles','12:00','13:00'),
  ('diana-perez','Viernes','15:00','16:00'), ('diana-perez','Viernes','16:00','17:30'), ('diana-perez','Viernes','17:30','19:00'),
  -- fanny-leon
  ('fanny-leon','Lunes','09:00','10:30'), ('fanny-leon','Lunes','12:00','14:00'), ('fanny-leon','Lunes','15:00','17:00'),
  ('fanny-leon','Miércoles','16:00','17:00'), ('fanny-leon','Miércoles','17:00','19:00'),
  ('fanny-leon','Viernes','08:00','09:00'), ('fanny-leon','Viernes','09:00','10:30'), ('fanny-leon','Viernes','10:30','12:00'), ('fanny-leon','Viernes','12:00','13:00'),
  -- leslie-soto
  ('leslie-soto','Martes','12:00','13:00'), ('leslie-soto','Martes','13:00','14:30'),
  ('leslie-soto','Jueves','08:00','09:30'), ('leslie-soto','Jueves','12:00','14:00'), ('leslie-soto','Jueves','17:00','19:00'),
  ('leslie-soto','Sábado','15:00','17:00'), ('leslie-soto','Sábado','17:00','18:00'), ('leslie-soto','Sábado','18:00','19:00'),
  -- maria-carrasco
  ('maria-carrasco','Lunes','08:00','09:00'), ('maria-carrasco','Lunes','09:00','10:30'), ('maria-carrasco','Lunes','10:30','12:00'), ('maria-carrasco','Lunes','12:00','13:00'),
  ('maria-carrasco','Miércoles','12:00','14:00'),
  ('maria-carrasco','Viernes','16:00','17:00'), ('maria-carrasco','Viernes','17:00','19:00'),
  -- morgana-yupanqui
  ('morgana-yupanqui','Martes','15:00','16:00'), ('morgana-yupanqui','Martes','16:00','17:30'), ('morgana-yupanqui','Martes','17:30','19:00'),
  ('morgana-yupanqui','Jueves','09:00','10:00'), ('morgana-yupanqui','Jueves','10:00','12:00'), ('morgana-yupanqui','Jueves','12:00','13:00'),
  ('morgana-yupanqui','Sábado','10:00','12:00'), ('morgana-yupanqui','Sábado','12:00','13:00'), ('morgana-yupanqui','Sábado','15:00','16:00'), ('morgana-yupanqui','Sábado','16:00','17:30'),
  -- nohely-segura
  ('nohely-segura','Lunes','15:00','17:00'), ('nohely-segura','Lunes','17:00','18:00'), ('nohely-segura','Lunes','18:00','19:00'),
  ('nohely-segura','Miércoles','09:00','10:30'), ('nohely-segura','Miércoles','12:00','14:00'), ('nohely-segura','Miércoles','15:00','17:00'),
  ('nohely-segura','Viernes','12:00','13:00'), ('nohely-segura','Viernes','13:00','14:30'),
  -- sandra-tapara
  ('sandra-tapara','Martes','09:00','10:30'), ('sandra-tapara','Martes','12:00','14:00'), ('sandra-tapara','Martes','15:00','17:00'),
  ('sandra-tapara','Jueves','15:00','16:00'), ('sandra-tapara','Jueves','16:00','17:30'), ('sandra-tapara','Jueves','17:30','19:00'),
  ('sandra-tapara','Sábado','08:00','09:00'), ('sandra-tapara','Sábado','09:00','10:30'), ('sandra-tapara','Sábado','10:30','12:00'), ('sandra-tapara','Sábado','12:00','13:00'),
  -- yurith-guidotti
  ('yurith-guidotti','Lunes','08:00','09:00'), ('yurith-guidotti','Lunes','09:00','10:30'), ('yurith-guidotti','Lunes','10:30','12:00'), ('yurith-guidotti','Lunes','12:00','13:00'),
  ('yurith-guidotti','Miércoles','15:00','17:00'), ('yurith-guidotti','Miércoles','17:00','18:00'), ('yurith-guidotti','Miércoles','18:00','19:00'),
  ('yurith-guidotti','Viernes','09:00','10:30'), ('yurith-guidotti','Viernes','12:00','14:00'), ('yurith-guidotti','Viernes','15:00','17:00'),
  -- zenaida-miguel
  ('zenaida-miguel','Martes','09:00','10:00'), ('zenaida-miguel','Martes','10:00','12:00'), ('zenaida-miguel','Martes','12:00','13:00'),
  ('zenaida-miguel','Jueves','16:00','17:00'), ('zenaida-miguel','Jueves','17:00','19:00'),
  ('zenaida-miguel','Sábado','10:00','12:00'), ('zenaida-miguel','Sábado','12:00','13:00'), ('zenaida-miguel','Sábado','15:00','16:00'), ('zenaida-miguel','Sábado','16:00','17:30'),
  -- marilia-nunez
  ('marilia-nunez','Lunes','12:00','13:00'), ('marilia-nunez','Lunes','13:00','14:30'),
  ('marilia-nunez','Miércoles','09:00','10:00'), ('marilia-nunez','Miércoles','10:00','12:00'), ('marilia-nunez','Miércoles','12:00','13:00'),
  ('marilia-nunez','Viernes','15:00','17:00'), ('marilia-nunez','Viernes','17:00','18:00'), ('marilia-nunez','Viernes','18:00','19:00'),
  -- victor-solano
  ('victor-solano','Martes','15:00','16:00'), ('victor-solano','Martes','16:00','17:30'), ('victor-solano','Martes','17:30','19:00'),
  ('victor-solano','Jueves','10:00','12:00'), ('victor-solano','Jueves','12:00','13:00'), ('victor-solano','Jueves','15:00','16:00'), ('victor-solano','Jueves','16:00','17:30'),
  ('victor-solano','Sábado','12:00','14:00'),
  -- kelly-alvarez
  ('kelly-alvarez','Lunes','09:00','10:00'), ('kelly-alvarez','Lunes','10:00','12:00'), ('kelly-alvarez','Lunes','12:00','13:00'),
  ('kelly-alvarez','Miércoles','16:00','17:00'), ('kelly-alvarez','Miércoles','17:00','19:00'),
  ('kelly-alvarez','Sábado','08:00','09:00'), ('kelly-alvarez','Sábado','09:00','10:30'), ('kelly-alvarez','Sábado','10:30','12:00'), ('kelly-alvarez','Sábado','12:00','13:00'),
  -- carol-casas
  ('carol-casas','Martes','08:00','09:00'), ('carol-casas','Martes','09:00','10:30'), ('carol-casas','Martes','10:30','12:00'), ('carol-casas','Martes','12:00','13:00'),
  ('carol-casas','Jueves','08:00','09:30'), ('carol-casas','Jueves','12:00','14:00'), ('carol-casas','Jueves','17:00','19:00'),
  ('carol-casas','Sábado','15:00','16:00'), ('carol-casas','Sábado','16:00','17:30'), ('carol-casas','Sábado','17:30','19:00')
) as v(professional_id, day, start_time, end_time)
on conflict (professional_id, day, start_time) do nothing;

-- ============================================================
-- 9. SEED · SERVICIOS (24)
-- ============================================================

insert into public.services (category, name, icon, rating, reviews, description, detail) values
('psiquiatria','Psicoterapia individual','🧠',4.8,127,
 'La finalidad de la terapia individual es ayudarte a entender tu forma de comportarte, tus emociones y cómo tu forma de plantearte las cosas te lleva a sentirte como te sientes y actuar como actúas. Esto te permite liberarte de las emociones negativas y mejorar tu capacidad para tomar decisiones.',
 'Incluye evaluación inicial, plan de tratamiento personalizado, sesiones semanales de 50 minutos, seguimiento y reevaluaciones periódicas. Utilizamos enfoques basados en evidencia científica.'),
('psiquiatria','Psicoterapia familiar','👨‍👩‍👧‍👦',4.7,89,
 'La terapia familiar ayuda a identificar formas de relacionarse en la familia que no son sanas para el desarrollo personal. Los conflictos derivados de la falta de comunicación eficaz o de las pautas de relación provocan que más de un miembro de la familia se encuentre mal.',
 'Sesiones de 90 minutos donde participan los miembros clave de la familia. Trabajamos roles, patrones de comunicación, límites y creación de un ambiente familiar saludable.'),
('psiquiatria','Terapia de pareja','💑',4.9,103,
 'En nuestro servicio de Terapia de Pareja, te brindamos un proceso que tiene como objetivo mejorar tu calidad de vida, el de tu pareja, y por lo tanto, el de tu relación, bajo el acompañamiento de un profesional.',
 'Abordamos comunicación, resolución de conflictos, infidelidad, crisis de pareja, recuperación de la confianza y fortalecimiento del vínculo. Sesiones de 60 minutos.'),
('psiquiatria','Orientación psicológica','💡',4.6,74,
 'La orientación psicológica nace como respuesta a exigencias de desarrollo social; se contextualiza en el área escolar, laboral, familiar y personal para promover el crecimiento.',
 'Sesiones breves (3-5 encuentros) orientadas a resolver situaciones puntuales, toma de decisiones, orientación vocacional o adaptación a cambios importantes de vida.'),
('psicologia','Consejería psicológica','💬',4.7,95,
 'La consejería incluye intervenciones tanto individuales como grupales, ayudando en la búsqueda de alternativas o soluciones a las personas que consultan, con un servicio más a corto plazo que la psicoterapia.',
 'Ideal para momentos de crisis, transiciones de vida, toma de decisiones o cuando necesitas un espacio seguro para reflexionar. 4-8 sesiones.'),
('psicologia','Evaluación psicológica','📋',4.8,112,
 'Realizamos evaluaciones psicológicas completas para determinar el estado emocional, cognitivo y conductual del paciente. Incluye pruebas psicométricas, entrevistas clínicas y observación directa.',
 'Proceso de 2-3 sesiones que incluye batería de tests psicológicos, entrevista clínica detallada, elaboración de informe con diagnóstico, hallazgos y recomendaciones.'),
('psicologia','Terapia cognitivo conductual','🔄',4.9,156,
 'La TCC es una de las terapias más efectivas para tratar la depresión, ansiedad, fobias y otros trastornos. Se enfoca en identificar y modificar patrones de pensamiento negativos.',
 'Tratamiento estructurado de 12-20 sesiones con tareas entre sesiones. Eficaz para depresión, ansiedad generalizada, TOC, fobias, estrés postraumático y trastornos de conducta alimentaria.'),
('psicologia','Terapia infantil y juvenil','🧒',4.8,88,
 'Atención especializada para niños y adolescentes que presentan dificultades emocionales, conductuales o de adaptación. Utilizamos técnicas lúdicas y adaptadas a su edad.',
 'Incluye evaluación del desarrollo, intervención conductual, terapia de juego, habilidades sociales, manejo del TEA, TDAH, bullying y problemas de conducta.'),
('terapias','Clínica de día','🏥',4.7,64,
 'Programa terapéutico intensivo para pacientes que requieren un acompañamiento más frecuente. Incluye actividades grupales, talleres de habilidades y seguimiento personalizado.',
 'Programa de lunes a viernes, 4 horas diarias. Incluye terapia individual, grupal, talleres de arte, musicoterapia, psicoeducación y habilidades para la vida.'),
('terapias','Grupo Kurame','🤝',4.6,42,
 'Espacio terapéutico grupal diseñado para fortalecer el sentido de comunidad y apoyo mutuo. Los participantes comparten experiencias y aprenden estrategias de afrontamiento.',
 'Grupo de 8-12 participantes que se reúne semanalmente. Temas: autoestima, manejo de emociones, relaciones interpersonales y construcción de red de apoyo.'),
('terapias','Grupo de habilidades','🎯',4.5,38,
 'Talleres enfocados en el desarrollo de habilidades sociales, emocionales y de comunicación. Ideal para personas que buscan mejorar sus relaciones interpersonales.',
 'Ciclos de 8 semanas. Contenido: asertividad, escucha activa, manejo de conflictos, inteligencia emocional, regulación del estrés y comunicación no violenta.'),
('terapias','Terapia grupal para ansiedad','🌊',4.7,56,
 'El objetivo es que las personas potencien entre sí el cambio de conductas y hábitos deseados para resolver determinado conflicto o trauma. Se recomienda para romper el aislamiento.',
 'Grupo cerrado de 10 sesiones. Técnicas: relajación, respiración, exposición gradual, reestructuración cognitiva y apoyo mutuo. Para personas con ansiedad generalizada, social o ataques de pánico.'),
('nutricion','Evaluación nutricional','🍎',4.8,93,
 'Análisis completo de tu estado nutricional, incluyendo composición corporal, hábitos alimentarios y necesidades específicas. Identificamos deficiencias y establecemos un plan.',
 'Incluye antropometría, análisis de composición corporal (bioimpedancia), historial alimentario de 3 días, cuestionario de hábitos y estilo de vida. Informe detallado con recomendaciones.'),
('nutricion','Plan alimentario personalizado','🥗',4.7,81,
 'Diseñamos un plan de alimentación adaptado a tus objetivos, estilo de vida y condiciones de salud. Ya sea que busques perder peso, ganar masa muscular o mejorar tu rendimiento.',
 'Plan semanal con recetas, lista de compras, guía de porciones, ajustes cada 2 semanas. Incluye seguimiento mensual y modificaciones según avance.'),
('nutricion','Nutrición clínica','⚕️',4.9,107,
 'Tratamiento nutricional para patologías como diabetes, hipertensión, colesterol alto, problemas digestivos y más. Trabajamos de la mano con tu médico.',
 'Dietas terapéuticas personalizadas, educación alimentaria, control de indicadores clínicos, coordinación con el equipo médico tratante. Seguimiento quincenal.'),
('nutricion','Nutrición deportiva','💪',4.6,59,
 'Optimiza tu rendimiento físico con una alimentación estratégica. Te ayudamos a alcanzar tus metas deportivas con planes de hidratación, suplementación y nutrición.',
 'Planes para ganancia muscular, definición, resistencia. Incluye timing nutricional, suplementación basada en evidencia, hidratación y recuperación.'),
('fisioterapia','Rehabilitación física','🦾',4.8,76,
 'Programas de recuperación funcional para lesiones musculoesqueléticas, postquirúrgicas y crónicas. Utilizamos técnicas avanzadas para restaurar la movilidad.',
 'Evaluación musculoesquelética completa, plan de ejercicios progresivos, terapia manual, electroterapia, ondas de choque y reentrenamiento funcional.'),
('fisioterapia','Terapia postural','🧍',4.7,63,
 'Corrección de hábitos posturales que generan dolor y limitaciones. Evaluamos tu postura en diferentes actividades y te enseñamos ejercicios específicos.',
 'Análisis postural estático y dinámico, corrección de desviaciones, programa de ejercicios domiciliarios, ergonomicidad laboral y seguimiento.'),
('fisioterapia','Dolor crónico','🩹',4.8,84,
 'Tratamiento especializado para pacientes con dolor crónico de espalda, cuello, articulaciones y otras áreas. Combinamos terapia manual, ejercicios y educación.',
 'Abordaje multimodal: terapia manual, punción seca, exercise therapy, psicoeducación en dolor, técnicas de relajación y modulación del dolor.'),
('fisioterapia','Piso pélvico','🩺',4.9,71,
 'Rehabilitación del suelo pélvico para incontinencia urinaria, prolapsos, dolor pélvico y recuperación postparto. Tratamiento confidencial y especializado.',
 'Evaluación y tratamiento de suelo pélvico con biofeedback, electroestimulación, ejercicios de Kegel progresivos, educación y reentrenamiento funcional.'),
('cursos','Talleres de inteligencia emocional','🎭',4.7,92,
 'Aprende a identificar, comprender y gestionar tus emociones de manera efectiva. Desarrolla habilidades para la empatía, la autorregulación y la toma de decisiones.',
 'Curso de 6 semanas (2 horas/semana). Módulos: autoconocimiento, regulación emocional, empatía, habilidades sociales, motivación y manejo del estrés.'),
('cursos','Cursos de manejo del estrés','🧘',4.8,105,
 'Herramientas prácticas para reducir el estrés y la ansiedad en el día a día. Incluye técnicas de relajación, mindfulness, respiración y planificación efectiva.',
 'Programa de 4 semanas. Incluye mindfulness, respiración diafragmática, meditación guiada, planificación del tiempo, establecimiento de límites y autocuidado.'),
('cursos','Talleres para padres','👪',4.6,78,
 'Espacio de aprendizaje para padres que buscan mejorar su relación con sus hijos. Crianza positiva, comunicación efectiva, límites saludables y manejo de conductas.',
 'Taller de 4 sesiones. Temas: vínculo seguro, comunicación no violenta, límites y consecuencias, manejo de berrinches, autoestima infantil y prevención del bullying.'),
('cursos','Capacitación empresarial','🏢',4.7,46,
 'Programas de salud mental ocupacional para empresas. Talleres de bienestar, prevención del burnout, comunicación asertiva y liderazgo emocional.',
 'Programas personalizados de 1-4 días. Temas: prevención de burnout, manejo del estrés laboral, comunicación asertiva, liderazgo emocional, team building.')
on conflict (category, name) do nothing;

-- ============================================================
-- 10. SEED · COMENTARIOS (semilla del front)
-- ============================================================

insert into public.comments (professional_id, author_name, stars, body, created_at) values
('wilbert-barzola','Karla R.',5,'Excelente profesional, muy humano y empático. Nos ayudó muchísimo como familia.','2026-09-10'),
('wilbert-barzola','Jorge E.',5,'Gran médico psiquiatra, recomiendo sus terapias de pareja.','2026-08-22'),
('hernan-sinche','Rosa L.',5,'Muy buena atención con mi hijo adolescente. Se nota la experiencia.','2026-09-01'),
('patricia-quispe','Carmen V.',5,'Me ayudó a atravesar un duelo muy difícil. Profesional y muy humana.','2026-08-30'),
('ursula-jara','Miguel A.',4,'Muy recomendable para el manejo del estrés laboral.','2026-07-18'),
('wendy-villaverde','María P.',5,'Atención cálida y muy profesional. Me siento en buenas manos.','2026-09-12'),
('erika-morales','Luis M.',5,'Un enfoque profundo y diferente. Muy agradecido con su trabajo.','2026-08-14'),
('grecia-choque','Ana R.',5,'Las técnicas de mindfulness me cambiaron la vida. Muy recomendada.','2026-09-05'),
('dennys-caceres','Pedro G.',5,'Mi hijo avanzó muchísimo. Trato paciente y muy profesional.','2026-08-19'),
('elizabeth-chirinos','Karla R.',5,'Excelente con los niños, muy didáctica y paciente.','2026-09-08'),
('erick-garay','Juan C.',5,'Me ayudó a superar mi ansiedad en pocas sesiones.','2026-09-02'),
('diana-perez','Rosa L.',4,'Profesional muy seria y rigurosa en su evaluación.','2026-07-25'),
('fanny-leon','María P.',5,'La TCC con la Dra. Fanny fue un antes y un después.','2026-08-28'),
('leslie-soto','Carmen V.',5,'Gracias a sus herramientas he logrado manejar mejor mis emociones.','2026-09-06'),
('maria-carrasco','Miguel A.',5,'Muy empática, me sentí cómodo desde la primera sesión.','2026-07-30'),
('morgana-yupanqui','Ana R.',4,'Muy profesional. Voy avanzando sesión a sesión.','2026-08-11'),
('nohely-segura','Pedro G.',5,'Muy buena comunicación y gran compromiso con mis citas.','2026-09-04'),
('sandra-tapara','Rosa L.',5,'Recuperamos nuestra relación gracias a su acompañamiento.','2026-08-25'),
('yurith-guidotti','Jorge E.',5,'Su calidez y profesionalismo me hicieron sentir acompañado.','2026-07-27'),
('zenaida-miguel','Carmen V.',5,'El enfoque ACT me ayudó a reconectar con lo que realmente valoro.','2026-09-09'),
('marilia-nunez','Karla R.',5,'Acompañó a mi hija en su etapa escolar con excelentes resultados.','2026-08-02'),
('victor-solano','Miguel A.',5,'Mejoró mi relación con mis propias emociones. Muy recomendado.','2026-09-03'),
('kelly-alvarez','Carmen V.',5,'Logré mis metas de peso de forma saludable y sin efectos rebote.','2026-09-11'),
('carol-casas','Pedro G.',5,'Me recuperé de mi lesión de espalda mucho más rápido de lo esperado.','2026-08-20')
on conflict (professional_id, author_name, created_at) do nothing;

-- ============================================================
-- 11. VERIFICACIÓN
-- ============================================================

-- select count(*) as profesionales from public.professionals;       -- esperado: 23
-- select count(*) as bloques from public.schedule_blocks;           -- esperado: 200
-- select count(*) as servicios from public.services;                -- esperado: 24
-- select count(*) as comentarios from public.comments;              -- esperado: 24
