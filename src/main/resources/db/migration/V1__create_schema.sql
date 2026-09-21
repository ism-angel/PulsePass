
-- ---------- 1. Tablas independientes (no referencian a otras) ----------

CREATE TABLE venues
(
    id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code     VARCHAR(50)  NOT NULL UNIQUE,               -- FR-VEN-002
    name     VARCHAR(150) NOT NULL,
    city     VARCHAR(100) NOT NULL,
    address  VARCHAR(200) NOT NULL,
    capacity INTEGER      NOT NULL CHECK (capacity > 0), -- FR-VEN-003
    active   BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE artists
(
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stage_name VARCHAR(100) NOT NULL UNIQUE, -- FR-ART-002
    country    VARCHAR(80),
    genre      VARCHAR(80),
    active     BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE users
(
    id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50)  NOT NULL UNIQUE, -- FR-USR-002
    email    VARCHAR(150) NOT NULL UNIQUE, -- FR-USR-002
    active   BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ---------- 2. Tablas que dependen de las anteriores ----------

CREATE TABLE events
(
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_code  VARCHAR(50)  NOT NULL UNIQUE,                -- FR-EVT-002
    name        VARCHAR(150) NOT NULL,
    description VARCHAR(1000),
    category    VARCHAR(30)  NOT NULL                        -- FR-EVT-004
        CHECK (category IN ('MUSIC', 'SPORTS', 'TECHNOLOGY', 'EDUCATION', 'CULTURE', 'ENTERTAINMENT')),
    status      VARCHAR(30)  NOT NULL                        -- FR-EVT-003
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'SOLD_OUT', 'CANCELLED', 'FINISHED')),
    event_date  TIMESTAMP    NOT NULL,
    minimum_age INTEGER      NOT NULL DEFAULT 0 CHECK (minimum_age >= 0),
    venue_id    BIGINT       NOT NULL REFERENCES venues (id) -- BR-001
);

CREATE TABLE user_profiles
(
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(80) NOT NULL,
    last_name  VARCHAR(80) NOT NULL,
    phone      VARCHAR(30),
    city       VARCHAR(100),
    birth_date DATE,
    user_id    BIGINT      NOT NULL UNIQUE REFERENCES users (id) -- FK + UNIQUE = 1:1 (FR-USR-003)
);

-- Tabla intermedia de la relación N:M Event - Artist
CREATE TABLE event_artists
(
    event_id  BIGINT NOT NULL REFERENCES events (id),
    artist_id BIGINT NOT NULL REFERENCES artists (id),
    PRIMARY KEY (event_id, artist_id) -- impide repetir el mismo par (FR-ART-003)
);

-- ---------- 3. Tickets (dependen de users y events) ----------

CREATE TABLE tickets
(
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_code   VARCHAR(50)    NOT NULL UNIQUE,                -- FR-TKT-002
    type          VARCHAR(30)    NOT NULL                        -- FR-TKT-004
        CHECK (type IN ('GENERAL', 'VIP', 'BACKSTAGE', 'STUDENT')),
    price         NUMERIC(12, 2) NOT NULL CHECK (price >= 0),    -- FR-TKT-003, BR-007
    status        VARCHAR(30)    NOT NULL                        -- FR-TKT-005
        CHECK (status IN ('RESERVED', 'PAID', 'CANCELLED', 'USED')),
    purchase_date TIMESTAMP      NOT NULL,
    user_id       BIGINT         NOT NULL REFERENCES users (id), -- FR-TKT-001
    event_id      BIGINT         NOT NULL REFERENCES events (id) -- FR-TKT-001
);

-- ---------- 4. Índices ----------
-- PostgreSQL indexa solas las PK y las columnas UNIQUE, pero NO las FK.
-- Estos índices ayudan a las consultas de la sección 14.

CREATE INDEX idx_events_venue_id ON events (venue_id);
CREATE INDEX idx_events_status_date ON events (status, event_date); -- eventos PUBLISHED por fecha
CREATE INDEX idx_event_artists_artist_id ON event_artists (artist_id);
CREATE INDEX idx_tickets_user_id ON tickets (user_id);
CREATE INDEX idx_tickets_event_status ON tickets (event_id, status); -- tickets PAID por evento