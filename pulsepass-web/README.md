# PulsePass Web — Fase 5: Frontend

Cliente web (SPA) de **PulsePass** construido con React 19, TypeScript estricto y Tailwind CSS v4 sobre la API REST segura de las Fases 1–4. Presenta y orquesta las operaciones de la API; **no decide**: las reglas de negocio (edad mínima, capacidad, estados, propiedad y permisos) las aplica el backend y la interfaz solo traduce sus respuestas.

| Tecnología | Versión usada |
|---|---|
| Node | 22.22+ (exigido por React Router v8) |
| React / React DOM | 19.3 |
| TypeScript | 6.0 (`strict` + `noUncheckedIndexedAccess`) |
| Vite | 8 |
| Tailwind CSS | 4 (`@tailwindcss/vite`, tokens en `@theme`) |
| React Router | 8 (`createBrowserRouter` + `RouterProvider` de `react-router/dom`) |
| TanStack Query | 5 |
| React Hook Form + zod | 7 + 4 |
| Vitest + Testing Library + MSW | 5 + 16 + 3 |

## Requisitos previos

1. Node **22.22 o superior** (`node -v`).
2. Backend de PulsePass (Fases 1–4) en `http://localhost:8080` con PostgreSQL y la variable `PULSEPASS_JWT_SECRET_BASE64` configurada (ver el README del backend).
3. Usuarios de demostración USER, STAFF y ADMIN creados en la semilla local de la Fase 4.

## Variables de entorno

Copie `.env.example` a `.env` (el archivo `.env` está en `.gitignore`):

| Variable | Valor por defecto | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | URL base que usa el navegador para llamar a la API. Es **pública** por definición: nunca se guardan secretos en el bundle. |
| `PULSEPASS_API_PROXY` | `http://localhost:8080` | Solo para `npm run dev`: destino del proxy `/api` de Vite. No llega al bundle. |

> **CORS (GAP-05):** el backend no configura CORS. En desarrollo se usa el proxy de Vite (`/api → http://localhost:8080`). En producción la SPA debe servirse en el mismo origen que la API o el backend debe habilitar CORS explícitamente.

## Comandos

```bash
npm install          # instala dependencias
npm run dev          # servidor de desarrollo en http://localhost:5173 (proxy /api → backend)
npm run build        # tsc -b (tipado estricto) + build de producción en dist/
npm run preview      # sirve el build
npm run lint         # ESLint (incluye reglas para los anti-patrones del PRD §24)
npm test             # Vitest + Testing Library + MSW (sin backend real)
npm run format       # Prettier + prettier-plugin-tailwindcss
```

Resultado de verificación de esta entrega: `npm run lint` sin errores ni advertencias, `npm run build` correcto y `npm test` con **124 pruebas en verde** (10 archivos).

## Roles de demostración

| Persona | Rol | Qué puede hacer en la UI |
|---|---|---|
| Visitante | — | Cartelera, detalle de evento, artistas, sedes, registro e inicio de sesión |
| Andrea / Carlos | USER | Comprar entradas, ver y cancelar sus tickets, Mi cuenta |
| Laura | STAFF | Validar ingreso (marcar tickets como usados) y ver tickets pagados por evento |
| Administración | ADMIN | Todo lo de STAFF + crear eventos, publicarlos y asociar artistas |

El rol se obtiene **siempre** de `GET /api/auth/me`; el JWT no se decodifica en el cliente. El registro crea siempre un usuario `USER` (no hay selección de rol en la UI). Las credenciales reales dependen de la semilla local del backend; en las pruebas automatizadas se usa la contraseña simulada `Clave-Segura-2026`.

## Rutas principales (20)

| Ruta | Página | Acceso |
|---|---|---|
| `/` | Inicio | Público (carga estática) |
| `/eventos` · `/eventos/:eventCode` | CatalogoEventos · DetalleEvento | Público |
| `/artistas` · `/artistas/:id` | ListaArtistas · DetalleArtista | Público |
| `/sedes` · `/sedes/:code` | ListaSedes · DetalleSede | Público |
| `/login` · `/registro` | Login · Registro | Solo anónimo |
| `/cuenta` | Cuenta | Autenticado |
| `/mis-tickets` · `/mis-tickets/:ticketCode` · `/compra/confirmacion/:ticketCode` | MisTickets · DetalleTicket · ConfirmacionCompra | USER |
| `/staff/validacion` · `/staff/eventos/:eventCode/tickets` | ValidacionIngreso · TicketsPagadosEvento | STAFF, ADMIN |
| `/admin/eventos` · `/admin/eventos/nuevo` · `/admin/eventos/:eventCode` | AdminEventos · AdminCrearEvento · AdminGestionEvento | ADMIN |
| `/403` · `*` | SinPermisos · NoEncontrada | Público |

Todas las páginas, salvo `Layout` e `Inicio`, se cargan con `lazy` (cada una genera su propio chunk en `dist/assets`). El acceso directo de la navbar a "Tickets pagados" usa `/staff/eventos/seleccionar/tickets`, que muestra el buscador de evento sin llamar a la API.

