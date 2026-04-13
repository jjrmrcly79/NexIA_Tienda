// Helper para desarrollo: devuelve el cliente, tenant_id y rol a usar.
// En producción el tenant_id y role vienen del usuario autenticado.

import { createAdminClient } from "./admin";
import { createClient } from "./server";
import type { UserRole } from "@/types/database.types";

export interface DevContext {
  supabase: ReturnType<typeof createAdminClient>;
  tenantId: string;
  role: UserRole;
}

export async function getDevContext(): Promise<DevContext> {
  if (process.env.NODE_ENV === "development") {
    return {
      supabase: createAdminClient(),
      tenantId: process.env.DEV_TENANT_ID ?? "00000000-0000-0000-0000-000000000001",
      role: (process.env.DEV_ROLE ?? "dueno") as UserRole,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ut } = await supabase
    .schema("nexia_tienda")
    .from("user_tenants")
    .select("tenant_id, role")
    .eq("user_id", user!.id)
    .limit(1)
    .single();

  return {
    supabase: supabase as unknown as ReturnType<typeof createAdminClient>,
    tenantId: ut!.tenant_id,
    role: ut!.role as UserRole,
  };
}
