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
  /** El host es una IP literal (ej. http://45.33.32.156/...). */
  isIpLiteral: boolean;
  /** Dominio internacionalizado (xn--): vector de homóglifos. */
  isPunycode: boolean;
  /** Dominio oficial que este enlace imita por tipografía (santandor ≈ santander). */
  typosquatOf: string | null;
  /** La terminación del dominio está entre las más abusadas en phishing. */
  hasDangerousTld: boolean;
  /** El dominio está en la whitelist oficial: aquí SÍ sabemos que es legítimo. */
  isOfficialDomain: boolean;
  /** Alojado en una plataforma de hosting gratuito (subdominio de terceros). */
  freeHostingService: string | null;
  /** Marca suplantada que aparece en la RUTA, no en el dominio. */
  brandInPath: string | null;
  redFlags: string[];
  // Campos que el servidor enriquece (no disponibles en el análisis local):
  /** Días desde el registro del dominio (RDAP/WHOIS). null = no se pudo saber. */
  domainAgeDays?: number | null;
  /** ¿Valida la cadena de confianza TLS? null = no se pudo comprobar. */
  certChainValid?: boolean | null;
  /** Dominio consolidado que este imita tipográficamente, hallado sin lista. */
  lookalikeOf?: string | null;
  /** ¿El dominio apunta a algún servidor? false = no existe. null = no se supo. */
  domainResolves?: boolean | null;
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

// Plataformas de hosting gratuito: el dominio padre es legítimo, pero cualquiera
// puede crear un subdominio. Vector habitual para alojar páginas de captura sin
// tener que registrar un dominio propio.
const HOSTING_GRATUITO = [
  "web.app", "firebaseapp.com", "pages.dev", "workers.dev", "netlify.app",
  "vercel.app", "github.io", "glitch.me", "repl.co", "replit.app",
  "000webhostapp.com", "wixsite.com", "weebly.com", "blogspot.com",
  "herokuapp.com", "onrender.com", "surge.sh", "r2.dev", "neocities.org",
];

// Señales de que la ruta corresponde a una captura de credenciales, o a un sitio
// legítimo comprometido (los CMS hackeados cuelgan la página falsa de wp-*).
const RUTA_CREDENCIALES =
  /(login|ingreso|acceso|signin|clave|password|verificar|verificacion|validar|cuenta|account|formulario|actualizar|seguridad|wp-content|wp-includes|wp-admin)/i;

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

// Host que es una IP literal. Las instituciones legítimas nunca publican así
// sus servicios de cara al público.
const IP_LITERAL = /^\d{1,3}(\.\d{1,3}){3}$/;

// Dominio internacionalizado (punycode). El estándar URL convierte a "xn--"
// cualquier host con caracteres no-ASCII, que es justamente el vector de
// homóglifos (p. ej. "bancoestado.cl" escrito con 'о' cirílica). Ningún sitio
// chileno legítimo de los que nos interesan lo usa.
function isPunycodeHost(host: string): boolean {
  return host.split(".").some((label) => label.startsWith("xn--"));
}

// Distancia de edición, para detectar imitaciones tipográficas (typosquatting).
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur: number[] = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}

// Etiqueta registrable del host: "santandor" de "www.santandor.cl",
// "chileatiende" de "chileatiende.gob.cl".
function registrableLabel(host: string): string {
  const parts = host.split(".");
  if (parts.length >= 3 && ["gob", "co", "com"].includes(parts[parts.length - 2])) {
    return parts[parts.length - 3] || "";
  }
  return parts.length >= 2 ? parts[parts.length - 2] : host;
}

