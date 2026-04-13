import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createBrowser } from "@supabase/supabase-js";

// GET /api/debug — prueba de conectividad (solo desarrollo)
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Solo disponible en desarrollo" }, { status: 403 });
  }

  const results: Record<string, unknown> = {
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon_key_prefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) + "...",
    service_role_prefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) + "...",
  };

  // Test 1: anon key — SELECT público
  try {
    const anon = createBrowser(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await anon
      .schema("nexia_tienda")
      .from("tenants")
      .select("id, name")
      .limit(1);
    results.anon_db = error ? { error: error.message, code: error.code } : { ok: true, rows: data?.length };
  } catch (e) {
    results.anon_db = { exception: String(e) };
  }

  // Test 2: service role — SELECT con admin
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .schema("nexia_tienda")
      .from("tenants")
      .select("id, name")
      .limit(1);
    results.admin_db = error ? { error: error.message, code: error.code } : { ok: true, rows: data?.length };
  } catch (e) {
    results.admin_db = { exception: String(e) };
  }

  // Test 3: anon key — signUp con email falso (solo para ver el tipo de error)
  try {
    const anon = createBrowser(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await anon.auth.signUp({
      email: `test_debug_${Date.now()}@nexia-test-never-real.invalid`,
      password: "Test1234!Debug",
    });
    results.auth_signup = error
      ? { error: error.message, status: error.status, code: (error as {code?: string}).code }
      : { ok: true, user_id: data.user?.id?.slice(0, 8), session: !!data.session };
  } catch (e) {
    results.auth_signup = { exception: String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
