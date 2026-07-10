<script>
  import { vault } from '../lib/store.svelte.js';
  import { CATEGORIES } from '../lib/categories.js';

  let { types, onpick, onclose } = $props(); // types: array of selected card types

  const single = $derived(new Set(types).size === 1 ? types[0] : null);
  const options = $derived(
    vault.folders
      .filter((f) => f.category === 'all' || (single && f.category === single))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
  const folderCounts = $derived.by(() => {
    const c = {};
    for (const i of vault.items) if (i.folderId) c[i.folderId] = (c[i.folderId] || 0) + 1;
    return c;
  });

  const folderColor = (f) =>
    f.category === 'all' ? 'var(--color-teal)' : CATEGORIES[f.category]?.color;

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
    class="pop-in w-full max-w-lg rounded-t-3xl bg-card p-5 sm:rounded-3xl"
    role="dialog"
    aria-modal="true"
    aria-label="Move to folder"
    style="padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));"
  >
    <div class="mb-3 flex items-center justify-between">
      <h2 class="font-display text-lg font-bold">Move to Folder</h2>
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

    {#if options.length}
      <ul class="flex max-h-[50dvh] flex-col gap-2 overflow-y-auto">
        {#each options as f (f.id)}
          <li>
            <button
              class="flex w-full items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-left active:bg-paper"
              onclick={() => onpick(f)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={folderColor(f)} class="shrink-0">
                <path d="M4 5a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.6.8l1.2 1.6a1 1 0 0 0 .8.4H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" />
              </svg>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[14px] font-semibold">{f.name}</span>
                <span class="block text-[11px] text-ink-soft">
                  {folderCounts[f.id] || 0} card{(folderCounts[f.id] || 0) === 1 ? '' : 's'}
                </span>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-soft)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="py-6 text-center text-[13px] text-ink-soft">
        No matching folders for this selection.
        {#if !single}
          Mixed card types can only move into an "All of the above" folder.
        {/if}
        Create one first via the + button.
      </p>
    {/if}
  </div>
</div>
