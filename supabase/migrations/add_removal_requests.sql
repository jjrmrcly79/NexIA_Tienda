-- Ejecutar en Supabase SQL Editor
-- Tabla para solicitudes de baja que los vendedores envían al dueño

CREATE TABLE IF NOT EXISTS nexia_tienda.removal_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES nexia_tienda.tenants(id) ON DELETE CASCADE,
  requested_by   uuid        NOT NULL REFERENCES auth.users(id),
  invitation_id  uuid        REFERENCES nexia_tienda.invitations(id) ON DELETE SET NULL,
  target_email   text        NOT NULL,
  reason         text,
  status         text        NOT NULL DEFAULT 'pendiente'
                             CHECK (status IN ('pendiente', 'aprobada', 'rechazada')),
  processed_by   uuid        REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS removal_requests_tenant_idx  ON nexia_tienda.removal_requests(tenant_id);
CREATE INDEX IF NOT EXISTS removal_requests_status_idx  ON nexia_tienda.removal_requests(status);
