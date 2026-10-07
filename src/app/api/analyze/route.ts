import tls from "node:tls";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDomainAgeDays, detectarLookalike } from "@/lib/server/dominio";
import {
  buildAnatomy,
  buildSignature,
  scoreUrl,
  normalizeUrl,
  type AnalysisResult,
  type CommunityHit,
  type UrlAnatomy,
} from "@/lib/analysis";

export const runtime = "nodejs";

// -----------------------------------------------------------------------------
// Cliente Supabase server-side (anon key, solo lectura pública + RPC)
// -----------------------------------------------------------------------------
function serverSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// -----------------------------------------------------------------------------
// Expandir enlace acortado siguiendo la redirección (best-effort, con límites)
// -----------------------------------------------------------------------------
async function expandUrl(start: string): Promise<string | null> {
  let current = start;
  try {
    for (let hop = 0; hop < 5; hop++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      let res: Response;
      try {
        res = await fetch(current, {
          method: "HEAD",
          redirect: "manual",
          signal: controller.signal,
          headers: { "User-Agent": "Mozilla/5.0 (compatible; FishintBot/1.0)" },
        });
      } finally {
        clearTimeout(timer);
      }
      const loc = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && loc) {
        current = new URL(loc, current).toString();
        continue;
      }
      break;
    }
  } catch {
    return current !== start ? current : null;
  }
  return current !== start ? current : null;
}

