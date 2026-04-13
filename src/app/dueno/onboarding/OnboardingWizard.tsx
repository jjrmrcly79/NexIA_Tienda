"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

const STEPS = [
  { id: 1, label: "Bienvenida" },
  { id: 2, label: "Primer producto" },
  { id: 3, label: "Vista previa" },
];

export default function OnboardingWizard({
  tenant,
  tenantId,
}: {
  tenant: Tenant;
  tenantId: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [productCreated, setProductCreated] = useState(false);

  const [product, setProduct] = useState({
    name: "",
    price: "",
    category: "",
    benefits_description: "",
    search_tags: "",
    stock: "10",
  });

  function handleProductChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setProduct((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const tags = product.search_tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const sku = `PROD-${Date.now().toString(36).toUpperCase()}`;

    const { data: newProd, error } = await supabase
      .schema("nexia_tienda")
      .from("products")
      .insert({
        tenant_id: tenantId,
        sku,
        name: product.name,
        price: parseFloat(product.price),
        category: product.category || null,
        benefits_description: product.benefits_description || null,
        search_tags: tags,
      })
      .select("id")
      .single();

    if (!error && newProd) {
      await supabase
        .schema("nexia_tienda")
        .from("inventory")
        .insert({
          product_id: newProd.id,
          tenant_id: tenantId,
          stock: parseInt(product.stock),
          low_stock_threshold: 5,
        });
      setProductCreated(true);
    }

    setSaving(false);
    setStep(3);
  }

  function skipProduct() {
    setStep(3);
  }

  function finish() {
    router.push("/dueno/analytics");
  }

  return (
    <div className="max-w-xl w-full">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step > s.id
                  ? "bg-green-500 text-white"
                  : step === s.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {step > s.id ? "✓" : s.id}
            </div>
            <span
              className={`text-xs hidden sm:block ${
                step === s.id ? "text-gray-800 font-medium" : "text-gray-400"
              }`}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`w-10 h-0.5 mx-1 ${
                  step > s.id ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Paso 1: Bienvenida ── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-5">
          <p className="text-5xl">🎉</p>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ¡Bienvenido a NexIA Tienda!
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Tu tienda <strong>{tenant.name}</strong> está activa.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Tu tienda pública
            </p>
            <div className="flex items-center justify-between">
              <code className="text-sm text-blue-800">
                /tienda/{tenant.slug}
              </code>
              <Link
                href={`/tienda/${tenant.slug}`}
                target="_blank"
                className="text-xs text-blue-600 hover:underline"
              >
                Ver ahora ↗
              </Link>
            </div>
          </div>

          <div className="text-left space-y-2">
            <p className="text-sm font-medium text-gray-700">
              En 2 pasos rápidos vas a:
            </p>
            <ul className="text-sm text-gray-500 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">①</span>
                Agregar tu primer producto al catálogo
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">②</span>
                Ver cómo queda tu tienda antes de compartirla
              </li>
            </ul>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            Empezar →
          </button>
        </div>
      )}

      {/* ── Paso 2: Primer producto ── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Agrega tu primer producto
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Solo los datos esenciales. Después puedes editarlo o subir más por CSV.
            </p>
          </div>

          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nombre del producto *
              </label>
              <input
                name="name"
                value={product.name}
                onChange={handleProductChange}
                required
                placeholder="Ej: Té de manzanilla relajante"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Precio (MXN) *
                </label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.price}
                  onChange={handleProductChange}
                  required
                  placeholder="99.00"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Categoría
                </label>
                <input
                  name="category"
                  value={product.category}
                  onChange={handleProductChange}
                  placeholder="Ej: tés, suplementos"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Beneficios{" "}
                <span className="text-gray-400 font-normal">
                  (lo que verá el cliente)
                </span>
              </label>
              <textarea
                name="benefits_description"
                value={product.benefits_description}
                onChange={handleProductChange}
                rows={2}
                placeholder="Ej: Alivia el estrés, mejora el sueño, relaja los músculos..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tags de búsqueda{" "}
                <span className="text-gray-400 font-normal">(separados por coma)</span>
              </label>
              <input
                name="search_tags"
                value={product.search_tags}
                onChange={handleProductChange}
                placeholder="estrés, insomnio, relajación, dolor de cabeza"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Tus clientes encontrarán este producto al buscar por estos términos.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={skipProduct}
                className="flex-shrink-0 border border-gray-300 text-gray-500 text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Omitir por ahora
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white text-sm py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Guardando..." : "Guardar producto →"}
              </button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              ¿Tienes muchos productos?{" "}
              <Link
                href="/dueno/csv"
                className="text-blue-600 hover:underline"
              >
                Súbelos todos con un CSV
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Paso 3: Vista previa ── */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6 text-center">
          <div>
            <p className="text-4xl mb-3">
              {productCreated ? "🚀" : "👀"}
            </p>
            <h2 className="text-xl font-bold text-gray-900">
              {productCreated
                ? "¡Primer producto listo!"
                : "Tu tienda está lista"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {productCreated
                ? "Puedes ver cómo luce tu tienda ahora mismo."
                : "Puedes agregar productos cuando quieras desde el panel."}
            </p>
          </div>

          {/* Preview card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Tu tienda pública
            </p>
            <p className="text-lg font-bold text-gray-900">{tenant.name}</p>
            <div className="flex items-center justify-between">
              <code className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                /tienda/{tenant.slug}
              </code>
              <Link
                href={`/tienda/${tenant.slug}`}
                target="_blank"
                className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
              >
                Abrir tienda ↗
              </Link>
            </div>
          </div>

          {/* Próximos pasos */}
          <div className="text-left bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Próximos pasos sugeridos
            </p>
            <ul className="text-sm text-blue-800 space-y-1.5">
              {!productCreated && (
                <li className="flex items-start gap-2">
                  <span>📦</span>
                  <Link href="/dueno/productos/nuevo" className="hover:underline">
                    Agregar tus productos al catálogo
                  </Link>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span>🖼️</span>
                <Link href="/dueno/productos" className="hover:underline">
                  Subir fotos a tus productos
                </Link>
              </li>
              <li className="flex items-start gap-2">
                <span>📁</span>
                <Link href="/dueno/csv" className="hover:underline">
                  Importar catálogo completo con CSV
                </Link>
              </li>
              <li className="flex items-start gap-2">
                <span>📊</span>
                <span>Ver analytics cuando lleguen tus primeras ventas</span>
              </li>
            </ul>
          </div>

          <button
            onClick={finish}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            Ir a mi panel de control →
          </button>
        </div>
      )}
    </div>
  );
}
