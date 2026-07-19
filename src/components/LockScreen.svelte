<script>
  import { lockScroll } from '../lib/scrollLock.js';
  import {
    vault,
    unlockApp,
    setupAppPin,
    verifyAppPin,
    disableAppPin,
    toast,
  } from '../lib/store.svelte.js';

  // mode: 'unlock' (full-screen gate, non-dismissible)
  //     | 'setup' | 'change' | 'disable' (launched from Settings, closable)
  let { mode = 'unlock', onclose } = $props();

  const PIN_LEN = 4;

  // Steps drive the multi-stage flows. 'unlock' & 'disable' are single-stage.
  //   setup  : create -> confirm
  //   change : current -> create -> confirm
  let step = $state(
    mode === 'change' ? 'current' : mode === 'setup' ? 'create' : 'enter'
  );

  let entry = $state('');
  let firstPin = $state(''); // remembered between create -> confirm
  let error = $state('');
  let shake = $state(false);
  let busy = $state(false);

  const titles = {
    unlock: { t: 'Enter your PIN', s: 'Unlock Kaban to continue' },
    'setup.create': { t: 'Create a PIN', s: 'Choose a 4-digit PIN' },
    'setup.confirm': { t: 'Confirm your PIN', s: 'Enter it once more' },
    'change.current': { t: 'Current PIN', s: 'Enter your current PIN' },
    'change.create': { t: 'New PIN', s: 'Choose a new 4-digit PIN' },
    'change.confirm': { t: 'Confirm new PIN', s: 'Enter the new PIN again' },
    disable: { t: 'Turn off PIN lock', s: 'Enter your PIN to confirm' },
  };

  const head = $derived(
    mode === 'unlock'
      ? titles.unlock
      : mode === 'disable'
        ? titles.disable
        : titles[`${mode}.${step}`]
  );

  const dots = $derived(Array.from({ length: PIN_LEN }, (_, i) => i < entry.length));

  function buzzError() {
    if (vault.settings.haptic !== 'off' && navigator.vibrate) {
      navigator.vibrate([0, 35, 55, 35]);
    }
  }

  function fail(msg) {
    error = msg;
    shake = true;
    buzzError();
    setTimeout(() => (shake = false), 400);
    setTimeout(() => (entry = ''), 180);
  }

  function press(n) {
    if (busy || entry.length >= PIN_LEN) return;
    error = '';
    entry += n;
    // Let the final dot paint before we act on a complete PIN.
    if (entry.length === PIN_LEN) setTimeout(submit, 140);
  }

  function backspace() {
    if (busy) return;
    error = '';
    entry = entry.slice(0, -1);
  }

  async function submit() {
    const pin = entry;
    busy = true;
    try {
      if (mode === 'unlock') {
        const ok = await unlockApp(pin);
        if (!ok) fail('Wrong PIN. Try again.');
      } else if (mode === 'disable') {
        await disableAppPin(pin);
        toast('PIN lock turned off');
        onclose?.();
      } else if (mode === 'setup') {
        if (step === 'create') {
          firstPin = pin;
          entry = '';
          step = 'confirm';
        } else {
          if (pin !== firstPin) {
            firstPin = '';
            step = 'create';
            fail('PINs did not match. Start again.');
          } else {
            await setupAppPin(pin);
            toast('PIN lock is on');
            onclose?.();
          }
        }
      } else if (mode === 'change') {
        if (step === 'current') {
          const ok = await verifyAppPin(pin);
          if (!ok) fail('Current PIN is incorrect.');
          else {
            entry = '';
            step = 'create';
          }
        } else if (step === 'create') {
          firstPin = pin;
          entry = '';
          step = 'confirm';
        } else {
          if (pin !== firstPin) {
            firstPin = '';
            step = 'create';
            fail('PINs did not match. Start again.');
          } else {
            await setupAppPin(pin); // current already verified above
            toast('PIN changed');
            onclose?.();
          }
        }
      }
    } catch (e) {
      fail(e?.message || 'Something went wrong.');
    } finally {
      busy = false;
    }
  }

  // Hardware / on-screen keyboard support (nice on tablets & desktop).
  function onKeydown(e) {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      press(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      backspace();
    }
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
</script>

<svelte:window onkeydown={onKeydown} />

<div
  class="fixed inset-0 z-50 flex flex-col bg-paper"
  use:lockScroll
  role="dialog"
  aria-modal="true"
  aria-label={mode === 'unlock' ? 'App locked' : 'PIN setup'}
  style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);"
