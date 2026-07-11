<script>
  import { lockScroll } from '../lib/scrollLock.js';
  import * as db from '../lib/db.js';

  let { onclose } = $props();

  const steps = [
    {
      center: true,
      title: 'Welcome to Kaban',
      text: 'Your personal vault for AI prompts, links, and notes. Quick tour? It takes 30 seconds.',
      btn: 'Start the tour',
    },
    {
      target: '#tour-fab',
      title: 'Create anything',
      text: 'Tap + to add prompt cards, notes, links, and folders. This is where everything begins.',
    },
    {
      target: '#tour-tabs',
      title: 'Your categories',
      text: 'Image Prompts, Video Prompts, Stored Links, Notes — and a dedicated home for your Folders.',
    },
    {
      target: '#tour-search',
      title: 'Find anything instantly',
      text: 'Search across titles, content, and tags — even cards tucked inside folders.',
    },
    {
      target: '#tour-shield',
      title: 'Real encryption',
      text: 'Set a vault password here to protect sensitive cards with AES-256 encryption.',
    },
    {
      target: '#tour-theme',
      title: 'Dark & light mode',
      text: 'Switch themes anytime — watch for the wave.',
    },
    {
      target: '#tour-backup',
      title: 'Your insurance',
      text: 'Export a backup regularly. Restore merges safely — nothing ever gets wiped.',
    },
    {
      center: true,
      title: 'One more power move',
      text: 'Long-press any card to select several at once — then Share them, Move them to folders, or Re-Order your vault.',
      btn: 'Got it',
    },
    {
      center: true,
      finale: true,
      title: 'You are always welcome to Kaban',
      text: 'Start creating now — your first prompt is one tap away. A full written guide also lives in your Notes.',
      btn: 'Start Creating',
    },
  ];

  let idx = $state(0);
  let rect = $state(null);

  function measure() {
    const s = steps[idx];
    if (!s.target) {
      rect = null;
      return;
    }
    const el = document.querySelector(s.target);
    if (!el) {
      next(); // element not on screen — skip gracefully
      return;
    }
    const r = el.getBoundingClientRect();
    rect = { x: r.left, y: r.top, w: r.width, h: r.height };
  }

  $effect(() => {
    idx;
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

  function next() {
    if (idx >= steps.length - 1) finish();
    else idx++;
  }

  async function finish() {
    try {
      await db.putMeta({ key: 'tutorial', done: true, at: Date.now() });
    } catch {}
    onclose();
  }

  const step = $derived(steps[idx]);
  // Tooltip goes below the target unless the target sits in the lower half
  const below = $derived(rect ? rect.y + rect.h / 2 < window.innerHeight / 2 : true);
</script>

<div class="fixed inset-0 z-[70]"
  use:lockScroll role="dialog" aria-modal="true" aria-label="Kaban tutorial">
  {#if rect}
    <!-- Spotlight: a hole in the dark using a giant shadow -->
    <div
      class="tour-spot absolute rounded-2xl"
      style="left: {rect.x - 8}px; top: {rect.y - 8}px;
        width: {rect.w + 16}px; height: {rect.h + 16}px;"
    ></div>

    <!-- Tooltip card -->
    <div
      class="pop-in absolute left-1/2 w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-card p-4 shadow-xl"
      style={below
        ? `top: ${rect.y + rect.h + 20}px;`
        : `bottom: ${window.innerHeight - rect.y + 20}px;`}
    >
      <p class="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-teal">
        {idx} of {steps.length - 2}
      </p>
      <h3 class="mb-1 font-display text-[16px] font-bold">{step.title}</h3>
      <p class="mb-3 text-[13px] leading-relaxed text-ink-soft">{step.text}</p>
      <div class="flex items-center justify-between">
        <button
          class="rounded-lg px-2 py-1.5 text-[12px] font-semibold text-ink-soft active:bg-paper"
          onclick={finish}
        >
          Skip Tutorial
        </button>
        <button
          class="rounded-xl bg-teal px-4 py-2 text-[13px] font-semibold text-white active:opacity-90"
          onclick={next}
        >
          Okay, next
        </button>
      </div>
    </div>
  {:else}
    <!-- Centered card (intro / info / finale) -->
    <div class="absolute inset-0 bg-ink/65"></div>
    <div class="absolute inset-0 flex items-center justify-center px-6">
      <div class="pop-in w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-xl">
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl {step.finale ? 'bg-teal' : 'bg-teal-soft'}">
          <svg width="26" height="26" viewBox="0 0 24 24" fill={step.finale ? 'white' : 'var(--color-teal)'}>
            <path d="M12 3a6 6 0 0 0-2.4 11.5l-1.1 5.3a1 1 0 0 0 1 1.2h5a1 1 0 0 0 1-1.2l-1.1-5.3A6 6 0 0 0 12 3Zm0 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
          </svg>
        </div>
        <h3 class="mb-1.5 font-display text-lg font-bold">{step.title}</h3>
        <p class="mb-4 text-[13px] leading-relaxed text-ink-soft">{step.text}</p>
        <button
          class="w-full rounded-xl bg-teal py-3 text-[14px] font-semibold text-white active:opacity-90"
          onclick={next}
        >
          {step.btn}
        </button>
        {#if !step.finale}
          <button
            class="mt-2 w-full rounded-xl py-2 text-[13px] font-semibold text-ink-soft active:bg-paper"
            onclick={finish}
          >
            Skip Tutorial
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>
