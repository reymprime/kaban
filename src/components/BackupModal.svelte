<script>
  import { vault, exportBackup, importBackup, toast } from '../lib/store.svelte.js';

  let { onclose } = $props();
  let fileInput = $state(null);
  let busy = $state(false);

  function handleExport() {
    if (!vault.items.length) {
      toast('Nothing to back up yet');
      return;
    }
    exportBackup();
    toast('Backup downloaded ✓');
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    busy = true;
    try {
      const { added, updated } = await importBackup(file);
      toast(`Restored: ${added} added, ${updated} updated ✓`);
      onclose();
    } catch (err) {
      toast(err.message || 'Import failed');
    } finally {
      busy = false;
      e.target.value = '';
    }
  }

  function onBackdrop(e) {
    if (e.target === e.currentTarget) onclose();
  }
</script>

<div
  class="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 sm:items-center"
  onclick={onBackdrop}
  role="presentation"
>
  <div
    class="pop-in w-full max-w-lg rounded-t-3xl bg-card p-5 sm:rounded-3xl"
    role="dialog"
    aria-modal="true"
    aria-label="Backup and restore"
    style="padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));"
  >
    <div class="mb-1 flex items-center justify-between">
      <h2 class="font-display text-lg font-bold">Backup &amp; Restore</h2>
      <button
        class="rounded-lg p-1.5 text-ink-soft active:bg-line"
        aria-label="Close"
        onclick={onclose}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
    <p class="mb-4 text-[13px] text-ink-soft">
      {vault.items.length} item{vault.items.length === 1 ? '' : 's'} in your kaban.
      Export a JSON file to keep your vault safe, or restore from a previous backup.
      Restore merges — nothing gets wiped.
    </p>

    <div class="flex flex-col gap-2">
      <button
        class="flex items-center justify-center gap-2 rounded-xl bg-teal py-3 text-[14px] font-semibold text-white active:opacity-90"
        onclick={handleExport}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        Export backup (JSON)
      </button>
      <button
        class="flex items-center justify-center gap-2 rounded-xl border border-line py-3 text-[14px] font-semibold text-ink active:bg-paper disabled:opacity-50"
        disabled={busy}
        onclick={() => fileInput.click()}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 21V9m0 0 4 4m-4-4-4 4M4 3h16" />
        </svg>
        {busy ? 'Restoring…' : 'Restore from file'}
      </button>
      <input
        type="file"
        accept="application/json,.json,.txt,text/plain"
        class="hidden"
        bind:this={fileInput}
        onchange={handleImport}
      />
    </div>
  </div>
</div>
