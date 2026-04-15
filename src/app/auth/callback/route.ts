import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Maneja el redirect de Supabase después de confirmar invitación o email.
// Supabase envía: /auth/callback?code=xxx&next=/ruta-destino
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=link_invalido`);
}
