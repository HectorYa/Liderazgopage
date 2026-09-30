// ============================================
// EXCELENTEMENTE - Datos de profesionales
// ============================================

// Bloques de horario no repetitivos (variedad de 1h, 1h30 y 2h; tope 19:00)
const PATRONES_HORARIOS = {
  mananaA: ['09:00-10:00', '10:00-12:00', '12:00-13:00'],
  mananaB: ['08:00-09:00', '09:00-10:30', '10:30-12:00', '12:00-13:00'],
  mediaC: ['12:00-13:00', '13:00-14:30'],
  mediaD: ['12:00-14:00'],
  tardeA: ['15:00-16:00', '16:00-17:30', '17:30-19:00'],
  tardeB: ['15:00-17:00', '17:00-18:00', '18:00-19:00'],
  tardeC: ['16:00-17:00', '17:00-19:00'],
  mixA: ['09:00-10:30', '12:00-14:00', '15:00-17:00'],
  mixB: ['10:00-12:00', '12:00-13:00', '15:00-16:00', '16:00-17:30'],
  mixC: ['08:00-09:30', '12:00-14:00', '17:00-19:00']
};

function parseBloque(range) {
  const [inicio, fin] = range.split('-');
  return { inicio, fin };
}

function buildSchedule(config) {
  return config.map(([day, patron]) => ({
    day,
    bloques: PATRONES_HORARIOS[patron].map(parseBloque)
  }));
}

