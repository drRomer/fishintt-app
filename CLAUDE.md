# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> El código, comentarios y la UI de este proyecto están en **español (Chile)**. Mantén ese idioma al escribir código nuevo, mensajes de UI y comentarios.

## Comandos

```bash
npm install
npm run dev      # desarrollo en http://localhost:3000
npm run build    # verificar compilación ANTES de commitear (no hay tests)
npm run lint     # eslint-config-next
```

No hay suite de tests. La verificación previa a un commit es `npm run build`. El deploy es automático en Vercel al hacer `git push origin main`.

## Qué es

**Fishin't** — app web SaaS anti-phishing enfocada en Chile (proyecto universitario). Analiza enlaces sospechosos, enseña a identificar estafas y reporta amenazas que alimentan una base de datos comunitaria. Mobile-first.

Stack: **Next.js 14 (App Router) + TypeScript + Tailwind + Supabase (Auth/Postgres/RLS)**, deploy en Vercel, IA opcional con Google Gemini.

## Arquitectura — lo que hay que entender

### El motor de análisis es el corazón del producto

`src/lib/analysis.ts` es código **determinista compartido entre cliente y servidor**. Filosofía clave: **un enlace desconocido NO se asume seguro**. El scoring parte de 100 y resta por señales de riesgo; solo dominios en `SAFE_DOMAINS` (whitelist oficial chilena/global) llegan a "seguro pleno" (95). Un dominio desconocido sin señales queda en 80 (safe pero no perfecto). Produce:
- `anatomy` (estructura del enlace), `signature` (para comparar "similares"), `rawScore` interno 0–100, y `riskLevel` cualitativo (`safe`/`suspicious`/`dangerous`).
- **La UI muestra SOLO el resultado cualitativo.** El número y la barra se ocultan a propósito — la lógica de puntaje sigue viva por dentro (no la borres).

Detalle no obvio: las marcas suplantadas cortas (`tag`, `bci`, `sii`, `bch`, `cmr`, `bono`) usan `matchesBrand()` con **límites de palabra** para evitar falsos positivos (p. ej. "instagram" contiene "tag"). Las needles ≥5 chars usan substring simple.

### La API route orquesta, el motor decide

`src/app/api/analyze/route.ts` (`POST {url}`, runtime `nodejs`) combina en paralelo (`Promise.all`):
1. Heurística determinista de `analysis.ts`.
2. **Expansión** best-effort del acortador — sigue redirects reales con `fetch` HEAD manual (5 hops, timeout 4s) y toma el **peor** puntaje entre origen y destino (`mergeWorst`).
3. **Base comunitaria** — RPC `match_threats` (coincidencia `exacto` o `similar`).
4. **Inteligencia de amenazas externa** — `checkSafeBrowsing` (Google Safe Browsing v4) y `checkVirusTotal` (VT v3), cada una detrás de su API key. Si marcan la URL, `applyThreatIntel` fuerza el resultado a `dangerous` (señal autoritativa). Sin keys, no-op.
5. **IA opcional (Gemini)** — solo si existe `GEMINI_API_KEY`; enriquece categoría/resumen. Sin la key, la app funciona igual con pura heurística.

### El ciclo comunitario (reportar → detectar)

Al reportar en `src/app/(app)/reportar/page.tsx`, se llama la RPC `register_threat` (upsert con contador, `SECURITY DEFINER`) guardando la **firma** del enlace en `threat_signatures`. Después, cualquier enlace **igual o estructuralmente similar** (misma `signature` o `host`) se marca sospechoso en futuros análisis vía `match_threats`. Esquema en `supabase/threat_signatures.sql`; tablas base (profiles, url_scans, reports, trigger de perfil, RLS) en `supabase/schema.sql`. Los **tres** SQL (`schema.sql`, `threat_signatures.sql`, `protected_networks.sql`) **deben ejecutarse a mano** en el SQL Editor de Supabase.

### La Red Empresa Protegida (seguridad delegada) — requiere cuenta

Módulo `red/` (§2.4.1.b de la tesis). Un **admin** crea una red y comparte un **código de invitación** (6 chars); los **protegidos** se unen con ese código. Cuando un protegido analiza en `analizar/` un enlace `suspicious`/`dangerous`, se registra una **alerta** (`recordAlert` en `src/lib/network.ts`) que el admin ve en su panel para intervenir a tiempo. Esquema y RPCs (`create_protected_network`, `join_protected_network`, `get_my_network`, `get_network_members`, `get_network_alerts`, `record_member_alert`, `resolve_member_alert`) en `supabase/protected_networks.sql`. Patrón clave: RLS activo **sin políticas de SELECT directas** — todo el acceso pasa por funciones `SECURITY DEFINER` con chequeo interno de `auth.uid()`, para evitar la recursión de políticas cruzadas. `src/lib/network.ts` degrada a no-op si `getSupabase()` es `null` (modo demo).

