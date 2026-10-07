# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> El código, comentarios y la UI de este proyecto están en **español (Chile)**. Mantén ese idioma al escribir código nuevo, mensajes de UI y comentarios.

## Comandos

```bash
npm install
npm run dev      # desarrollo en http://localhost:3000
npm run build    # verificar compilación ANTES de commitear (no hay tests)
npm run lint     # eslint-config-next
npm run benchmark # mide el motor de detección contra el banco etiquetado
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
5. **Antigüedad del dominio** — `getDomainAgeDays` penaliza proporcionalmente: ≤30d −45, ≤90d −30, ≤180d −15; si no hay dato, no penaliza. Dos vías según el TLD, ambas verificadas contra los registros reales:
   - **gTLD** → RDAP sobre `rdap.org`. **El User-Agent es obligatorio** (sin él, 403).
   - **`.cl`** → NO tiene RDAP (ni en el bootstrap de IANA ni en NIC Chile), pero `whois.nic.cl:43` sí entrega `Creation date`. Se consulta por TCP con `node:net`. De esa respuesta se extrae **solo la fecha**: incluye el nombre del titular y no se registra ni almacena (§5.1, Ley 19.628).
6. **Cadena de confianza TLS** — `validarCadenaTlsConReintento` abre un handshake con `rejectUnauthorized: true` y penaliza (−40) solo si falla la **validación** (vencido, autofirmado, emitido para otro dominio). Un host que no resuelve no dice nada → null. **Ojo:** `normalizeUrl` quita el `www.`, pero muchos dominios resuelven solo con él (`bancoestado.cl` da ENOTFOUND), por eso se usa el host original y se reintenta con `www.`. No se usa la antigüedad del certificado: Let's Encrypt renueva cada 90 días, sería ruido.
7. **IA opcional (Gemini)** — solo si existe `GEMINI_API_KEY`; enriquece categoría/resumen. Sin la key, la app funciona igual con pura heurística.

### El ciclo comunitario (reportar → detectar)

Al reportar en `src/app/(app)/reportar/page.tsx`, se llama la RPC `register_threat` (upsert con contador, `SECURITY DEFINER`) guardando la **firma** del enlace en `threat_signatures`. Después, cualquier enlace **igual o estructuralmente similar** (misma `signature` o `host`) se marca sospechoso en futuros análisis vía `match_threats`. Esquema en `supabase/threat_signatures.sql`; tablas base (profiles, url_scans, reports, trigger de perfil, RLS) en `supabase/schema.sql`. Los **tres** SQL (`schema.sql`, `threat_signatures.sql`, `protected_networks.sql`) **deben ejecutarse a mano** en el SQL Editor de Supabase.

### La Red Empresa Protegida (seguridad delegada) — requiere cuenta

Módulo `red/` (§2.4.1.b de la tesis). Un **admin** crea una red y comparte un **código de invitación** (6 chars); los **protegidos** se unen con ese código. Cuando un protegido analiza en `analizar/` un enlace `suspicious`/`dangerous`, se registra una **alerta** (`recordAlert` en `src/lib/network.ts`) que el admin ve en su panel para intervenir a tiempo. Esquema y RPCs (`create_protected_network`, `join_protected_network`, `get_my_network`, `get_network_members`, `get_network_alerts`, `record_member_alert`, `resolve_member_alert`) en `supabase/protected_networks.sql`. Patrón clave: RLS activo **sin políticas de SELECT directas** — todo el acceso pasa por funciones `SECURITY DEFINER` con chequeo interno de `auth.uid()`, para evitar la recursión de políticas cruzadas. `src/lib/network.ts` degrada a no-op si `getSupabase()` es `null` (modo demo).

### Microcápsulas: la intervención en el momento crítico

Cuando el analizador marca un enlace (`riskLevel !== "safe"`), `analizar/` renderiza `<Microcapsula>` con la microcápsula **del indicador dominante de ESE enlace** (paso 6 del flujo, §5.1). El contenido vive en `src/lib/data/microcapsulas.ts` (11 indicadores) y `seleccionarMicrocapsula()` fija la prioridad: comunidad > typosquat > homóglifo > IP > marca > dominio nuevo > acortador > TLD > subdominios > aleatorio > sin HTTPS.

Formato deliberado: **texto + evidencia del propio enlace + una pregunta, nunca video** — la fuente que cita §5.2 (Kumaraguru et al., 2007) validó intervenciones breves y estáticas, y el público objetivo opera en móvil. Cada pregunta alimenta el componente C del CRD.

### El instrumento de medición del CRD (`evaluacion/`)

Ruta `/evaluacion`: aplica los 12 ítems del instrumento de §3.2.3 (4 básicos, 4 intermedios, 4 avanzados), en dos aplicaciones con ítems distintos — `PRE_TEST` y `POST_TEST` en `src/lib/data/evaluacion.ts`. Incluye comunicaciones **legítimas** de las mismas instituciones como distractores: si todos los ítems fueran fraude, el instrumento mediría desconfianza, no discernimiento. No hay retroalimentación por ítem (contaminaría una medición diagnóstica); las explicaciones van todas al final.

En el pre-test `U = 0` por definición del instrumento. **Defecto conocido del criterio de §3.2.4, comprobado empíricamente:** como ΔCRD puede crecer +350 solo por el componente de uso, un usuario con C=100 en ambas aplicaciones (cero aprendizaje) "cumple" el umbral de 150. Por eso `compararAplicaciones()` expone también `deltaC`, que es la ganancia de conocimiento aislada y la medida que sí evidencia aprendizaje.

### Validación: dos conjuntos y por qué importa la diferencia

Hay **dos** conjuntos y no son intercambiables:
- `benchmark/dataset.ts` (`npm run benchmark`) — 77 enlaces. Es el conjunto con el que se **afinaron** los indicadores, así que su cifra es optimista por construcción.
- `benchmark/holdout.ts` (`npm run validar`) — 45 enlaces derivados de las campañas de `scams.ts` e instituciones chilenas ausentes del primero, con vectores **evasivos** (hosting gratuito, WordPress comprometido, dominios limpios). Compara ambos y desglosa por dificultad.

Historia de la medición, que conviene no perder: la primera medición held-out dio **72,7 %** frente al 94,7 % del conjunto de afinamiento — una brecha de 22 puntos que confirmó que la cifra alta era optimista. Toda la falla estaba en la categoría evasiva (1/7). Tras agregar detección de **marca en la ruta** y **hosting gratuito**, subió a 86,4 % sin costar ni un falso positivo.

**El 86,4 % ya no es held-out limpio**: esas mejoras se diseñaron mirando esos fallos. Para una cifra defendible hace falta una muestra de un repositorio público verificado (OpenPhish / PhishTank), como pide §3.1.2.b. Y el benchmark corre **offline**: dos de los fallos restantes sí los detecta la antigüedad de dominio en el pipeline real.

### El banco de pruebas del motor (`benchmark/`)

`npm run benchmark` corre el motor **determinista** (sin red, sin API keys) contra 77 enlaces etiquetados, ponderados a Chile (69 nacionales / 8 internacionales), y reporta precisión, exhaustividad y falsos positivos contra las metas de §3.2.4 (recall ≥85 %, FPR ≤10 %). Estado actual: **94,7 % recall / 0 % FP**. Corre con `node --experimental-strip-types`, por eso los imports llevan extensión `.ts` y `benchmark/` está excluido del `tsconfig.json`.

Dos advertencias que deben acompañar cualquier cita de estas cifras: los indicadores se afinaron sobre el mismo conjunto que se mide (falta un set de validación held-out), y los enlaces de phishing son curados a partir de campañas chilenas documentadas, no capturas de un feed en vivo.

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

`src/lib/activity.ts` cuenta en `localStorage` (`fishintt_activity`); los reportes se cuentan desde `fishintt_reports`. `computeBadges()` define los umbrales de las 4 insignias (Protector/Reporter/Educador/Elite). `computeCrd()` implementa el **CRD** con la fórmula operacional de la tesis (§3.2.1): `CRD = 10·(0,65·C + 0,35·U)`, donde `U` sale de la actividad (`computeU`) y `C` del conocimiento demostrado en ejercicios (`computeC` en `src/lib/ejercicios.ts`, ponderado básico=1/intermedio=2/avanzado=3, conservando **solo el primer intento** por ítem). Escala: Vulnerable <400, En formación <600, Resiliente <800, Experto ≥800. Se muestra en `perfil/`. `profiles.crd_score` está reservada para persistirlo. Se incrementa en `analizar/` (cada análisis) y `educacion/` (marca "visto").

### Rutas y tema

- `src/app/(app)/` es la zona autenticada — su layout añade `BottomNav`. Rutas: home, analizar, educacion, ejemplos, operador, perfil, reportar.
- Tema claro/oscuro gestionado por `components/ThemeProvider.tsx` (`localStorage` `fishintt_theme`, clase `dark` en `<html>`). El modo oscuro vive en `globals.css` con jerarquía de superficies.

## Gotchas

- **No corras `npm run build` con el dev server levantado**: el build sobrescribe `.next` y el server dev queda roto con `Cannot find module './NNN.js'`. Hay que detenerlo, borrar `.next` y reiniciar.
- **Compartir con Fishin't**: `public/manifest.json` declara `share_target` apuntando a `/analizar`. Android suele mandar la URL dentro de `text` junto a otras palabras, por eso `extraerUrl()` la rescata con regex. `analizar/` usa `useSearchParams`, así que va envuelto en `<Suspense>`.


- **`next.config.mjs` NO debe llevar `output: 'export'`** — desactiva las API routes; la app corre como serverless en Vercel.
- **La antigüedad del dominio es señal CORROBORANTE, no acusatoria.** Si el motor ya halló otras señales, la edad las amplifica fuerte (≤30d −45, ≤90d −30, ≤180d −15). Si el enlace está limpio y lo único llamativo es la edad, solo ≤30 días genera advertencia (−25) y con lenguaje distinto. Razón: un dominio legítimo limpio parte en 80, así que la penalización más suave (−15) lo dejaba en 65, **bajo el umbral de 67** — es decir, toda PyME chilena con menos de 6 meses salía "sospechosa", y las microempresas son público objetivo (§2.2.2). El benchmark corre offline y **no** detecta esta clase de falso positivo: su FPR de 0 % se mide solo sobre dominios antiguos.
- **El veredicto "seguro" tiene dos formas y no se deben mezclar**: con un dominio de la whitelist (`isOfficialDomain`) la UI dice **"Sitio oficial"** porque efectivamente lo sabemos; en cualquier otro caso dice **"Sin señales de riesgo"**, porque el motor solo sabe que no halló nada y no detecta el 100 %. Un check verde que diga "Seguro" sobre un enlace no verificado le fabrica a la víctima la confianza que el estafador necesita.
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
