import { mountApp } from './app';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('AltSolver: #app element not found');
  }
  mountApp(root);
});
