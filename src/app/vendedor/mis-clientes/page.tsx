import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import SolicitudBajaButton from "./SolicitudBajaButton";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  aceptada:  "bg-green-100 text-green-700",
  expirada:  "bg-gray-100 text-gray-500",
};

const ROLE_LABEL: Record<string, string> = {
  cliente:  "Cliente",
  vendedor: "Vendedor",
};

export default async function MisClientesPage() {
  let invitations: {
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    hasPendingRequest: boolean;
  }[] = [];

  if (process.env.NODE_ENV === "development") {
    const tenantId = process.env.DEV_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";
    const admin = createAdminClient();

    const { data: rawInvites } = await admin
      .schema("nexia_tienda")
      .from("invitations")
      .select("id, email, role, status, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    const { data: pendingRequests } = await admin
      .schema("nexia_tienda")
      .from("removal_requests")
      .select("invitation_id")
      .eq("tenant_id", tenantId)
      .eq("status", "pendiente");

    const pendingSet = new Set((pendingRequests ?? []).map((r) => r.invitation_id));
    invitations = (rawInvites ?? []).map((inv) => ({
      ...inv,
      hasPendingRequest: pendingSet.has(inv.id),
    }));
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: ut } = await supabase
      .schema("nexia_tienda")
      .from("user_tenants")
      .select("tenant_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!ut) redirect("/auth/login");

    const admin = createAdminClient();

    const { data: rawInvites } = await admin
      .schema("nexia_tienda")
      .from("invitations")
      .select("id, email, role, status, created_at")
      .eq("tenant_id", ut.tenant_id)
      .eq("invited_by", user.id)
      .order("created_at", { ascending: false });

    const { data: pendingRequests } = await admin
      .schema("nexia_tienda")
      .from("removal_requests")
      .select("invitation_id")
      .eq("tenant_id", ut.tenant_id)
      .eq("requested_by", user.id)
      .eq("status", "pendiente");

    const pendingSet = new Set((pendingRequests ?? []).map((r) => r.invitation_id));
    invitations = (rawInvites ?? []).map((inv) => ({
      ...inv,
      hasPendingRequest: pendingSet.has(inv.id),
    }));
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mis clientes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Personas que tú has invitado. Puedes solicitar al administrador dar de baja a alguna.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {!invitations.length ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-sm">Aún no has invitado a nadie.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Correo</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Rol</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 hidden sm:table-cell">Fecha</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-900">{inv.email}</td>
                  <td className="px-5 py-3 text-gray-600">{ROLE_LABEL[inv.role] ?? inv.role}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        STATUS_STYLE[inv.status] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs hidden sm:table-cell">
                    {new Date(inv.created_at).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {inv.status === "aceptada" && (
                      inv.hasPendingRequest ? (
                        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                          Solicitud enviada
                        </span>
                      ) : (
                        <SolicitudBajaButton
                          invitationId={inv.id}
                          targetEmail={inv.email}
                        />
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
