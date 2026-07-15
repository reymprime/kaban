<script>
  import { lockScroll } from '../lib/scrollLock.js';
  import { CATEGORIES } from '../lib/categories.js';
  import { vault, saveFolder, deleteFolder, toast } from '../lib/store.svelte.js';

  let { folder, onclose, ondeleted } = $props();

  const isNew = !folder.id;
  let name = $state(folder.name || '');
  let category = $state(folder.category || '');
  let description = $state(folder.description || '');
  let saving = $state(false);
  let confirmingDelete = $state(false);

  const memberCount = $derived(
    folder.id ? vault.items.filter((i) => i.folderId === folder.id).length : 0
  );

  const options = [
    { id: 'image', label: 'Image Prompts', color: 'var(--color-cat-image)', soft: 'var(--color-cat-image-soft)' },
    { id: 'video', label: 'Video Prompts', color: 'var(--color-cat-video)', soft: 'var(--color-cat-video-soft)' },
    { id: 'link', label: 'Stored Links', color: 'var(--color-cat-link)', soft: 'var(--color-cat-link-soft)' },
    { id: 'note', label: 'Notes', color: 'var(--color-cat-note)', soft: 'var(--color-cat-note-soft)' },
    { id: 'all', label: 'All of the above', color: 'var(--color-teal)', soft: 'var(--color-teal-soft)' },
  ];

  async function save() {
    if (!name.trim()) {
      toast('Give your folder a name');
      return;
    }
    if (!category) {
      toast('Choose what this folder is for');
      return;
    }
    saving = true;
    await saveFolder({ id: folder.id, name, category, description });
    saving = false;
    toast(isNew ? 'Folder created ✓' : 'Folder updated ✓');
    onclose();
  }

  async function handleDelete() {
    saving = true;
    try {
      const n = await deleteFolder(folder.id);
      toast(
        n
          ? `Folder and ${n} card${n === 1 ? '' : 's'} permanently deleted`
          : 'Folder deleted'
      );
      ondeleted?.();
      onclose();
    } catch (e) {
      toast(e.message || 'Could not delete folder');
      confirmingDelete = false;
    } finally {
      saving = false;
    }
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
    class="pop-in w-full max-w-lg rounded-t-3xl bg-card p-5 sm:rounded-3xl"
    role="dialog"
    aria-modal="true"
    aria-label={isNew ? 'New folder' : 'Edit folder'}
    style="padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));"
  >
    <div class="mb-3 flex items-center justify-between">
      <h2 class="font-display text-lg font-bold">
        {isNew ? 'New folder' : 'Edit folder'}
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

    <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="fd-name">
      Folder name
    </label>
    <input
      id="fd-name"
      type="text"
      bind:value={name}
      placeholder="e.g. GISING Part 2, Suno lyrics, Pegs"
      class="mb-4 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[15px] focus:border-teal focus:outline-none"
    />

    <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="fd-desc">
      Description
      <span class="font-normal">(optional — what's inside &amp; what it's for)</span>
    </label>
    <textarea
      id="fd-desc"
      bind:value={description}
      rows="2"
      placeholder="e.g. All rain-scene image prompts for GISING Part 2"
      class="mb-4 w-full resize-y rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] leading-relaxed focus:border-teal focus:outline-none"
    ></textarea>

    {#if isNew}
      <p class="mb-1.5 text-[12px] font-semibold text-ink-soft">
        What is this folder for?
      </p>
      <p class="mb-2 text-[11px] text-ink-soft">
        Pick carefully — a folder's purpose is fixed for life and can't be changed later.
      </p>
      <div class="mb-5 grid grid-cols-2 gap-2">
        {#each options as opt (opt.id)}
          <button
            class="rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-colors
              {opt.id === 'all' ? 'col-span-2' : ''}"
            style={category === opt.id
              ? `border-color: ${opt.color}; background: ${opt.soft}; color: ${opt.color};`
              : 'border-color: var(--color-line); color: var(--color-ink-soft);'}
            onclick={() => (category = opt.id)}
          >
            {opt.label}
          </button>
        {/each}
      </div>
    {:else}
      {@const opt = options.find((o) => o.id === category)}
      <p class="mb-1.5 text-[12px] font-semibold text-ink-soft">Folder purpose</p>
      <div
        class="mb-5 flex items-center justify-between rounded-xl border px-3.5 py-2.5"
        style="border-color: {opt?.color || 'var(--color-line)'}; background: {opt?.soft || 'var(--color-paper)'};"
      >
        <span class="text-[13px] font-semibold" style="color: {opt?.color || 'var(--color-ink-soft)'};">
          {opt?.label || 'All'}
        </span>
        <span class="flex items-center gap-1 text-[11px] font-medium text-ink-soft">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Fixed for life
        </span>
      </div>
    {/if}

    {#if !confirmingDelete}
      <div class="flex gap-2">
        {#if !isNew}
          <button
            class="flex h-12 w-12 items-center justify-center rounded-xl border border-line text-ink-soft active:bg-paper"
            aria-label="Delete folder"
            onclick={() => (confirmingDelete = true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            </svg>
          </button>
        {/if}
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
          {isNew ? 'Create folder' : 'Save changes'}
        </button>
      </div>
    {:else}
      <div
        class="rounded-xl border p-3"
        style="border-color: var(--color-cat-video); background: var(--color-cat-video-soft);"
      >
        <p class="mb-1 text-[13px] font-bold" style="color: var(--color-cat-video);">
          ⚠ Delete “{folder.name}”?
        </p>
        <p class="mb-2 text-[13px] leading-relaxed text-ink-soft">
          This will <span class="font-bold text-ink">permanently delete the folder
          and ALL {memberCount} card{memberCount === 1 ? '' : 's'} inside it</span>.
          No restoration. No undo.
        </p>
        <div class="flex gap-2">
          <button
            class="flex-1 rounded-xl border border-line bg-card py-2.5 text-[13px] font-semibold text-ink-soft active:bg-paper"
            onclick={() => (confirmingDelete = false)}
          >
            Keep it
          </button>
          <button
            class="flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white active:opacity-90 disabled:opacity-50"
            style="background: var(--color-cat-video);"
            disabled={saving}
            onclick={handleDelete}
          >
            Delete everything
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
