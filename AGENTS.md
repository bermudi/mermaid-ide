# AGENTS.md

## Changes in this fork

Fork of `mermaid-js/mermaid-live-editor`, deployed as `mermaid-ide`.

- **Netlify deployment fixed:** upstream `netlify.toml` lacked `[build]` — added `command = "pnpm build"` / `publish = "docs"` so `netlify deploy --build` works locally and in CI. Without this, CLI builds failed with `vite: command not found` / `node_modules missing`.
- **Deployed site:** `mermaid-ide` — https://mermaid-ide.netlify.app — project ID `4caf4ccb-f0d1-4271-b04b-23dff44a23b9` (team `bermudi's team`). **Auto-deploys from GitHub:** Netlify builds `main` of `bermudi/mermaid-ide` on every push (repo-linked via Netlify GitHub App; deploy history carries commit hashes). Linking a repo to a site **cannot be done via API** — `updateSite` silently ignores the `repo` block; it requires the web UI + GitHub App consent. The `netlify` CLI's auth does cover API calls (`netlify api getSite --data '{"site_id":"..."}'`). `.netlify/state.json` is only for local CLI access; `.netlify` is gitignored.
- **`docs/` is build output:** `pnpm build` writes static site to `docs/` via `@sveltejs/adapter-static` (fallback `404.html` for SPA routing). Never edit `docs/` directly.
- **Promo / upsell removed:** `MERMAID_IS_ENABLED_MERMAID_CHART_LINKS` set to `'false'` in `netlify.toml` (disables Mermaid Chart banner + Save-diagram promos). Editor chooser modal (`src/routes/(app)/edit/+page.svelte` + `EditorChooserModal.svelte` + `domainMigration.ts:shouldShowEditorChooser()`) hard-disabled (`return false`) and unmounted — no more "Try the full Mermaid experience" on first visit.
- **Netlify badge removed:** `src/lib/components/Actions.svelte` "This site is powered by Netlify" block deleted + Netlify site settings `built_with_badge_enabled: false` and `hud_enabled: false` via API (previously injected floating "Powered by Netlify" badge and `/.netlify/scripts/hud`).

## Remotes & branches

- `origin` → `git@github.com:bermudi/mermaid-ide.git` — the fork, push here
- `upstream` → `https://github.com/mermaid-js/mermaid-live-editor.git` — read-only source of truth
- `main` — the only branch, local and on the fork (also the fork's default); carries this fork's changes; what Netlify deploys; tracks `origin/main`
- `upstream/develop` — read-only pointer to upstream's tip; moved only by `git fetch upstream`; no local mirror branch (a local `develop` would be a hand-cranked copy of it that can drift)
- Upstream `master` is a bot release mirror, not a stable branch (`release-pr.yml` does `git reset --hard develop`, no curation, no tags, promotion gaps run 1 day–5 weeks) — track `develop`; don't re-investigate

Sync with upstream:

```sh
git fetch upstream
git switch main && git merge upstream/develop
git push
```

To contribute a fix back upstream later: `git switch -c fix/whatever upstream/develop`.

(Clone is shallow. If history-sensitive git ops misbehave: `git fetch --unshallow upstream`.)

## Project

Mermaid Live Editor — edit, preview, and share Mermaid diagrams. SvelteKit SPA where the URL hash _is_ the share mechanism (deflated+base64 state). Viewer at `/view`, editor at `/edit`, embed at `/embed`.

## Stack

- SvelteKit 2 + Svelte 5 (runes) + Vite 8, `pnpm` (Node >=24.16), TypeScript
- `@sveltejs/adapter-static` — fully static, no server
- Tailwind CSS 4, bits-ui / shadcn-svelte, unplugin-icons, Monaco + CodeMirror editors
- mermaid 11.x + ELK / tidy-tree / ZenUML layouts

## Architecture

Static SPA: all state lives in `State` (code + mermaid config + view state) in `state.svelte.ts`. Single source (`inputState` → async `mermaid.parse` validation → `validatedState` → URL hash). Persistence via localStorage (`codeStore`, `persist.svelte.ts`, history timeline). Rendering wraps mermaid in `src/lib/util/mermaid.ts`; editors are Monaco (desktop) / CodeMirror (mobile) behind `Editor.svelte`.

External integrations (stable refs): `MERMAID_RENDERER_URL` (mermaid.ink), `MERMAID_KROKI_RENDERER_URL` (kroki.io), `MERMAID_ANALYTICS_URL` + `MERMAID_DOMAIN` (plausible), `MERMAID_IS_ENABLED_MERMAID_CHART_LINKS`. Env prefix `MERMAID_`, defaults in `.env`.

## Workflow

```sh
pnpm install          # first run, also runs svelte-kit sync
pnpm dev -- --open    # http://localhost:3000, full reload on HMR
pnpm build            # → docs/
pnpm check            # svelte-check
pnpm lint / lint:fix
pnpm test:unit        # vitest; single file: pnpm vitest run src/lib/util/serde.test.ts
pnpm test:e2e         # playwright, auto-starts dev server
git push             # push to main = Netlify auto-builds & deploys; add '[skip ci]' to the commit message to skip docs-only builds
netlify deploy --prod # manual fallback only; builds local working tree, no commit provenance
```

HMR is disabled (full reload by design). Copy `.env` to `.env.local` for overrides. The husky `DEPRECATED` warning printed on every commit is upstream noise (`.husky/pre-commit` shims die in husky v10); hooks still run fine.

## Conventions

- Tests colocated (`*.test.ts` next to source, jsdom); e2e in `tests/` using `TID` from `src/lib/constants.ts`
- ESLint enforces sorted keys (5+ keys) + typescript-eslint strict + unicorn in `src/`
- All `State` writes go through `state.svelte.ts` update functions (they handle persist + validation + URL sync). Don't write `inputState` directly.
- Sanitize external state: `sanitizeConfig` must stay on any URL-loaded config (XSS / prototype pollution guard)

## Constraints & Red Lines

- `trash` > `rm` for file deletions; no force-push / destructive infra without explicit confirm
- Secrets via env only — never read/echo keys into context; if leaked, rotate immediately
- Don't edit generated: `docs/`, `.svelte-kit/`, `static/embed.js`

## Quality Bar

`pnpm check` + `pnpm lint` + `pnpm test` clean before PR. Keep SPA routing fallback (`404.html`) intact if touching adapter/build config. See `CLAUDE.md` for deeper internals.
