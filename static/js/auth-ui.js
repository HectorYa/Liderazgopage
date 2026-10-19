// Utilidades compartidas de autenticacion para las paginas de acceso.
(function () {
  var mensajes = {
    invalid_credentials: 'Correo o contraseña incorrectos. Intenta de nuevo.',
    invalid_login_credentials: 'Correo o contraseña incorrectos. Intenta de nuevo.',
    email_not_confirmed: 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
    user_already_exists: 'Ese correo ya está registrado. Inicia sesión.',
    email_exists: 'Ese correo ya está registrado. Inicia sesión.',
    weak_password: 'La contraseña debe tener al menos 6 caracteres.',
    over_email_send_rate_limit: 'Demasiados intentos seguidos. Espera un momento y vuelve a intentarlo.',
    over_request_rate_limit: 'Demasiados intentos seguidos. Espera un momento y vuelve a intentarlo.',
    signup_disabled: 'El registro está desactivado temporalmente.',
    email_provider_disabled: 'El registro con correo está desactivado temporalmente.'
  };

  window.authErrorMessage = function (error) {
    if (!error) return 'Ocurrió un error inesperado. Intenta de nuevo.';
    if (error.code && mensajes[error.code]) return mensajes[error.code];
    var msg = String(error.message || '').toLowerCase();
    if (msg.indexOf('invalid login credentials') !== -1) return mensajes.invalid_credentials;
    if (msg.indexOf('email not confirmed') !== -1) return mensajes.email_not_confirmed;
    if (msg.indexOf('already registered') !== -1) return mensajes.email_exists;
    if (msg.indexOf('password') !== -1) return mensajes.weak_password;
    if (msg.indexOf('rate limit') !== -1) return mensajes.over_request_rate_limit;
    return 'No se pudo completar la operación. Intenta de nuevo.';
  };

  // Devuelve una ruta interna segura (evita redirecciones a otros dominios).
  window.safeRedirect = function (value, fallback) {
    if (!value) return fallback;
    try {
      var url = new URL(value, window.location.href);
      if (url.origin !== window.location.origin) return fallback;
      if (/\/(login|registro)\.html$/i.test(url.pathname)) return fallback;
      return url.pathname + url.search + url.hash;
    } catch (e) {
      return fallback;
    }
  };
})();
