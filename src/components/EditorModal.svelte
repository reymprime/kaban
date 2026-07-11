<script>
  import { lockScroll } from '../lib/scrollLock.js';
  import { CATEGORIES } from '../lib/categories.js';
  import { vault, saveItem, toast } from '../lib/store.svelte.js';

  let { item, onclose, onsaved } = $props();

  const isNew = !item.id;
  let type = $state(item.type || 'image');
  let title = $state(item.title || '');
  let description = $state(item.description || '');
  let content = $state(item.content || '');
  let tagsText = $state((item.tags || []).join(', '));
  let folderId = $state(item.folderId || '');
  let saving = $state(false);

  const isLink = $derived(type === 'link');
  const folderOptions = $derived(
    vault.folders
      .filter((f) => f.category === type || f.category === 'all')
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  async function save() {
    const isNote = type === 'note';
    if (!isNote && !content.trim()) {
      toast(isLink ? 'Paste a link first' : 'Content cannot be empty');
      return;
    }
    saving = true;
    const tags = tagsText
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    const validFolder =
      folderId && folderOptions.some((f) => f.id === folderId) ? folderId : null;
    const saved = await saveItem({
      id: item.id,
      type,
      title,
      description,
      // Notes are written in the full-screen editor; keep existing content here
      content: isNote ? undefined : content,
      tags,
      folderId: validFolder,
    });
    saving = false;
    toast(isNew ? 'Saved to your kaban ✓' : 'Changes saved ✓');
    onsaved?.(saved, isNew);
    onclose();
  }

  function onBackdrop(e) {
    if (e.target === e.currentTarget) onclose();
  }
</script>

<div
  class="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 sm:items-center"
  use:lockScroll
  onclick={onBackdrop}
  role="presentation"
>
  <div
    class="pop-in flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-card sm:rounded-3xl"
    role="dialog"
    aria-modal="true"
    aria-label={isNew ? 'Add item' : 'Edit item'}
  >
    <div class="flex items-center justify-between px-5 pb-2 pt-5">
      <h2 class="font-display text-lg font-bold">
        {isNew ? 'Add to kaban' : 'Edit item'}
      </h2>
      <button
        class="rounded-lg p-1.5 text-ink-soft active:bg-line"
        aria-label="Close"
        onclick={onclose}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto px-5 pb-2">
      <!-- Type chips (create only — card type is permanent) -->
      {#if isNew}
        <div class="mb-4 grid grid-cols-2 gap-2">
          {#each Object.entries(CATEGORIES) as [key, cat] (key)}
            <button
              class="rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-colors"
              style={type === key
                ? `border-color: ${cat.color}; background: ${cat.soft}; color: ${cat.color};`
                : 'border-color: var(--color-line); color: var(--color-ink-soft);'}
              onclick={() => (type = key)}
            >
              {cat.label}
            </button>
          {/each}
        </div>
      {:else}
        <div class="mb-4 flex items-center gap-2.5 rounded-xl bg-paper px-3.5 py-2.5">
          <span
            class="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style="background: {CATEGORIES[type].soft}; color: {CATEGORIES[type].color};"
          >
            {CATEGORIES[type].label}
          </span>
          <p class="text-[12px] text-ink-soft">
            Card type is permanent and can't be changed.
          </p>
        </div>
      {/if}

      <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="kb-title">
        Title
      </label>
      <input
        id="kb-title"
        type="text"
        bind:value={title}
        placeholder={isLink ? 'e.g. TikTok transition tutorial' : 'e.g. Cinematic rain scene'}
        class="mb-4 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[15px] focus:border-teal focus:outline-none"
      />

      <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="kb-desc">
        Description <span class="font-normal">(optional — purpose of this card)</span>
      </label>
      <input
        id="kb-desc"
        type="text"
        bind:value={description}
        placeholder="e.g. For GISING part 2 scenes"
        class="mb-4 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] focus:border-teal focus:outline-none"
      />

      {#if type === 'note'}
        <div class="mb-4 flex items-center gap-2 rounded-xl bg-paper px-3.5 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-cat-note)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
            <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
          </svg>
          <p class="text-[12px] text-ink-soft">
            You'll write the note in the full-screen editor after saving.
          </p>
        </div>
      {:else}
        <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="kb-content">
          {isLink ? 'Link URL' : 'Prompt'}
        </label>
        {#if isLink}
          <input
            id="kb-content"
            type="url"
            bind:value={content}
            placeholder="https://…"
            class="mb-4 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 font-mono text-[13px] focus:border-teal focus:outline-none"
          />
        {:else}
          <textarea
            id="kb-content"
            bind:value={content}
            rows="6"
            placeholder="Paste or write your prompt here…"
            class="mb-4 w-full resize-y rounded-xl border border-line bg-paper px-3.5 py-2.5 font-mono text-[13px] leading-relaxed focus:border-teal focus:outline-none"
          ></textarea>
        {/if}
      {/if}

      {#if folderOptions.length}
        <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="kb-folder">
          Folder <span class="font-normal">(optional)</span>
        </label>
        <select
          id="kb-folder"
          bind:value={folderId}
          class="mb-4 w-full appearance-none rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] focus:border-teal focus:outline-none"
        >
          <option value="">No folder</option>
          {#each folderOptions as f (f.id)}
            <option value={f.id}>{f.name}</option>
          {/each}
        </select>
      {/if}

      <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="kb-tags">
        Tags <span class="font-normal">(comma separated, optional)</span>
      </label>
      <input
        id="kb-tags"
        type="text"
        bind:value={tagsText}
        placeholder="cinematic, suno, flow"
        class="mb-2 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] focus:border-teal focus:outline-none"
      />
    </div>

    <div
      class="flex gap-2 border-t border-line p-4"
      style="padding-bottom: calc(1rem + env(safe-area-inset-bottom));"
    >
      <button
        class="flex-1 rounded-xl border border-line py-3 text-[14px] font-semibold text-ink-soft active:bg-paper"
        onclick={onclose}
      >
        Cancel
      </button>
      <button
        class="flex-1 rounded-xl bg-teal py-3 text-[14px] font-semibold text-white active:opacity-90 disabled:opacity-50"
        disabled={saving}
        onclick={save}
      >
        {isNew ? 'Save' : 'Save changes'}
      </button>
    </div>
  </div>
</div>
