module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./packages/*/tsconfig.json"],
    sourceType: "module",
  },
  plugins: ["@typescript-eslint/eslint-plugin"],
  extends: ["airbnb-base", "airbnb-typescript/base", "prettier"],
  root: true,
  env: {
    node: true,
  },
  ignorePatterns: ["*.js", "**/dist/", "packages/kubernetes-client-node/**"],
  rules: {
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "import/prefer-default-export": "off",
    "class-methods-use-this": "off",
    "no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
    "no-tabs": 0,
    "@typescript-eslint/indent": "off",
    indent: "off",
    "sort-imports": [
      "error",
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
      },
    ],
    "no-unused-vars": "error",
    "linebreak-style": ["off"],
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: ["**/*.test.ts", "**/*.e2e-spec.ts", "**/*.spec.ts", "**/*.d.ts"],
      },
    ],
    "max-classes-per-file": "off",
  },
};
