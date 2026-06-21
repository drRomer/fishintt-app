# Fishin't — Versión HTML Estática

Esta guía explica cómo usar la versión de Fishin't compilada como HTML estático (sin necesidad de servidor Node.js).

## Opción 1: Usar la carpeta `out/`

El build estático se genera en `out/` cuando ejecutas:

```bash
npm run build
```

### Abrir en tu navegador

1. Después del build, simplemente abre `out/index.html` en tu navegador
2. O usa un servidor local simple:

```bash
# Con Python 3
python -m http.server 8000 --directory out

# Con Python 2
python -m SimpleHTTPServer 8000 --directory out

# Con Node.js (http-server)
npx http-server out -p 8000
```

3. Accede a `http://localhost:8000`

## Opción 2: Usar el ZIP `fishintt-app-html.zip`

1. Descarga `fishintt-app-html.zip`
2. Extrae el contenido: verás una carpeta `out/`
3. Abre `out/index.html` directamente en tu navegador, o
4. Sirve con un servidor HTTP local (ver Opción 1)

## Notas Importantes

- ✅ **Modo Demo**: El formulario de reportes funciona sin Supabase (guardado en localStorage/sessionStorage)
- ✅ **Credenciales Demo**: `admin@admin.cl` / `admin`
- ⚠️ **Sin JavaScript dinámico en servidor**: Los reportes se guardan solo en el navegador local
- ✅ **PWA**: Incluye manifest.json para instalación como app

## Cambios Recientes

✅ Logo reemplazado por PNG profesional
✅ Alerta nacional movida a pantalla de login
✅ Acciones rápidas reorganizadas: "Analizar enlace" primero
✅ Anatomía de phishing ahora abre en modal interactivo
✅ Sistema de reportes preparado para Supabase
✅ Soporte para export estático (`output: export` en next.config.mjs)

## Para Agregar Supabase

1. Configura tus credenciales en `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key
   ```

2. Ejecuta el schema SQL en tu proyecto Supabase
3. Los reportes se guardarán automáticamente en la tabla `reports`

## Estructura

```
out/
├── index.html           (Landing/Splash)
├── login.html          (Login)
├── home.html           (Dashboard)
├── analizar.html       (URL Analyzer)
├── educacion.html      (Education)
├── ejemplos.html       (Scam Cases)
├── reportar.html       (Report Form)
├── operador.html       (Support)
├── perfil.html         (Profile)
├── logo.png            (Logo)
├── favicon.svg
├── anatomy-phishing-email.svg
├── _next/              (JS/CSS compilado)
└── scams/              (SVG mockups)
```

## Desarrollo Local

Para cambios en desarrollo:

```bash
npm install
npm run dev   # http://localhost:3000
```

Para build estático:

```bash
npm run build
# Luego abre out/index.html
```
