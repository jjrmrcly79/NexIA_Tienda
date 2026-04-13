"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderStatus } from "./page";

interface OrderItem {
  quantity: number;
  unit_price: number;
  products: { name: string; sku: string } | null;
}

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  customer_name: string | null;
  notes: string | null;
  created_at: string;
  order_items: OrderItem[];
}

interface PipelineStep {
  status: OrderStatus;
  label: string;
  color: string;
  icon: string;
}

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  recibido:       "en_preparacion",
  en_preparacion: "listo_entrega",
  listo_entrega:  "entregado",
  entregado:      null,
  cancelado:      null,
};

export default function VendedorOrderCard({
  order,
  pipeline,
}: {
  order: Order;
  pipeline: PipelineStep[];
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [saving, setSaving] = useState(false);

  const current = pipeline.find((p) => p.status === status);
  const nextStatus = NEXT_STATUS[status];
  const nextStep = nextStatus ? pipeline.find((p) => p.status === nextStatus) : null;

  async function avanzar() {
    if (!nextStatus) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .schema("nexia_tienda")
      .from("orders")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    setStatus(nextStatus);
    setSaving(false);
  }

  async function cancelar() {
    if (status === "cancelado" || status === "entregado") return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .schema("nexia_tienda")
      .from("orders")
      .update({ status: "cancelado", updated_at: new Date().toISOString() })
      .eq("id", order.id);
    setStatus("cancelado");
    setSaving(false);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8)}</p>
          {order.customer_name && (
            <p className="text-sm font-medium text-gray-800 mt-0.5">{order.customer_name}</p>
          )}
          <p className="text-xs text-gray-400">
            {new Date(order.created_at).toLocaleString("es-MX", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900 text-lg">
            ${Number(order.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
          <span
            className={`inline-block text-xs px-2 py-0.5 rounded-full border mt-1 ${current?.color}`}
          >
            {current?.icon} {current?.label}
          </span>
        </div>
      </div>

      {/* Items */}
      {order.order_items?.length > 0 && (
        <div className="border-t border-gray-100 pt-3 mb-3 space-y-1">
          {order.order_items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm text-gray-600">
              <span>
                {item.products?.name ?? "Producto"}{" "}
                <span className="text-gray-400">×{item.quantity}</span>
              </span>
              <span>${(item.unit_price * item.quantity).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      )}

      {order.notes && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">
          📝 {order.notes}
        </p>
      )}

      {/* Acciones */}
      {status !== "entregado" && status !== "cancelado" && (
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          {nextStep && (
            <button
              onClick={avanzar}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "..." : `${nextStep.icon} ${nextStep.label}`}
            </button>
          )}
          <button
            onClick={cancelar}
            disabled={saving}
            className="text-xs text-red-500 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
