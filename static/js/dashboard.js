// ========== DATOS ==========
const SERVICES = [
  { id:1, cat:'psiquiatria', name:'Psicoterapia individual', icon:'🧠', rating:4.8, reviews:127,
    desc:'La finalidad de la terapia individual es ayudarte a entender tu forma de comportarte, tus emociones y cómo tu forma de plantearte las cosas te lleva a sentirte como te sientes y actuar como actúas. Esto te permite liberarte de las emociones negativas y mejorar tu capacidad para tomar decisiones.',
    detail:'Incluye evaluación inicial, plan de tratamiento personalizado, sesiones semanales de 50 minutos, seguimiento y reevaluaciones periódicas. Utilizamos enfoques basados en evidencia científica.',
    professionals:['Dra. María García','Dr. Carlos Mendoza'] },
  { id:2, cat:'psiquiatria', name:'Psicoterapia familiar', icon:'👨‍👩‍👧‍👦', rating:4.7, reviews:89,
    desc:'La terapia familiar ayuda a identificar formas de relacionarse en la familia que no son sanas para el desarrollo personal. Los conflictos derivados de la falta de comunicación eficaz o de las pautas de relación provocan que más de un miembro de la familia se encuentre mal.',
    detail:'Sesiones de 90 minutos donde participan los miembros clave de la familia. Trabajamos roles, patrones de comunicación, límites y creación de un ambiente familiar saludable.',
    professionals:['Dra. María García','Dra. Ana López'] },
  { id:3, cat:'psiquiatria', name:'Terapia de pareja', icon:'💑', rating:4.9, reviews:103,
    desc:'En nuestro servicio de Terapia de Pareja, te brindamos un proceso que tiene como objetivo mejorar tu calidad de vida, el de tu pareja, y por lo tanto, el de tu relación, bajo el acompañamiento de un profesional.',
    detail:'Abordamos comunicación, resolución de conflictos, infidelidad, crisis de pareja, recuperación de la confianza y fortalecimiento del vínculo. Sesiones de 60 minutos.',
    professionals:['Dr. Carlos Mendoza','Dra. Ana López'] },
  { id:4, cat:'psiquiatria', name:'Orientación psicológica', icon:'💡', rating:4.6, reviews:74,
    desc:'La orientación psicológica nace como respuesta a exigencias de desarrollo social; se contextualiza en el área escolar, laboral, familiar y personal para promover el crecimiento.',
    detail:'Sesiones breves (3-5 encuentros) orientadas a resolver situaciones puntuales, toma de decisiones, orientación vocacional o adaptación a cambios importantes de vida.',
    professionals:['Dra. María García','Dr. Luis Torres'] },
  { id:5, cat:'psicologia', name:'Consejería psicológica', icon:'💬', rating:4.7, reviews:95,
    desc:'La consejería incluye intervenciones tanto individuales como grupales, ayudando en la búsqueda de alternativas o soluciones a las personas que consultan, con un servicio más a corto plazo que la psicoterapia.',
    detail:'Ideal para momentos de crisis, transiciones de vida, toma de decisiones o cuando necesitas un espacio seguro para reflexionar. 4-8 sesiones.',
    professionals:['Dra. Laura Ramos','Dr. Luis Torres'] },
  { id:6, cat:'psicologia', name:'Evaluación psicológica', icon:'📋', rating:4.8, reviews:112,
    desc:'Realizamos evaluaciones psicológicas completas para determinar el estado emocional, cognitivo y conductual del paciente. Incluye pruebas psicométricas, entrevistas clínicas y observación directa.',
    detail:'Proceso de 2-3 sesiones que incluye batería de tests psicológicos, entrevista clínica detallada, elaboración de informe con diagnóstico, hallazgos y recomendaciones.',
    professionals:['Dra. Laura Ramos','Dra. María García'] },
  { id:7, cat:'psicologia', name:'Terapia cognitivo conductual', icon:'🔄', rating:4.9, reviews:156,
    desc:'La TCC es una de las terapias más efectivas para tratar la depresión, ansiedad, fobias y otros trastornos. Se enfoca en identificar y modificar patrones de pensamiento negativos.',
    detail:'Tratamiento estructurado de 12-20 sesiones con tareas entre sesiones. Eficaz para depresión, ansiedad generalizada, TOC, fobias, estrés postraumático y trastornos de conducta alimentaria.',
    professionals:['Dr. Carlos Mendoza','Dra. Laura Ramos'] },
  { id:8, cat:'psicologia', name:'Terapia infantil y juvenil', icon:'🧒', rating:4.8, reviews:88,
    desc:'Atención especializada para niños y adolescentes que presentan dificultades emocionales, conductuales o de adaptación. Utilizamos técnicas lúdicas y adaptadas a su edad.',
    detail:'Incluye evaluación del desarrollo, intervención conductual, terapia de juego, habilidades sociales, manejo del TEA, TDAH, bullying y problemas de conducta.',
    professionals:['Dra. Ana López','Dra. Laura Ramos'] },
  { id:9, cat:'terapias', name:'Clínica de día', icon:'🏥', rating:4.7, reviews:64,
    desc:'Programa terapéutico intensivo para pacientes que requieren un acompañamiento más frecuente. Incluye actividades grupales, talleres de habilidades y seguimiento personalizado.',
    detail:'Programa de lunes a viernes, 4 horas diarias. Incluye terapia individual, grupal, talleres de arte, musicoterapia, psicoeducación y habilidades para la vida.',
    professionals:['Dr. Carlos Mendoza','Dra. María García'] },
  { id:10, cat:'terapias', name:'Grupo Kurame', icon:'🤝', rating:4.6, reviews:42,
    desc:'Espacio terapéutico grupal diseñado para fortalecer el sentido de comunidad y apoyo mutuo. Los participantes comparten experiencias y aprenden estrategias de afrontamiento.',
    detail:'Grupo de 8-12 participantes que se reúne semanalmente. Temas: autoestima, manejo de emociones, relaciones interpersonales y construcción de red de apoyo.',
    professionals:['Dra. Ana López','Dr. Luis Torres'] },
  { id:11, cat:'terapias', name:'Grupo de habilidades', icon:'🎯', rating:4.5, reviews:38,
    desc:'Talleres enfocados en el desarrollo de habilidades sociales, emocionales y de comunicación. Ideal para personas que buscan mejorar sus relaciones interpersonales.',
    detail:'Ciclos de 8 semanas. Contenido: asertividad, escucha activa, manejo de conflictos, inteligencia emocional, regulación del estrés y comunicación no violenta.',
    professionals:['Dra. Laura Ramos','Dra. Ana López'] },
  { id:12, cat:'terapias', name:'Terapia grupal para ansiedad', icon:'🌊', rating:4.7, reviews:56,
    desc:'El objetivo es que las personas potencien entre sí el cambio de conductas y hábitos deseados para resolver determinado conflicto o trauma. Se recomienda para romper el aislamiento.',
    detail:'Grupo cerrado de 10 sesiones. Técnicas: relajación, respiración, exposición gradual, reestructuración cognitiva y apoyo mutuo. Para personas con ansiedad generalizada, social o ataques de pánico.',
    professionals:['Dr. Carlos Mendoza','Dra. Laura Ramos'] },
  { id:13, cat:'nutricion', name:'Evaluación nutricional', icon:'🍎', rating:4.8, reviews:93,
    desc:'Análisis completo de tu estado nutricional, incluyendo composición corporal, hábitos alimentarios y necesidades específicas. Identificamos deficiencias y establecemos un plan.',
    detail:'Incluye antropometría, análisis de composición corporal (bioimpedancia), historial alimentario de 3 días, cuestionario de hábitos y estilo de vida. Informe detallado con recomendaciones.',
    professionals:['Lic. Sofía Vargas'] },
  { id:14, cat:'nutricion', name:'Plan alimentario personalizado', icon:'🥗', rating:4.7, reviews:81,
    desc:'Diseñamos un plan de alimentación adaptado a tus objetivos, estilo de vida y condiciones de salud. Ya sea que busques perder peso, ganar masa muscular o mejorar tu rendimiento.',
    detail:'Plan semanal con recetas, lista de compras, guía de porciones, ajustes cada 2 semanas. Incluye seguimiento mensual y modificaciones según avance.',
    professionals:['Lic. Sofía Vargas'] },
  { id:15, cat:'nutricion', name:'Nutrición clínica', icon:'⚕️', rating:4.9, reviews:107,
    desc:'Tratamiento nutricional para patologías como diabetes, hipertensión, colesterol alto, problemas digestivos y más. Trabajamos de la mano con tu médico.',
    detail:'Dietas terapéuticas personalizadas, educación alimentaria, control de indicadores clínicos, coordinación con el equipo médico tratante. Seguimiento quincenal.',
    professionals:['Lic. Sofía Vargas'] },
  { id:16, cat:'nutricion', name:'Nutrición deportiva', icon:'💪', rating:4.6, reviews:59,
    desc:'Optimiza tu rendimiento físico con una alimentación estratégica. Te ayudamos a alcanzar tus metas deportivas con planes de hidratación, suplementación y nutrición.',
    detail:'Planes para ganancia muscular, definición, resistencia. Incluye timing nutricional, suplementación basada en evidencia, hidratación y recuperación.',
    professionals:['Lic. Sofía Vargas'] },
  { id:17, cat:'fisioterapia', name:'Rehabilitación física', icon:'🦾', rating:4.8, reviews:76,
    desc:'Programas de recuperación funcional para lesiones musculoesqueléticas, postquirúrgicas y crónicas. Utilizamos técnicas avanzadas para restaurar la movilidad.',
    detail:'Evaluación musculoesquelética completa, plan de ejercicios progresivos, terapia manual, electroterapia, ondas de choque y reentrenamiento funcional.',
    professionals:['Lic. Pedro Sánchez'] },
  { id:18, cat:'fisioterapia', name:'Terapia postural', icon:'🧍', rating:4.7, reviews:63,
    desc:'Corrección de hábitos posturales que generan dolor y limitaciones. Evaluamos tu postura en diferentes actividades y te enseñamos ejercicios específicos.',
    detail:'Análisis postural estático y dinámico, corrección de desviaciones, programa de ejercicios domiciliarios, ergonomicidad laboral y seguimiento.',
    professionals:['Lic. Pedro Sánchez'] },
  { id:19, cat:'fisioterapia', name:'Dolor crónico', icon:'🩹', rating:4.8, reviews:84,
    desc:'Tratamiento especializado para pacientes con dolor crónico de espalda, cuello, articulaciones y otras áreas. Combinamos terapia manual, ejercicios y educación.',
    detail:'Abordaje multimodal: terapia manual, punción seca, exercise therapy, psicoeducación en dolor, técnicas de relajación y modulación del dolor.',
    professionals:['Lic. Pedro Sánchez'] },
  { id:20, cat:'fisioterapia', name:'Piso pélvico', icon:'🩺', rating:4.9, reviews:71,
    desc:'Rehabilitación del suelo pélvico para incontinencia urinaria, prolapsos, dolor pélvico y recuperación postparto. Tratamiento confidencial y especializado.',
    detail:'Evaluación y tratamiento de suelo pélvico con biofeedback, electroestimulación, ejercicios de Kegel progresivos, educación y reentrenamiento funcional.',
    professionals:['Lic. Pedro Sánchez'] },
  { id:21, cat:'cursos', name:'Talleres de inteligencia emocional', icon:'🎭', rating:4.7, reviews:92,
    desc:'Aprende a identificar, comprender y gestionar tus emociones de manera efectiva. Desarrolla habilidades para la empatía, la autorregulación y la toma de decisiones.',
    detail:'Curso de 6 semanas (2 horas/semana). Módulos: autoconocimiento, regulación emocional, empatía, habilidades sociales, motivación y manejo del estrés.',
    professionals:['Dra. Laura Ramos','Dra. Ana López'] },
  { id:22, cat:'cursos', name:'Cursos de manejo del estrés', icon:'🧘', rating:4.8, reviews:105,
    desc:'Herramientas prácticas para reducir el estrés y la ansiedad en el día a día. Incluye técnicas de relajación, mindfulness, respiración y planificación efectiva.',
    detail:'Programa de 4 semanas. Incluye mindfulness, respiración diafragmática, meditación guiada, planificación del tiempo, establecimiento de límites y autocuidado.',
    professionals:['Dr. Carlos Mendoza','Dra. Laura Ramos'] },
  { id:23, cat:'cursos', name:'Talleres para padres', icon:'👪', rating:4.6, reviews:78,
    desc:'Espacio de aprendizaje para padres que buscan mejorar su relación con sus hijos. Crianza positiva, comunicación efectiva, límites saludables y manejo de conductas.',
    detail:'Taller de 4 sesiones. Temas: vínculo seguro, comunicación no violenta, límites y consecuencias, manejo de berrinches, autoestima infantil y prevención del bullying.',
    professionals:['Dra. Ana López','Dra. María García'] },
  { id:24, cat:'cursos', name:'Capacitación empresarial', icon:'🏢', rating:4.7, reviews:46,
    desc:'Programas de salud mental ocupacional para empresas. Talleres de bienestar, prevención del burnout, comunicación asertiva y liderazgo emocional.',
    detail:'Programas personalizados de 1-4 días. Temas: prevención de burnout, manejo del estrés laboral, comunicación asertiva, liderazgo emocional, team building.',
    professionals:['Dr. Carlos Mendoza','Dra. María García'] }
];

