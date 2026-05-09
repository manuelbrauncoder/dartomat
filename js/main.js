import { initUI } from './ui.js';
import { loadGame } from './state.js';

const game = loadGame();
initUI({ initialGame: game && game.players ? game : null });
