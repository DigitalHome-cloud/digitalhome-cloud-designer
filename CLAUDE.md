# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DigitalHome.Cloud Designer — a Gatsby 5 / React 18 web app providing a three-module SmartHome design application: SmartHome Manager, Blockly-based A-Box Design Workspace, and 3D A-Box Viewer. Part of the DigitalHome.Cloud ecosystem.

## Commands

- `yarn develop` — Start local dev server (localhost:8001)
- `yarn build` — Production build (outputs to `public/`)
- `yarn clean` — Clear Gatsby cache (`.cache/` and `public/`)
- `yarn format` — Prettier formatting across all source files
- No test suite is configured yet

## Local Dev Setup

This app is a **frontend-only consumer** of the Amplify Gen 2 backend defined in the `repos/core` submodule (`digitalhome-cloud-darkfactory/repos/core/amplify/`). Connection details are committed here as `src/amplify_outputs.json` — and this app's stage build **is wired to the stage backend and operational** (in CI the `preBuild` regenerates them via `npx ampx generate outputs`).

After a backend change, copy the regenerated outputs in (local sandbox):

```bash
cp ~/digitalhomeCloud/digitalhome-cloud-darkfactory/repos/core/amplify_outputs.json src/
```

Then `yarn develop` (port 8001). For backend authoring see the umbrella's `dhc-amplify-gen2` skill.

`.env.development` (gitignored) is for cross-app URL overrides only.

**Files that must never be committed:** `.env.development`, `.amplify/`. (`src/amplify_outputs.json` IS committed.)

## Architecture

### Shared Backend

This app does **not** own an Amplify backend. The Gen 2 backend (Cognito User Pool + Identity Pool, AppSync, DynamoDB, S3, Lambdas) is defined in the `repos/core` submodule's `amplify/` directory in TypeScript. This repo is a frontend-only consumer that imports `src/amplify_outputs.json` and configures Amplify JS v6 with it.

### Authentication & SmartHome Context

- `AuthContext` (`src/context/AuthContext.js`) — Cognito session, auth state, groups
- `SmartHomeContext` (`src/context/SmartHomeContext.js`) — active SmartHome selection, fetches user homes via `listSmartHomes` GraphQL query when authenticated

