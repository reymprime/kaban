<script>
  import { copyText, saveItem, toast } from '../lib/store.svelte.js';

  let { item, onclose } = $props();

  let mode = $state('read'); // 'read' | 'edit'
  let focusMode = $state(false); // full-screen textarea only (no title/desc/tags)

  // Local copy so the viewer always shows fresh data after saving
  let current = $state({ ...item, tags: [...item.tags] });

  // Edit fields
  let title = $state('');
  let description = $state('');
  let content = $state('');
  let tagsText = $state('');
  let saving = $state(false);

  function startEdit() {
    if (current.locked) {
      toast('Locked — unlock the card first to edit');
      return;
    }
    title = current.title;
    description = current.description || '';
    content = current.content;
    tagsText = current.tags.join(', ');
    mode = 'edit';
  }

  function cancelEdit() {
    mode = 'read';
  }

  async function save() {
    if (!content.trim()) {
      toast('Note cannot be empty');
      return;
    }
    saving = true;
    const tags = tagsText
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    const saved = await saveItem({
      id: current.id,
      type: current.type,
      title,
      description,
      content,
      tags,
    });
    current = { ...saved, tags: [...saved.tags] };
    saving = false;
    focusMode = false;
    mode = 'read';
    toast('Changes saved ✓');
  }

  async function handleCopy() {
    const ok = await copyText(current.content);
    toast(ok ? 'Copied to clipboard ✓' : 'Copy failed — try again');
  }

  const dateText = $derived(
    new Date(current.updatedAt || current.createdAt).toLocaleDateString('en-PH', {
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

    <!-- Mode toggle -->
    <div class="flex rounded-xl border border-line p-0.5">
      <button
        class="rounded-[10px] px-3 py-1 text-[12px] font-semibold transition-colors
          {mode === 'read' ? 'bg-ink text-white' : 'text-ink-soft'}"
        onclick={cancelEdit}
      >
        Read Mode
      </button>
      <button
        class="rounded-[10px] px-3 py-1 text-[12px] font-semibold transition-colors
          {mode === 'edit' ? 'bg-ink text-white' : 'text-ink-soft'}"
        onclick={startEdit}
      >
        Edit Mode
      </button>
    </div>

    <span class="ml-auto flex items-center gap-1.5 text-[12px] text-ink-soft">
      {#if current.locked}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Locked">
          <rect x="4" y="11" width="16" height="10" rx="2.5" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      {/if}
      {dateText}
    </span>
  </div>

  {#if mode === 'read'}
    <!-- READ MODE -->
    <div class="flex-1 overflow-y-auto px-5 py-5">
      <h2 class="mb-1 font-display text-2xl font-bold leading-tight">
        {current.title}
      </h2>
      {#if current.description}
        <p class="mb-2 text-[13px] italic text-ink-soft">{current.description}</p>
      {/if}
      {#if current.tags.length}
        <div class="mb-4 flex flex-wrap gap-1">
          {#each current.tags as tag}
            <span class="rounded-md bg-paper px-1.5 py-0.5 text-[11px] text-ink-soft">
              #{tag}
            </span>
          {/each}
        </div>
      {:else}
        <div class="mb-4"></div>
      {/if}
      <p class="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
        {current.content}
      </p>
    </div>

    <div
      class="flex gap-2 border-t border-line p-4"
      style="padding-bottom: calc(1rem + env(safe-area-inset-bottom));"
    >
      <button
        class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line py-3 text-[14px] font-semibold text-ink-soft active:bg-paper"
        onclick={startEdit}
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
  {:else}
    <!-- EDIT MODE -->
    <div class="flex flex-1 flex-col overflow-y-auto px-5 py-4">
      <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="nv-title">
        Title
      </label>
      <input
        id="nv-title"
        type="text"
        bind:value={title}
        class="mb-3 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 font-display text-[16px] font-semibold focus:border-teal focus:outline-none"
      />

      <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="nv-desc">
        Description <span class="font-normal">(optional)</span>
      </label>
      <input
        id="nv-desc"
        type="text"
        bind:value={description}
        placeholder="Purpose of this note"
        class="mb-3 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] focus:border-teal focus:outline-none"
      />

      <div class="mb-1 flex items-center justify-between">
        <label class="block text-[12px] font-semibold text-ink-soft" for="nv-content">
          Note
        </label>
        <button
          class="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-teal active:bg-paper"
          aria-label="Focus mode — full screen writing"
          onclick={() => (focusMode = true)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          Focus
        </button>
      </div>
      <textarea
        id="nv-content"
        bind:value={content}
        class="mb-3 min-h-[40dvh] w-full flex-1 resize-none rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[15px] leading-relaxed focus:border-teal focus:outline-none"
      ></textarea>

      <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="nv-tags">
        Tags <span class="font-normal">(comma separated, optional)</span>
      </label>
      <input
        id="nv-tags"
        type="text"
        bind:value={tagsText}
        placeholder="ideas, lyrics, todo"
        class="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] focus:border-teal focus:outline-none"
      />
    </div>

    <div
      class="flex gap-2 border-t border-line p-4"
      style="padding-bottom: calc(1rem + env(safe-area-inset-bottom));"
    >
      <button
        class="flex-1 rounded-xl border border-line py-3 text-[14px] font-semibold text-ink-soft active:bg-paper"
        onclick={cancelEdit}
      >
        Cancel
      </button>
      <button
        class="flex-1 rounded-xl bg-teal py-3 text-[14px] font-semibold text-white active:opacity-90 disabled:opacity-50"
        disabled={saving}
        onclick={save}
      >
        Save changes
      </button>
    </div>
  {/if}

  {#if focusMode}
    <!-- FOCUS MODE: pure full-screen writing, walang title/description/tags -->
    <div class="absolute inset-0 z-10 flex flex-col bg-card">
      <div
        class="flex items-center justify-between border-b border-line px-3 py-2"
        style="padding-top: calc(0.5rem + env(safe-area-inset-top));"
      >
        <button
          class="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-ink-soft active:bg-paper"
          aria-label="Exit focus mode"
          onclick={() => (focusMode = false)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
          </svg>
          Exit focus
        </button>
        <button
          class="rounded-xl bg-teal px-4 py-1.5 text-[12px] font-semibold text-white active:opacity-90 disabled:opacity-50"
          disabled={saving}
          onclick={save}
        >
          Save
        </button>
      </div>
      <textarea
        bind:value={content}
        placeholder="Just write…"
        class="w-full flex-1 resize-none bg-card px-5 py-4 text-[16px] leading-relaxed focus:outline-none"
        style="padding-bottom: calc(1rem + env(safe-area-inset-bottom));"
      ></textarea>
    </div>
  {/if}
</div>
