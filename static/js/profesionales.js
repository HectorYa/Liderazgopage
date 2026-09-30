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

  function initials(name) {
    return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function cardHtml(p) {
    const style = CAT_STYLE[p.category] || CAT_STYLE.psicologia;
    return `
      <div class="rounded-2xl border border-black/5 bg-white p-5 text-center card-hover flex flex-col">
        <div class="size-20 rounded-full ${style.avatar} mx-auto mb-3 flex items-center justify-center font-bold text-xl">${initials(p.name)}</div>
        <h3 class="font-semibold text-sm leading-snug">${p.name}</h3>
        <p class="text-[10px] uppercase tracking-wider text-black/30 font-medium mt-1"><span class="inline-block size-1.5 rounded-full ${style.dot} mr-1 align-middle"></span>${p.role}</p>
        <p class="text-xs text-black/50 mt-1 leading-relaxed flex-1">${p.specialty}</p>
        <div class="mt-4 flex flex-col gap-2">
          <a href="perfil-profesional.html?id=${p.id}" class="rounded-xl border border-primary/30 bg-white px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/5 transition-all">Ver perfil</a>
          <a href="perfil-profesional.html?id=${p.id}&reservar=1" class="rounded-xl bg-gradient-to-r from-primary to-primary-light px-4 py-2 text-xs font-semibold text-white shadow-md shadow-primary/15 hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all">Reservar una cita</a>
        </div>
      </div>
    `;
  }

  const grids = {
    'grid-psiquiatria': ['psiquiatria'],
    'grid-psicologia': ['psicologia'],
    'grid-nutricion': ['nutricion', 'fisioterapia']
  };
  Object.keys(grids).forEach(gridId => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const items = PROFESIONALES_PUBLICOS.filter(p => grids[gridId].includes(p.category));
    grid.innerHTML = items.map(cardHtml).join('');
  });
})();