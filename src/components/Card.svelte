<script>
  import { CATEGORIES } from '../lib/categories.js';
  import { detectPlatform, normalizeUrl } from '../lib/platform.js';
  import { copyText, togglePin, toggleLock, toast } from '../lib/store.svelte.js';
  import { htmlToText } from '../lib/richtext.js';

  let {
    item,
    selecting = false,
    isSelected = false,
    onedit,
    ondelete,
    onview,
    onselectstart,
    ontoggleselect,
  } = $props();

  // Long-press detection (500ms) to enter selection mode
  let pressTimer = null;
  function pressStart() {
    if (selecting) return;
    pressTimer = setTimeout(() => onselectstart?.(), 500);
  }
  function pressCancel() {
    clearTimeout(pressTimer);
  }

  const cat = $derived(CATEGORIES[item.type]);
  const platform = $derived(item.type === 'link' ? detectPlatform(item.content) : null);
  const locked = $derived(!!item.locked);
  // Links lose copy access when locked; prompts and notes keep copy
  const copyBlocked = $derived(locked && item.type === 'link');
  // Rich notes are stored as HTML — preview and copy use plain text
  const noteText = $derived(item.type === 'note' ? htmlToText(item.content) : '');

  // Lock icon animation — re-keyed to replay CSS animation each press
  let anim = $state({ n: 0, type: '' });

  async function handleCopy() {
    if (copyBlocked) return denied();
    const ok = await copyText(item.type === 'note' ? noteText : item.content);
    toast(ok ? 'Copied to clipboard ✓' : 'Copy failed — try again');
  }

  async function handlePin() {
    const nowPinned = !item.pinned;
    await togglePin(item);
    toast(nowPinned ? 'Pinned to top' : 'Unpinned');
  }

  async function handleLock() {
    const nowLocked = !item.locked;
    await toggleLock(item);
    anim = { n: anim.n + 1, type: 'lock-pop' };
    toast(nowLocked ? 'Locked — protected from changes' : 'Unlocked');
  }

  function denied() {
    anim = { n: anim.n + 1, type: 'lock-shake' };
    toast('Locked — unlock first to get access');
  }
</script>

<li
  class="relative overflow-hidden rounded-2xl border bg-card transition-shadow
    {isSelected ? 'border-teal shadow-[0_0_0_2px_var(--color-teal)]' : locked ? 'border-ink/15' : 'border-line'}"
  style="border-left: 4px solid {isSelected ? 'var(--color-teal)' : cat.color};"
  onpointerdown={pressStart}
  onpointerup={pressCancel}
  onpointermove={pressCancel}
  onpointerleave={pressCancel}
  oncontextmenu={(e) => e.preventDefault()}
>
  {#if selecting}
    <!-- Selection overlay: tap anywhere to toggle -->
    <button
      class="absolute inset-0 z-10"
      aria-label={isSelected ? 'Deselect card' : 'Select card'}
      onclick={ontoggleselect}
    ></button>
    <span
      class="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2
        {isSelected ? 'border-teal bg-teal text-white' : 'border-line bg-card text-transparent'}"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="m5 13 4 4L19 7" />
      </svg>
    </span>
  {/if}
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-teal)" aria-label="Pinned">
              <path d="M14.6 2.2a1.5 1.5 0 0 0-2.4.4L9.9 7.1l-4.6 1a1.5 1.5 0 0 0-.74 2.53l3.4 3.4-5 6.1a.75.75 0 0 0 1.06 1.05l6.1-5 3.4 3.4a1.5 1.5 0 0 0 2.52-.74l1-4.6 4.5-2.3a1.5 1.5 0 0 0 .4-2.4l-7.3-7.3Z" />
            </svg>
          {/if}
        </div>
        <h3 class="truncate font-display text-[15px] font-semibold leading-snug">
          {item.title}
        </h3>
        {#if item.description}
          <p class="clamp-2 mt-0.5 text-[12px] italic text-ink-soft/90">
            {item.description}
          </p>
        {/if}
      </div>

      <div class="flex shrink-0 items-center">
        <!-- Lock toggle -->
        <button
          class="rounded-lg p-1.5 transition-colors active:bg-line {locked ? 'text-teal' : 'text-ink-soft/60'}"
          aria-label={locked ? 'Unlock' : 'Lock'}
          onclick={handleLock}
        >
          {#key anim.n}
            <span class="block {anim.type}">
              {#if locked}
                <!-- Closed padlock -->
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="4" y="11" width="16" height="10" rx="2.5" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  <circle cx="12" cy="16" r="1.3" fill="currentColor" stroke="none" />
                </svg>
              {:else}
                <!-- Open padlock -->
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="4" y="11" width="16" height="10" rx="2.5" />
                  <path d="M8 11V7a4 4 0 0 1 7.6-1.8" />
                </svg>
              {/if}
            </span>
          {/key}
        </button>
        <!-- Pin toggle -->
        <button
          class="rounded-lg p-1.5 transition-colors active:bg-line {item.pinned ? 'text-teal' : 'text-ink-soft/60'}"
          aria-label={item.pinned ? 'Unpin' : 'Pin to top'}
          onclick={handlePin}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={item.pinned ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 17v5M9 3h6l1 7 3 3H5l3-3 1-7Z" />
          </svg>
        </button>
      </div>
    </div>

    {#if item.type === 'link'}
      <p class="truncate text-[13px] text-ink-soft">{platform.host || item.content}</p>
    {:else if item.type === 'note'}
      <button class="block w-full text-left" onclick={onview} aria-label="Open note full screen">
        <p class="clamp-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
          {noteText}
        </p>
        <span class="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-cat-note">
          Read full note
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </span>
      </button>
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

    <!-- Copy -->
    <button
      class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold transition-colors active:bg-paper
        {copyBlocked ? 'text-ink-soft/40' : 'text-teal'}"
      onclick={handleCopy}
    >
      {#if copyBlocked}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2.5" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      {/if}
      Copy
    </button>
    <div class="h-6 w-px bg-line"></div>

    <!-- Edit -->
    <button
      class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium transition-colors active:bg-paper
        {locked ? 'text-ink-soft/40' : 'text-ink-soft'}"
      onclick={locked ? denied : onedit}
    >
      {#if locked}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2.5" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
        </svg>
      {/if}
      Edit
    </button>
    <div class="h-6 w-px bg-line"></div>

    <!-- Delete -->
    <button
      class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium transition-colors active:bg-paper
        {locked ? 'text-ink-soft/40' : 'text-ink-soft'}"
      onclick={locked ? denied : ondelete}
    >
      {#if locked}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2.5" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
      {/if}
      Delete
    </button>
  </div>
</li>
