import BrandingPanel from "./BrandingPanel";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  const supabase = createAdminClient();

  const { data: tenants } = await supabase
    .schema("nexia_tienda")
    .from("tenants")
    .select("id, name, slug")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Branding de Marca</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Genera identidad visual completa para los tenants de la plataforma.
        </p>
      </div>
      <BrandingPanel tenants={tenants ?? []} />
    </div>
  );
}
