import { redirect } from "next/navigation";

// Redirige a la tienda demo por defecto
// En producción cada tenant tiene su propia URL: /tienda/[slug]
export default function TiendaRootPage() {
  redirect("/tienda/demo");
}