const PROFESSIONALS = [
  { id:1, name:'Dra. María García', role:'Psiquiatra', specialty:'Psiquiatría general, trastornos de ansiedad y depresión', rating:4.9, reviews:89, exp:'15 años', img:'img/placeholder-user.jpg',
    bio:'Egresada de la Universidad Nacional Mayor de San Marcos. Especialista en psiquiatría con enfoque en trastornos de ansiedad, depresión y salud mental de la mujer. Certificada en Psiquiatría de Emergencia.', services:[1,2,4,6] },
  { id:2, name:'Dr. Carlos Mendoza', role:'Psicólogo Clínico', specialty:'Terapia cognitivo conductual, ansiedad, depresión', rating:4.8, reviews:112, exp:'12 años', img:'img/placeholder-user.jpg',
    bio:'Maestría en Psicología Clínica por la PUCP. Certificado en Terapia Cognitivo Conductual por la Association for Behavioral and Cognitive Therapies. Especialista en trastornos de ansiedad y depresión mayor.', services:[1,3,7,9] },
  { id:3, name:'Dra. Ana López', role:'Psicóloga', specialty:'Psicología infantil, terapia familiar, adolescencia', rating:4.7, reviews:76, exp:'10 años', img:'img/placeholder-user.jpg',
    bio:'Doctora en Psicología por la UNMSM. Especialista en psicología infantojuvenil, terapia familiar sistémica y crisis adolescente. Formada en Terapia de Juego y Arteterapia.', services:[2,5,8,10] },
  { id:4, name:'Dra. Laura Ramos', role:'Psicóloga', specialty:'TCC, trastornos de conducta alimentaria, autoestima', rating:4.9, reviews:98, exp:'8 años', img:'img/placeholder-user.jpg',
    bio:'Magíster en Psicología Clínica con especialización en TCC. Formada en el Instituto Beck (Boston). Experiencia en trastornos de conducta alimentaria, autoestima y desarrollo personal.', services:[5,6,7,8] },
  { id:5, name:'Dr. Luis Torres', role:'Psicólogo', specialty:'Orientación vocacional, desarrollo personal, varones', rating:4.6, reviews:54, exp:'7 años', img:'img/placeholder-user.jpg',
    bio:'Licenciado en Psicología por la UNCP. Especialización en orientación vocacional y desarrollo personal. Formado en psicología positiva y coaching ontológico.', services:[4,5,10] },
  { id:6, name:'Lic. Sofía Vargas', role:'Nutricionista', specialty:'Nutrición clínica, deportiva, control de peso', rating:4.8, reviews:87, exp:'9 años', img:'img/placeholder-user.jpg',
    bio:'Licenciada en Nutrición por la UNMSM. Especialización en Nutrición Clínica y Deportiva. Certificada en Intervención en Trastornos de Conducta Alimentaria.', services:[13,14,15,16] },
  { id:7, name:'Lic. Pedro Sánchez', role:'Fisioterapeuta', specialty:'Rehabilitación, dolor crónico, piso pélvico', rating:4.7, reviews:65, exp:'11 años', img:'img/placeholder-user.jpg',
    bio:'Licenciado en Fisioterapia por la UCV. Especializado en rehabilitación musculoesquelética, terapia manual y suelo pélvico. Certificado en Punción Seca y Ondas de Choque.', services:[17,18,19,20] }
];

