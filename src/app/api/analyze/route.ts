import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

// -----------------------------------------------------------------------------
// Antigüedad del dominio vía RDAP (§4.2.3 a: "antigüedad del registro del dominio")
// -----------------------------------------------------------------------------
// RDAP es el sucesor de WHOIS: responde HTTP/JSON, sin librerías ni credenciales.
// Los dominios de phishing son efímeros (días o semanas), mientras que los de las
// instituciones reales tienen años. Si el dato no está disponible devolvemos null
// y NO se penaliza: solo se castiga lo que se sabe, nunca lo que se ignora.
//
// LIMITACIÓN VERIFICADA (importante para el informe): el TLD .cl NO figura en el
// bootstrap RDAP de IANA y NIC Chile no expone un servicio RDAP, por lo que la
// antigüedad NO se puede obtener para dominios .cl. La cobertura real es:
//   - gTLD (.com, .net, .org, .xyz, .top, .online…): sí  <- la mayoría del
//     phishing chileno usa estos TLD baratos, que es donde más vale la señal.
//   - .cl: no. La suplantación bajo .cl se cubre con el detector de
//     typosquatting y homóglifos de analysis.ts, que no depende de la red.
//
// El User-Agent es obligatorio: sin él rdap.org responde 403.
// -----------------------------------------------------------------------------

// Dominio registrable (eTLD+1 aproximado): RDAP se consulta sobre el dominio
// registrado, no sobre el host completo con subdominios.
function registrableDomain(host: string): string {
  const p = host.split(".");
  if (p.length <= 2) return host;
  const sld = p[p.length - 2];
  if (["gob", "co", "com", "net", "org", "edu"].includes(sld)) {
    return p.slice(-3).join(".");
  }
  return p.slice(-2).join(".");
}

async function getDomainAgeDays(host: string): Promise<number | null> {
  if (!host || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null; // IP: no aplica
  const dominio = registrableDomain(host);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(dominio)}`, {
      headers: {
        Accept: "application/rdap+json",
        // Sin User-Agent, rdap.org responde 403.
        "User-Agent": "Mozilla/5.0 (compatible; FishintBot/1.0)",
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return null; // 404 = no registrado o ccTLD sin RDAP (ej. .cl)
    const json = await res.json();
    const evento = json?.events?.find(
      (e: any) => e?.eventAction === "registration"
    );
    if (!evento?.eventDate) return null;
    const ms = Date.now() - new Date(evento.eventDate).getTime();
    if (!isFinite(ms) || ms < 0) return null;
    return Math.floor(ms / 86_400_000);
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
      recommendation:
        "Este enlace parece seguro. Aún así, verifica que sea el sitio correcto antes de ingresar datos.",
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

function applyDomainAge(result: AnalysisResult, ageDays: number | null): AnalysisResult {
  if (ageDays === null || ageDays > 180) return result; // sin dato o dominio establecido
  let penalizacion: number;
  let motivo: string;
  if (ageDays <= 30) {
    penalizacion = 45;
    motivo = `Dominio registrado hace ${ageDays} ${ageDays === 1 ? "día" : "días"}: las campañas de phishing usan dominios recién creados`;
  } else if (ageDays <= 90) {
    penalizacion = 30;
    motivo = `Dominio muy reciente (${ageDays} días), mientras que los sitios de instituciones reales tienen años`;
  } else {
    penalizacion = 15;
    motivo = `Dominio registrado hace menos de 6 meses (${ageDays} días)`;
  }
  const raw = Math.max(0, Math.min(100, result.rawScore - penalizacion));
  return { ...result, rawScore: raw, ...clasificar(raw), reasons: [motivo, ...result.reasons] };
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

    // En paralelo: expansión, comunidad, IA, inteligencia externa y antigüedad.
    const [expanded, community, ai, safeBrowsing, virusTotal, domainAgeDays] =
      await Promise.all([
        anatomy.host ? expandUrl(anatomy.normalizedUrl) : Promise.resolve(null),
        matchCommunity(anatomy),
        enrichWithAI(anatomy),
        anatomy.host ? checkSafeBrowsing(anatomy.normalizedUrl) : Promise.resolve(null),
        anatomy.host ? checkVirusTotal(anatomy.normalizedUrl) : Promise.resolve(null),
        anatomy.host ? getDomainAgeDays(anatomy.host) : Promise.resolve(null),
      ]);

    anatomy.domainAgeDays = domainAgeDays;

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

    // Antigüedad del dominio (no penaliza si no se pudo averiguar).
    result = applyDomainAge(result, domainAgeDays);

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
