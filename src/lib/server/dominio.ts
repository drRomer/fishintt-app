// =============================================================================
// Fishin't — Inteligencia de dominio (solo servidor)
// =============================================================================
// Antigüedad del registro y detección de imitaciones tipográficas SIN listas.
// Usa node:net y node:dns, así que solo puede importarse desde la API route.
// =============================================================================

import net from "node:net";
import dns from "node:dns/promises";

// -----------------------------------------------------------------------------
// Dominio registrable (eTLD+1 aproximado)
// -----------------------------------------------------------------------------
export function registrableDomain(host: string): string {
  const p = host.split(".");
  if (p.length <= 2) return host;
  const sld = p[p.length - 2];
  if (["gob", "co", "com", "net", "org", "edu"].includes(sld)) {
    return p.slice(-3).join(".");
  }
  return p.slice(-2).join(".");
}

// -----------------------------------------------------------------------------
// Antigüedad del registro
// -----------------------------------------------------------------------------
// Cobertura verificada contra los registros reales:
//   - gTLD: RDAP (rdap.org). El User-Agent es obligatorio o responde 403.
//   - .cl : no tiene RDAP (ni IANA ni NIC Chile), pero whois.nic.cl:43 sí
//           entrega "Creation date".
//
// PRIVACIDAD (§5.1, Ley 19.628): la respuesta de NIC Chile incluye el nombre del
// titular. Se extrae ÚNICAMENTE la fecha y el resto se descarta; nada se guarda.
// -----------------------------------------------------------------------------

function whoisNicCl(dominio: string, timeoutMs = 5000): Promise<string | null> {
  return new Promise((resolve) => {
    let respuesta = "";
    let listo = false;
    const terminar = (v: string | null) => {
      if (listo) return;
      listo = true;
      try {
        socket.destroy();
      } catch {
        /* ya cerrado */
      }
      resolve(v);
    };
    const socket = net.createConnection(43, "whois.nic.cl");
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => socket.write(dominio + "\r\n"));
    socket.on("data", (d) => {
      respuesta += d.toString("utf8");
      if (respuesta.length > 8000) terminar(respuesta);
    });
    socket.on("end", () => terminar(respuesta));
    socket.on("timeout", () => terminar(null));
    socket.on("error", () => terminar(null));
  });
}

function extraerFecha(respuesta: string): string | null {
  const m = respuesta.match(/Creation date:\s*(\d{4}-\d{2}-\d{2})/i);
  return m ? m[1] : null;
}

function diasDesde(fechaIso: string): number | null {
  const ms = Date.now() - new Date(fechaIso).getTime();
  if (!isFinite(ms) || ms < 0) return null;
  return Math.floor(ms / 86_400_000);
}

