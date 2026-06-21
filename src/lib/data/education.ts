// Contenido educativo sobre phishing y estafas
// Fuentes: ANCI, Hackmetrix, CutSecurity, BancoEstado, SERNAC

import { Mail, Link as LinkIcon, Phone, Smartphone, QrCode, ShieldAlert } from "lucide-react";

export interface ThreatType {
  id: string;
  name: string;
  icon: typeof Mail;
  description: string;
  signs: string[];
  prevention: string[];
  example: string;
}

export const THREAT_TYPES: ThreatType[] = [
  {
    id: "phishing",
    name: "Phishing tradicional",
    icon: Mail,
    description: "Correos electrónicos fraudulentos que imitan a entidades legítimas (bancos, AFP, gobierno) para robar tus credenciales o datos personales.",
    signs: [
      "El remitente no coincide con el dominio oficial",
      "Errores ortográficos o de redacción",
      "Crea urgencia ('actúa ahora', 'última oportunidad')",
      "Pide datos sensibles por mail (ningún banco lo hace)",
      "Logos pixelados o de baja calidad",
    ],
    prevention: [
      "Verifica el remitente carácter por carácter",
      "No hagas click en enlaces de mails — entra manualmente al sitio",
      "Activa autenticación de 2 factores en tu banca",
      "Si dudas, llama por teléfono al banco al número oficial",
    ],
    example: "Asunto: 'BancoEstado - Actualice sus datos antes de 24h o su cuenta será bloqueada'. Remitente: bancoestado@security-update.net",
  },
  {
    id: "smishing",
    name: "Smishing (SMS)",
    icon: Smartphone,
    description: "Mensajes SMS fraudulentos que simulan alertas bancarias, entregas o solicitudes de verificación. Es el vector más usado en Chile hoy.",
    signs: [
      "Llega desde un número de 8 dígitos (oficial usa nombre)",
      "Contiene enlace acortado (bit.ly, tinyurl)",
      "Mensaje genérico que no usa tu nombre",
      "Urgencia extrema ('en 1 hora', 'hoy mismo')",
      "Promete dinero o asusta con multas",
    ],
    prevention: [
      "NUNCA hagas click en links de SMS de bancos",
      "Si parece urgente, llama al banco directamente",
      "Reporta el SMS como spam y bloquéalo",
      "Los bancos verdaderos NO mandan SMS con links",
    ],
    example: "'Banco de Chile: Detectamos transferencia de $850.000. Verifica: bch-seguridad.com'",
  },
  {
    id: "vishing",
    name: "Vishing (llamadas)",
    icon: Phone,
    description: "Llamadas telefónicas en que se hacen pasar por ejecutivos del banco, soporte técnico o autoridades. El 'cuento del tío' moderno, ahora con IA para clonar voces.",
    signs: [
      "Te llaman 'de parte' del banco pidiendo claves",
      "Mencionan datos reales tuyos (RUT, dirección) para parecer legítimos",
      "Apuran con tiempos cortos",
      "Te piden NO consultar con nadie ni colgar",
      "Voz suena un poco 'metálica' o artificial (IA)",
    ],
    prevention: [
      "Ningún banco te llamará para pedir tu clave",
      "Si dudas, CUELGA y llama tú al número oficial",
      "No confirmes datos sensibles por teléfono",
      "Habla con un familiar antes de transferir dinero",
    ],
    example: "'Hola, soy Pablo de seguridad de BancoEstado. Detectamos fraude en su cuenta. Necesito su clave para bloquearla...'",
  },
  {
    id: "qrishing",
    name: "QRishing (códigos QR)",
    icon: QrCode,
    description: "Códigos QR maliciosos pegados sobre QRs legítimos (en parquímetros, restaurantes, afiches de pago) que redirigen a sitios falsos.",
    signs: [
      "QR pegado encima de otro QR",
      "QR en lugar inesperado o mal impreso",
      "Te lleva a una URL que no parece la oficial",
      "Te pide login antes de mostrar la información",
    ],
    prevention: [
      "Verifica que no haya un sticker QR sobre el original",
      "Lee la URL antes de continuar tras escanear",
      "Prefiere pagos por la app oficial cuando se pueda",
      "Desconfía de QRs que aparecen en mails o SMS",
    ],
    example: "QR pegado sobre el parquímetro real, redirige a un sitio que cobra $50.000 en vez de $1.200",
  },
  {
    id: "pharming",
    name: "Pharming",
    icon: LinkIcon,
    description: "Manipulación del DNS o infección del dispositivo para redirigirte a páginas falsas aunque escribas bien la URL del banco. El más peligroso porque no requiere que hagas click en nada.",
    signs: [
      "El sitio del banco se ve 'raro' o ligeramente distinto",
      "Tu antivirus alerta del sitio que SIEMPRE visitas",
      "Te pide datos que normalmente no pide",
      "La URL en la barra cambia ligeramente",
    ],
    prevention: [
      "Mantén tu antivirus actualizado",
      "Usa solo redes Wi-Fi confiables (no abiertas)",
      "Activa 2FA: aunque te roben claves, no entran",
      "Usa la app oficial del banco en vez del navegador",
    ],
    example: "Escribes bancochile.cl pero el DNS de tu router infectado te lleva a una IP falsa que muestra una página clonada",
  },
  {
    id: "whaling",
    name: "Whaling (ejecutivos)",
    icon: ShieldAlert,
    description: "Variante avanzada de phishing dirigida específicamente a CEOs, gerentes y dueños de empresa. Pide transferencias urgentes 'autorizadas' por superiores.",
    signs: [
      "Correo desde supuesto CEO pidiendo transferencia urgente",
      "Cuenta de destino en banco externo o internacional",
      "Pide confidencialidad ('no comentes con nadie')",
      "Lenguaje formal pero apurado",
      "Llega justo antes de fin de semana o feriado",
    ],
    prevention: [
      "Política empresarial: nunca transferir sin verificar en persona o por llamada",
      "Doble factor para autorizar transferencias grandes",
      "Capacitación regular del área de finanzas",
      "Verificar dominio del remitente carácter por carácter",
    ],
    example: "'CEO: Necesito que transfieras $25M a esta cuenta antes de las 18:00 para cerrar deal estratégico. No comentes con nadie aún.'",
  },
];

