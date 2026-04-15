import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { UserRole } from "@/types/database.types";

const PROTECTED_PREFIXES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/vendedor", roles: ["vendedor", "dueno", "administrador"] },
  { prefix: "/dueno", roles: ["dueno", "administrador"] },
  { prefix: "/admin", roles: ["administrador"] },
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
  const isAuthRoute = pathname.startsWith("/auth") || pathname === "/";

  // En desarrollo se omite la verificación de sesión
  if (process.env.NODE_ENV === "development") {
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      const devRole = (process.env.DEV_ROLE ?? "dueno") as UserRole;
      url.pathname = roleHomePath(devRole);
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

    // Obtener todos los roles del usuario (puede tener varios tenants)
    const { data: uts } = await supabase
      .schema("nexia_tienda")
      .from("user_tenants")
      .select("role")
      .eq("user_id", user.id);

    const roles = (uts ?? []).map((r) => r.role as UserRole);
    const topRole = topPriorityRole(roles);

    if (!roles.some((r) => protectedMatch.roles.includes(r))) {
      // No tiene ningún rol que permita esta ruta
      const url = request.nextUrl.clone();
      url.pathname = roleHomePath(topRole);
      return NextResponse.redirect(url);
    }
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    // Obtener todos los roles para redirigir al panel correcto
    const { data: uts } = await supabase
      .schema("nexia_tienda")
      .from("user_tenants")
      .select("role")
      .eq("user_id", user.id);

    const roles = (uts ?? []).map((r) => r.role as UserRole);
    url.pathname = roleHomePath(topPriorityRole(roles));
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

function roleHomePath(role: UserRole | undefined): string {
  switch (role) {
    case "administrador": return "/admin";
    case "dueno": return "/dueno/analytics";
    case "vendedor": return "/vendedor";
    case "cliente": return "/tienda";
    default: return "/auth/login";
  }
}

// Devuelve el rol de mayor prioridad de una lista.
// Un usuario puede tener varios roles en distintos tenants.
const ROLE_PRIORITY: UserRole[] = ["administrador", "dueno", "vendedor", "cliente"];

function topPriorityRole(roles: UserRole[]): UserRole | undefined {
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r)) return r;
  }
  return undefined;
}
