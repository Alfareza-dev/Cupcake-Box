# Cupcake Box — Documentation

Welcome to the official technical documentation for **Cupcake Box** (*Server management, stripped of noise*).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Installation & Deployment](#2-installation--deployment)
   - [Docker Deployment](#docker-deployment)
   - [Native Build from Source](#native-build-from-source)
3. [Configuration Reference](#3-configuration-reference)
4. [Development Guide](#4-development-guide)
5. [Studio Theme & Branding Customization](#5-studio-theme--branding-customization)
6. [Authentication, RBAC & Security](#6-authentication-rbac--security)
7. [REST API & OAuth2 Usage](#7-rest-api--oauth2-usage)

---

## 1. Architecture Overview

Cupcake Box consists of two primary layers packaged into a single deployable binary or container:

1. **Control Plane & Daemon (Go)**
   - **Panel Web & API (`web/`):** Serves the SPA frontend, handles session authentication (`/auth`), OAuth2 (`/oauth2`), and REST endpoints (`/api`).
   - **Daemon (`/daemon` & `servers/`):** Manages server processes, streams live `stdout`/`stderr` over WebSockets, samples CPU/RAM/JVM telemetry, serves Web File Manager operations, and runs an embedded SFTP server (`sftp/`).
   - **Multi-Node Mesh:** A single Cupcake Box panel can orchestrate both its local daemon and multiple remote nodes over HTTPS + daemon keys.

2. **Cupcake Box Studio Frontend (`client/`)**
   - **`client/api`:** Shared API client library handling REST calls, OAuth2 bearer tokens, and WebSocket streams.
   - **`client/frontend`:** Vue 3 + Vite Single-Page Application featuring the **Studio UI** layout:
     - Split-screen authentication shell (`/auth/login`, `/auth/register`, `/auth/invite`)
     - Two-per-row server overview cards (`/servers`) with live CPU, RAM, and status indicators
     - Full-width server console with compact horizontal telemetry strip and contextual left `SERVER` navigation
     - Unified admin views for Nodes, Users (stacked details & granular permissions), Templates, and Panel Settings

---

## 2. Installation & Deployment

### Docker Deployment

```bash
# Build image
docker build -t cupcake-box:latest .

# Prepare persistent volumes
docker volume create cupcake-config
docker volume create cupcake-var

# Run container
docker run -d \
  --name cupcake-box \
  -p 8080:8080 \
  -p 5657:5657 \
  -v cupcake-config:/etc/pufferpanel \
  -v cupcake-var:/var/lib/pufferpanel \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart unless-stopped \
  cupcake-box:latest
```

Create an administrator account:

```bash
docker exec -it cupcake-box /pufferpanel/bin/pufferpanel user add \
  --email admin@example.com \
  --name admin \
  --password ChangeMe123! \
  --admin
```

| Exposed Port | Purpose |
| :--- | :--- |
| `8080/tcp` | Web UI, REST API & WebSocket console |
| `5657/tcp` | Embedded SFTP server for server files |

---

### Native Build from Source

Requirements:
- **Go** `1.23+` with `CGO_ENABLED=1` and a C compiler (`gcc` / `clang`)
- **Node.js** `20+` / `22+` & **Yarn** `1.x`

```bash
# 1. Build frontend assets
cd client
yarn install
yarn build
cd ..

# 2. Build Go binary
CGO_ENABLED=1 go build -o cupcake-box ./cmd

# 3. Run database migrations & start panel
./cupcake-box db upgrade
./cupcake-box run
```

---

## 3. Configuration Reference

Cupcake Box reads configuration from `config.json` (default `/etc/pufferpanel/config.json` in Docker, or `./config.json` locally) as well as `PUFFER_*` environment variables.

Key settings (`config/entries.go`):

| Key / Env Variable | Default | Description |
| :--- | :--- | :--- |
| `panel.enable` (`PUFFER_PANEL_ENABLE`) | `true` | Enable the web panel & REST API |
| `daemon.enable` (`PUFFER_DAEMON_ENABLE`) | `true` | Enable the server execution daemon |
| `web.host` (`PUFFER_WEB_HOST`) | `0.0.0.0:8080` | HTTP listen address and port |
| `daemon.sftp.host` (`PUFFER_DAEMON_SFTP_HOST`) | `0.0.0.0:5657` | SFTP listen address and port |
| `panel.database.dialect` | `sqlite3` | Database dialect (`sqlite3`, `mysql`, `postgres`) |
| `panel.database.url` | `file:pufferpanel.db?cache=shared` | Database DSN / connection string |
| `panel.settings.companyName` | `Cupcake Box` | Default panel brand name |
| `panel.settings.masterUrl` | `http://localhost:8080` | Public base URL of the panel |

---

## 4. Development Guide

### Running Frontend HMR with Backend Proxy

`client/frontend/vite.config.js` proxies `/api`, `/auth`, `/oauth2`, and `/daemon` (including WebSockets) to `http://localhost:8080` by default.

```bash
# Install workspace dependencies
cd client
yarn install

# Build shared API package
yarn --cwd api build

# Launch Vite dev server on http://localhost:5173
cd frontend
yarn dev
```

To point the Vite proxy to a custom backend target, set `BACKEND_URL`:

```bash
BACKEND_URL=http://127.0.0.1:8080 yarn dev
```

### Code Quality & Verification

```bash
# Lint Vue & JS sources
cd client/frontend && yarn lint

# Production frontend bundle check (strict i18n env check)
cd client && VITE_CHECK_ENV="true" yarn build

# Go unit tests
go test ./...
```

---

## 5. Studio Theme & Branding Customization

Administrators can customize global branding and theme defaults under **Settings (`/settings`)**, while individual users can personalize their workspace under **Preferences (`/self`)**:

- **Company Name:** Updates browser titles, topbar brand text, authentication showcase, and live preview.
- **Logo URL *(optional)*:** Replaces the default Cupcake Box icon in the topbar and auth showcase with a custom transparent logo (`~28px` height recommended).
- **Base Tone:**
  - `Graphite (warm)` *(default)*
  - `Slate (cool)`
  - `Midnight`
- **Accent Colour:**
  - 6 muted presets (`Sage #589284` default, `Steel`, `Ochre`, `Terracotta`, `Iris`, `Moss`) or any custom hex color.
  - Lighter and darker tonal steps (`--accent-light`, `--accent-dark`, `--accent-subtle`, `--accent-border`) are automatically calculated in [`src/utils/theme.js`](../client/frontend/src/utils/theme.js).

---

## 6. Authentication, RBAC & Security

- **Two-Factor Authentication (2FA):** Users can enroll TOTP authenticator apps and generate backup recovery codes in `/self`.
- **Passkeys (WebAuthn):** Passwordless hardware key / biometric login support.
- **Granular Scopes:** Assign fine-grained permissions globally (`/users/view/:id`) or per server (`Console`, `Files`, `SFTP`, `Settings`, `Users`, `Backups`).
- **Host Isolation (`unshare`):** When running servers on the `host` environment on Linux, `unshare` isolates filesystem access by default unless explicitly disabled by an administrator under **Advanced Settings → Disable Unshare**.

---

## 7. REST API & OAuth2 Usage

Cupcake Box exposes a JSON REST API secured with **OAuth2 Client Credentials**:

1. Navigate to **Preferences (`/self`)** for account-wide API access, or **Server → API** for single-server access, and create an OAuth2 client (`client_id` & `client_secret`).
2. Request an access token from `POST /oauth2/token`:
   ```bash
   curl -X POST http://localhost:8080/oauth2/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"
   ```
3. Include the returned token on subsequent API requests:
   ```bash
   curl http://localhost:8080/api/servers \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

See [`../api.md`](../api.md) for response status codes and standard error payload formats.

---

<div align="center">
  Crafted with care by <a href="https://alfareza.site"><strong>Alfareza</strong></a>
</div>

