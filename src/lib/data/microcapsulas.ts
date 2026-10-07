// =============================================================================
// Fishin't — Microcápsulas de la Cyber-Academy (intervención en el momento crítico)
// =============================================================================
// Implementa el paso 6 del flujo principal (§5.1) y el enlace operativo entre
// detección y formación que describe §2.4.1.a: cuando el analizador marca un
// enlace, se ofrece la microcápsula que desarrolla EL INDICADOR QUE SE ACABA DE
// DETECTAR, no contenido genérico.
//
// Formato deliberadamente ligero (texto + evidencia del propio enlace + una
// pregunta), no video: la evidencia sobre entrenamiento incrustado que cita
// §5.2 (Kumaraguru et al., 2007) validó intervenciones breves y estáticas, y el
// público objetivo opera en móvil con competencias digitales básicas.
//
// Cada microcápsula cierra con un ejercicio de clasificación que alimenta el
// componente C del CRD (§3.2.1) a través de src/lib/ejercicios.ts.
//
// NOTA: los textos deben ser revisados por el equipo antes de la entrega: son
// afirmaciones sobre instituciones chilenas dirigidas a usuarios vulnerables.
// =============================================================================

import type { AnalysisResult } from "@/lib/analysis";
import type { NivelEjercicio } from "@/lib/ejercicios";

export type IndicadorId =
  | "comunidad"
  | "typosquat"
  | "homoglifo"
  | "ip"
  | "certificado"
  | "marca"
  | "dominioNuevo"
  | "acortador"
  | "tld"
  | "subdominios"
  | "aleatorio"
  | "sinHttps";

export interface Evidencia {
  etiqueta: string;
  valor: string;
  /** true = resaltar en rojo (lo sospechoso); false = en verde (lo legítimo) */
  peligroso?: boolean;
}

export interface Pregunta {
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
  nivel: NivelEjercicio;
}

export interface Microcapsula {
  id: IndicadorId;
  titulo: string;
  explicacion: string;
  queHacer: string;
  pregunta: Pregunta;
  /** Evidencia tomada del enlace que el usuario acaba de analizar. */
  evidencia: (r: AnalysisResult) => Evidencia[];
}

// -----------------------------------------------------------------------------