## Arquitectura

```
Página / Componente   → presentación y composición          (src/pages, src/funcionalidades/*/componentes)
Hook (TanStack Query) → estado de servidor, caché, invalidación (src/funcionalidades/*/hooks.ts)
api.ts                → llamadas HTTP + esquema zod de la respuesta (src/funcionalidades/*/api.ts)
lib/http.ts           → fetch, Authorization: Bearer, ErrorResponse → ApiError
AuthContext           → sesión (unión discriminada), token, rol    (src/funcionalidades/auth)
```

- **Contratos:** los esquemas zod de `src/funcionalidades/*/tipos.ts` se confirmaron contra los DTO reales del backend (`dto/request`, `dto/response`). Los tipos se derivan con `z.infer`.
- **Política de recursos ajenos:** el backend responde **403** (`AuthorizationService`) y **404** para inexistentes y para eventos no publicados vistos por anónimos/USER. La UI muestra "Ticket no disponible" / "Evento no disponible" para ambos, sin revelar la existencia del recurso.
- **Sesión:** el token vive en memoria y en `sessionStorage` (`pulsepass.sesion`), se valida con zod al arrancar y se descarta si expiró. Nunca se usa `localStorage`, cookies ni la URL. Cualquier 401 de una petición autenticada cierra la sesión, limpia la caché (`queryClient.clear()`) y redirige a `/login` con el aviso "Tu sesión expiró".
- **Errores:** `lib/errores.ts` mapea red/400/401/403/404/409/500 a mensajes es-CO; los mensajes del backend se traducen cuando se reconocen y siempre se renderizan como texto.
- **Reintentos:** 4xx nunca; red y 5xx una vez; las mutaciones nunca se reintentan.

## Estructura del proyecto

```
pulsepass-web/
├── docs/
│   ├── diseno/                      # 32 PNG de diseño (extraídos del PRD, sección 9.0)
│   └── Explicacion_Implementacion_PulsePass_Frontend.pdf
├── src/
│   ├── main.tsx · router.tsx · Proveedores.tsx · index.css
│   ├── lib/          http.ts · sesionToken.ts · rutas.ts · formato.ts · errores.ts · queryClient.ts · clavesQuery.ts · formularios.ts · tema.ts · reloj.ts
│   ├── layouts/      Layout · Navbar · MenuUsuario · Footer · ObservadorSesion · RutaProtegida · RutaPorRol · SoloAnonimo
│   ├── componentes/  Boton · Campo · Selector · Badge · Tarjeta · Modal · Tabla · Aviso · Avisos · PrecioCOP · Cargando · EstadoVacio · EstadoError · …
│   ├── funcionalidades/ auth · eventos · artistas · sedes · usuarios · tickets · admin
│   ├── pages/        20 páginas + ErrorPagina
│   └── test/         setup.ts · utils.tsx · mocks/ (handlers MSW de los 23 endpoints) · pruebas
├── .env.example · vite.config.ts · eslint.config.js · tsconfig*.json
```

## Pruebas

Las pruebas no necesitan backend: MSW simula la API a nivel de red con una base en memoria que reproduce la política del backend real (403 ajeno, 404 inexistente/borrador, 409 reglas). Cubren todos los casos mínimos de la sección 21 del PRD (`TEST-FE-LIB-*`, `AUTH-*`, `EVT-*`, `ART-*`, `VEN-*`, `TKT-*`, `STF-*`, `ADM-*`, `GEN-*`), los estados cargando/vacío/error de cada página, el mapeo de errores, la invalidación de caché tras mutaciones y una verificación estática de los anti-patrones prohibidos. Las fechas son deterministas (`lib/reloj.ts` inyectable).

## Brechas conocidas del backend (aceptadas)

| ID | Decisión en el frontend |
|---|---|
| GAP-01 | No existe `GET /api/events`: el panel ADMIN busca por código y recuerda en la pestaña los eventos creados. |
| GAP-02 | Un borrador consultado por anónimo/USER responde 404 → "Evento no disponible". Por la misma regla, un evento `SOLD_OUT`/`CANCELLED` solo lo ven STAFF/ADMIN; la UI igualmente deshabilita la compra fuera de `PUBLISHED`. |
| GAP-03 | "Mis tickets" usa `GET /api/tickets/by-user?email=` con el email de `/api/auth/me`. |
| GAP-04 | Sin disponibilidad en el contrato: se muestra la capacidad de la sede; la compra puede responder 409. |
| GAP-05 | Sin CORS: proxy de Vite en desarrollo. |
| GAP-06 | El precio lo fija el backend; se muestra desde `TicketResponse`. |
| GAP-07 | El registro no emite token: registro → login con aviso. |
| GAP-08 | Sin refresh token: al expirar (900 s) o ante un 401 se cierra la sesión local. |
| Titular | `TicketResponse` solo expone `userEmail`; STAFF ve el correo como titular. En el detalle propio se muestra el nombre del perfil (`/api/users/by-email`). |

El backend, la base de datos y los contratos HTTP **no se modificaron**.
