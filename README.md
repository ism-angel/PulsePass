# PulsePass

Sistema backend de gestion y venta de entradas para eventos y conciertos.

## Sobre el Proyecto
PulsePass es una API desarrollada en Spring Boot orientada a la gestion robusta de recintos (venues), eventos y control de accesos. Utiliza arquitectura limpia, control de versiones de base de datos automatizado y pruebas de integracion con contenedores reales.

## Tecnologias y Dependencias
* Java 21
* Spring Boot (Spring Data JPA)
* PostgreSQL (Base de datos relacional)
* Flyway (Control de migraciones y esquemas de BD)
* Testcontainers (Pruebas de integracion sobre contenedores Docker reales)
* Maven (Gestion de construccion y dependencias)

## Arquitectura y Estructura del Codigo
El proyecto organiza sus componentes bajo una estructura modular y limpia:
* com.pulsepass.PulsePass.domain / entities: Modelos de negocio y entidades JPA mapeadas (ej. Venue).
* com.pulsepass.PulsePass.repositories: Interfaces de persistencia con Spring Data JPA.
* src/main/resources/db/migration: Scripts de migracion SQL gestionados por Flyway.
* src/test/java: Pruebas automatizadas del sistema y repositorios.

## Requisitos Previos
Para compilar y ejecutar el proyecto de forma local, asegurate de tener instalado:
1. Java JDK 21 configurado en tu entorno.
2. Docker Desktop activo (es indispensable si deseas correr las pruebas de integracion que levantan PostgreSQL mediante Testcontainers).
3. Maven (puedes usar el comando integrado).

## Ejecucion de Pruebas
Para limpiar, compilar el codigo y ejecutar toda la suite de pruebas unitarias e de integracion, abre una terminal en la raiz del proyecto y ejecuta:

```bash
mvn clean test