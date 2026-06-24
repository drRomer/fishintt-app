-- =============================================================================
-- Fishin't — Base de datos comunitaria de amenazas (firmas de enlaces)
-- =============================================================================
-- Da "peso" a los reportes de usuarios: cada enlace reportado guarda su firma
-- y anatomía. El analizador consulta esta tabla para marcar como sospechosos
-- los enlaces iguales o SIMILARES a los ya reportados.
--
-- Cómo usar: Supabase Dashboard → SQL Editor → pega y ejecuta (Run).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Tabla: threat_signatures
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.threat_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  normalized_url TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  host TEXT NOT NULL,
  signature TEXT NOT NULL,
  anatomy JSONB DEFAULT '{}'::jsonb,
  risk_level TEXT NOT NULL DEFAULT 'suspicious'
    CHECK (risk_level IN ('safe', 'suspicious', 'dangerous')),
  score INTEGER NOT NULL DEFAULT 1 CHECK (score BETWEEN 1 AND 7),
  report_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threat_host ON public.threat_signatures(host);
CREATE INDEX IF NOT EXISTS idx_threat_signature ON public.threat_signatures(signature);

-- -----------------------------------------------------------------------------
-- RLS: lectura pública (el analizador consulta con la anon key); la escritura
-- ocurre solo a través de la función register_threat (SECURITY DEFINER).
-- -----------------------------------------------------------------------------
ALTER TABLE public.threat_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Threat signatures are public to read" ON public.threat_signatures;
CREATE POLICY "Threat signatures are public to read"
  ON public.threat_signatures FOR SELECT
  USING (true);

-- -----------------------------------------------------------------------------
-- RPC: register_threat — upsert con contador atómico
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_threat(
  p_url TEXT,
  p_normalized TEXT,
  p_host TEXT,
  p_signature TEXT,
  p_risk_level TEXT,
  p_score INTEGER,
  p_anatomy JSONB
)
RETURNS public.threat_signatures AS $$
DECLARE
  result public.threat_signatures;
BEGIN
  INSERT INTO public.threat_signatures
    (url, normalized_url, host, signature, risk_level, score, anatomy)
  VALUES
    (p_url, p_normalized, p_host, p_signature, p_risk_level, p_score, COALESCE(p_anatomy, '{}'::jsonb))
  ON CONFLICT (normalized_url) DO UPDATE
    SET report_count = public.threat_signatures.report_count + 1,
        risk_level   = EXCLUDED.risk_level,
        score        = EXCLUDED.score,
        anatomy      = EXCLUDED.anatomy,
        updated_at   = NOW()
  RETURNING * INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir ejecutar la función a usuarios autenticados (y anónimos en modo demo).
GRANT EXECUTE ON FUNCTION public.register_threat(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB) TO authenticated, anon;

-- -----------------------------------------------------------------------------
-- RPC: match_threats — busca coincidencia exacta o por firma/host (similar)
-- Devuelve a lo más una fila priorizando la coincidencia exacta.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_threats(
  p_normalized TEXT,
  p_signature TEXT,
  p_host TEXT
)
RETURNS TABLE (match_type TEXT, report_count INTEGER, risk_level TEXT) AS $$
  SELECT 'exacto'::TEXT, t.report_count, t.risk_level
  FROM public.threat_signatures t
  WHERE t.normalized_url = p_normalized
  UNION ALL
  SELECT 'similar'::TEXT, SUM(t.report_count)::INTEGER, 'suspicious'::TEXT
  FROM public.threat_signatures t
  WHERE t.normalized_url <> p_normalized
    AND (t.signature = p_signature OR t.host = p_host)
  HAVING COUNT(*) > 0
  LIMIT 2;
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION public.match_threats(TEXT, TEXT, TEXT) TO authenticated, anon;
