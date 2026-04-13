"use client";

import { useState } from "react";

interface Summary {
  total_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  revenue_today: number;
  revenue_this_month: number;
}

interface HourData {
  hour: number;
  order_count: number;
  revenue: number;
}

interface TopProduct {
  product_id: string;
  name: string;
  sku: string;
  units_sold: number;
  revenue: number;
  category: string | null;
}

interface InventorySuggestion {
  product_id: string;
  name: string;
  category: string | null;
  stock: number;
  low_stock_threshold: number;
  units_sold: number;
  sugerencia: "SIN_STOCK" | "REABASTECER" | "BAJO" | "OK";
}

interface OrderItem {
  quantity: number;
  unit_price: number;
  products: { name: string } | null;
}

interface RecentOrder {
  id: string;
  status: string;
  total: number;
  customer_name: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const STATUS_COLOR: Record<string, string> = {
  recibido:       "bg-amber-100 text-amber-700",
  en_preparacion: "bg-blue-100 text-blue-700",
  listo_entrega:  "bg-purple-100 text-purple-700",
  entregado:      "bg-green-100 text-green-700",
  cancelado:      "bg-red-100 text-red-700",
};

const SUGERENCIA_COLOR: Record<string, string> = {
  SIN_STOCK:   "bg-red-100 text-red-700 border-red-200",
  REABASTECER: "bg-orange-100 text-orange-700 border-orange-200",
  BAJO:        "bg-amber-100 text-amber-700 border-amber-200",
  OK:          "bg-green-100 text-green-700 border-green-200",
};

export default function AnalyticsCharts({
  summary,
  byHour,
  topProducts,
  inventorySuggestions,
  recentOrders,
}: {
  summary: Summary | null;
  byHour: HourData[];
  topProducts: TopProduct[];
  inventorySuggestions: InventorySuggestion[];
  recentOrders: RecentOrder[];
}) {
  const [drillOrder, setDrillOrder] = useState<RecentOrder | null>(null);

  const maxHourRevenue = Math.max(...byHour.map((h) => Number(h.revenue)), 1);
  const maxHourOrders = Math.max(...byHour.map((h) => h.order_count), 1);
  const maxProductRevenue = Math.max(...topProducts.map((p) => Number(p.revenue)), 1);

  const fmt = (n: number) =>
    n.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

  const criticalInventory = inventorySuggestions.filter(
    (s) => s.sugerencia === "SIN_STOCK" || s.sugerencia === "REABASTECER"
  );

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Ingresos hoy",      value: fmt(Number(summary?.revenue_today ?? 0)),      sub: "pedidos del día" },
          { label: "Ingresos del mes",  value: fmt(Number(summary?.revenue_this_month ?? 0)),  sub: "mes en curso" },
          { label: "Total histórico",   value: fmt(Number(summary?.total_revenue ?? 0)),        sub: "todos los tiempos" },
          { label: "Total pedidos",     value: summary?.total_orders ?? 0,                     sub: "histórico" },
          { label: "Entregados",        value: summary?.delivered_orders ?? 0,                 sub: `${summary?.total_orders ? Math.round((summary.delivered_orders / summary.total_orders) * 100) : 0}% del total` },
          { label: "Cancelados",        value: summary?.cancelled_orders ?? 0,                 sub: "pedidos cancelados" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Alerta inventario crítico */}
      {criticalInventory.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-800 mb-2">
            ⚠️ {criticalInventory.length} producto{criticalInventory.length !== 1 ? "s" : ""} requieren atención inmediata
          </p>
          <div className="flex flex-wrap gap-2">
            {criticalInventory.map((item) => (
              <span
                key={item.product_id}
                className={`text-xs px-2 py-1 rounded-full border ${SUGERENCIA_COLOR[item.sugerencia]}`}
              >
                {item.name} · stock: {item.stock}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por hora del día */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-800 mb-1">Ventas por hora</h2>
          <p className="text-xs text-gray-400 mb-4">¿A qué hora vendes más?</p>
          {byHour.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>
          ) : (
            <div className="space-y-1.5">
              {Array.from({ length: 24 }, (_, h) => h).map((h) => {
                const data = byHour.find((d) => d.hour === h);
                const rev = Number(data?.revenue ?? 0);
                const orders = data?.order_count ?? 0;
                const pct = (rev / maxHourRevenue) * 100;
                const isDay = h >= 8 && h <= 20;
                return (
                  <div key={h} className="flex items-center gap-2 text-xs">
                    <span className="w-8 text-right text-gray-400">{h}:00</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded relative overflow-hidden">
                      <div
                        className={`h-full rounded transition-all ${
                          pct > 0
                            ? isDay
                              ? "bg-blue-400"
                              : "bg-indigo-300"
                            : ""
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                      {pct > 10 && (
                        <span className="absolute inset-0 flex items-center px-2 text-white text-xs font-medium">
                          {fmt(rev)}
                        </span>
                      )}
                    </div>
                    <span className="w-6 text-right text-gray-400">{orders > 0 ? orders : ""}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-800 mb-1">Top productos</h2>
          <p className="text-xs text-gray-400 mb-4">Por ingresos generados</p>
          {topProducts.filter((p) => p.units_sold > 0).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin ventas aún</p>
          ) : (
            <div className="space-y-3">
              {topProducts
                .filter((p) => p.units_sold > 0)
                .slice(0, 8)
                .map((prod, idx) => {
                  const pct = (Number(prod.revenue) / maxProductRevenue) * 100;
                  return (
                    <div key={prod.product_id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-gray-400 w-4 text-right">{idx + 1}.</span>
                          <span className="font-medium text-gray-800 truncate max-w-[140px]">
                            {prod.name}
                          </span>
                          {prod.category && (
                            <span className="text-gray-400">· {prod.category}</span>
                          )}
                        </span>
                        <span className="text-gray-500 flex-shrink-0 ml-2">
                          {prod.units_sold} uds · {fmt(Number(prod.revenue))}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Inventario con sugerencias */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Sugerencias de inventario</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Basado en ventas históricas y stock actual
          </p>
        </div>
        {inventorySuggestions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin datos de inventario</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Producto</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 hidden sm:table-cell">Stock</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 hidden md:table-cell">Vendidos</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventorySuggestions.map((item) => (
                <tr key={item.product_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    {item.category && (
                      <p className="text-xs text-gray-400">{item.category}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="text-gray-700">{item.stock}</span>
                    <span className="text-gray-400 text-xs"> / mín {item.low_stock_threshold}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">
                    {item.units_sold}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${SUGERENCIA_COLOR[item.sugerencia]}`}
                    >
                      {item.sugerencia === "SIN_STOCK"   ? "Sin stock" :
                       item.sugerencia === "REABASTECER" ? "Reabastecer" :
                       item.sugerencia === "BAJO"        ? "Stock bajo" : "OK"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pedidos recientes con drill-down */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Pedidos recientes</h2>
          <p className="text-xs text-gray-400 mt-0.5">Haz clic en un pedido para ver el desglose</p>
        </div>
        <div className="divide-y divide-gray-100">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin pedidos aún</p>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id}>
                <button
                  onClick={() =>
                    setDrillOrder(drillOrder?.id === order.id ? null : order)
                  }
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {order.status}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {order.customer_name ?? `#${order.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleString("es-MX", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{fmt(Number(order.total))}</span>
                    <span className="text-gray-400 text-xs">
                      {drillOrder?.id === order.id ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Drill-down */}
                {drillOrder?.id === order.id && (
                  <div className="px-5 pb-4 pt-1 bg-gray-50 border-t border-gray-100">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500">
                          <th className="text-left py-1 font-medium">Producto</th>
                          <th className="text-right py-1 font-medium">Cant.</th>
                          <th className="text-right py-1 font-medium">P. unitario</th>
                          <th className="text-right py-1 font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {order.order_items.map((item, i) => (
                          <tr key={i}>
                            <td className="py-1 text-gray-700">
                              {item.products?.name ?? "Producto"}
                            </td>
                            <td className="py-1 text-right text-gray-600">{item.quantity}</td>
                            <td className="py-1 text-right text-gray-600">
                              {fmt(Number(item.unit_price))}
                            </td>
                            <td className="py-1 text-right font-medium text-gray-800">
                              {fmt(Number(item.unit_price) * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-gray-300">
                          <td colSpan={3} className="py-1.5 text-right font-semibold text-gray-700">
                            Total:
                          </td>
                          <td className="py-1.5 text-right font-bold text-gray-900">
                            {fmt(Number(order.total))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
