<div align="center">
  <img src="client/frontend/public/favicon.svg" alt="Cupcake Box Logo" width="76" height="76" />

  # Cupcake Box

  **Server management, stripped of noise.**

  A modern, lightweight, self-hosted game & application server control plane with real-time WebSocket console streaming, live resource telemetry, web file & SFTP management, and multi-node orchestration.

  [![Go](https://img.shields.io/badge/Backend-Go_1.23+-00ADD8?logo=go&logoColor=white)](go.mod)
  [![Vue 3](https://img.shields.io/badge/Frontend-Vue_3_%2B_Vite-4FC08D?logo=vuedotjs&logoColor=white)](client/frontend/package.json)
  [![Docker](https://img.shields.io/badge/Deploy-Docker_Ready-2496ED?logo=docker&logoColor=white)](Dockerfile)
  [![License](https://img.shields.io/badge/License-Apache_2.0-589284)](LICENSE)

  [Full Documentation (`docs/README.md`)](docs/README.md) · [REST API Spec (`api.md`)](api.md) · [Security Policy](SECURITY.md) · [By Alfareza](https://alfareza.site)
</div>

---

## Overview

**Cupcake Box** is an open-source server management panel built on a fast Go daemon/backend and a redesigned **Vue 3 Studio UI**. It lets individuals, communities, and teams deploy, monitor, and manage game servers and containerized workloads across single or distributed nodes from one calm, distraction-free interface.

---

## Key Features

- **Live Console & Real-Time Telemetry**
  - Full-width interactive WebSocket terminal with instant command execution and log history.
  - Compact telemetry strip and live CPU, RAM, and JVM heap/metaspace charts.
- **Web File Manager, Built-in SFTP & Backups**
  - Browse, upload, extract archives, and edit config files in-browser via Ace Editor.
  - Native SFTP server (`:5657`) and one-click server backup & restore workflows.
- **Multi-Node & Template Orchestration**
  - Manage local and remote nodes from a single control plane.
  - Deploy servers in seconds using JSON templates with **Host** (Linux `unshare` isolation) or **Docker** environments.
- **Granular RBAC, OAuth2 & Security**
  - Per-server and panel-wide permission scopes for multi-user teams.
  - Two-Factor Authentication (**TOTP 2FA**), **WebAuthn Passkeys**, and **OAuth2** API clients.
- **Cupcake Box Studio UI**
  - Crafted dark workspace with **3 base tones** (`Graphite`, `Slate`, `Midnight`), **6 muted accent presets** + custom hex color with auto-calculated tonal steps, live theme preview, custom logo support, and multi-language localization (`id_ID`, `en_US`, and more).

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend & Daemon** | Go (`gin-gonic`, `gorm`, WebSockets, built-in SFTP & OAuth2 server) |
| **Frontend UI** | Vue 3 (Composition API), Vite 7, Vue Router 4, Vue I18n, SCSS, Chart.js, Ace Editor |
| **Database Support** | SQLite3 (default, zero-config), MySQL / MariaDB, PostgreSQL |
| **Runtime Environments** | Linux Host (`unshare` isolation) & Docker Engine |

---

## Quick Start

### Option 1 — Run with Docker (Recommended)

Build and launch **Cupcake Box** in a container:

```bash
# 1. Build the Docker image
docker build -t cupcake-box:latest .

# 2. Create persistent volumes
docker volume create cupcake-config
docker volume create cupcake-var

# 3. Start Cupcake Box
docker run -d \
  --name cupcake-box \
  -p 8080:8080 \
  -p 5657:5657 \
  -v cupcake-config:/etc/pufferpanel \
  -v cupcake-var:/var/lib/pufferpanel \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart unless-stopped \
  cupcake-box:latest

# 4. Create your first admin user
docker exec -it cupcake-box /pufferpanel/bin/pufferpanel user add \
  --email admin@example.com \
  --name admin \
  --password YourStrongPassword123 \
  --admin
```

Open **http://localhost:8080** in your browser and sign in.

---

### Option 2 — Local Development (Backend + Frontend HMR)

#### Prerequisites
- **Go** `1.23+` (with CGO enabled for SQLite)
- **Node.js** `20+` / `22+` and **Yarn** (`1.22+`)

#### 1. Install & Build Frontend Workspace
```bash
cd client
yarn install
yarn --cwd api build
```

#### 2. Start Backend API (`:8080`)
Run via Docker or native Go binary (`cmd/main.go`), then start the Vite dev server which proxies `/api`, `/auth`, `/oauth2`, and `/daemon` to `http://localhost:8080`:

```bash
cd client/frontend
yarn dev
```

Frontend HMR will be available at **http://localhost:5173**.

#### 3. Lint & Production Build
```bash
cd client/frontend
yarn lint
yarn build
```

---

## Repository Structure

```text
.
├── cmd/                        # Go CLI & server entrypoint
├── config/                     # Configuration schema & defaults
├── database/                   # GORM database drivers & migrations
├── models/                     # Domain & persistence models
├── oauth2/                     # OAuth2 token & client provider
├── operations/                 # Template install/runtime operations
├── scopes/                     # Granular RBAC permission scopes
├── servers/                    # Server lifecycle, console & stats engine
├── services/                   # User, node, server, template & email services
├── sftp/                       # Embedded SFTP server
├── web/                        # HTTP REST API, auth, daemon & WebSocket routes
├── client/
│   ├── api/                    # JavaScript API client workspace package
│   └── frontend/               # Vue 3 + Vite Cupcake Box Studio frontend
│       ├── public/             # Brand icons, PWA assets & fonts
│       └── src/
│           ├── components/     # Reusable UI, AuthShell, BrandIcon & server widgets
│           ├── lang/           # Localization bundles (en_US, id_ID, etc.)
│           ├── plugins/        # API, config, hotkeys, i18n & Studio theme engine
│           ├── themes/default/ # Cupcake Box Studio SCSS design system
│           └── views/          # Application pages (Servers, Nodes, Users, Settings)
└── docs/
    └── README.md               # Detailed setup, architecture & customization guide
```

---

## Documentation

For detailed configuration, environment variables, Studio Theme customization, and OAuth2 REST API usage, see **[`docs/README.md`](docs/README.md)**.

---

## License & Attribution

Licensed under the **[Apache License 2.0](LICENSE)**.

- **Cupcake Box UI, Rebrand & Customizations:** Crafted by **[Alfareza](https://alfareza.site)**.
- **Core Engine:** Built upon the open-source [PufferPanel v3](https://github.com/pufferpanel/pufferpanel) architecture under the Apache-2.0 License.
