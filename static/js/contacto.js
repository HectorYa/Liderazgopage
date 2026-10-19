// ============================================
// EXCELENTEMENTE - Formulario de contacto
// ============================================

(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  function showMsg(text, ok) {
    const el = document.getElementById('contact-msg');
    el.textContent = text;
    el.className = 'text-xs text-center p-3 rounded-xl ' +
      (ok ? 'bg-green-50 border border-green-200 text-green-600' : 'bg-red-50 border border-red-200 text-red-600');
    el.classList.remove('hidden');
  }

  const params = new URLSearchParams(window.location.search);
  const service = params.get('servicio');
  if (service) {
    const select = document.getElementById('servicio');
    const match = [...select.options].find(o => o.value.toLowerCase() === service.toLowerCase());
    if (match) {
      select.value = match.value;
    } else {
      document.getElementById('mensaje').value = 'Hola, me interesa el servicio: ' + service + '.';
    }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!window.sb) {
      showMsg('No se pudo conectar con el servidor. Escríbenos por WhatsApp, por favor.', false);
      return;
    }

    const payload = {
      name: document.getElementById('nombre').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('celular').value.trim() || null,
      service: document.getElementById('servicio').value || null,
      message: document.getElementById('mensaje').value.trim()
    };

    if (!payload.name || !payload.email || !payload.message) {
      showMsg('Completa tu nombre, correo y consulta.', false);
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    const { error } = await sb.from('contact_messages').insert(payload);

    btn.disabled = false;

    if (error) {
      showMsg('No se pudo enviar tu consulta. Intenta de nuevo o escríbenos por WhatsApp.', false);
      return;
    }

    form.reset();
    showMsg('¡Mensaje enviado! Te responderemos pronto.', true);
  });
})();
