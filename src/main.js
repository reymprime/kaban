import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { initShield } from './lib/shield.svelte.js';

const app = mount(App, { target: document.getElementById('app') });

// Register service worker for offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js')
      .then(() => initShield()) // start listening for shield block reports
      .catch((err) => console.warn('SW registration failed:', err));
  });
}

export default app;
