# PulsePass

Sistema backend de gestión y venta de entradas para eventos y conciertos.

## Sobre el Proyecto
PulsePass es una API desarrollada en Spring Boot orientada a la gestión de recintos (venues), eventos, artistas, usuarios y tickets. Utiliza una arquitectura por capas, control de versiones de base de datos automatizado y pruebas de integración con contenedores reales.

## Tecnologías y Dependencias
* Java 21
* Spring Boot 4 (Spring Data JPA)
* PostgreSQL (base de datos relacional)
* Flyway (control de migraciones y esquemas de BD)
* MapStruct (mapeo Entity → DTO)
* Lombok
* Testcontainers (pruebas de integración sobre contenedores Docker reales)
* Maven (gestión de construcción y dependencias)

## Arquitectura y Estructura del Código
El proyecto sigue una separación por capas:

```
Controller (REST)
   ↓
DTOs (records)
   ↓
Services
   ↓
Repositories
   ↓
Entities
   ↓
PostgreSQL
```

Estructura de paquetes bajo `com.pulsepass.PulsePass`:

* `domain`: entidades JPA y enums (`Venue`, `Event`, `Artist`, `User`, `UserProfile`, `Ticket`, `EventCategory`, `EventStatus`, `TicketType`, `TicketStatus`).
* `repository`: interfaces de persistencia con Spring Data JPA.
* `dto.request`: `CreateEventRequest`, `RegisterUserRequest`, `PurchaseTicketRequest`.
* `dto.response`: `VenueResponse`, `ArtistResponse`, `EventResponse`, `EventSummaryResponse`, `UserResponse`, `TicketResponse`, `ErrorResponse`.
* `mapper`: mappers MapStruct (`VenueMapper`, `ArtistMapper`, `EventMapper`, `UserMapper`, `TicketMapper`).
* `controller`: controllers REST (`VenueController`, `EventController`, `ArtistController`, `UserController`, `TicketController`).
* `exception`: `ResourceNotFoundException`, `BusinessRuleException`, `DuplicateResourceException` y `GlobalExceptionHandler` (`@RestControllerAdvice`).
* `service`: interfaces de servicio y `TicketPriceCalculator`.
* `service.impl`: implementaciones `@Service`.
* `src/main/resources/db/migration`: scripts de migración SQL gestionados por Flyway.
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

### Excepciones
* `ResourceNotFoundException`: el recurso solicitado no existe.
* `DuplicateResourceException`: conflicto de unicidad.
* `BusinessRuleException`: el recurso existe, pero la operación no es válida.

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
Los controllers solo traducen HTTP a llamadas de Service: no contienen reglas de negocio, no usan repositories y responden exclusivamente DTOs mediante `ResponseEntity`. La validación estructural (Bean Validation con `@Valid`) ocurre antes de invocar el Service; las reglas de negocio permanecen en la capa de servicios.

### Endpoints principales
| Método | Endpoint | Éxito |
|---|---|---|
| GET | `/api/venues/{code}` | 200 |
| GET | `/api/venues/active` | 200 |
| POST | `/api/events` | 201 |
| GET | `/api/events/{eventCode}` | 200 |
| GET | `/api/events/published` | 200 |
| PATCH | `/api/events/{eventCode}/publish` | 200 |
| POST | `/api/events/{eventCode}/artists/{artistId}` | 200 |
| GET | `/api/events/by-artist?stageName=...` | 200 |
| GET | `/api/artists/{id}` | 200 |
| GET | `/api/artists/by-stage-name?stageName=...` | 200 |
| GET | `/api/artists/active` | 200 |
| POST | `/api/users` | 201 |
| GET | `/api/users/by-email?email=...` | 200 |
| GET | `/api/users/by-username?username=...` | 200 |
| POST | `/api/tickets` | 201 |
| GET | `/api/tickets/{ticketCode}` | 200 |
| GET | `/api/tickets/by-user?email=...` | 200 |
| GET | `/api/events/{eventCode}/tickets/paid` | 200 |
| PATCH | `/api/tickets/{ticketCode}/cancel` | 200 |
| PATCH | `/api/tickets/{ticketCode}/use` | 200 |

### Contrato de errores
Todos los errores usan `ErrorResponse` (`timestamp`, `status`, `error`, `message`, `details`):

| Condición | HTTP |
|---|---|
| Bean Validation (`MethodArgumentNotValidException`) o JSON mal formado | 400 |
| `ResourceNotFoundException` | 404 |
| `DuplicateResourceException` / `BusinessRuleException` | 409 |
| Error inesperado | 500 |

### Pruebas de controllers
Usan `@WebMvcTest`, `MockMvc` y `@MockitoBean`: no levantan PostgreSQL ni Docker. Para ejecutar solo estas pruebas:

```bash
./mvnw test -Dtest='*ControllerTest'
```

## Requisitos Previos
Para compilar y ejecutar el proyecto de forma local, asegúrate de tener instalado:
1. Java JDK 21 configurado en tu entorno.
2. Docker Desktop activo (indispensable para las pruebas de integración que levantan PostgreSQL mediante Testcontainers).
3. Maven (puedes usar el wrapper integrado: `./mvnw`).

## Ejecución de Pruebas
Para limpiar, compilar el código y ejecutar la suite de pruebas, abre una terminal en la raíz del proyecto y ejecuta:

```bash
mvn clean test
```

## Estado del Proyecto
* Capa de persistencia: completa.
* Capa de servicios: implementada (interfaces, implementaciones, DTOs, mappers, excepciones y reglas de negocio).
* Pruebas unitarias de la capa de servicios (JUnit 5, Mockito, AssertJ): pendientes.
* Capa de controladores REST: implementada (5 controllers, `GlobalExceptionHandler`, `ErrorResponse` y pruebas `@WebMvcTest`).