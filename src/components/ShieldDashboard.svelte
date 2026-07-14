<script>
  // Shield Dashboard — the student-facing controls for the Privacy &
  // Data-Saving Shield. Drop this into SettingsModal (or anywhere).
  import {
    shield,
    toggleShield,
    resetShieldStats,
    formatBytes,
  } from '../lib/shield.svelte.js';

  let { tapFeedback = () => {} } = $props();

  function onToggle() {
    toggleShield();
    tapFeedback();
  }
</script>

<section class="rounded-2xl border border-line bg-paper p-4">
  <div class="flex items-start justify-between gap-3">
    <div class="flex items-center gap-2.5">
      <!-- Shield glyph -->
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors"
        class:bg-teal-soft={shield.enabled}
        class:bg-line={!shield.enabled}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={shield.enabled ? 'var(--color-teal)' : 'var(--color-ink-soft)'}
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3 5 6v5c0 4.2 2.8 7.5 7 9 4.2-1.5 7-4.8 7-9V6l-7-3Z" />
          {#if shield.enabled}<path d="m9 12 2 2 4-4" />{/if}
        </svg>
      </span>
      <div>
        <p class="font-display text-[15px] font-semibold leading-tight">Privacy Shield</p>
        <p class="text-[12px] text-ink-soft">
          {shield.enabled ? 'Blocking trackers & saving data' : 'Off — trackers can load'}
        </p>
      </div>
    </div>

    <!-- Toggle -->
    <button
      role="switch"
      aria-checked={shield.enabled}
      aria-label="Toggle Privacy Shield"
      onclick={onToggle}
      class="relative h-7 w-12 shrink-0 rounded-full transition-colors"
      class:bg-teal={shield.enabled}
      class:bg-line={!shield.enabled}
    >
      <span
        class="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
        style="left: 0.125rem; transform: translateX({shield.enabled ? '1.25rem' : '0'});"
      ></span>
    </button>
  </div>

  <!-- Stats -->
  <div class="mt-4 grid grid-cols-2 gap-2">
    <div class="rounded-xl bg-card px-3 py-2.5">
      <p class="font-display text-xl font-bold leading-none text-teal">
        {formatBytes(shield.bytes)}
      </p>
      <p class="mt-1 text-[11px] text-ink-soft">Data saved (est.)</p>
    </div>
    <div class="rounded-xl bg-card px-3 py-2.5">
      <p class="font-display text-xl font-bold leading-none text-teal">
        {shield.blocked.toLocaleString()}
      </p>
      <p class="mt-1 text-[11px] text-ink-soft">Trackers blocked</p>
    </div>
  </div>

  <div class="mt-3 flex items-center justify-between">
    <p class="text-[11px] leading-snug text-ink-soft">
      Turn off if a research site won't load correctly.
    </p>
    {#if shield.blocked > 0}
      <button
        class="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-ink-soft active:bg-line"
        onclick={resetShieldStats}
      >
        Reset
      </button>
    {/if}
  </div>
</section>
