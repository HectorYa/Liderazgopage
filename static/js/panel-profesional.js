// ============================================
// EXCELENTEMENTE - Panel del profesional
// ============================================

(function () {
  const CATEGORY_LABEL = {
    psiquiatria: 'Psiquiatría',
    psicologia: 'Psicología',
    nutricion: 'Nutrición',
    fisioterapia: 'Fisioterapia',
    terapias: 'Terapias',
    cursos: 'Cursos'
  };
  const DAY_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const UPCOMING_STATUSES = ['pendiente', 'proxima', 'confirmada'];
  const STATUS_META = {
    pendiente: { label: 'Pendiente', cls: 'bg-amber-50 border-amber-200 text-amber-700' },
    proxima: { label: 'Próxima', cls: 'bg-primary/10 border-primary/20 text-primary' },
    confirmada: { label: 'Confirmada', cls: 'bg-primary/10 border-primary/20 text-primary' },
    atendida: { label: 'Atendida', cls: 'bg-green-50 border-green-200 text-green-700' },
    cancelada: { label: 'Cancelada', cls: 'bg-neutral-100 border-black/10 text-black/40' },
    no_asistio: { label: 'No asistió', cls: 'bg-red-50 border-red-200 text-red-600' },
    pasada: { label: 'Pasada', cls: 'bg-neutral-100 border-black/10 text-black/40' }
  };

  let professional = null;
  let appointments = [];
  let patientsById = {};
  let agendaFilter = 'proximas';
  let scheduleLoaded = false;
  let servicesLoaded = false;
  let assignedServiceIds = [];

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function initials(name) {
    return String(name || '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function hhmm(value) {
    return String(value || '').slice(0, 5);
  }

  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatDate(value) {
    const d = new Date(String(value) + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function patientName(id) {
    const p = patientsById[id] || {};
    const full = [p.name, p.lastname].filter(Boolean).join(' ');
    return full || 'Paciente';
  }

  function isUpcoming(a) {
    return String(a.date) >= todayISO() && UPCOMING_STATUSES.indexOf(a.status) !== -1;
  }

  function showMsg(id, text, ok) {
    const el = document.getElementById(id);
    if (!el) return;
    const spacing = id === 'agenda-msg' ? 'mb-4' : (id === 'services-msg' ? 'mt-3' : '');
    el.textContent = text;
    el.className = 'text-xs text-center p-2.5 rounded-xl ' + spacing + ' ' +
      (ok ? 'bg-green-50 border border-green-200 text-green-600' : 'bg-red-50 border border-red-200 text-red-600');
    el.classList.remove('hidden');
    clearTimeout(el._msgTimer);
    el._msgTimer = setTimeout(function () { el.classList.add('hidden'); }, 4500);
  }

  function renderAvatar(el, name, photo) {
    if (!el) return;
    el.innerHTML = '';
    if (photo) {
      const img = document.createElement('img');
      img.src = photo;
      img.alt = name;
      img.className = 'size-full object-cover';
      el.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.textContent = initials(name);
      el.appendChild(span);
    }
  }

  function renderIdentity() {
    const displayName = professional.name || 'Profesional';
    document.getElementById('pro-name-header').textContent = displayName;
    renderAvatar(document.getElementById('pro-avatar'), displayName, professional.photo_url);
    document.getElementById('pro-title').textContent = displayName;
    document.getElementById('pro-subtitle').textContent =
      [professional.role, CATEGORY_LABEL[professional.category], professional.specialty].filter(Boolean).join(' · ');
    document.getElementById('public-profile-link').href =
      'perfil-profesional.html?id=' + encodeURIComponent(professional.id);
  }

  // ========== TABS ==========
  function setTab(name) {
    document.querySelectorAll('.pro-tab').forEach(function (btn) {
      const active = btn.dataset.tab === name;
      btn.classList.toggle('border-primary', active);
      btn.classList.toggle('text-primary', active);
      btn.classList.toggle('border-transparent', !active);
      btn.classList.toggle('text-black/40', !active);
    });
    document.querySelectorAll('.pro-section').forEach(function (section) {
      section.classList.toggle('hidden', section.dataset.section !== name);
    });

    if (name === 'horarios' && !scheduleLoaded) loadSchedule();
    if (name === 'perfil' && !servicesLoaded) loadServices();
  }

  document.querySelectorAll('.pro-tab').forEach(function (btn) {
    btn.addEventListener('click', function () { setTab(btn.dataset.tab); });
  });
  document.querySelectorAll('[data-goto]').forEach(function (btn) {
    btn.addEventListener('click', function () { setTab(btn.dataset.goto); });
  });

  // ========== RESUMEN ==========
  function renderSummary() {
    const upcoming = appointments.filter(isUpcoming).length;
    const attended = appointments.filter(a => a.status === 'atendida').length;
    document.getElementById('stat-upcoming').textContent = upcoming;
    document.getElementById('stat-attended').textContent = attended;

    const next = appointments.filter(isUpcoming).sort(function (a, b) {
      return (a.date + ' ' + a.start_time).localeCompare(b.date + ' ' + b.start_time);
    })[0];

    document.getElementById('next-appointment').textContent = next
      ? formatDate(next.date) + ', ' + hhmm(next.start_time) + ' - ' + hhmm(next.end_time) +
        ' · ' + patientName(next.user_id) + ' · ' + (next.service_label || 'Consulta') +
        ' · ' + (next.modality === 'virtual' ? 'Virtual' : 'Presencial')
      : 'Sin citas programadas.';
  }

  async function loadCommentsCount() {
    const { count } = await sb
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('professional_id', professional.id);
    document.getElementById('stat-comments').textContent = count === null || count === undefined ? '—' : count;
  }

  // ========== CITAS ==========
  async function loadAppointments() {
    const { data, error } = await sb
      .from('appointments')
      .select('id,user_id,date,start_time,end_time,modality,status,service_label,notes')
      .eq('professional_id', professional.id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      appointments = [];
      document.getElementById('agenda-list').innerHTML =
        '<p class="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">No se pudo cargar la agenda.</p>';
      renderSummary();
      return;
    }

    appointments = data || [];
    const ids = [...new Set(appointments.map(a => a.user_id).filter(Boolean))];
    patientsById = {};

    if (ids.length) {
      const { data: profiles } = await sb
        .from('profiles')
        .select('id,name,lastname,phone,email')
        .in('id', ids);
      (profiles || []).forEach(function (p) { patientsById[p.id] = p; });
    }

    renderSummary();
    renderAgenda();
    renderPatients();
  }

  function filteredAppointments() {
    const list = appointments.filter(function (a) {
      if (agendaFilter === 'todas') return true;
      if (agendaFilter === 'pendientes') return ['pendiente', 'proxima'].indexOf(a.status) !== -1;
      if (agendaFilter === 'historial') return !isUpcoming(a);
      return isUpcoming(a);
    });
    const dir = agendaFilter === 'historial' || agendaFilter === 'todas' ? -1 : 1;
    return list.sort(function (a, b) {
      return dir * (a.date + ' ' + a.start_time).localeCompare(b.date + ' ' + b.start_time);
    });
  }

  function actionButtons(a) {
    if (UPCOMING_STATUSES.indexOf(a.status) === -1) return '';
    let html = '';
    if (a.status !== 'confirmada') {
      html += '<button type="button" data-action="confirmada" data-id="' + a.id + '" class="rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-primary-dark transition-colors">Confirmar</button>';
    }
    html += '<button type="button" data-action="atendida" data-id="' + a.id + '" class="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-[11px] font-semibold text-green-700 hover:bg-green-100 transition-colors">Atendida</button>';
    html += '<button type="button" data-action="no_asistio" data-id="' + a.id + '" class="rounded-full border border-black/10 px-3 py-1.5 text-[11px] font-semibold text-black/50 hover:border-red-200 hover:text-red-500 transition-colors">No asistió</button>';
    html += '<button type="button" data-action="cancelada" data-id="' + a.id + '" class="rounded-full border border-black/10 px-3 py-1.5 text-[11px] font-semibold text-black/50 hover:border-red-200 hover:text-red-500 transition-colors">Cancelar</button>';
    return html;
  }

  function renderAgenda() {
    const wrap = document.getElementById('agenda-list');
    const list = filteredAppointments();

    if (!list.length) {
      wrap.innerHTML = '<p class="rounded-xl border border-black/5 bg-neutral-50 p-6 text-center text-sm text-black/40">No hay citas en esta vista.</p>';
      return;
    }

    wrap.innerHTML = list.map(function (a) {
      const meta = STATUS_META[a.status] || STATUS_META.proxima;
      const patient = patientsById[a.user_id] || {};
      const contact = [
        patient.phone ? '<a href="tel:' + escapeHtml(patient.phone) + '" class="hover:text-primary">' + escapeHtml(patient.phone) + '</a>' : '',
        patient.email ? '<a href="mailto:' + escapeHtml(patient.email) + '" class="hover:text-primary">' + escapeHtml(patient.email) + '</a>' : ''
      ].filter(Boolean).join(' · ');

      return '<article class="rounded-2xl border border-black/5 bg-neutral-50/60 p-4 flex flex-col md:flex-row md:items-center gap-4">' +
        '<div class="md:w-36 shrink-0">' +
          '<p class="text-xs font-semibold text-primary uppercase tracking-wider">' + escapeHtml(formatDate(a.date)) + '</p>' +
          '<p class="mt-1 text-sm text-black/70">' + escapeHtml(hhmm(a.start_time)) + ' - ' + escapeHtml(hhmm(a.end_time)) + '</p>' +
        '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            '<p class="text-sm font-semibold">' + escapeHtml(patientName(a.user_id)) + '</p>' +
            '<span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + meta.cls + '">' + meta.label + '</span>' +
          '</div>' +
          '<p class="mt-1 text-xs text-black/50">' + escapeHtml(a.service_label || 'Consulta') + ' · ' + (a.modality === 'virtual' ? 'Virtual' : 'Presencial') + '</p>' +
          (contact ? '<p class="mt-1 text-xs text-black/40">' + contact + '</p>' : '') +
          (a.notes ? '<p class="mt-2 rounded-lg bg-white border border-black/5 px-2.5 py-1.5 text-xs text-black/50">' + escapeHtml(a.notes) + '</p>' : '') +
        '</div>' +
        '<div class="flex flex-wrap gap-2 md:justify-end">' + actionButtons(a) + '</div>' +
      '</article>';
    }).join('');
  }

  document.querySelectorAll('.agenda-filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      agendaFilter = btn.dataset.filter;
      document.querySelectorAll('.agenda-filter').forEach(function (b) {
        const active = b.dataset.filter === agendaFilter;
        b.classList.toggle('border-primary', active);
        b.classList.toggle('bg-primary', active);
        b.classList.toggle('text-white', active);
        b.classList.toggle('border-black/10', !active);
        b.classList.toggle('text-black/50', !active);
      });
      renderAgenda();
    });
  });

  document.getElementById('agenda-list').addEventListener('click', async function (e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if ((action === 'cancelada' || action === 'no_asistio') &&
        !window.confirm('¿Registrar la cita como "' + (action === 'cancelada' ? 'cancelada' : 'no asistió') + '"?')) {
      return;
    }

    const buttons = document.querySelectorAll('#agenda-list [data-id="' + id + '"]');
    buttons.forEach(function (b) { b.disabled = true; });

    const { error } = await sb
      .from('appointments')
      .update({ status: action })
      .eq('id', id)
      .eq('professional_id', professional.id);

    if (error) {
      showMsg('agenda-msg', 'No se pudo actualizar la cita. Intenta de nuevo.', false);
      buttons.forEach(function (b) { b.disabled = false; });
      return;
    }

    showMsg('agenda-msg', 'Cita actualizada.', true);
    await loadAppointments();
  });

  // ========== PACIENTES ==========
  function renderPatients() {
    const map = new Map();

    appointments.forEach(function (a) {
      if (!a.user_id) return;
      let item = map.get(a.user_id);
      if (!item) {
        item = { id: a.user_id, total: 0, attended: 0, last: null, next: null };
        map.set(a.user_id, item);
      }
      item.total += 1;
      if (a.status === 'atendida') item.attended += 1;
      if (a.status !== 'cancelada' && (!item.last || a.date > item.last)) item.last = a.date;
      if (isUpcoming(a) && (!item.next || a.date < item.next)) item.next = a.date;
    });

    const list = [...map.values()].sort(function (a, b) {
      return String(b.next || b.last || '').localeCompare(String(a.next || a.last || ''));
    });

    document.getElementById('patients-summary').textContent = list.length
      ? list.length + ' paciente' + (list.length === 1 ? '' : 's') + ' · ' + appointments.length + ' cita' + (appointments.length === 1 ? '' : 's') + ' registradas'
      : 'Personas que han reservado contigo.';

    const wrap = document.getElementById('patients-list');
    if (!list.length) {
      wrap.innerHTML = '<p class="md:col-span-2 rounded-xl border border-black/5 bg-neutral-50 p-6 text-center text-sm text-black/40">Aún no tienes pacientes con citas.</p>';
      return;
    }

    wrap.innerHTML = list.map(function (item) {
      const p = patientsById[item.id] || {};
      const name = [p.name, p.lastname].filter(Boolean).join(' ') || 'Paciente';
      const contact = [
        p.phone ? '<a href="tel:' + escapeHtml(p.phone) + '" class="hover:text-primary">' + escapeHtml(p.phone) + '</a>' : '',
        p.email ? '<a href="mailto:' + escapeHtml(p.email) + '" class="hover:text-primary">' + escapeHtml(p.email) + '</a>' : ''
      ].filter(Boolean).join(' · ');

      return '<div class="rounded-2xl border border-black/5 bg-neutral-50 p-4">' +
        '<div class="flex items-start gap-3">' +
          '<div class="size-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">' + escapeHtml(initials(name)) + '</div>' +
          '<div class="min-w-0">' +
            '<p class="truncate text-sm font-semibold">' + escapeHtml(name) + '</p>' +
            (contact ? '<p class="mt-0.5 truncate text-xs text-black/40">' + contact + '</p>' : '') +
            '<p class="mt-2 text-xs text-black/50">' + item.total + ' cita' + (item.total === 1 ? '' : 's') + ' · ' + item.attended + ' atendida' + (item.attended === 1 ? '' : 's') + '</p>' +
            (item.last ? '<p class="mt-1 text-xs text-black/40">Última: ' + escapeHtml(formatDate(item.last)) + '</p>' : '') +
            (item.next ? '<p class="mt-1 text-xs font-medium text-primary">Próxima: ' + escapeHtml(formatDate(item.next)) + '</p>' : '') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // ========== HORARIOS ==========
  async function loadSchedule() {
    scheduleLoaded = true;
    const wrap = document.getElementById('schedule-list');
    wrap.innerHTML = '<p class="text-sm text-black/40">Cargando horarios...</p>';

    const { data, error } = await sb
      .from('schedule_blocks')
      .select('id,day,start_time,end_time')
      .eq('professional_id', professional.id);

    if (error) {
      wrap.innerHTML = '<p class="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">No se pudieron cargar los horarios.</p>';
      return;
    }

    const rows = data || [];
    if (!rows.length) {
      wrap.innerHTML = '<p class="rounded-xl border border-black/5 bg-neutral-50 p-6 text-center text-sm text-black/40">Aún no has publicado horarios.</p>';
      return;
    }

    const grouped = {};
    rows.forEach(function (row) {
      if (!grouped[row.day]) grouped[row.day] = [];
      grouped[row.day].push(row);
    });

    const days = DAY_ORDER.filter(day => grouped[day])
      .concat(Object.keys(grouped).filter(day => DAY_ORDER.indexOf(day) === -1));

    wrap.innerHTML = days.map(function (day) {
      const blocks = grouped[day].sort((a, b) => hhmm(a.start_time).localeCompare(hhmm(b.start_time)));
      return '<div>' +
        '<p class="text-xs font-semibold uppercase tracking-wider text-primary">' + day + '</p>' +
        '<div class="mt-2 flex flex-col gap-2">' +
          blocks.map(function (b) {
            return '<div class="flex items-center justify-between rounded-xl border border-black/5 bg-neutral-50 px-3 py-2">' +
              '<span class="text-sm text-black/70">' + escapeHtml(hhmm(b.start_time)) + ' - ' + escapeHtml(hhmm(b.end_time)) + '</span>' +
              '<button type="button" data-del-schedule="' + b.id + '" class="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors">Eliminar</button>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    }).join('');
  }

  document.getElementById('schedule-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const day = document.getElementById('schedule-day').value;
    const start = document.getElementById('schedule-start').value;
    const end = document.getElementById('schedule-end').value;

    if (!start || !end || end <= start) {
      showMsg('schedule-msg', 'La hora de fin debe ser mayor que la de inicio.', false);
      return;
    }

    const { error } = await sb.from('schedule_blocks').insert({
      professional_id: professional.id,
      day: day,
      start_time: start,
      end_time: end
    });

    if (error) {
      showMsg('schedule-msg', error.code === '23505'
        ? 'Ya existe un bloque con ese día y hora de inicio.'
        : 'No se pudo guardar el bloque. Intenta de nuevo.', false);
      return;
    }

    document.getElementById('schedule-start').value = '';
    document.getElementById('schedule-end').value = '';
    showMsg('schedule-msg', 'Bloque agregado.', true);
    await loadSchedule();
  });

  document.getElementById('schedule-list').addEventListener('click', async function (e) {
    const btn = e.target.closest('[data-del-schedule]');
    if (!btn) return;
    if (!window.confirm('¿Eliminar este bloque de horario?')) return;

    const { error } = await sb
      .from('schedule_blocks')
      .delete()
      .eq('id', btn.dataset.delSchedule)
      .eq('professional_id', professional.id);

    if (error) {
      showMsg('schedule-msg', 'No se pudo eliminar el bloque.', false);
      return;
    }
    showMsg('schedule-msg', 'Bloque eliminado.', true);
    await loadSchedule();
  });

  // ========== PERFIL ==========
  function fillProfileForm() {
    document.getElementById('profile-name').value = professional.name || '';
    document.getElementById('profile-role').value = professional.role || '';
    document.getElementById('profile-degree').value = professional.degree || '';
    document.getElementById('profile-specialty').value = professional.specialty || '';
    document.getElementById('profile-bio').value = professional.bio || '';
    document.getElementById('profile-photo').value = professional.photo_url || '';
    document.getElementById('profile-category').textContent = CATEGORY_LABEL[professional.category] || professional.category || '';
    document.getElementById('profile-active').textContent = professional.active
      ? 'Visible en el catálogo'
      : 'Ficha desactivada por administración';
  }

  document.getElementById('profile-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('profile-name').value.trim(),
      role: document.getElementById('profile-role').value.trim(),
      degree: document.getElementById('profile-degree').value.trim(),
      specialty: document.getElementById('profile-specialty').value.trim(),
      bio: document.getElementById('profile-bio').value.trim(),
      photo_url: document.getElementById('profile-photo').value.trim() || null
    };

    if (!payload.name || !payload.role || !payload.degree || !payload.specialty || !payload.bio) {
      showMsg('profile-msg', 'Completa todos los campos obligatorios.', false);
      return;
    }

    const { data, error } = await sb
      .from('professionals')
      .update(payload)
      .eq('id', professional.id)
      .select('id');

    if (error || !data || !data.length) {
      showMsg('profile-msg', 'No se pudo guardar el perfil. Revisa tus permisos.', false);
      return;
    }

    Object.assign(professional, payload);
    renderIdentity();
    fillProfileForm();
    showMsg('profile-msg', 'Perfil actualizado.', true);
  });

  // ========== SERVICIOS ==========
  async function loadServices() {
    servicesLoaded = true;
    const wrap = document.getElementById('services-list');
    wrap.innerHTML = '<p class="text-sm text-black/40">Cargando servicios...</p>';

    const [servicesRes, assignedRes] = await Promise.all([
      sb.from('services').select('id,name,category').order('category', { ascending: true }).order('name', { ascending: true }),
      sb.from('professional_services').select('service_id').eq('professional_id', professional.id)
    ]);

    if (servicesRes.error || assignedRes.error) {
      wrap.innerHTML = '<p class="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">No se pudieron cargar los servicios. Verifica que la migración 003 esté aplicada.</p>';
      return;
    }

    const services = servicesRes.data || [];
    assignedServiceIds = (assignedRes.data || []).map(r => Number(r.service_id));

    if (!services.length) {
      wrap.innerHTML = '<p class="text-sm text-black/40">No hay servicios creados.</p>';
      return;
    }

    wrap.innerHTML = services.map(function (s) {
      const checked = assignedServiceIds.indexOf(Number(s.id)) !== -1;
      return '<label class="flex items-start gap-2 rounded-xl border border-black/5 bg-neutral-50 px-3 py-2 text-sm hover:border-primary/20 transition-colors">' +
        '<input type="checkbox" data-service-id="' + s.id + '"' + (checked ? ' checked' : '') + ' class="mt-0.5 accent-[#1a7a6d]" />' +
        '<span>' + escapeHtml(s.name) +
          '<span class="block text-[10px] text-black/40">' + escapeHtml(CATEGORY_LABEL[s.category] || s.category) + '</span>' +
        '</span>' +
      '</label>';
    }).join('');
  }

  document.getElementById('services-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const boxes = [...document.querySelectorAll('#services-list input[data-service-id]')];
    if (!boxes.length) return;

    const selected = boxes.filter(b => b.checked).map(b => Number(b.dataset.serviceId));
    const current = new Set(assignedServiceIds);
    const toAdd = selected.filter(id => !current.has(id));
    const toRemove = assignedServiceIds.filter(id => selected.indexOf(id) === -1);

    if (toRemove.length) {
      const { error } = await sb
        .from('professional_services')
        .delete()
        .eq('professional_id', professional.id)
        .in('service_id', toRemove);
      if (error) {
        showMsg('services-msg', 'No se pudieron quitar algunos servicios.', false);
        return;
      }
    }

    if (toAdd.length) {
      const { error } = await sb
        .from('professional_services')
        .insert(toAdd.map(id => ({ professional_id: professional.id, service_id: id })));
      if (error) {
        showMsg('services-msg', 'No se pudieron agregar algunos servicios.', false);
        return;
      }
    }

    assignedServiceIds = selected;
    showMsg('services-msg', 'Servicios actualizados.', true);
  });

  // ========== INIT ==========
  (async function () {
    window.logout = async function () {
      if (window.sb) await sb.auth.signOut();
      window.location.href = 'index.html';
    };

    const ctx = await requireSession(['profesional']);
    if (!ctx) return;

    const { data, error } = await sb
      .from('professionals')
      .select('id,name,role,category,degree,specialty,bio,photo_url,active,user_id')
      .eq('user_id', ctx.session.user.id)
      .maybeSingle();

    document.getElementById('pro-loading').classList.add('hidden');

    if (error || !data) {
      document.getElementById('pro-unlinked').classList.remove('hidden');
      return;
    }

    professional = data;
    renderIdentity();
    fillProfileForm();
    document.getElementById('pro-content').classList.remove('hidden');
    setTab('resumen');

    if (professional.active === false) {
      const note = document.createElement('p');
      note.className = 'mb-6 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2';
      note.textContent = 'Tu ficha está desactivada y no aparece en el catálogo público.';
      document.getElementById('pro-content').prepend(note);
    }

    await Promise.all([loadAppointments(), loadCommentsCount()]);

    const channel = realtimeAppointments('professional_id=eq.' + professional.id, rtDebounce(loadAppointments, 400));
    window.addEventListener('beforeunload', function () { rtLeave(channel); });
  })();
})();
