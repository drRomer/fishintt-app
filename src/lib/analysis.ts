// =============================================================================
// Fishin't — Motor de análisis de enlaces (núcleo compartido cliente/servidor)
// =============================================================================
// Filosofía: un enlace desconocido NO se asume seguro. Se parte de un puntaje
// neutral y se premia solo a los dominios oficiales verificados. Los acortadores
// y patrones de estafa restan fuerte. La base de datos comunitaria (reportes de
// usuarios) puede empujar un enlace a "sospechoso" o "peligroso".
// =============================================================================

export type RiskLevel = "safe" | "suspicious" | "dangerous";

export interface UrlAnatomy {
  inputUrl: string;
  normalizedUrl: string;
  host: string;
  tld: string;
  isShortener: boolean;
  shortenerService: string | null;
  hasHttps: boolean;
  subdomainCount: number;
  pathPattern: "vacío" | "normal" | "aleatorio";
  hasRandomQuery: boolean;
  brandImpersonated: string | null;
  redFlags: string[];
  // Campos que la IA (Gemini) puede enriquecer:
  scamCategory?: string | null;
  aiSummary?: string | null;
}

export interface AnalysisResult {
  url: string;
  riskLevel: RiskLevel;
  score: number; // escala 1..7 (1 = peligro, 7 = seguro) para la UI
  rawScore: number; // escala interna 0..100
  reasons: string[];
  recommendation: string;
  anatomy: UrlAnatomy;
  expandedUrl?: string | null;
  community?: {
    matched: boolean;
    matchType: "exacto" | "similar" | null;
    reportCount: number;
  };
}

// -----------------------------------------------------------------------------
// Listas de referencia
// -----------------------------------------------------------------------------

// Acortadores de URL conocidos (globales + chilenos). Las instituciones serias
// rara vez usan acortadores en comunicaciones oficiales.
export const URL_SHORTENERS: string[] = [
  "bit.ly", "bitly.com", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
  "buff.ly", "rebrand.ly", "cutt.ly", "rb.gy", "shorturl.at", "lnk.ink",
  "did.li", "t.ly", "soo.gd", "v.gd", "x.co", "tiny.cc", "cli.gs", "shorte.st",
  "adf.ly", "bc.vc", "bl.ink", "short.io", "kutt.it", "n9.cl", "acortar.link",
  "acortaurl.com", "urlz.fr", "lc.cx", "hyperurl.co", "surl.li", "l.ink",
  "1url.com", "snip.ly", "clck.ru", "u.to", "gg.gg", "shrtco.de", "s.id",
  "qr.ae", "po.st", "ity.im", "q.gs", "u.nu", "rb.gy", "tr.im", "ulvis.net",
  "shorturl.com", "rotf.lol", "tinu.be", "cutt.us", "linklyhq.com",
];

// Dominios oficiales chilenos de confianza (lista blanca).
export const SAFE_DOMAINS: string[] = [
  "bancoestado.cl", "bancochile.cl", "santander.cl", "bci.cl", "scotiabank.cl",
  "itau.cl", "bancofalabella.cl", "bancoripley.cl", "coopeuch.cl", "tenpo.cl",
  "mercadopago.cl", "falabella.com", "ripley.cl", "paris.cl", "lider.cl",
  "correoschile.cl", "chilexpress.cl", "starken.cl", "bluexpress.cl",
  "sii.cl", "gob.cl", "tesoreria.cl", "chileatiende.gob.cl", "registrocivil.cl",
  "afphabitat.cl", "afpcuprum.cl", "afpprovida.cl", "afpmodelo.cl", "afpcapital.cl",
  "metrogas.cl", "enel.cl", "aguasandinas.cl", "cge.cl", "entel.cl", "movistar.cl",
  "wom.cl", "claro.cl", "vtr.com", "autopistacentral.cl", "costaneranorte.cl",
  "tag.cl", "vespucio.cl", "google.com", "microsoft.com", "apple.com",
  "youtube.com", "gmail.com", "outlook.com", "live.com", "office.com",
  "github.com", "facebook.com", "instagram.com", "whatsapp.com", "linkedin.com",
  "x.com", "twitter.com", "amazon.com", "netflix.com", "spotify.com",
  "mercadolibre.cl", "wikipedia.org", "cloudflare.com", "openai.com", "anthropic.com",
];

