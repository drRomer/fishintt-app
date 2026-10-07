// =============================================================================
// Fishin't — Instrumento de medición del CRD (§3.2.3)
// =============================================================================
// Dos aplicaciones del mismo instrumento, con ítems DISTINTOS pero equivalentes
// en estructura y dificultad:
//   - PRE_TEST  (diagnóstico): antes de interactuar con el material formativo.
//   - POST_TEST: una vez completadas las microcápsulas y tras usar la plataforma.
//
// Cada aplicación tiene 12 ítems: 4 básicos (w=1), 4 intermedios (w=2) y
// 4 avanzados (w=3), según la ponderación de §3.2.1.
//
// Los ítems se construyen sobre casos reales de suplantación en Chile (banca,
// SII, AFP, reparto, casas comerciales) e incluyen COMUNICACIONES LEGÍTIMAS de
// esas mismas entidades como distractores, tal como exige §3.2.3: si todos los
// ítems fueran fraude, el instrumento mediría desconfianza, no discernimiento.
//
// NOTA: los textos deben ser revisados por el equipo antes de aplicarlos.
// =============================================================================

import type { NivelEjercicio } from "@/lib/ejercicios";

export interface ItemEvaluacion {
  id: string;
  nivel: NivelEjercicio;
  canal: "SMS" | "Correo" | "WhatsApp" | "Enlace";
  remitente: string;
  mensaje: string;
  /** true = es fraude; false = es una comunicación legítima (distractor). */
  esFraude: boolean;
  explicacion: string;
}

// -----------------------------------------------------------------------------
// PRE-TEST — diagnóstico inicial
// -----------------------------------------------------------------------------
export const PRE_TEST: ItemEvaluacion[] = [
  // --- Básicos (w = 1) -------------------------------------------------------
  {
    id: "pre-01",
    nivel: "basico",
    canal: "SMS",
    remitente: "+56 9 4471 2203",
    mensaje:
      "BANCOESTADO: Su cuenta sera BLOQUEADA hoy por seguridad. Valide su clave aqui: http://bancoestado-urgente.tk/validar",
    esFraude: true,
    explicacion:
      "Tres señales juntas: urgencia extrema, una terminación .tk que ninguna institución chilena usa, y la petición de la clave. Un banco nunca te pide la clave por mensaje.",
  },
  {
    id: "pre-02",
    nivel: "basico",
    canal: "WhatsApp",
    remitente: "Número desconocido",
    mensaje:
      "¡FELICIDADES! Resultaste ganador de un iPhone 16 en nuestro sorteo. Reclama tu premio en: https://bit.ly/3kPremio",
    esFraude: true,
    explicacion:
      "Premio que nunca participaste en ganar, más un enlace acortado que oculta el destino. El gancho del premio es de los más usados.",
  },
  {
    id: "pre-03",
    nivel: "basico",
    canal: "Correo",
    remitente: "notificaciones@falabella.com",
    mensaje:
      "Compra aprobada por $34.990 en Falabella. Si no reconoces esta transacción, llama al número que aparece al reverso de tu tarjeta.",
    esFraude: false,
    explicacion:
      "Comunicación legítima: informa, no pide nada. No incluye enlaces ni solicita datos, y te deriva a un canal que tú ya tienes (tu tarjeta).",
  },
  {
    id: "pre-04",
    nivel: "basico",
    canal: "SMS",
    remitente: "CHILEXPRESS",
    mensaje:
      "Tu envío 8841203 fue entregado. Revisa el detalle en chilexpress.cl/seguimiento",
    esFraude: false,
    explicacion:
      "Legítimo: el dominio es el oficial (chilexpress.cl), no pide datos y solo informa un estado de entrega.",
  },

  // --- Intermedios (w = 2) ---------------------------------------------------
  {
    id: "pre-05",
    nivel: "intermedio",
    canal: "Correo",
    remitente: "devoluciones@sii-devolucion.cl",
    mensaje:
      "Estimado contribuyente: tiene una devolución de impuestos pendiente por $187.450. Ingrese sus datos bancarios para recibir el depósito.",
    esFraude: true,
    explicacion:
      "El dominio oficial del SII es sii.cl, no sii-devolucion.cl. Además, el SII deposita en la cuenta que ya declaraste: nunca te pide datos bancarios por correo.",
  },
  {
    id: "pre-06",
    nivel: "intermedio",
    canal: "Correo",
    remitente: "seguridad@bancochile-seguridad.com",
    mensaje:
      "Detectamos un acceso inusual a su cuenta. Confirme su identidad en los próximos 30 minutos para evitar el bloqueo.",
    esFraude: true,
    explicacion:
      "El dominio real es bancochile.cl. Agregar la palabra «seguridad» y usar .com no lo hace oficial: cualquiera puede registrar ese dominio.",
  },
  {
    id: "pre-07",
    nivel: "intermedio",
    canal: "Correo",
    remitente: "contacto@chileatiende.gob.cl",
    mensaje:
      "Recordatorio: el plazo para postular al beneficio vence el 30 de este mes. Revisa los requisitos en chileatiende.gob.cl/fichas",
    esFraude: false,
    explicacion:
      "Legítimo: usa el dominio oficial del Estado (.gob.cl), informa un plazo real y no solicita datos personales ni pagos.",
  },
  {
    id: "pre-08",
    nivel: "intermedio",
    canal: "SMS",
    remitente: "+56 9 7712 0045",
    mensaje:
      "Correos de Chile: su paquete está retenido en aduana. Pague $2.990 para liberarlo: n9.cl/aduana23",
    esFraude: true,
    explicacion:
      "El pago de un monto pequeño para «liberar» un paquete es un patrón clásico. Además usa un acortador, que impide ver a dónde lleva realmente.",
  },

  // --- Avanzados (w = 3) -----------------------------------------------------
  {
    id: "pre-09",
    nivel: "avanzado",
    canal: "Enlace",
    remitente: "Enlace recibido por correo",
    mensaje: "https://bancoestado.cl.verificacion-clientes.xyz/acceso",
    esFraude: true,
    explicacion:
      "Parece empezar con bancoestado.cl, pero el dominio real es verificacion-clientes.xyz. Lo que manda es la parte final antes de la terminación: hay que leer de derecha a izquierda.",
  },
  {
    id: "pre-10",
    nivel: "avanzado",
    canal: "Enlace",
    remitente: "Enlace recibido por WhatsApp",
    mensaje: "https://www.santandor.cl/personas/login",
    esFraude: true,
    explicacion:
      "Dice «santandor» en vez de «santander». Un cambio de una sola letra es casi invisible en la pantalla de un celular.",
  },
  {
    id: "pre-11",
    nivel: "avanzado",
    canal: "Correo",
    remitente: "no-responder@afphabitat.cl",
    mensaje:
      "Tu cartola cuatrimestral ya está disponible. Descárgala iniciando sesión en afphabitat.cl con tu ClaveÚnica.",
    esFraude: false,
    explicacion:
      "Legítimo: dominio oficial, no adjunta archivos ni pide la clave en el mensaje; te indica iniciar sesión en el sitio, que es el procedimiento correcto.",
  },
  {
    id: "pre-12",
    nivel: "avanzado",
    canal: "Correo",
    remitente: "atencion@tesoreria.cl",
    mensaje:
      "Su deuda de contribuciones fue pagada correctamente. Adjuntamos comprobante en PDF. Para cualquier consulta, ingrese a tesoreria.cl",
    esFraude: false,
    explicacion:
      "Legítimo: confirma algo que el usuario hizo, usa el dominio oficial y no solicita datos. Un comprobante de un trámite que efectivamente realizaste es esperable.",
  },
];

