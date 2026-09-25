# Athenea

Sistema de arranque y crecimiento de empresas con Athenea, el cerebro CEO.

Es un sitio estático: toda la aplicación (HTML, CSS, JS e imágenes) está en `index.html`. No necesita dependencias ni paso de build.

## Estructura

```
.
├── index.html    # La aplicación completa
├── vercel.json   # Configuración de despliegue en Vercel
├── .gitignore
└── README.md
```

## Desplegar en Vercel

1. En [vercel.com](https://vercel.com) → **Add New → Project** → importa este repositorio.
2. **Framework Preset:** `Other`.
3. **Build Command:** vacío. **Output Directory:** vacío (raíz). **Root Directory:** `./`.
4. **Deploy.**

Cada push a `main` se desplegará automáticamente en producción.

## Probar en local

Abre `index.html` en el navegador, o sirve la carpeta:

```bash
npx serve .
# o
python3 -m http.server 3000
```

## Notas

- Los datos se guardan en el navegador (`localStorage`) de cada dispositivo.
- Las funciones de IA (Asesor, diagnósticos, generación de planes, informes) y la exportación CSV usan el entorno de Claude (`window.claude`). Fuera de Claude —por ejemplo en Vercel— la app funciona igual, pero esas funciones aparecen desactivadas.