const COMMENTS_DB = [
  { serviceId:1, user:'María P.', stars:5, text:'Excelente la terapia individual, me ayudó mucho con mi ansiedad.', date:'2026-08-15' },
  { serviceId:1, user:'Juan C.', stars:5, text:'Muy profesional y empático. Recomendado.', date:'2026-07-20' },
  { serviceId:7, user:'Ana R.', stars:5, text:'La TCC cambió mi vida. Aprendí a manejar mis pensamientos negativos.', date:'2026-09-01' },
  { serviceId:7, user:'Luis M.', stars:4, text:'Muy buen tratamiento, un poco largo pero vale la pena.', date:'2026-06-10' },
  { serviceId:3, user:'Rosa L.', stars:5, text:'Recuperamos nuestra relación gracias a la terapia de pareja.', date:'2026-08-28' },
  { serviceId:8, user:'Pedro G.', stars:5, text:'Mi hijo mejoró muchísimo con la terapia infantil.', date:'2026-07-05' },
  { serviceId:15, user:'Carmen V.', stars:5, text:'La nutricionista es excelente, perdí 15kg de forma saludable.', date:'2026-09-10' },
  { serviceId:22, user:'Miguel A.', stars:5, text:'El curso de manejo del estrés es muy práctico y útil.', date:'2026-08-20' }
];

