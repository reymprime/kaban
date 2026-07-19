<script>
  import { lockScroll } from '../lib/scrollLock.js';
  import { vault, saveSettings, setTheme, setPalette, tapFeedback } from '../lib/store.svelte.js';
  import ShieldDashboard from './ShieldDashboard.svelte';

  let { onclose } = $props();

  const THEMES = [
    { id: 'auto', label: 'Auto' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];

  // Each palette shows its identity swatch (accent dot on its surface) so the
  // preview reads the same in light or dark. 'default' is the original teal.
  const PALETTES = [
    { id: 'default', label: 'Teal', accent: '#0F766E', surface: '#16181D' },
    { id: 'pumpkin', label: 'Pumpkin', accent: '#FD802E', surface: '#233D4C' },
  ];

  function pickTheme(id) {
    setTheme(id);
    tapFeedback();
  }

  function pickPalette(id) {
    setPalette(id);
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
      <!-- APPEARANCE ---------------------------------- -->
      <p class="mb-2 mt-1 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
        Appearance
      </p>
      <div class="mb-6 overflow-hidden rounded-2xl border border-line bg-card">
        <!-- Theme: auto / light / dark -->
        <div class="p-4">
          <div class="mb-3 flex items-center gap-2.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4.5" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            </span>
            <div class="min-w-0">
              <p class="text-[14px] font-semibold leading-tight">Theme</p>
              <p class="text-[12px] text-ink-soft">Light, dark, or follow your system</p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-1.5">
            {#each THEMES as t (t.id)}
              <button
                class="rounded-xl py-2.5 text-[13px] font-semibold transition-all active:scale-95
                  {vault.theme === t.id
                    ? 'bg-teal text-white shadow-sm'
                    : 'bg-paper text-ink-soft'}"
                onclick={() => pickTheme(t.id)}
              >
                {t.label}
              </button>
            {/each}
          </div>
        </div>

        <div class="mx-4 h-px bg-line"></div>

        <!-- Color palette -->
        <div class="p-4">
          <div class="mb-3 flex items-center gap-2.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="13.5" cy="6.5" r="1.3" fill="var(--color-teal)" stroke="none" />
                <circle cx="17.5" cy="10.5" r="1.3" fill="var(--color-teal)" stroke="none" />
                <circle cx="8.5" cy="7.5" r="1.3" fill="var(--color-teal)" stroke="none" />
                <circle cx="6.5" cy="12.5" r="1.3" fill="var(--color-teal)" stroke="none" />
                <path d="M12 2a10 10 0 1 0 0 20c1 0 1.5-.8 1.5-1.6 0-.5-.2-.9-.5-1.2-.3-.4-.5-.7-.5-1.2 0-.9.7-1.5 1.5-1.5H16a4 4 0 0 0 4-4c0-4.4-3.6-8-8-8Z" />
              </svg>
            </span>
            <div class="min-w-0">
              <p class="text-[14px] font-semibold leading-tight">Color palette</p>
              <p class="text-[12px] text-ink-soft">Repaint Kaban in a whole new look</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            {#each PALETTES as p (p.id)}
              <button
                class="flex items-center gap-2.5 rounded-xl border-2 bg-paper p-2.5 text-left transition-all active:scale-[0.98]
                  {vault.palette === p.id ? 'border-teal' : 'border-line'}"
                onclick={() => pickPalette(p.id)}
              >
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style="background: {p.surface};"
                >
                  <span class="h-4 w-4 rounded-full" style="background: {p.accent};"></span>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[13px] font-semibold">{p.label}</span>
                  <span class="block text-[11px] {vault.palette === p.id ? 'font-semibold text-teal' : 'text-ink-soft'}">
                    {vault.palette === p.id ? 'Active' : 'Tap to apply'}
                  </span>
                </span>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- -- PROTECTION ------------------------------- -->
      <p class="mb-2 mt-1 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
        Protection
      </p>
      <div class="mb-6">
        <ShieldDashboard {tapFeedback} />
      </div>

      <!-- -- APP LOCK (4-digit PIN on open) ----------- -->
      <p class="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
        App Lock
      </p>
      <div class="mb-6 overflow-hidden rounded-2xl border border-line bg-card">
        {#if !vault.appLock.configured}
          <button
            class="flex w-full items-center gap-3 p-4 text-left active:bg-paper"
            onclick={() => {
              onclose();
              vault.appLockPrompt = 'setup';
            }}
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="10" width="16" height="11" rx="2.5" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-[14px] font-semibold leading-tight">Set up PIN lock</p>
              <p class="text-[12px] text-ink-soft">Ask for a 4-digit PIN when opening Kaban</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-soft)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        {:else}
          <div class="flex items-center gap-3 p-4">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="10" width="16" height="11" rx="2.5" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                <circle cx="12" cy="15.5" r="1.3" fill="var(--color-teal)" stroke="none" />
              </svg>
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-[14px] font-semibold leading-tight">PIN lock is on</p>
              <p class="text-[12px] text-ink-soft">Kaban asks for your PIN on open</p>
            </div>
            <span class="shrink-0 rounded-full bg-teal px-2.5 py-1 text-[11px] font-bold text-white">On</span>
          </div>

          <div class="mx-4 h-px bg-line"></div>

          <button
            class="flex w-full items-center gap-3 p-4 text-left active:bg-paper"
            onclick={() => {
              onclose();
              vault.appLockPrompt = 'change';
            }}
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-soft">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4v6h6" />
                <path d="M20 20v-6h-6" />
                <path d="M18.5 9A7 7 0 0 0 6 7.5L4 10m16 4-2 2.5A7 7 0 0 1 5.5 15" />
              </svg>
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-[14px] font-semibold leading-tight">Change PIN</p>
              <p class="text-[12px] text-ink-soft">Set a new 4-digit PIN</p>
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
              vault.appLockPrompt = 'disable';
            }}
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style="background: var(--color-cat-video-soft);"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-cat-video)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="10" width="16" height="11" rx="2.5" />
                <path d="M8 10V7a4 4 0 0 1 7.5-2.3" />
              </svg>
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-[14px] font-semibold leading-tight" style="color: var(--color-cat-video);">
                Turn off PIN lock
              </p>
              <p class="text-[12px] text-ink-soft">Open Kaban without a PIN</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-soft)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        {/if}
      </div>

      <!-- -- FEEDBACK --------------------------------- -->
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

      <!-- -- SECURITY (only if a vault password exists) -- -->
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

      <!-- -- ABOUT & MORE ----------------------------- -->
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