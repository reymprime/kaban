<script>
  import { CATEGORIES } from '../lib/categories.js';
  import { detectPlatform, normalizeUrl, getYouTubeId, assessLinkRisk } from '../lib/platform.js';
  import { vault, copyText, togglePin, toggleLock, setProtection, toast } from '../lib/store.svelte.js';
  import { htmlToText } from '../lib/richtext.js';
  import { goalProgress, deadlineLabel, deadlineTone } from '../lib/goals.js';
  import { taskProgress, taskCounts } from '../lib/tasks.js';
  import { moodById } from '../lib/moods.js';
  import MoodIcon from './MoodIcon.svelte';
  import LinkWarningModal from './LinkWarningModal.svelte';

  let {
    item,
    selecting = false,
    isSelected = false,
    onedit,
    ondelete,
    onview,
    onwatch,
    onviewnote,
    onselectstart,
    ontoggleselect,
  } = $props();

  // Long-press detection (500ms) to enter selection mode.
  // Uses a movement threshold â€” fingers naturally jitter a few pixels,
  // so only real movement (scrolling) cancels the press.
  let pressTimer = null;
  let startX = 0;
  let startY = 0;
  let longPressFired = false;

  function pressStart(e) {
    startX = e.clientX;
    startY = e.clientY;
    longPressFired = false;
    // No long-press while selecting or while the Linked Notes panel is open
    if (selecting || showLinked) return;
    pressTimer = setTimeout(() => {
      longPressFired = true;
      onselectstart?.();
    }, 500);
  }
  function pressMove(e) {
    if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
      clearTimeout(pressTimer);
    }
  }
  function pressCancel() {
    clearTimeout(pressTimer);
  }
  // Swipe RIGHT on a Stored Link card â†’ reveal its Linked Notes.
  // Swipe left while the panel is open â†’ put it away.
  let swipeFired = false;
  function pressEnd(e) {
    pressCancel();
    if (selecting || item.type !== 'link') return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const horizontal = Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5;
    if (!horizontal) return;
    if (dx > 0 && !showLinked) {
      showLinked = true;
      swipeFired = true;
    } else if (dx < 0 && showLinked) {
      showLinked = false;
      swipeFired = true;
    }
  }
  // Swallow the click that fires on finger release after a long-press,
  // so it doesn't immediately toggle the fresh selection off
  function swallowClick(e) {
    if (longPressFired || swipeFired) {
      e.stopPropagation();
      e.preventDefault();
      longPressFired = false;
      swipeFired = false;
    }
  }

  const cat = $derived(CATEGORIES[item.type]);
  const locked = $derived(!!item.locked);
  const isProtected = $derived(!!item.protected);
  // Protected content is readable only while the vault is unlocked
  const accessible = $derived(
    !isProtected || (vault.security.unlocked && vault.plain[item.id] != null)
  );
  const contentText = $derived(
    isProtected ? (vault.plain[item.id] ?? '') : item.content
  );
  const platform = $derived(
    item.type === 'link' && accessible ? detectPlatform(contentText) : null
  );
  // YouTube links get a Watch button â€” null for everything else hides it
  const ytId = $derived(
    item.type === 'link' && accessible ? getYouTubeId(contentText) : null
  );

  // ---- Linked Notes (revealed by swiping left on the card) ----
  let showLinked = $state(false);
  const linkedNotes = $derived(
    item.type === 'link'
      ? vault.items.filter((n) => n.type === 'note' && n.linkedTo === item.id)
      : []
  );
  // Entering selection mode puts the panel away
  $effect(() => {
    if (selecting) showLinked = false;
  });

  function openLinkedNote(n) {
    if (n.protected && !(vault.security.unlocked && vault.plain[n.id] != null)) {
      return promptUnlock();
    }
    onviewnote?.(n);
  }

  // ---- Safe link opening ----
  // Normal links open straight to the browser. Only flagged (scam/ad-farm)
  // links show a warning first, so students aren't interrupted needlessly.
  let linkWarning = $state(null); // { url, host, reasons } | null

  function openLink() {
    const target = normalizeUrl(contentText);
    if (!target) return;
    const risk = assessLinkRisk(target);
    if (risk.suspicious) {
      linkWarning = {
        url: target,
        host: (detectPlatform(contentText)?.host) || target,
        reasons: risk.reasons,
      };
      return;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  function proceedToLink() {
    const target = linkWarning?.url;
    linkWarning = null;
    if (target) window.open(target, '_blank', 'noopener,noreferrer');
  }

  function notePreview(n) {
    if (n.protected) return 'Protected â€” encrypted note';
    return htmlToText(n.content).slice(0, 80);
  }
  // Links lose copy access when locked; prompts and notes keep copy
  const copyBlocked = $derived(locked && item.type === 'link');
  // Rich notes are stored as HTML â€” preview and copy use plain text
  const noteText = $derived(item.type === 'note' ? htmlToText(contentText) : '');
  const diaryText = $derived(item.type === 'diary' ? htmlToText(contentText) : '');
  // Friendly entry date like "Mon, Jul 14"
  const diaryDate = $derived.by(() => {
    if (item.type !== 'diary' || !item.entryDate) return '';
    const d = new Date(item.entryDate + 'T00:00:00');
    if (isNaN(d)) return '';
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  });

  // Goal card values
  const goalPct = $derived(item.type === 'goal' ? goalProgress(item) : 0);
  const goalDone = $derived(item.type === 'goal' && goalPct >= 100);
  const goalCountdown = $derived(item.type === 'goal' ? deadlineLabel(item.targetDate) : '');
  const goalTone = $derived(item.type === 'goal' ? deadlineTone(item) : 'normal');
  const goalToneColor = $derived(
    goalTone === 'overdue'
      ? '#dc2626'
      : goalTone === 'soon'
        ? '#d97706'
        : 'var(--color-ink-soft)'
  );

  // Task list card values
  const taskPct = $derived(item.type === 'task' ? taskProgress(item.tasks || []) : 0);
  const taskC = $derived(item.type === 'task' ? taskCounts(item.tasks || []) : { done: 0, total: 0, left: 0 });
  const taskAllDone = $derived(item.type === 'task' && taskC.total > 0 && taskC.left === 0);

  // Lock icon animation â€” re-keyed to replay CSS animation each press
  let anim = $state({ n: 0, type: '' });

  function promptUnlock() {
    vault.securityPrompt = vault.security.configured ? 'unlock' : 'setup';
  }

  async function handleShield() {
    if (!vault.security.configured) {
      vault.securityPrompt = 'setup';
      return;
    }
    if (!vault.security.unlocked) {
      vault.securityPrompt = 'unlock';
      return;
    }
    const turningOn = !item.protected;
    await setProtection(item, turningOn);
    anim = { n: anim.n + 1, type: 'lock-pop' };
    toast(turningOn ? 'Protected â€” encrypted with your vault password' : 'Protection removed');
  }

  async function handleCopy() {
    if (!accessible) return promptUnlock();
    if (copyBlocked) return denied();
    const ok = await copyText(item.type === 'note' ? noteText : contentText);
    toast(ok ? 'Copied to clipboard âœ“' : 'Copy failed â€” try again');
  }

  async function handlePin() {
    const nowPinned = !item.pinned;
    await togglePin(item);
    toast(nowPinned ? 'Pinned to top' : 'Unpinned');
  }

  async function handleLock() {
    const nowLocked = !item.locked;
    await toggleLock(item);
    anim = { n: anim.n + 1, type: 'lock-pop' };
    toast(nowLocked ? 'Locked â€” protected from changes' : 'Unlocked');
  }

  function denied() {
    anim = { n: anim.n + 1, type: 'lock-shake' };
    toast('Locked â€” unlock first to get access');
  }
</script>

<li
  class="relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-[scale,box-shadow] duration-100 active:scale-[0.99]
    {isSelected ? 'border-teal shadow-[0_0_0_2px_var(--color-teal)]' : locked ? 'border-ink/15' : 'border-line'}"
  style="border-left: 4px solid {isSelected ? 'var(--color-teal)' : cat.color}; --cat: {isSelected ? 'var(--color-teal)' : cat.color}; touch-action: pan-y;"
  onpointerdown={pressStart}
  onpointerup={pressEnd}
  onpointermove={pressMove}
  onpointerleave={pressCancel}
  onpointercancel={pressCancel}
  onclickcapture={swallowClick}
  oncontextmenu={(e) => e.preventDefault()}
>
  {#if selecting}
    <!-- Selection overlay: tap anywhere to toggle -->
    <button
      class="absolute inset-0 z-10"
      aria-label={isSelected ? 'Deselect card' : 'Select card'}
      onclick={ontoggleselect}
    ></button>
    <span
      class="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2
        {isSelected ? 'border-teal bg-teal text-white' : 'border-line bg-card text-transparent'}"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="m5 13 4 4L19 7" />
      </svg>
    </span>
  {/if}
  <div class="p-4 pb-3">
    <div class="mb-1.5 flex items-start justify-between gap-2">
      <div class="min-w-0">
        <div class="mb-1 flex flex-wrap items-center gap-1.5">
          <span
            class="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style="background: {cat.soft}; color: {cat.color};"
          >
            {cat.label}
          </span>
          {#if platform}
            <span
              class="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white"
              style="background: {platform.color};"
            >
              {platform.name}
            </span>
          {/if}
          {#if linkedNotes.length}
            <span
              class="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
              style="background: {cat.soft}; color: {cat.color};"
              aria-label="{linkedNotes.length} linked notes â€” swipe right to view"
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
              </svg>
              {linkedNotes.length}
            </span>
          {/if}
          {#if item.pinned}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-teal)" aria-label="Pinned">
              <path d="M14.6 2.2a1.5 1.5 0 0 0-2.4.4L9.9 7.1l-4.6 1a1.5 1.5 0 0 0-.74 2.53l3.4 3.4-5 6.1a.75.75 0 0 0 1.06 1.05l6.1-5 3.4 3.4a1.5 1.5 0 0 0 2.52-.74l1-4.6 4.5-2.3a1.5 1.5 0 0 0 .4-2.4l-7.3-7.3Z" />
            </svg>
          {/if}
        </div>
        <h3 class="truncate font-display text-[15px] font-semibold leading-snug">
          {item.title}
        </h3>
        {#if item.description}
          <p class="clamp-2 mt-0.5 text-[12px] italic text-ink-soft/90">
            {item.description}
          </p>
        {/if}
      </div>

      <div class="flex shrink-0 items-center">
        <!-- Shield (password protection) toggle -->
        <button
          class="rounded-lg p-1.5 transition-colors active:bg-line {isProtected ? 'text-teal' : 'text-ink-soft/60'}"
          aria-label={isProtected ? 'Remove protection' : 'Protect with vault password'}
          onclick={handleShield}
        >
          {#key anim.n}
            <span class="block {anim.type}">
              {#if isProtected}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 13.4-2.8-2.8 1.4-1.4 1.4 1.4 3.6-3.6 1.4 1.4-5 5Z" />
                </svg>
              {:else}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
                </svg>
              {/if}
            </span>
          {/key}
        </button>
        <!-- Lock toggle -->
        <button
          class="rounded-lg p-1.5 transition-colors active:bg-line {locked ? 'text-teal' : 'text-ink-soft/60'}"
          aria-label={locked ? 'Unlock' : 'Lock'}
          onclick={handleLock}
        >
          {#if locked}
            <!-- Closed padlock -->
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2.5" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              <circle cx="12" cy="16" r="1.3" fill="currentColor" stroke="none" />
            </svg>
          {:else}
            <!-- Open padlock -->
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2.5" />
              <path d="M8 11V7a4 4 0 0 1 7.6-1.8" />
            </svg>
          {/if}
        </button>
        <!-- Pin toggle -->
        <button
          class="rounded-lg p-1.5 transition-colors active:bg-line {item.pinned ? 'text-teal' : 'text-ink-soft/60'}"
          aria-label={item.pinned ? 'Unpin' : 'Pin to top'}
          onclick={handlePin}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={item.pinned ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 17v5M9 3h6l1 7 3 3H5l3-3 1-7Z" />
          </svg>
        </button>
      </div>
    </div>

    {#if !accessible}
      <div class="flex items-center gap-2.5 rounded-lg bg-paper p-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-teal)" class="shrink-0">
          <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 13.4-2.8-2.8 1.4-1.4 1.4 1.4 3.6-3.6 1.4 1.4-5 5Z" />
        </svg>
        <div>
          <p class="text-[13px] font-semibold text-ink">Protected</p>
          <p class="text-[11px] text-ink-soft">Content is encrypted &mdash; unlock the vault to view</p>
        </div>
      </div>
    {:else if item.type === 'link'}
      <p class="truncate text-[13px] text-ink-soft">{platform.host || contentText}</p>
    {:else if item.type === 'note'}
      <button class="block w-full text-left" onclick={onview} aria-label="Open note full screen">
        <p class="clamp-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
          {noteText}
        </p>
        <span class="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-cat-note">
          Read full note
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </span>
      </button>
    {:else if item.type === 'diary'}
      <button class="block w-full text-left" onclick={onview} aria-label="Open diary entry full screen">
        {#if diaryDate || item.mood}
          <div class="mb-1.5 flex items-center gap-2">
            {#if item.mood}
              {@const mo = moodById(item.mood)}
              {#if mo}
                <MoodIcon mood={mo.id} size={18} color={mo.color} />
              {/if}
            {/if}
            {#if diaryDate}
              <span class="rounded-md px-1.5 py-0.5 text-[11px] font-semibold" style="background: var(--color-cat-diary-soft); color: var(--color-cat-diary);">
                {diaryDate}
              </span>
            {/if}
          </div>
        {/if}
        <p class="clamp-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
          {diaryText || 'Empty entry â€” tap to write'}
        </p>
        <span class="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold" style="color: var(--color-cat-diary);">
          Open entry
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </span>
      </button>
    {:else if item.type === 'goal'}
      <button class="block w-full text-left" onclick={onview} aria-label="Open goal">
        <div class="mb-2 flex items-center justify-between">
          <span class="font-display text-xl font-bold" style="color: var(--color-cat-goal);">{goalPct}%</span>
          {#if goalDone}
            <span class="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style="background: var(--color-cat-goal);">Achieved ðŸŽ‰</span>
          {:else}
            <span class="text-[12px] font-semibold" style="color: {goalToneColor};">{goalCountdown}</span>
          {/if}
        </div>
        <div class="h-2.5 overflow-hidden rounded-full bg-paper">
          <div class="h-full rounded-full transition-all duration-500" style="width: {goalPct}%; background: linear-gradient(90deg, var(--color-cat-goal), #34d399);"></div>
        </div>
        {#if item.trackMode === 'milestones' && item.milestones?.length}
          <p class="mt-2 text-[12px] text-ink-soft">
            {item.milestones.filter((m) => m.done).length}/{item.milestones.length} milestones done
          </p>
        {/if}
      </button>
    {:else if item.type === 'task'}
      <button class="block w-full text-left" onclick={onview} aria-label="Open task list">
        {#if taskC.total}
          <div class="mb-2 flex items-center justify-between">
            <span class="text-[13px] font-semibold" style="color: var(--color-cat-task);">
              {taskC.done}/{taskC.total} done
            </span>
            {#if taskAllDone}
              <span class="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style="background: var(--color-cat-task);">All clear ðŸŽ‰</span>
            {:else}
              <span class="text-[12px] text-ink-soft">{taskC.left} left</span>
            {/if}
          </div>
          <div class="h-2.5 overflow-hidden rounded-full bg-paper">
            <div class="h-full rounded-full transition-all duration-500" style="width: {taskPct}%; background: linear-gradient(90deg, var(--color-cat-task), #22d3ee);"></div>
          </div>
        {:else}
          <p class="text-[13px] text-ink-soft">Empty list â€” tap to add tasks</p>
        {/if}
      </button>
    {:else}
      <p class="clamp-3 rounded-lg bg-paper p-2.5 font-mono text-[12px] leading-relaxed text-ink-soft">
        {contentText}
      </p>
    {/if}

    {#if item.tags.length}
      <div class="mt-2 flex flex-wrap gap-1">
        {#each item.tags as tag}
          <span class="rounded-md bg-paper px-1.5 py-0.5 text-[11px] text-ink-soft">
            #{tag}
          </span>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Action row -->
  <div class="mt-auto flex items-center border-t border-line">
    {#if !accessible}
      <button
        class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-teal transition-colors active:bg-paper"
        onclick={promptUnlock}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2.5" />
          <path d="M8 11V7a4 4 0 0 1 7.6-1.8" />
        </svg>
        Unlock to access
      </button>
    {:else}
    {#if item.type === 'link'}
      <button
        class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-cat-link transition-colors active:bg-paper"
        onclick={openLink}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
        </svg>
        Open
      </button>
      <div class="h-6 w-px bg-line"></div>
      {#if ytId}
        <!-- Watch (YouTube links only) -->
        <button
          class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-[#FF0033] transition-colors active:bg-paper"
          onclick={onwatch}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="m10 8.5 5 3.5-5 3.5v-7Z" fill="currentColor" stroke="none" />
          </svg>
          Watch
        </button>
        <div class="h-6 w-px bg-line"></div>
      {/if}
    {/if}

    <!-- Copy -->
    <button
      class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold transition-colors active:bg-paper
        {copyBlocked ? 'text-ink-soft/40' : 'text-teal'}"
      onclick={handleCopy}
    >
      {#if copyBlocked}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2.5" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      {/if}
      Copy
    </button>
    <div class="h-6 w-px bg-line"></div>

    <!-- Edit -->
    <button
      class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium transition-colors active:bg-paper
        {locked ? 'text-ink-soft/40' : 'text-ink-soft'}"
      onclick={locked ? denied : onedit}
    >
      {#if locked}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2.5" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
        </svg>
      {/if}
      Edit
    </button>
    <div class="h-6 w-px bg-line"></div>

    <!-- Delete -->
    <button
      class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium transition-colors active:bg-paper
        {locked ? 'text-ink-soft/40' : 'text-ink-soft'}"
      onclick={locked ? denied : ondelete}
    >
      {#if locked}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="11" width="16" height="10" rx="2.5" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
      {/if}
      Delete
    </button>
    {/if}
  </div>

  {#if showLinked && !selecting}
    <!-- Linked Notes panel: swiped in from the left, Stored Link blue -->
    <div class="slide-in-right absolute inset-0 z-10 flex flex-col bg-card">
      <div
        class="flex items-center justify-between border-b border-line px-4 py-2.5"
        style="background: {cat.soft};"
      >
        <div class="flex items-center gap-1.5" style="color: {cat.color};">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
            <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
          </svg>
          <p class="text-[13px] font-semibold">Linked Notes</p>
          {#if linkedNotes.length}
            <span
              class="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white"
              style="background: {cat.color};"
            >
              {linkedNotes.length}
            </span>
          {/if}
        </div>
        <span
          class="flex items-center gap-1 text-[11px] font-medium opacity-80"
          style="color: {cat.color};"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
          </svg>
          Swipe left to go back
        </span>
      </div>
      {#if linkedNotes.length}
        <ul class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-1.5">
          {#each linkedNotes as n (n.id)}
            <li>
              <button
                class="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors active:bg-paper"
                onclick={() => openLinkedNote(n)}
              >
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[13px] font-semibold">{n.title}</span>
                  <span class="block truncate text-[11px] text-ink-soft">{notePreview(n)}</span>
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="shrink-0" style="stroke: {cat.color};">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="flex flex-1 items-center justify-center px-6 py-4 text-center text-[12px] text-ink-soft">
          No linked notes yet â€” open a note's writer and tap "Link to"
        </p>
      {/if}
    </div>
  {/if}

  {#if linkWarning}
    <LinkWarningModal
      url={linkWarning.url}
      host={linkWarning.host}
      reasons={linkWarning.reasons}
      onproceed={proceedToLink}
      oncancel={() => (linkWarning = null)}
    />
  {/if}
</li>