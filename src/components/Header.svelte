<script>
  import CreditModal from './CreditModal.svelte';

  let { query = $bindable(''), onbackup } = $props();
  let showCredits = $state(false);
</script>

<header class="px-4 pb-3 pt-4">
  <div class="mb-3 flex items-center justify-between">
    <button
      class="flex items-center gap-2.5 text-left active:opacity-70"
      aria-label="About Kaban"
      onclick={() => (showCredits = true)}
    >
      <div
        class="flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-white"
      >
        <!-- Keyhole vault mark -->
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 3a6 6 0 0 0-2.4 11.5l-1.1 5.3a1 1 0 0 0 1 1.2h5a1 1 0 0 0 1-1.2l-1.1-5.3A6 6 0 0 0 12 3Zm0 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
          />
        </svg>
      </div>
      <div>
        <h1 class="font-display text-xl font-bold leading-none tracking-tight">
          Kaban
        </h1>
        <p class="mt-0.5 text-[11px] font-medium text-ink-soft">
          Prompt vault by Gnokz
        </p>
      </div>
    </button>
    <button
      class="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-ink-soft transition-colors active:bg-line"
      aria-label="Backup and restore"
      onclick={onbackup}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3v12m0 0-4-4m4 4 4-4" />
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
    </button>
  </div>

  <div class="relative">
    <svg
      class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
    <input
      type="search"
      bind:value={query}
      placeholder="Search prompts, links, notes, tags…"
      class="w-full rounded-2xl border border-line bg-card py-2.5 pl-10 pr-4 text-[15px] placeholder:text-ink-soft/60 focus:border-teal focus:outline-none"
    />
  </div>
</header>

{#if showCredits}
  <CreditModal onclose={() => (showCredits = false)} />
{/if}
