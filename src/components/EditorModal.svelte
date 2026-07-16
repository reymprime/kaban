<script>
  import { lockScroll } from '../lib/scrollLock.js';
  import { CATEGORIES } from '../lib/categories.js';
  import { vault, saveItem, toast } from '../lib/store.svelte.js';
  import { MOODS } from '../lib/moods.js';
  import MoodIcon from './MoodIcon.svelte';
  import DatePicker from './DatePicker.svelte';

  let { item, onclose, onsaved } = $props();

  const isNew = !item.id;
  let type = $state(item.type || 'image');
  let title = $state(item.title || '');
  let description = $state(item.description || '');
  let content = $state(item.content || '');
  let tagsText = $state((item.tags || []).join(', '));
  let folderId = $state(item.folderId || '');
  let saving = $state(false);

  // Diary-specific: entry date (defaults to today) and optional mood.
  const todayISO = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local
  let entryDate = $state(item.entryDate || todayISO);
  let mood = $state(item.mood || '');

  // Goal-specific: required target date + how progress is tracked.
  let targetDate = $state(item.targetDate || '');
  let trackMode = $state(item.trackMode || 'slider');

  // Custom DatePicker modals (replaces ugly native browser pickers)
  let showEntryPicker = $state(false);
  let showTargetPicker = $state(false);
  // Custom folder picker (replaces the native select dropdown)
  let showFolderPicker = $state(false);

  // Friendly display like "Thu, Jul 16, 2026"
  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const isLink = $derived(type === 'link');
  const isDiary = $derived(type === 'diary');
  const isGoal = $derived(type === 'goal');
  const isTask = $derived(type === 'task');
  // Diary, goal, and task reuse the note flow: details are set here, the
  // body/steps/items are handled in the full-screen view after saving.
  const writesInFullScreen = $derived(
    type === 'note' || type === 'diary' || type === 'goal' || type === 'task'
  );
  const folderOptions = $derived(
    vault.folders
      .filter((f) => f.category === type || f.category === 'all')
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  async function save() {
    const skipContent = writesInFullScreen;
    if (!skipContent && !content.trim()) {
      toast(isLink ? 'Paste a link first' : 'Content cannot be empty');
      return;
    }
    if (isGoal && !targetDate) {
      toast('Set a target date for your goal');
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
      // Notes, diary entries, and goals are fleshed out in the full-screen
      // view; keep existing content untouched here.
      content: skipContent ? undefined : content,
      tags,
      folderId: validFolder,
      entryDate: isDiary ? entryDate : undefined,
      mood: isDiary ? mood || null : undefined,
      targetDate: isGoal ? targetDate : undefined,
      trackMode: isGoal ? trackMode : undefined,
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
      <!-- Type chips (create only — card type is permanent).
           Goal/Task editors arrive in later phases, so they're not offered yet;
           diary opens straight from its own tab with the type pre-set. -->
      {#if isNew}
        {#if isDiary || isGoal || isTask}
          {@const cd = isDiary ? 'diary' : isGoal ? 'goal' : 'task'}
          {@const cl = isDiary ? 'Diary' : isGoal ? 'Goal' : 'Task List'}
          {@const sub = isDiary ? 'New diary entry' : isGoal ? 'New goal' : 'New task list'}
          <div class="mb-4 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5" style="background: var(--color-cat-{cd}-soft);">
            <span class="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style="background: var(--color-cat-{cd}); color: #fff;">
              {cl}
            </span>
            <p class="text-[12px]" style="color: var(--color-cat-{cd});">
              {sub}
            </p>
          </div>
        {:else}
          <div class="mb-4 grid grid-cols-2 gap-2">
            {#each Object.entries(CATEGORIES).filter(([k]) => !['diary', 'goal', 'task'].includes(k)) as [key, cat] (key)}
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
        {/if}
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

      {#if isDiary}
        <div class="mb-4 grid grid-cols-1 gap-4">
          <div>
            <span class="mb-1 block text-[12px] font-semibold text-ink-soft">
              Entry date
            </span>
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-xl border border-line bg-paper px-3.5 py-2.5 text-left text-[14px] active:bg-card"
              onclick={() => (showEntryPicker = true)}
            >
              <span>{fmtDate(entryDate)}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-soft)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </button>
          </div>
          <div>
            <span class="mb-1.5 block text-[12px] font-semibold text-ink-soft">
              How are you feeling? <span class="font-normal">(optional)</span>
            </span>
            <div class="flex flex-wrap gap-2">
              {#each MOODS as m (m.id)}
                <button
                  type="button"
                  class="flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-xl border transition-all active:scale-90"
                  style={mood === m.id
                    ? `border-color: ${m.color}; background: ${m.color}14;`
                    : 'border-color: var(--color-line);'}
                  onclick={() => (mood = mood === m.id ? '' : m.id)}
                  aria-label={m.label}
                >
                  <MoodIcon mood={m.id} size={26} color={mood === m.id ? m.color : 'var(--color-ink-soft)'} />
                </button>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      {#if isGoal}
        <div class="mb-4">
          <span class="mb-1 block text-[12px] font-semibold text-ink-soft">
            Target date <span style="color: var(--color-cat-goal);">*</span>
          </span>
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-xl border border-line bg-paper px-3.5 py-2.5 text-left text-[14px] active:bg-card"
            onclick={() => (showTargetPicker = true)}
          >
            <span class={targetDate ? '' : 'text-ink-soft'}>
              {targetDate ? fmtDate(targetDate) : 'Pick a date…'}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-soft)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </button>
        </div>
        <div class="mb-4">
          <span class="mb-1.5 block text-[12px] font-semibold text-ink-soft">
            How do you want to track progress?
          </span>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.98]"
              style={trackMode === 'slider'
                ? 'border-color: var(--color-cat-goal); background: var(--color-cat-goal-soft);'
                : 'border-color: var(--color-line);'}
              onclick={() => (trackMode = 'slider')}
            >
              <span class="block text-[13px] font-semibold" style={trackMode === 'slider' ? 'color: var(--color-cat-goal);' : ''}>Slider</span>
              <span class="block text-[11px] text-ink-soft">Set % yourself</span>
            </button>
            <button
              type="button"
              class="rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.98]"
              style={trackMode === 'milestones'
                ? 'border-color: var(--color-cat-goal); background: var(--color-cat-goal-soft);'
                : 'border-color: var(--color-line);'}
              onclick={() => (trackMode = 'milestones')}
            >
              <span class="block text-[13px] font-semibold" style={trackMode === 'milestones' ? 'color: var(--color-cat-goal);' : ''}>Milestones</span>
              <span class="block text-[11px] text-ink-soft">Auto from steps</span>
            </button>
          </div>
        </div>
      {/if}

      {#if writesInFullScreen}
        <div class="mb-4 flex items-center gap-2 rounded-xl bg-paper px-3.5 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDiary ? 'var(--color-cat-diary)' : isGoal ? 'var(--color-cat-goal)' : isTask ? 'var(--color-cat-task)' : 'var(--color-cat-note)'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
            <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
          </svg>
          <p class="text-[12px] text-ink-soft">
            {isTask
              ? "You'll add your tasks after saving."
              : isGoal
                ? "You'll set your progress and milestones after saving."
                : isDiary
                  ? "You'll write your entry in the full-screen editor after saving."
                  : "You'll write the note in the full-screen editor after saving."}
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
        <span class="mb-1 block text-[12px] font-semibold text-ink-soft">
          Folder <span class="font-normal">(optional)</span>
        </span>
        <button
          type="button"
          class="mb-4 flex w-full items-center justify-between rounded-xl border border-line bg-paper px-3.5 py-2.5 text-left text-[14px] active:bg-card"
          onclick={() => (showFolderPicker = true)}
        >
          <span class={folderId ? '' : 'text-ink-soft'}>
            {folderOptions.find((f) => f.id === folderId)?.name || 'No folder'}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-soft)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
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

{#if showEntryPicker}
  <DatePicker
    value={entryDate}
    max={todayISO}
    onset={(iso) => { entryDate = iso; showEntryPicker = false; }}
    oncancel={() => (showEntryPicker = false)}
    onclear={() => { entryDate = todayISO; showEntryPicker = false; }}
  />
{/if}
{#if showTargetPicker}
  <DatePicker
    value={targetDate}
    min={todayISO}
    onset={(iso) => { targetDate = iso; showTargetPicker = false; }}
    oncancel={() => (showTargetPicker = false)}
    onclear={() => { targetDate = ''; showTargetPicker = false; }}
  />
{/if}

{#if showFolderPicker}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 px-6 backdrop-blur-sm"
    onclick={(e) => e.target === e.currentTarget && (showFolderPicker = false)}
    role="presentation"
  >
    <div
      class="pop-in flex max-h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-card shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a folder"
    >
      <div class="px-6 py-4" style="background: var(--color-teal);">
        <p class="font-display text-xl font-bold text-white">Choose a folder</p>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto p-2">
        <button
          class="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-[15px] active:bg-paper"
          onclick={() => { folderId = ''; showFolderPicker = false; }}
        >
          <span class={folderId ? 'text-ink' : 'font-semibold text-teal'}>No folder</span>
          <span
            class="flex h-5 w-5 items-center justify-center rounded-full border-2"
            style={!folderId
              ? 'border-color: var(--color-teal);'
              : 'border-color: var(--color-line);'}
          >
            {#if !folderId}
              <span class="h-2.5 w-2.5 rounded-full" style="background: var(--color-teal);"></span>
            {/if}
          </span>
        </button>
        {#each folderOptions as f (f.id)}
          <button
            class="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-[15px] active:bg-paper"
            onclick={() => { folderId = f.id; showFolderPicker = false; }}
          >
            <span class={folderId === f.id ? 'font-semibold text-teal' : 'text-ink'}>{f.name}</span>
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
              style={folderId === f.id
                ? 'border-color: var(--color-teal);'
                : 'border-color: var(--color-line);'}
            >
              {#if folderId === f.id}
                <span class="h-2.5 w-2.5 rounded-full" style="background: var(--color-teal);"></span>
              {/if}
            </span>
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}
