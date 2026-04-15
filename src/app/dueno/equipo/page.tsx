import { getDevContext } from "@/lib/supabase/devClient";
import InviteForm from "./InviteForm";
import ProcesarBajaButton from "./ProcesarBajaButton";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  vendedor: "Vendedor",
  cliente:  "Cliente",
};

const STATUS_STYLE: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  aceptada:  "bg-green-100 text-green-700",
  expirada:  "bg-gray-100 text-gray-500",
};

export default async function DuenoEquipoPage() {
  const { supabase, tenantId } = await getDevContext();

  const [{ data: invitations }, { data: removalRequests }] = await Promise.all([
    supabase
      .schema("nexia_tienda")
      .from("invitations")
      .select("id, email, role, status, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),

    supabase
      .schema("nexia_tienda")
      .from("removal_requests")
      .select("id, target_email, reason, created_at")
      .eq("tenant_id", tenantId)
      .eq("status", "pendiente")
      .order("created_at", { ascending: true }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Equipo</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Invita vendedores y clientes a tu tienda.
        </p>
      </div>

      <InviteForm />

      {/* Solicitudes de baja pendientes */}
      {(removalRequests?.length ?? 0) > 0 && (
        <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-red-100 bg-red-50 flex items-center gap-2">
            <span className="text-red-500 text-sm">⚠️</span>
            <h2 className="font-semibold text-red-800 text-sm">
              Solicitudes de baja pendientes ({removalRequests!.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {removalRequests!.map((req) => (
              <div key={req.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{req.target_email}</p>
                  {req.reason && (
                    <p className="text-xs text-gray-500 mt-0.5">Motivo: {req.reason}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(req.created_at).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <ProcesarBajaButton requestId={req.id} targetEmail={req.target_email} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Todas las invitaciones */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Invitaciones enviadas</h2>
        </div>

        {!invitations?.length ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-sm">Aún no has enviado invitaciones.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Correo</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Rol</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 hidden sm:table-cell">Fecha</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
