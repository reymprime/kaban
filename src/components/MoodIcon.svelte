<script>
  // Draws a custom mood face. Same look on every device.
  let { mood = 'okay', size = 24, color = 'currentColor', filled = false } = $props();

  // Eyes vary a little per mood; mouth path is the main expression.
  const faces = {
    great: { mouth: 'M8 14c1.3 2 6.7 2 8 0', eyes: 'dots', brow: null },
    good: { mouth: 'M8.5 14c1 1.3 6 1.3 7 0', eyes: 'dots', brow: null },
    okay: { mouth: 'M9 15h6', eyes: 'dots', brow: null },
    down: { mouth: 'M8 15.5c1.3-1.6 6.7-1.6 8 0', eyes: 'dots', brow: null },
    stressed: { mouth: 'M8 15.5c1.3-1.6 6.7-1.6 8 0', eyes: 'dots', brow: 'M7.5 8.5 10 10M16.5 8.5 14 10' },
    tired: { mouth: 'M9 15h6', eyes: 'lines', brow: null },
  };
  const f = $derived(faces[mood] || faces.okay);
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke={color}
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <circle cx="12" cy="12" r="9.2" fill={filled ? color : 'none'} fill-opacity={filled ? 0.12 : 0} />
  <!-- Eyes -->
  {#if f.eyes === 'dots'}
    <circle cx="9" cy="10.5" r="0.9" fill={color} stroke="none" />
    <circle cx="15" cy="10.5" r="0.9" fill={color} stroke="none" />
  {:else}
    <path d="M7.8 10.5h2.4" />
    <path d="M13.8 10.5h2.4" />
  {/if}
  <!-- Brow (only some moods) -->
  {#if f.brow}
    <path d={f.brow} />
  {/if}
  <!-- Mouth -->
  <path d={f.mouth} />
</svg>
