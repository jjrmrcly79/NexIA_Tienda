import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// POST /api/registro
// El usuario YA está creado y autenticado (signUp desde el browser).
// Este endpoint solo crea el tenant y asigna el rol.
export async function POST(req: NextRequest) {
  const { storeName, slug: rawSlug, userId } = await req.json();

  if (!storeName || !userId) {
    return NextResponse.json(
      { error: "storeName y userId son requeridos." },
      { status: 400 }
    );
  }

  const slug = slugify(rawSlug || storeName);

  if (!slug || slug.length < 3) {
    return NextResponse.json(
      { error: "El identificador de tienda debe tener al menos 3 caracteres." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verificar que el slug no esté ocupado
  const { data: existing } = await admin
    .schema("nexia_tienda")
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: `El identificador "${slug}" ya está en uso. Elige otro nombre.` },
      { status: 409 }
    );
  }

  // Crear el tenant
  const { data: tenant, error: tenantError } = await admin
    .schema("nexia_tienda")
    .from("tenants")
    .insert({ name: storeName, slug })
    .select("id, slug")
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json(
      { error: "Error al crear la tienda. Intenta de nuevo." },
      { status: 500 }
    );
  }

  // Asignar rol de dueño
  const { error: roleError } = await admin
    .schema("nexia_tienda")
    .from("user_tenants")
    .insert({ user_id: userId, tenant_id: tenant.id, role: "dueno" });

  if (roleError) {
    // Limpiar el tenant si falla el rol
    await admin.schema("nexia_tienda").from("tenants").delete().eq("id", tenant.id);
    return NextResponse.json(
      { error: "Error al asignar permisos. Intenta de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ slug: tenant.slug, tenantId: tenant.id });
}

// GET /api/registro?slug=xxx — verificar disponibilidad
export async function GET(req: NextRequest) {
  const slug = slugify(req.nextUrl.searchParams.get("slug") ?? "");

  if (!slug || slug.length < 3) {
    return NextResponse.json({ available: false, slug });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .schema("nexia_tienda")
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .single();

  return NextResponse.json({ available: !data, slug });
}
