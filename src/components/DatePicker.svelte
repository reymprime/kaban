<script>
  import { lockScroll } from '../lib/scrollLock.js';

  // value: 'YYYY-MM-DD' | '' ; min/max optional 'YYYY-MM-DD'
  let { value = '', min = '', max = '', onset, oncancel, onclear } = $props();

  const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  function parse(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }
  function toISO(d) {
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }

  const today = new Date();
  const initial = parse(value) || today;

  let viewYear = $state(initial.getFullYear());
  let viewMonth = $state(initial.getMonth()); // 0-11
  let selected = $state(value ? toISO(parse(value)) : '');

  const minDate = $derived(parse(min));
  const maxDate = $derived(parse(max));

  // Build the grid of days for the visible month (with leading blanks).
  const cells = $derived.by(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < startDow; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(viewYear, viewMonth, d));
    return out;
  });

  const headerLabel = $derived.by(() => {
    const sel = parse(selected) || today;
    return {
      year: sel.getFullYear(),
      line: sel.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });

  function sameISO(d) {
    return d && toISO(d) === selected;
  }
  function isDisabled(d) {
    if (!d) return true;
    if (minDate && d < stripTime(minDate)) return true;
    if (maxDate && d > stripTime(maxDate)) return true;
    return false;
  }
  function stripTime(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function isToday(d) {
    return d && toISO(d) === toISO(today);
  }

  function prevMonth() {
    if (viewMonth === 0) { viewMonth = 11; viewYear--; } else viewMonth--;
  }
  function nextMonth() {
    if (viewMonth === 11) { viewMonth = 0; viewYear++; } else viewMonth++;
  }
  function pick(d) {
    if (isDisabled(d)) return;
    selected = toISO(d);
  }

  function onBackdrop(e) {
    if (e.target === e.currentTarget) oncancel?.();
  }
</script>

<div
  class="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 px-6 backdrop-blur-sm"
  use:lockScroll
  onclick={onBackdrop}
  role="presentation"
>
  <div
    class="pop-in w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-2xl"
    role="dialog"
    aria-modal="true"
    aria-label="Choose a date"
  >
    <!-- Header (teal) -->
    <div class="px-6 py-5" style="background: var(--color-teal);">
      <p class="text-[14px] font-semibold text-white/80">{headerLabel.year}</p>
      <p class="font-display text-3xl font-bold leading-tight text-white">{headerLabel.line}</p>
    </div>

    <!-- Month nav -->
    <div class="flex items-center justify-between px-5 pt-4">
      <button
        class="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft active:bg-paper"
        aria-label="Previous month"
        onclick={prevMonth}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <p class="text-[15px] font-semibold">{MONTHS[viewMonth]} {viewYear}</p>
      <button
        class="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft active:bg-paper"
        aria-label="Next month"
        onclick={nextMonth}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </div>

    <!-- Weekday header -->
    <div class="grid grid-cols-7 gap-1 px-4 pt-3">
      {#each WEEKDAYS as w}
        <div class="flex h-8 items-center justify-center text-[12px] font-semibold text-ink-soft">{w}</div>
      {/each}
    </div>

    <!-- Days -->
    <div class="grid grid-cols-7 gap-1 px-4 pb-2">
      {#each cells as d}
        {#if d}
          <button
            class="flex h-11 items-center justify-center rounded-full text-[15px] transition-colors
              {sameISO(d) ? 'font-bold text-white' : isDisabled(d) ? 'text-ink-soft/30' : 'text-ink active:bg-paper'}
              {isToday(d) && !sameISO(d) ? 'font-bold' : ''}"
            style={sameISO(d)
              ? 'background: var(--color-teal);'
              : isToday(d)
                ? 'color: var(--color-teal);'
                : ''}
            disabled={isDisabled(d)}
            onclick={() => pick(d)}
          >
            {d.getDate()}
          </button>
        {:else}
          <div class="h-11"></div>
        {/if}
      {/each}
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between border-t border-line px-5 py-3">
      <button
        class="rounded-lg px-3 py-2 text-[13px] font-semibold text-ink-soft active:bg-paper"
        onclick={() => onclear?.()}
      >
        Clear
      </button>
      <div class="flex gap-1">
        <button
          class="rounded-lg px-4 py-2 text-[13px] font-semibold text-ink-soft active:bg-paper"
          onclick={() => oncancel?.()}
        >
          Cancel
        </button>
        <button
          class="rounded-lg px-5 py-2 text-[13px] font-bold text-white active:opacity-90 disabled:opacity-40"
          style="background: var(--color-teal);"
          disabled={!selected}
          onclick={() => onset?.(selected)}
        >
          Set
        </button>
      </div>
    </div>
  </div>
</div>
