import CsvUploader from "./CsvUploader";
import { getDevContext } from "@/lib/supabase/devClient";

export const dynamic = "force-dynamic";

export default async function CsvPage() {
  const { tenantId } = await getDevContext();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Carga Masiva de Productos</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Sube un archivo CSV para crear o actualizar productos en lote.
        </p>
      </div>

      {/* Formato del CSV */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-blue-800 mb-2">Formato del archivo CSV</h2>
        <p className="text-xs text-blue-700 mb-3">
          La primera fila debe ser el encabezado con exactamente estas columnas:
        </p>
        <code className="block text-xs bg-white border border-blue-200 rounded-lg px-3 py-2 text-blue-900 overflow-x-auto whitespace-pre">
          {`sku,name,price,category,description,benefits_description,search_tags,stock,low_stock_threshold`}
        </code>
        <ul className="mt-3 space-y-1 text-xs text-blue-700">
          <li><strong>sku</strong> — Clave única del producto (requerido)</li>
          <li><strong>name</strong> — Nombre del producto (requerido)</li>
          <li><strong>price</strong> — Precio en pesos sin signo $ (requerido)</li>
          <li><strong>category</strong> — Categoría (opcional)</li>
          <li><strong>description</strong> — Descripción general (opcional)</li>
          <li><strong>benefits_description</strong> — Beneficios para el cliente (opcional)</li>
          <li><strong>search_tags</strong> — Tags separados por | (opcional). Ej: dolor de cabeza|estrés</li>
          <li><strong>stock</strong> — Cantidad en inventario (default: 0)</li>
          <li><strong>low_stock_threshold</strong> — Umbral de stock bajo (default: 5)</li>
        </ul>
      </div>

      {/* Descarga de plantilla */}
      <a
        href="data:text/csv;charset=utf-8,sku,name,price,category,description,benefits_description,search_tags,stock,low_stock_threshold%0APROD-001,Ejemplo producto,199.00,suplementos,Descripci%C3%B3n del producto,Beneficios del producto,dolor de cabeza|estr%C3%A9s,10,3"
        download="plantilla_productos.csv"
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
      >
        ⬇️ Descargar plantilla CSV
      </a>

      <CsvUploader tenantId={tenantId} />
    </div>
  );
}
