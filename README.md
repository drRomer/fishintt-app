# Fishin't 🛡️

> Tu escudo contra el phishing y las estafas en línea en Chile.

App web responsiva (mobile-first) que protege a usuarios chilenos contra phishing, smishing, vishing y otras estafas digitales. Construida con **Next.js 14 + Supabase + Tailwind CSS** — lista para deploy en Vercel.

**Proyecto universitario** — Ingeniería Civil Informática, Universidad Mayor. Profesor: Isabel Alvarado Strange. Equipo: Jocelyn Ercoli Pasmiño, Tomás Romero, Fernando Riquelme, Robert Steelheart.

---

## Características

- **🔍 Analizador de URLs** — Heurísticas locales + arquitectura lista para VirusTotal / Safe Browsing
- **📚 Educación contextualizada** — 6 tipos de amenazas con ejemplos reales de Chile
- **🇨🇱 Base de datos de estafas reales** — 10 casos documentados (BancoEstado, Banco de Chile, AFP, Correos, SII, Falabella, Metrogas, vishing con IA, smishing de puntos)
- **💬 Operador IA + humano** — Soporte combinado con FAQs basadas en Ley 20.009 y PDI Cibercrimen
- **👤 Perfil con gamificación** — Insignias, estadísticas, score de protección
- **📱 Mobile-first responsive** — Funciona en cualquier explorador (móvil y desktop)
- **🔐 Auth Supabase** — Email/password con modo demo (admin@admin.cl / admin) si Supabase no está configurado

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) + React 18 |
| Styling | Tailwind CSS 3 + Inter (Google Fonts) |
| Iconos | Lucide React |
| Backend | Supabase (Auth + Postgres + RLS) |
| Deploy | Vercel (GitHub-connected) |
| Lenguaje | TypeScript |

---

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev          # http://localhost:3000

# Build de producción
npm run build

# Lint
npm run lint
```

---

## Modo demo

La app funciona sin Supabase configurado usando `sessionStorage`. Para probar:

- **Email**: `admin@admin.cl`
- **Clave**: `admin`

Cuando agregues las variables de entorno de Supabase, automáticamente cambia a auth real.

---

## Estructura del proyecto

```
fishintt-app/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing / Splash
│   │   ├── login/                # Inicio de sesión
│   │   ├── register/             # Registro
│   │   └── (app)/                # Rutas autenticadas (con bottom nav)
│   │       ├── home/             # Dashboard
│   │       ├── analizar/         # Analizador de URLs (hero feature)
│   │       ├── educacion/        # Tipos de phishing
│   │       ├── ejemplos/         # Estafas reales en Chile
│   │       ├── reportar/         # Reportar amenazas
│   │       ├── operador/         # Soporte + FAQs
│   │       └── perfil/           # Perfil de usuario
│   ├── components/               # Logo, BottomNav
│   ├── lib/
│   │   ├── supabase.ts           # Cliente Supabase
│   │   ├── utils.ts
│   │   └── data/
│   │       ├── scams.ts          # Base de datos de estafas chilenas
│   │       └── education.ts      # Contenido educativo
├── supabase/
│   └── schema.sql                # Schema con RLS y triggers
└── public/
    ├── favicon.svg
    └── manifest.json             # PWA manifest
```

---

## Próximos pasos

Para llevar esto a producción ver **[DEPLOY.md](./DEPLOY.md)** con instrucciones paso a paso de:

1. Crear repo en GitHub
2. Crear proyecto Supabase y ejecutar `schema.sql`
3. Deploy en Vercel conectando el repo
4. Configurar variables de entorno

---

## Fuentes de datos

El contenido de la app está basado en investigación real:

- **ANCI** (Agencia Nacional de Ciberseguridad de Chile) — Boletines 2025
- **BancoEstado** — Sección "Juntos contra el Fraude"
- **Kaspersky** — 37M intentos de phishing en Chile / año
- **CutSecurity Chile** — Casos documentados 2025
- **PDI Cibercrimen** — Tipologías y procedimientos
- **Ley N° 20.009** — Protección de víctimas de fraude
- **Corte Suprema** (mayo 2025) — Devolución de fondos en "cuento del tío"

---

## Licencia

Proyecto académico — Universidad Mayor, 2026.
