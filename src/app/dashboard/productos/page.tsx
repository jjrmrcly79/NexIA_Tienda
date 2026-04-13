import { getDevContext } from "@/lib/supabase/devClient";
import ProductForm from "./ProductForm";

export default async function ProductosPage() {
  const { supabase, tenantId } = await getDevContext();

  const { data: products, error } = await supabase
    .schema("nexia_tienda")
    .from("products")
    .select(
      `
      id,
      sku,
      name,
      description,
      price,
      metadata,
      updated_at,
      inventory ( stock, low_stock_threshold )
    `
    )
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
          <p className="text-gray-500 mt-1">
            Gestiona precios, descripciones e inventario
          </p>
        </div>
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm mb-6">
          Error al cargar productos: {error.message}
        </p>
      )}

      <div className="space-y-3">
        {products?.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-12">
            No hay productos aún.
          </p>
        )}
        {products?.map((product) => (
          <ProductForm key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
