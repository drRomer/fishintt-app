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
-- El archivo es RE-EJECUTABLE: si ya corriste una versión anterior, vuelve a
-- pegarlo entero y se actualiza (agrega la columna phone y las RPCs de salir /
-- eliminar miembro / eliminar red / ver mis alertas). get_network_members se
-- suelta y se recrea porque cambió su tipo de retorno.
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
-- Telefono de contacto del miembro. OPCIONAL y entregado por el propio
-- titular (nunca por el admin en su nombre): es el unico dato que permite que
-- el boton "Llamar" de una alerta funcione de verdad. Minimizacion aplicada
-- (Ley 19.628): se puede pertenecer a una red sin darlo, solo lo lee el admin
-- de esa red via get_network_members, la UI no muestra los digitos —solo marca—
-- y se borra junto con la membresia al salir o al ser eliminado.
ALTER TABLE public.network_members ADD COLUMN IF NOT EXISTS phone TEXT;

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
DROP FUNCTION IF EXISTS public.get_network_members(UUID);
CREATE OR REPLACE FUNCTION public.get_network_members(p_network_id UUID)
RETURNS TABLE (user_id UUID, role TEXT, display_name TEXT, phone TEXT, created_at TIMESTAMPTZ) AS $$
  SELECT m.user_id, m.role, m.display_name, m.phone, m.created_at
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
-- RPC: mis propias alertas (como protegido). Una persona siempre puede ver lo
-- que se registro sobre ella; que el admin vea tus alertas y tu no, no se
-- sostiene ni como diseno ni frente a la Ley 19.628.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_alerts()
RETURNS SETOF public.member_alerts AS $$
  SELECT a.* FROM public.member_alerts a
  WHERE a.member_id = auth.uid()
  ORDER BY a.created_at DESC
  LIMIT 50;
$$ LANGUAGE sql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- RPC: guardar o borrar MI telefono de contacto. Solo el titular puede tocarlo,
-- en todas sus membresias. Pasar NULL o vacio lo borra (derecho a supresion).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_my_phone(p_phone TEXT)
RETURNS VOID AS $$
  UPDATE public.network_members m
  SET phone = NULLIF(trim(COALESCE(p_phone, '')), '')
  WHERE m.user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- RPC: salir de una red (un protegido se va por su cuenta).
-- El admin NO puede salir: dejaria la red sin responsable y a los protegidos
-- creyendose vigilados por nadie. Para irse tiene que eliminar la red entera.
-- Al salir se borran tambien las alertas de esa persona en esa red: dejarlas en
-- el panel del admin seria conservar su historial despues de que se fue.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.leave_protected_network(p_network_id UUID)
RETURNS VOID AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF EXISTS (SELECT 1 FROM public.protected_networks n
             WHERE n.id = p_network_id AND n.admin_id = v_uid) THEN
    RAISE EXCEPTION 'El administrador no puede salir de su propia red';
  END IF;
  DELETE FROM public.member_alerts a
    WHERE a.network_id = p_network_id AND a.member_id = v_uid;
  DELETE FROM public.network_members m
    WHERE m.network_id = p_network_id AND m.user_id = v_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- RPC: el admin elimina a un miembro. No puede eliminarse a si mismo (para eso
-- esta delete_protected_network). Se borran sus alertas por la misma razon.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.remove_network_member(p_network_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.protected_networks n
                 WHERE n.id = p_network_id AND n.admin_id = v_uid) THEN
    RAISE EXCEPTION 'Solo el administrador de la red puede eliminar miembros';
  END IF;
  IF p_user_id = v_uid THEN
    RAISE EXCEPTION 'El administrador no puede eliminarse a si mismo';
  END IF;
  DELETE FROM public.member_alerts a
    WHERE a.network_id = p_network_id AND a.member_id = p_user_id;
  DELETE FROM public.network_members m
    WHERE m.network_id = p_network_id AND m.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- RPC: el admin elimina la red completa. El ON DELETE CASCADE de las tablas se
-- lleva miembros, telefonos y alertas: no queda rastro de los protegidos.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_protected_network(p_network_id UUID)
RETURNS VOID AS $$
  DELETE FROM public.protected_networks n
  WHERE n.id = p_network_id AND n.admin_id = auth.uid();
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
GRANT EXECUTE ON FUNCTION public.get_my_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_my_phone(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_protected_network(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_network_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_protected_network(UUID) TO authenticated;
