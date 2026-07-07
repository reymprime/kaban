<script>
  import { deleteItem, toast } from '../lib/store.svelte.js';

  let { item, onclose } = $props();
  let busy = $state(false);

  async function confirm() {
    busy = true;
    await deleteItem(item.id);
    busy = false;
    toast('Deleted permanently');
    onclose();
  }

  function onBackdrop(e) {
    if (e.target === e.currentTarget) onclose();
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6"
  onclick={onBackdrop}
  role="presentation"
>
  <div
    class="pop-in w-full max-w-xs rounded-3xl bg-card p-5 text-center"
    role="alertdialog"
    aria-modal="true"
    aria-label="Confirm delete"
  >
    <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cat-video-soft">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-cat-video)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      </svg>
    </div>
    <h2 class="mb-1 font-display text-base font-bold">Delete “{item.title}”?</h2>
    <p class="mb-4 text-[13px] text-ink-soft">
      This removes it from your kaban permanently. There is no undo.
    </p>
    <div class="flex gap-2">
      <button
        class="flex-1 rounded-xl border border-line py-2.5 text-[14px] font-semibold text-ink-soft active:bg-paper"
        onclick={onclose}
      >
        Cancel
      </button>
      <button
        class="flex-1 rounded-xl py-2.5 text-[14px] font-semibold text-white active:opacity-90 disabled:opacity-50"
        style="background: var(--color-cat-video);"
        disabled={busy}
        onclick={confirm}
      >
        Delete
      </button>
    </div>
  </div>
</div>
