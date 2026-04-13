import ImagenGeneratorPanel from "./ImagenGeneratorPanel";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function ImagenesPage() {
  const supabase = createAdminClient();

  const { data: products } = await supabase
    .schema("nexia_tienda")
    .from("products")
    .select(
      `id, name, sku, description, benefits_description, category, image_url,
       tenants ( name, slug )`
    )
    .is("image_url", null)
    .order("name")
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Generación de Imágenes con IA</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Genera imágenes profesionales para los productos de tus tenants que aún no tienen foto.
        </p>
      </div>
      <ImagenGeneratorPanel products={products as never ?? []} />
    </div>
  );
}
