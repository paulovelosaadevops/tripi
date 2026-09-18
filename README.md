# Tripi

Fundacao tecnica inicial do Tripi, criada a partir da especificacao tecnica aprovada em `docs/Tripi-Arquitetura-Tecnica-v0.1 (1).md`.

## Requisitos

- Node.js 22.13 ou superior.
- npm 11 ou superior.
- Java 25 LTS.
- Docker com Docker Compose.

## Estrutura

```text
apps/
  api/
  mobile/
packages/
  api-client/
  config/
  design-tokens/
infrastructure/
docs/
```

## Preparacao

```powershell
npm.cmd install
Copy-Item .env.example .env
```

## Infraestrutura local

```powershell
docker compose -f infrastructure/docker-compose.yml up -d
```

PostgreSQL local:

- Host: `127.0.0.1`
- Porta host: `55432`
- Porta interna do container: `5432`
- Banco: `tripi`
- Usuario: `tripi`

A porta host local `55432` evita conflito com PostgreSQL nativo em `5432`.

## API

```powershell
cd apps/api
.\mvnw.cmd spring-boot:run
```

Endpoints tecnicos:

- `GET http://localhost:8080/actuator/health`
- `GET http://localhost:8080/actuator/health/readiness`
- `GET http://localhost:8080/v1/health`

## Mobile

```powershell
cd apps/mobile
npm.cmd run start
```

## Validacao

```powershell
npm.cmd run format
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
cd apps/api
.\mvnw.cmd verify
git diff --check
git status --short
```

## Decisoes tecnicas

- Monorepo com `apps` e `packages`, conforme a especificacao tecnica.
- Aplicativo mobile em Expo SDK 57, a versao estavel disponivel em 18 de setembro de 2026.
- Backend Java 25 com Spring Boot 4.1.0.
- PostgreSQL 18 para desenvolvimento local via Docker Compose.
- Porta local do PostgreSQL em `55432`, mantendo `5432` dentro do container, por coexistencia com PostgreSQL nativo em `5432`.
- Migrations exclusivamente por Flyway.
- OpenAPI como contrato oficial da API.
- Sem funcionalidades de negocio, dados mockados, telas falsas ou endpoints ficticios.
