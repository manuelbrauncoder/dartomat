import { initUI } from './ui.js';
import { loadGame } from './state.js';

const game = loadGame();
initUI({ initialGame: game && game.players ? game : null });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service Worker registration failed:', err);
    });
  });
}
