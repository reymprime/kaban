<script>
  import { lockScroll } from '../lib/scrollLock.js';
  import { vault, setupPassword, unlockVault, changePassword, toast } from '../lib/store.svelte.js';

  let { mode, onclose } = $props(); // 'setup' | 'unlock' | 'change'

  let password = $state(''); // current password (unlock/change) or new password (setup)
  let newPassword = $state('');
  let confirm = $state('');
  let acknowledged = $state(false);
  let busy = $state(false);
  let error = $state('');
  let showPw = $state(false);

  async function handleChange() {
    error = '';
    if (newPassword.length < 4) {
      error = 'New password must be at least 4 characters.';
      return;
    }
    if (newPassword !== confirm) {
      error = 'New passwords do not match.';
      return;
    }
    busy = true;
    try {
      const n = await changePassword(password, newPassword);
      toast(
        n
          ? `Password changed — ${n} card${n === 1 ? '' : 's'} re-encrypted ✓`
          : 'Password changed ✓'
      );
      onclose();
    } catch (e) {
      error = e.message || 'Something went wrong.';
    } finally {
      busy = false;
    }
  }

  async function handleSetup() {
    error = '';
    if (password.length < 4) {
      error = 'Password must be at least 4 characters.';
      return;
    }
    if (password !== confirm) {
      error = 'Passwords do not match.';
      return;
    }
    if (!acknowledged) {
      error = 'Please confirm you understand there is no recovery.';
      return;
    }
    busy = true;
    try {
      await setupPassword(password);
      toast('Vault password set — unlocked for this session');
      onclose();
    } catch (e) {
      error = e.message || 'Something went wrong.';
    } finally {
      busy = false;
    }
  }

  async function handleUnlock() {
    error = '';
    if (!password) return;
    busy = true;
    try {
      await unlockVault(password);
      toast('Vault unlocked ✓');
      onclose();
    } catch {
      error = 'Wrong password. Try again.';
    } finally {
      busy = false;
    }
  }

  function onBackdrop(e) {
    if (e.target === e.currentTarget) onclose();
  }

  function onKeydown(e) {
    if (e.key === 'Enter') {
      if (mode === 'setup') handleSetup();
      else if (mode === 'change') handleChange();
      else handleUnlock();
    }
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
  use:lockScroll
  onclick={onBackdrop}
  role="presentation"
>
  <div
    class="pop-in w-full max-w-lg rounded-t-3xl bg-card p-5 sm:rounded-3xl"
    role="dialog"
    aria-modal="true"
    aria-label={mode === 'setup' ? 'Set vault password' : 'Unlock vault'}
    style="padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));"
  >
    <div class="mb-1 flex items-center gap-2">
      <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-soft">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
        </svg>
      </div>
      <h2 class="font-display text-lg font-bold">
        {mode === 'setup'
          ? 'Set vault password'
          : mode === 'change'
            ? 'Change vault password'
            : 'Unlock vault'}
      </h2>
      <button
        class="ml-auto rounded-lg p-1.5 text-ink-soft active:bg-line"
        aria-label="Close"
        onclick={onclose}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    {#if mode === 'setup'}
      <p class="mb-3 text-[13px] text-ink-soft">
        One password protects all cards you mark with the shield. Content is
        encrypted (AES-256) on your device.
      </p>

      <!-- THE warning -->
      <div
        class="mb-4 rounded-xl border p-3"
        style="border-color: var(--color-cat-video); background: var(--color-cat-video-soft);"
      >
        <p class="text-[13px] font-bold" style="color: var(--color-cat-video);">
          ⚠ NO PASSWORD RECOVERY
        </p>
        <p class="mt-1 text-[12px] leading-relaxed text-ink-soft">
          If you forget this password, the content of all protected cards
          becomes <span class="font-bold text-ink">unreadable forever</span>.
          There is no reset, no "forgot password", and no one can help — not
          even the developer. Choose a password you will never forget.
        </p>
      </div>
    {:else if mode === 'change'}
      <p class="mb-4 text-[13px] text-ink-soft">
        Enter your current password, then choose a new one. All protected
        cards will be re-encrypted with the new password. The
        <span class="font-semibold text-ink">no-recovery rule still applies</span>.
      </p>
    {:else}
      <p class="mb-4 text-[13px] text-ink-soft">
        Enter your vault password to access protected cards for this session.
      </p>
    {/if}

    <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="sec-pw">
      {mode === 'change' ? 'Current password' : 'Password'}
    </label>
    <div class="relative mb-3">
      <input
        id="sec-pw"
        type={showPw ? 'text' : 'password'}
        bind:value={password}
        onkeydown={onKeydown}
        autocomplete="off"
        class="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 pr-11 text-[15px] focus:border-teal focus:outline-none"
      />
      <button
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-soft active:bg-line"
        aria-label={showPw ? 'Hide password' : 'Show password'}
        onclick={() => (showPw = !showPw)}
      >
        {#if showPw}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
            <path d="m4 4 16 16" />
          </svg>
        {/if}
      </button>
    </div>

    {#if mode === 'change'}
      <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="sec-npw">
        New password
      </label>
      <input
        id="sec-npw"
        type={showPw ? 'text' : 'password'}
        bind:value={newPassword}
        onkeydown={onKeydown}
        autocomplete="off"
        class="mb-3 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[15px] focus:border-teal focus:outline-none"
      />
      <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="sec-npw2">
        Confirm new password
      </label>
      <input
        id="sec-npw2"
        type={showPw ? 'text' : 'password'}
        bind:value={confirm}
        onkeydown={onKeydown}
        autocomplete="off"
        class="mb-3 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[15px] focus:border-teal focus:outline-none"
      />
    {/if}

    {#if mode === 'setup'}
      <label class="mb-1 block text-[12px] font-semibold text-ink-soft" for="sec-pw2">
        Confirm password
      </label>
      <input
        id="sec-pw2"
        type={showPw ? 'text' : 'password'}
        bind:value={confirm}
        onkeydown={onKeydown}
        autocomplete="off"
        class="mb-3 w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[15px] focus:border-teal focus:outline-none"
      />

      <label class="mb-3 flex items-start gap-2 text-[12px] text-ink-soft">
        <input type="checkbox" bind:checked={acknowledged} class="mt-0.5 accent-[#0F766E]" />
        <span>
          I understand that <span class="font-semibold text-ink">the password
          cannot be recovered</span> and protected content will be lost forever
          if I forget it.
        </span>
      </label>
    {/if}

    {#if error}
      <p class="mb-3 text-[12px] font-semibold" style="color: var(--color-cat-video);">
        {error}
      </p>
    {/if}

    <button
      class="w-full rounded-xl bg-teal py-3 text-[14px] font-semibold text-white active:opacity-90 disabled:opacity-50"
      disabled={busy}
      onclick={mode === 'setup'
        ? handleSetup
        : mode === 'change'
          ? handleChange
          : handleUnlock}
    >
      {#if busy}
        {mode === 'setup'
          ? 'Setting up…'
          : mode === 'change'
            ? 'Re-encrypting…'
            : 'Checking…'}
      {:else}
        {mode === 'setup'
          ? 'Set password & unlock'
          : mode === 'change'
            ? 'Change password'
            : 'Unlock'}
      {/if}
    </button>

    {#if mode === 'unlock'}
      <p class="mt-3 text-center text-[11px] text-ink-soft">
        Forgot your password? Protected content cannot be recovered.
      </p>
    {/if}
  </div>
</div>
