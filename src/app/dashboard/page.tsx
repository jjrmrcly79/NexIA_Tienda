import { getDevContext } from "@/lib/supabase/devClient";

interface MacroCard {
  label: string;
  value: string | number;
  description: string;
  alert?: boolean;
}

export default async function DashboardPage() {
  const { supabase, tenantId } = await getDevContext();

  const { count: pendingOrders } = await supabase
    .schema("nexia_tienda")
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "pending");

  const { count: missingDesc } = await supabase
    .schema("nexia_tienda")
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .is("description", null);

  const { data: lowStockItems } = await supabase
    .schema("nexia_tienda")
    .from("inventory")
    .select("product_id, stock, low_stock_threshold")
    .eq("tenant_id", tenantId)
    .filter("stock", "lt", "low_stock_threshold");

  const lowStock = lowStockItems?.length ?? 0;

  const { count: totalProducts } = await supabase
    .schema("nexia_tienda")
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const macros: MacroCard[] = [
    {
      label: "Pedidos pendientes",
      value: pendingOrders ?? 0,
      description: "Requieren atención",
      alert: (pendingOrders ?? 0) > 0,
    },
    {
      label: "Stock bajo",
      value: lowStock,
      description: "Productos bajo el umbral mínimo",
      alert: lowStock > 0,
    },
    {
      label: "Sin descripción",
      value: missingDesc ?? 0,
      description: "Productos sin descripción",
      alert: (missingDesc ?? 0) > 0,
    },
    {
      label: "Total productos",
      value: totalProducts ?? 0,
      description: "En el catálogo",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Alertas y Macros</h2>
        <p className="text-gray-500 mt-1">Resumen del estado de la tienda</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {macros.map((macro) => (
          <div
            key={macro.label}
            className={`bg-white rounded-xl border p-5 ${
              macro.alert ? "border-red-200 bg-red-50" : "border-gray-200"
            }`}
          >
            <p className="text-sm text-gray-500">{macro.label}</p>
            <p
              className={`text-4xl font-bold mt-1 ${
                macro.alert ? "text-red-600" : "text-gray-900"
              }`}
            >
              {macro.value}
            </p>
            <p className="text-xs text-gray-400 mt-1">{macro.description}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Alertas activas
        </h3>
        <div className="space-y-2">
          {(pendingOrders ?? 0) > 0 && (
            <Alert
              type="warning"
              message={`Tienes ${pendingOrders} pedido(s) pendientes por procesar.`}
              href="/dashboard/pedidos"
            />
          )}
          {lowStock > 0 && (
            <Alert
              type="warning"
              message={`${lowStock} producto(s) con stock por debajo del umbral mínimo.`}
              href="/dashboard/productos"
            />
          )}
          {(missingDesc ?? 0) > 0 && (
            <Alert
              type="info"
              message={`${missingDesc} producto(s) no tienen descripción.`}
              href="/dashboard/productos"
            />
          )}
          {(pendingOrders ?? 0) === 0 &&
            lowStock === 0 &&
            (missingDesc ?? 0) === 0 && (
              <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                Todo en orden. No hay alertas activas.
              </p>
            )}
        </div>
      </div>
    </div>
  );
}

function Alert({
  type,
  message,
  href,
}: {
  type: "warning" | "info";
  message: string;
  href: string;
}) {
  const styles = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <a
      href={href}
      className={`flex items-center justify-between border rounded-lg px-4 py-3 text-sm hover:opacity-80 transition-opacity ${styles[type]}`}
    >
      <span>{message}</span>
      <span className="ml-4">→</span>
    </a>
  );
}
