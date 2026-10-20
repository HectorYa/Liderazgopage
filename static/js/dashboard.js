// ========== ESTADO ==========
let currentUser = null;
let currentSection = 'historial';

// ========== INIT ==========
(async function init() {
  const ctx = await requireSession(['paciente']);
  if (!ctx) return;

  const user = ctx.session.user;
  const meta = user.user_metadata || {};
  const profile = ctx.profile;

  currentUser = {
    id: user.id,
    name: (profile && profile.name) || meta.name || (user.email || '').split('@')[0],
    lastname: (profile && profile.lastname) || meta.lastname || '',
    email: (profile && profile.email) || user.email || '',
    phone: (profile && profile.phone) || meta.phone || ''
  };

  // Header
  document.getElementById('user-avatar').textContent = (currentUser.name.charAt(0) + currentUser.lastname.charAt(0)).toUpperCase();
  document.getElementById('user-name-header').textContent = (currentUser.name + ' ' + currentUser.lastname).trim();

  const params = new URLSearchParams(window.location.search);
  if (params.get('pago') === 'exitoso') {
    const banner = document.getElementById('payment-banner');
    if (banner) {
      banner.classList.remove('hidden');
      setTimeout(function () { banner.classList.add('hidden'); }, 9000);
    }
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, '', 'dashboard.html');
    }
  }

  // Perfil
  document.getElementById('prof-name').value = currentUser.name;
  document.getElementById('prof-lastname').value = currentUser.lastname;
  document.getElementById('prof-email').value = currentUser.email;
  document.getElementById('prof-phone').value = currentUser.phone || '';

  await Promise.all([renderHistorial(), renderServices(), renderProfessionals()]);

  const channel = realtimeAppointments('user_id=eq.' + currentUser.id, rtDebounce(renderHistorial, 400));
  window.addEventListener('beforeunload', function () { rtLeave(channel); });

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

async function logout() {
  if (window.sb) await sb.auth.signOut();
  window.location.href = 'index.html';
}

// ========== HISTORIAL ==========
async function renderHistorial() {
  const proxEl = document.getElementById('proximas-citas');
  const pasEl = document.getElementById('pasadas-citas');

  const { data, error } = await sb
    .from('appointments')
    .select('id,date,start_time,end_time,status,modality,service_label,professional_id, professionals(name)')
    .order('date', { ascending: true });

  if (error) {
    proxEl.innerHTML = '<p class="text-sm text-black/40 bg-white rounded-2xl border border-black/5 p-6 text-center">No se pudieron cargar tus citas.</p>';
    pasEl.innerHTML = '';
    document.getElementById('no-proximas').classList.add('hidden');
    document.getElementById('no-pasadas').classList.add('hidden');
    return;
  }

  const today = toISODate(new Date());
  const upcomingStatuses = ['pendiente', 'proxima', 'confirmada'];
  const isUpcoming = a => upcomingStatuses.indexOf(a.status) !== -1 && a.date >= today;
  const appointments = data || [];
  const proximas = appointments.filter(isUpcoming);
  const pasadas = appointments.filter(a => !isUpcoming(a));

  const upcomingLabel = { pendiente: 'Por confirmar', proxima: 'Próxima', confirmada: 'Confirmada' };
  const pastLabel = { cancelada: 'Cancelada', atendida: 'Atendida', no_asistio: 'No asistió', pasada: 'Pasada' };
  const meetUrl = (window.SITE_CONFIG && window.SITE_CONFIG.meetingUrl) || '';

  if (proximas.length === 0) {
    proxEl.innerHTML = '';
    document.getElementById('no-proximas').classList.remove('hidden');
  } else {
    document.getElementById('no-proximas').classList.add('hidden');
    proxEl.innerHTML = proximas.map(a => `
      <div class="flex items-center gap-4 bg-white rounded-2xl border border-primary/10 p-4 card-hover">
        <div class="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg shrink-0">📅</div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm">${escapeHtml(a.service_label || 'Consulta')}</p>
          <p class="text-xs text-black/50">${escapeHtml(a.professionals && a.professionals.name ? a.professionals.name : 'Profesional')} · ${a.modality === 'virtual' ? 'Virtual' : 'Presencial'}</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-sm font-medium">${formatDate(a.date)}</p>
          <p class="text-xs text-black/40">${formatTime(a.start_time)} - ${formatTime(a.end_time)}</p>
          ${a.modality === 'virtual'
            ? (meetUrl
                ? `<a href="${escapeHtml(meetUrl)}" target="_blank" rel="noopener" class="mt-1 inline-block text-[10px] font-semibold text-primary hover:text-primary-dark">Unirse a la reunión</a>`
                : `<p class="mt-1 text-[10px] text-black/40">Enlace pendiente</p>`)
            : ''}
          <button type="button" onclick="cancelAppointment(${Number(a.id)})" class="mt-1 block w-full text-[10px] font-semibold text-red-500 hover:text-red-600">Cancelar</button>
        </div>
        <span class="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase">${upcomingLabel[a.status] || 'Próxima'}</span>
      </div>
    `).join('');
  }

  if (pasadas.length === 0) {
    pasEl.innerHTML = '';
    document.getElementById('no-pasadas').classList.remove('hidden');
  } else {
    document.getElementById('no-pasadas').classList.add('hidden');
    pasEl.innerHTML = pasadas.map(a => {
      const missed = a.status === 'cancelada' || a.status === 'no_asistio';
      return `
      <div class="flex items-center gap-4 bg-white rounded-2xl border border-black/5 p-4 opacity-70">
        <div class="size-12 rounded-xl bg-black/5 text-black/30 flex items-center justify-center text-lg shrink-0">${missed ? '✕' : '✓'}</div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm">${escapeHtml(a.service_label || 'Consulta')}</p>
          <p class="text-xs text-black/50">${escapeHtml(a.professionals && a.professionals.name ? a.professionals.name : 'Profesional')} · ${a.modality === 'virtual' ? 'Virtual' : 'Presencial'}</p>
        </div>
        <div class="text-right shrink-0">
          <p class="text-sm">${formatDate(a.date)}</p>
          <p class="text-xs text-black/40">${formatTime(a.start_time)} - ${formatTime(a.end_time)}</p>
        </div>
        <span class="px-3 py-1 rounded-full bg-black/5 text-black/40 text-[10px] font-semibold uppercase">${pastLabel[a.status] || 'Pasada'}</span>
      </div>
    `;
    }).join('');
  }
}

