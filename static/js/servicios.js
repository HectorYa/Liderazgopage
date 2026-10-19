// ============================================
// EXCELENTEMENTE - Servicios (dinámico desde Supabase)
// ============================================

(function () {
  const CATEGORIES = [
    {
      id: 'psiquiatria',
      title: 'Psiquiatría',
      desc: 'Terapias psiquiátricas de niños, adolescentes y adultos, familiares y de pareja.',
      gradient: null,
      icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'
    },
    {
      id: 'psicologia',
      title: 'Psicología',
      desc: 'Consultas psicológicas para niños, adolescentes y adultos.',
      gradient: 'linear-gradient(135deg,#2aa394,#1a7a6d)',
      icon: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'
    },
    {
      id: 'terapias',
      title: 'Terapias Grupales',
      desc: 'Contamos con programas especializados en grupo.',
      gradient: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
      icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
    },
    {
      id: 'nutricion',
      title: 'Nutrición',
      desc: 'Tu aliado en bienestar. Servicios nutricionales integrales.',
      gradient: 'linear-gradient(135deg,#34d399,#059669)',
      icon: '<path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/><path d="M12 6v6l4 2"/>'
    },
    {
      id: 'fisioterapia',
      title: 'Terapia Física',
      desc: 'Rehabilitación física integral y cuidado postural.',
      gradient: 'linear-gradient(135deg,#f472b6,#ec4899)',
      icon: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'
    },
    {
      id: 'cursos',
      title: 'Cursos y Talleres',
      desc: 'Desarrolla tu potencial con nuestras actividades formativas.',
      gradient: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
      icon: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'
    }
  ];

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function stars(rating) {
    const filled = Math.round(Number(rating) || 0);
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += '<span class="' + (i <= filled ? 'text-amber-400' : 'text-neutral-300') + '">★</span>';
    }
    return html;
  }

  function cardHtml(s) {
    const rating = Number(s.rating) || 0;
    const reviews = Number(s.reviews) || 0;
    const ratingHtml = reviews > 0
      ? '<div class="mt-3 flex items-center gap-1 text-sm">' + stars(rating) + '<span class="ml-1 text-xs text-black/40">' + rating.toFixed(1) + ' (' + reviews + ')</span></div>'
      : '';
    return '<div class="rounded-2xl border border-black/5 bg-white p-6 card-hover">' +
      (s.icon ? '<div class="text-2xl mb-2">' + escapeHtml(s.icon) + '</div>' : '') +
      '<h3 class="font-semibold text-lg mb-2">' + escapeHtml(s.name) + '</h3>' +
      '<p class="text-sm text-black/60 leading-relaxed">' + escapeHtml(s.description) + '</p>' +
      ratingHtml +
      '<a href="contacto.html?servicio=' + encodeURIComponent(s.name) + '" class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors">Quiero saber más →</a>' +
    '</div>';
  }

  function sectionHtml(cat, items) {
    const style = cat.gradient ? ' style="background:' + cat.gradient + '"' : '';
    return '<div id="' + cat.id + '" class="scroll-mt-24 mb-20">' +
      '<div class="flex items-center gap-4 mb-8">' +
        '<div class="service-icon"' + style + '><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + cat.icon + '</svg></div>' +
        '<div>' +
          '<h2 class="font-serif text-3xl font-bold">' + escapeHtml(cat.title) + '</h2>' +
          '<p class="text-sm text-black/50">' + escapeHtml(cat.desc) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">' + items.map(cardHtml).join('') + '</div>' +
    '</div>';
  }

  (async function init() {
    const container = document.getElementById('servicios-container');
    if (!container) return;

    if (!window.sb) {
      container.innerHTML = '<p class="text-center text-sm text-black/40 py-16">No se pudo conectar con el servidor. Intenta más tarde.</p>';
      return;
    }

    const { data, error } = await sb
      .from('services')
      .select('id,category,name,icon,description,rating,reviews')
      .order('name', { ascending: true });

    if (error) {
      container.innerHTML = '<p class="text-center text-sm text-black/40 py-16">No se pudieron cargar los servicios. Intenta más tarde.</p>';
      return;
    }

    const services = data || [];
    const grouped = {};
    services.forEach(function (s) {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    });

    let html = CATEGORIES.filter(cat => grouped[cat.id] && grouped[cat.id].length)
      .map(cat => sectionHtml(cat, grouped[cat.id]))
      .join('');

    Object.keys(grouped).filter(id => !CATEGORIES.some(cat => cat.id === id)).forEach(function (id) {
      html += sectionHtml({ id: id, title: id, desc: '', gradient: null, icon: '' }, grouped[id]);
    });

    container.innerHTML = html || '<p class="text-center text-sm text-black/40 py-16">Aún no hay servicios publicados.</p>';
  })();
})();
