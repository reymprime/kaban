<script>
  let { onclose } = $props();

  const version = 'v1.5';

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
    class="pop-in w-full max-w-xs overflow-hidden rounded-3xl bg-card text-center"
    role="dialog"
    aria-modal="true"
    aria-label="About Kaban"
  >
    <!-- Teal banner -->
    <div class="flex flex-col items-center gap-2 bg-teal px-5 pb-5 pt-6">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
          <path
            d="M12 3a6 6 0 0 0-2.4 11.5l-1.1 5.3a1 1 0 0 0 1 1.2h5a1 1 0 0 0 1-1.2l-1.1-5.3A6 6 0 0 0 12 3Zm0 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
          />
        </svg>
      </div>
      <div>
        <h2 class="font-display text-xl font-bold text-white">Kaban</h2>
        <p class="text-[12px] font-medium text-white/70">Prompt Vault · {version}</p>
      </div>
    </div>

    <div class="px-5 py-5">
      <p class="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-ink-soft">
        Created by
      </p>
      <p class="font-display text-lg font-bold">Reymark Delagao</p>
      <p class="mb-4 text-[13px] text-ink-soft">GNOKZ Production</p>

      <p class="mb-4 text-[12px] leading-relaxed text-ink-soft">
        Built with Svelte, crafted entirely on Android. 
        Your prompts stay on your device — private, offline, yours.
      </p>

      <a
        class="mb-2 flex items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-[13px] font-semibold text-ink active:bg-paper"
        href="https://github.com/reymprime"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.56 9.56 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.16.58.67.48A10 10 0 0 0 22 12 10 10 0 0 0 12 2Z" />
        </svg>
        @reymprime
      </a>
      <button
        class="w-full rounded-xl bg-teal py-2.5 text-[13px] font-semibold text-white active:opacity-90"
        onclick={onclose}
      >
        Close
      </button>
    </div>
  </div>
</div>