async function cancelAppointment(id) {
  if (!window.sb) return;
  if (!confirm('¿Cancelar esta cita?')) return;

  const { error } = await sb.from('appointments').update({ status: 'cancelada' }).eq('id', id);
  if (error) {
    alert('No se pudo cancelar la cita. Intenta de nuevo.');
    return;
  }
  await renderHistorial();
}

function toISODate(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}

function formatTime(value) {
  return String(value || '').slice(0, 5);
}

function formatDate(dateStr) {
  const d = new Date(String(dateStr) + 'T00:00:00');
  return d.toLocaleDateString('es-PE', { day:'numeric', month:'short', year:'numeric' });
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}

// ========== SERVICIOS ==========
async function renderServices(filter) {
  const grid = document.getElementById('services-grid');
  grid.innerHTML = '<p class="col-span-full text-sm text-black/40 bg-white rounded-2xl border border-black/5 p-6 text-center">Cargando servicios...</p>';

  const { data, error } = await sb
    .from('services')
    .select('id,category,name,icon,description,detail,rating,reviews')
    .order('category')
    .order('name');

  if (error) {
    grid.innerHTML = '<p class="col-span-full text-sm text-black/40 bg-white rounded-2xl border border-black/5 p-6 text-center">No se pudieron cargar los servicios.</p>';
    return;
  }

  const services = (data || []).filter(s => !filter || filter === 'all' || s.category === filter);

  if (services.length === 0) {
    grid.innerHTML = '<p class="col-span-full text-sm text-black/40 bg-white rounded-2xl border border-black/5 p-6 text-center">No hay servicios en esta categoría.</p>';
    return;
  }

  grid.innerHTML = services.map(s => `
    <div class="bg-white rounded-2xl border border-black/5 overflow-hidden card-hover" data-cat="${escapeHtml(s.category)}">
      <div class="p-6">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${escapeHtml(s.icon || '•')}</span>
            <div>
              <h3 class="font-semibold">${escapeHtml(s.name)}</h3>
              <span class="text-[10px] uppercase tracking-wider text-black/30 font-medium">${escapeHtml(getCatLabel(s.category))}</span>
            </div>
          </div>
          <div class="text-right">
            <div class="flex items-center gap-1">${renderStars(Number(s.rating))}</div>
            <p class="text-[10px] text-black/40">${Number(s.rating).toFixed(1)} · ${Number(s.reviews)} reseñas</p>
          </div>
        </div>
        <p class="text-sm text-black/60 leading-relaxed mb-3">${escapeHtml(s.description)}</p>
        ${s.detail ? '<p class="text-xs text-black/40 leading-relaxed mb-4">' + escapeHtml(s.detail) + '</p>' : ''}
        <a href="agendar.html" class="block w-full text-center rounded-xl bg-gradient-to-r from-primary to-primary-light px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
          Agendar este servicio →
        </a>
      </div>
    </div>
  `).join('');
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
  const filled = Math.round(rating);
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= filled
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#e8a838" stroke="#e8a838"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  }
  return html;
}

