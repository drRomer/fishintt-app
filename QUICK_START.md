# 🎣 Fishin't — Guía Rápida de Descargas

## 3 Opciones: Elige la Tuya

### 📦 Opción 1: Completo (Recomendado para desarrollo)
**Archivo**: `fishintt-app-complete.zip` (23 MB)

Contiene:
- ✅ Código fuente completo
- ✅ Build compilado en carpeta `out/`
- ✅ package.json y todas las dependencias listadas

**Cuándo usar**: Quieres desarrollar, hacer cambios, o desplegar a Vercel

**Pasos**:
```powershell
# En Windows PowerShell
Expand-Archive fishintt-app-complete.zip
cd fishintt-app
npm install
npm run dev  # http://localhost:3000
```

O para HTML estático (sin servidor):
```powershell
# Abre en tu navegador
Invoke-Item out\index.html

# O usa un servidor simple
python -m http.server 8000 --directory out
# Luego: http://localhost:8000
```

---

### 🌐 Opción 2: Solo HTML (Para demo rápido)
**Archivo**: `fishintt-app-html.zip` (455 KB)

Contiene:
- ✅ Carpeta `out/` lista para abrir
- ✅ Todas las páginas compiladas a HTML
- ✅ Assets y estilos incluidos

**Cuándo usar**: Quieres demostrar la app sin instalar nada

**Pasos**:
```powershell
# Extrae el ZIP
Expand-Archive fishintt-app-html.zip

# Opción A: Abre directamente
Invoke-Item out\index.html

# Opción B: Con servidor (mejor compatibilidad)
# Instala http-server si no lo tienes:
npm install -g http-server

# Sirve la carpeta:
http-server out -p 8000
# Luego: http://localhost:8000
```

---

### 💻 Opción 3: Solo Código (Sin build)
**Archivo**: `fishintt-app.zip` (159 KB)

Contiene:
- ✅ Código fuente solo
- ⚠️ Sin `node_modules` (ligero)
- ⚠️ Sin carpeta `out/` (necesita build)

**Cuándo usar**: Quieres trabajar el código pero no necesitas el build

**Pasos**:
```powershell
Expand-Archive fishintt-app.zip
cd fishintt-app
npm install
npm run build
npm run dev
```

---

## Comparativa Rápida

| Necesidad | Opción | Tamaño | Pasos |
|---|---|---|---|
| Demo inmediato (sin instalación) | 2 (HTML) | 455 KB | 2 |
| Trabajar código + desarrollar | 1 (Completo) | 23 MB | 3 |
| Código ligero para versionar | 3 (Código) | 159 KB | 4 |

---

## ¿Cuál Elegir?

**Si es para mostrar a profesor** → Opción 2 (HTML)
```
Abre out/index.html en navegador. Listo.
```

**Si es para trabajar/desarrollar** → Opción 1 (Completo)
```
npm install → npm run dev → http://localhost:3000
```

**Si es para subir a GitHub** → Opción 3 (Código)
```
Ligero, versiona solo fuentes, gitignore excluye node_modules y out/
```

---

## Demo Credentials (Todas las opciones)

```
Email:    admin@admin.cl
Password: admin
```

---

## Lo que cambió en esta versión

✅ Logo actualizado (PNG profesional)
✅ Alerta nacional en login
✅ Acciones rápidas reordenadas (Analizar primero)
✅ Anatomía de phishing en modal interactivo
✅ Sistema de reportes listo para Supabase
✅ Build estático (HTML puro)
✅ Totalmente operativo sin servidor Node.js

---

## Próximos pasos

1. **Prueba la app** en tu navegador (cualquier opción)
2. **Conecta Supabase** (cuando esté lista):
   - Copia `.env.example` a `.env.local`
   - Agrega tus credenciales Supabase
   - Ejecuta schema.sql
3. **Deploya** a Vercel cuando esté lista (ver DEPLOY.md)

---

## Problemas Comunes

**"No se abre el HTML"**
→ Usa un servidor HTTP (no abras directamente de explorador)
→ Instala Python o Node.js y usa los comandos arriba

**"Dice que falta algo en npm"**
→ Ejecuta `npm install` después de extraer

**"Los reportes no se guardan"**
→ Sin Supabase configurado, se guardan en memoria (sesión actual)
→ Cuando conectes Supabase, se guardan en BD

---

## Contacto / Preguntas

Todo está en `/out` (HTML) o `/src` (TypeScript).
Los archivos son limpios y están listos para producción.

¡Buena suerte con la presentación! 🎣
