<script>
  // SafeEmbed — loads an external page/tool inside a hardened sandbox.
  //
  // What the sandbox allows:
  //   allow-scripts       → the embed's own JS runs (needed for interactive tools)
  //   allow-same-origin   → it can read its own origin's storage/cookies
  //   allow-forms         → students can submit forms (search, login to a tool)
  //
  // What it deliberately DOESN'T allow — the whole point:
  //   • popups / new windows          (no allow-popups)
  //   • breaking out of the sandbox   (no allow-popups-to-escape-sandbox)
  //   • top-level navigation/redirects (no allow-top-navigation*)
  //   • auto-downloads                (no allow-downloads)
  //   • autoplay, pointer-lock, etc.  (omitted from allow= permissions)
  //
  // Note: allow-scripts + allow-same-origin together is required for most real
  // tools, but only grant it to sources you actually trust. For fully untrusted
  // pages, pass trusted={false} to drop allow-same-origin.

  let {
    src,
    title = 'Embedded resource',
    trusted = true,
    allowForms = true,
    ratio = '16 / 9', // CSS aspect-ratio; use null to fill the parent height
    class: className = '',
  } = $props();

  let loaded = $state(false);
  let failed = $state(false);

  // Build the sandbox token list from the trust level + options.
  const sandbox = $derived(
    [
      'allow-scripts',
      trusted && 'allow-same-origin',
      allowForms && 'allow-forms',
    ]
      .filter(Boolean)
      .join(' ')
  );

  // Only allow http(s) sources — blocks javascript:, data:, blob:, etc.
  const safeSrc = $derived.by(() => {
    try {
      const u = new URL(src, location.href);
      return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
    } catch {
      return null;
    }
  });

  // Minimal feature policy — nothing sensitive is delegated to the frame.
  const allow = 'fullscreen';
</script>

<div
  class="safe-embed {className}"
  style={ratio ? `aspect-ratio:${ratio};` : ''}
>
  {#if !safeSrc}
    <div class="safe-embed__state">
      <p class="safe-embed__msg">This resource can't be embedded — the link isn't a valid web address.</p>
    </div>
  {:else}
    {#if !loaded && !failed}
      <div class="safe-embed__state safe-embed__state--overlay">
        <div class="safe-embed__spinner" aria-hidden="true"></div>
        <p class="safe-embed__msg">Loading resource…</p>
      </div>
    {/if}
    {#if failed}
      <div class="safe-embed__state safe-embed__state--overlay">
        <p class="safe-embed__msg">
          This resource didn't load. It may block embedding, or you're offline.
        </p>
        <a class="safe-embed__link" href={safeSrc} target="_blank" rel="noopener noreferrer nofollow">
          Open in a new tab instead
        </a>
      </div>
    {/if}
    <iframe
      src={safeSrc}
      {title}
      {sandbox}
      {allow}
      referrerpolicy="no-referrer"
      loading="lazy"
      onload={() => (loaded = true)}
      onerror={() => (failed = true)}
    ></iframe>
  {/if}
</div>

<style>
  .safe-embed {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 14px;
    border: 1px solid var(--color-line, #e5e7eb);
    background: var(--color-paper, #f6f7f9);
  }
  .safe-embed iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
  }
  .safe-embed__state {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 1.25rem;
    text-align: center;
  }
  .safe-embed__state--overlay {
    background: var(--color-paper, #f6f7f9);
  }
  .safe-embed__msg {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
    color: var(--color-ink-soft, #6b7280);
  }
  .safe-embed__link {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-teal, #0f766e);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .safe-embed__spinner {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2.5px solid color-mix(in srgb, var(--color-teal, #0f766e) 25%, transparent);
    border-top-color: var(--color-teal, #0f766e);
    animation: safe-embed-spin 0.7s linear infinite;
  }
  @keyframes safe-embed-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .safe-embed__spinner {
      animation: none;
    }
  }
</style>
