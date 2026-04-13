import { getDevContext } from "@/lib/supabase/devClient";
import OrderStatusSelect from "./OrderStatusSelect";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pendiente",  color: "bg-amber-100 text-amber-700"   },
  processing: { label: "Procesando", color: "bg-blue-100 text-blue-700"     },
  shipped:    { label: "Enviado",    color: "bg-purple-100 text-purple-700" },
  delivered:  { label: "Entregado",  color: "bg-green-100 text-green-700"   },
  cancelled:  { label: "Cancelado",  color: "bg-red-100 text-red-700"       },
};

export default async function EmpleadoPage() {
  const { supabase, tenantId } = await getDevContext();

  const { data: orders } = await supabase
    .schema("nexia_tienda")
    .from("orders")
    .select(
      `
      id,
      status,
      total,
      created_at,
      order_items (
        quantity,
        unit_price,
        products ( name, sku )
      )
    `
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  const resumen = {
    total: orders?.length ?? 0,
    pendientes: orders?.filter((o) => o.status === "pending").length ?? 0,
    hoy: orders?.filter(
      (o) =>
        new Date(o.created_at).toDateString() === new Date().toDateString()
    ).length ?? 0,
    ingresos: orders
      ?.filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + Number(o.total), 0) ?? 0,
  };

  return (
    <div className="space-y-8">
      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pedidos hoy",   value: resumen.hoy,       alert: false },
          { label: "Pendientes",    value: resumen.pendientes, alert: resumen.pendientes > 0 },
          { label: "Total pedidos", value: resumen.total,      alert: false },
          { label: "Ingresos",      value: `$${resumen.ingresos.toFixed(2)}`, alert: false },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-4 ${
              card.alert ? "border-red-200 bg-red-50" : "bg-white border-gray-200"
            }`}
          >
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.alert ? "text-red-600" : "text-gray-900"}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Lista de pedidos */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Pedidos</h2>
        <div className="space-y-3">
          {orders?.map((order) => {
            const statusInfo = STATUS_LABELS[order.status] ?? STATUS_LABELS["pending"];
            return (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-gray-400">
                      #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(order.created_at).toLocaleString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">
                      ${Number(order.total).toFixed(2)}
                    </span>
                    <OrderStatusSelect
                      orderId={order.id}
                      currentStatus={order.status}
                    />
                  </div>
                </div>

                {/* Items */}
                {order.order_items && order.order_items.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 space-y-1">
                    {order.order_items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-gray-600">
                        <span>
                          {(item.products as unknown as { name: string } | null)?.name ?? "Producto"}{" "}
                          <span className="text-gray-400">×{item.quantity}</span>
                        </span>
                        <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {!orders?.length && (
            <p className="text-center text-gray-400 py-16">No hay pedidos aún.</p>
          )}
        </div>
      </div>
    </div>
  );
}
