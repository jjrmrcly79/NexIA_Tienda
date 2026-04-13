"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProductDeleteButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${productName}"? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    const supabase = createClient();
    await supabase
      .schema("nexia_tienda")
      .from("products")
      .delete()
      .eq("id", productId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50"
    >
      {loading ? "..." : "Eliminar"}
    </button>
  );
}
