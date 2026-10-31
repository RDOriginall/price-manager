import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerSW({ immediate: true })

if (navigator.storage?.persist) {
  navigator.storage.persist();
}


// ---------------------------------- debug -------------------------------------------

if (new URLSearchParams(location.search).has('debug')) {
  const box = document.createElement('pre');
  box.style.cssText =
    'position:fixed;left:0;right:0;bottom:0;max-height:40vh;overflow:auto;margin:0;padding:8px;background:#000;color:#0f0;font-size:11px;z-index:99999;direction:ltr;white-space:pre-wrap';
  document.body.appendChild(box);
  const log = (msg: string) => { box.textContent += msg + '\n'; };

  log(`online=${navigator.onLine}`);
  log(`sw controller=${!!navigator.serviceWorker?.controller}`);
  navigator.storage?.persisted?.().then((p) => log(`persisted=${p}`));
  window.addEventListener('error', (e) => log(`error: ${e.message}`));
  window.addEventListener('unhandledrejection', (e) => log(`rejection: ${String(e.reason)}`));
}