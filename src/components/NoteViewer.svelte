<script>
  import { copyText, toast } from '../lib/store.svelte.js';

  let { item, onclose, onedit } = $props();

  async function handleCopy() {
    const ok = await copyText(item.content);
    toast(ok ? 'Copied to clipboard ✓' : 'Copy failed — try again');
  }

  const dateText = $derived(
    new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  );
</script>

<div class="fixed inset-0 z-40 flex flex-col bg-card" role="dialog" aria-modal="true" aria-label="Note">
  <!-- Top bar -->
  <div
    class="flex items-center gap-2 border-b border-line px-3 py-3"
    style="padding-top: calc(0.75rem + env(safe-area-inset-top));"
  >
    <button
      class="flex h-9 w-9 items-center justify-center rounded-xl text-ink-soft active:bg-paper"
      aria-label="Back"
      onclick={onclose}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
    <span
      class="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style="background: var(--color-cat-note-soft); color: var(--color-cat-note);"
    >
      Note
    </span>
    <span class="ml-auto text-[12px] text-ink-soft">{dateText}</span>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto px-5 py-5">
    <h2 class="mb-1 font-display text-2xl font-bold leading-tight">{item.title}</h2>
    {#if item.tags.length}
      <div class="mb-4 flex flex-wrap gap-1">
        {#each item.tags as tag}
          <span class="rounded-md bg-paper px-1.5 py-0.5 text-[11px] text-ink-soft">
            #{tag}
          </span>
        {/each}
      </div>
    {:else}
      <div class="mb-4"></div>
    {/if}
    <p class="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
      {item.content}
    </p>
  </div>

  <!-- Bottom actions -->
  <div
    class="flex gap-2 border-t border-line p-4"
    style="padding-bottom: calc(1rem + env(safe-area-inset-bottom));"
  >
    <button
      class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-3 text-[14px] font-semibold text-ink-soft active:bg-paper"
      onclick={onedit}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
      </svg>
      Edit
    </button>
    <button
      class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal py-3 text-[14px] font-semibold text-white active:opacity-90"
      onclick={handleCopy}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      Copy
    </button>
  </div>
</div>