const PROFESIONALES_PUBLICOS = [
  // ========== PSIQUIATRÍA ==========
  {
    id: 'wilbert-barzola',
    name: 'Wilbert Barzola Huamán',
    role: 'Médico Psiquiatra',
    category: 'psiquiatria',
    degree: 'Médico Cirujano · Especialista en Psiquiatría · Maestría en Terapia Sistémica Familiar y de Parejas',
    specialty: 'Terapia familiar y de parejas, salud mental',
    bio: 'Médico Psiquiatra con amplia trayectoria en el acompañamiento de familias y parejas. Su enfoque integra la psiquiatría clínica con psicoterapia sistémica, ayudando a sus pacientes a reconstruir vínculos y fortalecer su bienestar emocional.',
    schedule: buildSchedule([['Lunes', 'mixB'], ['Miércoles', 'tardeA'], ['Viernes', 'mananaA']]),
    comments: [
      { user: 'Karla R.', stars: 5, text: 'Excelente profesional, muy humano y empático. Nos ayudó muchísimo como familia.', date: '2026-09-10' },
      { user: 'Jorge E.', stars: 5, text: 'Gran médico psiquiatra, recomiendo sus terapias de pareja.', date: '2026-08-22' }
    ]
  },
  {
    id: 'hernan-sinche',
    name: 'Hernan Sinche Espinal',
    role: 'Médico Psiquiatra',
    category: 'psiquiatria',
    degree: 'Médico Cirujano · Especialista en Psiquiatría Infantil y del Adolescente · Diplomado en Salud Mental Comunitaria',
    specialty: 'Salud mental, psiquiatría clínica, infantil y del adolescente',
    bio: 'Psiquiatra con especialización en psiquiatría clínica, infantil y del adolescente. Atiende a pacientes de todas las edades con un trato cercano y basado en la evidencia, priorizando siempre el acompañamiento a la familia.',
    schedule: buildSchedule([['Martes', 'tardeB'], ['Jueves', 'mananaB'], ['Sábado', 'mediaC']]),
    comments: [
      { user: 'Rosa L.', stars: 5, text: 'Muy buena atención con mi hijo adolescente. Se nota la experiencia.', date: '2026-09-01' }
    ]
  },
  {
    id: 'patricia-quispe',
    name: 'Patricia Quispe Baltazar',
    role: 'Médico Psiquiatra',
    category: 'psiquiatria',
    degree: 'Médico Cirujano · Especialista en Psiquiatría · Diplomado en Trauma y Psicotraumatología',
    specialty: 'Trauma psicológico, duelo y resiliencia',
    bio: 'Especialista en el abordaje del trauma psicológico, los procesos de duelo y la resiliencia. Su práctica se centra en crear un espacio seguro para que sus pacientes puedan sanar a su propio ritmo.',
    schedule: buildSchedule([['Lunes', 'tardeA'], ['Miércoles', 'mediaD'], ['Viernes', 'mixC']]),
    comments: [
      { user: 'Carmen V.', stars: 5, text: 'Me ayudó a atravesar un duelo muy difícil. Profesional y muy humana.', date: '2026-08-30' }
    ]
  },
  {
    id: 'ursula-jara',
    name: 'Ursula Victoria Jara Huancaya',
    role: 'Médico Psiquiatra',
    category: 'psiquiatria',
    degree: 'Médico Cirujano · Especialista en Psiquiatría · Maestría en Gestión del Bienestar Ocupacional',
    specialty: 'Psiquiatría clínica y bienestar ocupacional',
    bio: 'Psiquiatra clínica con interés en el bienestar ocupacional y el manejo del estrés laboral. Orientada a prevenir el desgaste emocional y a promover una vida equilibrada.',
    schedule: buildSchedule([['Martes', 'mananaA'], ['Jueves', 'mixA'], ['Sábado', 'tardeC']]),
    comments: [
      { user: 'Miguel A.', stars: 4, text: 'Muy recomendable para el manejo del estrés laboral.', date: '2026-07-18' }
    ]
  },
  {
    id: 'wendy-villaverde',
    name: 'Wendy Grethel Villaverde',
    role: 'Médico Psiquiatra',
    category: 'psiquiatria',
    degree: 'Médico Cirujano · Especialista en Psiquiatría Clínica · Diplomado en Psicofarmacología',
    specialty: 'Salud mental y psiquiatría clínica',
    bio: 'Médico Psiquiatra dedicada al diagnóstico y tratamiento de los principales trastornos de salud mental. Su atención se caracteriza por la escucha activa y el seguimiento cercano de cada paciente.',
    schedule: buildSchedule([['Lunes', 'mananaB'], ['Miércoles', 'tardeB'], ['Viernes', 'mediaC']]),
    comments: [
      { user: 'María P.', stars: 5, text: 'Atención cálida y muy profesional. Me siento en buenas manos.', date: '2026-09-12' }
    ]
  },
  {
    id: 'erika-morales',
    name: 'Erika Morales Zenteno',
    role: 'Médico Psiquiatra',
    category: 'psiquiatria',
    degree: 'Médico Cirujano · Especialista en Psiquiatría · Formación en Psicoterapia Psicoanalítica y Multifamiliar',
    specialty: 'Psicoterapia psicoanalítica y multifamiliar',
    bio: 'Psiquiatra con formación en psicoterapia psicoanalítica y enfoque multifamiliar. Trabaja con profundidad los procesos inconscientes y las dinámicas familiares que sostienen los conflictos.',
    schedule: buildSchedule([['Martes', 'mixC'], ['Jueves', 'mananaA'], ['Sábado', 'tardeA']]),
    comments: [
      { user: 'Luis M.', stars: 5, text: 'Un enfoque profundo y diferente. Muy agradecido con su trabajo.', date: '2026-08-14' }
    ]
  },
  {
    id: 'grecia-choque',
    name: 'Grecia Choque Zamata',
    role: 'Médico Psiquiatra',
    category: 'psiquiatria',
    degree: 'Médico Cirujano · Especialista en Psiquiatría · Certificación en Terapia de Esquemas y Mindfulness',
    specialty: 'Terapia de Esquemas y Mindfulness',
    bio: 'Especialista en Terapia de Esquemas y Mindfulness. Integra la psiquiatría con prácticas de atención plena para el tratamiento de la ansiedad, la depresión y los patrones emocionales repetitivos.',
    schedule: buildSchedule([['Lunes', 'tardeC'], ['Miércoles', 'mixB'], ['Viernes', 'mediaD']]),
    comments: [
      { user: 'Ana R.', stars: 5, text: 'Las técnicas de mindfulness me cambiaron la vida. Muy recomendada.', date: '2026-09-05' }
    ]
  },

  // ========== PSICOLOGÍA ==========
  {
    id: 'dennys-caceres',
    name: 'Dennys Caceres Nuñez',
    role: 'Psicólogo',
    category: 'psicologia',
    degree: 'Licenciado en Psicología · Especialización en Análisis de la Conducta · Diplomado en Terapia Racional Emotiva Conductual (TREC)',
    specialty: 'Conducta y TREC en población infanto-juvenil',
    bio: 'Psicólogo especializado en el análisis de la conducta y la Terapia Racional Emotiva Conductual (TREC) en niños y adolescentes. Ayuda a sus pacientes a identificar creencias que limitan y a desarrollar habilidades emocionales.',
    schedule: buildSchedule([['Martes', 'mananaB'], ['Jueves', 'tardeA'], ['Sábado', 'mananaA']]),
    comments: [
      { user: 'Pedro G.', stars: 5, text: 'Mi hijo avanzó muchísimo. Trato paciente y muy profesional.', date: '2026-08-19' }
    ]
  },
  {
    id: 'elizabeth-chirinos',
    name: 'Elizabeth Chirinos Espinoza',
    role: 'Psicóloga',
    category: 'psicologia',
    degree: 'Licenciada en Psicología · Maestría en Psicología Clínica · Especialización en Evaluación Psicológica Infantil',
    specialty: 'Evaluación clínica y terapia infantil',
    bio: 'Psicóloga clínica especialista en evaluación psicológica y terapia infantil. Cuenta con experiencia en el diagnóstico temprano de dificultades emocionales y del desarrollo en la primera infancia.',
    schedule: buildSchedule([['Lunes', 'mananaA'], ['Miércoles', 'mediaC'], ['Viernes', 'mixA']]),
    comments: [
      { user: 'Karla R.', stars: 5, text: 'Excelente con los niños, muy didáctica y paciente.', date: '2026-09-08' }
    ]
  },
  {
    id: 'erick-garay',
    name: 'Erick Garay Alvarado',
    role: 'Psicólogo',
    category: 'psicologia',
    degree: 'Licenciado en Psicología · Maestría en Psicología Clínica · Diplomado en Tratamiento de Ansiedad y Depresión',
    specialty: 'Ansiedad y depresión',
    bio: 'Psicólogo clínico enfocado en el tratamiento de la ansiedad y la depresión. Combina técnicas cognitivo conductuales con estrategias de regulación emocional para que sus pacientes recuperen su calidad de vida.',
    schedule: buildSchedule([['Martes', 'mixB'], ['Jueves', 'tardeB'], ['Sábado', 'mediaD']]),
    comments: [
      { user: 'Juan C.', stars: 5, text: 'Me ayudó a superar mi ansiedad en pocas sesiones.', date: '2026-09-02' }
    ]
  },
  {
    id: 'diana-perez',
    name: 'Diana Perez Saboya',
    role: 'Psicóloga',
    category: 'psicologia',
    degree: 'Licenciada en Psicología · Especialización en Psicología Forense · Diplomado en Peritaje Psicológico',
    specialty: 'Evaluación psicológica forense',
    bio: 'Psicóloga especialista en evaluación psicológica forense. Realiza peritajes e informes con rigor científico, además de intervenciones clínicas basadas en la evidencia.',
    schedule: buildSchedule([['Lunes', 'tardeC'], ['Miércoles', 'mananaB'], ['Viernes', 'tardeA']]),
    comments: [
      { user: 'Rosa L.', stars: 4, text: 'Profesional muy seria y rigurosa en su evaluación.', date: '2026-07-25' }
    ]
  },
  {
    id: 'fanny-leon',
    name: 'Fanny León Nuñez',
    role: 'Psicóloga',
    category: 'psicologia',
    degree: 'Licenciada en Psicología · Diplomado en Terapia Cognitivo Conductual · Formación en TCC de tercera generación',
    specialty: 'Terapia Cognitivo Conductual (TCC)',
    bio: 'Psicóloga con sólida formación en Terapia Cognitivo Conductual. Ayuda a sus pacientes a identificar y modificar patrones de pensamiento y conducta que generan malestar.',
    schedule: buildSchedule([['Lunes', 'mixA'], ['Miércoles', 'tardeC'], ['Viernes', 'mananaB']]),
    comments: [
      { user: 'María P.', stars: 5, text: 'La TCC con la Dra. Fanny fue un antes y un después.', date: '2026-08-28' }
    ]
  },
  {
    id: 'leslie-soto',
    name: 'Leslie Soto Hurtado',
    role: 'Psicóloga',
    category: 'psicologia',
    degree: 'Licenciada en Psicología · Especialización en DBT · Diplomado en Regulación Emocional',
    specialty: 'Terapia Dialéctico Conductual (DBT) y Psicología Clínica',
    bio: 'Psicóloga clínica especialista en Terapia Dialéctico Conductual (DBT). Trabaja con personas con desregulación emocional intensa, brindando herramientas concretas para el manejo de emociones fuertes.',
    schedule: buildSchedule([['Martes', 'mediaC'], ['Jueves', 'mixC'], ['Sábado', 'tardeB']]),
    comments: [
      { user: 'Carmen V.', stars: 5, text: 'Gracias a sus herramientas he logrado manejar mejor mis emociones.', date: '2026-09-06' }
    ]
  },
  {
    id: 'maria-carrasco',
    name: 'Maria Carrasco Araujo',
    role: 'Psicóloga',
    category: 'psicologia',
    degree: 'Licenciada en Psicología · Maestría en Psicoterapia · Especialización en Psicología Clínica',
    specialty: 'Psicología Clínica y Psicoterapia Clínica',
    bio: 'Psicóloga clínica dedicada a la psicoterapia individual de adultos. Acompaña procesos de autoconocimiento, manejo de crisis y fortalecimiento de la autoestima.',
    schedule: buildSchedule([['Lunes', 'mananaB'], ['Miércoles', 'mediaD'], ['Viernes', 'tardeC']]),
    comments: [
      { user: 'Miguel A.', stars: 5, text: 'Muy empática, me sentí cómodo desde la primera sesión.', date: '2026-07-30' }
    ]
  },
  {
    id: 'morgana-yupanqui',
    name: 'Morgana Yupanqui García',
    role: 'Psicóloga',
    category: 'psicologia',
    degree: 'Licenciada en Psicología · Diplomado en TCC · Formación en Terapia de Aceptación y Compromiso',
    specialty: 'Terapia Cognitivo Conductual',
    bio: 'Psicóloga con formación en Terapia Cognitivo Conductual. Orienta su trabajo a la reestructuración de pensamientos negativos y al desarrollo de estrategias de afrontamiento efectivas.',
    schedule: buildSchedule([['Martes', 'tardeA'], ['Jueves', 'mananaA'], ['Sábado', 'mixB']]),
    comments: [
      { user: 'Ana R.', stars: 4, text: 'Muy profesional. Voy avanzando sesión a sesión.', date: '2026-08-11' }
    ]
  },
  {
    id: 'nohely-segura',
    name: 'Nohely Segura Ortega',
    role: 'Psicóloga',
    category: 'psicologia',
    degree: 'Licenciada en Psicología · Especialización en Psicoterapia Cognitivo Conductual',
    specialty: 'Psicoterapia cognitivo conductual',
    bio: 'Psicóloga especialista en psicoterapia cognitivo conductual para niños, adolescentes y adultos. Enfocada en resultados medibles y en la participación activa del paciente en su proceso.',
    schedule: buildSchedule([['Lunes', 'tardeB'], ['Miércoles', 'mixA'], ['Viernes', 'mediaC']]),
    comments: [
      { user: 'Pedro G.', stars: 5, text: 'Muy buena comunicación y gran compromiso con mis citas.', date: '2026-09-04' }
    ]
  },
  {
    id: 'sandra-tapara',
    name: 'Sandra Tapara Aquino',
    role: 'Psicóloga',
    category: 'psicologia',
    degree: 'Licenciada en Psicología · Maestría en Terapia de Pareja · Diplomado en Enfoque Multimodal',
    specialty: 'Terapias de pareja desde un enfoque Multimodal',
    bio: 'Psicóloga especialista en terapia de parejas desde un enfoque multimodal. Acompaña a las parejas en la resolución de conflictos, la comunicación y el fortalecimiento del vínculo.',
    schedule: buildSchedule([['Martes', 'mixA'], ['Jueves', 'tardeA'], ['Sábado', 'mananaB']]),
    comments: [
      { user: 'Rosa L.', stars: 5, text: 'Recuperamos nuestra relación gracias a su acompañamiento.', date: '2026-08-25' }
    ]
  },
  {
    id: 'yurith-guidotti',
    name: 'Yurith Guidotti Palacios',
    role: 'Psicóloga',
    category: 'psicologia',
    degree: 'Licenciada en Psicología · Maestría en Psicología Clínica · Diplomado en Inteligencia Emocional',
    specialty: 'Psicología Clínica y Terapia Emocional',
    bio: 'Psicóloga clínica enfocada en la terapia emocional y el trabajo de la inteligencia emocional. Acompaña procesos de duelo, ansiedad y desarrollo personal.',
    schedule: buildSchedule([['Lunes', 'mananaB'], ['Miércoles', 'tardeB'], ['Viernes', 'mixA']]),
    comments: [
      { user: 'Jorge E.', stars: 5, text: 'Su calidez y profesionalismo me hicieron sentir acompañado.', date: '2026-07-27' }
    ]
  },
  {
    id: 'zenaida-miguel',
    name: 'Zenaida Miguel Contreras',
    role: 'Psicóloga',
    category: 'psicologia',
    degree: 'Licenciada en Psicología · Especialización en DBT · Certificación en Terapia de Aceptación y Compromiso (ACT)',
    specialty: 'Psicología Clínica, DBT y Terapia de Aceptación y Compromiso (ACT)',
    bio: 'Psicóloga clínica con formación en Terapia Dialéctico Conductual (DBT) y Terapia de Aceptación y Compromiso (ACT). Combina el mindfulness con el trabajo de valores personales.',
    schedule: buildSchedule([['Martes', 'mananaA'], ['Jueves', 'tardeC'], ['Sábado', 'mixB']]),
    comments: [
      { user: 'Carmen V.', stars: 5, text: 'El enfoque ACT me ayudó a reconectar con lo que realmente valoro.', date: '2026-09-09' }
    ]
  },
  {
    id: 'marilia-nunez',
    name: 'Marilia Núñez Sotelo',
    role: 'Psicóloga',
    category: 'psicologia',
    degree: 'Licenciada en Psicología · Especialización en Psicología Educativa y Clínica · Diplomado en TCC',
    specialty: 'Psicología Educativa, Clínica y TCC',
    bio: 'Psicóloga con formación en psicología educativa, clínica y terapia cognitivo conductual. Apoya tanto el ámbito académico como el emocional de niños, jóvenes y adultos.',
    schedule: buildSchedule([['Lunes', 'mediaC'], ['Miércoles', 'mananaA'], ['Viernes', 'tardeB']]),
    comments: [
      { user: 'Karla R.', stars: 5, text: 'Acompañó a mi hija en su etapa escolar con excelentes resultados.', date: '2026-08-02' }
    ]
  },
  {
    id: 'victor-solano',
    name: 'Victor Solano Gallardo',
    role: 'Psicólogo',
    category: 'psicologia',
    degree: 'Licenciado en Psicología · Maestría en Psicología Clínica · Certificación en Terapia de Aceptación y Compromiso (ACT)',
    specialty: 'Terapia de Aceptación y Compromiso (ACT)',
    bio: 'Psicólogo especialista en Terapia de Aceptación y Compromiso (ACT). Su trabajo se centra en ayudar a las personas a convivir con sus pensamientos difíciles y a dirigir su vida hacia sus valores.',
    schedule: buildSchedule([['Martes', 'tardeA'], ['Jueves', 'mixB'], ['Sábado', 'mediaD']]),
    comments: [
      { user: 'Miguel A.', stars: 5, text: 'Mejoró mi relación con mis propias emociones. Muy recomendado.', date: '2026-09-03' }
    ]
  },

  // ========== NUTRICIÓN Y FISIOTERAPIA ==========
  {
    id: 'kelly-alvarez',
    name: 'Kelly Alvarez Ramón',
    role: 'Nutrióloga',
    category: 'nutricion',
    degree: 'Licenciada en Nutrición · Especialización en Nutrición Clínica · Diplomado en Nutrición Deportiva',
    specialty: 'Nutrición clínica, control de peso y alimentación saludable',
    bio: 'Nutrióloga con experiencia en nutrición clínica y educación alimentaria. Ayuda a sus pacientes a construir hábitos sostenibles que mejoren su salud y energía sin dietas restrictivas.',
    schedule: buildSchedule([['Lunes', 'mananaA'], ['Miércoles', 'tardeC'], ['Sábado', 'mananaB']]),
    comments: [
      { user: 'Carmen V.', stars: 5, text: 'Logré mis metas de peso de forma saludable y sin efectos rebote.', date: '2026-09-11' }
    ]
  },
  {
    id: 'carol-casas',
    name: 'Carol Casas Mayta',
    role: 'Fisioterapeuta',
    category: 'fisioterapia',
    degree: 'Licenciada en Tecnología Médica · Terapia Física y Rehabilitación · Diplomado en Rehabilitación Postural',
    specialty: 'Rehabilitación integral y cuidado postural',
    bio: 'Fisioterapeuta con experiencia en rehabilitación integral y cuidado postural. Atiende lesiones musculoesqueléticas, dolores de espalda y procesos de recuperación postquirúrgica.',
    schedule: buildSchedule([['Martes', 'mananaB'], ['Jueves', 'mixC'], ['Sábado', 'tardeA']]),
    comments: [
      { user: 'Pedro G.', stars: 5, text: 'Me recuperé de mi lesión de espalda mucho más rápido de lo esperado.', date: '2026-08-20' }
    ]
  }
];