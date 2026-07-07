# Fishin't — Resumen del proyecto (handoff para Claude Code)

> Documento de traspaso para continuar el desarrollo en Claude Code.
> Última actualización: julio 2026.

---

## 1. Qué es

**Fishin't** es una app web SaaS anti-phishing enfocada en Chile (proyecto universitario, Ing. Civil Informática, U. Mayor). Permite analizar enlaces sospechosos, aprender a identificar estafas, y reportar amenazas que alimentan una base de datos comunitaria.

- **Repo:** https://github.com/drRomer/fishintt-app (rama `main`)
- **Equipo:** Tomás Romero (líder técnico), Jocelyn Ercoli, Fernando Riquelme, Robert Steelheart
- **Entrega:** 10 de octubre

---

## 2. Stack y arquitectura

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** (Auth + Postgres + RLS)
- **Vercel** (hosting; despliegue automático al hacer push a `main`)
- IA opcional: **Google Gemini** (tier gratuito)

> **Importante:** `next.config.mjs` **NO** debe llevar `output: 'export'`. Se quitó porque desactiva las API routes; en Vercel la app corre como serverless normal.

### Estructura de `src/`

```
src/
├─ app/
│  ├─ layout.tsx                 # layout raíz (envuelve ThemeProvider)
│  ├─ globals.css                # estilos + modo oscuro (ver §6)
│  ├─ page.tsx                   # landing
│  ├─ login/ register/           # auth
│  ├─ reset-password/            # solicitar recuperación
│  ├─ reset-password-confirm/    # setear nueva contraseña (flujo PKCE)
│  ├─ api/
│  │  ├─ analyze/route.ts        # ★ análisis server-side (ver §4)
│  │  └─ reset-password/route.ts # (obsoleto, ya no se usa — se puede borrar)
│  └─ (app)/                     # zona autenticada (bottom nav + tema)
│     ├─ layout.tsx
│     ├─ home/ analizar/ educacion/ ejemplos/ operador/ perfil/ reportar/
├─ components/
│  ├─ Logo.tsx                   # logo.png en círculo blanco (NO reemplazar)
│  ├─ BottomNav.tsx  ThemeProvider.tsx  ThemeToggle.tsx (este último quedó sin uso)
└─ lib/
   ├─ analysis.ts                # ★ motor de análisis (determinista)
   ├─ activity.ts                # ★ conteo de actividad + insignias
   ├─ supabase.ts                # cliente browser (getSupabase)
   ├─ utils.ts
   └─ data/ (education.ts, scams.ts)

supabase/
├─ schema.sql                    # profiles, url_scans, reports, trigger, RLS
└─ threat_signatures.sql         # ★ base comunitaria + RPCs
```

---

## 3. Autenticación (Supabase)

- **Registro** (`register/page.tsx`): `signUp` con `emailRedirectTo` a `/login`. Si Supabase devuelve sesión → `/home`; si no (confirmación activada) → pantalla "Revisa tu correo". Flujo elegido: **con confirmación por email**.
- **Recuperación**: `resetPasswordForEmail` se llama desde el **cliente** en `reset-password/page.tsx` (el antiguo API route no servía porque `getSupabase()` es `null` en el servidor).
- **Nueva contraseña** (`reset-password-confirm/page.tsx`): establece la sesión de recuperación con `exchangeCodeForSession` (PKCE, `?code=`) + listener `onAuthStateChange`. El enlace del correo debe abrirse **en el mismo navegador** donde se solicitó (limitación de PKCE).
- **Perfil**: se crea automáticamente vía trigger `handle_new_user` al registrarse.

### Configuración requerida en Supabase
1. Ejecutar `supabase/schema.sql` (SQL Editor).
2. Ejecutar `supabase/threat_signatures.sql`.
3. **Auth → Providers → Email:** activar *Confirm email*.
4. **Auth → URL Configuration:** *Site URL* + *Redirect URLs* con `/login` y `/reset-password-confirm` (localhost y dominio de Vercel).

---

## 4. Análisis de enlaces (núcleo del producto)

### `lib/analysis.ts` (determinista, cliente+servidor)
Filosofía: **un enlace desconocido NO se asume seguro**. Se parte de 100 y se resta por señales; solo los dominios oficiales verificados llegan a "seguro pleno". Detecta:
- **Acortadores** (lista amplia: bit.ly, lnk.ink, did.li, n9.cl, etc.) → fuerte penalización.
- **Whitelist** de dominios oficiales chilenos + globales comunes.
- **Marcas suplantadas** (BancoEstado, Chilexpress, TAG, SII, subsidios…). Los nombres cortos (tag, bci, sii) exigen límites de palabra para evitar falsos positivos (p. ej. "instagram" contiene "tag").
- **TLDs de riesgo**, rutas/parámetros aleatorios, subdominios, sin HTTPS.
- Genera `anatomy` (estructura), `signature` (para comparar similares) y un `score` interno 0–100.

> **UI:** al usuario solo se le muestra el resultado **cualitativo** (Peligroso / Sospechoso / Seguro). El número y la barra se ocultaron; la lógica de puntaje sigue por dentro.

