<script>
  import { onMount } from 'svelte';
  import { vault, loadVault } from './lib/store.svelte.js';
  import { TABS } from './lib/categories.js';
  import Header from './components/Header.svelte';
  import Card from './components/Card.svelte';
  import EditorModal from './components/EditorModal.svelte';
  import ConfirmModal from './components/ConfirmModal.svelte';
  import BackupModal from './components/BackupModal.svelte';
  import NoteViewer from './components/NoteViewer.svelte';
  import Toast from './components/Toast.svelte';

  let tab = $state('all');
  let query = $state('');
  let editing = $state(null); // item object (edit) or { type } (new)
  let deleting = $state(null); // item pending delete confirmation
  let viewing = $state(null); // note being viewed full screen
  let showBackup = $state(false);

  onMount(loadVault);

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    let list = vault.items;
    if (tab !== 'all') list = list.filter((i) => i.type === tab);
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.content.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  });

  const counts = $derived.by(() => {
    const c = { all: vault.items.length, image: 0, video: 0, link: 0, note: 0 };
    for (const i of vault.items) c[i.type] = (c[i.type] || 0) + 1;
    return c;
  });

  function newItem() {
    const type = tab === 'all' ? 'image' : tab;
    editing = { type };
  }
</script>

<div class="mx-auto flex min-h-dvh max-w-lg flex-col">
  <div class="sticky top-0 z-20 border-b border-line/60 bg-paper">
    <Header bind:query onbackup={() => (showBackup = true)} />

    <!-- Category tabs -->
    <nav
      class="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3"
      aria-label="Categories"
    >
    {#each TABS as t (t.id)}
      <button
        class="shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors
          {tab === t.id
          ? 'border-ink bg-ink text-white'
          : 'border-line bg-card text-ink-soft'}"
        onclick={() => (tab = t.id)}
      >
        {t.label}
        {#if counts[t.id]}
          <span class="ml-1 opacity-60">{counts[t.id]}</span>
        {/if}
      </button>
      {/each}
    </nav>
  </div>

  <!-- Card list -->
  <main class="flex-1 px-4 pb-32 pt-1">
    {#if !vault.loaded}
      <p class="py-16 text-center text-sm text-ink-soft">Opening your kaban…</p>
    {:else if filtered.length === 0}
      <div class="flex flex-col items-center gap-3 py-20 text-center">
        <div
          class="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-soft"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--color-teal)">
            <path
              d="M12 3a6 6 0 0 0-2.4 11.5l-1.1 5.3a1 1 0 0 0 1 1.2h5a1 1 0 0 0 1-1.2l-1.1-5.3A6 6 0 0 0 12 3Zm0 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
            />
          </svg>
        </div>
        {#if query}
          <p class="text-sm text-ink-soft">
            No results for “{query}”. Try another keyword.
          </p>
        {:else}
          <p class="font-display text-lg font-semibold">Your kaban is empty</p>
          <p class="max-w-[240px] text-sm text-ink-soft">
            Tap <span class="font-semibold text-teal">+</span> to save your first
            prompt, link, or note.
          </p>
        {/if}
      </div>
    {:else}
      <ul class="flex flex-col gap-3">
        {#each filtered as item (item.id)}
          <Card
            {item}
            onedit={() => (editing = item)}
            ondelete={() => (deleting = item)}
            onview={() => (viewing = item)}
          />
        {/each}
      </ul>
    {/if}
  </main>

  <!-- FAB -->
  <button
    class="fixed bottom-6 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-white shadow-lg shadow-teal/30 transition-transform active:scale-95"
    style="margin-bottom: env(safe-area-inset-bottom);"
    aria-label="Add new item"
    onclick={newItem}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  </button>

  {#if viewing}
    <NoteViewer item={viewing} onclose={() => (viewing = null)} />
  {/if}
  {#if editing}
    <EditorModal item={editing} onclose={() => (editing = null)} />
  {/if}
  {#if deleting}
    <ConfirmModal item={deleting} onclose={() => (deleting = null)} />
  {/if}
  {#if showBackup}
    <BackupModal onclose={() => (showBackup = false)} />
  {/if}

  <Toast />
</div>
