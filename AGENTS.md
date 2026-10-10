<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Rules for agents:
- Use yarn instead of npm
- Do not add extra text or explanations to the UI, keep it simple
- Text on CTA buttons (e.g. "okay", "continue") should always start lowercase
- Use common components if they already exist, e.g. Button
- Frontend verification (run from `frontend/`): `yarn lint`, `yarn tsc --noEmit --incremental false`, and `yarn build`.
  If generated route types reference removed pages, run `yarn next typegen`
  (or `yarn build`) to regenerate them before repeating the typecheck.