export const MICROCAPSULAS: Record<IndicadorId, Microcapsula> = {
  comunidad: {
    id: "comunidad",
    titulo: "Otras personas ya reportaron este enlace",
    explicacion:
      "Este enlace coincide con uno que la comunidad de Fishin't ya denunció. Las campañas de estafa se envían de forma masiva: si otra persona recibió el mismo enlace, es muy probable que se trate del mismo fraude.",
    queHacer:
      "No lo abras y elimina el mensaje. Si te lo envió un contacto conocido, avísale: puede que le hayan robado la cuenta y la estén usando para reenviar la estafa.",
    evidencia: (r) => [
      {
        etiqueta: "Reportes de la comunidad",
        valor: String(r.community?.reportCount ?? 1),
        peligroso: true,
      },
    ],
    pregunta: {
      enunciado: "Si un enlace ya fue reportado por otras personas, ¿qué conviene hacer?",
      opciones: ["Abrirlo con cuidado para comprobarlo", "No abrirlo y eliminar el mensaje"],
      correcta: 1,
      explicacion:
        "No hay forma segura de «comprobar» una estafa abriéndola. Con solo cargar la página ya entregas información, y si ingresas datos el daño es inmediato.",
      nivel: "basico",
    },
  },

  typosquat: {
    id: "typosquat",
    titulo: "Este dominio imita a uno real",
    explicacion:
      "Los estafadores registran dominios que cambian, agregan o quitan una sola letra respecto del original. En la pantalla de un celular la diferencia es casi imposible de notar, y por eso funciona tan bien. No pasa solo con los bancos: también con hospitales, municipalidades y servicios públicos.",
    queHacer:
      "Nunca entres desde el enlace. Escribe tú mismo la dirección oficial en el navegador, o usa la app de la institución.",
    evidencia: (r) => [
      { etiqueta: "El que recibiste", valor: r.anatomy.host, peligroso: true },
      {
        etiqueta: "El real",
        valor: r.anatomy.typosquatOf ?? r.anatomy.lookalikeOf ?? "—",
        peligroso: false,
      },
    ],
    pregunta: {
      enunciado: "¿Cuál de estas dos direcciones es la verdadera?",
      opciones: ["falabela.cl", "falabella.cl"],
      correcta: 1,
      explicacion:
        "La real es falabella.cl, con doble «l». La otra quita una letra para pasar desapercibida.",
      nivel: "intermedio",
    },
  },

  homoglifo: {
    id: "homoglifo",
    titulo: "El dominio usa letras de otro alfabeto",
    explicacion:
      "Existen caracteres de alfabetos como el cirílico que se ven idénticos a los nuestros. Una «о» cirílica es visualmente igual a una «o» latina, pero para el navegador es un dominio completamente distinto. Es uno de los engaños más difíciles de detectar a simple vista.",
    queHacer:
      "Desconfía: este truco se usa casi exclusivamente para suplantar. Escribe la dirección oficial a mano en vez de usar el enlace.",
    evidencia: (r) => [
      { etiqueta: "Dominio real al que apunta", valor: r.anatomy.host, peligroso: true },
    ],
    pregunta: {
      enunciado:
        "Dos direcciones se ven exactamente iguales en pantalla. ¿Pueden llevar a sitios distintos?",
      opciones: ["No, si se ven iguales son el mismo sitio", "Sí, pueden usar letras de otro alfabeto"],
      correcta: 1,
      explicacion:
        "Sí. Dos direcciones pueden verse idénticas y apuntar a servidores totalmente distintos si una usa caracteres de otro alfabeto.",
      nivel: "avanzado",
    },
  },

  ip: {
    id: "ip",
    titulo: "El enlace apunta a una dirección IP",
    explicacion:
      "En vez de un nombre de dominio, este enlace lleva a una dirección numérica. Los bancos, los organismos del Estado y las empresas establecidas siempre publican sus servicios bajo su propio nombre de dominio.",
    queHacer:
      "No ingreses ningún dato. Una dirección numérica en un enlace que te llegó por mensaje es una de las señales de alarma más fuertes que existen.",
    evidencia: (r) => [{ etiqueta: "Destino", valor: r.anatomy.host, peligroso: true }],
    pregunta: {
      enunciado: "¿Tu banco te enviaría un enlace como http://45.33.32.156/login?",
      opciones: ["Sí, es uno de sus servidores", "No, siempre usan su dominio oficial"],
      correcta: 1,
      explicacion:
        "Nunca. Una institución seria publica sus servicios bajo su dominio, no bajo una dirección numérica.",
      nivel: "basico",
    },
  },

  certificado: {
    id: "certificado",
    titulo: "El certificado de seguridad tiene problemas",
    explicacion:
      "El candado de HTTPS solo sirve si el certificado detrás es válido. Este sitio presenta un certificado vencido, autofirmado o emitido para otro dominio, lo que significa que nadie confiable respalda que el sitio sea quien dice ser.",
    queHacer:
      "No continúes. Un sitio serio jamás deja vencer su certificado ni usa uno emitido para otro dominio.",
    evidencia: (r) => [{ etiqueta: "Dominio", valor: r.anatomy.host, peligroso: true }],
    pregunta: {
      enunciado: "¿Qué garantiza realmente el candado de HTTPS?",
      opciones: ["Que el sitio es confiable", "Que la conexión va cifrada"],
      correcta: 1,
      explicacion:
        "Solo que la conexión va cifrada. Quién está al otro lado lo respalda el certificado, y por eso importa que sea válido y esté emitido para ese dominio.",
      nivel: "avanzado",
    },
  },

  marca: {
    id: "marca",
    titulo: "Usa el nombre de una institución sin ser su sitio oficial",
    explicacion:
      "Que el nombre de una institución conocida aparezca dentro de la dirección no garantiza nada: cualquiera puede registrar un dominio que lo incluya. Lo que importa es el dominio principal, no las palabras que lo acompañan.",
    queHacer:
      "Verifica por un canal oficial: la app de la institución o su número de contacto publicado. Recuerda que los bancos no piden claves ni códigos por mensaje o correo.",
    evidencia: (r) => [
      { etiqueta: "Marca que aparenta", valor: r.anatomy.brandImpersonated ?? "—" },
      { etiqueta: "Dominio real", valor: r.anatomy.host, peligroso: true },
    ],
    pregunta: {
      enunciado: "En «bancoestado-clientes.online», ¿cuál es el dominio real?",
      opciones: ["bancoestado.cl", "bancoestado-clientes.online"],
      correcta: 1,
      explicacion:
        "El dominio real es bancoestado-clientes.online, que no tiene ninguna relación con BancoEstado. El nombre de la marca está puesto solo para generar confianza.",
      nivel: "intermedio",
    },
  },

  dominioNuevo: {
    id: "dominioNuevo",
    titulo: "El dominio se creó hace muy poco",
    explicacion:
      "Los sitios de estafa duran días: se crean, se usan en una campaña y se abandonan antes de que alcancen a bloquearlos. Por eso la antigüedad es una señal útil. Pero ojo con el otro lado: un emprendimiento o una empresa nueva también estrena su dominio, así que esto por sí solo no prueba que sea fraude. Lo que sí es raro es que una institución con décadas de existencia te escriba desde un dominio recién creado.",
    queHacer:
      "Fíjate en quién dice ser. Si se presenta como tu banco, el SII o una empresa conocida, un dominio nuevo es contradictorio y debes desconfiar. Si es un negocio pequeño que podría ser nuevo de verdad, verifícalo por otro canal antes de entregar datos o pagar.",
    evidencia: (r) => {
      const dias = r.anatomy.domainAgeDays;
      return [
        { etiqueta: "Dominio", valor: r.anatomy.host, peligroso: true },
        {
          etiqueta: "Antigüedad del registro",
          valor: dias === null || dias === undefined ? "—" : `${dias} días`,
          peligroso: true,
        },
      ];
    },
    pregunta: {
      enunciado:
        "El sitio de un banco con décadas de existencia, ¿qué antigüedad de dominio esperarías?",
      opciones: ["Pocas semanas", "Varios años"],
      correcta: 1,
      explicacion:
        "Años. Un dominio recién creado que dice representar a una institución antigua es una contradicción, y una de las señales más confiables de fraude.",
      nivel: "avanzado",
    },
  },

  acortador: {
    id: "acortador",
    titulo: "Es un enlace acortado: oculta su destino",
    explicacion:
      "Los acortadores esconden a dónde te lleva realmente el enlace. Son muy usados en estafas por mensaje de texto, justamente porque impiden que revises la dirección antes de tocarla.",
    queHacer:
      "No lo abras si no tienes certeza de quién te lo envió y por qué. Las instituciones serias rara vez usan acortadores en comunicaciones oficiales.",
    evidencia: (r) => {
      const ev: Evidencia[] = [
        { etiqueta: "Servicio acortador", valor: r.anatomy.shortenerService ?? "—", peligroso: true },
      ];
      if (r.expandedUrl) ev.push({ etiqueta: "Destino real", valor: r.expandedUrl, peligroso: true });
      return ev;
    },
    pregunta: {
      enunciado: "¿Cuál es el principal problema de un enlace acortado?",
      opciones: ["Que carga más lento", "Que no puedes ver a dónde te lleva"],
      correcta: 1,
      explicacion:
        "El riesgo es que oculta el destino: no puedes revisar el dominio antes de abrirlo, que es justamente la defensa más simple que tienes.",
      nivel: "basico",
    },
  },

  tld: {
    id: "tld",
    titulo: "La terminación del dominio es poco habitual",
    explicacion:
      "Terminaciones como .tk, .xyz o .top son gratuitas o muy baratas, por lo que concentran buena parte de las campañas de fraude. Las instituciones chilenas usan .cl, y las empresas establecidas, .com.",
    queHacer:
      "Desconfía si una institución chilena te contacta desde una terminación así. Por sí sola no prueba que sea estafa, pero combinada con urgencia o pedido de datos es señal clara.",
    evidencia: (r) => [
      { etiqueta: "Terminación", valor: r.anatomy.tld, peligroso: true },
      { etiqueta: "Dominio", valor: r.anatomy.host, peligroso: true },
    ],
    pregunta: {
      enunciado: "¿Desde qué terminación esperarías el sitio oficial del SII?",
      opciones: [".cl", ".top"],
      correcta: 0,
      explicacion:
        "Los organismos del Estado chileno usan .cl (y habitualmente .gob.cl). Una terminación como .top no corresponde a una institución pública.",
      nivel: "basico",
    },
  },

  subdominios: {
    id: "subdominios",
    titulo: "El dominio real está escondido entre subdominios",
    explicacion:
      "En una dirección web lo que manda es la parte final, justo antes de la terminación. Un enlace puede empezar con el nombre de tu banco y aun así llevar a otro sitio: «bancoestado.cl.verificar.xyz» NO es bancoestado.cl, es verificar.xyz.",
    queHacer:
      "Lee la dirección de derecha a izquierda: el dominio verdadero es el que está inmediatamente antes de la terminación.",
    evidencia: (r) => [{ etiqueta: "Dominio real", valor: r.anatomy.host, peligroso: true }],
    pregunta: {
      enunciado: "¿A qué sitio lleva realmente «bancoestado.cl.verificar.xyz»?",
      opciones: ["A bancoestado.cl", "A verificar.xyz"],
      correcta: 1,
      explicacion:
        "Lleva a verificar.xyz. Todo lo que está a la izquierda es decoración que el estafador controla libremente.",
      nivel: "avanzado",
    },
  },

  aleatorio: {
    id: "aleatorio",
    titulo: "La dirección incluye códigos al azar",
    explicacion:
      "Las campañas masivas generan una dirección distinta para cada víctima, con códigos aleatorios que le permiten al estafador saber quién hizo clic. Por eso la ruta o los parámetros parecen una secuencia sin sentido.",
    queHacer:
      "Trata el mensaje como sospechoso, sobre todo si te apura, te amenaza con un bloqueo o te promete un beneficio.",
    evidencia: (r) => [{ etiqueta: "Enlace analizado", valor: r.anatomy.normalizedUrl, peligroso: true }],
    pregunta: {
      enunciado: "Una dirección con códigos al azar, ¿qué suele indicar?",
      opciones: ["Que es un sitio moderno", "Que es parte de una campaña masiva"],
      correcta: 1,
      explicacion:
        "Ese código suele identificarte individualmente dentro de un envío masivo, y le confirma al estafador que su mensaje funcionó contigo.",
      nivel: "intermedio",
    },
  },

  sinHttps: {
    id: "sinHttps",
    titulo: "La conexión no está cifrada",
    explicacion:
      "Este sitio usa http:// en vez de https://, así que lo que escribas puede viajar sin protección. Ojo con lo contrario: que un sitio tenga candado NO lo hace confiable, porque los sitios de estafa también lo consiguen fácilmente. El candado habla del canal, no de quién está al otro lado.",
    queHacer: "No ingreses datos personales ni claves en un sitio sin cifrado.",
    evidencia: (r) => [{ etiqueta: "Enlace analizado", valor: r.anatomy.normalizedUrl, peligroso: true }],
    pregunta: {
      enunciado: "¿Un sitio con candado (https) es siempre seguro?",
      opciones: ["Sí, el candado garantiza que es legítimo", "No, solo indica que la conexión va cifrada"],
      correcta: 1,
      explicacion:
        "El candado solo significa que la comunicación va cifrada. Un sitio de estafa puede tenerlo igual: no dice nada sobre la honestidad de quien lo administra.",
      nivel: "intermedio",
    },
  },
};