>
  <!-- Header: only closable modes get a back/close affordance. The unlock
       gate is intentionally non-dismissible. -->
  {#if mode !== 'unlock'}
    <div class="flex items-center px-3 pt-3">
      <button
        class="flex h-9 w-9 items-center justify-center rounded-full bg-card text-ink-soft shadow-sm active:scale-95"
        aria-label="Close"
        onclick={() => onclose?.()}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  {/if}

  <div class="flex flex-1 flex-col items-center justify-center px-6">
    <!-- Lock badge -->
    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-soft">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="10" width="16" height="11" rx="2.5" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <circle cx="12" cy="15.5" r="1.3" fill="var(--color-teal)" stroke="none" />
      </svg>
    </div>

    <h1 class="mt-5 font-display text-2xl font-bold tracking-tight">{head.t}</h1>
    <p class="mt-1.5 text-[13px] text-ink-soft">{head.s}</p>

    <!-- PIN dots -->
    <div class="mt-8 flex items-center gap-4 {shake ? 'lock-shake' : ''}">
      {#each dots as filled, i (i)}
        <span
          class="h-3.5 w-3.5 rounded-full transition-all duration-150 {filled
            ? 'scale-110 bg-teal'
            : 'border-2 border-line bg-transparent'}"
        ></span>
      {/each}
    </div>

    <!-- Error line (reserves height so the keypad never jumps) -->
    <p
      class="mt-4 h-4 text-[12px] font-semibold"
      style="color: var(--color-cat-video);"
    >
      {error}
    </p>

    <!-- Keypad -->
    <div class="mt-4 grid w-full max-w-[300px] grid-cols-3 gap-3">
      {#each keys as k (k)}
        <button
          class="flex h-[62px] items-center justify-center rounded-2xl border border-line bg-card font-display text-2xl font-semibold text-ink shadow-sm active:scale-95 active:bg-paper disabled:opacity-40"
          disabled={busy}
          onclick={() => press(k)}
        >
          {k}
        </button>
      {/each}

      <!-- bottom row: spacer - 0 - backspace -->
      <span aria-hidden="true"></span>

      <button
        class="flex h-[62px] items-center justify-center rounded-2xl border border-line bg-card font-display text-2xl font-semibold text-ink shadow-sm active:scale-95 active:bg-paper disabled:opacity-40"
        disabled={busy}
        onclick={() => press('0')}
      >
        0
      </button>

      <button
        class="flex h-[62px] items-center justify-center rounded-2xl text-ink-soft active:scale-95 active:bg-card disabled:opacity-40"
        aria-label="Delete"
        disabled={busy || entry.length === 0}
        onclick={backspace}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 5H8.5a2 2 0 0 0-1.5.7L2.4 11a1.5 1.5 0 0 0 0 2l4.6 5.3a2 2 0 0 0 1.5.7H21a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
          <path d="m12 9.5 5 5m0-5-5 5" />
        </svg>
      </button>
    </div>

    {#if mode === 'unlock'}
      <p class="mt-8 max-w-[260px] text-center text-[11px] leading-relaxed text-ink-soft">
        Forgot your PIN? Your data lives only on this device. Reinstalling
        Kaban clears the PIN, but it also erases your vault.
      </p>
    {/if}
  </div>
</div>