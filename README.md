# PulsePass

Sistema backend de gestión y venta de entradas para eventos y conciertos.

## Sobre el Proyecto
PulsePass es una API desarrollada en Spring Boot orientada a la gestión de recintos (venues), eventos, artistas, usuarios y tickets. Utiliza una arquitectura por capas, control de versiones de base de datos automatizado, una capa de seguridad stateless con JWT y pruebas de integración con contenedores reales.

## Tecnologías y Dependencias
* Java 21
* Spring Boot 4 (Spring Data JPA)
* Spring Security 7 (autenticación, autorización por roles y filtro JWT)
* JJWT 0.13 (emisión y validación de JWT firmados con HS256)
* PostgreSQL (base de datos relacional)
* Flyway (control de migraciones y esquemas de BD)
* MapStruct (mapeo Entity → DTO)
* Lombok
* Testcontainers (pruebas de integración sobre contenedores Docker reales)
* Maven (gestión de construcción y dependencias)

## Arquitectura y Estructura del Código
El proyecto sigue una separación por capas, con la seguridad como perímetro HTTP antes de los controllers:

```
Cliente HTTP
   ↓
Spring Security Filter Chain (JwtAuthenticationFilter + reglas por ruta)
   ↓
Controller (REST)
   ↓
DTOs (records)
   ↓
Services (+ AuthorizationService: control de propiedad)
   ↓
Repositories
   ↓
Entities
   ↓
PostgreSQL
```

Estructura de paquetes bajo `com.pulsepass.PulsePass`:

* `domain`: entidades JPA y enums (`Venue`, `Event`, `Artist`, `User`, `UserProfile`, `Ticket`, `UserCredential`, `UserRole`, `EventCategory`, `EventStatus`, `TicketType`, `TicketStatus`, `Role`).
* `repository`: interfaces de persistencia con Spring Data JPA (incluye `UserCredentialRepository` y `UserRoleRepository`).
* `dto.request`: `CreateEventRequest`, `RegisterUserRequest`, `PurchaseTicketRequest`, `LoginRequest`.
* `dto.response`: `VenueResponse`, `ArtistResponse`, `EventResponse`, `EventSummaryResponse`, `UserResponse`, `TicketResponse`, `ErrorResponse`, `AuthResponse`, `AuthenticatedUserResponse`.
* `mapper`: mappers MapStruct (`VenueMapper`, `ArtistMapper`, `EventMapper`, `UserMapper`, `TicketMapper`).
* `controller`: controllers REST (`VenueController`, `EventController`, `ArtistController`, `UserController`, `TicketController`, `AuthController`).
* `exception`: `ResourceNotFoundException`, `BusinessRuleException`, `DuplicateResourceException`, `InvalidCredentialsException` y `GlobalExceptionHandler` (`@RestControllerAdvice`).
* `security`: `SecurityConfig`, `JwtProperties`, `JwtService`, `JwtAuthenticationFilter`, `CustomUserDetailsService`, `SecurityPrincipal`, `RestAuthenticationEntryPoint`, `RestAccessDeniedHandler`, `SecurityErrorWriter`.
* `service`: interfaces de servicio, `TicketPriceCalculator`, `AuthService` y `AuthorizationService`.
* `service.impl`: implementaciones `@Service`.
* `src/main/resources/db/migration`: scripts de migración SQL gestionados por Flyway (V1–V4).
* `src/test/java`: pruebas automatizadas.

## Capa de Servicios
Responsable de aplicar las reglas de negocio, coordinar repositories, controlar transacciones, convertir entidades a DTOs y producir errores de dominio claros.

Principios aplicados:
* Los contratos públicos no exponen entidades JPA; solo DTOs.
* Inyección de dependencias por constructor (campos `final`).
* Cada servicio tiene interfaz e implementación.
* Escrituras con `@Transactional` y lecturas con `@Transactional(readOnly = true)`.
* Los repositories solo acceden a datos; las reglas viven en los servicios.

