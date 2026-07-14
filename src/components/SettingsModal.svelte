<script>
  import { lockScroll } from '../lib/scrollLock.js';
  import { vault, saveSettings, tapFeedback } from '../lib/store.svelte.js';
  import ShieldDashboard from './ShieldDashboard.svelte';

  let { onclose } = $props();

  const HAPTICS = [
    { id: 'off', label: 'Off' },
    { id: 'light', label: 'Light' },
    { id: 'medium', label: 'Medium' },
    { id: 'strong', label: 'Strong' },
  ];

  function setHaptic(id) {
    saveSettings({ haptic: id });
    tapFeedback(); // instant preview
  }

  function setSound(on) {
    saveSettings({ sound: on });
    if (on) tapFeedback();
  }

  function setVolume(e) {
    saveSettings({ volume: Number(e.target.value) / 100 });
  }

  function onBackdrop(e) {
    if (e.target === e.currentTarget) onclose();
  }
</script>

<div
  class="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 sm:items-center"
  use:lockScroll
  onclick={onBackdrop}
  role="presentation"
>
  <div
    class="pop-in w-full max-w-lg rounded-t-3xl bg-card p-5 sm:rounded-3xl"
    role="dialog"
    aria-modal="true"
    aria-label="Settings"
    style="padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));"
  >
    <div class="mb-4 flex items-center justify-between">
      <h2 class="font-display text-lg font-bold">Settings</h2>
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

    <!-- Privacy Shield -->
    <div class="mb-5">
      <ShieldDashboard {tapFeedback} />
    </div>

    <!-- Haptic feedback -->
    <div class="mb-1 flex items-center gap-2">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="7" y="2" width="10" height="20" rx="2.5" />
        <path d="M2 8v8M22 8v8" />
      </svg>
      <p class="text-[13px] font-semibold">Vibration on tap</p>
    </div>
    <p class="mb-2 text-[12px] text-ink-soft">
      Feel a small buzz every time you press a button.
    </p>
    <div class="mb-5 grid grid-cols-4 gap-2">
      {#each HAPTICS as h (h.id)}
        <button
          class="rounded-xl border py-2.5 text-[13px] font-semibold transition-colors
            {vault.settings.haptic === h.id
            ? 'border-teal bg-teal-soft text-teal'
            : 'border-line text-ink-soft'}"
          onclick={() => setHaptic(h.id)}
        >
          {h.label}
        </button>
      {/each}
    </div>

    <!-- Click sound -->
    <div class="mb-1 flex items-center gap-2">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 5 6 9H2v6h4l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
      </svg>
      <p class="text-[13px] font-semibold">Click sound</p>
    </div>
    <p class="mb-2 text-[12px] text-ink-soft">
      A subtle tick sound when tapping buttons.
    </p>
    <div class="mb-3 grid grid-cols-2 gap-2">
      <button
        class="rounded-xl border py-2.5 text-[13px] font-semibold transition-colors
          {!vault.settings.sound ? 'border-teal bg-teal-soft text-teal' : 'border-line text-ink-soft'}"
        onclick={() => setSound(false)}
      >
        Off
      </button>
      <button
        class="rounded-xl border py-2.5 text-[13px] font-semibold transition-colors
          {vault.settings.sound ? 'border-teal bg-teal-soft text-teal' : 'border-line text-ink-soft'}"
        onclick={() => setSound(true)}
      >
        On
      </button>
    </div>

    {#if vault.settings.sound}
      <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="st-vol">
        Sound volume
      </label>
      <input
        id="st-vol"
        type="range"
        min="10"
        max="100"
        value={Math.round((vault.settings.volume ?? 0.5) * 100)}
        oninput={setVolume}
        onchange={() => tapFeedback()}
        class="mb-3 w-full accent-[#0F766E]"
      />
    {/if}

    <button
      class="mt-1 w-full rounded-xl border border-line py-3 text-[14px] font-semibold text-ink active:bg-paper"
      onclick={tapFeedback}
    >
      Tap to test
    </button>

    {#if vault.security.configured}
      <button
        class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line py-3 text-[14px] font-semibold text-ink active:bg-paper"
        onclick={() => {
          onclose();
          vault.securityPrompt = 'change';
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
          <path d="M12 8v4m0 3v.5" />
        </svg>
        Change Vault Password
      </button>
    {/if}

    <button
      class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line py-3 text-[14px] font-semibold text-ink active:bg-paper"
      onclick={() => {
        onclose();
        vault.tutorialOpen = true;
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 0 1 4.9.6c0 1.6-2.4 2-2.4 3.4M12 17h.01" />
      </svg>
      Replay Tutorial
    </button>

    <button
      class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-soft py-3 text-[14px] font-semibold text-teal active:opacity-80"
      onclick={() => {
        onclose();
        vault.recapOpen = true;
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 15v-4m5 4V8m5 7v-6" />
      </svg>
      View Weekly Recap
    </button>
  </div>
</div>