// Marcas frecuentemente suplantadas en estafas chilenas (para detectar imitación).
const IMPERSONATED_BRANDS: { brand: string; needles: string[] }[] = [
  { brand: "BancoEstado", needles: ["bancoestado", "banco-estado", "bestado"] },
  { brand: "Banco de Chile", needles: ["bancochile", "banco-chile", "bch"] },
  { brand: "Santander", needles: ["santander"] },
  { brand: "BCI", needles: ["bci"] },
  { brand: "Chilexpress", needles: ["chilexpress", "chile-express", "chilexp"] },
  { brand: "Correos de Chile", needles: ["correoschile", "correos-chile", "correos"] },
  { brand: "TAG / Autopistas", needles: ["tag", "autopista", "vespucio", "costanera"] },
  { brand: "SII / Tesorería", needles: ["sii", "tesoreria", "tesoreria-gob", "impuestos"] },
  { brand: "ChileAtiende / Gobierno", needles: ["chileatiende", "subsidio", "bono", "gob-cl"] },
  { brand: "Falabella", needles: ["falabella", "cmr"] },
  { brand: "MercadoPago", needles: ["mercadopago", "mercado-pago"] },
];

// TLDs frecuentemente abusados en phishing.
const DANGEROUS_TLDS = [
  ".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".click", ".xyz", ".live",
  ".online", ".site", ".info", ".rest", ".buzz", ".cyou", ".sbs", ".monster",
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

export function normalizeUrl(input: string): string {
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    u.hash = "";
    // host en minúscula, sin "www."
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
    return u.toString().replace(/\/$/, "");
  } catch {
    return s.toLowerCase();
  }
}

function getTld(host: string): string {
  const i = host.lastIndexOf(".");
  return i >= 0 ? host.slice(i) : "";
}

function looksRandom(segment: string): boolean {
  if (!segment) return false;
  // Cadena corta alfanumérica con mezcla de letras y números o mayúsculas/minúsculas.
  const clean = segment.replace(/[^A-Za-z0-9]/g, "");
  if (clean.length < 4 || clean.length > 16) return false;
  const hasUpper = /[A-Z]/.test(clean);
  const hasLower = /[a-z]/.test(clean);
  const hasDigit = /\d/.test(clean);
  const classes = [hasUpper, hasLower, hasDigit].filter(Boolean).length;
  return classes >= 2;
}

// Coincidencia de marca: para needles largos basta el substring; para los cortos
// (tag, bci, sii, bch, cmr, bono) exigimos límites para no marcar palabras como
// "instagram" (contiene "tag") o "subcity" (contiene "bci").
function matchesBrand(host: string, needle: string): boolean {
  if (needle.length >= 5) return host.includes(needle);
  return new RegExp(`(^|[^a-z0-9])${needle}([^a-z0-9]|$)`).test(host);
}

// -----------------------------------------------------------------------------
// Anatomía del enlace (determinista)
// -----------------------------------------------------------------------------

export function buildAnatomy(inputUrl: string): UrlAnatomy {
  const normalizedUrl = normalizeUrl(inputUrl);
  const redFlags: string[] = [];

  let host = "";
  let tld = "";
  let hasHttps = false;
  let subdomainCount = 0;
  let pathPattern: UrlAnatomy["pathPattern"] = "vacío";
  let hasRandomQuery = false;

  try {
    const u = new URL(normalizedUrl);
    host = u.hostname;
    tld = getTld(host);
    hasHttps = u.protocol === "https:";
    subdomainCount = Math.max(0, host.split(".").length - 2);

    const firstSeg = u.pathname.split("/").filter(Boolean)[0] || "";
    pathPattern = !firstSeg ? "vacío" : looksRandom(firstSeg) ? "aleatorio" : "normal";

    if (u.search) {
      const params = [...u.searchParams.keys()];
      // Query sin claves reconocibles o con "claves" aleatorias = sospechoso.
      const rawQuery = u.search.replace(/^\?/, "");
      hasRandomQuery =
        params.length === 0 ? looksRandom(rawQuery) : params.some((k) => looksRandom(k));
    }
  } catch {
    redFlags.push("URL mal formada o inválida");
  }

  const shortenerService = URL_SHORTENERS.find((s) => host === s || host.endsWith("." + s)) || null;
  const isShortener = !!shortenerService;

  // Marca suplantada (solo si NO es un dominio oficial).
  const isOfficial = SAFE_DOMAINS.some((d) => host === d || host.endsWith("." + d));
  let brandImpersonated: string | null = null;
  if (!isOfficial) {
    for (const b of IMPERSONATED_BRANDS) {
      if (b.needles.some((n) => matchesBrand(host, n))) {
        brandImpersonated = b.brand;
        break;
      }
    }
  }

  if (isShortener) redFlags.push(`Enlace acortado (${shortenerService})`);
  if (DANGEROUS_TLDS.some((t) => host.endsWith(t))) redFlags.push(`TLD de alto riesgo (${tld})`);
  if (!hasHttps) redFlags.push("Sin HTTPS (conexión no cifrada)");
  if (subdomainCount > 2) redFlags.push("Demasiados subdominios");
  if (pathPattern === "aleatorio") redFlags.push("Ruta con apariencia aleatoria");
  if (hasRandomQuery) redFlags.push("Parámetros de URL aleatorios/inusuales");
  if (brandImpersonated) redFlags.push(`Imita el nombre de ${brandImpersonated}`);

  return {
    inputUrl,
    normalizedUrl,
    host,
    tld,
    isShortener,
    shortenerService,
    hasHttps,
    subdomainCount,
    pathPattern,
    hasRandomQuery,
    brandImpersonated,
    redFlags,
    scamCategory: null,
    aiSummary: null,
  };
}

