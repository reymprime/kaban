<script>
  import { lockScroll } from '../lib/scrollLock.js';
  import { saveItem, toast } from '../lib/store.svelte.js';
  import {
    goalProgress,
    isGoalDone,
    deadlineLabel,
    deadlineTone,
    newMilestone,
  } from '../lib/goals.js';

  let { item, onclose, onsaved } = $props();

  // Local working copies so edits feel instant; persisted on change.
  let progress = $state(item.progress || 0);
  let milestones = $state((item.milestones || []).map((m) => ({ ...m })));
  let newText = $state('');
  let celebrated = $state(false); // guards the confetti so it fires once

  const mode = item.trackMode || 'slider';
  const view = $derived({
    ...item,
    progress,
    milestones,
    trackMode: mode,
  });
  const pct = $derived(goalProgress(view));
  const done = $derived(pct >= 100);
  const countdown = $derived(deadlineLabel(item.targetDate));
  const tone = $derived(deadlineTone(view));

  const toneColor = $derived(
    tone === 'overdue'
      ? '#dc2626'
      : tone === 'soon'
        ? '#d97706'
        : tone === 'done'
          ? 'var(--color-cat-goal)'
          : 'var(--color-ink-soft)'
  );

  // Fire celebration once when crossing into 100%.
  $effect(() => {
    if (done && !celebrated) {
      celebrated = true;
      launchConfetti();
    }
    if (!done) celebrated = false;
  });

  async function persist(patch) {
    const status = (patch.progressValue ?? pct) >= 100 ? 'done' : 'active';
    const saved = await saveItem({
      id: item.id,
      type: 'goal',
      progress: mode === 'slider' ? progress : undefined,
      milestones: mode === 'milestones' ? milestones : undefined,
      status,
    });
    onsaved?.(saved);
  }

  function setProgress(v) {
    progress = Math.max(0, Math.min(100, Math.round(v)));
    persist({ progressValue: progress });
  }

  function toggleMilestone(id) {
    const m = milestones.find((x) => x.id === id);
    if (m) m.done = !m.done;
    persist({ progressValue: goalProgress({ ...view, milestones }) });
  }

  function addMilestone() {
    const t = newText.trim();
    if (!t) return;
    milestones.push(newMilestone(t));
    newText = '';
    persist({});
  }

  function removeMilestone(id) {
    milestones = milestones.filter((x) => x.id !== id);
    persist({ progressValue: goalProgress({ ...view, milestones }) });
  }

  // Lightweight confetti — no library, just DOM dots that fall and fade.
  function launchConfetti() {
    if (typeof document === 'undefined') return;
    const colors = ['#059669', '#34d399', '#fbbf24', '#f472b6', '#38bdf8'];
    const wrap = document.createElement('div');
    wrap.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden;';
    for (let i = 0; i < 60; i++) {
      const d = document.createElement('div');
      const size = 6 + Math.random() * 6;
      d.style.cssText = `position:absolute;top:-10px;left:${Math.random() * 100}%;width:${size}px;height:${size}px;background:${colors[i % colors.length]};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};opacity:0.9;`;
      const dur = 1600 + Math.random() * 1400;
      const x = (Math.random() - 0.5) * 160;
      d.animate(
        [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(${x}px, ${window.innerHeight + 40}px) rotate(${Math.random() * 720}deg)`,
            opacity: 0.9,
          },
        ],
        { duration: dur, easing: 'cubic-bezier(.3,.6,.6,1)' }
      );
      wrap.appendChild(d);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 3200);
  }
</script>

<div class="fixed inset-0 z-50 flex flex-col bg-paper" use:lockScroll>
  <!-- Header -->
  <div
    class="flex items-center justify-between border-b border-line px-4 py-3"
    style="padding-top: calc(0.75rem + env(safe-area-inset-top) * 0.4);"
  >
    <button
      class="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft active:bg-line"
      aria-label="Back"
      onclick={onclose}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
    <span class="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide" style="background: var(--color-cat-goal-soft); color: var(--color-cat-goal);">
      Goal
    </span>
  </div>

  <div class="flex-1 overflow-y-auto px-5 pb-24 pt-6">
    <h1 class="font-display text-2xl font-bold leading-tight">{item.title}</h1>
    {#if item.description}
      <p class="mt-1 text-[14px] text-ink-soft">{item.description}</p>
    {/if}

    <!-- Countdown -->
    <p class="mt-3 text-[13px] font-semibold" style="color: {toneColor};">
      {done ? '🎯 Achieved!' : countdown}
    </p>

    <!-- Progress ring/bar -->
    <div class="mt-6 rounded-2xl border border-line bg-card p-5">
      <div class="mb-2 flex items-end justify-between">
        <span class="font-display text-3xl font-bold" style="color: var(--color-cat-goal);">{pct}%</span>
        {#if done}
          <span class="pop-in rounded-full px-3 py-1 text-[12px] font-bold text-white" style="background: var(--color-cat-goal);">
            Goal achieved 🎉
          </span>
        {/if}
      </div>
      <div class="h-3 overflow-hidden rounded-full bg-paper">
        <div
          class="h-full rounded-full transition-all duration-500"
          style="width: {pct}%; background: linear-gradient(90deg, var(--color-cat-goal), #34d399);"
        ></div>
      </div>

      {#if mode === 'slider'}
        <div class="mt-5">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            oninput={(e) => setProgress(Number(e.target.value))}
            class="w-full accent-[#059669]"
          />
          <div class="mt-1 flex justify-between text-[11px] text-ink-soft">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Milestones -->
    {#if mode === 'milestones'}
      <div class="mt-6">
        <p class="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-ink-soft">
          Milestones {milestones.length ? `· ${milestones.filter((m) => m.done).length}/${milestones.length}` : ''}
        </p>
        <ul class="space-y-2">
          {#each milestones as m (m.id)}
            <li class="flex items-center gap-3 rounded-xl border border-line bg-card px-3.5 py-3">
              <button
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors"
                style={m.done
                  ? 'background: var(--color-cat-goal); border-color: var(--color-cat-goal);'
                  : 'border-color: var(--color-line);'}
                aria-label={m.done ? 'Mark undone' : 'Mark done'}
                onclick={() => toggleMilestone(m.id)}
              >
                {#if m.done}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                {/if}
              </button>
              <span class="flex-1 text-[14px] {m.done ? 'text-ink-soft line-through' : 'text-ink'}">{m.text}</span>
              <button
                class="shrink-0 text-ink-soft active:opacity-60"
                aria-label="Remove milestone"
                onclick={() => removeMilestone(m.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          {/each}
        </ul>

        <div class="mt-3 flex gap-2">
          <input
            type="text"
            bind:value={newText}
            placeholder="Add a milestone…"
            onkeydown={(e) => e.key === 'Enter' && addMilestone()}
            class="flex-1 rounded-xl border border-line bg-card px-3.5 py-2.5 text-[14px] focus:border-teal focus:outline-none"
          />
          <button
            class="shrink-0 rounded-xl px-4 text-[14px] font-semibold text-white active:opacity-90"
            style="background: var(--color-cat-goal);"
            onclick={addMilestone}
          >
            Add
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
