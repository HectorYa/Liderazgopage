// Cliente Supabase compartido (se expone como window.sb).
(function () {
  var lib = window.supabase;
  if (!lib || typeof lib.createClient !== 'function') {
    console.error('[Supabase] La libreria no cargo. Revisa la conexion al CDN.');
    return;
  }
  if (!window.SUPABASE_URL || !window.SUPABASE_KEY) {
    console.error('[Supabase] Falta la configuracion en js/supabase-config.js.');
    return;
  }
  window.sb = lib.createClient(window.SUPABASE_URL, window.SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  window.dispatchEvent(new Event('supabase:ready'));
})();
