import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { UserRole } from "@/types/database.types";

const PROTECTED_PREFIXES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/vendedor", roles: ["vendedor", "dueno", "administrador"] },
  { prefix: "/dueno",    roles: ["dueno", "administrador"] },
  { prefix: "/admin",    roles: ["administrador"] },
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/auth");

  // En desarrollo se omite la verificación de sesión
  if (process.env.NODE_ENV === "development") {
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/dueno/analytics";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rutas protegidas — requieren auth + rol
  const protectedMatch = PROTECTED_PREFIXES.find((p) =>
    pathname.startsWith(p.prefix)
  );

  if (protectedMatch) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // Verificar rol del usuario
    const { data: ut } = await supabase
      .schema("nexia_tienda")
      .from("user_tenants")
      .select("role")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const role = ut?.role as UserRole | undefined;

    if (!role || !protectedMatch.roles.includes(role)) {
      // Redirigir al panel que le corresponde según su rol
      const url = request.nextUrl.clone();
      url.pathname = roleHomePath(role);
      return NextResponse.redirect(url);
    }
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    // Obtener rol para redirigir al panel correcto
    const { data: ut } = await supabase
      .schema("nexia_tienda")
      .from("user_tenants")
      .select("role")
      .eq("user_id", user.id)
      .limit(1)
      .single();
    url.pathname = roleHomePath(ut?.role as UserRole | undefined);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

function roleHomePath(role: UserRole | undefined): string {
  switch (role) {
    case "administrador": return "/admin";
    case "dueno":         return "/dueno/analytics";
    case "vendedor":      return "/vendedor";
    case "cliente":       return "/tienda";
    default:              return "/auth/login";
  }
}
