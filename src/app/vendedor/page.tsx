import { getDevContext } from "@/lib/supabase/devClient";
import VendedorOrderCard from "./VendedorOrderCard";

export const dynamic = "force-dynamic";

export type OrderStatus =
  | "recibido"
  | "en_preparacion"
  | "listo_entrega"
  | "entregado"
  | "cancelado";

export const PIPELINE: { status: OrderStatus; label: string; color: string; icon: string }[] = [
  { status: "recibido",       label: "Recibido",          color: "bg-amber-100 text-amber-700 border-amber-200",   icon: "📥" },
  { status: "en_preparacion", label: "En preparación",    color: "bg-blue-100 text-blue-700 border-blue-200",      icon: "👨‍🍳" },
  { status: "listo_entrega",  label: "Listo para entrega",color: "bg-purple-100 text-purple-700 border-purple-200",icon: "📦" },
  { status: "entregado",      label: "Entregado",         color: "bg-green-100 text-green-700 border-green-200",   icon: "✅" },
  { status: "cancelado",      label: "Cancelado",         color: "bg-red-100 text-red-700 border-red-200",         icon: "❌" },
];

export default async function VendedorPage() {
  const { supabase, tenantId } = await getDevContext();

  const { data: orders } = await supabase
    .schema("nexia_tienda")
    .from("orders")
    .select(
      `id, status, total, customer_name, notes, created_at,
       order_items ( quantity, unit_price, products ( name, sku ) )`
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  const countByStatus = PIPELINE.reduce(
    (acc, p) => ({
      ...acc,
      [p.status]: orders?.filter((o) => o.status === p.status).length ?? 0,
    }),
    {} as Record<OrderStatus, number>
  );

  const totalHoy = orders?.filter(
    (o) => new Date(o.created_at).toDateString() === new Date().toDateString()
  ).length ?? 0;

  const ingresos = orders
    ?.filter((o) => o.status !== "cancelado")
    .reduce((s, o) => s + Number(o.total), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Gestión de Pedidos</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Actualiza el estado de cada pedido conforme avanza el proceso.
        </p>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pedidos hoy",     value: totalHoy,                          alert: false },
          { label: "Pendientes",      value: countByStatus["recibido"],          alert: countByStatus["recibido"] > 0 },
          { label: "En preparación",  value: countByStatus["en_preparacion"],    alert: false },
          { label: "Ingresos totales",value: `$${ingresos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, alert: false },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-4 ${
              card.alert ? "border-amber-200 bg-amber-50" : "bg-white border-gray-200"
            }`}
          >
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.alert ? "text-amber-700" : "text-gray-900"}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Pipeline visual */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PIPELINE.filter((p) => p.status !== "cancelado").map((p) => (
          <div
            key={p.status}
            className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${p.color}`}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
            <span className="ml-1 bg-white/60 rounded-full px-1.5 py-0.5 font-bold">
              {countByStatus[p.status]}
            </span>
          </div>
        ))}
      </div>

      {/* Lista de pedidos */}
      <div className="space-y-3">
        {orders?.map((order) => (
          <VendedorOrderCard key={order.id} order={order as never} pipeline={PIPELINE} />
        ))}
        {!orders?.length && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p>No hay pedidos aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}
