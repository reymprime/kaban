<script>
  import { CATEGORIES } from '../lib/categories.js';
  import { htmlToText } from '../lib/richtext.js';

  let { items, onsave, oncancel } = $props();

  const ROW = 64; // fixed row height keeps the drag math + animations buttery

  let list = $state([...items]);
  let dragIdx = $state(-1);
  let dragY = $state(0);
  let saving = $state(false);
  let startPointerY = 0;
  let startRowY = 0;
  let lastClientY = 0;
  let scrollRaf = null;

  // Auto-scroll when dragging near the screen edges (like native apps)
  const EDGE = 90; // px zone at top/bottom that triggers scrolling
  const MAX_SPEED = 14; // px per frame at the very edge

  function preview(item) {
    const t = item.type === 'note' ? htmlToText(item.content) : item.content;
    return item.protected ? 'Protected content' : t;
  }

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
        // Page moved under the finger — keep the dragged card following it
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
    await onsave(list.map((i) => i.id));
    saving = false;
  }
</script>

<!-- Sticky action bar -->
<div class="mb-3 flex items-center gap-2 rounded-2xl border border-line bg-card px-3 py-2.5">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round">
    <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </svg>
  <p class="flex-1 text-[13px] font-semibold">Re-Order Cards</p>
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
  Hold the <span class="font-semibold">≡ handle</span> and drag a card to its new position.
</p>

<div class="relative" style="height: {list.length * ROW}px;">
  {#each list as item, i (item.id)}
    {@const cat = CATEGORIES[item.type]}
    <div
      class="reorder-row absolute inset-x-0 flex items-center gap-3 rounded-xl border bg-card px-3
        {i === dragIdx ? 'dragging border-teal' : 'border-line'}"
      style="height: {ROW - 8}px; transform: translateY({i === dragIdx ? dragY : i * ROW}px);"
    >
      <span
        class="h-8 w-1 shrink-0 rounded-full"
        style="background: {cat.color};"
      ></span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-[13px] font-semibold">{item.title}</span>
        <span class="block truncate text-[11px] text-ink-soft">{preview(item)}</span>
      </span>
      {#if item.pinned}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-teal)" class="shrink-0" aria-label="Pinned">
          <path d="M14.6 2.2a1.5 1.5 0 0 0-2.4.4L9.9 7.1l-4.6 1a1.5 1.5 0 0 0-.74 2.53l3.4 3.4-5 6.1a.75.75 0 0 0 1.06 1.05l6.1-5 3.4 3.4a1.5 1.5 0 0 0 2.52-.74l1-4.6 4.5-2.3a1.5 1.5 0 0 0 .4-2.4l-7.3-7.3Z" />
        </svg>
      {/if}
      <!-- Drag handle -->
      <button
        class="flex h-10 w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-ink-soft active:bg-paper"
        aria-label="Drag to reorder {item.title}"
        onpointerdown={(e) => down(e, i)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M4 8h16M4 12h16M4 16h16" />
        </svg>
      </button>
    </div>
  {/each}
</div>
