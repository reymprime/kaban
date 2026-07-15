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

  // Diary-specific: entry date (defaults to today) and optional mood.
  const todayISO = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local
  let entryDate = $state(item.entryDate || todayISO);
  let mood = $state(item.mood || '');
  const MOODS = ['😊', '😌', '😐', '😔', '😤', '😢', '🥳', '😴'];

  // Goal-specific: required target date + how progress is tracked.
  let targetDate = $state(item.targetDate || '');
  let trackMode = $state(item.trackMode || 'slider');

  const isLink = $derived(type === 'link');
  const isDiary = $derived(type === 'diary');
  const isGoal = $derived(type === 'goal');
  // Diary and goal reuse the note flow: details are set here, the body/steps
  // are handled in the full-screen view after saving.
  const writesInFullScreen = $derived(
    type === 'note' || type === 'diary' || type === 'goal'
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
        {#if isDiary || isGoal}
          {@const cd = isDiary ? 'diary' : 'goal'}
          <div class="mb-4 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5" style="background: var(--color-cat-{cd}-soft);">
            <span class="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style="background: var(--color-cat-{cd}); color: #fff;">
              {isDiary ? 'Diary' : 'Goal'}
            </span>
            <p class="text-[12px]" style="color: var(--color-cat-{cd});">
              {isDiary ? 'New diary entry' : 'New goal'}
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
            <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="kb-date">
              Entry date
            </label>
            <input
              id="kb-date"
              type="date"
              bind:value={entryDate}
              max={todayISO}
              class="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] focus:border-teal focus:outline-none"
            />
          </div>
          <div>
            <span class="mb-1.5 block text-[12px] font-semibold text-ink-soft">
              How are you feeling? <span class="font-normal">(optional)</span>
            </span>
            <div class="flex flex-wrap gap-2">
              {#each MOODS as m}
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-xl border text-[20px] transition-all active:scale-90
                    {mood === m ? 'border-transparent' : 'border-line'}"
                  style={mood === m ? 'background: var(--color-cat-diary-soft);' : ''}
                  onclick={() => (mood = mood === m ? '' : m)}
                >
                  {m}
                </button>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      {#if isGoal}
        <div class="mb-4">
          <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="kb-target">
            Target date <span style="color: var(--color-cat-goal);">*</span>
          </label>
          <input
            id="kb-target"
            type="date"
            bind:value={targetDate}
            min={todayISO}
            class="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] focus:border-teal focus:outline-none"
          />
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDiary ? 'var(--color-cat-diary)' : isGoal ? 'var(--color-cat-goal)' : 'var(--color-cat-note)'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
            <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
          </svg>
          <p class="text-[12px] text-ink-soft">
            {isGoal
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
