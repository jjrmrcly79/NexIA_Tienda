import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

const ROLE_HOME: Record<string, string> = {
  vendedor: "/vendedor",
  cliente: "/tienda",
};

export default async function AceptarInvitacionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const admin = createAdminClient();

  // Buscar invitación pendiente para este email
  const { data: invitation } = await admin
    .schema("nexia_tienda")
    .from("invitations")
    .select("id, tenant_id, role")
    .eq("email", user.email!.toLowerCase())
    .eq("status", "pendiente")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!invitation) {
    // No hay invitación pendiente — puede que ya fue aceptada o no existe
    redirect("/auth/login?error=invitacion_no_encontrada");
  }

  // Verificar que no tenga ya ese rol en ese tenant
  const { data: existing } = await admin
    .schema("nexia_tienda")
    .from("user_tenants")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("tenant_id", invitation.tenant_id)
    .maybeSingle();

  if (!existing) {
    // Asignar el rol en el tenant
    await admin
      .schema("nexia_tienda")
      .from("user_tenants")
      .insert({
        user_id: user.id,
        tenant_id: invitation.tenant_id,
        role: invitation.role,
      });
  }

  // Marcar la invitación como aceptada
  await admin
    .schema("nexia_tienda")
    .from("invitations")
    .update({ status: "aceptada" })
    .eq("id", invitation.id);

  const home = ROLE_HOME[invitation.role] ?? "/tienda";
  redirect(home);
}