// -----------------------------------------------------------------------------
// Firma para comparar enlaces "similares" en la base comunitaria
// -----------------------------------------------------------------------------

export function buildSignature(a: UrlAnatomy): string {
  // Misma firma => enlaces estructuralmente equivalentes.
  return [
    a.isShortener ? `short:${a.shortenerService}` : `host:${a.host}`,
    `tld:${a.tld}`,
    `path:${a.pathPattern}`,
    a.brandImpersonated ? `brand:${a.brandImpersonated}` : "brand:none",
  ].join("|");
}

// -----------------------------------------------------------------------------
// Scoring (0..100, mayor = más seguro)
// -----------------------------------------------------------------------------

export interface CommunityHit {
  matchType: "exacto" | "similar";
  reportCount: number;
}

export function scoreUrl(a: UrlAnatomy, community?: CommunityHit | null): AnalysisResult {
  const reasons: string[] = [];
  let raw = 100;

  const isOfficial = SAFE_DOMAINS.some((d) => a.host === d || a.host.endsWith("." + d));

  if (a.host === "") {
    raw = 10;
    reasons.push("URL mal formada o inválida");
  } else if (isOfficial) {
    raw = 95;
    reasons.push("Dominio oficial verificado");
  } else {
    if (a.isShortener) {
      raw -= 65;
      reasons.push(`Enlace acortado (${a.shortenerService}) — oculta el destino real`);
    }
    if (DANGEROUS_TLDS.some((t) => a.host.endsWith(t))) {
      raw -= 40;
      reasons.push(`TLD frecuentemente usado en phishing (${a.tld})`);
    }
    if (!a.hasHttps) {
      raw -= 20;
      reasons.push("Sitio sin HTTPS (conexión no cifrada)");
    }
    if (a.subdomainCount > 2) {
      raw -= 15;
      reasons.push("Múltiples subdominios sospechosos");
    }
    if (a.brandImpersonated) {
      raw -= 45;
      reasons.push(`Imita el nombre de ${a.brandImpersonated} sin ser su dominio oficial`);
    }
    if (a.pathPattern === "aleatorio") {
      raw -= 12;
      reasons.push("Ruta con caracteres aleatorios (típico de campañas masivas)");
    }
    if (a.hasRandomQuery) {
      raw -= 15;
      reasons.push("Parámetros de URL aleatorios/inusuales");
    }
    if (raw === 100) {
      // Sin señales de riesgo: tratar como seguro (pero no perfecto como un
      // dominio oficial verificado). Esto evita marcar como sospechoso a
      // cualquier sitio legítimo desconocido (youtube, github, etc.).
      raw = 80;
      reasons.push("Sin señales de riesgo detectadas");
    }
  }

  // Influencia de la base de datos comunitaria (reportes de usuarios).
  if (community) {
    if (community.matchType === "exacto") {
      raw = Math.min(raw, 12);
      reasons.unshift(
        `⚠ Reportado por la comunidad ${community.reportCount} ${
          community.reportCount === 1 ? "vez" : "veces"
        } como amenaza`
      );
    } else {
      raw -= 25;
      reasons.unshift(
        "Coincide con el patrón de enlaces ya reportados por la comunidad"
      );
    }
  }

  raw = Math.max(0, Math.min(100, raw));

  // Mapeo a nivel de riesgo.
  let riskLevel: RiskLevel;
  let recommendation: string;
  if (raw >= 67) {
    riskLevel = "safe";
    recommendation =
      "Este enlace parece seguro. Aún así, verifica que sea el sitio correcto antes de ingresar datos.";
  } else if (raw >= 34) {
    riskLevel = "suspicious";
    recommendation =
      "Este enlace presenta señales sospechosas. Verifica con la institución por un canal oficial antes de continuar.";
  } else {
    riskLevel = "dangerous";
    recommendation =
      "ALTO RIESGO. No ingreses datos en este sitio. Reporta y elimina el mensaje que lo contiene.";
  }

  const score = Math.round((raw / 100) * 6) + 1; // 1..7

  return {
    url: a.inputUrl,
    riskLevel,
    score,
    rawScore: raw,
    reasons,
    recommendation,
    anatomy: a,
    community: community
      ? { matched: true, matchType: community.matchType, reportCount: community.reportCount }
      : { matched: false, matchType: null, reportCount: 0 },
  };
}

// Conveniencia: análisis 100% determinista en una llamada (fallback sin red/IA).
export function analyzeLocally(inputUrl: string, community?: CommunityHit | null): AnalysisResult {
  return scoreUrl(buildAnatomy(inputUrl), community);
}
