import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">NexIA Tienda</h1>
          <p className="text-gray-400">Plataforma multi-tenant de comercio</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Acceso por rol</p>

          <Link
            href="/tienda/demo"
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors text-left"
          >
            <span className="text-2xl">🛍️</span>
            <div>
              <p className="font-medium text-white">Cliente</p>
              <p className="text-xs text-gray-400">Explora el catálogo y busca por malestares</p>
            </div>
          </Link>

          <Link
            href="/vendedor"
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors text-left"
          >
            <span className="text-2xl">🧾</span>
            <div>
              <p className="font-medium text-white">Vendedor</p>
              <p className="text-xs text-gray-400">Gestiona pedidos y usa la calculadora POS</p>
            </div>
          </Link>

          <Link
            href="/dueno/analytics"
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors text-left"
          >
            <span className="text-2xl">🏪</span>
            <div>
              <p className="font-medium text-white">Dueño</p>
              <p className="text-xs text-gray-400">Productos, CSV, analytics y dataismo</p>
            </div>
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors text-left"
          >
            <span className="text-2xl">🔧</span>
            <div>
              <p className="font-medium text-white">Administrador</p>
              <p className="text-xs text-gray-400">Infraestructura, imágenes IA y branding</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/registro"
            className="inline-block bg-blue-600 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Crear tienda gratis
          </Link>
          <Link
            href="/auth/login"
            className="inline-block text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Iniciar sesión →
          </Link>
        </div>
      </div>
    </div>
  );
}
