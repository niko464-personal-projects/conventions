# @niko464/eslint-config

Shared ESLint flat-config blocks for Niko464's TypeScript projects. Each export is an array of config objects. Spread the ones a project needs into its own `eslint.config.*`.

| Block    | For                              | What it turns on                                                                                                                                                                                           |
| -------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base`   | every TypeScript project         | `@niko464/no-comments`, and `linterOptions.noInlineConfig: true`, so no `eslint-disable` or inline rule comment has any effect                                                                             |
| `react`  | React projects                   | `@niko464/no-effect-hooks`: bans `useEffect`, `useLayoutEffect` and `useInsertionEffect` from `react`, however they are imported, and ref callbacks that return a cleanup                                  |
| `shadcn` | Tailwind v4 + shadcn/ui projects | [`@shadcn/lint`](https://github.com/shadcn-ui/lint) with all six rules as errors: `no-restyle`, `no-raw-colors`, `no-arbitrary-values`, `no-inline-styles`, `no-unknown-classes`, `require-static-classes` |

`@niko464/no-comments` reports every `//`, `/* */` and `/** */` comment except the tool directives: the shebang, `/// <reference`, `@ts-expect-error` and `prettier-ignore`. It has no autofix: what a comment says belongs in a name, a type, a test, `docs/` or an ADR, and only a person or an agent can move it there.

`@niko464/no-effect-hooks` leaves `useEffectEvent` and `useSyncExternalStore` allowed. Its error names the replacements: `useMountEffect`, `useEventListener` or `useInterval` from `@niko464/react-kit`, a `key`, deriving the value during render, or Motion for animation. A case none of these covers becomes a new hook in `@niko464/react-kit`, through a PR.

The same rule reports a ref callback that returns a cleanup, since React 19 runs that cleanup on detach, which makes the callback an effect. It checks a function passed to a JSX `ref` attribute: inline, or a name declared in the same file as a `function`, a `const` arrow or function expression, or a `useCallback` of one. It reports when one of the callback's own `return` statements returns an arrow, a function expression or a name bound to a function. A ref callback that returns nothing, such as one that focuses, measures or stores the node, stays allowed. A ref callback passed through props or imported from another file is not checked.

## Install

```bash
pnpm add -D @niko464/eslint-config eslint typescript-eslint
```

ESLint 9.30 or later is required, and `@typescript-eslint/parser` 8.40 or later (it comes with `typescript-eslint`).

## Use

```js
import { base, react, shadcn } from '@niko464/eslint-config';
import tseslint from 'typescript-eslint';

export default [...tseslint.configs.recommended, ...base, ...react, ...shadcn];
```

A project without React spreads only `base`. A project without Tailwind or shadcn/ui leaves out `shadcn`.

### In a monorepo

`defineConfig`'s `extends` scopes a block to part of the repo:

```js
import js from '@eslint/js';
import { base, react, shadcn } from '@niko464/eslint-config';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['dist/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['apps/api/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: ['@prisma/client'] }] },
  },
  base,
  { files: ['apps/web/**/*.{ts,tsx}'], extends: [react, shadcn] },
  { files: ['apps/web/components/ui/**'], rules: { 'shadcn/no-restyle': 'off' } },
);
```

- The bans have their own rule IDs, so a project's own `no-restricted-imports` or `no-restricted-syntax` sits next to them without replacing them.
- With inline config off, every exception lives in `eslint.config.*` as a `files`-scoped block, where review sees it.
