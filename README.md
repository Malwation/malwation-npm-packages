# @malwation packages

Monorepo for `@malwation/*` npm packages.

## Packages

| Package | Description |
|---------|-------------|
| [@malwation/logfmt](./packages/logfmt) | Winston logfmt formatter for NestJS |

## Development

```bash
npm install                         # install all workspace dependencies
npm run build                       # build all packages
npm test                            # test all packages
npm run build -w packages/logfmt    # build a single package
npm run test -w packages/logfmt     # test a single package
```

## Publishing

Publishing is automated via [Changesets](https://github.com/changesets/changesets):

1. Run `npx changeset` and describe your change (patch/minor/major).
2. Commit the generated `.changeset/*.md` file with your PR.
3. On merge to main, a "Version Packages" PR is auto-created with version bumps and changelog updates.
4. Merging that PR publishes the changed packages to npm.

**Setup:** Add an `NPM_TOKEN` secret (npm automation token for `@malwation` org) in GitHub repo Settings > Secrets > Actions.

## Adding a new package

1. Create `packages/<name>/` with `package.json`, `tsconfig.json` (extending `../../tsconfig.base.json`), `jest.config.js`, and `src/`.
2. Ensure `package.json` has `"publishConfig": { "access": "public" }`.
3. Run `npm install` from root.
