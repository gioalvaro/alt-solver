import { mountApp } from './app';

// The script is inlined at the end of <body>, so the DOM is already parsed
// by the time this runs. No need to wait for DOMContentLoaded — in fact,
// listening for it is unreliable: the event may already have fired.
const root = document.getElementById('app');
if (!root) {
  document.body.innerHTML =
    '<div style="color:#d93025;padding:24px;font-family:Roboto,sans-serif">AltSolver: #app element not found</div>';
} else {
  mountApp(root).catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    root.innerHTML = `<div style="color:#d93025;padding:24px;font-family:Roboto,sans-serif">AltSolver — Error de inicialización: ${msg}</div>`;
  });
}
