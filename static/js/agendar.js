// ============================================
// EXCELENTEMENTE - Agendar cita (reserva real)
// ============================================

(function () {
  const CATEGORY_LABEL = {
    psiquiatria: 'Psiquiatría',
    psicologia: 'Psicología',
    nutricion: 'Nutrición',
    fisioterapia: 'Fisioterapia'
  };
  const DAY_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  let allServices = [];
  let sessionUser = null;
  let modality = 'presencial';
  let schedule = [];
  let taken = new Set();
  let channel = null;
  let selectedDay = null;
  let selectedTime = null;

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function hhmm(value) {
    return String(value || '').slice(0, 5);
  }

  function toISODate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatDate(value) {
    const d = new Date(String(value) + 'T00:00:00');
    return d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function nextDateForDay(dayName) {
    const map = { Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 0 };
    const target = map[dayName];
    if (target === undefined) return null;
    const now = new Date();
    let diff = (target - now.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    return toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff));
  }

  function showMsg(text, ok) {
    const el = document.getElementById('agenda-msg');
    el.textContent = text;
    el.className = 'text-xs text-center p-3 rounded-xl ' +
      (ok ? 'bg-green-50 border border-green-200 text-green-600' : 'bg-red-50 border border-red-200 text-red-600');
    el.classList.remove('hidden');
  }

  function profes() {
    return document.getElementById('agenda-prof').value;
  }

  async function refreshTaken(profId) {
    const { data } = await sb
      .from('appointments')
      .select('date,start_time')
      .eq('professional_id', profId)
      .neq('status', 'cancelada')
      .gte('date', toISODate(new Date()));
    taken = new Set((data || []).map(a => a.date + '|' + hhmm(a.start_time)));
  }

  function subscribeSlots(profId) {
    rtLeave(channel);
    channel = realtimeAppointments('professional_id=eq.' + profId, rtDebounce(async function () {
      if (profes() !== profId) return;
      await refreshTaken(profId);
      if (selectedDay) selectDay(selectedDay);
    }, 400));
  }

  async function loadProfessional(profId) {
    if (!profId) return;

    const [scheduleRes, servicesRes] = await Promise.all([
      sb.from('schedule_blocks').select('day,start_time,end_time').eq('professional_id', profId),
      sb.from('professional_services').select('service_id, services(name)').eq('professional_id', profId),
      refreshTaken(profId)
    ]);

    const grouped = {};
    (scheduleRes.data || []).forEach(function (row) {
      if (!grouped[row.day]) grouped[row.day] = [];
      grouped[row.day].push(row);
    });
    schedule = Object.keys(grouped)
      .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
      .map(day => ({ day: day, bloques: grouped[day].sort((a, b) => hhmm(a.start_time).localeCompare(hhmm(b.start_time))) }));

    const offered = (servicesRes.data || [])
      .map(row => row.services && row.services.name ? row.services.name : null)
      .filter(Boolean);

    const options = offered.length
      ? offered
      : allServices.map(s => s.name);

    const serviceSelect = document.getElementById('agenda-service');
    serviceSelect.innerHTML = options.length
      ? options.map(name => '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>').join('')
      : '<option value="">Sin servicios configurados</option>';

    subscribeSlots(profId);
    selectedTime = null;
    renderDays();
  }

  function renderDays() {
    const wrap = document.getElementById('agenda-days');
    if (!schedule.length) {
      wrap.innerHTML = '';
      document.getElementById('agenda-times').innerHTML = '<p class="col-span-4 text-xs text-black/40 text-center py-4">Este profesional aún no tiene horarios publicados.</p>';
      return;
    }
    wrap.innerHTML = schedule.map(d =>
      '<button type="button" onclick="selectDay(\'' + escapeHtml(d.day) + '\')" data-day="' + escapeHtml(d.day) + '" class="sched-day rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-black/60 hover:border-primary hover:text-primary transition-all">' + escapeHtml(d.day) + '</button>'
    ).join('');
    selectDay(schedule[0].day);
  }

  window.selectDay = function (day) {
    selectedDay = day;
    selectedTime = null;
    document.querySelectorAll('.sched-day').forEach(function (b) {
      const active = b.dataset.day === day;
      b.classList.toggle('bg-primary', active);
      b.classList.toggle('text-white', active);
      b.classList.toggle('border-primary', active);
      b.classList.toggle('text-black/60', !active);
    });

    const dayData = schedule.find(d => d.day === day);
    const wrap = document.getElementById('agenda-times');
    const date = nextDateForDay(day);

    if (!dayData) {
      wrap.innerHTML = '<p class="col-span-4 text-xs text-black/40 text-center py-4">Sin horarios este día.</p>';
      return;
    }

    wrap.innerHTML = dayData.bloques.map(function (b) {
      const inicio = hhmm(b.start_time);
      const fin = hhmm(b.end_time);
      const busy = date && taken.has(date + '|' + inicio);
      return '<button type="button" ' + (busy ? 'disabled' : 'onclick="selectTime(\'' + inicio + '\',\'' + fin + '\')"') +
        ' data-inicio="' + inicio + '" data-fin="' + fin + '" data-day="' + escapeHtml(day) + '"' +
        ' class="rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ' +
        (busy ? 'border-black/5 bg-black/[0.02] text-black/25 cursor-not-allowed line-through' : 'border-black/10 text-black/60 hover:border-primary hover:text-primary') + '">' +
        inicio + ' - ' + fin + (busy ? '<span class="block text-[10px] mt-0.5">Ocupado</span>' : '') +
      '</button>';
    }).join('');
  };

  window.selectTime = function (inicio, fin) {
    selectedTime = { inicio: inicio, fin: fin };
    document.querySelectorAll('#agenda-times button[data-inicio]').forEach(function (b) {
      const active = b.dataset.inicio === inicio && b.dataset.fin === fin && b.dataset.day === selectedDay;
      b.classList.toggle('bg-primary', active);
      b.classList.toggle('text-white', active);
      b.classList.toggle('border-primary', active);
      b.classList.toggle('text-black/60', !active);
    });
  };

  window.selectModality = function (value) {
    modality = value;
    document.querySelectorAll('.mod-btn').forEach(function (b) {
      const active = b.id === 'mod-' + value;
      b.classList.toggle('border-primary', active);
      b.classList.toggle('bg-primary/5', active);
      b.classList.toggle('text-primary', active);
      b.classList.toggle('border-black/10', !active);
      b.classList.toggle('text-black/50', !active);
    });
  };

  document.getElementById('agenda-submit').addEventListener('click', async function () {
    if (!sessionUser) {
      window.location.href = 'login.html?redirect=' + encodeURIComponent('agendar.html');
      return;
    }
    if (!selectedDay || !selectedTime) {
      showMsg('Selecciona un día y un horario disponible.', false);
      return;
    }

    const profId = profes();
    const serviceName = document.getElementById('agenda-service').value;
    const date = nextDateForDay(selectedDay);
    const btn = document.getElementById('agenda-submit');
    btn.disabled = true;
    btn.textContent = 'Reservando...';

    const { error } = await sb.from('appointments').insert({
      user_id: sessionUser.id,
      professional_id: profId,
      service_label: serviceName || null,
      modality: modality,
      date: date,
      start_time: selectedTime.inicio,
      end_time: selectedTime.fin,
      status: 'proxima'
    });

    btn.disabled = false;
    btn.textContent = 'Confirmar cita';

    if (error) {
      if (error.code === '23505') {
        taken.add(date + '|' + selectedTime.inicio);
        showMsg('Ese horario acaba de ser reservado. Elige otro, por favor.', false);
        selectDay(selectedDay);
      } else {
        showMsg('No se pudo reservar la cita. Intenta de nuevo.', false);
      }
      return;
    }

    taken.add(date + '|' + selectedTime.inicio);
    showMsg('¡Cita reservada! ' + formatDate(date) + ' de ' + selectedTime.inicio + ' a ' + selectedTime.fin + ' (' + (modality === 'virtual' ? 'Virtual' : 'Presencial') + '). Puedes verla en tu panel.', true);
    selectedTime = null;
    selectDay(selectedDay);
  });

  (async function init() {
    const loading = document.getElementById('agenda-loading');
    const content = document.getElementById('agenda-content');

    if (!window.sb) {
      loading.textContent = 'No se pudo conectar con el servidor. Intenta más tarde.';
      return;
    }

    const [{ data: sessionData }, profRes, servicesRes] = await Promise.all([
      sb.auth.getSession(),
      sb.from('professionals').select('id,name,category,specialty').eq('active', true).order('category').order('name'),
      sb.from('services').select('id,name,category').order('name')
    ]);

    sessionUser = sessionData && sessionData.session ? sessionData.session.user : null;
    allServices = servicesRes.data || [];

    const professionals = profRes.data || [];
    loading.classList.add('hidden');
    content.classList.remove('hidden');

    if (!sessionUser) {
      document.getElementById('agenda-auth-note').classList.remove('hidden');
    }

    const select = document.getElementById('agenda-prof');
    if (!professionals.length) {
      select.innerHTML = '<option value="">No hay profesionales disponibles</option>';
      document.getElementById('agenda-times').innerHTML = '<p class="col-span-4 text-xs text-black/40 text-center py-4">Vuelve pronto.</p>';
      return;
    }

    const grouped = {};
    professionals.forEach(function (p) {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    });

    select.innerHTML = Object.keys(grouped).map(function (cat) {
      return '<optgroup label="' + escapeHtml(CATEGORY_LABEL[cat] || cat) + '">' +
        grouped[cat].map(p => '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.name) + ' — ' + escapeHtml(p.specialty) + '</option>').join('') +
      '</optgroup>';
    }).join('');

    const params = new URLSearchParams(window.location.search);
    const wanted = params.get('profesional');
    if (wanted && professionals.some(p => p.id === wanted)) select.value = wanted;

    select.addEventListener('change', function () { loadProfessional(select.value); });
    window.addEventListener('beforeunload', function () { rtLeave(channel); });
    await loadProfessional(select.value);
  })();
})();
