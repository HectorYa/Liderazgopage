// ============================================
// EXCELENTEMENTE - Panel de administración
// ============================================

(function () {
  const CATEGORY_LABEL = {
    psiquiatria: 'Psiquiatría',
    psicologia: 'Psicología',
    nutricion: 'Nutrición',
    fisioterapia: 'Fisioterapia',
    terapias: 'Terapias Grupales',
    cursos: 'Cursos y Talleres'
  };
  const ROLE_LABEL = { paciente: 'Paciente', profesional: 'Profesional', admin: 'Administrador' };
  const STATUS_META = {
    pendiente: { label: 'Pendiente', cls: 'bg-amber-50 border-amber-200 text-amber-700' },
    proxima: { label: 'Próxima', cls: 'bg-primary/10 border-primary/20 text-primary' },
    confirmada: { label: 'Confirmada', cls: 'bg-primary/10 border-primary/20 text-primary' },
    atendida: { label: 'Atendida', cls: 'bg-green-50 border-green-200 text-green-700' },
    cancelada: { label: 'Cancelada', cls: 'bg-neutral-100 border-black/10 text-black/40' },
    no_asistio: { label: 'No asistió', cls: 'bg-red-50 border-red-200 text-red-600' },
    pasada: { label: 'Pasada', cls: 'bg-neutral-100 border-black/10 text-black/40' }
  };
  const MESSAGE_STATUS = { nuevo: 'Nuevo', leido: 'Leído', respondido: 'Respondido' };
  const ACCOUNT_DOMAIN = 'excelentemente.org';

  let currentUser = null;
  let currentProfile = {};
  let professionals = [];
  let professionalsById = {};
  let users = [];
  let profileById = {};
  let appointments = [];
  let messages = [];

  const loaded = { profesionales: false, servicios: false, citas: false, usuarios: false, mensajes: false, comentarios: false };

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function initials(name) {
    return String(name || '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function splitName(full) {
    const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { name: '', lastname: '' };
    return { name: parts[0], lastname: parts.slice(1).join(' ') };
  }

  function suggestedEmail(full) {
    const base = String(full || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
      .trim().split(/\s+/).filter(Boolean).join('.');
    return base ? base + '@' + ACCOUNT_DOMAIN : '';
  }

  async function invokeFunction(body) {
    const { data, error } = await sb.functions.invoke('create-user', { body });
    if (error) {
      let msg = 'No se pudo gestionar la cuenta. ¿Está desplegada la función create-user?';
      try { const b = await error.context.json(); if (b && b.error) msg = b.error; } catch (_) { /* sin cuerpo */ }
      return { error: msg };
    }
    if (data && data.error) return { error: data.error };
    return { data: data };
  }

  function hhmm(value) {
    return String(value || '').slice(0, 5);
  }

  function formatDate(value) {
    if (!value) return '';
    const d = String(value).length <= 10 ? new Date(String(value) + 'T00:00:00') : new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function fullName(p) {
    if (!p) return '';
    return [p.name, p.lastname].filter(Boolean).join(' ') || p.email || '';
  }

  function showMsg(id, text, ok) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = 'text-xs text-center p-2.5 rounded-xl ' +
      (ok ? 'bg-green-50 border border-green-200 text-green-600' : 'bg-red-50 border border-red-200 text-red-600');
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(function () { el.classList.add('hidden'); }, 4500);
  }

  // ========== CONTADORES ==========
  async function countRows(table, apply) {
    let query = sb.from(table).select('*', { count: 'exact', head: true });
    if (apply) query = apply(query);
    const { count, error } = await query;
    return error ? '—' : count;
  }

  async function refreshCounts() {
    const [professionals, services, appointments, patients] = await Promise.all([
      countRows('professionals', q => q.eq('active', true)),
      countRows('services'),
      countRows('appointments', q => q.in('status', ['pendiente', 'proxima', 'confirmada'])),
      countRows('profiles', q => q.eq('role', 'paciente'))
    ]);
    document.getElementById('stat-professionals').textContent = professionals;
    document.getElementById('stat-services').textContent = services;
    document.getElementById('stat-appointments').textContent = appointments;
    document.getElementById('stat-patients').textContent = patients;
  }

  // ========== TABS ==========
  function setTab(name) {
    document.querySelectorAll('.admin-tab').forEach(function (btn) {
      const active = btn.dataset.tab === name;
      btn.classList.toggle('border-primary', active);
      btn.classList.toggle('text-primary', active);
      btn.classList.toggle('border-transparent', !active);
      btn.classList.toggle('text-black/40', !active);
    });
    document.querySelectorAll('.admin-section').forEach(function (section) {
      section.classList.toggle('hidden', section.dataset.section !== name);
    });

    if (name === 'profesionales' && !loaded.profesionales) loadProfessionalsTab();
    if (name === 'servicios' && !loaded.servicios) loadServicesTab();
    if (name === 'citas' && !loaded.citas) loadAppointments();
    if (name === 'usuarios' && !loaded.usuarios) loadUsersTab();
    if (name === 'mensajes' && !loaded.mensajes) loadMessages();
    if (name === 'comentarios' && !loaded.comentarios) loadComments();
  }

  document.querySelectorAll('.admin-tab').forEach(function (btn) {
    btn.addEventListener('click', function () { setTab(btn.dataset.tab); });
  });

  // ========== PROFESIONALES ==========
  async function loadProfessionalsTab() {
    loaded.profesionales = true;
    await loadUserOptions();
    await loadProfessionalsList();
  }

  async function loadProfessionalsList() {
    const { data, error } = await sb
      .from('professionals')
      .select('id,name,role,category,degree,specialty,bio,photo_url,active,display_order,user_id')
      .order('category', { ascending: true })
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    const wrap = document.getElementById('prof-list');
    if (error) {
      wrap.innerHTML = '<p class="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">No se pudieron cargar las fichas.</p>';
      return;
    }

    professionals = data || [];
    professionalsById = {};
    professionals.forEach(function (p) { professionalsById[p.id] = p; });

    if (!professionals.length) {
      wrap.innerHTML = '<p class="rounded-xl border border-black/5 bg-neutral-50 p-6 text-center text-sm text-black/40">Aún no hay profesionales.</p>';
      return;
    }

    wrap.innerHTML = professionals.map(function (p) {
      const linkedProfile = p.user_id ? profileById[p.user_id] : null;
      const linked = p.user_id
        ? ((linkedProfile && linkedProfile.email) || (linkedProfile ? fullName(linkedProfile) : '') || ('ID ' + p.user_id.slice(0, 8)))
        : null;
      return '<div class="rounded-2xl border border-black/5 bg-neutral-50 p-4 flex items-start gap-3">' +
        '<div class="size-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold overflow-hidden">' +
          (p.photo_url
            ? '<img src="' + escapeHtml(p.photo_url) + '" alt="" class="size-full object-cover" />'
            : escapeHtml(initials(p.name))) +
        '</div>' +
        '<div class="min-w-0 flex-1">' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            '<p class="text-sm font-semibold">' + escapeHtml(p.name) + '</p>' +
            '<span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + (p.active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-neutral-100 border-black/10 text-black/40') + '">' + (p.active ? 'Activo' : 'Inactivo') + '</span>' +
          '</div>' +
          '<p class="mt-1 text-xs text-black/50">' + escapeHtml(p.role) + ' · ' + escapeHtml(CATEGORY_LABEL[p.category] || p.category) + '</p>' +
          '<p class="mt-1 text-xs text-black/40">' + (linked ? 'Cuenta: ' + escapeHtml(linked) : 'Sin cuenta vinculada') + '</p>' +
        '</div>' +
        '<div class="flex flex-col gap-1 shrink-0">' +
          '<button type="button" data-edit-prof="' + escapeHtml(p.id) + '" class="text-xs font-semibold text-primary hover:text-primary-dark">Editar</button>' +
          (p.user_id ? '<button type="button" data-reset-prof="' + escapeHtml(p.id) + '" class="text-xs font-semibold text-black/50 hover:text-black">Restablecer clave</button>' : '') +
          '<button type="button" data-toggle-prof="' + escapeHtml(p.id) + '" class="text-xs font-semibold text-black/50 hover:text-black">' + (p.active ? 'Desactivar' : 'Activar') + '</button>' +
          '<button type="button" data-del-prof="' + escapeHtml(p.id) + '" class="text-xs font-semibold text-red-500 hover:text-red-600">Eliminar</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  async function loadUserOptions() {
    const { data } = await sb
      .from('profiles')
      .select('id,name,lastname,email,role')
      .order('email', { ascending: true });

    users = data || [];
    users.forEach(function (u) { profileById[u.id] = u; });

    const select = document.getElementById('prof-user');
    const current = select.value;
    select.innerHTML = '<option value="">Sin vincular</option>' + users.map(function (u) {
      return '<option value="' + escapeHtml(u.id) + '">' + escapeHtml(fullName(u)) + ' · ' + escapeHtml(u.email) + '</option>';
    }).join('');
    select.value = current;
  }

  function resetProfForm() {
    document.getElementById('prof-form').reset();
    document.getElementById('prof-original-id').value = '';
    document.getElementById('prof-id').disabled = false;
    document.getElementById('prof-order').value = '0';
    document.getElementById('prof-active').checked = true;
    document.getElementById('prof-user').value = '';
    document.getElementById('prof-email').value = '';
    document.getElementById('prof-password').value = '';
    document.getElementById('prof-form-title').textContent = 'Nuevo profesional';
    document.getElementById('prof-cancel').classList.add('hidden');
  }

  document.getElementById('prof-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const originalId = document.getElementById('prof-original-id').value;
    const id = document.getElementById('prof-id').value.trim().toLowerCase();
    const userId = document.getElementById('prof-user').value || null;

    if (!originalId && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      showMsg('prof-msg', 'El identificador solo admite minúsculas, números y guiones.', false);
      return;
    }

    const payload = {
      name: document.getElementById('prof-name').value.trim(),
      role: document.getElementById('prof-role').value.trim(),
      category: document.getElementById('prof-category').value,
      degree: document.getElementById('prof-degree').value.trim(),
      specialty: document.getElementById('prof-specialty').value.trim(),
      bio: document.getElementById('prof-bio').value.trim(),
      photo_url: document.getElementById('prof-photo').value.trim() || null,
      display_order: Number(document.getElementById('prof-order').value || 0),
      active: document.getElementById('prof-active').checked,
      user_id: userId
    };

    if (!payload.name || !payload.role || !payload.degree || !payload.specialty || !payload.bio) {
      showMsg('prof-msg', 'Completa todos los campos obligatorios.', false);
      return;
    }

    const accountEmail = document.getElementById('prof-email').value.trim();
    const accountPassword = document.getElementById('prof-password').value;
    if (!userId && ((accountEmail && !accountPassword) || (accountPassword && !accountEmail))) {
      showMsg('prof-msg', 'Para crear la cuenta de acceso indica correo y contraseña.', false);
      return;
    }
    if (accountPassword && accountPassword.length < 6) {
      showMsg('prof-msg', 'La contraseña debe tener al menos 6 caracteres.', false);
      return;
    }

    let error;
    if (originalId) {
      const res = await sb.from('professionals').update(payload).eq('id', originalId);
      error = res.error;
    } else {
      payload.id = id;
      const res = await sb.from('professionals').insert(payload);
      error = res.error;
    }

    if (error) {
      showMsg('prof-msg', error.code === '23505'
        ? 'Ese identificador o esa cuenta ya están en uso.'
        : 'No se pudo guardar la ficha.', false);
      return;
    }

    if (userId) {
      await sb.from('profiles').update({ role: 'profesional' }).eq('id', userId);
    }

    let accountUserId = userId;
    let accountNote = '';

    if (accountEmail || accountPassword) {
      if (userId) {
        const res = await invokeFunction({
          action: 'update',
          user_id: userId,
          email: accountEmail || undefined,
          password: accountPassword || undefined
        });
        if (res.error) {
          showMsg('prof-msg', 'Ficha guardada, pero la cuenta no se pudo actualizar: ' + res.error, false);
          await Promise.all([loadProfessionalsList(), refreshCounts()]);
          return;
        }
        accountNote = ' Cuenta actualizada.';
      } else {
        const nameParts = splitName(payload.name);
        const res = await invokeFunction({
          action: 'create',
          email: accountEmail,
          password: accountPassword,
          role: 'profesional',
          professional_id: originalId || id,
          name: nameParts.name,
          lastname: nameParts.lastname
        });
        if (res.error) {
          showMsg('prof-msg', 'Ficha guardada, pero no se pudo crear la cuenta: ' + res.error, false);
          await Promise.all([loadProfessionalsList(), refreshCounts()]);
          return;
        }
        accountUserId = res.data && res.data.user_id;
        accountNote = ' Cuenta creada y vinculada.';
      }
    }

    const previous = originalId ? professionalsById[originalId] : null;
    if (previous && previous.user_id && previous.user_id !== (accountUserId || userId)) {
      await sb.from('profiles').update({ role: 'paciente' }).eq('id', previous.user_id).eq('role', 'profesional');
    }

    showMsg('prof-msg', (originalId ? 'Ficha actualizada.' : 'Ficha creada.') + accountNote, true);
    resetProfForm();
    await Promise.all([loadProfessionalsList(), refreshCounts()]);
  });

  document.getElementById('prof-cancel').addEventListener('click', resetProfForm);

  document.getElementById('prof-suggest').addEventListener('click', function () {
    const email = suggestedEmail(document.getElementById('prof-name').value);
    if (email) document.getElementById('prof-email').value = email;
  });

  document.getElementById('prof-list').addEventListener('click', async function (e) {
    const editBtn = e.target.closest('[data-edit-prof]');
    const toggleBtn = e.target.closest('[data-toggle-prof]');
    const delBtn = e.target.closest('[data-del-prof]');
    const resetBtn = e.target.closest('[data-reset-prof]');

    if (editBtn) {
      const p = professionalsById[editBtn.dataset.editProf];
      if (!p) return;
      document.getElementById('prof-original-id').value = p.id;
      document.getElementById('prof-id').value = p.id;
      document.getElementById('prof-id').disabled = true;
      document.getElementById('prof-name').value = p.name || '';
      document.getElementById('prof-role').value = p.role || '';
      document.getElementById('prof-category').value = p.category || 'psicologia';
      document.getElementById('prof-degree').value = p.degree || '';
      document.getElementById('prof-specialty').value = p.specialty || '';
      document.getElementById('prof-bio').value = p.bio || '';
      document.getElementById('prof-photo').value = p.photo_url || '';
      document.getElementById('prof-order').value = p.display_order || 0;
      document.getElementById('prof-active').checked = !!p.active;
      document.getElementById('prof-user').value = p.user_id || '';
      const linkedProfile = p.user_id ? profileById[p.user_id] : null;
      document.getElementById('prof-email').value = linkedProfile ? (linkedProfile.email || '') : '';
      document.getElementById('prof-password').value = '';
      document.getElementById('prof-form-title').textContent = 'Editar profesional';
      document.getElementById('prof-cancel').classList.remove('hidden');
      document.getElementById('prof-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (toggleBtn) {
      const p = professionalsById[toggleBtn.dataset.toggleProf];
      if (!p) return;
      const { error } = await sb.from('professionals').update({ active: !p.active }).eq('id', p.id);
      if (error) { showMsg('prof-msg', 'No se pudo cambiar la visibilidad.', false); return; }
      showMsg('prof-msg', 'Visibilidad actualizada.', true);
      await Promise.all([loadProfessionalsList(), refreshCounts()]);
    }

    if (resetBtn) {
      const p = professionalsById[resetBtn.dataset.resetProf];
      if (!p) return;
      if (!p.user_id) { showMsg('prof-msg', 'Esta ficha no tiene cuenta de acceso.', false); return; }
      const linked = profileById[p.user_id] || null;
      const email = linked ? linked.email : '';
      const nueva = window.prompt('Nueva contraseña para ' + (email || p.name) + ' (mín. 6 caracteres). Anótala para enviársela al profesional:', '');
      if (nueva === null) return;
      if (nueva.length < 6) { showMsg('prof-msg', 'La contraseña debe tener al menos 6 caracteres.', false); return; }
      const res = await invokeFunction({ action: 'update', user_id: p.user_id, password: nueva });
      if (res.error) { showMsg('prof-msg', 'No se pudo restablecer la contraseña: ' + res.error, false); return; }
      showMsg('prof-msg', 'Contraseña restablecida para ' + (email || p.name) + '.', true);
      return;
    }

    if (delBtn) {
      const p = professionalsById[delBtn.dataset.delProf];
      if (!p) return;
      if (!window.confirm('¿Eliminar la ficha de ' + p.name + '? Esta acción no se puede deshacer.')) return;
      const { error } = await sb.from('professionals').delete().eq('id', p.id);
      if (error) {
        showMsg('prof-msg', 'No se pudo eliminar. Puede tener citas asociadas; considera desactivarla.', false);
        return;
      }
      showMsg('prof-msg', 'Ficha eliminada.', true);
      await Promise.all([loadProfessionalsList(), refreshCounts()]);
    }
  });

  // ========== SERVICIOS ==========
  async function loadServicesTab() {
    loaded.servicios = true;
    await loadServicesList();
  }

  async function loadServicesList() {
    const { data, error } = await sb
      .from('services')
      .select('id,category,name,icon,description,detail,rating,reviews')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    const wrap = document.getElementById('svc-list');
    if (error) {
      wrap.innerHTML = '<p class="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">No se pudieron cargar los servicios.</p>';
      return;
    }

    if (!data || !data.length) {
      wrap.innerHTML = '<p class="rounded-xl border border-black/5 bg-neutral-50 p-6 text-center text-sm text-black/40">Aún no hay servicios.</p>';
      return;
    }

    window._services = data;
    wrap.innerHTML = data.map(function (s) {
      return '<div class="rounded-2xl border border-black/5 bg-neutral-50 p-4 flex items-start justify-between gap-3">' +
        '<div class="min-w-0">' +
          '<p class="text-sm font-semibold">' + escapeHtml(s.name) + '</p>' +
          '<p class="mt-1 text-xs text-black/40">' + escapeHtml(CATEGORY_LABEL[s.category] || s.category) + '</p>' +
          '<p class="mt-1 text-xs text-black/50 line-clamp-2">' + escapeHtml(s.description) + '</p>' +
        '</div>' +
        '<div class="flex flex-col gap-1 shrink-0 text-right">' +
          '<button type="button" data-edit-svc="' + s.id + '" class="text-xs font-semibold text-primary hover:text-primary-dark">Editar</button>' +
          '<button type="button" data-del-svc="' + s.id + '" class="text-xs font-semibold text-red-500 hover:text-red-600">Eliminar</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function resetSvcForm() {
    document.getElementById('svc-form').reset();
    document.getElementById('svc-original-id').value = '';
    document.getElementById('svc-rating').value = '0';
    document.getElementById('svc-reviews').value = '0';
    document.getElementById('svc-form-title').textContent = 'Nuevo servicio';
    document.getElementById('svc-cancel').classList.add('hidden');
  }

  document.getElementById('svc-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const originalId = document.getElementById('svc-original-id').value;
    const payload = {
      category: document.getElementById('svc-category').value,
      name: document.getElementById('svc-name').value.trim(),
      icon: document.getElementById('svc-icon').value.trim() || null,
      description: document.getElementById('svc-description').value.trim(),
      detail: document.getElementById('svc-detail').value.trim() || null,
      rating: Number(document.getElementById('svc-rating').value || 0),
      reviews: Number(document.getElementById('svc-reviews').value || 0)
    };

    if (!payload.name || !payload.description) {
      showMsg('svc-msg', 'Nombre y descripción son obligatorios.', false);
      return;
    }

    let error;
    if (originalId) {
      const res = await sb.from('services').update(payload).eq('id', originalId);
      error = res.error;
    } else {
      const res = await sb.from('services').insert(payload);
      error = res.error;
    }

    if (error) {
      showMsg('svc-msg', error.code === '23505' ? 'Ya existe un servicio con ese nombre en la categoría.' : 'No se pudo guardar el servicio.', false);
      return;
    }

    showMsg('svc-msg', originalId ? 'Servicio actualizado.' : 'Servicio creado.', true);
    resetSvcForm();
    await Promise.all([loadServicesList(), refreshCounts()]);
  });

  document.getElementById('svc-cancel').addEventListener('click', resetSvcForm);

  document.getElementById('svc-list').addEventListener('click', async function (e) {
    const editBtn = e.target.closest('[data-edit-svc]');
    const delBtn = e.target.closest('[data-del-svc]');
    const list = window._services || [];

    if (editBtn) {
      const s = list.find(x => String(x.id) === editBtn.dataset.editSvc);
      if (!s) return;
      document.getElementById('svc-original-id').value = s.id;
      document.getElementById('svc-category').value = s.category;
      document.getElementById('svc-name').value = s.name || '';
      document.getElementById('svc-icon').value = s.icon || '';
      document.getElementById('svc-description').value = s.description || '';
      document.getElementById('svc-detail').value = s.detail || '';
      document.getElementById('svc-rating').value = s.rating || 0;
      document.getElementById('svc-reviews').value = s.reviews || 0;
      document.getElementById('svc-form-title').textContent = 'Editar servicio';
      document.getElementById('svc-cancel').classList.remove('hidden');
      document.getElementById('svc-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (delBtn) {
      if (!window.confirm('¿Eliminar este servicio del catálogo?')) return;
      const { error } = await sb.from('services').delete().eq('id', delBtn.dataset.delSvc);
      if (error) { showMsg('svc-msg', 'No se pudo eliminar el servicio.', false); return; }
      showMsg('svc-msg', 'Servicio eliminado.', true);
      await Promise.all([loadServicesList(), refreshCounts()]);
    }
  });

  // ========== CITAS ==========
  async function loadAppointments() {
    loaded.citas = true;
    const { data, error } = await sb
      .from('appointments')
      .select('id,user_id,professional_id,service_label,modality,date,start_time,end_time,status,notes,created_at')
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) {
      document.getElementById('appt-list').innerHTML = '<p class="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">No se pudieron cargar las citas.</p>';
      return;
    }

    appointments = data || [];
    const ids = [...new Set(appointments.map(a => a.user_id).filter(Boolean))];
    if (ids.length) {
      const { data: profiles } = await sb.from('profiles').select('id,name,lastname,email').in('id', ids);
      (profiles || []).forEach(function (p) { profileById[p.id] = p; });
    }
    if (!Object.keys(professionalsById).length) {
      const { data: profs } = await sb.from('professionals').select('id,name').order('name');
      (profs || []).forEach(function (p) { professionalsById[p.id] = p; });
    }

    renderAppointments();
  }

  function renderAppointments() {
    const status = document.getElementById('appt-status').value;
    const term = document.getElementById('appt-search').value.trim().toLowerCase();

    const list = appointments.filter(function (a) {
      if (status && a.status !== status) return false;
      if (!term) return true;
      const patient = (profileById[a.user_id] || {});
      const prof = (professionalsById[a.professional_id] || {});
      return (fullName(patient) + ' ' + (patient.email || '') + ' ' + (prof.name || '')).toLowerCase().indexOf(term) !== -1;
    });

    const wrap = document.getElementById('appt-list');
    if (!list.length) {
      wrap.innerHTML = '<p class="rounded-xl border border-black/5 bg-neutral-50 p-6 text-center text-sm text-black/40">No hay citas con esos filtros.</p>';
      return;
    }

    wrap.innerHTML = list.map(function (a) {
      const meta = STATUS_META[a.status] || STATUS_META.proxima;
      const patient = profileById[a.user_id] || {};
      const prof = professionalsById[a.professional_id] || {};
      return '<article class="rounded-2xl border border-black/5 bg-neutral-50 p-4 flex flex-col md:flex-row md:items-center gap-4">' +
        '<div class="md:w-40 shrink-0">' +
          '<p class="text-xs font-semibold text-primary uppercase tracking-wider">' + escapeHtml(formatDate(a.date)) + '</p>' +
          '<p class="mt-1 text-sm text-black/70">' + escapeHtml(hhmm(a.start_time)) + ' - ' + escapeHtml(hhmm(a.end_time)) + '</p>' +
          '<span class="mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + meta.cls + '">' + meta.label + '</span>' +
        '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<p class="text-sm font-semibold">' + escapeHtml(fullName(patient) || 'Paciente') + '</p>' +
          '<p class="mt-1 text-xs text-black/50">' + escapeHtml(prof.name || 'Profesional') + ' · ' + escapeHtml(a.service_label || 'Consulta') + ' · ' + (a.modality === 'virtual' ? 'Virtual' : 'Presencial') + '</p>' +
          (a.notes ? '<p class="mt-1 text-xs text-black/40">' + escapeHtml(a.notes) + '</p>' : '') +
        '</div>' +
        '<div class="flex items-center gap-2 shrink-0">' +
          '<select data-appt-status="' + a.id + '" class="rounded-xl border border-black/10 bg-white px-2 py-1.5 text-xs">' +
            Object.keys(STATUS_META).map(function (key) {
              return '<option value="' + key + '"' + (a.status === key ? ' selected' : '') + '>' + STATUS_META[key].label + '</option>';
            }).join('') +
          '</select>' +
          '<button type="button" data-del-appt="' + a.id + '" class="text-xs font-semibold text-red-500 hover:text-red-600">Eliminar</button>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  document.getElementById('appt-status').addEventListener('change', renderAppointments);
  document.getElementById('appt-search').addEventListener('input', renderAppointments);

  document.getElementById('appt-list').addEventListener('change', async function (e) {
    const select = e.target.closest('[data-appt-status]');
    if (!select) return;
    const { error } = await sb.from('appointments').update({ status: select.value }).eq('id', select.dataset.apptStatus);
    if (error) { showMsg('appt-msg', 'No se pudo cambiar el estado.', false); return; }
    const appt = appointments.find(a => String(a.id) === select.dataset.apptStatus);
    if (appt) appt.status = select.value;
    showMsg('appt-msg', 'Estado actualizado.', true);
    renderAppointments();
    refreshCounts();
  });

  document.getElementById('appt-list').addEventListener('click', async function (e) {
    const delBtn = e.target.closest('[data-del-appt]');
    if (!delBtn) return;
    if (!window.confirm('¿Eliminar esta cita?')) return;
    const { error } = await sb.from('appointments').delete().eq('id', delBtn.dataset.delAppt);
    if (error) { showMsg('appt-msg', 'No se pudo eliminar la cita.', false); return; }
    appointments = appointments.filter(a => String(a.id) !== delBtn.dataset.delAppt);
    showMsg('appt-msg', 'Cita eliminada.', true);
    renderAppointments();
    refreshCounts();
  });

  // ========== USUARIOS ==========
  async function loadUsersTab() {
    loaded.usuarios = true;
    if (!professionals.length) {
      const { data: profs } = await sb.from('professionals').select('id,name,user_id');
      professionals = profs || [];
    }
    const { data, error } = await sb
      .from('profiles')
      .select('id,name,lastname,email,phone,role,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      document.getElementById('user-list').innerHTML = '<p class="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">No se pudieron cargar los usuarios.</p>';
      return;
    }
    users = data || [];
    users.forEach(function (u) { profileById[u.id] = u; });
    fillProfessionalOptions();
    renderUsers();
  }

  function fillProfessionalOptions() {
    const select = document.getElementById('ur-professional');
    if (!select) return;
    const free = (professionals || []).filter(p => !p.user_id);
    select.innerHTML = '<option value="">Vincular a ficha profesional (opcional)</option>' +
      free.map(p => '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.name) + '</option>').join('');
  }

  function fichaForUser(userId) {
    return (professionals || []).find(p => p.user_id === userId);
  }

  function renderUsers() {
    const term = document.getElementById('user-search').value.trim().toLowerCase();
    const list = users.filter(function (u) {
      if (!term) return true;
      return (fullName(u) + ' ' + (u.email || '')).toLowerCase().indexOf(term) !== -1;
    });

    const wrap = document.getElementById('user-list');
    if (!list.length) {
      wrap.innerHTML = '<p class="rounded-xl border border-black/5 bg-neutral-50 p-6 text-center text-sm text-black/40">Sin resultados.</p>';
      return;
    }

    wrap.innerHTML = list.map(function (u) {
      const ficha = fichaForUser(u.id);
      const isSelf = currentUser && u.id === currentUser.id;
      return '<div class="rounded-2xl border border-black/5 bg-neutral-50 p-4 flex flex-col md:flex-row md:items-center gap-3">' +
        '<div class="flex-1 min-w-0">' +
          '<p class="text-sm font-semibold truncate">' + escapeHtml(fullName(u) || 'Usuario') + (isSelf ? ' <span class="text-[10px] font-medium text-primary">(tú)</span>' : '') + '</p>' +
          '<p class="mt-0.5 text-xs text-black/50 truncate">' + escapeHtml(u.email) + (u.phone ? ' · ' + escapeHtml(u.phone) : '') + '</p>' +
          '<p class="mt-1 text-xs text-black/40">' + (ficha ? 'Ficha: ' + escapeHtml(ficha.name) : 'Sin ficha vinculada') + '</p>' +
        '</div>' +
        '<select data-user-role="' + escapeHtml(u.id) + '"' + (isSelf ? ' disabled' : '') + ' class="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs disabled:opacity-50">' +
          Object.keys(ROLE_LABEL).map(function (role) {
            return '<option value="' + role + '"' + (u.role === role ? ' selected' : '') + '>' + ROLE_LABEL[role] + '</option>';
          }).join('') +
        '</select>' +
      '</div>';
    }).join('');
  }

  document.getElementById('user-search').addEventListener('input', renderUsers);

  document.getElementById('user-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    const payload = {
      name: document.getElementById('ur-name').value.trim(),
      lastname: document.getElementById('ur-lastname').value.trim(),
      email: document.getElementById('ur-email').value.trim(),
      phone: document.getElementById('ur-phone').value.trim(),
      password: document.getElementById('ur-password').value,
      role: document.getElementById('ur-role').value,
      professional_id: document.getElementById('ur-professional').value || null
    };

    const res = await invokeFunction(payload);
    btn.disabled = false;

    if (res.error) {
      showMsg('user-msg', res.error, false);
      return;
    }

    const created = payload.email;
    e.target.reset();
    showMsg('user-msg', 'Usuario creado: ' + created + '. Comparte la contraseña temporal; podrá cambiarla luego.', true);
    await loadUsersTab();
  });

  document.getElementById('user-list').addEventListener('change', async function (e) {
    const select = e.target.closest('[data-user-role]');
    if (!select) return;
    const id = select.dataset.userRole;
    const { error } = await sb.from('profiles').update({ role: select.value }).eq('id', id);
    if (error) {
      showMsg('user-msg', 'No se pudo cambiar el rol.', false);
      return;
    }
    const u = users.find(x => x.id === id);
    if (u) u.role = select.value;
    showMsg('user-msg', 'Rol actualizado. Recuerda vincular su ficha si es profesional.', true);
    refreshCounts();
  });

  // ========== MENSAJES ==========
  async function loadMessages() {
    loaded.mensajes = true;
    const { data, error } = await sb
      .from('contact_messages')
      .select('id,name,email,phone,service,message,status,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      document.getElementById('messages-list').innerHTML = '<p class="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">No se pudieron cargar los mensajes. Verifica que la migración 004 esté aplicada.</p>';
      return;
    }
    messages = data || [];
    renderMessages();
  }

  function renderMessages() {
    const status = document.getElementById('msg-status').value;
    const list = messages.filter(m => !status || m.status === status);
    const wrap = document.getElementById('messages-list');

    if (!list.length) {
      wrap.innerHTML = '<p class="rounded-xl border border-black/5 bg-neutral-50 p-6 text-center text-sm text-black/40">No hay mensajes.</p>';
      return;
    }

    wrap.innerHTML = list.map(function (m) {
      return '<article class="rounded-2xl border border-black/5 bg-neutral-50 p-4 flex flex-col md:flex-row md:items-start gap-4">' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            '<p class="text-sm font-semibold">' + escapeHtml(m.name) + '</p>' +
            '<span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold ' + (m.status === 'nuevo' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-neutral-100 border-black/10 text-black/40') + '">' + (MESSAGE_STATUS[m.status] || m.status) + '</span>' +
          '</div>' +
          '<p class="mt-1 text-xs text-black/50">' +
            '<a href="mailto:' + escapeHtml(m.email) + '" class="hover:text-primary">' + escapeHtml(m.email) + '</a>' +
            (m.phone ? ' · <a href="tel:' + escapeHtml(m.phone) + '" class="hover:text-primary">' + escapeHtml(m.phone) + '</a>' : '') +
            (m.service ? ' · ' + escapeHtml(m.service) : '') +
          '</p>' +
          '<p class="mt-2 text-xs text-black/60 whitespace-pre-line">' + escapeHtml(m.message) + '</p>' +
          '<p class="mt-2 text-[10px] text-black/30">' + escapeHtml(formatDate(m.created_at)) + '</p>' +
        '</div>' +
        '<div class="flex items-center gap-2 shrink-0">' +
          '<select data-msg-status="' + m.id + '" class="rounded-xl border border-black/10 bg-white px-2 py-1.5 text-xs">' +
            Object.keys(MESSAGE_STATUS).map(function (key) {
              return '<option value="' + key + '"' + (m.status === key ? ' selected' : '') + '>' + MESSAGE_STATUS[key] + '</option>';
            }).join('') +
          '</select>' +
          '<button type="button" data-del-msg="' + m.id + '" class="text-xs font-semibold text-red-500 hover:text-red-600">Eliminar</button>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  document.getElementById('msg-status').addEventListener('change', renderMessages);

  document.getElementById('messages-list').addEventListener('change', async function (e) {
    const select = e.target.closest('[data-msg-status]');
    if (!select) return;
    const { error } = await sb.from('contact_messages').update({ status: select.value }).eq('id', select.dataset.msgStatus);
    if (error) { showMsg('messages-msg', 'No se pudo actualizar el mensaje.', false); return; }
    const m = messages.find(x => String(x.id) === select.dataset.msgStatus);
    if (m) m.status = select.value;
    showMsg('messages-msg', 'Mensaje actualizado.', true);
    renderMessages();
  });

  document.getElementById('messages-list').addEventListener('click', async function (e) {
    const delBtn = e.target.closest('[data-del-msg]');
    if (!delBtn) return;
    if (!window.confirm('¿Eliminar este mensaje?')) return;
    const { error } = await sb.from('contact_messages').delete().eq('id', delBtn.dataset.delMsg);
    if (error) { showMsg('messages-msg', 'No se pudo eliminar el mensaje.', false); return; }
    messages = messages.filter(m => String(m.id) !== delBtn.dataset.delMsg);
    showMsg('messages-msg', 'Mensaje eliminado.', true);
    renderMessages();
  });

  // ========== COMENTARIOS ==========
  async function loadComments() {
    loaded.comentarios = true;
    const { data, error } = await sb
      .from('comments')
      .select('id,professional_id,author_name,stars,body,created_at')
      .order('created_at', { ascending: false });

    const wrap = document.getElementById('comments-list');
    if (error) {
      wrap.innerHTML = '<p class="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">No se pudieron cargar los comentarios.</p>';
      return;
    }

    if (!Object.keys(professionalsById).length) {
      const { data: profs } = await sb.from('professionals').select('id,name');
      (profs || []).forEach(function (p) { professionalsById[p.id] = p; });
    }

    if (!data || !data.length) {
      wrap.innerHTML = '<p class="rounded-xl border border-black/5 bg-neutral-50 p-6 text-center text-sm text-black/40">No hay comentarios.</p>';
      return;
    }

    window._comments = data;
    wrap.innerHTML = data.map(function (c) {
      const prof = professionalsById[c.professional_id] || {};
      return '<div class="rounded-2xl border border-black/5 bg-neutral-50 p-4 flex items-start justify-between gap-3">' +
        '<div class="min-w-0">' +
          '<p class="text-sm font-semibold">' + escapeHtml(c.author_name) + ' <span class="text-amber-500">' + '★'.repeat(Number(c.stars) || 0) + '</span></p>' +
          '<p class="mt-0.5 text-xs text-black/40">Sobre ' + escapeHtml(prof.name || c.professional_id) + ' · ' + escapeHtml(formatDate(c.created_at)) + '</p>' +
          '<p class="mt-2 text-xs text-black/60">' + escapeHtml(c.body) + '</p>' +
        '</div>' +
        '<button type="button" data-del-comment="' + c.id + '" class="shrink-0 text-xs font-semibold text-red-500 hover:text-red-600">Eliminar</button>' +
      '</div>';
    }).join('');
  }

  document.getElementById('comments-list').addEventListener('click', async function (e) {
    const delBtn = e.target.closest('[data-del-comment]');
    if (!delBtn) return;
    if (!window.confirm('¿Eliminar este comentario?')) return;
    const { error } = await sb.from('comments').delete().eq('id', delBtn.dataset.delComment);
    if (error) { showMsg('comments-msg', 'No se pudo eliminar el comentario.', false); return; }
    showMsg('comments-msg', 'Comentario eliminado.', true);
    await loadComments();
  });

  // ========== INIT ==========
  window.logout = async function () {
    if (window.sb) await sb.auth.signOut();
    window.location.href = 'index.html';
  };

  (async function init() {
    const ctx = await requireSession(['admin']);
    if (!ctx) return;

    currentUser = ctx.session.user;
    currentProfile = ctx.profile || {};
    const name = fullName(currentProfile) || currentUser.email || 'Administrador';
    document.getElementById('admin-name').textContent = name;
    document.getElementById('admin-avatar').textContent = initials(name);

    document.getElementById('admin-loading').classList.add('hidden');
    document.getElementById('admin-content').classList.remove('hidden');
    setTab('resumen');

    await refreshCounts();

    const channel = realtimeAppointments(null, rtDebounce(function () {
      refreshCounts();
      if (loaded.citas) loadAppointments();
    }, 500));
    window.addEventListener('beforeunload', function () { rtLeave(channel); });
  })();
})();
