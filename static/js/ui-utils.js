(function () {
  var DEFAULT_PAGE_SIZE = 8;

  window.paginateItems = function (items, page, pageSize) {
    var list = items || [];
    var size = pageSize || DEFAULT_PAGE_SIZE;
    var total = list.length;
    var totalPages = Math.max(1, Math.ceil(total / size));
    var current = Math.min(Math.max(1, Number(page) || 1), totalPages);
    var start = (current - 1) * size;
    return {
      items: list.slice(start, start + size),
      page: current,
      totalPages: totalPages,
      total: total,
      pageSize: size,
      from: total ? start + 1 : 0,
      to: Math.min(start + size, total)
    };
  };

  window.renderPager = function (el, result, onPage) {
    if (!el) return;
    if (!result || result.total === 0) {
      el.innerHTML = '';
      return;
    }

    var pages = [];
    var maxButtons = 5;
    var start = Math.max(1, result.page - 2);
    var end = Math.min(result.totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    for (var i = start; i <= end; i++) pages.push(i);

    var btnBase = 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition-colors ';
    var btnOff = 'border-black/10 text-black/30 cursor-not-allowed';
    var btnOn = 'border-black/10 text-black/60 hover:border-primary/40 hover:text-primary';
    var btnActive = 'border-primary bg-primary text-white';

    var html = '<div class="flex flex-wrap items-center justify-between gap-3 pt-2">' +
      '<p class="text-xs text-black/40">' + result.from + '–' + result.to + ' de ' + result.total + '</p>' +
      '<div class="flex items-center gap-1">' +
        '<button type="button" data-page="' + (result.page - 1) + '" class="' + btnBase + (result.page <= 1 ? btnOff : btnOn) + '"' + (result.page <= 1 ? ' disabled' : '') + '>Anterior</button>' +
        pages.map(function (p) {
          return '<button type="button" data-page="' + p + '" class="' + btnBase + (p === result.page ? btnActive : btnOn) + '">' + p + '</button>';
        }).join('') +
        '<button type="button" data-page="' + (result.page + 1) + '" class="' + btnBase + (result.page >= result.totalPages ? btnOff : btnOn) + '"' + (result.page >= result.totalPages ? ' disabled' : '') + '>Siguiente</button>' +
      '</div>' +
    '</div>';

    el.innerHTML = html;
    el.onclick = function (e) {
      var btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled) return;
      if (typeof onPage === 'function') onPage(Number(btn.dataset.page));
    };
  };
})();
