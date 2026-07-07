<script>
  import { CATEGORIES } from '../lib/categories.js';
  import { detectPlatform, normalizeUrl } from '../lib/platform.js';
  import { copyText, togglePin, toast } from '../lib/store.svelte.js';

  let { item, onedit, ondelete } = $props();

  const cat = $derived(CATEGORIES[item.type]);
  const platform = $derived(item.type === 'link' ? detectPlatform(item.content) : null);

  async function handleCopy() {
    const ok = await copyText(item.content);
    toast(ok ? 'Copied to clipboard ✓' : 'Copy failed — try again');
  }

  async function handlePin() {
    const nowPinned = !item.pinned;
    await togglePin(item);
    toast(nowPinned ? 'Pinned to top 📌' : 'Unpinned');
  }
</script>

<li
  class="relative overflow-hidden rounded-2xl border border-line bg-card"
  style="border-left: 4px solid {cat.color};"
>
  <div class="p-4 pb-3">
    <div class="mb-1.5 flex items-start justify-between gap-2">
      <div class="min-w-0">
        <div class="mb-1 flex flex-wrap items-center gap-1.5">
          <span
            class="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style="background: {cat.soft}; color: {cat.color};"
          >
            {cat.label}
          </span>
          {#if platform}
            <span
              class="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white"
              style="background: {platform.color};"
            >
              {platform.name}
            </span>
          {/if}
          {#if item.pinned}
            <span class="text-[11px]" aria-label="Pinned">📌</span>
          {/if}
        </div>
        <h3 class="truncate font-display text-[15px] font-semibold leading-snug">
          {item.title}
        </h3>
      </div>

      <!-- Pin toggle -->
      <button
        class="shrink-0 rounded-lg p-1.5 text-ink-soft transition-colors active:bg-line"
        aria-label={item.pinned ? 'Unpin' : 'Pin to top'}
        onclick={handlePin}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={item.pinned ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 17v5M9 3h6l1 7 3 3H5l3-3 1-7Z" />
        </svg>
      </button>
    </div>

    {#if item.type === 'link'}
      <p class="truncate text-[13px] text-ink-soft">{platform.host || item.content}</p>
    {:else if item.type === 'note'}
      <p class="clamp-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
        {item.content}
      </p>
    {:else}
      <p class="clamp-3 rounded-lg bg-paper p-2.5 font-mono text-[12px] leading-relaxed text-ink-soft">
        {item.content}
      </p>
    {/if}

    {#if item.tags.length}
      <div class="mt-2 flex flex-wrap gap-1">
        {#each item.tags as tag}
          <span class="rounded-md bg-paper px-1.5 py-0.5 text-[11px] text-ink-soft">
            #{tag}
          </span>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Action row -->
  <div class="flex items-center border-t border-line">
    {#if item.type === 'link'}
      <a
        class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-cat-link transition-colors active:bg-paper"
        href={normalizeUrl(item.content)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
        </svg>
        Open
      </a>
      <div class="h-6 w-px bg-line"></div>
    {/if}
    <button
      class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-teal transition-colors active:bg-paper"
      onclick={handleCopy}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      Copy
    </button>
    <div class="h-6 w-px bg-line"></div>
    <button
      class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium text-ink-soft transition-colors active:bg-paper"
      onclick={onedit}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
      </svg>
      Edit
    </button>
    <div class="h-6 w-px bg-line"></div>
    <button
      class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium text-ink-soft transition-colors active:bg-paper"
      onclick={ondelete}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      </svg>
      Delete
    </button>
  </div>
</li>