The SmartHomeContext reads the `?home=` URL query parameter on load (passed from the portal's tile links) and persists the selection to `localStorage`. Demo SmartHomes (`DE-DEMO`, `FR-DEMO`, `BE-DEMO`) are always available.

### SmartHome ID

The SmartHome ID is the top-level tenant/partition key. Format: `{country}-{zip}-{street3letter}{housenumber}-{nn}` (e.g. `DE-80331-MAR12-01`). Three demo homes always available: `DE-DEMO`, `FR-DEMO`, `BE-DEMO`.

### Application Modules

The designer has three modules, each with its own page:

- **SmartHome Manager** (`src/pages/manager.js`) — Create/manage SmartHome IDs and metadata
- **Blockly Design Workspace** (`src/pages/design.js`) — Drag-and-drop A-Box design with validation and edit locking
- **3D A-Box Viewer** (`src/pages/viewer.js`) — Interactive 3D visualization of instance models

### Blockly Workspace

- `src/blockly/blockRegistrar.js` — Registers block definitions from JSON (generated from T-Box)
- `src/blockly/toolboxLoader.js` — Fetches toolbox config from S3 (with local fallback)
- `src/blockly/workspace.js` — Workspace initialization with dynamic toolbox support
- `src/blockly/aboxSerializer.js` — Converts workspace to A-Box TTL and JSON
- `src/blockly/connectionCheckers.js` — Enforces block nesting rules
- `src/blockly/blocks/dhc.js` — Legacy OWL block definitions (kept for backward compat)
- `src/components/WorkspaceShell.js` — Two-panel layout (Canvas + field-type-aware Inspector)

Block definitions are **generated from `dhc-core.schema.ttl`** by the modeler's `generate-blockly-toolbox` script and published to S3. The designer fetches them at runtime. For v1.1.0, only spatial, electrical, and shared design views are exposed.

### Validation

- `src/validation/nfc15100.js` — NF C 15-100 validation engine
- `src/validation/rules/` — Individual rule modules (maxPointsPerCircuit, protectionDeviceSizing, wireCrossSection)
- `src/components/ValidationPanel.js` — Violation list with click-to-navigate

### Persistence & Edit Locking

- `src/hooks/useDesignLock.js` — State machine for view/edit mode with pessimistic locking
- `src/components/EditLockToolbar.js` — Lock/save/cancel toolbar
- `src/utils/s3.js` — S3 operations for toolbox, designs, and A-Box artifacts

Design artifacts are stored on S3 under tenant-scoped paths. Real SmartHome designs use `tenant/{smartHomeId}/design/...` and are accessed exclusively through the `dhcDesignStorageProxy` Lambda (in `repos/core/amplify/functions/`) via `requestDesignReadUrl` / `requestDesignWriteUrl` AppSync mutations (DH-SPEC-203). Demo SmartHomes (`DE-DEMO`, `FR-DEMO`, `BE-DEMO`) use `public/smarthomes/{demoId}/design/...` for direct read access.

### 3D A-Box Viewer

- `src/components/ABoxGraph.js` — 3D force-directed graph (react-force-graph-3d)
- `src/components/ABoxInspector.js` — Instance property inspector with catalogue attachment
- `src/components/CatalogueAttachment.js` — Library item search and attach/detach

### Internationalization

English only (`en`). Translation files in `src/locales/en/common.json`. Uses `gatsby-plugin-react-i18next`.

### Styling

Plain CSS in `src/styles/global.css`. Dark-mode theme with slate/blue palette matching the portal. No CSS framework.

### Authentication Resilience

`AuthContext` calls `getCurrentUser()` before `fetchAuthSession()`. If the Identity Pool ever errors, authentication still works — the user stays authenticated and only group/token-payload data may be missing. See portal CLAUDE.md for details.

## Dependencies & Licenses

All dependencies are open source. Key libraries:

| Package | License | Notes |
|---------|---------|-------|
| react, react-dom | MIT | UI framework |
| gatsby | MIT | Static site generator |
| aws-amplify | Apache-2.0 | AWS Amplify JS SDK v6 |
| @aws-amplify/ui-react | Apache-2.0 | Pre-built auth UI components |
| blockly | Apache-2.0 | Visual block editor |
| react-force-graph-3d | MIT | 3D force-directed graph |
| three | MIT | WebGL 3D engine |
| i18next, react-i18next | MIT | Internationalization |

No copyleft (GPL/LGPL/AGPL) dependencies. Apache-2.0 requires preserving copyright notices and license text in distributions but has no source-sharing obligations.

## Multi-Repo Ecosystem

| App | Repo | Port | URL |
|-----|------|------|-----|
| Portal | `digitalhome-cloud-portal` | 8000 | `portal.digitalhome.cloud` |
| Designer | `digitalhome-cloud-designer` | 8001 | `designer.digitalhome.cloud` |
| Modeler | `digitalhome-cloud-modeler` | 8002 | `modeler.digitalhome.cloud` |

The semantic-core ontology files (TTL, JSON-LD context, SHACL shapes) live in the `core` repo under `src/ontology/`.

All repos use `stage` branch for staging work before merging to `main`.

## Deployment

Amplify Hosting with branch-to-environment mapping:
- `main` → production (`designer.digitalhome.cloud`)
- `stage` → staging

Build spec is in `amplify.yml`. The build's `preBuild` pulls the deployed backend config via `npx ampx generate outputs --branch $AMPLIFY_BACKEND_APP_BRANCH --app-id $AMPLIFY_BACKEND_APP_ID --out-dir ./src`, then runs the Gatsby build and deploys `public/`. The backend deploy (`npx ampx pipeline-deploy`) runs from `repos/core`'s own backend-only Hosting build, not this app's.
