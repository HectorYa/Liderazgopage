// Utilidades de sesión y roles compartidas por dashboard y portales.
(function () {
  window.roleHome = function (role) {
    if (role === 'admin') return 'admin.html';
    if (role === 'profesional') return 'panel-profesional.html';
    return 'dashboard.html';
  };

  window.fetchRole = async function (userId) {
    if (!window.sb) return 'paciente';
    const { data, error } = await sb
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return 'paciente';
    return data.role || 'paciente';
  };

  // Devuelve { session, profile, role } o redirige si no hay sesión/rol permitido.
  window.requireSession = async function (allowedRoles) {
    if (!window.sb) {
      window.location.replace('login.html');
      return null;
    }

    const { data, error } = await sb.auth.getSession();
    if (error || !data.session) {
      window.location.replace('login.html?redirect=' + encodeURIComponent(window.location.href));
      return null;
    }

    const { data: profile } = await sb
      .from('profiles')
      .select('role,name,lastname,email,phone')
      .eq('id', data.session.user.id)
      .maybeSingle();

    const role = profile && profile.role ? profile.role : 'paciente';

    if (allowedRoles && allowedRoles.indexOf(role) === -1) {
      window.location.replace(roleHome(role));
      return null;
    }

    return { session: data.session, profile: profile, role: role };
  };
})();
