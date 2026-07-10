<script>
  import { tick } from 'svelte';
  import { vault, dayKey } from '../lib/store.svelte.js';
  import { CATEGORIES } from '../lib/categories.js';

  let { onclose } = $props();

  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const since = Date.now() - WEEK_MS;

  // ---- Computations for the last 7 days ----
  const createdByType = $derived.by(() => {
    const c = { image: 0, video: 0, link: 0, note: 0 };
    for (const i of vault.items) {
      if ((i.createdAt || 0) >= since) c[i.type] = (c[i.type] || 0) + 1;
    }
    return c;
  });
  const cardsCreated = $derived(
    Object.values(createdByType).reduce((a, b) => a + b, 0)
  );
  const foldersCreated = $derived(
    vault.folders.filter((f) => (f.createdAt || 0) >= since).length
  );

  const last7Keys = $derived.by(() => {
    const keys = [];
    for (let d = 6; d >= 0; d--) {
      keys.push(dayKey(new Date(Date.now() - d * 24 * 60 * 60 * 1000)));
    }
    return keys;
  });
  const copies = $derived(
    last7Keys.reduce((n, k) => n + (vault.stats.days[k]?.copies || 0), 0)
  );
  const edits = $derived(
    last7Keys.reduce((n, k) => n + (vault.stats.days[k]?.edits || 0), 0)
  );
  const activeDays = $derived(
    last7Keys.filter((k) => vault.stats.days[k]).length
  );
  const maxType = $derived(Math.max(1, ...Object.values(createdByType)));

  const rangeText = $derived.by(() => {
    const fmt = (d) =>
      d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    return `${fmt(new Date(since))} – ${fmt(new Date())}`;
  });

  const milestone = $derived.by(() => {
    const total = vault.items.length;
    if (cardsCreated === 0 && copies === 0)
      return 'A quiet week — your vault is waiting for new treasures.';
    if (activeDays >= 6) return `You used Kaban ${activeDays} out of 7 days. Certified vault keeper!`;
    if (copies >= 20) return `${copies} copies this week — your prompts are working hard!`;
    if (cardsCreated >= 10) return `${cardsCreated} new cards in one week. Builder mode!`;
    return `Your vault now holds ${total} card${total === 1 ? '' : 's'} — keep building!`;
  });

  // Animate the bars in after mount
  let animate = $state(false);
  $effect(() => {
    tick().then(() => setTimeout(() => (animate = true), 60));
  });

  const TYPE_ROWS = [
    { id: 'image', label: 'Image Prompts' },
    { id: 'video', label: 'Video Prompts' },
    { id: 'link', label: 'Stored Links' },
    { id: 'note', label: 'Notes' },
  ];

  function onBackdrop(e) {
    if (e.target === e.currentTarget) onclose();
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
  onclick={onBackdrop}
  role="presentation"
>
  <div
    class="pop-in flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-card sm:rounded-3xl"
    role="dialog"
    aria-modal="true"
    aria-label="Your Kaban week"
  >
    <!-- Teal header -->
    <div class="bg-teal px-5 pb-4 pt-5 text-white">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-widest text-white/70">
            Weekly Recap
          </p>
          <h2 class="font-display text-xl font-bold">Your Kaban Week</h2>
          <p class="mt-0.5 text-[12px] text-white/70">{rangeText}</p>
        </div>
        <button
          class="rounded-lg p-1.5 text-white/80 active:bg-white/10"
          aria-label="Close"
          onclick={onclose}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-5 py-4">
      <!-- Big stat tiles -->
      <div class="mb-4 grid grid-cols-3 gap-2">
        <div class="rounded-2xl border border-line bg-paper p-3 text-center">
          <p class="font-display text-2xl font-bold text-teal">{cardsCreated}</p>
          <p class="text-[11px] font-medium text-ink-soft">Cards created</p>
        </div>
        <div class="rounded-2xl border border-line bg-paper p-3 text-center">
          <p class="font-display text-2xl font-bold text-teal">{copies}</p>
          <p class="text-[11px] font-medium text-ink-soft">Copies made</p>
        </div>
        <div class="rounded-2xl border border-line bg-paper p-3 text-center">
          <p class="font-display text-2xl font-bold text-teal">{foldersCreated}</p>
          <p class="text-[11px] font-medium text-ink-soft">Folders created</p>
        </div>
      </div>

      <!-- Active days -->
      <p class="mb-1.5 text-[12px] font-semibold text-ink-soft">
        Active days — {activeDays} of 7
      </p>
      <div class="mb-4 flex gap-1.5">
        {#each last7Keys as k (k)}
          <span
            class="flex h-8 flex-1 items-center justify-center rounded-lg text-[10px] font-bold transition-colors duration-500
              {vault.stats.days[k] ? 'bg-teal text-white' : 'bg-paper text-ink-soft/50'}"
          >
            {new Date(k + 'T12:00:00').toLocaleDateString('en-PH', { weekday: 'narrow' })}
          </span>
        {/each}
      </div>

      <!-- Created by type with animated bars -->
      <p class="mb-1.5 text-[12px] font-semibold text-ink-soft">
        New cards by category
      </p>
      <div class="mb-4 flex flex-col gap-2">
        {#each TYPE_ROWS as row (row.id)}
          <div class="flex items-center gap-2">
            <span class="w-24 shrink-0 text-[11px] font-medium text-ink-soft">
              {row.label}
            </span>
            <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-paper">
              <div
                class="h-full rounded-full transition-all duration-700 ease-out"
                style="background: {CATEGORIES[row.id].color};
                  width: {animate ? (createdByType[row.id] / maxType) * 100 : 0}%;"
              ></div>
            </div>
            <span class="w-6 shrink-0 text-right text-[12px] font-bold">
              {createdByType[row.id]}
            </span>
          </div>
        {/each}
      </div>

      <!-- Edits + milestone -->
      <div class="mb-4 flex items-center gap-2 rounded-xl bg-paper px-3.5 py-2.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
          <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
        </svg>
        <p class="text-[12px] text-ink-soft">
          <span class="font-bold text-ink">{edits}</span> card edit{edits === 1 ? '' : 's'} this week
        </p>
      </div>

      <div class="rounded-2xl bg-teal-soft p-4 text-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--color-teal)" class="mx-auto mb-1.5">
          <path d="M12 3a6 6 0 0 0-2.4 11.5l-1.1 5.3a1 1 0 0 0 1 1.2h5a1 1 0 0 0 1-1.2l-1.1-5.3A6 6 0 0 0 12 3Zm0 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
        </svg>
        <p class="text-[13px] font-semibold text-ink">{milestone}</p>
      </div>
    </div>

    <div
      class="border-t border-line p-4"
      style="padding-bottom: calc(1rem + env(safe-area-inset-bottom));"
    >
      <button
        class="w-full rounded-xl bg-teal py-3 text-[14px] font-semibold text-white active:opacity-90"
        onclick={onclose}
      >
        Keep Building
      </button>
    </div>
  </div>
</div>