export async function getDomainAgeDays(host: string): Promise<number | null> {
  if (!host || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null; // IP: no aplica
  const dominio = registrableDomain(host);

  if (dominio.endsWith(".cl")) {
    const r = await whoisNicCl(dominio);
    const fecha = r ? extraerFecha(r) : null;
    return fecha ? diasDesde(fecha) : null;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(dominio)}`, {
      headers: {
        Accept: "application/rdap+json",
        "User-Agent": "Mozilla/5.0 (compatible; FishintBot/1.0)",
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return null;
    const json = await res.json();
    const evento = json?.events?.find((e: any) => e?.eventAction === "registration");
    if (!evento?.eventDate) return null;
    const ms = Date.now() - new Date(evento.eventDate).getTime();
    if (!isFinite(ms) || ms < 0) return null;
    return Math.floor(ms / 86_400_000);
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Imitación tipográfica SIN lista de referencia
// -----------------------------------------------------------------------------
// El detector de typosquatting de analysis.ts solo compara contra SAFE_DOMAINS,
// una lista fija de ~60 dominios. Eso deja desprotegida a cualquier institución
// chilena que no esté en ella: hospitales, municipios, universidades, servicios
// públicos. Caso real: "incancr.cl" (sin la E) imita a "incancer.cl", el
// Instituto Nacional del Cáncer, registrado en 2001.
//
// Enfoque generativo: se construyen los vecinos tipográficos del dominio, se
// comprueba cuáles EXISTEN de verdad (DNS) y se compara su antigüedad. Un
// dominio recién creado a una letra de distancia de uno consolidado es una
// imitación, sin importar si alguien lo puso antes en una lista.
// -----------------------------------------------------------------------------

export interface Lookalike {
  dominio: string; // el dominio legítimo imitado
  edadDias: number;
}

const VOCALES = ["a", "e", "i", "o", "u"];

/** Vecinos tipográficos plausibles de una etiqueta (no toda la distancia 1). */
function vecinos(label: string): string[] {
  const out = new Set<string>();

  // 1. Falta una vocal: "incancr" -> "incancer"
  for (let i = 0; i <= label.length; i++) {
    for (const v of VOCALES) out.add(label.slice(0, i) + v + label.slice(i));
  }
  // 2. Falta una letra repetida: "falabela" -> "falabella"
  for (let i = 0; i < label.length; i++) {
    out.add(label.slice(0, i) + label[i] + label.slice(i));
  }
  // 3. Sobra una letra: "bancoestadoo" -> "bancoestado"
  for (let i = 0; i < label.length; i++) {
    out.add(label.slice(0, i) + label.slice(i + 1));
  }
  // 4. Dos letras cambiadas de orden: "bnacochile" -> "bancochile"
  for (let i = 0; i < label.length - 1; i++) {
    out.add(label.slice(0, i) + label[i + 1] + label[i] + label.slice(i + 2));
  }
  // 5. Homóglifos frecuentes del teclado latino
  const pares: [RegExp, string][] = [
    [/1/g, "l"], [/l/g, "i"], [/i/g, "l"], [/0/g, "o"], [/o/g, "0"],
    [/rn/g, "m"], [/m/g, "rn"], [/5/g, "s"], [/s/g, "5"],
  ];
  for (const [de, a] of pares) {
    const v = label.replace(de, a);
    if (v !== label) out.add(v);
  }

  out.delete(label);
  return [...out].filter((v) => v.length >= 4 && v.length <= 30);
}

async function resuelve(dominio: string): Promise<boolean> {
  try {
    const r = await dns.resolve4(dominio);
    return r.length > 0;
  } catch {
    try {
      const r = await dns.resolve6(dominio);
      return r.length > 0;
    } catch {
      return false;
    }
  }
}

/**
 * Busca un dominio consolidado del que este sea una imitación tipográfica.
 * Devuelve null si no hay nada concluyente: no se inventa una acusación.
 *
 * @param edadSospechoso antigüedad del dominio analizado, si se conoce.
 */
export async function detectarLookalike(
  host: string,
  edadSospechoso: number | null
): Promise<Lookalike | null> {
  // Solo tiene sentido si el dominio analizado es nuevo o de edad desconocida.
  // Dos dominios antiguos y parecidos suelen ser ambos legítimos.
  if (edadSospechoso !== null && edadSospechoso > 365) return null;

  const dominio = registrableDomain(host);
  const punto = dominio.indexOf(".");
  if (punto < 1) return null;
  const label = dominio.slice(0, punto);
  const sufijo = dominio.slice(punto); // ".cl", ".com"...
  if (label.length < 4) return null;

  const candidatos = vecinos(label).map((v) => v + sufijo);
  if (candidatos.length === 0 || candidatos.length > 200) return null;

  // ¿Cuáles existen? DNS en paralelo: es barato y rápido.
  const existen: string[] = [];
  const resultados = await Promise.all(
    candidatos.map(async (c) => ((await resuelve(c)) ? c : null))
  );
  for (const r of resultados) if (r) existen.push(r);
  if (existen.length === 0) return null;

  // De los que existen, buscar uno claramente consolidado. Se consultan pocos
  // para no disparar la latencia ni abusar de los registros.
  for (const candidato of existen.slice(0, 4)) {
    const edad = await getDomainAgeDays(candidato);
    if (edad !== null && edad > 730) {
      // Exigir que el sospechoso sea mucho más nuevo, o de edad desconocida.
      if (edadSospechoso === null || edadSospechoso < edad / 4) {
        return { dominio: candidato, edadDias: edad };
      }
    }
  }
  return null;
}

// -----------------------------------------------------------------------------
// ¿El dominio apunta realmente a algún servidor?
// -----------------------------------------------------------------------------
// Un dominio que no resuelve no es un sitio seguro: no es un sitio. Puede ser
// una campaña de phishing ya dada de baja (duran días), un registro defensivo
// sin uso, o un error de tipeo. En ningún caso corresponde decirle al usuario
// "sin señales de riesgo".
//
// Solo cuenta la inexistencia DEFINITIVA (ENOTFOUND / NXDOMAIN). Un timeout o un
// fallo del resolutor son problemas nuestros, no del dominio: ahí se devuelve
// null y no se penaliza.
export async function dominioResuelve(host: string): Promise<boolean | null> {
  if (!host) return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true; // una IP es su propio destino

  const primero = await resuelveHost(host);
  if (primero !== false) return primero;

  // OJO: normalizeUrl() quita el "www.", y muchos dominios solo resuelven con él
  // (bancoestado.cl a secas no tiene registro A). Antes de declarar que un sitio
  // no existe hay que probar la otra forma, o marcaríamos como inexistentes a
  // sitios legítimos que solo publican bajo www.
  const alterno = host.startsWith("www.") ? host.slice(4) : "www." + host;
  const segundo = await resuelveHost(alterno);
  return segundo === true ? true : false;
}

async function resuelveHost(host: string): Promise<boolean | null> {
  try {
    const r = await dns.resolve4(host);
    return r.length > 0;
  } catch (e: any) {
    const code = String(e?.code ?? "");
    if (code !== "ENOTFOUND" && code !== "NOTFOUND" && code !== "ENODATA") return null;
    // Sin registro A: puede tener solo IPv6 o solo registros MX/CNAME.
    try {
      const r6 = await dns.resolve6(host);
      if (r6.length > 0) return true;
    } catch {
      /* sigue sin resolver */
    }
    try {
      const cn = await dns.resolveCname(host);
      if (cn.length > 0) return true;
    } catch {
      /* sigue sin resolver */
    }
    return code === "ENOTFOUND" || code === "NOTFOUND" ? false : null;
  }
}
