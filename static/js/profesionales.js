// ============================================
// EXCELENTEMENTE - Listado de profesionales
// ============================================

(function () {
  const CAT_STYLE = {
    psiquiatria: { avatar: 'bg-primary/10 text-primary', dot: 'bg-primary' },
    psicologia:  { avatar: 'bg-accent/10 text-accent',   dot: 'bg-accent' },
    nutricion:   { avatar: 'bg-green-100 text-green-600',dot: 'bg-green-600' },
    fisioterapia:{ avatar: 'bg-pink-100 text-pink-600',  dot: 'bg-pink-600' }
  };

  const GRIDS = {
    'grid-psiquiatria': ['psiquiatria'],
    'grid-psicologia': ['psicologia'],
    'grid-nutricion': ['nutricion', 'fisioterapia']
  };

  function initials(name) {
    return String(name || '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function cardHtml(p) {
    const style = CAT_STYLE[p.category] || CAT_STYLE.psicologia;
    const avatar = p.photo_url
      ? `<img src="${escapeHtml(p.photo_url)}" alt="${escapeHtml(p.name)}" loading="lazy" class="size-full object-cover" />`
      : escapeHtml(initials(p.name));
    return `
      <div class="rounded-2xl border border-black/5 bg-white p-5 text-center card-hover flex flex-col">
        <div class="size-20 rounded-full ${style.avatar} mx-auto mb-3 flex items-center justify-center font-bold text-xl overflow-hidden">${avatar}</div>
        <h3 class="font-semibold text-sm leading-snug">${escapeHtml(p.name)}</h3>
        <p class="text-[10px] uppercase tracking-wider text-black/30 font-medium mt-1"><span class="inline-block size-1.5 rounded-full ${style.dot} mr-1 align-middle"></span>${escapeHtml(p.role)}</p>
        <p class="text-xs text-black/50 mt-1 leading-relaxed flex-1">${escapeHtml(p.specialty)}</p>
        <div class="mt-4 flex flex-col gap-2">
          <a href="perfil-profesional.html?id=${encodeURIComponent(p.id)}" class="rounded-xl border border-primary/30 bg-white px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/5 transition-all">Ver perfil</a>
          <a href="perfil-profesional.html?id=${encodeURIComponent(p.id)}&reservar=1" class="rounded-xl bg-gradient-to-r from-primary to-primary-light px-4 py-2 text-xs font-semibold text-white shadow-md shadow-primary/15 hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all">Reservar una cita</a>
        </div>
      </div>
    `;
  }

  function showMessage(grid, text) {
    grid.innerHTML = '<p class="col-span-full text-sm text-black/40 bg-white rounded-2xl border border-black/5 p-6 text-center">' + escapeHtml(text) + '</p>';
  }

  let allProfessionals = [];
  let activeFilter = 'todos';

  function renderList() {
    const input = document.getElementById('search-prof');
    const term = (input ? input.value : '').trim().toLowerCase();
    let total = 0;

    Object.keys(GRIDS).forEach(function (gridId) {
      const grid = document.getElementById(gridId);
      if (!grid) return;

      const categories = activeFilter === 'todos'
        ? GRIDS[gridId]
        : GRIDS[gridId].filter(c => c === activeFilter);

      const items = categories.length ? allProfessionals.filter(function (p) {
        if (categories.indexOf(p.category) === -1) return false;
        if (!term) return true;
        return (p.name + ' ' + p.role + ' ' + p.specialty).toLowerCase().indexOf(term) !== -1;
      }) : [];

      total += items.length;
      grid.innerHTML = items.map(cardHtml).join('');

      const block = grid.closest('[data-cat-block]');
      if (block) block.classList.toggle('hidden', items.length === 0);
    });

    const empty = document.getElementById('prof-empty');
    if (empty) empty.classList.toggle('hidden', total > 0);
  }

  document.querySelectorAll('.prof-filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeFilter = btn.dataset.filter;
      document.querySelectorAll('.prof-filter').forEach(function (b) {
        const active = b.dataset.filter === activeFilter;
        b.classList.toggle('border-primary', active);
        b.classList.toggle('bg-primary', active);
        b.classList.toggle('text-white', active);
        b.classList.toggle('border-black/10', !active);
        b.classList.toggle('text-black/50', !active);
      });
      renderList();
    });
  });

  const searchInput = document.getElementById('search-prof');
  if (searchInput) searchInput.addEventListener('input', renderList);

  (async function init() {
    const grids = Object.keys(GRIDS).map(id => document.getElementById(id)).filter(Boolean);
    if (grids.length === 0) return;

    if (!window.sb) {
      grids.forEach(grid => showMessage(grid, 'No se pudo conectar con el servidor. Intenta de nuevo más tarde.'));
      return;
    }

    const { data, error } = await sb
      .from('professionals')
      .select('id,name,role,category,specialty,photo_url')
      .eq('active', true)
      .order('name');

    if (error) {
      grids.forEach(grid => showMessage(grid, 'No se pudo cargar el equipo profesional. Intenta de nuevo más tarde.'));
      return;
    }

    allProfessionals = data || [];
    renderList();
  })();
})();