// ========== PROFESIONALES ==========
async function renderProfessionals() {
  const grid = document.getElementById('profs-grid');
  grid.innerHTML = '<p class="col-span-full text-sm text-black/40 bg-white rounded-2xl border border-black/5 p-6 text-center">Cargando profesionales...</p>';

  const { data, error } = await sb
    .from('professionals')
    .select('id,name,role,category,specialty,bio')
    .eq('active', true)
    .order('name');

  if (error) {
    grid.innerHTML = '<p class="col-span-full text-sm text-black/40 bg-white rounded-2xl border border-black/5 p-6 text-center">No se pudieron cargar los profesionales.</p>';
    return;
  }

  const professionals = data || [];
  if (professionals.length === 0) {
    grid.innerHTML = '<p class="col-span-full text-sm text-black/40 bg-white rounded-2xl border border-black/5 p-6 text-center">Aún no hay profesionales publicados.</p>';
    return;
  }

  grid.innerHTML = professionals.map(p => `
    <div class="bg-white rounded-2xl border border-black/5 overflow-hidden card-hover">
      <div class="p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0">
            ${escapeHtml(String(p.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase())}
          </div>
          <div>
            <h3 class="font-semibold">${escapeHtml(p.name)}</h3>
            <p class="text-xs text-primary font-medium">${escapeHtml(p.role)}</p>
            <span class="text-[10px] uppercase tracking-wider text-black/30 font-medium">${escapeHtml(getCatLabel(p.category))}</span>
          </div>
        </div>
        <p class="text-xs text-black/50 leading-relaxed mb-2">${escapeHtml(p.specialty)}</p>
        <p class="text-xs text-black/40 leading-relaxed mb-4">${escapeHtml(p.bio)}</p>
        <div class="flex gap-2">
          <a href="perfil-profesional.html?id=${encodeURIComponent(p.id)}" class="flex-1 text-center rounded-xl border border-primary/30 bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-all">Ver perfil</a>
          <a href="perfil-profesional.html?id=${encodeURIComponent(p.id)}&reservar=1" class="flex-1 text-center rounded-xl bg-gradient-to-r from-primary to-primary-light px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">Reservar</a>
        </div>
      </div>
    </div>
  `).join('');
}

// ========== PERFIL ==========
async function saveProfile(e) {
  e.preventDefault();
  const msgEl = document.getElementById('profile-msg');
  const name = document.getElementById('prof-name').value.trim();
  const lastname = document.getElementById('prof-lastname').value.trim();
  const email = document.getElementById('prof-email').value.trim();
  const phone = document.getElementById('prof-phone').value.trim();
  const newpass = document.getElementById('prof-newpass').value;

  function showMsg(text, ok) {
    msgEl.textContent = text;
    msgEl.className = 'text-sm text-center p-3 rounded-xl ' + (ok
      ? 'bg-green-50 border border-green-200 text-green-600'
      : 'bg-red-50 border border-red-200 text-red-600');
    msgEl.classList.remove('hidden');
    if (ok) setTimeout(() => msgEl.classList.add('hidden'), 4000);
  }

  if (!name || !lastname || !email) {
    showMsg('Nombre, apellido y correo son obligatorios.', false);
    return;
  }

  if (!window.sb) {
    showMsg('No se pudo conectar con el servidor. Intenta de nuevo.', false);
    return;
  }

  const emailChanged = email !== currentUser.email;

  if (emailChanged) {
    const { error: emailError } = await sb.auth.updateUser({ email });
    if (emailError) {
      showMsg('No se pudo cambiar el correo. Intenta de nuevo.', false);
      return;
    }
  }

  const { error: profileError } = await sb
    .from('profiles')
    .update({ name, lastname, email, phone: phone || null })
    .eq('id', currentUser.id);

  if (profileError) {
    showMsg('No se pudo guardar el perfil. Intenta de nuevo.', false);
    return;
  }

  if (newpass) {
    const { error: passError } = await sb.auth.updateUser({ password: newpass });
    if (passError) {
      showMsg('La contraseña debe tener al menos 6 caracteres.', false);
      return;
    }
  }

  currentUser.name = name;
  currentUser.lastname = lastname;
  currentUser.phone = phone;
  if (emailChanged) currentUser.email = email;

  // Actualizar header
  document.getElementById('user-avatar').textContent = (name.charAt(0) + lastname.charAt(0)).toUpperCase();
  document.getElementById('user-name-header').textContent = name + ' ' + lastname;

  document.getElementById('prof-newpass').value = '';

  showMsg(emailChanged
    ? 'Perfil actualizado. Revisa tu correo para confirmar el nuevo email.'
    : '¡Perfil actualizado correctamente!', true);
}
