import Link from "next/link";

export default async function ConfirmarPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-5">
        <p className="text-5xl">📬</p>
        <h1 className="text-2xl font-bold text-gray-900">
          Confirma tu email
        </h1>
        <p className="text-gray-500 text-sm">
          Tu tienda fue creada exitosamente. Te enviamos un correo a{" "}
          <strong>{email ?? "tu email"}</strong> para confirmar tu cuenta.
        </p>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left space-y-2 text-sm text-blue-800">
          <p className="font-medium">¿No ves el correo?</p>
          <ul className="space-y-1 text-blue-700 text-xs">
            <li>• Revisa tu carpeta de spam o correo no deseado.</li>
            <li>• El correo puede tardar unos minutos en llegar.</li>
            <li>• Si usas Gmail, busca en la pestaña &ldquo;Promociones&rdquo;.</li>
          </ul>
        </div>
        <p className="text-sm text-gray-500">
          Una vez confirmado,{" "}
          <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
            inicia sesión aquí
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
