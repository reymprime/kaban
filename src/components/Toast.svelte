<script>
  import { vault } from '../lib/store.svelte.js';

  // Any toast message containing "✓" gets a real icon instead of the glyph
  const hasCheck = $derived((vault.toast || '').includes('✓'));
  const text = $derived((vault.toast || '').replace('✓', '').trim());
</script>

{#if vault.toast}
  <div
    class="toast-in pointer-events-none fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink py-2 pl-3 pr-4 text-[13px] font-medium text-paper shadow-lg"
    role="status"
    aria-live="polite"
  >
    {#if hasCheck}
      <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m5 13 4 4L19 7" />
        </svg>
      </span>
    {:else}
      <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper/15">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M12 8v5m0 3.5v.5" />
        </svg>
      </span>
    {/if}
    {text}
  </div>
{/if}
