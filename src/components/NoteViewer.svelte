<script>
  import { lockScroll } from '../lib/scrollLock.js';
  import { tick } from 'svelte';
  import * as db from '../lib/db.js';
  import { vault, copyText, saveItem, setNoteLink, toast } from '../lib/store.svelte.js';
  import { detectPlatform } from '../lib/platform.js';
  import { isHtml, textToHtml, htmlToText, sanitizeHtml, linkifyHtml } from '../lib/richtext.js';
  import FormatBar from './FormatBar.svelte';

  let { item, onclose, autoEdit = false } = $props();

  let mode = $state('read'); // 'read' | 'edit'
  let focusMode = $state(false); // full-screen writing only
  let showBar = $state(true); // formatting bar visibility

  // Local copy so the viewer always shows fresh data after saving
  let current = $state({ ...item, tags: [...item.tags] });

  // Edit fields
  let title = $state('');
  let description = $state('');
  let tagsText = $state('');
  let htmlBody = $state(''); // rich content while editing
  let saving = $state(false);

  let focusEl = $state(null);

  // ---- Link to (attach this note to a Stored Link) ----
  let showLinkPicker = $state(false);
  let linkQuery = $state('');
  const storedLinks = $derived(vault.items.filter((i) => i.type === 'link'));
  // Filter the picker by title or host as the user types.
  const filteredLinks = $derived.by(() => {
    const q = linkQuery.trim().toLowerCase();
    if (!q) return storedLinks;
    return storedLinks.filter((l) => {
      const host = (linkHost(l) || '').toLowerCase();
      return l.title.toLowerCase().includes(q) || host.includes(q);
    });
  });

  async function pickLink(linkId) {
    await setNoteLink(current.id, linkId);
    current = { ...current, linkedTo: linkId || null };
    showLinkPicker = false;
    toast(linkId ? 'Linked ✓ — swipe right on that card to see it' : 'Link removed');
  }

  function linkHost(l) {
    if (l.protected) return 'Protected link';
    return detectPlatform(l.content)?.host || l.content;
  }

  // ---- Draft auto-save (accident insurance) ----
  const draftKey = () => 'draft:' + current.id;
  let draftTimer = null;

  function scheduleDraft() {
    if (mode !== 'edit' || current.protected) return; // never store protected content unencrypted
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 800);
  }

  async function saveDraft() {
    if (mode !== 'edit' || current.protected) return;
    try {
      await db.putMeta({
        key: draftKey(),
        title,
        description,
        tagsText,
        htmlBody,
        savedAt: Date.now(),
      });
    } catch {}
  }

  async function clearDraft() {
    clearTimeout(draftTimer);
    try {
      await db.removeMeta(draftKey());
    } catch {}
  }

  async function startEdit() {
    if (current.locked) {
      toast('Locked — unlock the card first to edit');
      return;
    }
    title = current.title;
    description = current.description || '';
    tagsText = current.tags.join(', ');
    htmlBody = isHtml(current.content)
      ? sanitizeHtml(current.content)
      : textToHtml(current.content);

    // Restore an unsaved draft if it's newer than the last save
    if (!current.protected) {
      try {
        const draft = await db.getMeta(draftKey());
        if (draft && draft.savedAt > (current.updatedAt || 0)) {
          title = draft.title ?? title;
          description = draft.description ?? description;
          tagsText = draft.tagsText ?? tagsText;
          htmlBody = sanitizeHtml(draft.htmlBody ?? htmlBody);
          toast('Unsaved draft restored');
        }
      } catch {}
    }

    mode = 'edit';
  }

  function cancelEdit() {
    clearDraft(); // Cancel is an intentional discard
    mode = 'read';
    focusMode = false;
  }

  // Switching to Read Mode from the toggle should PRESERVE the user's work,
  // not throw it away. If there's content, save it; otherwise just switch.
  async function switchToRead() {
    if (mode !== 'edit') {
      mode = 'read';
      return;
    }
    if (focusMode && focusEl) htmlBody = focusEl.innerHTML;
    const hasText = htmlToText(htmlBody).trim().length > 0;
    if (hasText) {
      await save(); // save() already flips to read mode + shows a toast
    } else {
      cancelEdit();
    }
  }

  // Freshly created notes open straight into the full-screen writer
  let booted = false;
  $effect(() => {
    if (autoEdit && !booted) {
      booted = true;
      (async () => {
        await startEdit();
        await enterFocus();
      })();
    }
  });

  async function enterFocus() {
    focusMode = true;
    await tick();
    if (focusEl) {
      focusEl.innerHTML = htmlBody;
      focusEl.focus();
    }
  }

  async function exitFocus() {
    // Capture on-screen content before leaving the writer so nothing is lost.
    if (focusEl) htmlBody = focusEl.innerHTML;
    focusMode = false;
  }

  async function save() {
    if (focusMode && focusEl) {
      htmlBody = focusEl.innerHTML;
    }
    const plainTxt = htmlToText(htmlBody).trim();
    if (!plainTxt) {
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
      content: sanitizeHtml(htmlBody),
      tags,
      // Preserve diary metadata so it survives every re-save from the writer.
      entryDate: current.type === 'diary' ? current.entryDate : undefined,
      mood: current.type === 'diary' ? current.mood ?? null : undefined,
    });
    // Keep the readable content locally — saved.content may be encrypted
    current = { ...saved, tags: [...saved.tags], content: sanitizeHtml(htmlBody) };
    await clearDraft();
    saving = false;
    focusMode = false;
    mode = 'read';
    toast('Changes saved ✓');
  }

  // Open auto-detected links inside a note in the external browser
  function handleNoteClick(e) {
    const a = e.target.closest('a[data-note-link]');
    if (!a) return;
    e.preventDefault();
    window.open(a.href, '_blank', 'noopener,noreferrer');
  }

  async function handleCopy() {
    const ok = await copyText(htmlToText(current.content));
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

<div class="fixed inset-0 z-40 flex flex-col bg-card"
  use:lockScroll role="dialog" aria-modal="true" aria-label="Note">
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
          {mode === 'read' ? 'bg-ink text-paper' : 'text-ink-soft'}"
        onclick={switchToRead}
      >
        Read Mode
      </button>
      <button
        class="rounded-[10px] px-3 py-1 text-[12px] font-semibold transition-colors
          {mode === 'edit' ? 'bg-ink text-paper' : 'text-ink-soft'}"
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
      {#if isHtml(current.content)}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div
          class="note-body text-[15px] leading-relaxed text-ink"
          onclick={handleNoteClick}
        >
          {@html linkifyHtml(sanitizeHtml(current.content))}
        </div>
      {:else}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div
          class="note-body whitespace-pre-wrap text-[15px] leading-relaxed text-ink"
          onclick={handleNoteClick}
        >
          {@html linkifyHtml(textToHtml(current.content))}
        </div>
      {/if}
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
          <path d="M5 15H4a2 2 0 0 1 2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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
        oninput={scheduleDraft}
        class="mb-3 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 font-display text-[16px] font-semibold focus:border-teal focus:outline-none"
      />

      <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="nv-desc">
        Description <span class="font-normal">(optional)</span>
      </label>
      <input
        id="nv-desc"
        type="text"
        bind:value={description}
        oninput={scheduleDraft}
        placeholder="Purpose of this note"
        class="mb-3 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] focus:border-teal focus:outline-none"
      />

      <div class="mb-1 flex items-center justify-between">
        <span class="block text-[12px] font-semibold text-ink-soft">Note</span>
      </div>
      <button
        class="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal/50 bg-teal-soft/40 py-4 text-[14px] font-semibold text-teal active:bg-teal-soft"
        onclick={enterFocus}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
        </svg>
        Open Note Writer
      </button>

      <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="nv-tags">
        Tags <span class="font-normal">(comma separated, optional)</span>
      </label>
      <input
        id="nv-tags"
        type="text"
        bind:value={tagsText}
        oninput={scheduleDraft}
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
    <!-- FOCUS MODE: pure full-screen writing -->
    <div class="absolute inset-0 z-10 flex flex-col bg-card">
      <div
        class="flex items-center justify-between border-b border-line px-3 py-2"
        style="padding-top: calc(0.5rem + env(safe-area-inset-top));"
      >
        <button
          class="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-ink-soft active:bg-paper"
          aria-label="Exit focus mode"
          onclick={exitFocus}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
          </svg>
          Exit focus
        </button>
        <div class="flex items-center gap-2">
          {#if !showBar}
            <button
              class="rounded-lg px-2 py-1.5 font-display text-[13px] font-extrabold text-teal active:bg-paper"
              aria-label="Show formatting bar"
              onclick={() => (showBar = true)}
            >
              Aa
            </button>
          {/if}
          <button
            class="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold active:bg-paper
              {current.linkedTo ? 'text-teal' : 'text-ink-soft'}"
            aria-label="Link this note to a Stored Link"
            onclick={() => {
              linkQuery = '';
              showLinkPicker = true;
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
              <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
            </svg>
            Link to
          </button>
          <button
            class="rounded-xl bg-teal px-4 py-1.5 text-[12px] font-semibold text-white active:opacity-90 disabled:opacity-50"
            disabled={saving}
            onclick={save}
          >
            Save
          </button>
        </div>
      </div>
      <div
        bind:this={focusEl}
        contenteditable="true"
        role="textbox"
        aria-multiline="true"
        aria-label="Note content"
        oninput={() => { htmlBody = focusEl.innerHTML; scheduleDraft(); }}
        onblur={() => { if (focusEl) htmlBody = focusEl.innerHTML; }}
        class="rich-editor w-full flex-1 overflow-y-auto bg-card px-5 py-4 text-[16px] leading-relaxed focus:outline-none"
        style="padding-bottom: calc(1rem + env(safe-area-inset-bottom));"
      ></div>
      {#if showBar}
        <FormatBar onclose={() => (showBar = false)} />
      {/if}
    </div>
  {/if}

  {#if showLinkPicker}
    <!-- Stored Link picker -->
    <div
      class="absolute inset-0 z-20 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
      onclick={(e) => e.target === e.currentTarget && (showLinkPicker = false)}
      role="presentation"
    >
      <div
        class="pop-in flex max-h-[70%] w-full max-w-lg flex-col rounded-t-3xl bg-card sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-label="Link to a Stored Link"
        style="padding-bottom: env(safe-area-inset-bottom);"
      >
        <div class="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 class="font-display text-lg font-bold">Link to</h2>
          <button
            class="rounded-lg p-1.5 text-ink-soft active:bg-paper"
            aria-label="Close"
            onclick={() => (showLinkPicker = false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <p class="px-5 pb-3 text-[12px] text-ink-soft">
          Attach this note as extra information to a Stored Link.
        </p>
        {#if storedLinks.length > 4}
          <div class="px-5 pb-3">
            <div class="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-soft)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                bind:value={linkQuery}
                placeholder="Search links…"
                class="w-full bg-transparent text-[14px] focus:outline-none"
              />
              {#if linkQuery}
                <button class="shrink-0 text-ink-soft active:opacity-60" aria-label="Clear search" onclick={() => (linkQuery = '')}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              {/if}
            </div>
          </div>
        {/if}
        <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {#if !storedLinks.length}
            <p class="px-2 py-6 text-center text-[13px] text-ink-soft">
              No Stored Links yet — save a link first, then attach this note to it.
            </p>
          {:else if !filteredLinks.length}
            <p class="px-2 py-6 text-center text-[13px] text-ink-soft">
              No links match “{linkQuery}”.
            </p>
          {:else}
            {#each filteredLinks as l (l.id)}
              <button
                class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors active:bg-paper
                  {current.linkedTo === l.id ? 'bg-teal-soft/50' : ''}"
                onclick={() => pickLink(l.id)}
              >
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[14px] font-semibold">{l.title}</span>
                  <span class="block truncate text-[12px] text-ink-soft">{linkHost(l)}</span>
                </span>
                {#if current.linkedTo === l.id}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                {/if}
              </button>
            {/each}
            {#if current.linkedTo}
              <button
                class="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-[13px] font-semibold text-ink-soft active:bg-paper"
                onclick={() => pickLink(null)}
              >
                Remove link
              </button>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
