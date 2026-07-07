# Kaban 🔐 — Prompt Vault

Your personal vault for AI prompts, links, and notes. Built by **GNOKZ Production**.

Live: `https://reymprime.github.io/kaban/`

## Features

- **Four categories** — Image Prompts, Video Prompts, Stored Links, Notes (color-coded)
- **One-tap copy** — copy any prompt or link straight to clipboard
- **Stored Links** — save TikTok / YouTube / Facebook / Instagram / X links with auto platform detection, then tap **Open** to jump straight to the video
- **Search** — instant search across titles, content, and tags
- **Tags** — label prompts like `cinematic`, `suno`, `flow`
- **Pin** — keep go-to items at the top
- **Edit / rename / delete** — full control, with delete confirmation
- **Backup & Restore** — export everything as JSON, restore merges safely (nothing gets wiped)
- **Offline-first PWA** — IndexedDB storage, installable, works without internet

## Stack

Svelte 5 (runes) · Vite 6 · Tailwind CSS v4 · IndexedDB · GitHub Actions → GitHub Pages

## Deploy (Spck workflow)

1. Create a GitHub repo named **`kaban`** (must match `base` in `vite.config.js`)
2. Push all files to the `main` branch
3. Repo **Settings → Pages → Source: GitHub Actions**
4. The workflow builds and deploys automatically on every push

> Renaming the repo? Update `base: '/kaban/'` in `vite.config.js` to match.

## Local dev

```bash
npm install
npm run dev
```
