# Contributing

## Getting Started

```bash
git clone https://github.com/Malwation/malwation-npm-packages.git
cd malwation-npm-packages
npm install
```

## Development Workflow

1. Create a branch from `main`.
2. Make your changes in the relevant `packages/<name>/` directory.
3. Run tests: `npm test` (or `npm run test -w packages/<name>` for a single package).
4. Run lint: `npm run lint`.
5. Add a changeset: `npx changeset` — select the affected packages and describe the semver bump (patch/minor/major).
6. Commit everything including the generated `.changeset/*.md` file.
7. Open a pull request against `main`.

## Pull Request Guidelines

- CI must pass (lint, test, build) before merging.
- Every PR that changes a package's published code must include a changeset file. If your change doesn't affect published output (e.g. CI config, docs, dev tooling), you can skip the changeset.
- Keep PRs focused — one logical change per PR.

## How Publishing Works

1. When your PR merges to `main`, the release workflow detects pending changesets and opens a "Version Packages" PR with bumped versions and updated changelogs.
2. Merging that PR triggers the actual npm publish.

You don't need to manually bump versions or run `npm publish`.

## Adding a New Package

1. Create `packages/<name>/` with:
   - `package.json` (set `"publishConfig": { "access": "public" }`)
   - `tsconfig.json` (extending `../../tsconfig.base.json`)
   - `jest.config.js`
   - `src/` directory
2. Run `npm install` from root.
3. Add the package to the table in `README.md`.
