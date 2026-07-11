<script>
  import { onMount } from 'svelte';
  import { vault, loadVault, shareItems, moveToFolder, reorderItems, tapFeedback, toast } from './lib/store.svelte.js';
  import { TABS, CATEGORIES } from './lib/categories.js';
  import { stripForSearch } from './lib/richtext.js';
  import Header from './components/Header.svelte';
  import Card from './components/Card.svelte';
  import EditorModal from './components/EditorModal.svelte';
  import ConfirmModal from './components/ConfirmModal.svelte';
  import BackupModal from './components/BackupModal.svelte';
  import NoteViewer from './components/NoteViewer.svelte';
  import FolderModal from './components/FolderModal.svelte';
  import SecurityModal from './components/SecurityModal.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import ReorderList from './components/ReorderList.svelte';
  import FolderPickerModal from './components/FolderPickerModal.svelte';
  import RecapModal from './components/RecapModal.svelte';
  import Tutorial from './components/Tutorial.svelte';
  import Toast from './components/Toast.svelte';

  let tab = $state('all');
  let query = $state('');
  let editing = $state(null); // item object (edit) or { type } (new)
  let deleting = $state(null); // item pending delete confirmation
  let viewing = $state(null); // note being viewed full screen
  let viewAutoEdit = $state(false); // open the viewer straight into edit mode
  let showBackup = $state(false);
  let showSettings = $state(false);

  // Folders
  let showFabMenu = $state(false);
  let folderEditing = $state(null); // folder object (edit) or {} (new)
  let openFolder = $state(null); // folder currently being browsed

  // Select-to-share mode
  let selecting = $state(false);
  let selected = $state([]);
  let sharing = $state(false);
  let showFolderPicker = $state(false);
  let reordering = $state(false);

  const selectedTypes = $derived(
    vault.items.filter((i) => selected.includes(i.id)).map((i) => i.type)
  );

  async function handleKick() {
    const n = await moveToFolder(selected, null);
    toast(`${n} card${n === 1 ? '' : 's'} kicked back home`);
    cancelSelect();
  }

  async function handleMove(folder) {
    const n = await moveToFolder(selected, folder.id);
    toast(`Moved ${n} card${n === 1 ? '' : 's'} to “${folder.name}” ✓`);
    showFolderPicker = false;
    cancelSelect();
  }

  function startReorder() {
    cancelSelect();
    reordering = true;
  }

  async function saveReorder(orderedIds) {
    await reorderItems(orderedIds);
    reordering = false;
    toast('New order saved ✓');
  }

  function startSelect(id) {
    if (selecting) return;
    selecting = true;
    selected = [id];
    if (navigator.vibrate) navigator.vibrate(20);
  }

  function toggleSelect(id) {
    selected = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
  }

  function cancelSelect() {
    selecting = false;
    selected = [];
  }

  function selectAllVisible() {
    selected = filtered.map((i) => i.id);
  }

  async function handleShare() {
    if (!selected.length) return;
    sharing = true;
    const res = await shareItems(selected);
    sharing = false;
    const skipNote = res.skipped
      ? ` — ${res.skipped} protected card${res.skipped === 1 ? '' : 's'} skipped`
      : '';
    if (res.status === 'shared') toast(`Shared ✓${skipNote}`);
    else if (res.status === 'downloaded') toast(`JSON file downloaded ✓${skipNote}`);
    else if (res.status === 'empty')
      toast('Only protected cards selected — unlock the vault first');
    if (res.status !== 'cancelled') cancelSelect();
  }

  onMount(async () => {
    // Tap feedback (haptics + click sound) for every button and link app-wide
    document.addEventListener(
      'pointerdown',
      (e) => {
        if (e.target.closest('button, a, [role="button"]')) tapFeedback();
      },
      { passive: true }
    );
    await loadVault();
    // Handle app shortcut launches (long-press app icon -> quick actions)
    const params = new URLSearchParams(location.search);
    const t = params.get('new');
    if (t && ['image', 'video', 'link', 'note'].includes(t)) {
      editing = { type: t };
      history.replaceState(null, '', location.pathname);
    }
  });

  // Keep the open folder header fresh after renames
  $effect(() => {
    if (openFolder) {
      const fresh = vault.folders.find((f) => f.id === openFolder.id);
      if (fresh && fresh !== openFolder) openFolder = fresh;
    }
  });

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    let list = vault.items;
    if (openFolder) {
      list = list.filter((i) => i.folderId === openFolder.id);
    } else if (tab === 'folder') {
      // The Folders tab shows folders only — no loose cards
      return [];
    } else {
      // Cards inside folders live ONLY inside their folder while browsing.
      // Search stays global so nothing ever feels lost.
      if (!q) list = list.filter((i) => !i.folderId);
      if (tab !== 'all') list = list.filter((i) => i.type === tab);
    }
    if (q) {
      list = list.filter((i) => {
        const c = i.protected ? (vault.plain[i.id] ?? '') : i.content;
        return (
          i.title.toLowerCase().includes(q) ||
          stripForSearch(c).toLowerCase().includes(q) ||
          (i.description || '').toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
    }
    // Pinned first, then manual drag order; cards never manually
    // ordered fall back to newest-first via a negative timestamp.
    const ord = (x) => (typeof x.order === 'number' ? x.order : -(x.updatedAt || 0));
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return ord(a) - ord(b);
    });
  });

  const visibleFolders = $derived.by(() => {
    // Folders live in their own tab — a dedicated home for all of them
    if (openFolder || tab !== 'folder') return [];
    let fs = vault.folders;
    const q = query.trim().toLowerCase();
    if (q) fs = fs.filter((f) => f.name.toLowerCase().includes(q));
    return [...fs].sort((a, b) => a.name.localeCompare(b.name));
  });

  const folderCounts = $derived.by(() => {
    const c = {};
    for (const i of vault.items) {
      if (i.folderId) c[i.folderId] = (c[i.folderId] || 0) + 1;
    }
    return c;
  });

  const folderColor = (f) =>
    f.category === 'all' ? 'var(--color-teal)' : CATEGORIES[f.category]?.color;

  const counts = $derived.by(() => {
    const c = {
      all: vault.items.length,
      image: 0,
      video: 0,
      link: 0,
      note: 0,
      folder: vault.folders.length,
    };
    for (const i of vault.items) c[i.type] = (c[i.type] || 0) + 1;
    return c;
  });

  function newItem() {
    let type = tab === 'all' || tab === 'folder' ? 'image' : tab;
    let folderId;
    if (openFolder) {
      if (openFolder.category !== 'all') type = openFolder.category;
      folderId = openFolder.id;
    }
    editing = { type, folderId };
  }
