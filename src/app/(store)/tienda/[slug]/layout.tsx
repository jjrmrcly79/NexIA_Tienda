import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function TenantStoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let tenant: { id: string; name: string; slug: string } | null = null;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .schema("nexia_tienda")
      .from("tenants")
      .select("id, name, slug")
      .eq("slug", slug)
      .single();
    tenant = data;
  } catch {
    // Error de conexión — se muestra la pantalla de error abajo
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">🏪</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tienda no encontrada
          </h1>
          <p className="text-gray-500 text-sm mb-1">
            No existe ninguna tienda con el identificador{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
              {slug}
            </code>
          </p>
          <p className="text-gray-400 text-xs mb-6">
            Verifica que el slug sea correcto o que el tenant esté dado de alta en la base de datos.
          </p>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href={`/tienda/${slug}`}
            className="text-lg font-bold text-gray-900"
          >
            {tenant.name}
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={`/tienda/${slug}/buscar`}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Buscar por malestar
            </Link>
            <Link
              href={`/tienda/${slug}/carrito`}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Carrito
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      <footer className="border-t border-gray-100 mt-16 py-8 text-center text-xs text-gray-400">
        {tenant.name} · Powered by NexIA Tienda
      </footer>
    </div>
  );
}