### `app/api/analyze/route.ts` (server-side, `POST {url}`)
Combina:
1. Heurística determinista de `analysis.ts`.
2. **Expansión** best-effort del acortador (sigue la redirección real con timeout, toma el peor puntaje entre origen y destino).
3. **Base comunitaria**: consulta RPC `match_threats` (coincidencia exacta o similar).
4. **IA opcional (Gemini)**: si existe `GEMINI_API_KEY`, enriquece la anatomía (categoría de estafa, resumen). Sin la key, usa solo la heurística.

### Base de datos comunitaria — `supabase/threat_signatures.sql`
- Tabla `threat_signatures` (lectura pública vía RLS).
- RPC `register_threat(...)` — upsert con contador (se llama al reportar).
- RPC `match_threats(...)` — devuelve coincidencia `exacto` o `similar`.
- Efecto: al **reportar** un enlace (`reportar/page.tsx`), su firma queda guardada y los enlaces **iguales o similares** se marcan sospechosos en futuros análisis.

---

## 5. Actividad e insignias — `lib/activity.ts`

Contadores en `localStorage` (`fishintt_activity`); los reportes se cuentan desde `fishintt_reports`.

- **"Tu actividad"** (perfil): Bloqueados (resultados ≠ seguro), Reportes, Análisis.
- Se incrementa en `analizar/page.tsx` (cada análisis) y `educacion/page.tsx` (marca "visto").
- **Insignias** (`computeBadges`):
  | Insignia | Requisito |
  |----------|-----------|
  | Protector | 6 análisis |
  | Reporter | 6 reportes |
  | Educador | visitar Aprende **y** 5 análisis |
  | Elite | 10 amenazas detectadas |

---

## 6. UI / Modo oscuro

- Toggle de tema (luna/sol) en el **banner** de `home` (junto al menú) y `perfil` (junto a "Editar"). Persiste en `localStorage` (`fishintt_theme`), gestionado por `ThemeProvider.tsx`.
- Modo oscuro en `globals.css` con **jerarquía de superficies** (fondo < lienzo < tarjetas < chips; header navy aparte). Los fondos "semáforo" claros (`bg-brand-50/safe-50/warn-50`) y las cajas `bg-white/70-80` se tiñen oscuros en dark mode para que el texto se lea.
- **Logo:** `logo.png` va envuelto en círculo blanco con `overflow-hidden` (nunca reemplazar el PNG por un SVG). El fondo blanco es inline para que no se vuelva gris en modo oscuro.
- Colores marca: navy `#1A2657` (primario), rojo `#D42B2B` (peligro/logo).

---

## 7. Variables de entorno (`.env.local` y Vercel)

```bash
NEXT_PUBLIC_SUPABASE_URL=...            # requerido
NEXT_PUBLIC_SUPABASE_ANON_KEY=...       # requerido
NEXT_PUBLIC_APP_URL=                    # opcional (el código usa window.location.origin)
GEMINI_API_KEY=                         # opcional — IA gratis: https://aistudio.google.com/apikey
VIRUSTOTAL_API_KEY=                     # placeholder, sin usar aún
GOOGLE_SAFE_BROWSING_KEY=               # placeholder, sin usar aún
```

Sin credenciales de Supabase la app corre en **modo demo** (sessionStorage; login `admin@admin.cl` / `admin`).

---

## 8. Cómo correr y desplegar

```bash
npm install
npm run dev        # desarrollo (localhost:3000)
npm run build      # verificar compilación antes de commitear
git add -A && git commit -m "..." && git push origin main   # Vercel redepliega solo
```

---

## 9. Estado y pendientes

**Verificado en vivo** (contra Supabase real): registro con confirmación, recuperación, trigger de perfil, análisis robusto (los 4 enlaces de prueba salen "peligroso"), expansión de acortadores, y base comunitaria (un enlace reportado marca a los similares).

**Pendiente / ideas siguientes:**
- Borrar usuarios de prueba en Supabase (Auth → Users): `tp.romeroibarra@gmail.com` y `tp.romeroibarra+fish1@gmail.com`. Hay 1 fila de prueba en `threat_signatures` (`bit.ly/3spdere?ucpq`) — es una amenaza real, se puede dejar.
- Eliminar el route obsoleto `api/reset-password/route.ts` y el componente sin uso `components/ThemeToggle.tsx`.
- Para producción: configurar SMTP propio en Supabase (el correo nativo tiene límites bajos de envío).
- Opcional: integrar VirusTotal / Google Safe Browsing en `api/analyze`.
- Revocar cualquier token de GitHub que se haya pegado en chats.

**Historial de commits recientes:**
```
bfc40b7 ui: boton de tema en banners (home/perfil) y contraste de Aprende
b05d97b ui: contraste modo oscuro, boton de tema, sube requisitos de insignias
6b69908 feat: actividad e insignias; modo oscuro y logo; quita fecha de nacimiento
bec2ce9 ui: resultado cualitativo (oculta puntaje y barra)
960ad2b fix: dominios limpios ya no salen sospechosos; falso positivo de marca
a29da2f feat: auth con confirmacion + analisis robusto con base comunitaria
```
