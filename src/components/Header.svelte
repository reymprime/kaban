<script>
  import CreditModal from './CreditModal.svelte';
  import { vault, lockNow, setTheme, toast } from '../lib/store.svelte.js';

  let { query = $bindable(''), onbackup, onsettings } = $props();
  let showCredits = $state(false);

  function themeTap() {
    setTheme(vault.isDark ? 'light' : 'dark');
  }

  function shieldTap() {
    if (!vault.security.configured) {
      vault.securityPrompt = 'setup';
    } else if (!vault.security.unlocked) {
      vault.securityPrompt = 'unlock';
    } else {
      lockNow();
      toast('Vault locked');
    }
  }
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
          Personal Vault by Reymark
        </p>
      </div>
    </button>
    <div class="flex items-center gap-1.5">
      <button
        class="icon-btn flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-ink-soft transition-colors active:bg-line"
        id="tour-settings"
        aria-label="Settings"
        onclick={onsettings}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08A1.7 1.7 0 0 0 10.1 3.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.03Z" />
        </svg>
      </button>
      <button
        class="icon-btn flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-ink-soft transition-colors active:bg-line"
        id="tour-theme"
        aria-label={vault.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onclick={themeTap}
      >
        {#if vault.isDark}
          <!-- Sun -->
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        {:else}
          <!-- Moon -->
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
          </svg>
        {/if}
      </button>
      <button
        class="icon-btn flex h-9 w-9 items-center justify-center rounded-xl border transition-colors active:bg-line
          {vault.security.unlocked ? 'border-teal bg-teal-soft text-teal' : 'border-line bg-card text-ink-soft'}"
        id="tour-shield"
        aria-label={!vault.security.configured
          ? 'Set vault password'
          : vault.security.unlocked
            ? 'Lock vault'
            : 'Unlock vault'}
        onclick={shieldTap}
      >
        {#if vault.security.unlocked}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 13.4-2.8-2.8 1.4-1.4 1.4 1.4 3.6-3.6 1.4 1.4-5 5Z" />
          </svg>
        {:else}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
          </svg>
        {/if}
      </button>
      <button
        class="icon-btn flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-ink-soft transition-colors active:bg-line"
        id="tour-backup"
        aria-label="Backup and restore"
        onclick={onbackup}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v12m0 0-4-4m4 4 4-4" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      </button>
    </div>
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
      id="tour-search"
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
