// =============================================================================
// Fishin't — Cyber-Academy: los tres niveles y sus pruebas de cierre
// =============================================================================
// Convierte las 13 microcápsulas de src/lib/data/microcapsulas.ts —que hasta
// ahora solo aparecían cuando el analizador marcaba un enlace— en un recorrido
// formativo ordenado (§2.4.1.a: el enlace entre detección y formación no puede
// depender de que la persona reciba una estafa).
//
// El contenido de las cápsulas NO se duplica: los niveles solo las ordenan. Lo
// único nuevo que vive acá son las pruebas de cierre.
//
// El orden de los niveles es el de la dificultad REAL de la señal, no el de la
// complejidad del texto:
//   1. Básico      — señales visibles en el enlace sin saber nada técnico.
//   2. Intermedio  — hay que saber leer un dominio.
//   3. Avanzado    — técnicas diseñadas para resistir una revisión a ojo.
// Coincide con el `nivel` que ya tenía la pregunta de cada cápsula, así que los
// pesos del componente C del CRD (básico=1, intermedio=2, avanzado=3) siguen
// siendo los mismos tanto si la cápsula se ve acá como en el analizador.
//
// NOTA: igual que las microcápsulas, estos textos son afirmaciones sobre
// instituciones chilenas dirigidas a usuarios vulnerables y deben ser revisados
// por el equipo antes de la entrega.
// =============================================================================

import type { IndicadorId } from "@/lib/data/microcapsulas";
import type { NivelEjercicio } from "@/lib/ejercicios";

/**
 * Ítem de la prueba de cierre de un nivel. A diferencia de la pregunta de una
 * cápsula, no desarrolla un indicador: lo pone a prueba mezclado con los otros
 * del mismo nivel, que es donde se ve si la persona realmente lo distingue.
 */
export interface ItemPrueba {
  id: string;
  /** Indicador que evalúa, para poder volver a su cápsula desde el resultado. */
  indicador: IndicadorId;
  /** Cómo llega el caso a la persona. Algunos ítems son conceptuales y no lo usan. */
  escenario?: string;
  /** Enlace a inspeccionar; se muestra en monoespaciado como en el analizador. */
  enlace?: string;
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
}

export interface NivelAcademia {
  id: NivelEjercicio;
  numero: number;
  nombre: string;
  /** Una línea que dice de qué va el nivel, para la tarjeta del índice. */
  lema: string;
  descripcion: string;
  /** Cápsulas del nivel, en orden de recorrido. */
  capsulas: IndicadorId[];
  prueba: ItemPrueba[];
}

/**
 * Fracción de aciertos necesaria para aprobar una prueba y abrir el nivel
 * siguiente: 3 de 4, o 4 de 5. La prueba se puede repetir cuantas veces se
 * quiera (el bloqueo no debe convertirse en un muro), pero para el componente C
 * del CRD solo cuenta el primer intento, igual que en el resto de la app.
 */
export const UMBRAL_PRUEBA = 0.75;

export function aciertosParaAprobar(total: number): number {
  return Math.ceil(total * UMBRAL_PRUEBA);
}

// -----------------------------------------------------------------------------

