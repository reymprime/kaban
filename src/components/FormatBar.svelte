<script>
  let { onclose } = $props();

  let palette = $state(null); // 'color' | 'highlight' | 'size' | null

  const COLORS = [
    { v: '#16181D', label: 'Ink' },
    { v: '#0F766E', label: 'Teal' },
    { v: '#DC2626', label: 'Red' },
    { v: '#2563EB', label: 'Blue' },
    { v: '#D97706', label: 'Amber' },
    { v: '#7C3AED', label: 'Violet' },
  ];
  const HILITES = [
    { v: '#FEF08A', label: 'Yellow' },
    { v: '#BBF7D0', label: 'Green' },
    { v: '#FBCFE8', label: 'Pink' },
    { v: '#BFDBFE', label: 'Blue' },
    { v: 'transparent', label: 'None' },
  ];
  const SIZES = [
    { v: 2, label: 'Small' },
    { v: 3, label: 'Normal' },
    { v: 5, label: 'Large' },
    { v: 6, label: 'Huge' },
  ];

  function exec(cmd, val = null) {
    document.execCommand(cmd, false, val);
  }

  // preventDefault on pointerdown keeps the text selection + keyboard alive
  function pd(e) {
    e.preventDefault();
  }

  function togglePalette(name) {
    palette = palette === name ? null : name;
  }
</script>

<div class="border-t border-line bg-card">
  {#if palette === 'color'}
    <div class="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-line px-3 py-2">
      {#each COLORS as c (c.v)}
        <button
          class="h-7 w-7 shrink-0 rounded-full border-2 border-line"
          style="background: {c.v};"
          aria-label="Text color {c.label}"
          onpointerdown={pd}
          onclick={() => {
            exec('foreColor', c.v);
            palette = null;
          }}
        ></button>
      {/each}
    </div>
  {:else if palette === 'highlight'}
    <div class="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-line px-3 py-2">
      {#each HILITES as c (c.v)}
        <button
          class="flex h-7 shrink-0 items-center rounded-full border-2 border-line px-2.5 text-[11px] font-semibold text-ink"
          style="background: {c.v};"
          aria-label="Highlight {c.label}"
          onpointerdown={pd}
          onclick={() => {
            exec('hiliteColor', c.v);
            palette = null;
          }}
        >
          {c.label}
        </button>
      {/each}
    </div>
  {:else if palette === 'size'}
    <div class="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-line px-3 py-2">
      {#each SIZES as s (s.v)}
        <button
          class="shrink-0 rounded-full border border-line px-3 py-1 font-semibold text-ink active:bg-paper"
          style="font-size: {10 + s.v * 2}px;"
          aria-label="Text size {s.label}"
          onpointerdown={pd}
          onclick={() => {
            exec('fontSize', String(s.v));
            palette = null;
          }}
        >
          {s.label}
        </button>
      {/each}
    </div>
  {/if}

  <div class="flex items-center gap-0.5 px-2 py-1.5">
    <button
      class="flex h-9 w-9 items-center justify-center rounded-lg font-display text-[16px] font-extrabold text-ink active:bg-paper"
      aria-label="Bold"
      onpointerdown={pd}
      onclick={() => exec('bold')}
    >
      B
    </button>
    <button
      class="flex h-9 w-9 items-center justify-center rounded-lg font-display text-[16px] font-bold italic text-ink active:bg-paper"
      aria-label="Italic"
      onpointerdown={pd}
      onclick={() => exec('italic')}
    >
      I
    </button>
    <button
      class="flex h-9 w-9 items-center justify-center rounded-lg font-display text-[16px] font-bold text-ink underline underline-offset-2 active:bg-paper"
      aria-label="Underline"
      onpointerdown={pd}
      onclick={() => exec('underline')}
    >
      U
    </button>
    <button
      class="flex h-9 w-9 items-center justify-center rounded-lg font-display text-[16px] font-bold text-ink line-through active:bg-paper"
      aria-label="Strikethrough"
      onpointerdown={pd}
      onclick={() => exec('strikeThrough')}
    >
      S
    </button>

    <!-- Highlight -->
    <button
      class="flex h-9 w-9 items-center justify-center rounded-lg active:bg-paper {palette === 'highlight' ? 'bg-teal-soft text-teal' : 'text-ink'}"
      aria-label="Highlight color"
      onpointerdown={pd}
      onclick={() => togglePalette('highlight')}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 11 6-6 4 4-6 6H9v-4Z" />
        <path d="m14 6-2-2-8 8v4h4l2-2" />
        <path d="M3 21h18" />
      </svg>
    </button>

    <!-- Text color -->
    <button
      class="relative flex h-9 w-9 items-center justify-center rounded-lg font-display text-[15px] font-extrabold active:bg-paper {palette === 'color' ? 'bg-teal-soft text-teal' : 'text-ink'}"
      aria-label="Text color"
      onpointerdown={pd}
      onclick={() => togglePalette('color')}
    >
      A
      <span
        class="absolute bottom-1.5 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full"
        style="background: linear-gradient(90deg, #DC2626, #D97706, #0F766E, #2563EB, #7C3AED);"
      ></span>
    </button>

    <!-- Text size -->
    <button
      class="flex h-9 w-9 items-end justify-center gap-0.5 rounded-lg pb-1.5 font-display font-extrabold active:bg-paper {palette === 'size' ? 'bg-teal-soft text-teal' : 'text-ink'}"
      aria-label="Text size"
      onpointerdown={pd}
      onclick={() => togglePalette('size')}
    >
      <span class="text-[11px] leading-none">т</span><span class="text-[16px] leading-none">T</span>
    </button>

    <span class="flex-1"></span>

    <button
      class="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft active:bg-paper"
      aria-label="Hide formatting bar"
      onpointerdown={pd}
      onclick={onclose}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  </div>
</div>
