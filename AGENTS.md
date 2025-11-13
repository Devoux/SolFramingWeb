# Repository Guidelines

## Project Goals
- Browse a library of gold-leaf frame corner samples; selecting one opens the Virtual Framing page.
- In Virtual Framing, customers upload a painting and preview it wrapped by the selected corner design (start simple; iterate on fidelity).
- Corner samples are defined as JSON profiles (inches): width, height, and a top contour of lines and arcs.
- Customers provide painting dimensions; the image is cropped/straightened and used in the composition.
- Generate a dimensionally accurate SVG front view with nested rectangles (innermost = painting); draw lighter-gray rings where the contour changes direction (90° or line↔arc transitions).

## Project Structure & Module Organization
- `app/` – Next.js App Router pages and layout (e.g., `app/page.tsx`, `app/virtual-framing/page.tsx`, `app/profiles/[slug]/page.tsx`).
- `lib/` – Shared utilities (`lib/svgFrame.ts` for SVG generation, `lib/profiles.ts` for JSON loading/validation).
- `data/profiles/` – Profile JSON and `schema.json`. Add new profiles as `kebab-case.json` validated by Zod and the schema.
- Config: `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`. Global styles in `app/globals.css`.

## Build, Test, and Development Commands
- `npm run dev` – Start local dev server at `http://localhost:3000`.
- `npm run build` – Production build.
- `npm start` – Run the built app.
- `npm run lint` – ESLint check via `eslint-config-next`.

### Dev Notes (Virtual Framing)
- UI units toggle (in/mm) affects display only; base scale is inches.
- Front view uses white, gray, black only; event rectangles at contour changes; innermost/outermost emphasized.
- Profile preview scales 1:1 with front view and includes arc extrema; viewBoxes padded to avoid stroke clipping.

## Coding Style & Naming Conventions
- TypeScript with `strict: true`; prefer typed exports and explicit return types for libs.
- React function components; components (if added) in `components/` with PascalCase names (e.g., `FramePreview.tsx`).
- Utilities camelCase (e.g., `generateFrameSvg`); route segments and files in `app/` are lowercase/kebab-case.
- Keep modules focused; colocate small helpers near usage or in `lib/` if shared.
- Path alias `@/*` resolves to repo root (see `tsconfig.json`).

## Testing Guidelines
- No formal test suite yet. If adding tests, use Vitest + React Testing Library for units and Playwright for e2e.
- Suggested patterns: colocate as `*.test.ts`/`*.test.tsx` or under `tests/` mirroring source paths.

## Commit & Pull Request Guidelines
- Commits: imperative, present tense, concise subjects. Example: "Implement SVG frame generator and preview table".
- Group related changes; avoid mixed refactors + features.
- PRs: clear description, link issues, include before/after screenshots or clips for UI changes, and list test steps.
- Require `npm run lint` to pass; update README if adding commands or notable behavior.

## Security & Configuration Tips
- Remote images must be allowed in `next.config.js > images.remotePatterns`.
- Profile JSON must match `data/profiles/schema.json`; loader also validates via Zod in `lib/profiles.ts`.
- Do not commit secrets; no runtime env vars are required for local dev.

## Profiles & DXF Import
- All FrameSpec JSONs use inches (`units: "in"`). Default example: `data/profiles/Flat.json` (3.0 × 1.5 in).
- Import DXF via POST `/api/convert-dxf` (form-data: `file`, optional `name`, `id`, `rotate`). Reads `$INSUNITS`, supports LWPOLYLINE/LINE/ARC, and saves JSON to `data/profiles/`.

## Profile Orientation (FrameSpec)
- Author profiles so the painting face lies along the top edge of the contour preview. Conceptually, “up” in the preview equals “into the camera” for the front view.
- JSON coordinates: X measures face offset (used for nested rectangles), Y measures vertical depth; the preview rotates this contour so X appears upward.

## Agent-Specific Notes
- Keep changes minimal and within scope; prefer surgical diffs.
- Follow the structure above; avoid introducing new dependencies unless necessary and documented.
