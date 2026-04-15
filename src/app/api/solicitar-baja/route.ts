import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// POST /api/solicitar-baja
// El vendedor solicita al dueño dar de baja a un usuario que él invitó.
export async function POST(req: NextRequest) {
  const { invitationId, reason } = await req.json();

  if (!invitationId) {
    return NextResponse.json({ error: "invitationId es requerido." }, { status: 400 });
  }

  const admin = createAdminClient();
  let requestedBy: string;
  let tenantId: string;

  if (process.env.NODE_ENV === "development") {
    tenantId = process.env.DEV_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";
    // En dev usamos un UUID fijo como vendedor
    requestedBy = "00000000-0000-0000-0000-000000000099";
  } else {
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
      .limit(1)
      .single();

    if (!ut) {
      return NextResponse.json({ error: "Usuario sin tenant." }, { status: 403 });
    }

    tenantId = ut.tenant_id;
    requestedBy = user.id;
  }

  // Verificar que la invitación exista, pertenezca al tenant y fue enviada por este vendedor
  const { data: invitation } = await admin
    .schema("nexia_tienda")
    .from("invitations")
    .select("id, email, invited_by, status")
    .eq("id", invitationId)
    .eq("tenant_id", tenantId)
    .single();

  if (!invitation) {
    return NextResponse.json({ error: "Invitación no encontrada." }, { status: 404 });
  }

  // En producción verificar que la invitación fue enviada por este vendedor
  if (process.env.NODE_ENV !== "development" && invitation.invited_by !== requestedBy) {
    return NextResponse.json(
      { error: "No tienes permiso para solicitar la baja de este usuario." },
      { status: 403 }
    );
  }

  if (invitation.status !== "aceptada") {
    return NextResponse.json(
      { error: "Solo se puede solicitar baja de usuarios que ya aceptaron la invitación." },
      { status: 400 }
    );
  }

  // Verificar que no haya ya una solicitud pendiente para esta invitación
  const { data: existingRequest } = await admin
    .schema("nexia_tienda")
    .from("removal_requests")
    .select("id")
    .eq("invitation_id", invitationId)
    .eq("status", "pendiente")
    .maybeSingle();

  if (existingRequest) {
    return NextResponse.json(
      { error: "Ya existe una solicitud de baja pendiente para este usuario." },
      { status: 409 }
    );
  }

  // Crear la solicitud de baja
  const { error: insertError } = await admin
    .schema("nexia_tienda")
    .from("removal_requests")
    .insert({
      tenant_id: tenantId,
      requested_by: requestedBy,
      invitation_id: invitationId,
      target_email: invitation.email,
      reason: reason || null,
    });

  if (insertError) {
    return NextResponse.json(
      { error: "Error al crear la solicitud: " + insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
