// ============================================
// EXCELENTEMENTE - Realtime (citas en vivo)
// ============================================

(function () {
  window.rtDebounce = function (fn, wait) {
    let timer = null;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, wait || 400);
    };
  };

  window.realtimeAppointments = function (filter, onChange) {
    if (!window.sb || typeof sb.channel !== 'function') return null;

    const config = { event: '*', schema: 'public', table: 'appointments' };
    if (filter) config.filter = filter;

    const channel = sb.channel('appointments-' + (filter || 'all'));
    channel
      .on('postgres_changes', config, function () { onChange(); })
      .subscribe();

    return channel;
  };

  window.rtLeave = function (channel) {
    if (channel && window.sb && typeof sb.removeChannel === 'function') sb.removeChannel(channel);
  };
})();
