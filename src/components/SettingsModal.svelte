<script>
  import { lockScroll } from '../lib/scrollLock.js';
  import { vault, saveSettings, tapFeedback, setPremium } from '../lib/store.svelte.js';
  import ShieldDashboard from './ShieldDashboard.svelte';

  let { onclose } = $props();

  function togglePremiumSkin() {
    setPremium(!vault.premium);
    tapFeedback();
  }

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
  class="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
  use:lockScroll
  onclick={onBackdrop}
  role="presentation"
>
  <div
    class="pop-in flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl bg-paper sm:max-h-[88vh] sm:rounded-3xl"
    role="dialog"
    aria-modal="true"
    aria-label="Settings"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-5 pb-3 pt-5"
      style="padding-top: calc(1.25rem + env(safe-area-inset-top) * 0.3);"
    >
      <div>
        <h2 class="font-display text-xl font-bold leading-none">Settings</h2>
        <p class="mt-1 text-[12px] text-ink-soft">Personalize your vault</p>
      </div>
      <button
        class="flex h-9 w-9 items-center justify-center rounded-full bg-card text-ink-soft shadow-sm active:scale-95"
        aria-label="Close"
        onclick={onclose}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Scrollable body -->
    <div
      class="min-h-0 flex-1 overflow-y-auto px-5 pb-5"
      style="padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));"
    >
      <!-- â”€â”€ PREMIUM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
      <p class="mb-2 mt-1 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
        Appearance
      </p>
      <button
        class="premium-hero group mb-6 flex w-full items-center gap-3.5 overflow-hidden rounded-2xl border p-4 text-left transition-all active:scale-[0.99]
          {vault.premium ? 'premium-hero--on' : 'border-line bg-card'}"
        aria-pressed={vault.premium}
        onclick={togglePremiumSkin}
      >
        <span
          class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
            {vault.premium ? 'bg-white/25' : 'bg-teal-soft'}"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke={vault.premium ? '#fff' : 'var(--color-teal)'}
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
            <path d="M12 3v18M4 7.5l8 4.5 8-4.5" opacity="0.55" />
          </svg>
        </span>
        <div class="min-w-0 flex-1">
          <p class="flex items-center gap-1.5 text-[15px] font-bold leading-tight {vault.premium ? 'text-white' : 'text-ink'}">
            Liquid Glass
            <span class="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider
              {vault.premium ? 'bg-white/25 text-white' : 'bg-teal text-white'}">Premium</span>
          </p>
          <p class="mt-0.5 text-[12px] leading-snug {vault.premium ? 'text-white/85' : 'text-ink-soft'}">
            {vault.premium ? 'Your vault is dressed in glass âœ¨' : 'Transform Kaban into frosted Apple-grade glass'}
          </p>
        </div>
        <!-- Switch -->
        <span
          class="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300
            {vault.premium ? 'bg-white/40' : 'bg-line'}"
        >
          <span
            class="absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300
              {vault.premium ? 'left-6' : 'left-1'}"
          ></span>
        </span>
      </button>

      <!-- â”€â”€ PROTECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
      <p class="mb-2 mt-1 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
        Protection
      </p>
      <div class="mb-6">
        <ShieldDashboard {tapFeedback} />
      </div>

      <!-- â”€â”€ FEEDBACK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
      <p class="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
        Feedback
      </p>
      <div class="mb-6 overflow-hidden rounded-2xl border border-line bg-card">
        <!-- Haptics row -->
        <div class="p-4">
          <div class="mb-3 flex items-center gap-2.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="7" y="2" width="10" height="20" rx="2.5" />
                <path d="M2 8v8M22 8v8" />
              </svg>
            </span>
            <div class="min-w-0">
              <p class="text-[14px] font-semibold leading-tight">Vibration on tap</p>
              <p class="text-[12px] text-ink-soft">A small buzz on every press</p>
            </div>
          </div>
          <div class="grid grid-cols-4 gap-1.5">
            {#each HAPTICS as h (h.id)}
              <button
                class="rounded-xl py-2.5 text-[13px] font-semibold transition-all active:scale-95
                  {vault.settings.haptic === h.id
                    ? 'bg-teal text-white shadow-sm'
                    : 'bg-paper text-ink-soft'}"
                onclick={() => setHaptic(h.id)}
              >
                {h.label}
              </button>
            {/each}
          </div>
        </div>

        <div class="mx-4 h-px bg-line"></div>

        <!-- Click sound row -->
        <div class="p-4">
          <div class="mb-3 flex items-center gap-2.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
              </svg>
            </span>
            <div class="min-w-0">
              <p class="text-[14px] font-semibold leading-tight">Click sound</p>
              <p class="text-[12px] text-ink-soft">A subtle tick when tapping</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              class="rounded-xl py-2.5 text-[13px] font-semibold transition-all active:scale-95
                {!vault.settings.sound ? 'bg-teal text-white shadow-sm' : 'bg-paper text-ink-soft'}"
              onclick={() => setSound(false)}
            >
              Off
            </button>
            <button
              class="rounded-xl py-2.5 text-[13px] font-semibold transition-all active:scale-95
                {vault.settings.sound ? 'bg-teal text-white shadow-sm' : 'bg-paper text-ink-soft'}"
              onclick={() => setSound(true)}
            >
              On
            </button>
          </div>

          {#if vault.settings.sound}
            <div class="mt-4">
              <div class="mb-1.5 flex items-center justify-between">
                <label class="text-[12px] font-semibold text-ink-soft" for="st-vol">Volume</label>
                <span class="text-[12px] font-semibold tabular-nums text-teal">
                  {Math.round((vault.settings.volume ?? 0.5) * 100)}%
                </span>
              </div>
              <input
                id="st-vol"
                type="range"
                min="10"
                max="100"
                value={Math.round((vault.settings.volume ?? 0.5) * 100)}
                oninput={setVolume}
                onchange={() => tapFeedback()}
                class="w-full accent-[#0F766E]"
              />
            </div>
          {/if}

          <button
            class="mt-3 w-full rounded-xl bg-paper py-2.5 text-[13px] font-semibold text-ink active:scale-[0.98]"
            onclick={tapFeedback}
          >
            Tap to test
          </button>
        </div>
      </div>

      <!-- â”€â”€ SECURITY (only if a vault password exists) â”€â”€ -->
      {#if vault.security.configured}
        <p class="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
          Security
        </p>
        <div class="mb-6 overflow-hidden rounded-2xl border border-line bg-card">
          <button
            class="flex w-full items-center gap-3 p-4 text-left active:bg-paper"
            onclick={() => {
              onclose();
              vault.securityPrompt = 'change';
            }}
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
                <path d="M12 8v4m0 3v.5" />
              </svg>
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-[14px] font-semibold leading-tight">Change vault password</p>
              <p class="text-[12px] text-ink-soft">Update your AES-256 key</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-soft)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      {/if}

      <!-- â”€â”€ ABOUT & MORE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
      <p class="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
        About &amp; more
      </p>
      <div class="overflow-hidden rounded-2xl border border-line bg-card">
        <button
          class="flex w-full items-center gap-3 p-4 text-left active:bg-paper"
          onclick={() => {
            onclose();
            vault.tutorialOpen = true;
          }}
        >
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9a2.5 2.5 0 0 1 4.9.6c0 1.6-2.4 2-2.4 3.4M12 17h.01" />
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-[14px] font-semibold leading-tight">Replay tutorial</p>
            <p class="text-[12px] text-ink-soft">Take the 30-second tour again</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-soft)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        <div class="mx-4 h-px bg-line"></div>

        <button
          class="flex w-full items-center gap-3 p-4 text-left active:bg-paper"
          onclick={() => {
            onclose();
            vault.recapOpen = true;
          }}
        >
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 15v-4m5 4V8m5 7v-6" />
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-[14px] font-semibold leading-tight">Weekly recap</p>
            <p class="text-[12px] text-ink-soft">See your vault activity</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-soft)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>