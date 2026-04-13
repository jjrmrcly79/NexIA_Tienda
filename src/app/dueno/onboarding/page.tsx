import { getDevContext } from "@/lib/supabase/devClient";
import { redirect } from "next/navigation";
import OnboardingWizard from "./OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { supabase, tenantId } = await getDevContext();

  const { data: tenant } = await supabase
    .schema("nexia_tienda")
    .from("tenants")
    .select("id, name, slug")
    .eq("id", tenantId)
    .single();

  if (!tenant) redirect("/auth/login");

  const { count: productCount } = await supabase
    .schema("nexia_tienda")
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  // Si ya tiene productos salteamos el onboarding
  if ((productCount ?? 0) > 0) {
    redirect("/dueno/analytics");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-6 py-12">
      <OnboardingWizard tenant={tenant} tenantId={tenantId} />
    </div>
  );
}
