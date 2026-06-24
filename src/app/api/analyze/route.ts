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
// POST /api/analyze
// -----------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    const anatomy = buildAnatomy(url);

    // En paralelo: expansión, comunidad e IA.
    const [expanded, community, ai] = await Promise.all([
      anatomy.host ? expandUrl(anatomy.normalizedUrl) : Promise.resolve(null),
      matchCommunity(anatomy),
      enrichWithAI(anatomy),
    ]);

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
