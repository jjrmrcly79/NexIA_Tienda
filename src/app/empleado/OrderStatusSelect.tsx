"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUSES = [
  { value: "pending",    label: "Pendiente"  },
  { value: "processing", label: "Procesando" },
  { value: "shipped",    label: "Enviado"    },
  { value: "delivered",  label: "Entregado"  },
  { value: "cancelled",  label: "Cancelado"  },
];

export default function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(newStatus: string) {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .schema("nexia_tienda")
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    setStatus(newStatus);
    setSaving(false);
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
