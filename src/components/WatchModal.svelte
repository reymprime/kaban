<script>
  import { lockScroll } from '../lib/scrollLock.js';
  import { getYouTubeId } from '../lib/platform.js';
  import SafeEmbed from './SafeEmbed.svelte';

  let { item, onclose } = $props();

  const videoId = $derived(getYouTubeId(item.content));
  const embedSrc = $derived(
    'https://www.youtube-nocookie.com/embed/' +
      videoId +
      '?autoplay=1&playsinline=1&rel=0&origin=' +
      encodeURIComponent(location.origin)
  );

  // Tap anywhere on the dimmed backdrop → close (and the {#if} unmount
  // destroys the iframe, which fully stops playback + audio)
  function onBackdrop(e) {
    if (e.target === e.currentTarget) onclose();
  }
  function onKey(e) {
    if (e.key === 'Escape') onclose();
  }
</script>

<svelte:window onkeydown={onKey} />

<div
  class="fixed inset-0 z-40 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-md"
  use:lockScroll
  onclick={onBackdrop}
  role="presentation"
>
  <div
    class="pop-in w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-card shadow-2xl"
    role="dialog"
    aria-modal="true"
    aria-label="Watch video"
  >
    <div class="flex items-center justify-between gap-3 px-4 py-3">
      <div class="flex min-w-0 items-center gap-2">
        <!-- YouTube play badge -->
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF0033" class="shrink-0" aria-hidden="true">
          <path d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.9 4.8 12 4.8 12 4.8s-5.9 0-7.6.4a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.7.4 7.6.4 7.6.4s5.9 0 7.6-.4a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.8Z" />
          <path d="m10 15.2 5-3.2-5-3.2v6.4Z" fill="#fff" />
        </svg>
        <h2 class="truncate font-display text-[15px] font-semibold">{item.title}</h2>
      </div>
      <button
        class="shrink-0 rounded-lg p-1.5 text-ink-soft transition-colors active:bg-line"
        aria-label="Close video"
        onclick={onclose}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>

    <!-- Strict 16:9, full width, fully responsive. SafeEmbed enforces the
         sandbox (no popups/downloads) while letting the player run. -->
    <div class="w-full bg-black">
      <SafeEmbed
        src={embedSrc}
        title={item.title}
        preset="youtube"
        ratio="16 / 9"
        class="rounded-none border-0"
      />
    </div>
  </div>
</div>
