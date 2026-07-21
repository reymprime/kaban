<script>
  import { setRotationLock } from '../lib/store.svelte.js';
  import { lockScroll } from '../lib/scrollLock.js';

  // One-tap escape hatch: turn the lock off and the gate disappears at once.
  function allowRotation() {
    setRotationLock(false);
  }
</script>

<!-- Portrait gate. Shows only on a phone that is held in landscape while the
     rotation lock is on. Sits above everything (incl. the PIN lock) so the
     whole app stays portrait. In the installed app the native lock usually
     means this never appears; in a browser tab it is the enforcement. -->
<div
  class="anim-fade fixed inset-0 z-[80] flex flex-col items-center justify-center gap-7 bg-paper px-8 text-center"
  use:lockScroll
  role="dialog"
  aria-modal="true"
  aria-label="Rotate your phone to portrait"
  style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);"
>
  <span class="soft-float flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-teal-soft">
    <span class="rotate-hint-icon flex items-center justify-center text-teal">
      <svg
        width="46" height="46" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
      >
        <rect x="7" y="2.5" width="10" height="19" rx="2.4" />
        <path d="M11 18.6h2" />
      </svg>
    </span>
  </span>

  <div class="anim-rise max-w-[300px]" style="--i: 1;">
    <h2 class="font-display text-2xl font-bold leading-tight">Portrait only</h2>
    <p class="mt-2 text-[14px] leading-relaxed text-ink-soft">
      Kaban is locked to portrait so everything stays comfortable one-handed.
      Turn your phone upright to keep going.
    </p>
  </div>

  <div class="anim-rise flex w-full max-w-[300px] flex-col gap-3" style="--i: 2;">
    <button
      class="w-full rounded-2xl bg-teal py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-teal/30 active:scale-[0.98]"
      onclick={allowRotation}
    >
      Allow rotation
    </button>
    <p class="text-[12px] leading-relaxed text-ink-soft">
      You can re-lock it anytime in Settings &gt; Display.
    </p>
  </div>
</div>