// -----------------------------------------------------------------------------
// POST-TEST — ítems distintos, equivalentes en estructura y dificultad
// -----------------------------------------------------------------------------
export const POST_TEST: ItemEvaluacion[] = [
  // --- Básicos (w = 1) -------------------------------------------------------
  {
    id: "post-01",
    nivel: "basico",
    canal: "SMS",
    remitente: "+56 9 3390 7781",
    mensaje:
      "SII: Tiene una multa impaga. Regularice HOY o se iniciara cobranza judicial: http://sii-multas.top/pagar",
    esFraude: true,
    explicacion:
      "Amenaza legal inmediata más una terminación .top. El SII notifica por su sitio oficial y por carta, no amenaza por SMS con enlaces de pago.",
  },
  {
    id: "post-02",
    nivel: "basico",
    canal: "WhatsApp",
    remitente: "Número desconocido",
    mensaje:
      "Hola, soy tu hijo. Cambié de número. Necesito que me transfieras urgente a esta cuenta, después te explico.",
    esFraude: true,
    explicacion:
      "Es el «cuento del hijo»: urgencia, cambio de número y una transferencia. Siempre verifica llamando al número que ya tenías guardado.",
  },
  {
    id: "post-03",
    nivel: "basico",
    canal: "SMS",
    remitente: "ENTEL",
    mensaje:
      "Tu boleta de octubre ya está disponible. Revísala en mi.entel.cl o en la app Mi Entel.",
    esFraude: false,
    explicacion:
      "Legítimo: subdominio del dominio oficial (entel.cl), informa sin pedir datos y ofrece la app como alternativa.",
  },
  {
    id: "post-04",
    nivel: "basico",
    canal: "Correo",
    remitente: "boletas@metrogas.cl",
    mensaje:
      "Tu boleta de gas del período septiembre está disponible en tu cuenta de metrogas.cl. Monto: $23.410.",
    esFraude: false,
    explicacion:
      "Legítimo: dominio oficial, informa un monto y te remite a tu cuenta, sin enlaces de pago directo ni solicitud de datos.",
  },

  // --- Intermedios (w = 2) ---------------------------------------------------
  {
    id: "post-05",
    nivel: "intermedio",
    canal: "Correo",
    remitente: "beneficios@subsidio-gobierno.cl",
    mensaje:
      "Usted fue preseleccionado para el Bono de Invierno. Complete el formulario con su RUT y datos bancarios antes del viernes.",
    esFraude: true,
    explicacion:
      "Los beneficios del Estado se postulan en chileatiende.gob.cl o en el sitio del organismo. Un dominio .cl genérico que pide RUT y datos bancarios no es oficial.",
  },
  {
    id: "post-06",
    nivel: "intermedio",
    canal: "SMS",
    remitente: "+56 9 5520 3318",
    mensaje:
      "TAG Autopista: registra una deuda de $48.700. Evite el bloqueo de su patente pagando en tag-autopistas.online",
    esFraude: true,
    explicacion:
      "El dominio oficial es tag.cl. La terminación .online y la amenaza de bloquear la patente son el patrón típico de esta campaña.",
  },
  {
    id: "post-07",
    nivel: "intermedio",
    canal: "Correo",
    remitente: "servicioalcliente@bancoestado.cl",
    mensaje:
      "Hemos recibido tu solicitud de cambio de clave. Si no fuiste tú, acércate a una sucursal o llama al número de tu cartola.",
    esFraude: false,
    explicacion:
      "Legítimo: dominio oficial, avisa de una acción sin pedir que hagas clic en nada, y te deriva a canales presenciales o que ya posees.",
  },
  {
    id: "post-08",
    nivel: "intermedio",
    canal: "Correo",
    remitente: "info@mercadopago-chile.xyz",
    mensaje:
      "Tienes un pago pendiente de recibir por $89.900. Confirma tu cuenta para liberarlo.",
    esFraude: true,
    explicacion:
      "El dominio oficial es mercadopago.cl. La combinación de «dinero esperándote» y «confirma tu cuenta» busca que entregues credenciales.",
  },

  // --- Avanzados (w = 3) -----------------------------------------------------
  {
    id: "post-09",
    nivel: "avanzado",
    canal: "Enlace",
    remitente: "Enlace recibido por SMS",
    mensaje: "https://www.falabela.cl/cmr/pagar",
    esFraude: true,
    explicacion:
      "Le falta una «l»: lo correcto es falabella.cl. Este tipo de error deliberado está diseñado para pasar inadvertido en una lectura rápida.",
  },
  {
    id: "post-10",
    nivel: "avanzado",
    canal: "Enlace",
    remitente: "Enlace recibido por correo",
    mensaje: "http://190.114.252.18/bancoestado/ingreso.php",
    esFraude: true,
    explicacion:
      "Apunta a una dirección numérica (IP) en vez de un dominio. Ninguna institución publica sus servicios así; el nombre del banco está solo en la ruta, que el atacante controla.",
  },
  {
    id: "post-11",
    nivel: "avanzado",
    canal: "Correo",
    remitente: "notificacion@registrocivil.cl",
    mensaje:
      "Su hora para renovación de cédula fue agendada para el 14 de octubre a las 11:20 en la oficina que seleccionó. Puede reagendar en registrocivil.cl",
    esFraude: false,
    explicacion:
      "Legítimo: confirma un trámite que el usuario inició, con dominio oficial y sin solicitar datos ni pagos. Que mencione datos específicos no lo hace sospechoso si tú agendaste.",
  },
  {
    id: "post-12",
    nivel: "avanzado",
    canal: "Correo",
    remitente: "alertas@bancochile.cl",
    mensaje:
      "Compra rechazada por $156.000 en comercio extranjero. Si no la reconoces, bloquea tu tarjeta desde la app o llamando a tu ejecutivo.",
    esFraude: false,
    explicacion:
      "Legítimo: dominio oficial y, sobre todo, te pide actuar por la app o por teléfono, no por un enlace. Una alerta real te saca del correo, no te mantiene en él.",
  },
];

export const INSTRUMENTOS = { pre: PRE_TEST, post: POST_TEST } as const;
export type TipoInstrumento = keyof typeof INSTRUMENTOS;
