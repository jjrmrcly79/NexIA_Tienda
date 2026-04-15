import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// POST /api/procesar-baja
// El dueño/admin aprueba o rechaza una solicitud de baja.
// body: { requestId: string, action: "aprobar" | "rechazar" }
export async function POST(req: NextRequest) {
  const { requestId, action } = await req.json();

  if (!requestId || !["aprobar", "rechazar"].includes(action)) {
    return NextResponse.json(
      { error: "requestId y action (aprobar|rechazar) son requeridos." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  let processedBy: string;
  let tenantId: string;

  if (process.env.NODE_ENV === "development") {
    tenantId = process.env.DEV_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";
    processedBy = "00000000-0000-0000-0000-000000000001";
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
      .in("role", ["dueno", "administrador"])
      .limit(1)
      .single();

    if (!ut) {
      return NextResponse.json(
        { error: "No tienes permiso para procesar solicitudes de baja." },
        { status: 403 }
      );
    }

    tenantId = ut.tenant_id;
    processedBy = user.id;
  }

  // Obtener la solicitud
  const { data: request } = await admin
    .schema("nexia_tienda")
    .from("removal_requests")
    .select("id, target_email, status, invitation_id")
    .eq("id", requestId)
    .eq("tenant_id", tenantId)
    .single();

  if (!request) {
    return NextResponse.json({ error: "Solicitud no encontrada." }, { status: 404 });
  }

  if (request.status !== "pendiente") {
    return NextResponse.json(
      { error: "Esta solicitud ya fue procesada." },
      { status: 409 }
    );
  }

  // Actualizar el estado de la solicitud
  const newStatus = action === "aprobar" ? "aprobada" : "rechazada";

  const { error: updateError } = await admin
    .schema("nexia_tienda")
    .from("removal_requests")
    .update({ status: newStatus, processed_by: processedBy })
    .eq("id", requestId);

  if (updateError) {
    return NextResponse.json(
      { error: "Error al procesar la solicitud: " + updateError.message },
      { status: 500 }
    );
  }

  // Si se aprueba, eliminar al usuario del tenant
  if (action === "aprobar") {
    // Buscar el user_id por email
    const { data: { users } } = await admin.auth.admin.listUsers();
    const targetUser = users.find((u) => u.email === request.target_email);

    if (targetUser) {
      // Eliminar de user_tenants
      await admin
        .schema("nexia_tienda")
        .from("user_tenants")
        .delete()
        .eq("user_id", targetUser.id)
        .eq("tenant_id", tenantId);
    }

    // Marcar la invitación como expirada
    if (request.invitation_id) {
      await admin
        .schema("nexia_tienda")
        .from("invitations")
        .update({ status: "expirada" })
        .eq("id", request.invitation_id);
    }
  }

  return NextResponse.json({ ok: true });
}
