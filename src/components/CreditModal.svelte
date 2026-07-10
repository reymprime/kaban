<script>
  let { onclose } = $props();

  const version = 'v2.7.2';

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
      <p class="mb-4 font-display text-lg font-bold">Gnokz Production</p>

      <p class="mb-4 text-[12px] leading-relaxed text-ink-soft">
        Built with Svelte, crafted entirely on Android.
        Your prompts stay on your device — private, offline, yours.
      </p>

      <a
        class="mb-2 flex items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-[13px] font-semibold text-ink active:bg-paper"
        href="mailto:gnokzproduction@gmail.com?subject=Kaban%20Bug%20Report"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 8v5m0 3.5v.5" />
          <path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
        </svg>
        Report Problem
      </a>
      <a
        class="mb-2 flex items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-[13px] font-semibold text-ink active:bg-paper"
        href="privacy.html"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        Privacy Policy
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
