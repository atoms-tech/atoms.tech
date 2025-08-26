## Scope Update — App Tooling Migration (Void Zero)

This project is a Next.js app (not a library). We will migrate repo-wide tooling to Void Zero standards without changing the app structure or entry points:
- Keep Next.js for dev/build (no TSDown/Rolldown/Vite for app bundling)
- Replace ESLint with Oxlint (fast linter)
- Replace Jest with Vitest (fast tests)
- Use Bun for package tasks (consistent with CI/hooks)

Branches/PR Strategy:
- Create a long-lived integration branch: integration/voidzero-migration
- Each feature branch (e.g., feature/voidzero-oxlint, feature/voidzero-vitest) targets the integration branch
- After all PRs are merged into the integration branch and CI is green, prepare a final PR from integration → main; do not merge to main until explicit approval

Status: Awaiting execution of PR1 (Oxlint migration).

## Void Zero Migration Plan (TS Libraries) — atoms.tech

Version: 0.1 (Draft) • Owner: Augment Agent • Status: In Planning

### 1) Context and Auto‑Analysis Snapshot
- Repo type: Next.js application (not a published TS library)
- Package manager(s): packageManager field indicates Yarn 4.5; CI and hooks use Bun (bun install, bun run). We will standardize per your preference.
- Framework: React via Next.js 15 (app router)
- Source layout: src/ with app/, components/, lib/, etc.
- Entry points: No standalone library entry detected (e.g., src/index.ts). The project is an app, not a library package.
- TypeScript config: tsconfig.json present (moduleResolution: bundler, noEmit: true)
- Linting: ESLint (flat config via eslint.config.mjs) + Prettier
- Testing: Jest + @testing-library (jest.config.mjs, jest.setup.js). One example test at src/__tests__/example.test.tsx
- Bundler/tooling: Next build (no rollup/webpack custom config besides Next’s internal)
- No Void Zero tooling detected (tsdown/rolldown/oxlint/vitest not present)

Implication: To perform a "TypeScript library → Void Zero" migration, we should either (a) identify an existing internal library to package (e.g., a module under src/lib) or (b) create a new packages/<name> library and progressively extract modules from the app. TSDown will then be applied to that library package.

### 2) Decisions to Confirm (Smart Questions)
Please confirm or adjust:
1. Target library: Do you want to:
   - A) Extract a reusable library from src/lib (e.g., utils, components) into packages/atoms-lib (or similar), or
   - B) Migrate an existing external library (provide repo)?
2. Entry point(s): If extracting, proposed: packages/atoms-lib/src/index.ts (barrel). Are there multiple public entry points to expose?
3. External deps: Which dependencies should remain external (peer)? Typical: react, react-dom, next, @types/react, etc.
4. Output formats: Keep both ESM and CJS? (Recommended: yes.)
5. Linting/testing: Migrate to Oxlint and/or Vitest now, or keep ESLint/Jest for the app and use Oxlint/Vitest only inside the library package?
6. Package manager: Standardize on Yarn (per packageManager) or Bun (as in CI)?
7. CI scope: Add library build/lint/test jobs to GitHub Actions?
8. Versioning/publish: Will this package be published to npm (public or private)? If yes, provide name/scope (e.g., @atoms-tech/atoms-lib) and registry/auth details (no secrets in repo—use CI secrets).

"I detected a Next.js app with ESLint + Jest and no existing library entry; we’ll carve out a package under packages/ for the migration. Is this correct?"

### 3) Phased Plan with WBS
We will work in short sprints; each major task yields a branch + PR. We’ll update this plan at each phase completion.