### Entrada libre — la cuenta es OPCIONAL

La app es de **entrada libre / free**: la landing (`/`) entra directo a `/home` ("Entrar gratis") sin muro de login. Analizar, aprender, ejemplos y reportar funcionan **sin cuenta**. La cuenta solo se exige para funciones ligadas a la identidad: el **soporte con operador** (`operador/`, botón "Solicitar llamada"), la **Red Empresa Protegida** (`red/`) y, a futuro, el Wallet.
- `src/lib/session.ts`: `isLoggedIn()` / `getStoredUser()` son la fuente de verdad de "hay cuenta activa" (existe `sessionStorage.fishintt_user` **con email**). Un invitado no lo tiene.
- Home y perfil saludan "Invitado" y muestran CTA de "Crear cuenta" si no hay sesión; `operador/` degrada la acción de llamada a "Inicia sesión…". El bloque de emergencia (Ley 20.009 / PDI) y las FAQs quedan **siempre libres**.

### Modo demo vs. Supabase real — patrón crítico

`getSupabase()` en `src/lib/supabase.ts` devuelve `null` si faltan las env vars **o si se llama en el servidor** (`typeof window === "undefined"`). Todo el código cliente maneja el caso `null` como **modo demo**: usa `sessionStorage` y login `admin@admin.cl` / `admin`. Por eso:
- Nunca asumas que `getSupabase()` devuelve un cliente; siempre chequea `null`.
- La lógica que necesita Supabase en el servidor usa `createClient` de `@supabase/supabase-js` directo con la anon key (ver `serverSupabase()` en la API route), NO `getSupabase()`.

### Auth (Supabase, con confirmación por email) — opcional

- Registro: `signUp` con `emailRedirectTo` a `/login`. El perfil se crea solo vía trigger `handle_new_user`.
- Recuperación: `resetPasswordForEmail` se llama desde el **cliente** (`reset-password/page.tsx`).
- Nueva contraseña (`reset-password-confirm/page.tsx`): flujo **PKCE** con `exchangeCodeForSession` (`?code=`). El enlace del correo **debe abrirse en el mismo navegador** donde se solicitó (limitación de PKCE).

### Actividad e insignias

`src/lib/activity.ts` cuenta en `localStorage` (`fishintt_activity`); los reportes se cuentan desde `fishintt_reports`. `computeBadges()` define los umbrales de las 4 insignias (Protector/Reporter/Educador/Elite). `computeCrd()` calcula el **Coeficiente de Resiliencia Digital (CRD)** 0–1000 (métrica nombrada en la tesis) a partir de la actividad, con nivel cualitativo semáforo (Vulnerable/En formación/Resiliente/Experto); se muestra en `perfil/`. La columna `profiles.crd_score` está reservada para persistirlo por usuario. Se incrementa en `analizar/` (cada análisis) y `educacion/` (marca "visto").

### Rutas y tema

- `src/app/(app)/` es la zona autenticada — su layout añade `BottomNav`. Rutas: home, analizar, educacion, ejemplos, operador, perfil, reportar.
- Tema claro/oscuro gestionado por `components/ThemeProvider.tsx` (`localStorage` `fishintt_theme`, clase `dark` en `<html>`). El modo oscuro vive en `globals.css` con jerarquía de superficies.

## Gotchas

- **`next.config.mjs` NO debe llevar `output: 'export'`** — desactiva las API routes; la app corre como serverless en Vercel.
- **El logo** (`components/Logo.tsx`) usa `logo.png` envuelto en círculo blanco inline con `overflow-hidden`. No reemplazar el PNG por SVG ni quitar el fondo blanco inline (se vuelve gris en dark mode).
- Colores marca: navy `#1A2657` (primario), rojo `#D42B2B` (peligro/logo). El rojo (`brand-*` en Tailwind) es solo para marca/peligro, no para acentos generales — el primario es `navy-*`.
- Datos duros de contenido (estafas reales, material educativo) viven en `src/lib/data/` (`scams.ts`, `education.ts`), no en las páginas.

## Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=        # requerido para auth real (sin esto → modo demo)
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # requerido
GEMINI_API_KEY=                  # opcional — activa enriquecimiento IA en /api/analyze
GOOGLE_SAFE_BROWSING_KEY=        # opcional — activa Google Safe Browsing en /api/analyze
VIRUSTOTAL_API_KEY=              # opcional — activa VirusTotal en /api/analyze
```

> **Dependencias:** Supabase está fijado (sin `^`) en `@supabase/supabase-js@2.45.4` / `@supabase/ssr@0.5.2`. NO subir a 2.10x: esa línea arrastra el paquete roto `@supabase/phoenix` (publish sin el `.mjs` que declara) y rompe el build de webpack.
