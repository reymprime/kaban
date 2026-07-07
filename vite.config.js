import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

// IMPORTANT: base must match your GitHub repo name.
// Repo "kaban" -> https://reymprime.github.io/kaban/
export default defineConfig({
  base: '/kaban/',
  plugins: [svelte(), tailwindcss()],
});
