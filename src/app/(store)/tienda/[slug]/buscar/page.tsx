"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { use } from "react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  benefits_description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
}

const SUGERENCIAS = [
  "dolor de cabeza",
  "cansancio",
  "estrés",
  "insomnio",
  "dolor muscular",
  "digestión",
  "ansiedad",
  "energía baja",
];

export default function BuscarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function buscar(texto: string) {
    if (!texto.trim()) return;
    setLoading(true);
    setSearched(true);

    const supabase = createClient();

    // Obtener tenant por slug
    const { data: tenant } = await supabase
      .schema("nexia_tienda")
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!tenant) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Búsqueda multi-campo: nombre, descripción, beneficios y tags
    const { data } = await supabase
      .schema("nexia_tienda")
      .from("products")
      .select(
        "id, name, description, benefits_description, price, image_url, category"
      )
      .eq("tenant_id", tenant.id)
      .or(
        [
          `name.ilike.%${texto}%`,
          `description.ilike.%${texto}%`,
          `benefits_description.ilike.%${texto}%`,
          `search_tags.cs.{${texto.toLowerCase()}}`,
          `category.ilike.%${texto}%`,
        ].join(",")
      )
      .limit(12);

    setResults(data ?? []);
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    buscar(query);
  }

  function usarSugerencia(s: string) {
    setQuery(s);
    buscar(s);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¿Qué malestar tienes hoy?
        </h1>
        <p className="text-gray-500 text-sm">
          Cuéntanos cómo te sientes y te sugerimos los productos adecuados de
          nuestra tienda.
        </p>
      </div>

      {/* Buscador */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: dolor de cabeza, cansancio, estrés..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "Buscar"}
        </button>
      </form>

      {/* Sugerencias rápidas */}
      {!searched && (
        <div className="mb-8">
          <p className="text-xs text-gray-400 mb-2">Sugerencias frecuentes:</p>
          <div className="flex flex-wrap gap-2">
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                onClick={() => usarSugerencia(s)}
                className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resultados */}
      {loading && (
        <div className="text-center py-12 text-gray-400">Buscando productos...</div>
      )}

      {!loading && searched && results !== null && (
        <>
          {results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-500">
                No encontramos productos para &ldquo;{query}&rdquo;.
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Intenta con otras palabras o{" "}
                <Link href={`/tienda/${slug}`} className="text-blue-600 underline">
                  ve al catálogo completo
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {results.length} producto{results.length !== 1 ? "s" : ""}{" "}
                encontrado{results.length !== 1 ? "s" : ""} para &ldquo;{query}&rdquo;
              </p>
              <div className="space-y-4">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/tienda/${slug}/producto/${product.id}`}
                    className="flex gap-4 border border-gray-200 rounded-2xl p-4 hover:border-gray-400 hover:shadow-sm transition-all"
                  >
                    {/* Imagen */}
                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 relative overflow-hidden">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">
                          📦
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      {product.benefits_description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                          {product.benefits_description}
                        </p>
                      )}
                      {product.category && (
                        <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {product.category}
                        </span>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-bold text-gray-900">
                        ${Number(product.price).toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
