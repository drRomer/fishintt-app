-- =============================================================================
-- Fishin't — Red Empresa / Familia Protegida (seguridad delegada)
-- =============================================================================
-- Un admin (usuario con competencias digitales) crea una "red" y comparte un
-- código de invitación. Sus protegidos (colaboradores PyME, adultos mayores)
-- se unen con ese código. Cuando un protegido analiza un enlace sospechoso o
-- peligroso, se registra una ALERTA que el admin ve en su panel para intervenir
-- a tiempo (p. ej. llamar al familiar/empleado antes de que entregue sus datos).
--
-- Cómo usar: Supabase Dashboard → SQL Editor → pega y ejecuta (Run).
-- Requiere schema.sql (auth.users / profiles) ya ejecutado.
--
-- Nota de seguridad: todo el acceso pasa por funciones SECURITY DEFINER con
-- chequeo interno de auth.uid(); las tablas tienen RLS activo SIN políticas de
-- lectura directa (se evita así la recursión clásica de políticas cruzadas).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Tablas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.protected_networks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_network_admin ON public.protected_networks(admin_id);

CREATE TABLE IF NOT EXISTS public.network_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network_id UUID NOT NULL REFERENCES public.protected_networks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'protegido' CHECK (role IN ('admin', 'protegido')),
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (network_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_member_user ON public.network_members(user_id);
CREATE INDEX IF NOT EXISTS idx_member_network ON public.network_members(network_id);

CREATE TABLE IF NOT EXISTS public.member_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network_id UUID NOT NULL REFERENCES public.protected_networks(id) ON DELETE CASCADE,
  member_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_name TEXT,
  url TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('safe', 'suspicious', 'dangerous')),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alert_network ON public.member_alerts(network_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- RLS activo, sin políticas de SELECT directas (acceso solo vía RPCs).
-- -----------------------------------------------------------------------------
ALTER TABLE public.protected_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_alerts ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Helper: código de invitación corto y legible (6 chars)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gen_invite_code()
RETURNS TEXT AS $$
  SELECT upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
$$ LANGUAGE sql VOLATILE;

-- -----------------------------------------------------------------------------
-- RPC: crear red (el creador queda como admin y como miembro)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_protected_network(p_name TEXT)
RETURNS public.protected_networks AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_code TEXT;
  v_net public.protected_networks;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  LOOP
    v_code := public.gen_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.protected_networks WHERE invite_code = v_code);
  END LOOP;
  INSERT INTO public.protected_networks (name, admin_id, invite_code)
  VALUES (COALESCE(NULLIF(trim(p_name), ''), 'Mi red'), v_uid, v_code)
  RETURNING * INTO v_net;
  INSERT INTO public.network_members (network_id, user_id, role, display_name)
  VALUES (v_net.id, v_uid, 'admin',
          COALESCE((SELECT name FROM public.profiles WHERE id = v_uid), 'Administrador'));
  RETURN v_net;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- RPC: unirse a una red con código
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_protected_network(p_code TEXT, p_name TEXT)
RETURNS public.protected_networks AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_net public.protected_networks;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT * INTO v_net FROM public.protected_networks
    WHERE invite_code = upper(trim(p_code));
  IF v_net.id IS NULL THEN RAISE EXCEPTION 'Código inválido'; END IF;
  INSERT INTO public.network_members (network_id, user_id, role, display_name)
  VALUES (v_net.id, v_uid, 'protegido',
          COALESCE(NULLIF(trim(p_name), ''),
                   (SELECT name FROM public.profiles WHERE id = v_uid), 'Protegido'))
  ON CONFLICT (network_id, user_id) DO UPDATE SET display_name = EXCLUDED.display_name;
  RETURN v_net;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- RPC: mi red (como admin o como protegido). El código solo se revela al admin.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_network()
RETURNS TABLE (id UUID, name TEXT, invite_code TEXT, role TEXT, admin_id UUID, member_count INT) AS $$
  SELECT n.id, n.name,
         CASE WHEN n.admin_id = auth.uid() THEN n.invite_code ELSE NULL END,
         m.role, n.admin_id,
         (SELECT count(*)::INT FROM public.network_members mm WHERE mm.network_id = n.id)
  FROM public.network_members m
  JOIN public.protected_networks n ON n.id = m.network_id
  WHERE m.user_id = auth.uid()
  ORDER BY (m.role = 'admin') DESC, n.created_at
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- RPC: miembros de una red (solo el admin de esa red)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_network_members(p_network_id UUID)
RETURNS TABLE (user_id UUID, role TEXT, display_name TEXT, created_at TIMESTAMPTZ) AS $$
  SELECT m.user_id, m.role, m.display_name, m.created_at
  FROM public.network_members m
  WHERE m.network_id = p_network_id
    AND EXISTS (SELECT 1 FROM public.protected_networks n
                WHERE n.id = p_network_id AND n.admin_id = auth.uid())
  ORDER BY (m.role = 'admin') DESC, m.created_at;
$$ LANGUAGE sql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- RPC: alertas de una red (solo el admin)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_network_alerts(p_network_id UUID)
RETURNS SETOF public.member_alerts AS $$
  SELECT a.* FROM public.member_alerts a
  WHERE a.network_id = p_network_id
    AND EXISTS (SELECT 1 FROM public.protected_networks n
                WHERE n.id = p_network_id AND n.admin_id = auth.uid())
  ORDER BY a.created_at DESC
  LIMIT 100;
$$ LANGUAGE sql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- RPC: registrar alerta (un protegido reporta su análisis de riesgo). Se inserta
-- en cada red donde el usuario es 'protegido' (el admin no se alerta a sí mismo).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_member_alert(p_url TEXT, p_risk TEXT, p_name TEXT)
RETURNS INT AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_count INT := 0;
BEGIN
  IF v_uid IS NULL THEN RETURN 0; END IF;
  INSERT INTO public.member_alerts (network_id, member_id, member_name, url, risk_level)
  SELECT m.network_id, v_uid,
         COALESCE(NULLIF(trim(p_name), ''), m.display_name, 'Protegido'),
         p_url, p_risk
  FROM public.network_members m
  WHERE m.user_id = v_uid AND m.role = 'protegido';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- RPC: marcar alerta como resuelta (solo el admin de la red)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_member_alert(p_alert_id UUID)
RETURNS VOID AS $$
  UPDATE public.member_alerts a SET resolved = TRUE
  WHERE a.id = p_alert_id
    AND EXISTS (SELECT 1 FROM public.protected_networks n
                WHERE n.id = a.network_id AND n.admin_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Permisos
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.create_protected_network(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_protected_network(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_network() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_network_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_network_alerts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_member_alert(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_member_alert(UUID) TO authenticated;
