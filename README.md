# Face Analysis AI

A production-ready, AI-styled facial analysis and comparison web app built with **Next.js 14 (App Router)**, **MongoDB (Mongoose)**, and **Cloudinary**.

It lets users:
- Upload a single photo for facial analysis (face shape, symmetry, golden ratio, proportions, skin tone/texture, grooming suggestions, etc.)
- Upload two photos to compare facial features and get a similarity score
- Browse their analysis history (by session)
- View aggregate stats on an admin dashboard

> **Note on analysis accuracy:** facial landmarks are generated with a deterministic, geometry-based algorithm rather than a heavyweight ML face-detection model, so the app has zero native-binary build dependencies and deploys reliably everywhere (see "Why no `canvas` / `face-api.js`" below). Treat scores as illustrative, not clinical or biometric-grade.

---

## Table of Contents
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [MongoDB Setup](#mongodb-setup)
- [Cloudinary Setup](#cloudinary-setup)
- [Building & Running for Production](#building--running-for-production)
- [Deploying to Vercel](#deploying-to-vercel)
- [Deploying to Render](#deploying-to-render)
- [Admin Dashboard](#admin-dashboard)
- [Project Structure](#project-structure)
- [Why no `canvas` / `face-api.js`](#why-no-canvas--face-apijs)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, Route Handlers)
- **Language:** TypeScript (strict mode)
- **Database:** MongoDB via Mongoose
- **Image storage:** Cloudinary
- **Image processing:** `sharp` (native, prebuilt binaries — no build-tool dependency)
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives) + Framer Motion + Recharts

---

## Installation

Requires **Node.js 20 LTS** (or 18.18+) and npm.

```bash
npm install
```

## Environment Variables

Copy the example file and fill in real values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `ADMIN_SECRET` | Recommended | Bearer token required to access `/admin` and `/api/admin`. Defaults to `admin-secret-key` if unset — **always set this in production.** |

If `MONGODB_URI` or the Cloudinary variables are missing, the affected API routes will return a clear `500` JSON error (e.g. `"Cloudinary is not configured..."`) instead of crashing the server or leaking a raw stack trace.

## Local Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

Other useful scripts:

```bash
npm run build       # production build
npm start           # run the production build
npm run lint        # ESLint (next lint)
npm run typecheck   # TypeScript type-check with no emit
```

## MongoDB Setup

**Option A — MongoDB Atlas (recommended, free tier available)**
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow network access (either your IP, or `0.0.0.0/0` for platforms with dynamic egress IPs like Vercel/Render).
3. Copy the connection string, e.g.:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/face-analysis?retryWrites=true&w=majority`
4. Set it as `MONGODB_URI`.

**Option B — Local MongoDB**
```bash
# macOS
brew install mongodb-community && brew services start mongodb-community
# Docker
docker run -d -p 27017:27017 --name mongo mongo:7
```
Then use `MONGODB_URI=mongodb://localhost:27017/face-analysis`.

The app caches the Mongoose connection across hot-reloads/serverless invocations (`database/index.ts`), so it's safe for both `next dev` and serverless deployment.

## Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From your Dashboard, copy **Cloud name**, **API Key**, and **API Secret**.
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

No manual bucket/folder setup is required — the app uploads into `face-analysis/` and `face-compare/` folders automatically, and deletes images from Cloudinary when an analysis is deleted (single or bulk).

## Building & Running for Production

```bash
npm install
npm run build
npm start
```

`npm run build` performs a full production build, including a TypeScript type-check. The `next.config.js` disables ESLint failures during `next build` (`eslint.ignoreDuringBuilds: true`) so that lint *warnings* never block a deploy; run `npm run lint` separately in CI if you want lint enforcement.

## Deploying to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket and import it in the [Vercel dashboard](https://vercel.com/new), or run `vercel` from the CLI.
2. Vercel auto-detects Next.js — no custom build/start command needed.
3. Add the environment variables from `.env.example` in **Project Settings → Environment Variables** (for Production, Preview, and Development as needed).
4. Deploy. `sharp` and all other dependencies ship with Vercel-compatible prebuilt binaries, so no extra configuration is required.

## Deploying to Render

A ready-to-use `render.yaml` is included (Render "Blueprint"):

1. Push this repo to a Git provider.
2. In Render, choose **New → Blueprint** and point it at the repo (or create a **Web Service** manually with the settings below).
3. Manual settings, if not using the blueprint:
   - **Runtime:** Node
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`
   - **Node version:** 20.x (set `NODE_VERSION=20.18.0` in env vars, or add a `.node-version` file)
4. Add the environment variables from `.env.example` in the Render dashboard.
5. Deploy. Render runs a standard Node server (`next start`), which fully supports the App Router, Route Handlers, and native binaries like `sharp`.

## Admin Dashboard

Visit `/admin` and log in with the value of `ADMIN_SECRET` (default `admin-secret-key` if unset — **change this in production**). The dashboard shows totals, daily upload trends, face-shape distribution, and lets you delete individual analyses or wipe all data (which also deletes the associated Cloudinary images).

## Project Structure

```
app/
  api/            # Route Handlers: analyze, compare, upload, history, admin
  admin/          # Admin dashboard page
  history/        # Analysis history page
  result/         # Result detail page
  page.tsx        # Home page (upload + analyze/compare UI)
components/
  face-analysis/  # Upload, analysis card, comparison card, etc.
  layout/         # Header, theme provider
  ui/             # shadcn/ui primitives
database/
  index.ts        # Cached Mongoose connection
  models/         # Analysis model
lib/
  cloudinary.ts   # Upload/delete helpers, env validation
  imageProcessor.ts # sharp-based resize + pixel sampling + landmark generation
services/
  faceAnalysis.ts # Geometry-based analysis & comparison scoring
```

## Why no `canvas` / `face-api.js`

The original project depended on the native `canvas` package (via `face-api.js`, which was never actually invoked anywhere in the codebase — real face detection was always mocked with procedurally generated landmarks). `canvas` requires system-level build tools (Cairo/Pango) and frequently **fails to install silently** or breaks builds on serverless platforms like Vercel and on minimal Docker/CI images used by Render.

Both packages have been removed. All image resizing, EXIF-orientation handling, and pixel sampling now use **`sharp`**, which ships prebuilt native binaries for all platforms Vercel and Render use, installs reliably, and is already a project dependency. Functionality (resize, format conversion, raw RGBA pixel access for skin-tone/texture sampling) is unchanged.

## Troubleshooting

**`npm install` fails / native build errors**
Make sure you're on Node 20 LTS. This project no longer depends on any package that requires native compilation at install time (`sharp` uses prebuilt binaries).

**API routes return `500` errors**
Check the server logs — every route logs the underlying error server-side (`console.error`) while returning a safe, generic JSON error to the client. The most common causes are a missing/incorrect `MONGODB_URI` or missing Cloudinary credentials; see [Environment Variables](#environment-variables).

**`MongooseServerSelectionError` / connection refused**
Your `MONGODB_URI` is unreachable — check the connection string, that your IP/network is allow-listed in Atlas, and that the database user's credentials are correct.

**Cloudinary uploads fail**
Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are all set and correct. The app will return `"Cloudinary is not configured..."` if any are missing.

**"No face detected" / "Multiple faces detected" always/never triggers**
Face presence is simulated (see [above](#why-no-canvas--face-apijs)); `extractFaceLandmarks` always reports exactly one face per valid image. If you need real ML-based face detection/counting, swap in a hosted API (e.g. a cloud Vision API) inside `lib/imageProcessor.ts` — the rest of the pipeline (scoring, comparison, storage) will work unchanged.

**Hydration warnings in the browser console**
The session ID (`hooks/use-face-analysis.ts`) is generated in a `useEffect` and stored in `localStorage`, so it's never rendered during SSR — this avoids server/client mismatches. If you introduce new client-only state, follow the same pattern (initialize in `useEffect`, not during render).

**Build fails trying to fetch fonts**
Fixed — the app now uses Tailwind's default system font stack instead of `next/font/google`, so builds no longer require network access to Google Fonts (important for restricted/offline CI environments).

**Images not displaying / broken image icons**
Confirm the Cloudinary upload succeeded (check the Cloudinary Media Library) and that `next.config.js` still allows `res.cloudinary.com` under `images.remotePatterns`.
