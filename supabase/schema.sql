-- ============================================================
-- NexIA Tienda — Schema inicial
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Schema
CREATE SCHEMA IF NOT EXISTS nexia_tienda;

-- ============================================================
-- Extensiones
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Tenants
-- ============================================================
CREATE TABLE nexia_tienda.tenants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Productos
-- ============================================================
CREATE TABLE nexia_tienda.products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES nexia_tienda.tenants(id) ON DELETE CASCADE,
  sku          TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  price        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, sku)
);

-- ============================================================
-- Inventario
-- ============================================================
CREATE TABLE nexia_tienda.inventory (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id           UUID NOT NULL REFERENCES nexia_tienda.products(id) ON DELETE CASCADE,
  tenant_id            UUID NOT NULL REFERENCES nexia_tienda.tenants(id) ON DELETE CASCADE,
  stock                INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold  INTEGER NOT NULL DEFAULT 5,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id)
);

-- ============================================================
-- Pedidos
-- ============================================================
CREATE TABLE nexia_tienda.orders (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                UUID NOT NULL REFERENCES nexia_tienda.tenants(id) ON DELETE CASCADE,
  status                   TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  total                    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT,           -- preparado para Stripe (inactivo)
  metadata                 JSONB,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Items de pedido
-- ============================================================
CREATE TABLE nexia_tienda.order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES nexia_tienda.orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES nexia_tienda.products(id),
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price  NUMERIC(12, 2) NOT NULL
);

-- ============================================================
-- Índices
-- ============================================================
CREATE INDEX idx_products_tenant   ON nexia_tienda.products(tenant_id);
CREATE INDEX idx_inventory_tenant  ON nexia_tienda.inventory(tenant_id);
CREATE INDEX idx_orders_tenant     ON nexia_tienda.orders(tenant_id);
CREATE INDEX idx_orders_status     ON nexia_tienda.orders(status);
CREATE INDEX idx_order_items_order ON nexia_tienda.order_items(order_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE nexia_tienda.tenants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexia_tienda.products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexia_tienda.inventory   ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexia_tienda.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexia_tienda.order_items ENABLE ROW LEVEL SECURITY;

-- Tabla de relación usuario ↔ tenant (para RLS)
CREATE TABLE nexia_tienda.user_tenants (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL REFERENCES nexia_tienda.tenants(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  PRIMARY KEY (user_id, tenant_id)
);
ALTER TABLE nexia_tienda.user_tenants ENABLE ROW LEVEL SECURITY;

-- Función helper: devuelve los tenant_ids del usuario autenticado
CREATE OR REPLACE FUNCTION nexia_tienda.my_tenant_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY(
    SELECT tenant_id FROM nexia_tienda.user_tenants
    WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Policies: cada usuario solo ve datos de sus tenants
CREATE POLICY "tenants: solo los míos"
  ON nexia_tienda.tenants FOR ALL
  USING (id = ANY(nexia_tienda.my_tenant_ids()));

CREATE POLICY "products: solo los míos"
  ON nexia_tienda.products FOR ALL
  USING (tenant_id = ANY(nexia_tienda.my_tenant_ids()));

CREATE POLICY "inventory: solo los míos"
  ON nexia_tienda.inventory FOR ALL
  USING (tenant_id = ANY(nexia_tienda.my_tenant_ids()));

CREATE POLICY "orders: solo los míos"
  ON nexia_tienda.orders FOR ALL
  USING (tenant_id = ANY(nexia_tienda.my_tenant_ids()));

CREATE POLICY "order_items: solo los míos"
  ON nexia_tienda.order_items FOR ALL
  USING (
    order_id IN (
      SELECT id FROM nexia_tienda.orders
      WHERE tenant_id = ANY(nexia_tienda.my_tenant_ids())
    )
  );

CREATE POLICY "user_tenants: solo los míos"
  ON nexia_tienda.user_tenants FOR ALL
  USING (user_id = auth.uid());

-- ============================================================
-- Datos de prueba (opcional — comentar en producción)
-- ============================================================

-- Tenant de prueba
INSERT INTO nexia_tienda.tenants (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Tienda Demo', 'demo');

-- Productos de prueba
INSERT INTO nexia_tienda.products (tenant_id, sku, name, description, price, metadata) VALUES
  ('00000000-0000-0000-0000-000000000001', 'PROD-001', 'Producto Alpha', 'Descripción del producto Alpha', 299.00, '{"marca": "NexIA", "categoria": "electronica"}'),
  ('00000000-0000-0000-0000-000000000001', 'PROD-002', 'Producto Beta', NULL, 149.50, NULL),
  ('00000000-0000-0000-0000-000000000001', 'PROD-003', 'Producto Gamma', 'Descripción completa aquí', 89.00, '{"marca": "NexIA", "categoria": "accesorios"}');

-- Inventario de prueba
INSERT INTO nexia_tienda.inventory (product_id, tenant_id, stock, low_stock_threshold)
SELECT p.id, p.tenant_id,
  CASE p.sku
    WHEN 'PROD-001' THEN 50
    WHEN 'PROD-002' THEN 3   -- stock bajo
    WHEN 'PROD-003' THEN 20
  END,
  5
FROM nexia_tienda.products p
WHERE p.tenant_id = '00000000-0000-0000-0000-000000000001';

-- Pedido de prueba
INSERT INTO nexia_tienda.orders (tenant_id, status, total)
VALUES ('00000000-0000-0000-0000-000000000001', 'pending', 448.50);