// ¿El dominio imita tipográficamente a uno oficial? Se exige etiqueta de al
// menos 5 caracteres y distancia muy baja, para no generar falsos positivos.
function findTyposquat(host: string): string | null {
  const label = registrableLabel(host);
  if (label.length < 5) return null;
  const umbral = label.length >= 8 ? 2 : 1;
  for (const safe of SAFE_DOMAINS) {
    const safeLabel = registrableLabel(safe);
    if (safeLabel.length < 5) continue;
    if (label === safeLabel) return null; // es el dominio real, no una imitación
    const d = levenshtein(label, safeLabel);
    if (d > 0 && d <= umbral) return safe;
  }
  return null;
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
  let rutaCompleta = "";

  try {
    const u = new URL(normalizedUrl);
    host = u.hostname;
    tld = getTld(host);
    hasHttps = u.protocol === "https:";
    subdomainCount = Math.max(0, host.split(".").length - 2);

    rutaCompleta = u.pathname + u.search;
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

  // Indicadores estructurales adicionales (§2.4.1.a: hay que poder decirle al
  // usuario QUÉ indicador se activó, no solo el veredicto).
  const isIpLiteral = IP_LITERAL.test(host);
  const isPunycode = isPunycodeHost(host);
  const typosquatOf = !isOfficial && !isIpLiteral ? findTyposquat(host) : null;
  const hasDangerousTld = DANGEROUS_TLDS.some((t) => host.endsWith(t));
  const isOfficialDomain = isOfficial;

  // Hosting gratuito: el host cuelga de la plataforma, no ES la plataforma.
  const freeHostingService =
    HOSTING_GRATUITO.find((p) => host.endsWith("." + p)) || null;

  // Marca en la RUTA. Solo cuenta si además la ruta parece un flujo de
  // credenciales o de CMS comprometido: un medio de prensa puede nombrar
  // legítimamente a un banco en la URL de una noticia.
  let brandInPath: string | null = null;
  if (!isOfficial && rutaCompleta && RUTA_CREDENCIALES.test(rutaCompleta)) {
    const ruta = rutaCompleta.toLowerCase();
    for (const b of IMPERSONATED_BRANDS) {
      if (b.needles.some((n) => n.length >= 5 && ruta.includes(n))) {
        brandInPath = b.brand;
        break;
      }
    }
  }

  if (freeHostingService)
    redFlags.push(`Alojado en hosting gratuito (${freeHostingService})`);
  if (brandInPath)
    redFlags.push(`Menciona a ${brandInPath} en la ruta, pero el dominio no le pertenece`);
  if (isIpLiteral) redFlags.push("El enlace apunta a una dirección IP, no a un dominio");
  if (isPunycode) redFlags.push("Dominio con caracteres especiales (posible homóglifo)");
  if (typosquatOf) redFlags.push(`Se parece al dominio oficial ${typosquatOf} pero no lo es`);
  if (isShortener) redFlags.push(`Enlace acortado (${shortenerService})`);
  if (hasDangerousTld) redFlags.push(`TLD de alto riesgo (${tld})`);
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
    isIpLiteral,
    isPunycode,
    typosquatOf,
    hasDangerousTld,
    isOfficialDomain,
    freeHostingService,
    brandInPath,
    redFlags,
    domainAgeDays: null,
    certChainValid: null,
    lookalikeOf: null,
    domainResolves: null,
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
    if (a.hasDangerousTld) {
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
    if (a.brandInPath) {
      raw -= 40;
      reasons.push(
        `La dirección nombra a ${a.brandInPath} en la ruta, pero el dominio (${a.host}) no le pertenece: puede ser un sitio ajeno vulnerado`
      );
    }
    if (a.freeHostingService) {
      raw -= 35;
      reasons.push(
        `Alojado en ${a.freeHostingService}, una plataforma gratuita donde cualquiera puede publicar`
      );
    }
    if (a.isIpLiteral) {
      raw -= 50;
      reasons.push(
        "Apunta a una dirección IP en vez de un dominio: los servicios legítimos nunca lo hacen"
      );
    }
    if (a.typosquatOf) {
      raw -= 50;
      reasons.push(
        `Imita tipográficamente al dominio oficial ${a.typosquatOf} (cambia o quita letras)`
      );
    }
    if (a.isPunycode) {
      raw -= 35;
      reasons.push(
        "El dominio usa caracteres de otro alfabeto para parecerse a uno real (homóglifos)"
      );
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
    // Honestidad del veredicto: solo con un dominio de la whitelist sabemos que
    // el sitio es legítimo. En el resto únicamente sabemos que NO hallamos
    // señales, que no es lo mismo, y el motor no detecta el 100% de los casos.
    recommendation = isOfficial
      ? "Es el sitio oficial. Aun así, nunca ingreses tus claves si llegaste desde un enlace que no pediste."
      : "No encontramos señales de fraude, pero eso no garantiza que el sitio sea legítimo. Si te llegó sin que lo pidieras, verifica por un canal oficial antes de ingresar datos.";
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
