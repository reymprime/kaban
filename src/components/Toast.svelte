<script>
  import { vault } from '../lib/store.svelte.js';
</script>

{#if vault.toast}
  <div
    class="toast-in pointer-events-none fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper shadow-lg"
    role="status"
    aria-live="polite"
  >
    {vault.toast}
  </div>
{/if}
