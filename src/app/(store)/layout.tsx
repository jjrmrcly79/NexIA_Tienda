// Layout passthrough — cada sub-ruta define su propio header.
// tienda/[slug]/layout.tsx → header del tenant
// tienda/carrito/page.tsx  → header inline
export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
