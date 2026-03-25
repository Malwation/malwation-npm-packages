# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

Monorepo for `@malwation/*` npm packages, using npm workspaces. Packages are published publicly on npmjs under the `@malwation` organization.

### Packages

- **`@malwation/logfmt`** (`packages/logfmt`) — Winston/logform-based logging formatter for NestJS applications. Outputs logs in [logfmt](https://brandur.org/logfmt) key=value format with optional syslog forwarding.

## Build Commands

```bash
npm install                         # install all workspace deps from root
npm run build                       # build all packages
npm test                            # test all packages
npm run build -w packages/logfmt    # build single package
npm run test -w packages/logfmt     # test single package
npx jest packages/logfmt/src/logger.spec.ts  # run a single test file
```

Each package's `build` script runs tests first — a failing test blocks the build.

### Publishing (Changesets)

Publishing is automated via Changesets + GitHub Actions:

1. When making a change, run `npx changeset` to create a changeset file describing the semver bump.
2. Commit the `.changeset/*.md` file with your PR.
3. On merge to main, the `release.yml` workflow opens a "Version Packages" PR that bumps versions and updates changelogs.
4. Merging that PR triggers the actual npm publish.

## CI/CD

- **`.github/workflows/ci.yml`** — runs lint, test, and build on every PR and push to main.
- **`.github/workflows/release.yml`** — on push to main, uses `changesets/action` to either open a version PR or publish to npm.
- **`NPM_TOKEN`** secret must be set in GitHub repo settings for publishing.

## Monorepo Structure

- **Root `package.json`** — `private: true`, defines `workspaces: ["packages/*"]`, hoists shared devDependencies (typescript, jest, eslint, prettier configs).
- **`tsconfig.base.json`** — shared TypeScript compiler options. Each package extends it with its own `outDir` and `include`.
- **`.eslintrc.js`** — shared ESLint config at root, `parserOptions.project` points to `./packages/*/tsconfig.json`.
- **Per-package** — each package has its own `package.json`, `tsconfig.json`, `jest.config.js`, and `src/`.

### Adding a New Package

1. Create `packages/<name>/` with `package.json`, `tsconfig.json` (extending `../../tsconfig.base.json`), `jest.config.js`, and `src/`.
2. Set `"publishConfig": { "access": "public" }` in the package's `package.json`.
3. Run `npm install` from root — the workspace auto-links.

## Architecture: @malwation/logfmt

Two logging interfaces sharing the same formatting pipeline:

- **`Logger`** (`logger.ts`) — static class for use anywhere (resolvers, 3rd-party libs, engine errors). Uses `AsyncLocalStorage` to propagate context (class + method name) without manual threading.
- **`LogfmtService`** (`logfmt.service.ts`) — NestJS injectable, request-scoped (`Scope.REQUEST`). Automatically extracts IP, user-agent, and session ID from the HTTP request and merges them into every log entry.
- **`LogfmtModule`** (`logfmt.module.ts`) — global NestJS module that provides `LogfmtService`.

Both delegate to NestJS `Logger` under the hood. The `logfmt.parse` format transform in `logfmt.utilities.ts` is the core formatter — it converts `TransformableInfo` into logfmt `key=value` strings with optional colorization, timestamps, and syslog forwarding.

### Context Propagation

The `@CaptureLogContext()` decorator (`logger.ts`) wraps a method to store `{ className, methodName }` in `AsyncLocalStorage`. Both `Logger` and `LogfmtService` read this store to auto-populate the `context` field in log output.

### Syslog Integration

Both `Logger.syslog()` and `LogfmtService.syslog()` accept `syslog-client` `ClientOptions` to forward logs to a remote syslog server. The syslog client is created per-call inside the format transform.

## Key Details

- `@nestjs/common` and `@nestjs/core` are **devDependencies** of the logfmt package — consuming apps must provide them as peer deps.
- `src/logform.d.ts` is a local type augmentation for `logform` — it replaces upstream types to allow `any` on `message` and adds `[key: string | symbol]: any` to `TransformableInfo`.
- `strictNullChecks` is **off** in tsconfig.base.json — code assumes values are non-null in many places.
