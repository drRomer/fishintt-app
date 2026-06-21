# Guía de Deploy — Fishin't

Tres pasos: **GitHub** (código) → **Supabase** (auth + DB) → **Vercel** (hosting). Total: 15-20 minutos.

---

## 1️⃣ GitHub — subir el código

### Si no tienes cuenta en GitHub
1. Crea una en [github.com/signup](https://github.com/signup)
2. Verifica tu email

### Crear el repositorio

1. Ve a [github.com/new](https://github.com/new)
2. Nombre del repo: `fishintt-app`
3. Visibilidad: **Public** o **Private** (cualquiera funciona para Vercel)
4. **NO** marques "Initialize this repository with a README" (ya tenemos uno)
5. Click en **Create repository**

### Subir el código desde tu máquina

En la terminal, dentro del folder descomprimido `fishintt-app/`:

```bash
git init
git add .
git commit -m "feat: initial commit — fishintt anti-phishing app"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/fishintt-app.git
git push -u origin main
```

Reemplaza `TU-USUARIO` con tu nombre de usuario de GitHub.

✅ Listo. El código vive en GitHub.

---

## 2️⃣ Supabase — backend (auth + base de datos)

### Crear el proyecto

1. Ve a [supabase.com](https://supabase.com) y regístrate (gratis hasta 50K usuarios activos)
2. Click en **New project**
3. Configuración:
   - **Name**: `fishintt`
   - **Database password**: usa el generador (cópiala en un gestor de contraseñas — la necesitarás si quieres conectar directo)
   - **Region**: `South America (São Paulo)` (más cerca de Chile)
   - **Pricing plan**: Free
4. Click en **Create new project** y espera 2 minutos a que se levante

### Ejecutar el schema SQL

1. En el dashboard del proyecto, abre **SQL Editor** (sidebar izquierdo)
2. Click en **New query**
3. Abre el archivo `supabase/schema.sql` del proyecto en tu editor
4. Copia TODO el contenido y pégalo en el SQL Editor de Supabase
5. Click en **Run** (botón verde abajo a la derecha)
6. Deberías ver: ✅ *"Success. No rows returned"*

Esto crea las tablas `profiles`, `url_scans`, `reports`, el trigger automático de creación de perfil al registrarse, y las políticas Row Level Security.

### Obtener las API keys

1. En el sidebar, ve a **Project Settings** → **API**
2. Copia los siguientes valores (los necesitarás en Vercel):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY` *(opcional, solo para server-side)*

### Configurar auth (opcional pero recomendado)

1. **Authentication** → **Providers**
2. **Email** está habilitado por defecto. Para producción:
   - Desactiva *"Confirm email"* mientras testeas (lo activas después)
3. Si quieres Google/Apple login:
   - Sigue las guías oficiales de Supabase para cada provider
   - Esto requiere credenciales OAuth de Google/Apple

✅ Backend listo.

---

## 3️⃣ Vercel — deploy del frontend

### Conectar GitHub a Vercel

1. Ve a [vercel.com](https://vercel.com) y haz **Sign up with GitHub**
2. Autoriza a Vercel acceso a tus repos
3. Plan: Free (Hobby) — sobra para este proyecto

### Importar el proyecto

1. En el dashboard de Vercel, click **Add New → Project**
2. En la lista, busca `fishintt-app` y click **Import**
3. **Framework Preset**: Next.js (debería auto-detectarlo)
4. **Root Directory**: dejar `.` (raíz)

### Configurar variables de entorno

Antes de hacer deploy, expande **Environment Variables** y agrega:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | (lo que copiaste de Supabase) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (lo que copiaste de Supabase) |
| `NEXT_PUBLIC_APP_URL` | (lo dejas vacío por ahora, después le pones la URL de Vercel) |

### Deploy

1. Click en **Deploy**
2. Espera 1-2 minutos
3. ✅ Vercel te da una URL tipo `fishintt-app-xxx.vercel.app`

### Actualizar APP_URL (opcional)

1. Settings → Environment Variables
2. Edita `NEXT_PUBLIC_APP_URL` = tu URL de Vercel
3. Redeploy (Deployments → ⋯ → Redeploy)

---

## ✅ Verificación final

Abre la URL de Vercel desde:

- ✅ Tu navegador (desktop)
- ✅ Móvil (Chrome, Safari)
- ✅ Compártela a tus compañeros y al profesor

Prueba:
1. Click en **Iniciar Sesión** → usa `admin@admin.cl` / `admin` (modo demo)
2. **O regístrate de verdad** con tu email (irá contra Supabase)
3. Explora: Analizar URL, Educación, Ejemplos, Reportar, Operador, Perfil
4. Verifica que el layout se vea bien en móvil

---

## Dominio personalizado (opcional)

Si quieres `fishintt.cl` en vez de la URL de Vercel:

1. Compra el dominio (NIC.cl para .cl, o GoDaddy/Namecheap para .com)
2. En Vercel: Settings → Domains → Add
3. Sigue las instrucciones DNS que te muestra Vercel
4. Espera la propagación (entre 5 minutos y 24 horas)

---

## Actualizaciones futuras

Cada vez que hagas cambios al código local:

```bash
git add .
git commit -m "feat: descripción del cambio"
git push
```

Vercel detecta el push automáticamente y hace redeploy. Verás el nuevo deploy en tu dashboard en ~30 segundos.

---

## Troubleshooting

### "Build failed" en Vercel
- Revisa los logs del build en Vercel
- Usualmente: alguna variable de entorno falta, o hay error de TypeScript
- Prueba `npm run build` localmente primero

### Login no funciona en producción
- Verifica que las variables de entorno en Vercel sean iguales a las de Supabase
- En Supabase → Authentication → URL Configuration → Site URL → pon tu URL de Vercel
- En "Redirect URLs" agrega también tu URL de Vercel

### Modo demo no funciona
- Si Supabase está configurado, el modo demo se desactiva
- Para forzar modo demo, quita temporalmente las variables de entorno y redeploy

### Schema.sql falla
- Si reejecutas el schema, los `IF NOT EXISTS` y `DROP IF EXISTS` previenen errores
- Si una tabla no se creó, ejecuta solo esa sección manualmente

---

## Costos

- **GitHub**: Gratis (repos públicos y privados)
- **Supabase**: Gratis (Free tier — 50K MAU, 500MB DB)
- **Vercel**: Gratis (Hobby plan — 100GB bandwidth/mes)

Total: **$0** para el MVP. Si Fishin't crece, los planes pagados parten en $20/mes cada uno.

---

## Soporte

Cualquier problema durante el deploy, vuelves a Claude y me pegas el error que veas. Lo resolvemos.
