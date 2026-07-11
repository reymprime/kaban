// Body scroll lock — attach `use:lockScroll` to any modal's root element.
// While at least one modal is mounted, the page behind cannot scroll.
// Reference-counted so stacked modals (e.g. Settings -> Recap) behave.

let locks = 0;

export function lockScroll() {
  locks++;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  return {
    destroy() {
      locks--;
      if (locks <= 0) {
        locks = 0;
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
    },
  };
}
