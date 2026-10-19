// ============================================
// EXCELENTEMENTE - Perfil profesional + comentarios + reserva
// ============================================

(async function () {
  const params = new URLSearchParams(window.location.search);
  const profId = params.get('id');
  if (!profId) { window.location.href = 'profesionales.html'; return; }

  const CAT_STYLE = {
    psiquiatria: { label: 'Psiquiatría', avatar: 'bg-primary text-white', dot: 'bg-primary' },
    psicologia:  { label: 'Psicología',  avatar: 'bg-accent text-white',  dot: 'bg-accent' },
    nutricion:   { label: 'Nutrición',   avatar: 'bg-green-600 text-white', dot: 'bg-green-600' },
    fisioterapia:{ label: 'Fisioterapia',avatar: 'bg-pink-600 text-white',  dot: 'bg-pink-600' }
  };
  const DAY_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  let prof = null;
  let schedule = [];
  let taken = new Set();
  let sessionUser = null;
  let authorName = '';

  let modality = 'presencial';
  let selectedDay = null;
  let selectedTime = null;
  let selectedStars = 5;

  // ========== HELPERS ==========
  function initials(name) {
    return String(name || '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function hhmm(value) { return String(value || '').slice(0, 5); }

  function toISODate(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function formatDate(value) {
    const s = String(value || '');
    const d = s.length <= 10 ? new Date(s + 'T00:00:00') : new Date(s);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function renderStars(rating, size) {
    const px = size || 14;
    const filled = Math.round(rating);
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += i <= filled
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px + '" viewBox="0 0 24 24" fill="#e8a838" stroke="#e8a838"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px + '" viewBox="0 0 24 24" fill="none" stroke="#d1d5db"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    }
    return html;
  }

  function duracionLabel(inicio, fin) {
    const toMin = n => {
      const [h, m] = n.split(':').map(Number);
      return h * 60 + m;
    };
    const mins = toMin(fin) - toMin(inicio);
    if (mins % 60 === 0) return mins / 60 + ' h';
    return Math.floor(mins / 60) + ' h ' + (mins % 60 === 30 ? '30' : (mins % 60)) + ' min';
  }

  function nextDateForDay(dayName) {
    const map = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 };
    const target = map[dayName];
    if (target === undefined) return null;
    const now = new Date();
    let diff = (target - now.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    return toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff));
  }

  function setReserveButton(disabled, text) {
    const btn = document.getElementById('reserve-btn');
    if (!btn) return;
    btn.disabled = disabled;
    btn.textContent = text || 'Reservar cita';
    btn.classList.toggle('opacity-50', disabled);
    btn.classList.toggle('cursor-not-allowed', disabled);
  }

  // ========== PERFIL ==========
  function renderProfile() {
    const style = CAT_STYLE[prof.category] || CAT_STYLE.psicologia;

    document.getElementById('crumb-name').textContent = prof.name;
    const avatar = document.getElementById('prof-avatar');
    avatar.innerHTML = '';
    if (prof.photo_url) {
      const img = document.createElement('img');
      img.src = prof.photo_url;
      img.alt = prof.name;
      img.className = 'size-full object-cover';
      avatar.appendChild(img);
    } else {
      avatar.textContent = initials(prof.name);
      style.avatar.split(' ').forEach(c => avatar.classList.add(c));
    }
    document.getElementById('prof-name').textContent = prof.name;
    document.getElementById('prof-role').textContent = prof.role;
    document.getElementById('prof-badge').innerHTML = '<span class="size-1.5 rounded-full ' + style.dot + '"></span> ' + style.label;
    document.getElementById('prof-degree').textContent = prof.degree;
    document.getElementById('prof-specialty').textContent = prof.specialty;
    document.getElementById('prof-bio').textContent = prof.bio;
    document.getElementById('reserve-prof').textContent = 'con ' + String(prof.name).split(' ')[0];

    const keywords = String(prof.specialty).toLowerCase().match(/(terapia|psicoterapia|psiquiatría|psicología|tcc|act|dbt|nutrición|salud mental|evaluación|ansiedad|depresión|duelo|rehabilitación|pareja|familiar|infantil|adolescente|forense)/g);
    const tags = [...new Set((String(prof.specialty).split(', ')).concat(keywords || []).filter(Boolean))].slice(0, 6);
    document.getElementById('prof-tags').innerHTML = tags.map(t =>
      '<span class="rounded-full bg-primary/5 border border-primary/10 px-3 py-1.5 text-xs font-medium text-primary">' + escapeHtml(capitalize(t)) + '</span>'
    ).join('');
  }

  function renderRating(comments) {
    const el = document.getElementById('prof-rating');
    if (!comments.length) {
      el.innerHTML = '<span class="text-xs text-black/40">Sin calificaciones aún</span>';
      return;
    }
    const avg = comments.reduce((sum, c) => sum + Number(c.stars || 0), 0) / comments.length;
    el.innerHTML = renderStars(avg) + '<span class="ml-1 text-xs text-black/40 font-medium">' + avg.toFixed(1) + ' (' + comments.length + ')</span>';
  }

  async function loadServices() {
    const wrap = document.getElementById('prof-services-wrap');
    const list = document.getElementById('prof-services');
    if (!wrap || !list) return;

    const { data, error } = await sb
      .from('professional_services')
      .select('service_id, services(name)')
      .eq('professional_id', prof.id);

    if (error || !data || !data.length) return;

    list.innerHTML = data.map(function (row) {
      const name = row.services && row.services.name ? row.services.name : null;
      if (!name) return '';
      return '<span class="rounded-full bg-accent/10 border border-accent/20 px-3 py-1.5 text-xs font-medium text-amber-700">' + escapeHtml(name) + '</span>';
    }).join('');

    if (list.innerHTML.trim()) wrap.classList.remove('hidden');
  }

  // ========== COMENTARIOS ==========
  function renderComments(comments) {
    const list = document.getElementById('comments-list');
    document.getElementById('comments-count').textContent = comments.length + ' comentario' + (comments.length === 1 ? '' : 's');

    if (comments.length === 0) {
      list.innerHTML = '<p class="text-sm text-black/40 bg-neutral-50 rounded-2xl border border-black/5 p-6 text-center">Aún no hay comentarios. Sé el primero en dejar tu apreciación.</p>';
      return;
    }
    list.innerHTML = comments.map(c => `
      <div class="rounded-2xl border border-black/5 bg-neutral-50 p-4">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-semibold">${escapeHtml(c.author_name)}</span>
          <span class="text-[10px] text-black/30">${escapeHtml(formatDate(c.created_at))}</span>
        </div>
        <div class="flex gap-0.5 mb-2">${renderStars(Number(c.stars), 12)}</div>
        <p class="text-xs text-black/60 leading-relaxed">${escapeHtml(c.body)}</p>
      </div>
    `).join('');
  }

  async function loadComments() {
    const { data, error } = await sb
      .from('comments')
      .select('id,author_name,stars,body,created_at')
      .eq('professional_id', prof.id)
      .order('created_at', { ascending: false });

    if (error) {
      document.getElementById('comments-list').innerHTML = '<p class="text-sm text-black/40 bg-neutral-50 rounded-2xl border border-black/5 p-6 text-center">No se pudieron cargar los comentarios.</p>';
      return;
    }
    const comments = data || [];
    renderComments(comments);
    renderRating(comments);
  }

  function showCommentMsg(text, ok) {
    const el = document.getElementById('comment-msg');
    el.textContent = text;
    el.className = 'text-xs text-center p-2.5 rounded-xl ' + (ok
      ? 'bg-green-50 border border-green-200 text-green-600'
      : 'bg-red-50 border border-red-200 text-red-600');
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
  }

  function paintStars(n) {
    document.querySelectorAll('.comment-star').forEach(b => {
      b.classList.toggle('text-amber-400', +b.dataset.star <= n);
      b.classList.toggle('text-neutral-300', +b.dataset.star > n);
    });
  }

  // ========== HORARIOS ==========
  async function loadSchedule() {
    const { data, error } = await sb
      .from('schedule_blocks')
      .select('day,start_time,end_time')
      .eq('professional_id', prof.id);

    if (error) {
      document.getElementById('schedule-times').innerHTML = '<p class="col-span-full text-xs text-black/40 text-center">No se pudieron cargar los horarios.</p>';
      return;
    }

    const grouped = {};
    (data || []).forEach(row => {
      const inicio = hhmm(row.start_time);
      const fin = hhmm(row.end_time);
      if (!grouped[row.day]) grouped[row.day] = [];
      grouped[row.day].push({ inicio, fin });
    });

    schedule = Object.keys(grouped)
      .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
      .map(day => ({
        day,
        bloques: grouped[day].sort((a, b) => a.inicio.localeCompare(b.inicio))
      }));

    renderSchedule();
  }

  async function loadTakenSlots() {
    const today = toISODate(new Date());
    const { data, error } = await sb
      .from('appointments')
      .select('date,start_time')
      .eq('professional_id', prof.id)
      .neq('status', 'cancelada')
      .gte('date', today);

    taken = new Set();
    if (error) return;
    (data || []).forEach(a => taken.add(a.date + '|' + hhmm(a.start_time)));
  }

  function renderSchedule() {
    const dayWrap = document.getElementById('schedule-days');
    if (!schedule.length) {
      dayWrap.innerHTML = '';
      document.getElementById('schedule-times').innerHTML = '<p class="col-span-full text-xs text-black/40 text-center">Este profesional aún no tiene horarios publicados.</p>';
      setReserveButton(true);
      return;
    }

    dayWrap.innerHTML = schedule.map(d =>
      '<button type="button" onclick="selectDay(\'' + escapeHtml(d.day) + '\')" data-day="' + escapeHtml(d.day) + '" class="sched-day rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black/60 hover:border-primary hover:text-primary transition-all">' + escapeHtml(d.day) + '</button>'
    ).join('');

    selectDay(schedule[0].day);
  }

  window.selectDay = function (day) {
    selectedDay = day;
    selectedTime = null;
    document.querySelectorAll('.sched-day').forEach(b => {
      const active = b.dataset.day === day;
      b.classList.toggle('bg-primary', active);
      b.classList.toggle('text-white', active);
      b.classList.toggle('border-primary', active);
      b.classList.toggle('bg-transparent', !active);
      b.classList.toggle('text-black/60', !active);
    });

    const dayData = schedule.find(d => d.day === day);
    const wrap = document.getElementById('schedule-times');
    const date = nextDateForDay(day);

    if (dayData) {
      wrap.innerHTML = dayData.bloques.map(b => {
        const busy = date && taken.has(date + '|' + b.inicio);
        return '<button type="button" ' + (busy ? 'disabled' : 'onclick="selectTime(\'' + b.inicio + '\',\'' + b.fin + '\')"') + ' data-inicio="' + b.inicio + '" data-fin="' + b.fin + '" data-day="' + escapeHtml(day) + '" class="sched-time rounded-lg border border-black/10 px-2 py-2 text-xs font-medium ' + (busy ? 'text-black/25 bg-black/[0.02] cursor-not-allowed line-through' : 'text-black/60 hover:border-primary hover:text-primary') + ' transition-all">' + b.inicio + ' - ' + b.fin + '<span class="block text-[10px] ' + (busy ? 'text-black/25' : 'text-black/30') + ' mt-0.5" data-dur>' + (busy ? 'Ocupado' : duracionLabel(b.inicio, b.fin)) + '</span></button>';
      }).join('');
    } else {
      wrap.innerHTML = '<p class="col-span-3 text-xs text-black/40 text-center">Sin horarios este día.</p>';
    }
  };

  window.selectTime = function (inicio, fin) {
    selectedTime = { inicio, fin };
    document.querySelectorAll('.sched-time').forEach(b => {
      const active = b.dataset.inicio === inicio && b.dataset.fin === fin && b.dataset.day === selectedDay;
      b.classList.toggle('bg-primary', active);
      b.classList.toggle('text-white', active);
      b.classList.toggle('border-primary', active);
      b.classList.toggle('bg-transparent', !active);
      b.classList.toggle('text-black/60', !active);
      if (active) b.querySelector('[data-dur]')?.classList.add('text-white/70');
      else b.querySelector('[data-dur]')?.classList.remove('text-white/70');
    });
    setReserveButton(false);
  };

  window.selectModality = function (value) {
    modality = value;
    document.querySelectorAll('.mod-btn').forEach(b => {
      const active = b.id === 'mod-' + value;
      b.classList.toggle('border-primary', active);
      b.classList.toggle('bg-primary/5', active);
      b.classList.toggle('text-primary', active);
      b.classList.toggle('border-black/10', !active);
      b.classList.toggle('text-black/50', !active);
    });
  };

  // ========== SESIÓN ==========
  async function loadIdentity() {
    if (!window.sb) return;

    const { data } = await sb.auth.getSession();
    sessionUser = data && data.session ? data.session.user : null;
    const nameInput = document.getElementById('comment-name');
    if (!sessionUser) {
      if (nameInput) {
        nameInput.placeholder = 'Inicia sesión para comentar';
        nameInput.readOnly = true;
        nameInput.classList.add('bg-neutral-100');
      }
      return;
    }

    const meta = sessionUser.user_metadata || {};
    authorName = [meta.name, meta.lastname].filter(Boolean).join(' ') || sessionUser.email || 'Paciente';

    const { data: profile } = await sb
      .from('profiles')
      .select('name,lastname')
      .eq('id', sessionUser.id)
      .maybeSingle();
    if (profile) {
      authorName = [profile.name, profile.lastname].filter(Boolean).join(' ') || authorName;
    }

    if (nameInput) {
      nameInput.value = authorName;
      nameInput.readOnly = true;
      nameInput.classList.add('bg-neutral-100');
    }
  }

  // ========== EVENTOS ==========
  document.querySelectorAll('.comment-star').forEach(b => {
    b.addEventListener('click', () => { selectedStars = +b.dataset.star; paintStars(selectedStars); });
  });
  paintStars(selectedStars);

  document.getElementById('comment-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const text = document.getElementById('comment-text').value.trim();
    if (!text) { showCommentMsg('Escribe tu comentario.', false); return; }

    if (!sessionUser) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }

    const { error } = await sb.from('comments').insert({
      professional_id: prof.id,
      user_id: sessionUser.id,
      author_name: authorName,
      stars: selectedStars,
      body: text
    });

    if (error) {
      showCommentMsg('No se pudo publicar el comentario. Intenta de nuevo.', false);
      return;
    }

    document.getElementById('comment-text').value = '';
    selectedStars = 5;
    paintStars(selectedStars);
    await loadComments();
    showCommentMsg('¡Gracias por tu comentario!', true);
  });

  window.reserveAppointment = async function () {
    if (!selectedDay || !selectedTime) {
      showReserveMsg('Selecciona un día y horario disponible.', false);
      return;
    }

    if (!sessionUser) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }

    const date = nextDateForDay(selectedDay);
    if (!date) { showReserveMsg('No se pudo calcular la fecha de la cita.', false); return; }

    setReserveButton(true, 'Reservando...');

    const { error } = await sb.from('appointments').insert({
      user_id: sessionUser.id,
      professional_id: prof.id,
      service_label: prof.specialty,
      modality: modality,
      date: date,
      start_time: selectedTime.inicio,
      end_time: selectedTime.fin,
      status: 'proxima'
    });

    if (error) {
      if (error.code === '23505') {
        taken.add(date + '|' + selectedTime.inicio);
        showReserveMsg('Ese horario acaba de ser reservado. Elige otro, por favor.', false);
        selectDay(selectedDay);
      } else {
        showReserveMsg('No se pudo reservar la cita. Intenta de nuevo.', false);
        setReserveButton(false);
      }
      return;
    }

    taken.add(date + '|' + selectedTime.inicio);
    showReserveMsg('Cita reservada para el ' + formatDate(date) + ' de ' + selectedTime.inicio + ' a ' + selectedTime.fin + ' (' + (modality === 'virtual' ? 'Virtual' : 'Presencial') + ').', true);
    selectedTime = null;
    selectDay(selectedDay);
    setReserveButton(false);
  };

  function showReserveMsg(text, ok) {
    const el = document.getElementById('reserve-msg');
    el.textContent = text;
    el.className = 'mt-4 text-xs text-center p-3 rounded-xl ' + (ok
      ? 'bg-green-50 border border-green-200 text-green-600'
      : 'bg-red-50 border border-red-200 text-red-600');
    el.classList.remove('hidden');
  }

  // ========== INIT ==========
  if (!window.sb) {
    document.getElementById('prof-name').textContent = 'No se pudo cargar el perfil';
    return;
  }

  const { data: professional, error } = await sb
    .from('professionals')
    .select('id,name,role,category,degree,specialty,bio,photo_url')
    .eq('id', profId)
    .eq('active', true)
    .maybeSingle();

  if (error || !professional) {
    window.location.href = 'profesionales.html';
    return;
  }

  prof = professional;
  renderProfile();

  await Promise.all([loadIdentity(), loadComments(), loadTakenSlots(), loadServices()]);
  await loadSchedule();

  // Scroll al panel de reserva si vino desde "Reservar una cita"
  if (params.get('reservar') === '1') {
    const aside = document.querySelector('aside');
    if (aside) setTimeout(() => aside.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  }
})();
