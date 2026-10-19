// ============================================================
// Edge Function: create-user
// Crea cuentas de usuario desde el panel admin (rol admin).
// La service_role vive solo en el servidor; el navegador nunca la ve.
//
// Desplegar:
//   supabase functions deploy create-user --project-ref tqqnyrvxzsftwmxzkeph
//
// Variables de entorno (las inyecta Supabase automáticamente):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
      return json({ error: "Configuración del servidor incompleta." }, 500);
    }

    // 1) Identificar a quien llama con su propio token.
    const authHeader = req.headers.get("Authorization") ?? "";
    const asCaller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userError } = await asCaller.auth.getUser();
    if (userError || !userData?.user) return json({ error: "No autenticado." }, 401);

    // 2) Comprobar que es administrador (lectura con service_role).
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (!profile || profile.role !== "admin") {
      return json({ error: "Solo un administrador puede crear usuarios." }, 403);
    }

    // 3) Validar la petición.
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = ["paciente", "profesional", "admin"].includes(body.role) ? body.role : "profesional";
    const name = body.name ? String(body.name).trim() : "";
    const lastname = body.lastname ? String(body.lastname).trim() : "";
    const phone = body.phone ? String(body.phone).trim() : null;
    const professionalId = body.professional_id ? String(body.professional_id) : null;

    if (!email || !password) return json({ error: "Correo y contraseña son obligatorios." }, 400);
    if (password.length < 6) return json({ error: "La contraseña debe tener al menos 6 caracteres." }, 400);

    // 4) Crear el usuario ya confirmado (no depende de correos).
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, lastname, phone },
    });
    if (createError) return json({ error: createError.message }, 400);

    const newId = created.user!.id;

    // 5) Rol y datos del perfil (el trigger ya creó la fila).
    const { error: profileError } = await admin
      .from("profiles")
      .upsert({ id: newId, name, lastname, email, phone, role }, { onConflict: "id" });
    if (profileError) return json({ error: profileError.message }, 400);

    // 6) Vincular la ficha profesional, si se indicó.
    if (role === "profesional" && professionalId) {
      const { error: linkError } = await admin
        .from("professionals")
        .update({ user_id: newId })
        .eq("id", professionalId);
      if (linkError) return json({ error: linkError.message, user_id: newId }, 400);
    }

    return json({ user_id: newId, email, role }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
