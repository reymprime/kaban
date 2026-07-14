<script>
  import { lockScroll } from '../lib/scrollLock.js';

  let { url, host, reasons = [], onproceed, oncancel } = $props();

  function onBackdrop(e) {
    if (e.target === e.currentTarget) oncancel();
  }
  function onKey(e) {
    if (e.key === 'Escape') oncancel();
  }
</script>

<svelte:window onkeydown={onKey} />

<div
  class="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center"
  use:lockScroll
  onclick={onBackdrop}
  role="presentation"
>
  <div
    class="pop-in w-full max-w-md rounded-t-3xl bg-card p-5 sm:rounded-3xl"
    role="alertdialog"
    aria-modal="true"
    aria-label="Suspicious link warning"
    style="padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));"
  >
    <div class="mb-3 flex items-center gap-3">
      <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style="background:#fef3c7;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </span>
      <div class="min-w-0">
        <h2 class="font-display text-lg font-bold leading-tight">Careful with this link</h2>
        <p class="truncate text-[12px] text-ink-soft">{host}</p>
      </div>
    </div>

    <p class="mb-3 text-[13px] leading-relaxed text-ink-soft">
      This link shows signs often seen on scam, phishing, or ad-heavy pages.
      Don't enter passwords, payment details, or personal info there.
    </p>

    {#if reasons.length}
      <ul class="mb-4 space-y-1.5">
        {#each reasons as r}
          <li class="flex items-start gap-2 text-[12.5px] text-ink">
            <svg class="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {r}
          </li>
        {/each}
      </ul>
    {/if}

    <div class="flex flex-col gap-2">
      <button
        class="w-full rounded-xl border border-line py-3 text-[14px] font-semibold text-ink active:bg-paper"
        onclick={oncancel}
      >
        Go back (recommended)
      </button>
      <button
        class="w-full rounded-xl py-3 text-[13px] font-medium text-ink-soft underline underline-offset-2 active:opacity-70"
        onclick={onproceed}
      >
        Open anyway
      </button>
    </div>
  </div>
</div>
