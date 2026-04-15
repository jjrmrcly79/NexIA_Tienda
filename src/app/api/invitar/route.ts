import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// POST /api/invitar
// El dueño envía una invitación por correo a un cliente o vendedor.
export async function POST(req: NextRequest) {
  const { email, role } = await req.json();

  if (!email || !role) {
    return NextResponse.json(
      { error: "Email y rol son requeridos." },
      { status: 400 }
    );
  }

  if (!["cliente", "vendedor"].includes(role)) {
    return NextResponse.json(
      { error: "Rol inválido. Solo se permite: cliente, vendedor." },
      { status: 400 }
    );
  }

  // Verificar que quien invita sea dueño o administrador
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: ut } = await supabase
    .schema("nexia_tienda")
    .from("user_tenants")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .in("role", ["dueno", "administrador"])
    .limit(1)
    .single();

  if (!ut) {
    return NextResponse.json(
      { error: "No tienes permiso para invitar usuarios." },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // Verificar que no exista ya una invitación pendiente para este email en este tenant
  const { data: existing } = await admin
    .schema("nexia_tienda")
    .from("invitations")
    .select("id, status")
    .eq("tenant_id", ut.tenant_id)
    .eq("email", email.toLowerCase())
    .eq("status", "pendiente")
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una invitación pendiente para este correo." },
      { status: 409 }
    );
  }

  // Guardar la invitación en la base de datos
  const { error: inviteDbError } = await admin
    .schema("nexia_tienda")
    .from("invitations")
    .insert({
      tenant_id: ut.tenant_id,
      email: email.toLowerCase(),
      role,
      invited_by: user.id,
    });

  if (inviteDbError) {
    return NextResponse.json(
      { error: "Error al guardar la invitación." },
      { status: 500 }
    );
  }

  // Enviar el correo de invitación via Supabase Auth
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const redirectTo = `${appUrl}/auth/callback?next=/auth/aceptar-invitacion`;

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email.toLowerCase(),
    { redirectTo }
  );

  if (inviteError) {
    // Revertir la invitación guardada si falla el envío
    await admin
      .schema("nexia_tienda")
      .from("invitations")
      .delete()
      .eq("tenant_id", ut.tenant_id)
      .eq("email", email.toLowerCase())
      .eq("status", "pendiente");

    return NextResponse.json(
      { error: "Error al enviar el correo de invitación." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