// -----------------------------------------------------------------------------
// Consulta a la base de datos comunitaria
// -----------------------------------------------------------------------------
async function matchCommunity(a: UrlAnatomy): Promise<CommunityHit | null> {
  const supabase = serverSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("match_threats", {
      p_normalized: a.normalizedUrl,
      p_signature: buildSignature(a),
      p_host: a.host,
    });
    if (error || !data || data.length === 0) return null;
    const exact = data.find((r: any) => r.match_type === "exacto");
    const hit = exact || data[0];
    return {
      matchType: hit.match_type === "exacto" ? "exacto" : "similar",
      reportCount: hit.report_count || 1,
    };
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Enriquecimiento opcional con IA (Google Gemini, tier gratuito)
// -----------------------------------------------------------------------------
async function enrichWithAI(a: UrlAnatomy): Promise<Partial<UrlAnatomy> | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const prompt = `Eres un analista de ciberseguridad chileno. Analiza la ANATOMÍA de este enlace y responde SOLO con JSON válido.
Enlace: ${a.normalizedUrl}
Host: ${a.host} | Acortador: ${a.isShortener ? a.shortenerService : "no"} | Marca imitada: ${a.brandImpersonated || "ninguna"}
Devuelve: {"scamCategory": "<categoría breve de estafa o 'ninguna'>", "brandImpersonated": "<marca o null>", "summary": "<1 frase en español explicando el riesgo>"}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
        }),
        signal: controller.signal,
      }
    ).finally(() => clearTimeout(timer));

    if (!res.ok) return null;
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text);
    return {
      scamCategory: parsed.scamCategory && parsed.scamCategory !== "ninguna" ? parsed.scamCategory : null,
      brandImpersonated: parsed.brandImpersonated || a.brandImpersonated,
      aiSummary: parsed.summary || null,
    };
  } catch {
    return null;
  }
}

// Reclasifica un puntaje 0..100 al veredicto cualitativo.
function clasificar(raw: number): Pick<AnalysisResult, "riskLevel" | "recommendation" | "score"> {
  const score = Math.round((raw / 100) * 6) + 1;
  if (raw >= 67) {
    return {
      riskLevel: "safe",
      score,
      // Esta rama solo se alcanza tras aplicar una penalización, así que nunca
      // corresponde el mensaje de "sitio oficial verificado".
      recommendation:
        "No encontramos señales de fraude, pero eso no garantiza que el sitio sea legítimo. Si te llegó sin que lo pidieras, verifica por un canal oficial antes de ingresar datos.",
    };
  }
  if (raw >= 34) {
    return {
      riskLevel: "suspicious",
      score,
      recommendation:
        "Este enlace presenta señales sospechosas. Verifica con la institución por un canal oficial antes de continuar.",
    };
  }
  return {
    riskLevel: "dangerous",
    score,
    recommendation:
      "ALTO RIESGO. No ingreses datos en este sitio. Reporta y elimina el mensaje que lo contiene.",
  };
}

// La antigüedad es una señal CORROBORANTE, no acusatoria por sí sola.
//
// Antes se penalizaba igual con o sin otras señales, y eso producía un falso
// positivo sistemático: un dominio legítimo limpio parte en 80, de modo que
// incluso la penalización más suave (-15) lo dejaba en 65, bajo el umbral de 67.
// Resultado: TODA PyME chilena con menos de 6 meses salía "sospechosa", y las
// microempresas son parte del público objetivo del producto (§2.2.2).
//
// Ahora: si el motor ya encontró otras señales, la edad las amplifica con fuerza.
// Si el enlace está limpio y lo único llamativo es la edad, solo un dominio
// realmente fresco (≤30 días) justifica una advertencia, y con otro lenguaje.
function applyDomainAge(result: AnalysisResult, ageDays: number | null): AnalysisResult {
  if (ageDays === null || ageDays > 180) return result; // sin dato o dominio establecido

  // rawScore ≥ 80 significa que no se aplicó ninguna otra penalización.
  const soloEdad = result.rawScore >= 80;
  const dias = `${ageDays} ${ageDays === 1 ? "día" : "días"}`;

  let penalizacion: number;
  let motivo: string;

  if (soloEdad) {
    if (ageDays > 90) return result; // nuevo pero sin nada más: no se marca
    penalizacion = ageDays <= 30 ? 25 : 12;
    motivo = `El dominio se creó hace ${dias}. Por sí solo no indica fraude (los sitios legítimos también empiezan nuevos), pero si el enlace te llegó sin que lo pidieras, verifícalo antes de entregar datos`;
  } else if (ageDays <= 30) {
    penalizacion = 45;
    motivo = `Dominio registrado hace ${dias}: las campañas de phishing usan dominios recién creados`;
  } else if (ageDays <= 90) {
    penalizacion = 30;
    motivo = `Dominio muy reciente (${dias}), mientras que los sitios de instituciones reales tienen años`;
  } else {
    penalizacion = 15;
    motivo = `Dominio registrado hace menos de 6 meses (${dias})`;
  }
  const raw = Math.max(0, Math.min(100, result.rawScore - penalizacion));
  // Si el motor local no había encontrado nada, esa frase ya no es cierta:
  // la antigüedad ES una señal. Se quita para no mostrar razones contradictorias.
  const previas = result.reasons.filter((r) => !r.startsWith("Sin señales de riesgo"));
  return { ...result, rawScore: raw, ...clasificar(raw), reasons: [motivo, ...previas] };
}

// -----------------------------------------------------------------------------
// Validación de la cadena de confianza TLS (§4.2.3 a)
// -----------------------------------------------------------------------------
// Verificar que el sitio "use HTTPS" NO es lo mismo que validar su certificado:
// cualquiera obtiene un certificado gratis, pero uno vencido, autofirmado o
// emitido para otro dominio sí es una señal fuerte.
//
// Se abre un handshake TLS con rejectUnauthorized: true y se mira únicamente si
// la cadena valida. No se envía ningún dato ni se ejecuta nada del sitio, y no
// agrega exposición: expandUrl ya hace un HEAD contra ese mismo host. Conforme a
// §4.2.3, la consulta sale del servidor y no del dispositivo del usuario.
//
// Deliberadamente NO se usa la antigüedad del certificado como señal: Let's
// Encrypt renueva cada 90 días, así que los sitios legítimos tienen certificados
// recién emitidos todo el tiempo. Sería ruido, no evidencia.
// -----------------------------------------------------------------------------

interface CadenaTls {
  valido: boolean;
  motivo: string;
}

// Solo estos errores indican un problema de CONFIANZA. Que un host no resuelva o
// rechace la conexión no dice nada sobre su legitimidad.
const ERRORES_CADENA: Record<string, string> = {
  CERT_HAS_EXPIRED: "el certificado está vencido",
  CERT_NOT_YET_VALID: "el certificado aún no es válido",
  DEPTH_ZERO_SELF_SIGNED_CERT: "el certificado es autofirmado",
  SELF_SIGNED_CERT_IN_CHAIN: "la cadena incluye un certificado autofirmado",
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: "no se pudo verificar quién emitió el certificado",
  ERR_TLS_CERT_ALTNAME_INVALID: "el certificado fue emitido para otro dominio",
};

// OJO: normalizeUrl() quita el "www.", pero muchos dominios resuelven SOLO con
// www (bancoestado.cl por sí solo da ENOTFOUND). Para el handshake hay que usar
// el host tal como venía, y si el DNS falla se reintenta con "www." delante.
function hostParaTls(inputUrl: string, respaldo: string): string {
  try {
    const u = inputUrl.match(/^https?:\/\//i) ? inputUrl : "https://" + inputUrl;
    return new URL(u).hostname.toLowerCase() || respaldo;
  } catch {
    return respaldo;
  }
}

async function validarCadenaTlsConReintento(
  inputUrl: string,
  hostNormalizado: string
): Promise<CadenaTls | null> {
  const host = hostParaTls(inputUrl, hostNormalizado);
  const primero = await conectarTls(host);
  if (primero !== null) return primero;
  // Falló por DNS u otra causa no relacionada con la cadena: probar con www.
  if (!host.startsWith("www.")) return conectarTls("www." + host);
  return null;
}

function conectarTls(host: string): Promise<CadenaTls | null> {
  return new Promise((resolve) => {
    let listo = false;
    const terminar = (v: CadenaTls | null) => {
      if (listo) return;
      listo = true;
      try {
        socket.destroy();
      } catch {
        /* ya cerrado */
      }
      resolve(v);
    };
    const socket = tls.connect({
      host,
      port: 443,
      servername: host,
      rejectUnauthorized: true,
    });
    socket.setTimeout(5000);
    socket.on("secureConnect", () => terminar({ valido: true, motivo: "" }));
    socket.on("timeout", () => terminar(null));
    socket.on("error", (err: NodeJS.ErrnoException) => {
      const motivo = ERRORES_CADENA[String(err.code ?? "")];
      terminar(motivo ? { valido: false, motivo } : null);
    });
  });
}

function applyCertChain(result: AnalysisResult, cadena: CadenaTls | null): AnalysisResult {
  if (!cadena || cadena.valido) return result;
  const raw = Math.max(0, Math.min(100, result.rawScore - 40));
  const previas = result.reasons.filter((r) => !r.startsWith("Sin señales de riesgo"));
  return {
    ...result,
    rawScore: raw,
    ...clasificar(raw),
    reasons: [`Problema con el certificado de seguridad: ${cadena.motivo}`, ...previas],
  };
}

// -----------------------------------------------------------------------------
// Inteligencia de amenazas externa (Google Safe Browsing y VirusTotal)
// Best-effort, detrás de sus API keys. Si una URL aparece marcada por estos
// servicios, es señal autoritativa: el resultado se fuerza a "peligroso".
// -----------------------------------------------------------------------------
interface ThreatIntelHit {
  flagged: boolean;
  label?: string;
  detections?: number;
}

// Los servicios externos hacen su propia canonicalización y necesitan la URL tal
// como llegó. normalizeUrl() le quita la barra final, y eso ROMPE la coincidencia
// exacta de Safe Browsing: comprobado, la URL de prueba de Google da MATCH con
// barra y "sin coincidencia" sin ella. Por eso a estos servicios se les manda el
// enlace original (solo se le agrega el esquema si falta).
function urlParaServicioExterno(inputUrl: string, respaldo: string): string {
  const t = inputUrl.trim();
  if (!t) return respaldo;
  return /^https?:\/\//i.test(t) ? t : "https://" + t;
}

async function checkSafeBrowsing(url: string): Promise<ThreatIntelHit | null> {
  const key = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!key) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "fishintt", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
        signal: controller.signal,
      }
    ).finally(() => clearTimeout(timer));
    if (!res.ok) return null;
    const json = await res.json();
    const match = json?.matches?.[0];
    if (!match) return { flagged: false };
    const t = String(match.threatType || "").toLowerCase();
    const label = t.includes("social")
      ? "phishing / ingeniería social"
      : t.includes("malware")
      ? "distribución de malware"
      : "amenaza";
    return { flagged: true, label };
  } catch {
    return null;
  }
}

async function checkVirusTotal(url: string): Promise<ThreatIntelHit | null> {
  const key = process.env.VIRUSTOTAL_API_KEY;
  if (!key) return null;
  try {
    // Identificador VT v3 = base64url del enlace, sin relleno "=".
    const id = Buffer.from(url).toString("base64url").replace(/=+$/, "");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://www.virustotal.com/api/v3/urls/${id}`, {
      headers: { "x-apikey": key },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return null; // 404 = enlace no analizado previamente por VT
    const json = await res.json();
    const stats = json?.data?.attributes?.last_analysis_stats;
    const detections = (stats?.malicious || 0) + (stats?.suspicious || 0);
    return { flagged: detections > 0, detections };
  } catch {
    return null;
  }
}

