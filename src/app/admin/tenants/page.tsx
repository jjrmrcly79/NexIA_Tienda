import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const supabase = createAdminClient();

  const { data: tenants } = await supabase
    .schema("nexia_tienda")
    .from("tenants")
    .select("id, name, slug, created_at")
    .order("name");

  // Por cada tenant, obtener conteos
  const tenantIds = tenants?.map((t) => t.id) ?? [];

  const { data: productCounts } = await supabase
    .schema("nexia_tienda")
    .from("products")
    .select("tenant_id")
    .in("tenant_id", tenantIds);

  const { data: orderCounts } = await supabase
    .schema("nexia_tienda")
    .from("orders")
    .select("tenant_id, total, status")
    .in("tenant_id", tenantIds);

  const { data: userCounts } = await supabase
    .schema("nexia_tienda")
    .from("user_tenants")
    .select("tenant_id, role")
    .in("tenant_id", tenantIds);

  function countFor<T extends { tenant_id: string }>(arr: T[] | null, id: string) {
    return arr?.filter((x) => x.tenant_id === id).length ?? 0;
  }

  function revenueFor(id: string) {
    return orderCounts
      ?.filter((o) => o.tenant_id === id && o.status !== "cancelado")
      .reduce((s, o) => s + Number(o.total), 0) ?? 0;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Todos los Tenants</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {tenants?.length ?? 0} tenant{(tenants?.length ?? 0) !== 1 ? "s" : ""} en la plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tenants?.map((tenant) => (
          <div
            key={tenant.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{tenant.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{tenant.slug}</p>
              </div>
              <Link
                href={`/tienda/${tenant.slug}`}
                target="_blank"
                className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
              >
                ↗
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Productos", value: countFor(productCounts, tenant.id) },
                { label: "Pedidos",   value: countFor(orderCounts, tenant.id) },
                { label: "Usuarios",  value: countFor(userCounts, tenant.id) },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-800 rounded-lg p-2">
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Ingresos: <span className="text-emerald-400 font-medium">
                ${revenueFor(tenant.id).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span></span>
              <span>{new Date(tenant.created_at).toLocaleDateString("es-MX")}</span>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/admin/imagenes`}
                className="flex-1 text-center text-xs border border-gray-700 text-gray-400 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Imágenes IA
              </Link>
              <Link
                href={`/admin/branding`}
                className="flex-1 text-center text-xs border border-gray-700 text-gray-400 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Branding
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
