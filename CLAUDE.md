# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DigitalHome.Cloud Designer — a Gatsby 5 / React 18 web app providing a Blockly-based visual workspace for designing SmartHomes. Part of the DigitalHome.Cloud ecosystem.

## Commands

- `yarn develop` — Start local dev server (localhost:8001)
- `yarn build` — Production build (outputs to `public/`)
- `yarn clean` — Clear Gatsby cache (`.cache/` and `public/`)
- `yarn format` — Prettier formatting across all source files
- No test suite is configured yet

## Local Dev Setup

This app shares the Amplify Gen1 backend owned by the portal repo (`digitalhome-cloud-portal`). After running `amplify pull` against the portal's backend, run:

```bash
node scripts/generate-aws-config-from-master.js
```

This produces:
- `src/aws-exports.deployment.js` — env-var-driven config, **safe to commit**
- `.env.development` — actual values as `GATSBY_*` env vars, **gitignored, never commit**

Alternatively, copy `.env.development` from the portal repo (same backend, same values).

**Files that must never be committed:** `src/aws-exports.js`, `.env.development` (both gitignored).

## Architecture

### Shared Backend

This app does **not** own an Amplify backend. The backend (Cognito, AppSync, DynamoDB, S3) lives in `digitalhome-cloud-portal/amplify/`. This repo is a frontend-only consumer using the same `aws-exports.deployment.js` pattern and `GATSBY_*` env vars.

### Authentication & SmartHome Context

Both `AuthContext` and `SmartHomeContext` are copied from the portal and work identically:
- `AuthContext` (`src/context/AuthContext.js`) — Cognito session, auth state, groups
- `SmartHomeContext` (`src/context/SmartHomeContext.js`) — active SmartHome selection

The SmartHomeContext reads the `?home=` URL query parameter on load (passed from the portal's tile links) and persists the selection to `localStorage`.

### SmartHome ID

The SmartHome ID is the top-level tenant/partition key. Format: `{country}-{zip}-{street3letter}{housenumber}-{nn}` (e.g. `DE-80331-MAR12-01`). Three demo homes always available: `DE-DEMO`, `FR-DEMO`, `BE-DEMO`.

### Blockly Workspace

- `src/blockly/blocks/dhc.js` — Custom DHC ontology block definitions
- `src/blockly/toolbox.js` — Toolbox configuration
- `src/blockly/workspace.js` — Workspace initialization
- `src/blockly/smartHomeToolboxes.ts` — Design view-specific toolboxes
- `src/components/WorkspaceShell.js` — Two-panel layout (Canvas + Inspector)

### Internationalization

English only (`en`). Translation files in `src/locales/en/common.json`. Uses `gatsby-plugin-react-i18next`.

### Styling

Plain CSS in `src/styles/global.css`. Dark-mode theme with slate/blue palette matching the portal. No CSS framework.

### Authentication Resilience

`AuthContext` calls `getCurrentUser()` before `fetchAuthSession()`. This ensures that if the Cognito Identity Pool is misconfigured (e.g. wrong region in `GATSBY_IDENTITY_POOL_ID`), authentication still works. See portal CLAUDE.md for details.

## Dependencies & Licenses

All dependencies are open source. Key libraries:

| Package | License | Notes |
|---------|---------|-------|
| react, react-dom | MIT | UI framework |
| gatsby | MIT | Static site generator |
| aws-amplify | Apache-2.0 | AWS Amplify JS SDK v6 |
| @aws-amplify/ui-react | Apache-2.0 | Pre-built auth UI components |
| blockly | Apache-2.0 | Visual block editor |
| i18next, react-i18next | MIT | Internationalization |

No copyleft (GPL/LGPL/AGPL) dependencies. Apache-2.0 requires preserving copyright notices and license text in distributions but has no source-sharing obligations.

## Multi-Repo Ecosystem

| App | Repo | Port | URL |
|-----|------|------|-----|
| Portal | `digitalhome-cloud-portal` | 8000 | `portal.digitalhome.cloud` |
| Designer | `digitalhome-cloud-designer` | 8001 | `designer.digitalhome.cloud` |
| Modeler | `digitalhome-cloud-modeler` | 8002 | `modeler.digitalhome.cloud` |

The semantic-core ontology files (TTL, JSON-LD context, SHACL shapes) live inside the modeler repo under `semantic-core/`.

All repos use `stage` branch for staging work before merging to `main`.

## Deployment

Amplify Hosting with branch-to-environment mapping:
- `main` → production (`designer.digitalhome.cloud`)
- `stage` → staging

Build spec is in `amplify.yml`. The build runs `npm run build` and deploys `public/`.
