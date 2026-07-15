<script>
  import { lockScroll } from '../lib/scrollLock.js';
  import { saveItem } from '../lib/store.svelte.js';
  import {
    PRIORITIES,
    newTask,
    taskProgress,
    taskCounts,
    sortTasks,
    dueLabel,
    dueTone,
    openP1Count,
  } from '../lib/tasks.js';

  let { item, onclose, onsaved } = $props();

  let tasks = $state((item.tasks || []).map((t) => ({ ...t })));
  let newText = $state('');
  let newPriority = $state(2);
  let editingDue = $state(null); // task id whose due-date picker is open
  let celebrated = $state(false);

  const sorted = $derived(sortTasks(tasks));
  const pct = $derived(taskProgress(tasks));
  const counts = $derived(taskCounts(tasks));
  const p1open = $derived(openP1Count(tasks));
  const allDone = $derived(counts.total > 0 && counts.left === 0);

  // Gentle celebration when the whole list is cleared.
  $effect(() => {
    if (allDone && !celebrated) {
      celebrated = true;
      burst();
    }
    if (!allDone) celebrated = false;
  });

  async function persist() {
    const saved = await saveItem({ id: item.id, type: 'task', tasks });
    onsaved?.(saved);
  }

  function addTask() {
    const t = newText.trim();
    if (!t) return;
    tasks.push(newTask(t, newPriority));
    newText = '';
    persist();
  }

  function toggle(id) {
    const t = tasks.find((x) => x.id === id);
    if (t) t.done = !t.done;
    persist();
  }

  function remove(id) {
    tasks = tasks.filter((x) => x.id !== id);
    if (editingDue === id) editingDue = null;
    persist();
  }

  function cyclePriority(id) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    t.priority = t.priority === 3 ? 1 : t.priority + 1;
    persist();
  }

  function setDue(id, value) {
    const t = tasks.find((x) => x.id === id);
    if (t) t.due = value || null;
    editingDue = null;
    persist();
  }

  // Clear finished tasks in one tap — anti-hoarding.
  function clearDone() {
    tasks = tasks.filter((t) => !t.done);
    persist();
  }

  function dueColor(due) {
    const tone = dueTone(due);
    return tone === 'overdue' ? '#dc2626' : tone === 'soon' ? '#d97706' : 'var(--color-ink-soft)';
  }

  function burst() {
    if (typeof document === 'undefined') return;
    const colors = ['#0891b2', '#22d3ee', '#34d399', '#fbbf24'];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden;';
    for (let i = 0; i < 40; i++) {
      const d = document.createElement('div');
      const s = 6 + Math.random() * 5;
      d.style.cssText = `position:absolute;top:-10px;left:${Math.random() * 100}%;width:${s}px;height:${s}px;background:${colors[i % colors.length]};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};`;
      d.animate(
        [
          { transform: 'translateY(0) rotate(0)', opacity: 1 },
          { transform: `translate(${(Math.random() - 0.5) * 140}px, ${window.innerHeight + 40}px) rotate(${Math.random() * 720}deg)`, opacity: 0.9 },
        ],
        { duration: 1500 + Math.random() * 1200, easing: 'cubic-bezier(.3,.6,.6,1)' }
      );
      wrap.appendChild(d);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 3000);
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
    <span class="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide" style="background: var(--color-cat-task-soft); color: var(--color-cat-task);">
      Task List
    </span>
  </div>

  <div class="flex-1 overflow-y-auto px-5 pb-28 pt-6">
    <h1 class="font-display text-2xl font-bold leading-tight">{item.title}</h1>
    {#if item.description}
      <p class="mt-1 text-[14px] text-ink-soft">{item.description}</p>
    {/if}

    <!-- Progress -->
    {#if counts.total}
      <div class="mt-4">
        <div class="mb-1.5 flex items-center justify-between text-[12px]">
          <span class="font-semibold" style="color: var(--color-cat-task);">
            {counts.done}/{counts.total} done
          </span>
          {#if allDone}
            <span class="font-bold" style="color: var(--color-cat-task);">All clear! 🎉</span>
          {:else}
            <span class="text-ink-soft">{counts.left} left</span>
          {/if}
        </div>
        <div class="h-2.5 overflow-hidden rounded-full bg-card">
          <div class="h-full rounded-full transition-all duration-500" style="width: {pct}%; background: linear-gradient(90deg, var(--color-cat-task), #22d3ee);"></div>
        </div>
      </div>
    {/if}

    <!-- Gentle Rule-of-3 hint -->
    {#if p1open > 3}
      <div class="mt-3 flex items-center gap-2 rounded-xl px-3.5 py-2.5" style="background: #fef3c7;">
        <span class="text-[15px]">💡</span>
        <p class="text-[12px]" style="color: #92400e;">
          You have {p1open} urgent tasks. Try keeping today's must-dos to 3 — the rest can wait.
        </p>
      </div>
    {/if}

    <!-- Task list -->
    <ul class="mt-4 space-y-2">
      {#each sorted as t (t.id)}
        {@const pr = PRIORITIES[t.priority] || PRIORITIES[2]}
        <li class="rounded-xl border border-line bg-card px-3 py-2.5">
          <div class="flex items-center gap-2.5">
            <!-- Checkbox -->
            <button
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors"
              style={t.done
                ? 'background: var(--color-cat-task); border-color: var(--color-cat-task);'
                : 'border-color: var(--color-line);'}
              aria-label={t.done ? 'Mark undone' : 'Mark done'}
              onclick={() => toggle(t.id)}
            >
              {#if t.done}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              {/if}
            </button>

            <span class="flex-1 text-[14px] {t.done ? 'text-ink-soft line-through' : 'text-ink'}">{t.text}</span>

            <!-- Priority chip (tap to cycle) -->
            <button
              class="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
              style="background: {pr.soft}; color: {pr.color};"
              onclick={() => cyclePriority(t.id)}
              aria-label="Change priority"
            >
              {pr.label}
            </button>

            <!-- Remove -->
            <button
              class="shrink-0 text-ink-soft active:opacity-60"
              aria-label="Remove task"
              onclick={() => remove(t.id)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Due row -->
          <div class="mt-1.5 flex items-center gap-2" style="padding-left: 2.15rem;">
            {#if editingDue === t.id}
              <input
                type="date"
                value={t.due || ''}
                onchange={(e) => setDue(t.id, e.target.value)}
                class="rounded-lg border border-line bg-paper px-2 py-1 text-[12px] focus:border-teal focus:outline-none"
              />
              <button class="text-[12px] text-ink-soft underline" onclick={() => setDue(t.id, '')}>Clear</button>
            {:else if t.due}
              <button class="flex items-center gap-1 text-[12px] font-medium" style="color: {dueColor(t.due)};" onclick={() => (editingDue = t.id)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {dueLabel(t.due)}
              </button>
            {:else}
              <button class="text-[12px] text-ink-soft active:opacity-60" onclick={() => (editingDue = t.id)}>
                + Add due date
              </button>
            {/if}
          </div>
        </li>
      {/each}
    </ul>

    {#if counts.done > 0}
      <button
        class="mt-4 w-full rounded-xl border border-line py-2.5 text-[13px] font-semibold text-ink-soft active:bg-card"
        onclick={clearDone}
      >
        Clear {counts.done} completed
      </button>
    {/if}

    {#if !counts.total}
      <p class="mt-10 text-center text-[14px] text-ink-soft">
        No tasks yet — add your first one below.
      </p>
    {/if}
  </div>

  <!-- Add bar -->
  <div
    class="border-t border-line bg-card px-4 py-3"
    style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));"
  >
    <div class="mb-2 flex gap-1.5">
      {#each Object.entries(PRIORITIES) as [key, pr] (key)}
        <button
          class="flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all"
          style={Number(key) === newPriority
            ? `background: ${pr.color}; color: #fff;`
            : `background: ${pr.soft}; color: ${pr.color};`}
          onclick={() => (newPriority = Number(key))}
        >
          {pr.label} · {pr.name}
        </button>
      {/each}
    </div>
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={newText}
        placeholder="Add a task…"
        onkeydown={(e) => e.key === 'Enter' && addTask()}
        class="flex-1 rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] focus:border-teal focus:outline-none"
      />
      <button
        class="shrink-0 rounded-xl px-5 text-[14px] font-semibold text-white active:opacity-90"
        style="background: var(--color-cat-task);"
        onclick={addTask}
      >
        Add
      </button>
    </div>
  </div>
</div>
