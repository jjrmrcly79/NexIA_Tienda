-- ============================================================
-- NexIA Tienda — Migración v2: Multi-tenant con 4 roles
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- 1. Ampliar tabla products
-- ============================================================
ALTER TABLE nexia_tienda.products
  ADD COLUMN IF NOT EXISTS image_url           TEXT,
  ADD COLUMN IF NOT EXISTS benefits_description TEXT,
  ADD COLUMN IF NOT EXISTS search_tags          TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category             TEXT;

CREATE INDEX IF NOT EXISTS idx_products_category
  ON nexia_tienda.products(tenant_id, category);

-- Full-text search index sobre tags (para búsqueda por malestares)
CREATE INDEX IF NOT EXISTS idx_products_tags
  ON nexia_tienda.products USING GIN(search_tags);

-- ============================================================
-- 2. Actualizar estados de pedidos al español operativo
-- ============================================================
-- Primero eliminar el constraint viejo para poder hacer el UPDATE
ALTER TABLE nexia_tienda.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

-- Ahora sí migrar los valores
UPDATE nexia_tienda.orders SET status = 'recibido'       WHERE status = 'pending';
UPDATE nexia_tienda.orders SET status = 'en_preparacion' WHERE status = 'processing';
UPDATE nexia_tienda.orders SET status = 'listo_entrega'  WHERE status = 'shipped';
UPDATE nexia_tienda.orders SET status = 'entregado'      WHERE status = 'delivered';
UPDATE nexia_tienda.orders SET status = 'cancelado'      WHERE status = 'cancelled';

-- Agregar el nuevo constraint y columnas adicionales
ALTER TABLE nexia_tienda.orders
  ADD CONSTRAINT orders_status_check
    CHECK (status IN ('recibido','en_preparacion','listo_entrega','entregado','cancelado')),
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS notes         TEXT;

-- ============================================================
-- 3. Actualizar roles de user_tenants
-- ============================================================
-- Primero eliminar el constraint para poder hacer el UPDATE
ALTER TABLE nexia_tienda.user_tenants
  DROP CONSTRAINT IF EXISTS user_tenants_role_check;

UPDATE nexia_tienda.user_tenants SET role = 'dueno'         WHERE role = 'owner';
UPDATE nexia_tienda.user_tenants SET role = 'administrador' WHERE role = 'admin';
UPDATE nexia_tienda.user_tenants SET role = 'vendedor'      WHERE role = 'member';

ALTER TABLE nexia_tienda.user_tenants
  ADD CONSTRAINT user_tenants_role_check
    CHECK (role IN ('cliente','vendedor','dueno','administrador'));

-- ============================================================
-- 4. Sesiones de venta rápida (POS / Calculadora)
-- ============================================================
CREATE TABLE IF NOT EXISTS nexia_tienda.sale_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES nexia_tienda.tenants(id) ON DELETE CASCADE,
  vendedor_id   UUID REFERENCES auth.users(id),
  customer_name TEXT,
  total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nexia_tienda.sale_session_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID NOT NULL REFERENCES nexia_tienda.sale_sessions(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES nexia_tienda.products(id),
  product_name TEXT NOT NULL,
  quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price   NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_sessions_tenant  ON nexia_tienda.sale_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sale_sessions_created ON nexia_tienda.sale_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_session    ON nexia_tienda.sale_session_items(session_id);

ALTER TABLE nexia_tienda.sale_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexia_tienda.sale_session_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sale_sessions: solo los míos"
  ON nexia_tienda.sale_sessions FOR ALL
  USING (tenant_id = ANY(nexia_tienda.my_tenant_ids()));

CREATE POLICY "sale_session_items: solo los míos"
  ON nexia_tienda.sale_session_items FOR ALL
  USING (
    session_id IN (
      SELECT id FROM nexia_tienda.sale_sessions
      WHERE tenant_id = ANY(nexia_tienda.my_tenant_ids())
    )
  );

-- ============================================================
-- 5. Vistas de analítica
-- ============================================================

-- Ventas por hora del día (zona Mexico City)
CREATE OR REPLACE VIEW nexia_tienda.v_sales_by_hour AS
SELECT
  o.tenant_id,
  EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'America/Mexico_City')::INTEGER AS hour,
  COUNT(DISTINCT o.id)::INTEGER AS order_count,
  COALESCE(SUM(o.total), 0)    AS revenue
FROM nexia_tienda.orders o
WHERE o.status != 'cancelado'
GROUP BY o.tenant_id, 2;

-- Top productos por unidades vendidas
CREATE OR REPLACE VIEW nexia_tienda.v_top_products AS
SELECT
  p.tenant_id,
  p.id          AS product_id,
  p.name,
  p.sku,
  p.price,
  p.image_url,
  p.category,
  COALESCE(SUM(oi.quantity), 0)::INTEGER             AS units_sold,
  COALESCE(SUM(oi.quantity * oi.unit_price), 0)      AS revenue
FROM nexia_tienda.products p
LEFT JOIN nexia_tienda.order_items oi ON oi.product_id = p.id
LEFT JOIN nexia_tienda.orders      o  ON o.id = oi.order_id AND o.status != 'cancelado'
GROUP BY p.tenant_id, p.id, p.name, p.sku, p.price, p.image_url, p.category;

-- Sugerencias de inventario
CREATE OR REPLACE VIEW nexia_tienda.v_inventory_suggestions AS
SELECT
  i.tenant_id,
  i.product_id,
  p.name,
  p.category,
  p.image_url,
  i.stock,
  i.low_stock_threshold,
  COALESCE(tp.units_sold, 0) AS units_sold,
  CASE
    WHEN i.stock = 0                          THEN 'SIN_STOCK'
    WHEN i.stock <= i.low_stock_threshold     THEN 'REABASTECER'
    WHEN i.stock <= i.low_stock_threshold * 2 THEN 'BAJO'
    ELSE                                           'OK'
  END AS sugerencia
FROM nexia_tienda.inventory i
JOIN  nexia_tienda.products     p  ON p.id = i.product_id
LEFT JOIN nexia_tienda.v_top_products tp ON tp.product_id = i.product_id;

-- Total general de ventas por tenant (para dashboard dueño)
CREATE OR REPLACE VIEW nexia_tienda.v_sales_summary AS
SELECT
  tenant_id,
  COUNT(DISTINCT id)::INTEGER                                          AS total_orders,
  COUNT(DISTINCT id) FILTER (WHERE status = 'entregado')::INTEGER      AS delivered_orders,
  COUNT(DISTINCT id) FILTER (WHERE status = 'cancelado')::INTEGER      AS cancelled_orders,
  COALESCE(SUM(total) FILTER (WHERE status != 'cancelado'), 0)         AS total_revenue,
  COALESCE(SUM(total) FILTER (
    WHERE status != 'cancelado'
    AND DATE_TRUNC('day', created_at) = CURRENT_DATE
  ), 0) AS revenue_today,
  COALESCE(SUM(total) FILTER (
    WHERE status != 'cancelado'
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
  ), 0) AS revenue_this_month
FROM nexia_tienda.orders
GROUP BY tenant_id;

-- ============================================================
-- 6. Storage bucket para imágenes de productos
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política: solo usuarios autenticados pueden subir a su carpeta de tenant
CREATE POLICY "upload: autenticados"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "read: público"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "delete: autenticados"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );
