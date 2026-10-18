-- =====================================================================
-- V4 — Fase 4 Seguridad: credenciales y roles (PRD Seguridad §9)
-- =====================================================================

-- 1:1 con users. La PK es a la vez FK: un usuario tiene como máximo una credencial.
CREATE TABLE user_credentials
(
    user_id             BIGINT       PRIMARY KEY REFERENCES users (id),
    password_hash       VARCHAR(100) NOT NULL,      -- BCrypt = 60 chars; margen para otros algoritmos
    password_changed_at TIMESTAMP
);

-- N:1 con users. PK compuesta: impide repetir el mismo rol a un usuario.
CREATE TABLE user_roles
(
    user_id BIGINT      NOT NULL REFERENCES users (id),
    role    VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'STAFF', 'ADMIN')),
    PRIMARY KEY (user_id, role)
);

-- Estrategia para datos legados (§9.2):
-- los usuarios existentes reciben solo el rol USER, pero NO credencial.
-- Sin fila en user_credentials no pueden iniciar sesión hasta una activación segura.
-- No se inventan contraseñas por defecto.
INSERT INTO user_roles (user_id, role)
SELECT id, 'USER' FROM users;