| Servicio | Responsabilidad |
|---|---|
| `VenueService` | Consultar venues por código y listar venues activos |
| `ArtistService` | Consultar artistas por id o nombre artístico y listar activos |
| `EventService` | Crear, consultar, publicar eventos y asociar artistas |
| `UserService` | Registrar usuarios con su perfil y consultarlos por email o username |
| `TicketService` | Comprar, consultar, cancelar y marcar tickets como usados |
| `AuthService` | Registro atómico (usuario + credencial BCrypt + rol `USER`), login y datos del usuario autenticado |
| `AuthorizationService` | Comparar el usuario autenticado con el propietario del recurso (anti-IDOR) |

### Excepciones
* `ResourceNotFoundException`: el recurso solicitado no existe.
* `DuplicateResourceException`: conflicto de unicidad.
* `BusinessRuleException`: el recurso existe, pero la operación no es válida.
* `InvalidCredentialsException`: login fallido por cualquier motivo, con un mensaje único que no revela si el usuario existe.

### Reglas principales
* **Eventos:** código único, venue existente y activo, fecha futura, edad mínima >= 0 y estado inicial `DRAFT`. Solo se publica un evento `DRAFT` con fecha futura y venue activo. No se agregan artistas a eventos `CANCELLED` o `FINISHED`, ni se repiten.
* **Usuarios:** username y email únicos (el email sin distinguir mayúsculas), `birthDate` no futura, usuario nuevo activo, y `User` y `UserProfile` se crean en la misma transacción.
* **Compra de tickets:** usuario existente y activo, evento existente y `PUBLISHED`, fecha futura, edad mínima evaluada en la fecha del evento y capacidad disponible. La compra es atómica: si cumple la capacidad total, el evento pasa a `SOLD_OUT` en la misma transacción.
* **Precio:** se calcula en el sistema con `BigDecimal` mediante `TicketPriceCalculator`; nunca se toma del cliente ni puede ser negativo.
* **Cancelación y uso:** solo un ticket `PAID` puede pasar a `CANCELLED` (antes de la fecha del evento) o a `USED`.

### Ciclos de estado
```
Evento:  DRAFT → PUBLISHED → SOLD_OUT → FINISHED
         DRAFT → CANCELLED
         PUBLISHED → CANCELLED

Ticket:  PAID → USED
         PAID → CANCELLED
```

## Capa de Controladores REST
Los controllers solo traducen HTTP a llamadas de Service: no contienen reglas de negocio, no usan repositories, no interpretan el JWT y responden exclusivamente DTOs mediante `ResponseEntity`. La validación estructural (Bean Validation con `@Valid`) ocurre antes de invocar el Service; las reglas de negocio permanecen en la capa de servicios.

### Endpoints principales
| Método | Endpoint | Éxito | Acceso |
|---|---|---|---|
| POST | `/api/auth/login` | 200 | Público |
| GET | `/api/auth/me` | 200 | Autenticado |
| GET | `/api/venues/{code}` | 200 | Público |
| GET | `/api/venues/active` | 200 | Público |
| POST | `/api/events` | 201 | `ADMIN` |
| GET | `/api/events/{eventCode}` | 200 | Público si está publicado; otros estados solo `STAFF`/`ADMIN` (404 para el resto) |
| GET | `/api/events/published` | 200 | Público |
| PATCH | `/api/events/{eventCode}/publish` | 200 | `ADMIN` |
| POST | `/api/events/{eventCode}/artists/{artistId}` | 200 | `ADMIN` |
| GET | `/api/events/by-artist?stageName=...` | 200 | Público (solo publicados); `STAFF`/`ADMIN` ven todos |
| GET | `/api/artists/{id}` | 200 | Público |
| GET | `/api/artists/by-stage-name?stageName=...` | 200 | Público |
| GET | `/api/artists/active` | 200 | Público |
| POST | `/api/users` | 201 | Público (rol inicial siempre `USER`) |
| GET | `/api/users/by-email?email=...` | 200 | Propio usuario o `ADMIN` |
| GET | `/api/users/by-username?username=...` | 200 | Propio usuario o `ADMIN` |
| POST | `/api/tickets` | 201 | `USER`; `userEmail` debe ser el del usuario autenticado |
| GET | `/api/tickets/{ticketCode}` | 200 | Propietario, `STAFF` o `ADMIN` |
| GET | `/api/tickets/by-user?email=...` | 200 | Propietario o `ADMIN` |
| GET | `/api/events/{eventCode}/tickets/paid` | 200 | `STAFF` o `ADMIN` |
| PATCH | `/api/tickets/{ticketCode}/cancel` | 200 | Propietario o `ADMIN` |
| PATCH | `/api/tickets/{ticketCode}/use` | 200 | `STAFF` o `ADMIN` |

