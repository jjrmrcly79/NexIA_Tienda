import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DuenoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | null = null;

  if (process.env.NODE_ENV !== "development") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");
    userEmail = user.email ?? null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <h1 className="font-bold text-gray-900">Panel Dueño</h1>
          {userEmail ? (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{userEmail}</p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">Modo desarrollo</p>
          )}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink href="/dueno/analytics" icon="📊">Analytics</NavLink>
          <NavLink href="/dueno/productos" icon="📦">Productos</NavLink>
          <NavLink href="/dueno/csv" icon="📁">Carga CSV</NavLink>
          <NavLink href="/dueno/equipo" icon="👥">Equipo</NavLink>
        </nav>
        <div className="p-3 border-t border-gray-200">
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-50"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
    >
      <span>{icon}</span>
      {children}
    </Link>
  );
}
