# Changelog

All notable changes made while repairing, stabilizing, and productionizing this project.

## Summary

The project's core logic (Mongoose models, API routes, React components, hooks) was already largely sound. The blocking issues were:
1. A native dependency (`canvas`) that **silently failed to install** in this environment (and is a well-known source of install/build failures on Vercel and minimal Docker images used by Render), pulled in by an unused dependency (`face-api.js`).
2. A build-time network call to Google Fonts that fails in offline/restricted build environments.
3. A pinned Next.js version with a known security advisory.
4. Minor robustness gaps (Cloudinary misconfiguration wasn't validated up front) and repo hygiene issues (mixed CRLF/LF line endings, a stray Bolt.new scaffold folder, an unused Netlify config).

---

## Fixed

### `package.json`
- **Removed** `canvas` — failed to install in this environment (confirmed: `npm install` reported success but the package was silently absent from `node_modules`, causing `tsc`/build failures downstream). This is a widely-reported failure mode for `canvas` on Vercel serverless functions and on minimal/Alpine-based Docker images (missing Cairo/Pango system libraries at install time). *Why:* eliminate install/build reliability risk on both target platforms.
- **Removed** `face-api.js` — a dead dependency. It was never imported anywhere in the codebase; face "detection" was always a deterministic, procedurally generated mock (see `lib/imageProcessor.ts`). *Why:* removes another `canvas`-dependent package and reduces install size/attack surface for no functional loss.
- **Bumped** `next` and `eslint-config-next` from `14.2.3` → `14.2.35`. *Why:* `npm install` reported `next@14.2.3` has a published security vulnerability; `14.2.35` is the latest patched 14.2.x release, keeping the same major/minor for compatibility.
- **Bumped** `eslint` from pinned `8.49.0` → `^8.57.0`. *Why:* resolves an `ERESOLVE` peer-dependency conflict with `eslint-config-next@14.2.35` (which requires `eslint@^8.56.0`), removing install warnings.
- **Added** `engines.node: ">=18.18.0"`. *Why:* documents/enforces the supported Node range (project is verified against Node 20 LTS) so platforms and contributors get an explicit signal instead of silent incompatibility.

### `lib/imageProcessor.ts`
- **Replaced all `canvas` usage (`createCanvas`, `loadImage`, 2D context drawing/`getImageData`/`toBuffer`) with `sharp`**, which was already a project dependency but unused. *Why:* `sharp` ships prebuilt native binaries for every platform Vercel and Render use, so it installs and runs reliably with zero system-level build tools, unlike `canvas`.
  - `processImage()`: now resizes (`fit: 'inside'`, no upscaling), applies EXIF auto-rotation (`.rotate()`, an improvement over the old code which ignored orientation), and extracts a 4-channel (RGBA) raw pixel buffer via `.ensureAlpha().raw()` — preserving the exact `Uint8ClampedArray` / `(y*width+x)*4` pixel-indexing contract that `services/faceAnalysis.ts` (`determineSkinTone`, `determineSkinTexture`) depends on.
  - `extractFaceLandmarks()`: now reads image dimensions via `sharp(...).metadata()` instead of `canvas.loadImage()`. All downstream landmark-generation logic (which was already independent of real face detection) is unchanged.

### `lib/cloudinary.ts`
- **Added explicit environment-variable validation.** Uploads/deletes now check `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` are all present before calling the SDK, and `cloudinary.config()` is only invoked when configured. *Why:* previously, a missing env var would let `cloudinary.config()` run with `undefined` values and fail deep inside the SDK with an opaque error; now `uploadImage()` throws a clear, actionable message (`"Cloudinary is not configured..."`), which the API routes already catch and turn into a safe `500` JSON response — satisfying "fail gracefully with meaningful error messages instead of crashing."
- `deleteImage()` now short-circuits with a logged warning (returns `false`) instead of throwing when Cloudinary isn't configured, so bulk-delete flows in `/api/admin` and `/api/history` don't crash mid-loop.

### `app/layout.tsx`
- **Removed `next/font/google` (`Inter`)** and switched to Tailwind's default system font stack (`className="font-sans"`). *Why:* `next/font/google` fetches font CSS from `fonts.googleapis.com` **at build time**; in network-restricted CI/Docker build environments (common on Render and in sandboxed CI) this causes `next build` to fail outright with `NextFontError`. Removing the network dependency makes the build deterministic and offline-safe everywhere, at the cost of not self-hosting a custom webfont (can be re-added later via a locally-bundled font file if desired).

### `next.config.js`
- **Removed** the `canvas`-specific `webpack.externals` override and `experimental.serverComponentsExternalPackages: ['canvas']` (no longer needed — `canvas` is fully removed).
- **Added** `experimental.serverComponentsExternalPackages: ['sharp']` for explicit, robust handling of `sharp`'s native binary across server bundles.

### Repository hygiene
- **Removed `face-analysis-project.zip`** — a stray nested archive accidentally committed inside the project root (not referenced anywhere, bloated the repo).
- **Removed `.bolt/`** — leftover scaffold metadata from the original Bolt.new template generator; not used by the app.
- **Removed `netlify.toml`** — an unused, irrelevant deployment config for a platform not in scope; kept the project's actual deployment targets (Vercel, Render) unambiguous.
- **Added `render.yaml`** — a ready-to-use Render Blueprint (Node runtime, `npm ci && npm run build` / `npm start`, all required env vars declared as `sync: false` placeholders) so Render deploys work without manual dashboard configuration.
- **Normalized all source files (`.ts`, `.tsx`, `.js`, `.json`, `.css`, `.md`) from CRLF to LF line endings.** *Why:* the original project had inconsistent line endings, which can cause noisy diffs, some tooling/linter quirks, and cross-platform Git issues. All files were verified to still type-check and build correctly after normalization.

### `.env.example` (new)
- Added a complete, documented example env file covering every variable the app reads (`MONGODB_URI`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ADMIN_SECRET`), with inline guidance on where to get each value.

### `README.md`
- Rewritten to cover installation, environment variables, local development, MongoDB setup (Atlas + local), Cloudinary setup, production build/run, Vercel deployment, Render deployment, the admin dashboard, project structure, an explicit explanation of why `canvas`/`face-api.js` were removed, and a troubleshooting section covering the failure modes above.

---

## Verified

- `npm install` — completes cleanly, no `ERESOLVE` warnings, no silently-failed native packages.
- `npx tsc --noEmit` — 0 errors.
- `npm run build` — succeeds; all 12 routes compile and prerender/build correctly (5 API route handlers as dynamic, all pages as static except API routes).
- `npm start` — server starts, `GET /` returns `200`.
- `npm run dev` — starts cleanly; `GET /` returns `200`; hitting an API route (`/api/history`) without a reachable MongoDB returns a graceful `500` JSON error with a server-side logged stack trace, not a crash.
- `npx next lint` — 0 errors (6 pre-existing `no-img-element` warnings remain; these are intentional, since Cloudinary images are already served via `next.config.js`'s `images.unoptimized: true`, and are documented as acceptable in the README).

## Not changed (by design)

- The face "detection"/analysis pipeline remains a deterministic, geometry-based simulation (not a real ML face-detection model) — this was true in the original code (`face-api.js` was never invoked) and is preserved as-is, since replacing it with a real model was out of scope and would reintroduce native-binary or paid-API dependencies. This is now explicitly documented in the README so it isn't mistaken for a regression.
- Business logic in `services/faceAnalysis.ts` (symmetry/golden-ratio/proportion scoring, face-shape/feature classification, comparison scoring) is untouched.
- Database schema (`database/models/Analysis.ts`) and API route contracts (request/response shapes) are untouched, so no client-code changes were required.