Phase 0 — Scoping & Inventory (1 PR)
- T0.1 Confirm scope, target package name, outputs, externals, package manager (this doc PR)
- T0.2 Identify candidate modules for extraction (src/lib/*, shared utils/components)
- Deliverables: Finalized scope, checklist, updated plan

Phase 1 — Library Scaffolding (1 PR)
- T1.1 Create packages/atoms-lib with minimal structure
  - package.json (private false), README, tsconfig.json, tsdown.config.js
  - src/index.ts (barrel) and copy selected modules from app
- T1.2 Add Void Zero tooling (TSDown mandatory; optionally Oxlint, Vitest)
- T1.3 Add basic tests (Vitest if chosen) and lint config (Oxlint if chosen)
- Deliverables: Compiles with tsdown; dist/ contains ESM, CJS, and .d.ts

Phase 2 — Migration of Modules (N PRs as needed)
- T2.x Extract and export batches of utilities/components with type-safe public API
- T2.x Add unit tests and documentation per module batch
- T2.x Mark appropriate peerDependencies (e.g., react) to avoid bundling
- Deliverables: Incremental feature sets shipped in the library

Phase 3 — App Integration (1–N PRs)
- T3.1 Replace internal imports with the new package (workspace protocol), validate runtime
- T3.2 Update Next app and CI to build/test with the package
- Deliverables: App uses the library without regressions

Phase 4 — Tooling & CI Hardening (1 PR)
- T4.1 Add CI jobs for the package: build, lint, test, pack
- T4.2 Optional: Introduce Oxlint and/or Vitest at repo root; or keep existing for app
- Deliverables: Green CI; artifacts verified (npm pack)

Phase 5 — Release (1 PR)
- T5.1 Prepare publishing (versioning, changelog)
- T5.2 Publish dry-run + real publish (if desired)
- Deliverables: Published package with ESM/CJS/types

### 4) Detailed Tasks & Acceptance Criteria
Task T1.1 — Scaffold package
- Create: packages/atoms-lib/
  - package.json (name TBD, type: module, exports, files: ["dist"], sideEffects: false)
  - tsconfig.json (single modern config)
  - tsdown.config.js (entry: src/index.ts; formats: ["esm","cjs"]; dts: true; sourcemap: true; external: to be filled)
  - src/index.ts and initial modules
- Scripts in package.json: build (tsdown), clean (rimraf dist), test/lint (optional)
- AC: npm run build completes <1s; dist includes index.js, index.cjs, index.d.ts and maps

Task T1.2 — Add tooling (optional per decision)
- Oxlint: oxlint.json or minimal setup; scripts: lint, lint:fix
- Vitest: tests plus vitest.config.ts (if needed); scripts: test, test:watch
- AC: npm run lint <50ms; npm test passes

Task T2.x — Extract module set
- Identify module group (e.g., env utils, string helpers)
- Move to packages/atoms-lib/src/, add to barrel exports
- Add tests and docs
- AC: Build, lint, test remain green; app still compiles against workspace package

Task T3.1 — Integrate in app
- Add workspace dependency (workspaces if we choose Yarn/Bun workspaces), update imports
- AC: next build passes; runtime sanity checks OK

Task T4.1 — CI for package
- Add new workflow or extend existing: install, build, lint, test, npm pack
- AC: CI green on PRs touching package

Task T5.2 — Publish
- Configure registry and auth via CI secrets; run npm publish or yarn npm publish
- AC: Package visible and installable; README, types, exports validated

### 5) Configuration Templates (for the library package)
- tsdown.config.js
  export default {
    entry: "src/index.ts",
    outDir: "dist",
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    external: [], // fill with peer deps (e.g., "react", "react-dom")
    clean: true,
  };

- tsconfig.json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "declaration": true,
      "declarationMap": true,
      "esModuleInterop": true,
      "allowSyntheticDefaultImports": true,
      "strict": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "isolatedModules": true,
      "noEmit": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
  }

- package.json (library)
  {
    "name": "@atoms-tech/atoms-lib", // confirm
    "version": "0.1.0",
    "private": false,
    "type": "module",
    "main": "./dist/index.cjs",
    "module": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "sideEffects": false,
    "exports": {
      ".": {
        "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
        "require": { "types": "./dist/index.d.ts", "default": "./dist/index.cjs" }
      }
    },
    "files": ["dist"],
    "scripts": {
      "clean": "rimraf dist",
      "build": "tsdown",
      "lint": "oxlint",
      "lint:fix": "oxlint --fix",
      "test": "vitest run",
      "test:watch": "vitest",
      "prepublishOnly": "npm run build"
    },
    "peerDependencies": {},
    "devDependencies": {
      "tsdown": "^0.14.1",
      "typescript": "^5.8.3"
      // optionally: oxlint, vitest, rimraf, @types/node
    }
  }

### 6) Risks & Mitigations
- Scope creep: Start with a small, valuable module set. Iterate.
- Package manager mismatch (Yarn vs Bun): Decide and standardize early; align CI.
- React/Next coupling: Keep peerDependencies for framework deps to avoid bundling.
- App regressions: Replace imports incrementally; add tests to validate.
- CI complexity: Start with a minimal job matrix and expand.

### 7) Definition of Done
- TSDown builds the library (ESM + CJS + .d.ts) via a single command
- Old bundlers not used inside the library package
- Linting and tests pass for the library (tooling per decision)
- App consumes the library via workspace without regressions
- CI validates build/lint/test/pack
- Documentation updated (this plan + library README)

### 8) Next Actions (Pending Your Answers)
- Approve target library scope and name
- Confirm outputs, externals, package manager
- I will then: open an issue, create a feature branch, scaffold the package (Phase 1), and raise a PR

We will keep this document updated at the end of each phase (scrum-like increments).