</script>

<div class="mx-auto flex min-h-dvh max-w-lg flex-col">
  <div class="sticky top-0 z-20 border-b border-line/60 bg-paper">
    <Header
      bind:query
      onbackup={() => (showBackup = true)}
      onsettings={() => (showSettings = true)}
    />

    <!-- Category tabs / folder header -->
    {#if openFolder}
      <div class="flex items-center gap-2 px-4 pb-3">
        <button
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-ink-soft active:bg-line"
          aria-label="Back to all"
          onclick={() => (openFolder = null)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <svg width="18" height="18" viewBox="0 0 24 24" fill={folderColor(openFolder)}>
          <path d="M4 5a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.6.8l1.2 1.6a1 1 0 0 0 .8.4H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" />
        </svg>
        <div class="min-w-0 flex-1">
          <p class="truncate font-display text-[15px] font-bold leading-none">
            {openFolder.name}
          </p>
          <p class="mt-0.5 text-[11px] text-ink-soft">
            {folderCounts[openFolder.id] || 0} card{(folderCounts[openFolder.id] || 0) === 1 ? '' : 's'}
          </p>
        </div>
        <button
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-ink-soft active:bg-line"
          aria-label="Edit folder"
          onclick={() => (folderEditing = openFolder)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
          </svg>
        </button>
      </div>
    {:else}
      <nav
        id="tour-tabs"
        class="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3"
        aria-label="Categories"
      >
        {#each TABS as t (t.id)}
          <button
            class="shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors
              {tab === t.id
              ? 'border-ink bg-ink text-paper'
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
    {/if}
  </div>

  <!-- Card list -->
  <main class="flex-1 px-4 pb-32 pt-1">
    {#if reordering}
      <ReorderList
        items={filtered}
        onsave={saveReorder}
        oncancel={() => (reordering = false)}
      />
    {:else}
    {#if visibleFolders.length}
      <ul class="mb-3 flex flex-col gap-2">
        {#each visibleFolders as f (f.id)}
          <li class="relative">
            <button
              class="flex w-full items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 pr-12 text-left active:bg-paper"
              onclick={() => (openFolder = f)}
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
            </button>
            <button
              class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-soft/60 active:bg-line"
              aria-label="Edit folder {f.name}"
              onclick={() => (folderEditing = f)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
              </svg>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    {#if !vault.loaded}
      <p class="py-16 text-center text-sm text-ink-soft">Opening your kaban…</p>
    {:else if filtered.length === 0 && !visibleFolders.length}
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
        {:else if tab === 'folder'}
          <p class="font-display text-lg font-semibold">No folders yet</p>
          <p class="max-w-[240px] text-sm text-ink-soft">
            Tap <span class="font-semibold text-teal">+</span> then
            <span class="font-semibold">New Folder</span> to create your first one.
          </p>
        {:else if openFolder}
          <p class="font-display text-lg font-semibold">Empty folder</p>
          <p class="max-w-[260px] text-sm text-ink-soft">
            Tap <span class="font-semibold text-teal">+</span> to add a card here,
            or edit an existing card and set its Folder to “{openFolder.name}”.
          </p>
        {:else if visibleFolders.length}
          <p class="max-w-[240px] text-sm text-ink-soft">
            No cards here yet — tap <span class="font-semibold text-teal">+</span> to add one.
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
            {selecting}
            isSelected={selected.includes(item.id)}
            onedit={() =>
              (editing = item.protected
                ? { ...item, tags: [...item.tags], content: vault.plain[item.id] ?? '' }
                : item)}
            ondelete={() => (deleting = item)}
            onview={() =>
              (viewing = item.protected
                ? { ...item, tags: [...item.tags], content: vault.plain[item.id] ?? '' }
                : item)}
            onselectstart={() => startSelect(item.id)}
            ontoggleselect={() => toggleSelect(item.id)}
          />
        {/each}
      </ul>
    {/if}
    {/if}
  </main>

  <!-- FAB + menu -->
  {#if reordering}
    <!-- Reorder mode has its own Save/Cancel bar -->
  {:else if !selecting}
    {#if showFabMenu}
      <button
        class="fixed inset-0 z-30 bg-ink/20"
        aria-label="Close menu"
        onclick={() => (showFabMenu = false)}
      ></button>
      <div class="fixed bottom-24 right-[max(1.25rem,calc(50%-16rem+1.25rem))] z-30 flex flex-col items-end gap-2">
        <button
          class="pop-in flex items-center gap-2 rounded-2xl border border-line bg-card py-3 pl-4 pr-5 text-[14px] font-semibold shadow-lg active:bg-paper"
          onclick={() => {
            showFabMenu = false;
            selecting = true;
            selected = [];
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11.5 11 13.5 15 9.5" />
            <rect x="3" y="5" width="14" height="14" rx="3" />
            <path d="M21 8v9a4 4 0 0 1-4 4h-9" />
          </svg>
          Select to Share
        </button>
        <button
          class="pop-in flex items-center gap-2 rounded-2xl border border-line bg-card py-3 pl-4 pr-5 text-[14px] font-semibold shadow-lg active:bg-paper"
          onclick={() => {
            showFabMenu = false;
            folderEditing = {};
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-teal)">
            <path d="M4 5a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.6.8l1.2 1.6a1 1 0 0 0 .8.4H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" />
          </svg>
          New Folder
        </button>
        <button
          class="pop-in flex items-center gap-2 rounded-2xl border border-line bg-card py-3 pl-4 pr-5 text-[14px] font-semibold shadow-lg active:bg-paper"
          onclick={() => {
            showFabMenu = false;
            newItem();
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          New Card
        </button>
      </div>
    {/if}
    <button
      class="fixed bottom-6 right-[max(1.25rem,calc(50%-16rem+1.25rem))] z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-white shadow-lg shadow-teal/30 transition-transform active:scale-95"
      style="margin-bottom: env(safe-area-inset-bottom);"
      id="tour-fab"
      aria-label={showFabMenu ? 'Close menu' : 'Add new'}
      onclick={() => (showFabMenu = !showFabMenu)}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        class="transition-transform duration-200 {showFabMenu ? 'rotate-45' : ''}"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  {:else}
    <!-- Selection action bar -->
    <div
      class="pop-in fixed bottom-0 left-1/2 z-30 flex w-full max-w-lg -translate-x-1/2 items-center gap-1.5 border-t border-line bg-card px-3 py-3"
      style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));"
    >
      <button
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft active:bg-paper"
        aria-label="Cancel selection"
        onclick={cancelSelect}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      <span class="min-w-0 flex-1 truncate text-[13px] font-semibold">
        {selected.length} selected
      </span>
      <button
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft active:bg-paper"
        aria-label="Select all"
        onclick={selectAllVisible}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 13 3 3 5-6M12 13l3 3 6-7" />
        </svg>
      </button>
      <button
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft active:bg-paper"
        aria-label="Re-Order Cards"
        onclick={startReorder}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
        </svg>
      </button>
      {#if openFolder}
        <button
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft active:bg-paper disabled:opacity-40"
          aria-label="Kick cards out of this folder"
          disabled={!selected.length}
          onclick={handleKick}
        >
          <!-- Kick: arrow leaving a box -->
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
            <path d="M10 8 4 12l6 4M4 12h12" />
          </svg>
        </button>
      {/if}
      <button
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-ink-soft active:bg-paper disabled:opacity-40"
        aria-label="Move to folder"
        disabled={!selected.length}
        onclick={() => (showFolderPicker = true)}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 5a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.6.8l1.2 1.6a1 1 0 0 0 .8.4H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" />
          <path d="M12 10v6m0-6-2.5 2.5M12 10l2.5 2.5" transform="rotate(180 12 13)" />
        </svg>
      </button>
      <button
        class="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-teal px-3.5 text-[13px] font-semibold text-white active:opacity-90 disabled:opacity-50"
        disabled={!selected.length || sharing}
        onclick={handleShare}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        {sharing ? '…' : 'Share'}
      </button>
    </div>
  {/if}

  {#if vault.tutorialOpen}
    <Tutorial onclose={() => (vault.tutorialOpen = false)} />
  {/if}
  {#if vault.recapOpen}
    <RecapModal onclose={() => (vault.recapOpen = false)} />
  {/if}
  {#if showFolderPicker}
    <FolderPickerModal
      types={selectedTypes}
      onpick={handleMove}
      onclose={() => (showFolderPicker = false)}
    />
  {/if}
  {#if showSettings}
    <SettingsModal onclose={() => (showSettings = false)} />
  {/if}
  {#if vault.securityPrompt}
    <SecurityModal
      mode={vault.securityPrompt}
      onclose={() => (vault.securityPrompt = null)}
    />
  {/if}
  {#if folderEditing}
    <FolderModal
      folder={folderEditing}
      onclose={() => (folderEditing = null)}
      ondeleted={() => (openFolder = null)}
    />
  {/if}
  {#if viewing}
    <NoteViewer
      item={viewing}
      autoEdit={viewAutoEdit}
      onclose={() => {
        viewing = null;
        viewAutoEdit = false;
      }}
    />
  {/if}
  {#if editing}
    <EditorModal
      item={editing}
      onclose={() => (editing = null)}
      onsaved={(saved, wasNew) => {
        if (wasNew && saved.type === 'note') {
          viewing = saved;
          viewAutoEdit = true;
        }
      }}
    />
  {/if}
  {#if deleting}
    <ConfirmModal item={deleting} onclose={() => (deleting = null)} />
  {/if}
  {#if showBackup}
    <BackupModal onclose={() => (showBackup = false)} />
  {/if}

  <Toast />
</div>