export const NIVELES: NivelAcademia[] = [
  // ---------------------------------------------------------------- Nivel 1 --
  {
    id: "basico",
    numero: 1,
    nombre: "Señales a simple vista",
    lema: "Lo que se nota sin saber nada técnico",
    descripcion:
      "Cuatro señales que puedes reconocer en el texto mismo del enlace, sin abrirlo y sin conocimientos previos. Son las que aparecen en la mayoría de las estafas que circulan por SMS y WhatsApp.",
    capsulas: ["ip", "tld", "acortador", "comunidad"],
    prueba: [
      {
        id: "prueba-basico-1",
        indicador: "ip",
        enlace: "http://45.33.32.156/bancoestado/ingreso",
        enunciado: "¿Qué tiene de raro este enlace?",
        opciones: [
          "Nada: es uno de los servidores del banco",
          "Que el destino es una dirección numérica y no un dominio",
          "Que la ruta diga «ingreso»",
        ],
        correcta: 1,
        explicacion:
          "Una institución seria publica sus servicios bajo su propio dominio. Que el nombre del banco aparezca después, en la ruta, no cambia nada: esa parte la escribe libremente quien armó el enlace.",
      },
      {
        id: "prueba-basico-2",
        indicador: "tld",
        enlace: "https://sii-multa.buzz/pagar",
        enunciado: "¿Podría el sitio oficial del SII terminar en «.buzz»?",
        opciones: [
          "Sí, los organismos públicos usan muchas terminaciones distintas",
          "No: los organismos del Estado chileno usan .cl, habitualmente .gob.cl",
        ],
        correcta: 1,
        explicacion:
          "Terminaciones como .buzz, .top o .xyz son baratas o gratuitas y por eso concentran buena parte de las campañas de fraude. Ningún organismo del Estado chileno te va a cobrar una multa desde una dirección así.",
      },
      {
        id: "prueba-basico-3",
        indicador: "acortador",
        escenario: "Un SMS dice: «Su encomienda está retenida. Pague la aduana aquí».",
        enlace: "https://acortar.link/bE9kZ",
        enunciado: "¿Por qué no basta con «fijarse bien» en este enlace?",
        opciones: [
          "Porque está mal escrito",
          "Porque el acortador oculta el destino: no hay dominio que revisar",
        ],
        correcta: 1,
        explicacion:
          "La defensa más simple que tienes es leer el dominio antes de tocar el enlace, y un acortador te la quita. Por eso son tan comunes en las estafas por mensaje.",
      },
      {
        id: "prueba-basico-4",
        indicador: "comunidad",
        escenario: "Analizas un enlace y Fishin't avisa que 37 personas ya lo reportaron.",
        enunciado: "¿Qué conviene hacer?",
        opciones: [
          "Abrirlo con cuidado, sin ingresar datos, para confirmar que es estafa",
          "No abrirlo, eliminar el mensaje y avisarle a quien te lo envió",
        ],
        correcta: 1,
        explicacion:
          "No hay forma segura de «confirmar» una estafa abriéndola: con solo cargar la página ya entregas información. Y si te lo mandó un conocido, avísale: puede que le hayan robado la cuenta.",
      },
    ],
  },

  // ---------------------------------------------------------------- Nivel 2 --
  {
    id: "intermedio",
    numero: 2,
    nombre: "Leer el dominio",
    lema: "Dónde mirar en una dirección web",
    descripcion:
      "El dominio es la única parte del enlace que el estafador no puede falsificar: tiene que registrarlo. Cinco lecciones para leerlo bien y no confundirlo con lo que lo rodea.",
    capsulas: ["marca", "typosquat", "aleatorio", "sinHttps", "noExiste"],
    prueba: [
      {
        id: "prueba-intermedio-1",
        indicador: "marca",
        enlace: "https://bancoestado-clientes.online/acceso",
        enunciado: "¿De quién es este dominio?",
        opciones: [
          "De BancoEstado: su nombre está en la dirección",
          "De quien registró «bancoestado-clientes.online», que puede ser cualquiera",
        ],
        correcta: 1,
        explicacion:
          "Cualquiera puede registrar un dominio que incluya el nombre de una institución. Lo que importa es el dominio completo, no las palabras que lo acompañan.",
      },
      {
        id: "prueba-intermedio-2",
        indicador: "typosquat",
        enunciado: "¿Cuál de estos dos es el dominio real de Correos de Chile?",
        opciones: ["correoschi1e.cl", "correoschile.cl"],
        correcta: 1,
        explicacion:
          "El falso cambia la «l» por el número 1. En la pantalla de un celular la diferencia es casi invisible, y por eso este truco funciona tan bien.",
      },
      {
        id: "prueba-intermedio-3",
        indicador: "aleatorio",
        enlace: "https://pagos-cl.com/a7f3b91c2e/validar",
        enunciado: "¿Qué suele indicar un código como «a7f3b91c2e» en la ruta?",
        opciones: [
          "Que el sitio es moderno y tiene buena seguridad",
          "Que el enlace identifica a cada destinatario de un envío masivo",
        ],
        correcta: 1,
        explicacion:
          "Las campañas generan un enlace distinto por víctima. Ese código le confirma al estafador quién hizo clic, y le dice que su mensaje funcionó contigo.",
      },
      {
        id: "prueba-intermedio-4",
        indicador: "sinHttps",
        escenario: "Un formulario de pago al que llegaste desde un anuncio.",
        enlace: "http://pagoenlinea-cl.com/ingreso",
        enunciado: "El enlace empieza con «http://» y no «https://». ¿Qué significa?",
        opciones: [
          "Que el sitio es falso con certeza",
          "Que lo que escribas puede viajar sin cifrar",
          "Que el sitio va a cargar más lento",
        ],
        correcta: 1,
        explicacion:
          "La «s» habla del canal, no de la honestidad de quien está al otro lado. Y al revés también: que un sitio tenga candado no lo vuelve confiable, porque los sitios de estafa lo consiguen igual de fácil.",
      },
      {
        id: "prueba-intermedio-5",
        indicador: "noExiste",
        escenario: "Analizas el enlace de un SMS y el dominio no responde: no existe.",
        enunciado: "¿Qué conclusión corresponde?",
        opciones: [
          "Que el mensaje era inofensivo, porque no hay nada que abrir",
          "Que no se pudo verificar nada, y quien te lo envió sigue siendo el problema",
        ],
        correcta: 1,
        explicacion:
          "Las páginas de estafa duran días y se dan de baja. Que hoy no cargue no cambia que alguien te la envió haciéndose pasar por una institución.",
      },
    ],
  },

  // ---------------------------------------------------------------- Nivel 3 --
  {
    id: "avanzado",
    numero: 3,
    nombre: "Engaños que no se ven",
    lema: "Cuando leer el dominio ya no alcanza",
    descripcion:
      "Cuatro técnicas diseñadas precisamente para resistir una revisión a ojo: el dominio se ve bien y aun así el enlace lleva a otra parte. Acá es donde la herramienta te dice algo que tú no podías ver.",
    capsulas: ["subdominios", "homoglifo", "certificado", "dominioNuevo"],
    prueba: [
      {
        id: "prueba-avanzado-1",
        indicador: "subdominios",
        enlace: "http://bancochile.cl.seguridad-cuenta.info/acceso",
        enunciado: "¿A qué sitio lleva realmente este enlace?",
        opciones: ["bancochile.cl", "seguridad-cuenta.info", "cl.seguridad-cuenta.info"],
        correcta: 1,
        explicacion:
          "Se lee de derecha a izquierda: manda lo que está justo antes de la terminación. Todo lo de la izquierda —incluido «bancochile.cl»— es decoración que el estafador escribe como quiera.",
      },
      {
        id: "prueba-avanzado-2",
        indicador: "homoglifo",
        enunciado: "En el analizador aparece «xn--bancoestad-nvi.cl». ¿Qué indica ese «xn--»?",
        opciones: [
          "Que es un subdominio interno del banco",
          "Que el dominio tiene letras de otro alfabeto, traducidas a texto legible",
        ],
        correcta: 1,
        explicacion:
          "El navegador convierte a «xn--» cualquier dominio con caracteres no latinos. Es la forma de ver un engaño que en pantalla era invisible: el enlace se veía idéntico al del banco.",
      },
      {
        id: "prueba-avanzado-3",
        indicador: "certificado",
        escenario: "El navegador avisa: «el certificado de este sitio fue emitido para otro dominio».",
        enunciado: "¿Qué significa eso en la práctica?",
        opciones: [
          "Que la conexión no va cifrada",
          "Que nadie respalda que el sitio sea quien dice ser",
          "Que el certificado está por vencer",
        ],
        correcta: 1,
        explicacion:
          "La conexión puede ir cifrada igual. Lo que falla es la identidad: el certificado es el documento que acredita de quién es el sitio, y este está a nombre de otro.",
      },
      {
        id: "prueba-avanzado-4",
        indicador: "dominioNuevo",
        escenario: "El analizador avisa que un dominio se registró hace 11 días.",
        enunciado: "¿Cuándo esa antigüedad es de verdad una señal de fraude?",
        opciones: [
          "Siempre: un dominio recién creado es fraude",
          "Cuando el sitio dice representar a una institución que existe desde hace décadas",
          "Nunca: todos los dominios fueron nuevos alguna vez",
        ],
        correcta: 1,
        explicacion:
          "Un emprendimiento o una PyME también estrena su dominio, así que la edad sola no acusa a nadie. Lo contradictorio es que un banco con cien años de historia te escriba desde un dominio de la semana pasada.",
      },
    ],
  },
];

// -----------------------------------------------------------------------------

export const TOTAL_CAPSULAS = NIVELES.reduce((n, nv) => n + nv.capsulas.length, 0);

export function getNivel(id: string | undefined): NivelAcademia | null {
  return NIVELES.find((n) => n.id === id) ?? null;
}

/** Nivel al que pertenece un indicador; lo usa el analizador para enlazar. */
export function nivelDeIndicador(indicador: IndicadorId): NivelEjercicio {
  const nivel = NIVELES.find((n) => n.capsulas.includes(indicador));
  return nivel?.id ?? "basico";
}