// ========== ESTADO ==========
let currentUser = null;
let currentSection = 'historial';

// ========== INIT ==========
(function init() {
  currentUser = JSON.parse(localStorage.getItem('excelentemente_user'));
  if (!currentUser) { window.location.href = 'login.html'; return; }

  // Header
  document.getElementById('user-avatar').textContent = currentUser.name.charAt(0) + currentUser.lastname.charAt(0);
  document.getElementById('user-name-header').textContent = currentUser.name + ' ' + currentUser.lastname;

  // Perfil
  document.getElementById('prof-name').value = currentUser.name;
  document.getElementById('prof-lastname').value = currentUser.lastname;
  document.getElementById('prof-email').value = currentUser.email;
  document.getElementById('prof-phone').value = currentUser.phone || '';

  renderHistorial();
  renderServices();
  renderProfessionals();

  // Profile form
  document.getElementById('profile-form').addEventListener('submit', saveProfile);
})();

// ========== NAVEGACIÓN ==========
function showSection(name) {
  currentSection = name;
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.getElementById('sec-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector('[data-nav="' + name + '"]').classList.add('active');
  // Cerrar sidebar en móvil
  document.getElementById('dash-sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.add('hidden');
}

function toggleSidebar() {
  document.getElementById('dash-sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('hidden');
}

function logout() {
  localStorage.removeItem('excelentemente_user');
  window.location.href = 'index.html';
}

// ========== HISTORIAL ==========
function renderHistorial() {
  const appointments = JSON.parse(localStorage.getItem('excelentemente_appointments') || '[]');
  const now = new Date();

  // Si no hay citas, crear datos demo
  if (appointments.length === 0) {
    const demo = [
      { id:1, service:'Terapia cognitivo conductual', professional:'Dr. Carlos Mendoza', date:'2026-09-25', time:'10:00', status:'proxima' },
      { id:2, service:'Evaluación nutricional', professional:'Lic. Sofía Vargas', date:'2026-09-28', time:'15:30', status:'proxima' },
      { id:3, service:'Consejería psicológica', professional:'Dra. Laura Ramos', date:'2026-08-10', time:'11:00', status:'pasada' },
      { id:4, service:'Psicoterapia individual', professional:'Dra. María García', date:'2026-07-22', time:'09:30', status:'pasada' },
      { id:5, service:'Grupo de habilidades', professional:'Dra. Ana López', date:'2026-07-01', time:'16:00', status:'pasada' }
    ];
    localStorage.setItem('excelentemente_appointments', JSON.stringify(demo));
    renderHistorial();
    return;
  }

  const proximas = appointments.filter(a => a.status === 'proxima');
  const pasadas = appointments.filter(a => a.status === 'pasada');

  const proxEl = document.getElementById('proximas-citas');
  const pasEl = document.getElementById('pasadas-citas');

  if (proximas.length === 0) {
    proxEl.innerHTML = '';
    document.getElementById('no-proximas').classList.remove('hidden');
  } else {
    document.getElementById('no-proximas').classList.add('hidden');
    proxEl.innerHTML = proximas.map(a => `
      <div class="flex items-center gap-4 bg-white rounded-2xl border border-primary/10 p-4 card-hover">
        <div class="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg shrink-0">📅</div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm">${a.service}</p>
          <p class="text-xs text-black/50">${a.professional}</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-sm font-medium">${formatDate(a.date)}</p>
          <p class="text-xs text-black/40">${a.time}</p>
        </div>
        <span class="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase">Próxima</span>
      </div>
    `).join('');
  }

  if (pasadas.length === 0) {
    pasEl.innerHTML = '';
    document.getElementById('no-pasadas').classList.remove('hidden');
  } else {
    document.getElementById('no-pasadas').classList.add('hidden');
    pasEl.innerHTML = pasadas.map(a => `
      <div class="flex items-center gap-4 bg-white rounded-2xl border border-black/5 p-4 opacity-70">
        <div class="size-12 rounded-xl bg-black/5 text-black/30 flex items-center justify-center text-lg shrink-0">✓</div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm">${a.service}</p>
          <p class="text-xs text-black/50">${a.professional}</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-sm">${formatDate(a.date)}</p>
          <p class="text-xs text-black/40">${a.time}</p>
        </div>
        <span class="px-3 py-1 rounded-full bg-black/5 text-black/40 text-[10px] font-semibold uppercase">Pasada</span>
      </div>
    `).join('');
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-PE', { day:'numeric', month:'short', year:'numeric' });
}

// ========== SERVICIOS ==========
function renderServices(filter) {
  const grid = document.getElementById('services-grid');
  const filtered = filter && filter !== 'all' ? SERVICES.filter(s => s.cat === filter) : SERVICES;

  grid.innerHTML = filtered.map(s => {
    const comments = COMMENTS_DB.filter(c => c.serviceId === s.id);
    const starsHtml = renderStars(s.rating);
    const commentHtml = comments.map(c => `
      <div class="border-t border-black/5 pt-3">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-semibold">${c.user}</span>
          <span class="text-[10px] text-black/30">${formatDate(c.date)}</span>
        </div>
        <div class="flex gap-0.5 mb-1">${renderStarsSmall(c.stars)}</div>
        <p class="text-xs text-black/60">${c.text}</p>
      </div>
    `).join('');

    return `
      <div class="bg-white rounded-2xl border border-black/5 overflow-hidden card-hover" data-cat="${s.cat}">
        <div class="p-6">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${s.icon}</span>
              <div>
                <h3 class="font-semibold">${s.name}</h3>
                <span class="text-[10px] uppercase tracking-wider text-black/30 font-medium">${getCatLabel(s.cat)}</span>
              </div>
            </div>
            <div class="text-right">
              <div class="flex items-center gap-1">${starsHtml}</div>
              <p class="text-[10px] text-black/40">${s.rating} · ${s.reviews} reseñas</p>
            </div>
          </div>
          <p class="text-sm text-black/60 leading-relaxed mb-3">${s.desc}</p>
          <p class="text-xs text-black/40 leading-relaxed mb-4">${s.detail}</p>
          <div class="flex items-center gap-2 mb-4">
            <span class="text-[10px] text-black/30">Especialistas:</span>
            <span class="text-xs text-primary font-medium">${s.professionals.join(' · ')}</span>
          </div>

          <!-- Comentarios -->
          <details class="group mb-4">
            <summary class="text-xs font-medium text-black/50 cursor-pointer hover:text-primary transition-colors flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="group-open:rotate-90 transition-transform"><polyline points="9 18 15 12 9 6"/></svg>
              Ver comentarios (${comments.length})
            </summary>
            <div class="mt-3 flex flex-col gap-3 pl-3">
              ${commentHtml || '<p class="text-xs text-black/30">Aún no hay comentarios.</p>'}
            </div>
          </details>

          <!-- Agendar -->
          <a href="https://wa.link/pm5ri7" target="_blank" class="block w-full text-center rounded-xl bg-gradient-to-r from-primary to-primary-light px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
            Agendar este servicio →
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function filterServices(cat) {
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('active', 'bg-primary', 'text-white', 'border-primary');
    b.classList.add('border-black/10', 'text-black/60');
  });
  const activeBtn = document.querySelector('[data-filter="' + cat + '"]');
  activeBtn.classList.add('active', 'bg-primary', 'text-white', 'border-primary');
  activeBtn.classList.remove('border-black/10', 'text-black/60');
  renderServices(cat);
}

function getCatLabel(cat) {
  const labels = { psiquiatria:'Psiquiatría', psicologia:'Psicología', terapias:'Terapias Grupales', nutricion:'Nutrición', fisioterapia:'Fisioterapia', cursos:'Cursos y Talleres' };
  return labels[cat] || cat;
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '';
  for (let i = 0; i < 5; i++) {
    if (i < full) html += '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#e8a838" stroke="#e8a838" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    else if (i === full && half) html += '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#e8a838" stroke="#e8a838" stroke-width="1"><defs><linearGradient id="h"><stop offset="50%" stop-color="#e8a838"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#h)"/></svg>';
    else html += '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  }
  return html;
}

function renderStarsSmall(n) {
  let html = '';
  for (let i = 0; i < 5; i++) {
    html += i < n
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#e8a838" stroke="#e8a838" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  }
  return html;
}

// ========== PROFESIONALES ==========
function renderProfessionals() {
  const grid = document.getElementById('profs-grid');
  grid.innerHTML = PROFESSIONALS.map(p => {
    const profServices = SERVICES.filter(s => p.services.includes(s.id));
    return `
      <div class="bg-white rounded-2xl border border-black/5 overflow-hidden card-hover">
        <div class="p-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0">
              ${p.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
            </div>
            <div>
              <h3 class="font-semibold">${p.name}</h3>
              <p class="text-xs text-primary font-medium">${p.role}</p>
              <div class="flex items-center gap-1 mt-0.5">
                ${renderStarsSmall(Math.round(p.rating))}
                <span class="text-[10px] text-black/40">${p.rating} (${p.reviews})</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-black/50 leading-relaxed mb-2">${p.specialty}</p>
          <p class="text-xs text-black/40 leading-relaxed mb-3">${p.bio}</p>
          <p class="text-[10px] text-black/30 mb-3">· ${p.exp} de experiencia</p>

          <details class="group mb-4">
            <summary class="text-xs font-medium text-black/50 cursor-pointer hover:text-primary transition-colors flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="group-open:rotate-90 transition-transform"><polyline points="9 18 15 12 9 6"/></svg>
              Servicios que ofrece (${profServices.length})
            </summary>
            <div class="mt-2 flex flex-col gap-1.5 pl-3">
              ${profServices.map(s => `<p class="text-xs text-black/50">${s.icon} ${s.name}</p>`).join('')}
            </div>
          </details>

          <a href="https://wa.link/pm5ri7" target="_blank" class="block w-full text-center rounded-xl bg-gradient-to-r from-primary to-primary-light px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
            Agendar con ${p.name.split(' ')[0]} →
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// ========== PERFIL ==========
function saveProfile(e) {
  e.preventDefault();
  const msgEl = document.getElementById('profile-msg');
  const name = document.getElementById('prof-name').value.trim();
  const lastname = document.getElementById('prof-lastname').value.trim();
  const email = document.getElementById('prof-email').value.trim();
  const phone = document.getElementById('prof-phone').value.trim();
  const newpass = document.getElementById('prof-newpass').value;

  if (!name || !lastname || !email) {
    msgEl.textContent = 'Nombre, apellido y correo son obligatorios.';
    msgEl.className = 'text-sm text-center p-3 rounded-xl bg-red-50 border border-red-200 text-red-600';
    msgEl.classList.remove('hidden');
    return;
  }

  // Actualizar en users
  const users = JSON.parse(localStorage.getItem('excelentemente_users') || '[]');
  const idx = users.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) {
    users[idx].name = name;
    users[idx].lastname = lastname;
    users[idx].email = email;
    users[idx].phone = phone;
    if (newpass) users[idx].password = newpass;
    localStorage.setItem('excelentemente_users', JSON.stringify(users));
  }

  // Actualizar sesión
  currentUser.name = name;
  currentUser.lastname = lastname;
  currentUser.email = email;
  currentUser.phone = phone;
  if (newpass) currentUser.password = newpass;
  localStorage.setItem('excelentemente_user', JSON.stringify(currentUser));

  // Actualizar header
  document.getElementById('user-avatar').textContent = name.charAt(0) + lastname.charAt(0);
  document.getElementById('user-name-header').textContent = name + ' ' + lastname;

  msgEl.textContent = '¡Perfil actualizado correctamente!';
  msgEl.className = 'text-sm text-center p-3 rounded-xl bg-green-50 border border-green-200 text-green-600';
  msgEl.classList.remove('hidden');
  document.getElementById('prof-newpass').value = '';

  setTimeout(() => msgEl.classList.add('hidden'), 3000);
}