// Señales generales de alerta
export const RED_FLAGS = [
  {
    title: "Solicitudes urgentes de información personal",
    description: "Bancos e instituciones serias nunca apuran por SMS, mail o teléfono",
  },
  {
    title: "Amenazas o consecuencias inmediatas",
    description: "'Tu cuenta será bloqueada hoy' o 'multa en 24h' son señales clásicas",
  },
  {
    title: "Ofertas demasiado buenas para ser verdad",
    description: "Devoluciones millonarias, premios sin haber participado, beneficios extra",
  },
  {
    title: "Errores ortográficos o de redacción",
    description: "Las comunicaciones oficiales pasan por revisión profesional",
  },
  {
    title: "URLs sospechosas",
    description: "Letras cambiadas (bancoestado vs bancoesatdo), guiones extra, dominios .com cuando deberían ser .cl",
  },
];

// FAQs comunes
export const FAQS = [
  {
    q: "¿Cómo reporto un enlace sospechoso?",
    a: "Desde la pantalla principal toca 'Reportar Enlace Sospechoso', pega la URL y agrega contexto. Nuestro equipo lo analiza y alerta a la comunidad si confirma la amenaza.",
  },
  {
    q: "¿Qué hago si caí en una estafa?",
    a: "1) Llama de inmediato a tu banco para bloquear cuentas y tarjetas. 2) Cambia todas tus claves. 3) Hace una denuncia en PDI Cibercrimen (cibercrimen.pdichile.cl) o en una comisaría. 4) Por la Ley 20.009, el banco debe devolverte montos no autorizados hasta cierto umbral.",
  },
  {
    q: "¿Cómo protejo mi información personal?",
    a: "Activa autenticación de dos factores en todas tus cuentas, usa contraseñas únicas, no compartas datos sensibles por mail/SMS/teléfono, mantén tu sistema operativo actualizado, y revisa periódicamente tus movimientos bancarios.",
  },
  {
    q: "¿Mi banco me devolverá el dinero si me estafan?",
    a: "Según la Ley N° 20.009, los bancos deben restituir transacciones no autorizadas hasta cierto umbral, incluso en casos de 'cuento del tío'. En mayo 2025 la Corte Suprema confirmó esto. Reporta dentro de las primeras 24h para mejorar tus posibilidades.",
  },
  {
    q: "¿Cómo funciona el análisis de URLs?",
    a: "Cruzamos la URL contra bases de datos globales de amenazas (VirusTotal, Google Safe Browsing), verificamos la antigüedad y reputación del dominio (WHOIS), y aplicamos un modelo de inteligencia artificial entrenado con casos chilenos.",
  },
  {
    q: "¿Por qué Chile es un blanco frecuente?",
    a: "Chile tiene alta penetración de banca digital, mejor infraestructura que el promedio latinoamericano, y un mercado vulnerable porque la educación en ciberseguridad aún es incipiente. Entre 2023-2024 los intentos crecieron 125% (Kaspersky).",
  },
];
