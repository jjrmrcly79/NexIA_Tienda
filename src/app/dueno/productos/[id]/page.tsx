import { getDevContext } from "@/lib/supabase/devClient";
import { notFound } from "next/navigation";
import ProductEditor from "./ProductEditor";

export const dynamic = "force-dynamic";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, tenantId } = await getDevContext();
  const isNew = id === "nuevo";

  let product = null;

  if (!isNew) {
    const { data } = await supabase
      .schema("nexia_tienda")
      .from("products")
      .select(
        `id, sku, name, description, benefits_description, price,
         image_url, category, search_tags, metadata,
         inventory ( id, stock, low_stock_threshold )`
      )
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (!data) notFound();
    product = data;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        {isNew ? "Nuevo producto" : `Editar: ${product?.name}`}
      </h1>
      <ProductEditor product={product as never} tenantId={tenantId} isNew={isNew} />
    </div>
  );
}
