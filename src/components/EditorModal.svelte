<script>
  import { CATEGORIES } from '../lib/categories.js';
  import { saveItem, toast } from '../lib/store.svelte.js';

  let { item, onclose } = $props();

  const isNew = !item.id;
  let type = $state(item.type || 'image');
  let title = $state(item.title || '');
  let description = $state(item.description || '');
  let content = $state(item.content || '');
  let tagsText = $state((item.tags || []).join(', '));
  let saving = $state(false);

  const isLink = $derived(type === 'link');

  async function save() {
    if (!content.trim()) {
      toast(isLink ? 'Paste a link first' : 'Content cannot be empty');
      return;
    }
    saving = true;
    const tags = tagsText
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    await saveItem({ id: item.id, type, title, description, content, tags });
    saving = false;
    toast(isNew ? 'Saved to your kaban ✓' : 'Changes saved ✓');
    onclose();
  }

  function onBackdrop(e) {
    if (e.target === e.currentTarget) onclose();
  }
</script>

<div
  class="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 sm:items-center"
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
      <!-- Type chips -->
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

      <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="kb-content">
        {isLink ? 'Link URL' : type === 'note' ? 'Note' : 'Prompt'}
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
          placeholder={type === 'note'
            ? 'Write anything…'
            : 'Paste or write your prompt here…'}
          class="mb-4 w-full resize-y rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[13px] leading-relaxed focus:border-teal focus:outline-none {type === 'note' ? '' : 'font-mono'}"
        ></textarea>
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