`POST /api/users` ahora exige el campo `password` (12 a 72 caracteres, máximo 72 bytes). La respuesta `UserResponse` nunca incluye la contraseña ni su hash.

### Contrato de errores
Todos los errores usan `ErrorResponse` (`timestamp`, `status`, `error`, `message`, `details`):

| Condición | HTTP |
|---|---|
| Bean Validation (`MethodArgumentNotValidException`) o JSON mal formado | 400 |
| Sin token, token inválido/expirado/manipulado, usuario inactivo o login incorrecto | 401 |
| Usuario autenticado sin el rol requerido o sobre un recurso ajeno | 403 |
| `ResourceNotFoundException` (incluye eventos no publicados para quien no es `STAFF`/`ADMIN`) | 404 |
| `DuplicateResourceException` / `BusinessRuleException` | 409 |
| Error inesperado | 500 |

Los 401 y 403 que se producen en la cadena de filtros los escriben `RestAuthenticationEntryPoint` y `RestAccessDeniedHandler` con el mismo formato `ErrorResponse`.

### Pruebas de controllers
Usan `@WebMvcTest`, `MockMvc`, `@MockitoBean` y `@WithSecurityLayer` (carga la `SecurityConfig` real): no levantan PostgreSQL ni Docker. Para ejecutar solo estas pruebas:

```bash
./mvnw test -Dtest='*ControllerTest'
```

## Capa de Seguridad
API **stateless**: no usa sesión ni `JSESSIONID`. Cada request protegido envía un JWT en el encabezado `Authorization: Bearer <token>`.

* **Contraseñas:** se guardan solo como hash BCrypt en la tabla `user_credentials`.
* **JWT:** firmado con HS256, duración de 15 minutos (`expiresIn: 900`). Contiene `sub` (ID del usuario), `iss`, `iat`, `exp` y `jti`; no contiene roles ni datos personales.
* **Roles:** `USER`, `STAFF` y `ADMIN`, guardados en la tabla `user_roles`. En cada request se recargan el estado y los roles desde la base de datos, así que desactivar un usuario o quitarle un rol aplica en su siguiente request.
* **Propiedad:** un `USER` solo puede consultar, comprar o cancelar sus propios recursos; se compara por ID persistente, nunca por el email enviado por el cliente.
* **Denegar por defecto:** toda ruta no declarada como pública exige autenticación.

### Flujo de uso
```http
POST /api/users              → registro (201, sin token)
POST /api/auth/login         → {"identifier": "<username o email>", "password": "..."}
                             ← {"accessToken": "<JWT>", "tokenType": "Bearer", "expiresIn": 900}
GET  /api/auth/me
Authorization: Bearer <JWT>  → datos mínimos del usuario autenticado
```

### Variables de entorno
| Variable | Obligatoria | Descripción |
|---|---|---|
| `PULSEPASS_JWT_SECRET_BASE64` | Sí | Clave HMAC en Base64 de al menos 32 bytes aleatorios. Sin ella, la aplicación no arranca |
| `PULSEPASS_JWT_ISSUER` | No | Emisor del token (por defecto `pulsepass-api`) |

