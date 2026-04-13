import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const { count: totalTenants } = await supabase
    .schema("nexia_tienda")
    .from("tenants")
    .select("*", { count: "exact", head: true });

  const { count: totalProducts } = await supabase
    .schema("nexia_tienda")
    .from("products")
    .select("*", { count: "exact", head: true });

  const { count: totalOrders } = await supabase
    .schema("nexia_tienda")
    .from("orders")
    .select("*", { count: "exact", head: true });

  const { count: totalUsers } = await supabase
    .schema("nexia_tienda")
    .from("user_tenants")
    .select("*", { count: "exact", head: true });

  const { data: tenants } = await supabase
    .schema("nexia_tienda")
    .from("tenants")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard de Infraestructura</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Vista global de todos los tenants en la plataforma.
        </p>
      </div>

      {/* Métricas globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Tenants activos",   value: totalTenants ?? 0,   icon: "🏪" },
          { label: "Productos totales", value: totalProducts ?? 0,  icon: "📦" },
          { label: "Pedidos totales",   value: totalOrders ?? 0,    icon: "🛒" },
          { label: "Usuarios",          value: totalUsers ?? 0,     icon: "👥" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-gray-800 border border-gray-700 rounded-xl p-4"
          >
            <p className="text-xl mb-1">{kpi.icon}</p>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Servicios adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/imagenes"
          className="bg-gradient-to-br from-purple-900 to-indigo-900 border border-purple-700 rounded-xl p-5 hover:border-purple-500 transition-colors group"
        >
          <p className="text-3xl mb-3">🎨</p>
          <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
            Generación de Imágenes IA
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Genera imágenes profesionales de productos para los tenants usando inteligencia artificial.
          </p>
          <p className="text-xs text-purple-400 mt-3">Servicio adicional →</p>
        </Link>

        <Link
          href="/admin/branding"
          className="bg-gradient-to-br from-emerald-900 to-teal-900 border border-emerald-700 rounded-xl p-5 hover:border-emerald-500 transition-colors group"
        >
          <p className="text-3xl mb-3">✨</p>
          <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
            Branding de Marca
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Crea identidad visual completa: paleta de colores, tipografías y guía de estilo para cada tenant.
          </p>
          <p className="text-xs text-emerald-400 mt-3">Servicio adicional →</p>
        </Link>
      </div>

      {/* Lista de tenants */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">Tenants registrados</h2>
          <Link
            href="/admin/tenants"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Ver todos →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Nombre</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 hidden md:table-cell">Slug</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 hidden lg:table-cell">Creado</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {tenants?.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-gray-800/50">
                <td className="px-5 py-3 text-white font-medium">{tenant.name}</td>
                <td className="px-5 py-3 text-gray-400 font-mono text-xs hidden md:table-cell">
                  {tenant.slug}
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs hidden lg:table-cell">
                  {new Date(tenant.created_at).toLocaleDateString("es-MX")}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/tienda/${tenant.slug}`}
                    target="_blank"
                    className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
                  >
                    Ver tienda ↗
                  </Link>
                </td>
              </tr>
            ))}
            {!tenants?.length && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                  No hay tenants registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