// Aplica el veredicto de la inteligencia externa sobre el resultado heurístico.
function applyThreatIntel(
  result: AnalysisResult,
  sb: ThreatIntelHit | null,
  vt: ThreatIntelHit | null
): AnalysisResult {
  const reasons = [...result.reasons];
  let raw = result.rawScore;
  let hit = false;
  if (sb?.flagged) {
    hit = true;
    raw = Math.min(raw, 8);
    reasons.unshift(`⚠ Google Safe Browsing lo clasifica como ${sb.label}`);
  }
  if (vt?.flagged) {
    hit = true;
    raw = Math.min(raw, 10);
    reasons.unshift(
      `⚠ VirusTotal: ${vt.detections} motor(es) de seguridad lo detectan como malicioso`
    );
  }
  if (!hit) return result;
  return {
    ...result,
    rawScore: raw,
    score: Math.round((raw / 100) * 6) + 1,
    riskLevel: "dangerous",
    recommendation:
      "ALTO RIESGO. No ingreses datos en este sitio. Reporta y elimina el mensaje que lo contiene.",
    reasons,
  };
}

// -----------------------------------------------------------------------------
// POST /api/analyze
// -----------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    const anatomy = buildAnatomy(url);

    const urlExterna = urlParaServicioExterno(anatomy.inputUrl, anatomy.normalizedUrl);

    // En paralelo: expansión, comunidad, IA, inteligencia externa y antigüedad.
    const [expanded, community, ai, safeBrowsing, virusTotal, domainAgeDays, cadenaTls] =
      await Promise.all([
        anatomy.host ? expandUrl(anatomy.normalizedUrl) : Promise.resolve(null),
        matchCommunity(anatomy),
        enrichWithAI(anatomy),
        anatomy.host ? checkSafeBrowsing(urlExterna) : Promise.resolve(null),
        anatomy.host ? checkVirusTotal(urlExterna) : Promise.resolve(null),
        anatomy.host ? getDomainAgeDays(anatomy.host) : Promise.resolve(null),
        anatomy.host && anatomy.hasHttps && !anatomy.isIpLiteral
          ? validarCadenaTlsConReintento(anatomy.inputUrl, anatomy.host)
          : Promise.resolve(null),
      ]);

    anatomy.domainAgeDays = domainAgeDays;
    anatomy.certChainValid = cadenaTls ? cadenaTls.valido : null;

    // Imitación tipográfica sin lista de referencia. Necesita la edad del
    // dominio, por eso va después del bloque paralelo y no dentro de él.
    const lookalike =
      anatomy.host && !anatomy.isOfficialDomain && !anatomy.isIpLiteral && !anatomy.typosquatOf
        ? await detectarLookalike(anatomy.host, domainAgeDays)
        : null;
    anatomy.lookalikeOf = lookalike ? lookalike.dominio : null;

    // Combinar enriquecimiento de IA en la anatomía.
    if (ai) {
      anatomy.scamCategory = ai.scamCategory ?? anatomy.scamCategory;
      anatomy.brandImpersonated = ai.brandImpersonated ?? anatomy.brandImpersonated;
      anatomy.aiSummary = ai.aiSummary ?? anatomy.aiSummary;
    }

    let result: AnalysisResult = scoreUrl(anatomy, community);

    // Si se pudo expandir, analizar también el destino real y tomar lo peor.
    if (expanded && normalizeUrl(expanded) !== anatomy.normalizedUrl) {
      const destAnatomy = buildAnatomy(expanded);
      const destResult = scoreUrl(destAnatomy, null);
      if (destResult.rawScore < result.rawScore) {
        const merged = mergeWorst(result, destResult, expanded);
        result = merged;
      }
      result.expandedUrl = expanded;
    } else {
      result.expandedUrl = null;
    }

    // Imitación de un dominio consolidado: señal fuerte y explicable.
    if (lookalike) {
      const raw = Math.max(0, Math.min(100, result.rawScore - 50));
      const anios = Math.floor(lookalike.edadDias / 365);
      result = {
        ...result,
        rawScore: raw,
        ...clasificar(raw),
        reasons: [
          `Se parece al dominio ${lookalike.dominio}, que existe hace ${anios} ${anios === 1 ? "año" : "años"}: este cambia una letra para imitarlo`,
          ...result.reasons.filter((r) => !r.startsWith("Sin señales de riesgo")),
        ],
      };
    }

    // Antigüedad del dominio (no penaliza si no se pudo averiguar).
    result = applyDomainAge(result, domainAgeDays);

    // Cadena de confianza del certificado (solo penaliza si falló la validación).
    result = applyCertChain(result, cadenaTls);

    // Veredicto autoritativo de Safe Browsing / VirusTotal (si hay API keys).
    result = applyThreatIntel(result, safeBrowsing, virusTotal);

    if (anatomy.aiSummary) {
      result.reasons.push(`IA: ${anatomy.aiSummary}`);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error("analyze error", e);
    return NextResponse.json({ error: "Error al analizar el enlace" }, { status: 500 });
  }
}

// Combina el resultado base con el del destino expandido, tomando el peor puntaje.
function mergeWorst(base: AnalysisResult, dest: AnalysisResult, expanded: string): AnalysisResult {
  const raw = Math.min(base.rawScore, dest.rawScore);
  const reasons = [...base.reasons];
  for (const r of dest.reasons) {
    if (!reasons.includes(r)) reasons.push(`Destino real: ${r}`);
  }
  let riskLevel: AnalysisResult["riskLevel"];
  let recommendation: string;
  if (raw >= 67) {
    riskLevel = "safe";
    recommendation = base.recommendation;
  } else if (raw >= 34) {
    riskLevel = "suspicious";
    recommendation =
      "Este enlace presenta señales sospechosas. Verifica con la institución por un canal oficial antes de continuar.";
  } else {
    riskLevel = "dangerous";
    recommendation =
      "ALTO RIESGO. No ingreses datos en este sitio. Reporta y elimina el mensaje que lo contiene.";
  }
  return {
    ...base,
    riskLevel,
    rawScore: raw,
    score: Math.round((raw / 100) * 6) + 1,
    reasons,
    recommendation,
    expandedUrl: expanded,
  };
}