Generar una clave de desarrollo:

```powershell
# PowerShell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

```bash
# Git Bash / Linux / macOS
openssl rand -base64 32
```

Configurarla en IntelliJ: **Run → Edit Configurations → PulsePassApplication → Environment variables**. Hay una plantilla en `.env.example`. **Nunca** subir el secreto real al repositorio (`.env` está en `.gitignore`).

### Usuarios STAFF y ADMIN
El registro público siempre asigna el rol `USER`. Los roles privilegiados se asignan manualmente en la base de datos (solo en entornos locales o de prueba):

```sql
-- 1. Registrar el usuario normalmente con POST /api/users
-- 2. Consultar su id
SELECT id, username FROM users WHERE username = 'laura';
-- 3. Asignar el rol
INSERT INTO user_roles (user_id, role) VALUES (<id>, 'STAFF');
INSERT INTO user_roles (user_id, role) VALUES (<id>, 'ADMIN');
```

Los usuarios creados antes de la migración V4 tienen rol `USER` pero no tienen credencial, así que no pueden iniciar sesión hasta una activación segura.

### Limitaciones del MVP
* `STAFF` puede consultar y marcar como usados los tickets de cualquier evento (el dominio aún no asigna personal a eventos); debe restringirse en producción.
* No hay refresh tokens ni revocación inmediata: un token robado sigue siendo válido hasta que vence (15 minutos). Cerrar sesión en el cliente no invalida tokens ya emitidos.
* No hay límite de intentos de login ni protección contra fuerza bruta.
* Un ticket o usuario ajeno responde 403 (decisión única y probada).
* HTTPS es obligatorio fuera de localhost.

## Requisitos Previos
Para compilar y ejecutar el proyecto de forma local, asegúrate de tener instalado:
1. Java JDK 21 configurado en tu entorno.
2. Docker Desktop activo (indispensable para las pruebas de integración que levantan PostgreSQL mediante Testcontainers).
3. Maven (puedes usar el wrapper integrado: `./mvnw`).
4. La variable de entorno `PULSEPASS_JWT_SECRET_BASE64` configurada para ejecutar la aplicación.

## Ejecución de Pruebas
Para limpiar, compilar el código y ejecutar la suite de pruebas, abre una terminal en la raíz del proyecto y ejecuta:

```bash
./mvnw clean test
```

Las pruebas usan el perfil `test` (`src/test/resources/application-test.yaml`), que trae una clave JWT exclusiva de pruebas; no hace falta configurar la variable de entorno para ejecutarlas.

| Suite | Qué verifica |
|---|---|
| `JwtServiceTest` | Firma, claims, expiración, issuer, tokens manipulados o sin firma, clave débil |
| `AuthorizationServiceTest` | Dueño vs tercero, permisos de `STAFF` y `ADMIN`, compra con email ajeno |
| `SecurityMatrixTest` | Matriz de rutas por rol con los filtros activos: 401, 403, login y tokens inválidos |
| `AuthFlowIntegrationTest` | Registro, hash BCrypt real, login, `/me`, token alterado y usuario desactivado contra PostgreSQL |
| Tests de controllers y services | Regresión de las 20 operaciones y control de propiedad en los services |

## Estado del Proyecto
* Capa de persistencia: completa.
* Capa de servicios: implementada (interfaces, implementaciones, DTOs, mappers, excepciones y reglas de negocio).
* Pruebas unitarias de la capa de servicios (JUnit 5, Mockito, AssertJ): implementadas.
* Capa de controladores REST: implementada (6 controllers, `GlobalExceptionHandler`, `ErrorResponse` y pruebas `@WebMvcTest`).
* Capa de seguridad: implementada (Spring Security + JJWT, roles `USER`/`STAFF`/`ADMIN`, control de propiedad, migración V4 y suite de pruebas de seguridad).