# Athenea

Sistema de arranque y crecimiento de empresas con Athenea, el cerebro CEO.

La interfaz es un sitio estático (`index.html`). Las funciones de IA usan la API de Claude a través de una función de servidor (`api/claude.js`), así que la clave nunca llega al navegador.

## Estructura

```
.
├── index.html      # La aplicación completa (HTML, CSS, JS e imágenes)
├── api/claude.js   # Función de Vercel: conecta la app con la API de Claude
├── package.json    # Dependencia: @anthropic-ai/sdk
├── vercel.json     # Configuración de despliegue
├── .env.example    # Variables de entorno necesarias
└── README.md
```

## Desplegar en Vercel

1. En [vercel.com](https://vercel.com) → **Add New → Project** → importa este repositorio.
2. **Framework Preset:** `Other`. Build Command y Output Directory vacíos.
3. En **Environment Variables** agrega:
   - `ANTHROPIC_API_KEY` — tu clave de [console.anthropic.com](https://console.anthropic.com) (obligatoria).
   - `ATHENEA_ACCESS_CODE` — un código que la app pedirá antes de usar la IA (opcional, **recomendado**: sin él, cualquiera que tenga el enlace puede gastar tu saldo de la API).
4. **Deploy.** Cada push a `main` se despliega automáticamente.

Si cambias las variables después, vuelve a desplegar (Deployments → Redeploy) para que se apliquen.

### Variables opcionales

| Variable | Por defecto | Para qué sirve |
|---|---|---|
| `ANTHROPIC_MODEL` | `claude-opus-5` | Modelo de Claude que usa Athenea |
| `ANTHROPIC_EFFORT` | `medium` | Cuánto razona antes de responder: `low`, `medium`, `high`, `xhigh`, `max`. Más alto = mejores respuestas pero más lento y caro |

## Probar en local

```bash
npm install
npx vercel dev      # sirve la página y la función /api/claude
```

Crea un archivo `.env.local` con tus variables (usa `.env.example` como guía). Si abres `index.html` directamente, la app funciona pero sin IA.

## Cómo funciona

- **Datos:** se guardan en el navegador (`localStorage`) de cada dispositivo; no se comparten entre dispositivos.
- **IA:** fuera de Claude, la página llama a `/api/claude`, que transmite la respuesta de Claude en tiempo real. Si la clave no está configurada, las funciones de IA se ocultan.
- **Descargas** (CSV para el contador, informes): se descargan directamente desde el navegador.
- Dentro de Claude (como artifact), la app sigue usando las capacidades nativas de Claude.
