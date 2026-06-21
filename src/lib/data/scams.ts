// Base de datos de estafas comunes en Chile
// Fuentes: ANCI, BancoEstado, ABIF, SERNAC, Kaspersky, CSIRT Chile, CutSecurity
// Actualizado: 2026

export type Severity = "alta" | "media" | "baja";
export type Category = "banco" | "delivery" | "gobierno" | "afp" | "telco" | "retail" | "energia";

export type ScamImageType =
  | "email-bank"      // BancoEstado
  | "email-santander" // Santander
  | "email-afp"       // AFP Habitat
  | "email-gov"       // SII
  | "sms-bank"        // Banco de Chile
  | "sms-cmr"         // Falabella CMR
  | "sms-metrogas"    // Metrogas
  | "sms-puntos"      // LATAM Pass / smishing puntos
  | "sms-package"     // Correos de Chile
  | "vishing-call";   // Vishing telefónico

export interface Scam {
  id: string;
  institution: string;
  shortName: string;
  category: Category;
  severity: Severity;
  modusOperandi: string;
  description: string;
  signs: string[];
  reportedCases: number;
  realExample: string;
  howToVerify: string;
  initials: string;
  image: ScamImageType;
}

export const SCAMS: Scam[] = [
  {
    id: "bancoestado-actualizar-datos",
    institution: "BancoEstado",
    shortName: "BancoEstado",
    category: "banco",
    severity: "alta",
    modusOperandi: "Correo / SMS solicitando actualizar datos",
    description: "Correos electrónicos y SMS masivos que aparentan venir de BancoEstado, pidiendo actualizar datos personales mediante un enlace. La página falsa replica con detalle el sitio oficial.",
    signs: [
      "El correo contiene un enlace (BancoEstado NUNCA envía links en sus emails)",
      "Amenaza con bloqueo o multa si no actualizas datos",
      "Solicita RUT, clave de internet y coordenadas de tarjeta",
      "Remitente no es @bancoestado.cl",
    ],
    reportedCases: 158,
    realExample: "Aviso de Seguridad: Su cuenta será bloqueada en 24h por inactividad. Verifique sus datos en bancoestado-verificacion.cl",
    howToVerify: "Llama al 600 200 7000 o entra manualmente al sitio oficial bancoestado.cl",
    initials: "BE",
    image: "email-bank",
  },
  {
    id: "banco-de-chile-sms-transaccion",
    institution: "Banco de Chile",
    shortName: "Banco de Chile",
    category: "banco",
    severity: "alta",
    modusOperandi: "SMS con enlace para 'verificar transacción'",
    description: "SMS que alerta sobre una transacción sospechosa y pide hacer click en un link para 'verificarla'. El link lleva a una página clonada del banco.",
    signs: [
      "El SMS llega desde un número de 8 dígitos (oficial usa nombre)",
      "Lenguaje urgente: 'inmediatamente', 'última oportunidad'",
      "URL no es bancochile.cl (revisa antes de hacer click)",
      "Pide claves o coordenadas en la página",
    ],
    reportedCases: 162,
    realExample: "Banco de Chile: Detectamos una transferencia de $850.000. Si no la reconoces verifica aqui: bch-seguridad.com/v",
    howToVerify: "Llama al 600 637 3737 o usa la app oficial Banco de Chile",
    initials: "BC",
    image: "sms-bank",
  },
  {
    id: "correos-de-chile-paquete-retenido",
    institution: "Correos de Chile",
    shortName: "Correos de Chile",
    category: "delivery",
    severity: "media",
    modusOperandi: "Paquete retenido por 'aduana' con cobro pendiente",
    description: "Notificación falsa de paquete retenido en aduana que requiere un pago pequeño ($2.990 - $4.990) para liberación. El sitio captura datos de tarjeta y los cobros reales son mucho mayores.",
    signs: [
      "Notificación inesperada (no esperabas un paquete)",
      "Monto pequeño que 'no vale la pena dudar'",
      "URL acortada o con dominio extraño",
      "Página no termina en .cl o no es correoschile.cl",
    ],
    reportedCases: 87,
    realExample: "Correos de Chile: Tu paquete está retenido en aduana. Pago pendiente $3.490 CLP. Liberar: bit.ly/paq-cl",
    howToVerify: "Entra a correoschile.cl con el código de seguimiento oficial",
    initials: "CC",
    image: "sms-package",
  },
  {
    id: "santander-clonacion-credenciales",
    institution: "Santander",
    shortName: "Santander",
    category: "banco",
    severity: "alta",
    modusOperandi: "Página clonada para robo de credenciales",
    description: "Sitio web que replica casi perfectamente el de Santander Chile. Llega vía mail o link patrocinado en Google.",
    signs: [
      "URL es santander-cl.com o santanderchile.online (NO santander.cl)",
      "Pide RUT + clave + token al mismo tiempo",
      "La sesión 'expira' rápidamente para presionarte",
      "No hay candado HTTPS o el certificado está vencido",
    ],
    reportedCases: 134,
    realExample: "santander-cl.com — Página idéntica al sitio oficial pero con campos extra de tarjeta de coordenadas",
    howToVerify: "Solo accede vía app Santander o tipea santander.cl manualmente",
    initials: "SA",
    image: "email-santander",
  },
  {
    id: "afp-habitat-tramite-urgente",
    institution: "AFP Habitat",
    shortName: "AFP Habitat",
    category: "afp",
    severity: "media",
    modusOperandi: "Trámite urgente o 'devolución de fondos'",
    description: "Correos que prometen devolución de fondos previsionales o requieren 'trámite urgente'. Apuntan especialmente a adultos mayores y personas próximas a jubilarse.",
    signs: [
      "Promete devoluciones o bonos extraordinarios",
      "Pide RUT, clave única y datos bancarios",
      "Crea urgencia con plazos cortos",
      "No coincide con tu AFP real (verifica)",
    ],
    reportedCases: 94,
    realExample: "AFP Habitat: Tienes una devolución pendiente de $1.247.000 por reajuste. Reclama antes del 31/12",
    howToVerify: "Entra a afphabitat.cl o llama al 600 600 9090",
    initials: "AH",
    image: "email-afp",
  },
  {
    id: "sii-multa-tributaria",
    institution: "SII (Servicio de Impuestos Internos)",
    shortName: "SII",
    category: "gobierno",
    severity: "alta",
    modusOperandi: "Multa tributaria o trámite obligatorio",
    description: "Correos suplantando al SII con supuestas multas tributarias, devoluciones de impuestos o trámites obligatorios. Llevan a páginas falsas para robar credenciales SII.",
    signs: [
      "Remitente no es @sii.cl",
      "Adjunto PDF con macros o link para 'descargar formulario'",
      "Lenguaje legal-amenazante",
      "Promete devolución sospechosamente alta",
    ],
    reportedCases: 121,
    realExample: "SII: Tiene una multa tributaria de UF 12 pendiente. Regularice en sii-tramites.org antes de 5 días",
    howToVerify: "Entra a sii.cl con tu clave única; o llama al 600 360 5544",
    initials: "SI",
    image: "email-gov",
  },
  {
    id: "falabella-cmr-compra-no-reconocida",
    institution: "Falabella / CMR",
    shortName: "Falabella",
    category: "retail",
    severity: "media",
    modusOperandi: "Compra no reconocida en tu CMR",
    description: "SMS o correo alertando de una compra cara no reconocida en la tarjeta CMR, con link para 'anular'. Captura claves de CMR Falabella.",
    signs: [
      "Compra inverosímilmente grande ($1.5M+)",
      "Link para 'cancelar la compra' lleva a sitio falso",
      "Pide clave CMR + número de tarjeta + CVV",
      "URL no es falabella.com o cmrfalabella.com",
    ],
    reportedCases: 76,
    realExample: "CMR: Compra de $2.890.000 en MediaMarkt Europa. Si no reconoces anula aqui: cmr-anular.net",
    howToVerify: "Llama al 600 390 5000 o entra a cmrfalabella.com",
    initials: "FA",
    image: "sms-cmr",
  },
  {
    id: "metrogas-corte-suministro",
    institution: "Metrogas",
    shortName: "Metrogas",
    category: "energia",
    severity: "media",
    modusOperandi: "Corte de suministro por deuda",
    description: "SMS que amenaza con cortar el suministro de gas en horas si no se paga una deuda inmediatamente. El link de pago va a una pasarela falsa.",
    signs: [
      "Amenaza con corte en pocas horas",
      "Deuda inesperada (revisa tu boleta real)",
      "Link de pago va a dominio raro",
      "No mencionan tu número de cliente real",
    ],
    reportedCases: 52,
    realExample: "METROGAS: Su servicio sera cortado HOY a las 14:00 por deuda de $87.940. Pague aqui para evitar corte: pay-mg.co",
    howToVerify: "Llama al 600 600 8000 o revisa tu boleta en metrogas.cl",
    initials: "MG",
    image: "sms-metrogas",
  },
  {
    id: "vishing-ejecutivo-banco",
    institution: "Falso ejecutivo de banco",
    shortName: "Vishing telefónico",
    category: "banco",
    severity: "alta",
    modusOperandi: "Llamada de 'ejecutivo' pidiendo claves",
    description: "Llamada telefónica de alguien que dice ser ejecutivo de cuentas, soporte o seguridad del banco. Apela a urgencia psicológica y usa datos reales filtrados (RUT, nombre) para ganar confianza. Es el 'cuento del tío' moderno.",
    signs: [
      "Te pide claves, coordenadas, o código de autorización (NINGÚN banco pide esto)",
      "Apremia con tiempos cortos: 'tienes 10 minutos'",
      "Cita datos reales tuyos (RUT, dirección) para parecer legítimo",
      "Te pide que NO cortes ni consultes con nadie",
      "Usa IA para clonar voz de ejecutivos reales",
    ],
    reportedCases: 213,
    realExample: "Llamada de '+56 2 2580 XXXX': 'Hola, soy Pablo de seguridad de BancoEstado. Detectamos un fraude en tu cuenta. Necesito que confirmes tu clave para bloquearla...'",
    howToVerify: "CUELGA INMEDIATAMENTE y llama tú al número oficial impreso en tu tarjeta",
    initials: "VI",
    image: "vishing-call",
  },
  {
    id: "smishing-puntos-vencer",
    institution: "Falsos puntos / canjes",
    shortName: "Smishing puntos",
    category: "retail",
    severity: "media",
    modusOperandi: "Puntos por vencer / canje pendiente",
    description: "SMS masivos alertando que tienes puntos por vencer (LATAM Pass, CMR Puntos, Movistar, Entel) y debes 'canjearlos antes que expiren' haciendo click.",
    signs: [
      "Mensaje genérico que no usa tu nombre real",
      "URL es muy corta o usa servicio bit.ly/tinyurl",
      "Cantidad de puntos sospechosamente alta",
      "Pide login en página externa para 'canjear'",
    ],
    reportedCases: 89,
    realExample: "LATAM Pass: Tus 47.500 puntos vencen MAÑANA. Canjea ahora: lp-canje.cc/3xR9",
    howToVerify: "Entra directamente a la app oficial del programa de puntos",
    initials: "PU",
    image: "sms-puntos",
  },
];

// Stats globales para mostrar en el home
export const GLOBAL_STATS = {
  totalCases: SCAMS.reduce((sum, s) => sum + s.reportedCases, 0),
  highSeverity: SCAMS.filter((s) => s.severity === "alta").length,
  // Datos reales del research
  yearlyAttemptsChile: "37 millones",
  growth2023to2024: "125%",
  rankLatam: "3°",
  yearlyCommerceAttempts: "6,4 millones",
};

export function getSeverityColor(severity: Severity) {
  switch (severity) {
    case "alta":
      return { bg: "bg-brand-50", text: "text-brand-700", border: "border-brand-200", dot: "bg-brand-500" };
    case "media":
      return { bg: "bg-warn-50", text: "text-warn-900", border: "border-warn-200", dot: "bg-warn-500" };
    case "baja":
      return { bg: "bg-safe-50", text: "text-safe-900", border: "border-safe-200", dot: "bg-safe-500" };
  }
}

export function getCategoryLabel(category: Category) {
  const labels: Record<Category, string> = {
    banco: "Banco",
    delivery: "Delivery",
    gobierno: "Gobierno",
    afp: "AFP",
    telco: "Telecom",
    retail: "Retail",
    energia: "Servicios",
  };
  return labels[category];
}
