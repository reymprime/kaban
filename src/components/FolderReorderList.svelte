<script>
  // Folder reorder — mirrors ReorderList.svelte's pointer-drag pattern so the
  // feel is identical to card reordering (auto-scroll, fixed row math, handle).
  const CAT_LABEL = {
    image: 'Image Prompts',
    video: 'Video Prompts',
    link: 'Stored Links',
    note: 'Notes',
    all: 'All types',
  };
  const CAT_COLOR = {
    image: 'var(--color-cat-image)',
    video: 'var(--color-cat-video)',
    link: 'var(--color-cat-link)',
    note: 'var(--color-cat-note)',
    all: 'var(--color-teal)',
  };

  let { folders, counts = {}, onsave, oncancel } = $props();

  const ROW = 64;

  let list = $state([...folders]);
  let dragIdx = $state(-1);
  let dragY = $state(0);
  let saving = $state(false);
  let startPointerY = 0;
  let startRowY = 0;
  let lastClientY = 0;
  let scrollRaf = null;

  const EDGE = 90;
  const MAX_SPEED = 14;

  function applyDrag() {
    const max = (list.length - 1) * ROW;
    dragY = Math.min(max, Math.max(0, startRowY + (lastClientY - startPointerY)));
    const target = Math.round(dragY / ROW);
    if (target !== dragIdx) {
      const [it] = list.splice(dragIdx, 1);
      list.splice(target, 0, it);
      dragIdx = target;
    }
  }

  function autoScroll() {
    if (dragIdx === -1) {
      scrollRaf = null;
      return;
    }
    const vh = window.innerHeight;
    let dy = 0;
    if (lastClientY < EDGE) {
      dy = -MAX_SPEED * ((EDGE - lastClientY) / EDGE);
    } else if (lastClientY > vh - EDGE) {
      dy = MAX_SPEED * ((lastClientY - (vh - EDGE)) / EDGE);
    }
    if (dy) {
      const before = window.scrollY;
      window.scrollBy(0, dy);
      const moved = window.scrollY - before;
      if (moved) {
        startPointerY -= moved;
        applyDrag();
      }
    }
    scrollRaf = requestAnimationFrame(autoScroll);
  }

  function down(e, idx) {
    e.preventDefault();
    dragIdx = idx;
    startPointerY = e.clientY;
    lastClientY = e.clientY;
    startRowY = idx * ROW;
    dragY = startRowY;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
    window.addEventListener('pointercancel', up, { once: true });
    if (!scrollRaf) scrollRaf = requestAnimationFrame(autoScroll);
  }

  function move(e) {
    lastClientY = e.clientY;
    applyDrag();
  }

  function up() {
    window.removeEventListener('pointermove', move);
    dragIdx = -1;
    if (scrollRaf) {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = null;
    }
  }

  async function save() {
    saving = true;
    await onsave(list.map((f) => f.id));
    saving = false;
  }
</script>

<!-- Sticky action bar -->
<div class="mb-3 flex items-center gap-2 rounded-2xl border border-line bg-card px-3 py-2.5">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round">
    <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </svg>
  <p class="flex-1 text-[13px] font-semibold">Re-Order Folders</p>
  <button
    class="rounded-xl border border-line px-3 py-2 text-[13px] font-semibold text-ink-soft active:bg-paper"
    onclick={oncancel}
  >
    Cancel
  </button>
  <button
    class="rounded-xl bg-teal px-4 py-2 text-[13px] font-semibold text-white active:opacity-90 disabled:opacity-50"
    disabled={saving}
    onclick={save}
  >
    Save Changes
  </button>
</div>
<p class="mb-2 text-[12px] text-ink-soft">
  Hold the <span class="font-semibold">≡ handle</span> and drag a folder to its new position.
</p>

<div class="relative" style="height: {list.length * ROW}px;">
  {#each list as f, i (f.id)}
    <div
      class="reorder-row absolute inset-x-0 flex items-center gap-3 rounded-xl border bg-card px-3
        {i === dragIdx ? 'dragging border-teal' : 'border-line'}"
      style="height: {ROW - 8}px; transform: translateY({i === dragIdx ? dragY : i * ROW}px);"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={CAT_COLOR[f.category] || 'var(--color-teal)'} class="shrink-0">
        <path d="M4 5a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.6.8l1.2 1.6a1 1 0 0 0 .8.4H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" />
      </svg>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-[13px] font-semibold">{f.name}</span>
        <span class="block truncate text-[11px] text-ink-soft">
          {CAT_LABEL[f.category] || 'All'} · {counts[f.id] || 0} card{(counts[f.id] || 0) === 1 ? '' : 's'}
        </span>
      </span>
      <!-- Drag handle -->
      <button
        class="flex h-10 w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-ink-soft active:bg-paper"
        aria-label="Drag to reorder {f.name}"
        onpointerdown={(e) => down(e, i)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M4 8h16M4 12h16M4 16h16" />
        </svg>
      </button>
    </div>
  {/each}
</div>
