import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Cliente con service role — bypass de RLS
// Solo usar en server components / route handlers, NUNCA en el cliente
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está definida en .env.local");
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false } }
  );
}
