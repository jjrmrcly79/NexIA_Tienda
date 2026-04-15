-- ============================================================
-- NexIA Tienda — Migración: Sistema de invitaciones
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS nexia_tienda.invitations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES nexia_tienda.tenants(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('cliente', 'vendedor')),
  invited_by  UUID REFERENCES auth.users(id),
  status      TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (status IN ('pendiente', 'aceptada', 'expirada')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_tenant  ON nexia_tienda.invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email   ON nexia_tienda.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status  ON nexia_tienda.invitations(status);

ALTER TABLE nexia_tienda.invitations ENABLE ROW LEVEL SECURITY;

-- Solo el dueño/admin del tenant puede ver y gestionar invitaciones
CREATE POLICY "invitations: solo mi tenant"
  ON nexia_tienda.invitations FOR ALL
  USING (tenant_id = ANY(nexia_tienda.my_tenant_ids()));