// -----------------------------------------------------------------------------
// Selección del indicador dominante
// -----------------------------------------------------------------------------
// El documento pide desarrollar "el indicador que se acaba de detectar"
// (singular): se elige el de mayor valor formativo entre los que se activaron.

export function seleccionarMicrocapsula(r: AnalysisResult): Microcapsula | null {
  if (r.riskLevel === "safe") return null;
  const a = r.anatomy;

  if (r.community?.matched) return MICROCAPSULAS.comunidad;
  if (a.typosquatOf || a.lookalikeOf) return MICROCAPSULAS.typosquat;
  if (a.isPunycode) return MICROCAPSULAS.homoglifo;
  if (a.isIpLiteral) return MICROCAPSULAS.ip;
  if (a.certChainValid === false) return MICROCAPSULAS.certificado;
  if (a.brandImpersonated) return MICROCAPSULAS.marca;
  if (typeof a.domainAgeDays === "number" && a.domainAgeDays <= 90)
    return MICROCAPSULAS.dominioNuevo;
  if (a.isShortener) return MICROCAPSULAS.acortador;
  if (a.hasDangerousTld) return MICROCAPSULAS.tld;
  if (a.subdomainCount > 2) return MICROCAPSULAS.subdominios;
  if (a.pathPattern === "aleatorio" || a.hasRandomQuery) return MICROCAPSULAS.aleatorio;
  if (!a.hasHttps) return MICROCAPSULAS.sinHttps;
  return null;
}
