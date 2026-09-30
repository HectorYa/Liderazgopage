// ============================================
// EXCELENTEMENTE - Perfil profesional + reserva
// ============================================

(function () {
  const params = new URLSearchParams(window.location.search);
  const profId = params.get('id');
  const prof = PROFESIONALES_PUBLICOS.find(p => p.id === profId);

  if (!prof) { window.location.href = 'profesionales.html'; return; }

  // ========== ESTILOS POR CATEGORÍA ==========
  const CAT_STYLE = {
    psiquiatria: { label: 'Psiquiatría', avatar: 'bg-primary text-white', dot: 'bg-primary' },
    psicologia:  { label: 'Psicología',  avatar: 'bg-accent text-white',  dot: 'bg-accent' },
    nutricion:   { label: 'Nutrición',   avatar: 'bg-green-600 text-white', dot: 'bg-green-600' },
    fisioterapia:{ label: 'Fisioterapia',avatar: 'bg-pink-600 text-white',  dot: 'bg-pink-600' }
  };
  const style = CAT_STYLE[prof.category] || CAT_STYLE.psicologia;

  // ========== ESTADO RESERVA ==========
  let modality = 'presencial';
  let selectedDay = null;
  let selectedTime = null;
  let selectedStars = 5;

  // ========== RENDER PERFIL ==========
  function initials(name) {
    return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += i <= Math.round(rating)
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#e8a838" stroke="#e8a838"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    }
    return html;
  }

  function renderStarsSmall(n) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += i <= n
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#e8a838" stroke="#e8a838"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d1d5db"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    }
    return html;
  }

  document.getElementById('crumb-name').textContent = prof.name;
  const avatar = document.getElementById('prof-avatar');
  avatar.textContent = initials(prof.name);
  style.avatar.split(' ').forEach(c => avatar.classList.add(c));
  document.getElementById('prof-name').textContent = prof.name;
  document.getElementById('prof-role').textContent = prof.role;
  document.getElementById('prof-badge').innerHTML = '<span class="size-1.5 rounded-full ' + style.dot + '"></span> ' + style.label;
  document.getElementById('prof-rating').innerHTML = renderStars(4.8) + '<span class="ml-1 text-xs text-black/40 font-medium">4.8</span>';
  document.getElementById('prof-degree').textContent = prof.degree;
  document.getElementById('prof-specialty').textContent = prof.specialty;
  document.getElementById('prof-bio').textContent = prof.bio;
  document.getElementById('reserve-prof').textContent = 'con ' + prof.name.split(' ')[0];

  const tagWords = prof.specialty.toLowerCase();
  const keywords = tagWords.match(/(terapia|psicoterapia|psiquiatría|psicología|tcc|act|dbt|nutrición|salud mental|evaluación|ansiedad|depresión|duelo|rehabilitación|pareja|familiar|infantil|adolescente|forense)/g);
  const tags = [...new Set((prof.specialty.split(', ')).concat(keywords || []).filter(Boolean))].slice(0, 6);
  document.getElementById('prof-tags').innerHTML = tags.map(t =>
    '<span class="rounded-full bg-primary/5 border border-primary/10 px-3 py-1.5 text-xs font-medium text-primary">' + capitalize(t) + '</span>'
  ).join('');

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ========== COMENTARIOS ==========
  const STORAGE_COMMENTS_KEY = 'excelentemente_prof_comments';

  function getAllComments() {
    const stored = JSON.parse(localStorage.getItem(STORAGE_COMMENTS_KEY) || '[]');
    const seeded = (prof.comments || []).map(c => Object.assign({}, c, { id: 'seed-' + c.date + '-' + c.user }));
    return seeded.concat(stored.filter(c => c.profId === prof.id));
  }

  function renderComments() {
    const comments = getAllComments();
    const list = document.getElementById('comments-list');
    document.getElementById('comments-count').textContent = comments.length + ' comentario' + (comments.length === 1 ? '' : 's');

    if (comments.length === 0) {
      list.innerHTML = '<p class="text-sm text-black/40 bg-neutral-50 rounded-2xl border border-black/5 p-6 text-center">Aún no hay comentarios. Sé el primero en dejar tu apreciación.</p>';
      return;
    }
    list.innerHTML = comments.map(c => `
      <div class="rounded-2xl border border-black/5 bg-neutral-50 p-4">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-semibold">${escapeHtml(c.user)}</span>
          <span class="text-[10px] text-black/30">${formatDate(c.date)}</span>
        </div>
        <div class="flex gap-0.5 mb-2">${renderStarsSmall(c.stars)}</div>
        <p class="text-xs text-black/60 leading-relaxed">${escapeHtml(c.text)}</p>
      </div>
    `).join('');
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function showCommentMsg(text, ok) {
    const el = document.getElementById('comment-msg');
    el.textContent = text;
    el.className = 'text-xs text-center p-2.5 rounded-xl ' + (ok
      ? 'bg-green-50 border border-green-200 text-green-600'
      : 'bg-red-50 border border-red-200 text-red-600');
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
  }

  // Selector de estrellas
  function paintStars(n) {
    document.querySelectorAll('.comment-star').forEach(b => {
      b.classList.toggle('text-amber-400', +b.dataset.star <= n);
      b.classList.toggle('text-neutral-300', +b.dataset.star > n);
    });
  }
  document.querySelectorAll('.comment-star').forEach(b => {
    b.addEventListener('click', () => { selectedStars = +b.dataset.star; paintStars(selectedStars); });
  });
  paintStars(selectedStars);

  document.getElementById('comment-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('comment-name').value.trim();
    const text = document.getElementById('comment-text').value.trim();
    if (!name || !text) { showCommentMsg('Completa tu nombre y comentario.', false); return; }

    const stored = JSON.parse(localStorage.getItem(STORAGE_COMMENTS_KEY) || '[]');
    stored.push({
      id: Date.now(),
      profId: prof.id,
      user: name,
      stars: selectedStars,
      text: text,
      date: new Date().toISOString().slice(0, 10)
    });
    localStorage.setItem(STORAGE_COMMENTS_KEY, JSON.stringify(stored));

    document.getElementById('comment-name').value = '';
    document.getElementById('comment-text').value = '';
    paintStars(5);
    renderComments();
    showCommentMsg('¡Gracias por tu comentario!', true);
  });

  renderComments();

  // ========== RESERVA ==========
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

  function duracionLabel(inicio, fin) {
    const toMin = n => {
      const [h, m] = n.split(':').map(Number);
      return h * 60 + m;
    };
    const mins = toMin(fin) - toMin(inicio);
    if (mins % 60 === 0) return mins / 60 + ' h';
    return Math.floor(mins / 60) + ' h ' + (mins % 60 === 30 ? '30' : (mins % 60)) + ' min';
  }

  function renderSchedule() {
    const dayWrap = document.getElementById('schedule-days');
    dayWrap.innerHTML = prof.schedule.map(d =>
      '<button type="button" onclick="selectDay(\'' + d.day + '\')" data-day="' + d.day + '" class="sched-day rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black/60 hover:border-primary hover:text-primary transition-all">' + d.day + '</button>'
    ).join('');
    if (prof.schedule.length) selectDay(prof.schedule[0].day);
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
    const dayData = prof.schedule.find(d => d.day === day);
    const wrap = document.getElementById('schedule-times');
    if (dayData) {
      wrap.innerHTML = dayData.bloques.map(b =>
        '<button type="button" onclick="selectTime(\'' + b.inicio + '\',\'' + b.fin + '\')" data-inicio="' + b.inicio + '" data-fin="' + b.fin + '" data-day="' + day + '" class="sched-time rounded-lg border border-black/10 px-2 py-2 text-xs font-medium text-black/60 hover:border-primary hover:text-primary transition-all">' + b.inicio + ' - ' + b.fin + '<span class="block text-[10px] text-black/30 mt-0.5" data-dur>' + duracionLabel(b.inicio, b.fin) + '</span></button>'
      ).join('');
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
  };

  function nextDateForDay(dayName) {
    const map = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
    const target = map[dayName];
    const now = new Date();
    let diff = (target - now.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }

  function showReserveMsg(text, ok) {
    const el = document.getElementById('reserve-msg');
    el.textContent = text;
    el.className = 'mt-4 text-xs text-center p-3 rounded-xl ' + (ok
      ? 'bg-green-50 border border-green-200 text-green-600'
      : 'bg-red-50 border border-red-200 text-red-600');
    el.classList.remove('hidden');
  }

  window.reserveAppointment = function () {
    if (!selectedDay || !selectedTime) {
      showReserveMsg('Selecciona un día y horario disponible.', false);
      return;
    }
    const user = JSON.parse(localStorage.getItem('excelentemente_user'));
    if (!user) {
      const redirect = encodeURIComponent(window.location.href);
      window.location.href = 'login.html?redirect=' + redirect;
      return;
    }

    const appointments = JSON.parse(localStorage.getItem('excelentemente_appointments') || '[]');
    appointments.push({
      id: Date.now(),
      service: prof.specialty,
      professional: prof.name,
      modality: modality === 'virtual' ? 'Virtual' : 'Presencial',
      date: nextDateForDay(selectedDay),
      time: selectedTime.inicio + ' - ' + selectedTime.fin,
      status: 'proxima'
    });
    localStorage.setItem('excelentemente_appointments', JSON.stringify(appointments));

    showReserveMsg('✔ Cita reservada el ' + selectedDay + ' de ' + selectedTime.inicio + ' a ' + selectedTime.fin + ' (' + (modality === 'virtual' ? 'Virtual' : 'Presencial') + ').', true);
    document.getElementById('reserve-btn').disabled = true;
    document.getElementById('reserve-btn').classList.add('opacity-50', 'cursor-not-allowed');
  };

  renderSchedule();

  // Scroll al panel de reserva si vino desde "Reservar una cita"
  if (params.get('reservar') === '1') {
    const aside = document.querySelector('aside');
    if (aside) setTimeout(() => aside.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  }
})();