import { applyDart, undoLast, formatDart, TURN_DARTS } from './game301.js';
import { recommendCheckout } from './checkout.js';
import {
  loadRecentPlayers,
  rememberNames,
  saveGame,
  clearGame,
  createGame,
} from './state.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function initUI({ initialGame, onGameChange }) {
  const setupScreen = $('#setup');
  const gameScreen = $('#game');

  const setupState = {
    names: [],
    doubleOut: true,
  };

  let game = initialGame || null;
  let pendingMultiplier = 1;

  // ---------- Setup screen ----------

  const playerListEl = $('#player-list');
  const nameInput = $('#add-player-input');
  const addForm = $('#add-player-form');
  const startBtn = $('#start-game');
  const recentBox = $('#recent-names');
  const recentList = $('#recent-names-list');
  const setupDoubleOut = $('#setup-double-out');

  function renderSetup() {
    playerListEl.innerHTML = '';
    setupState.names.forEach((name, i) => {
      const li = document.createElement('li');
      li.className = 'player-row';
      li.innerHTML = `
        <span class="order">${i + 1}.</span>
        <span class="name"></span>
        <button class="icon-btn" data-action="up" aria-label="Nach oben" ${i === 0 ? 'disabled' : ''}>▲</button>
        <button class="icon-btn" data-action="down" aria-label="Nach unten" ${i === setupState.names.length - 1 ? 'disabled' : ''}>▼</button>
        <button class="icon-btn" data-action="remove" aria-label="Entfernen">✕</button>
      `;
      $('.name', li).textContent = name;
      li.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === 'up' && i > 0) {
          [setupState.names[i - 1], setupState.names[i]] = [setupState.names[i], setupState.names[i - 1]];
        } else if (action === 'down' && i < setupState.names.length - 1) {
          [setupState.names[i + 1], setupState.names[i]] = [setupState.names[i], setupState.names[i + 1]];
        } else if (action === 'remove') {
          setupState.names.splice(i, 1);
        }
        renderSetup();
      });
      playerListEl.appendChild(li);
    });

    startBtn.disabled = setupState.names.length < 1;
    renderRecent();
  }

  function renderRecent() {
    const recent = loadRecentPlayers().filter(
      (n) => !setupState.names.some((existing) => existing.toLowerCase() === n.toLowerCase()),
    );
    if (recent.length === 0) {
      recentBox.hidden = true;
      return;
    }
    recentBox.hidden = false;
    recentList.innerHTML = '';
    recent.slice(0, 8).forEach((name) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.textContent = name;
      btn.addEventListener('click', () => {
        addPlayer(name);
      });
      recentList.appendChild(btn);
    });
  }

  function addPlayer(rawName) {
    const name = String(rawName || '').trim();
    if (!name) return;
    if (setupState.names.some((n) => n.toLowerCase() === name.toLowerCase())) return;
    setupState.names.push(name);
    renderSetup();
  }

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addPlayer(nameInput.value);
    nameInput.value = '';
    nameInput.focus();
  });

  setupDoubleOut.addEventListener('change', () => {
    setupState.doubleOut = setupDoubleOut.checked;
  });

  startBtn.addEventListener('click', () => {
    if (setupState.names.length < 1) return;
    game = createGame({ names: setupState.names, doubleOut: setupState.doubleOut });
    rememberNames(setupState.names);
    persistAndRender();
    showGame();
  });

  // ---------- Game screen ----------

  const scoreboardEl = $('#scoreboard');
  const dartsEl = $('#current-darts');
  const numbersEl = $('#numbers');
  const multButtons = $$('.mult-btn');
  const undoBtn = $('#undo');
  const openMenuBtn = $('#open-menu');
  const menuSheet = $('#menu-sheet');
  const gameDoubleOut = $('#game-double-out');
  const restartBtn = $('#restart-game');
  const abortBtn = $('#abort-game');
  const winOverlay = $('#win-overlay');
  const winnerNameEl = $('#winner-name');
  const standingsEl = $('#final-standings');
  const newGameBtn = $('#new-game');
  const backToSetupBtn = $('#back-to-setup');
  const gameModeSubEl = $('#game-mode-sub');
  const checkoutHintEl = $('#checkout-hint');
  const checkoutRouteEl = $('#checkout-route');

  function buildNumberPad() {
    numbersEl.innerHTML = '';
    for (let n = 1; n <= 20; n++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'num-btn';
      b.dataset.value = String(n);
      b.textContent = String(n);
      numbersEl.appendChild(b);
    }
  }

  buildNumberPad();

  function setMultiplier(m) {
    pendingMultiplier = m;
    multButtons.forEach((b) => {
      b.classList.toggle('is-active', Number(b.dataset.mult) === m);
    });
  }

  multButtons.forEach((b) => {
    b.addEventListener('click', () => {
      setMultiplier(Number(b.dataset.mult));
    });
  });

  numbersEl.addEventListener('click', handleNumberClick);
  $('.specials').addEventListener('click', handleNumberClick);

  function handleNumberClick(e) {
    const btn = e.target.closest('button[data-value]');
    if (!btn || btn.disabled) return;
    const v = Number(btn.dataset.value);
    let m = pendingMultiplier;
    let value = v;
    if (v === 50) {
      // Double-Bull: explizit, Multiplikator wird ignoriert.
      m = 2;
      value = 25;
    } else if (v === 25) {
      // Single Bull bzw. Double-Bull, je nach Multiplikator. Triple gibt's auf Bull nicht.
      if (m === 3) m = 1;
      value = 25;
    } else if (v === 0) {
      m = 1;
    }
    if (!game || game.winnerIdx !== null) return;
    const result = applyDart(game, { multiplier: m, value });
    if (!result.applied) return;
    setMultiplier(1); // nach jedem Wurf zurück auf Single
    persistAndRender();
  }

  undoBtn.addEventListener('click', () => {
    if (!game) return;
    if (undoLast(game)) {
      setMultiplier(1);
      persistAndRender();
    }
  });

  openMenuBtn.addEventListener('click', () => {
    if (!game) return;
    gameDoubleOut.checked = !!game.doubleOut;
    menuSheet.hidden = false;
  });

  menuSheet.addEventListener('click', (e) => {
    if (e.target.closest('[data-close-menu]')) {
      menuSheet.hidden = true;
    }
  });

  gameDoubleOut.addEventListener('change', () => {
    if (!game) return;
    game.doubleOut = gameDoubleOut.checked;
    persistAndRender();
  });

  restartBtn.addEventListener('click', () => {
    if (!game) return;
    const names = game.players.map((p) => p.name);
    game = createGame({ names, doubleOut: game.doubleOut });
    menuSheet.hidden = true;
    setMultiplier(1);
    persistAndRender();
  });

  abortBtn.addEventListener('click', () => {
    if (!confirm('Spiel wirklich abbrechen?')) return;
    game = null;
    clearGame();
    menuSheet.hidden = true;
    showSetup();
  });

  newGameBtn.addEventListener('click', () => {
    if (!game) return;
    const names = game.players.map((p) => p.name);
    game = createGame({ names, doubleOut: game.doubleOut });
    setMultiplier(1);
    persistAndRender();
  });

  backToSetupBtn.addEventListener('click', () => {
    game = null;
    clearGame();
    showSetup();
  });

  // ---------- Render ----------

  function persistAndRender() {
    saveGame(game);
    if (typeof onGameChange === 'function') onGameChange(game);
    renderGame();
  }

  function renderGame() {
    if (!game) return;

    gameModeSubEl.textContent = game.doubleOut ? 'Double-Out' : 'Straight-Out';

    scoreboardEl.innerHTML = '';
    let currentRowEl = null;
    game.players.forEach((p, i) => {
      const li = document.createElement('li');
      li.className = 'score-row';
      if (i === game.currentPlayerIdx && game.winnerIdx === null) {
        li.classList.add('is-current');
        currentRowEl = li;
      }
      if (game.winnerIdx === i) li.classList.add('is-winner');
      li.innerHTML = `
        <span class="name"></span>
        <span class="score"></span>
      `;
      $('.name', li).textContent = p.name;
      $('.score', li).textContent = p.score;
      scoreboardEl.appendChild(li);
    });

    if (currentRowEl) scrollRowIntoViewIfNeeded(currentRowEl);

    const slots = $$('.dart-slot', dartsEl);
    slots.forEach((slot, idx) => {
      const dart = game.currentTurnDarts[idx];
      slot.classList.toggle('has-value', !!dart);
      slot.classList.remove('is-bust');
      slot.textContent = dart ? `${formatDart(dart)} = ${dart.points}` : '—';
    });

    undoBtn.disabled = game.history.length === 0;

    renderCheckoutHint();

    if (game.winnerIdx !== null) {
      winnerNameEl.textContent = `${game.players[game.winnerIdx].name} gewinnt!`;
      renderStandings();
      winOverlay.hidden = false;
    } else {
      winOverlay.hidden = true;
    }
  }

  function hideCheckoutHint() {
    if (!checkoutHintEl || !checkoutRouteEl) return;
    checkoutHintEl.hidden = true;
    checkoutRouteEl.textContent = '';
    checkoutHintEl.classList.remove('is-impossible');
  }

  function renderCheckoutHint() {
    if (!checkoutHintEl || !checkoutRouteEl) return;

    if (game.winnerIdx !== null) {
      hideCheckoutHint();
      return;
    }

    const player = game.players[game.currentPlayerIdx];
    const rec = recommendCheckout({
      score: player.score,
      dartsLeft: TURN_DARTS - game.currentTurnDarts.length,
      doubleOut: game.doubleOut,
    });

    if (rec.status === 'hidden') {
      hideCheckoutHint();
      return;
    }

    checkoutHintEl.hidden = false;
    checkoutRouteEl.textContent = rec.label;
    checkoutHintEl.classList.toggle('is-impossible', rec.status === 'impossible');
  }

  function scrollRowIntoViewIfNeeded(rowEl) {
    const parent = scoreboardEl;
    const rowLeft = rowEl.offsetLeft - parent.offsetLeft;
    const rowRight = rowLeft + rowEl.offsetWidth;
    const viewLeft = parent.scrollLeft;
    const viewRight = viewLeft + parent.clientWidth;
    if (rowLeft >= viewLeft && rowRight <= viewRight) return;
    const target = rowLeft - (parent.clientWidth - rowEl.offsetWidth) / 2;
    parent.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }

  function renderStandings() {
    standingsEl.innerHTML = '';
    const ranked = game.players
      .map((p, idx) => ({ name: p.name, score: p.score, idx }))
      .sort((a, b) => a.score - b.score);
    ranked.forEach((entry, rank) => {
      const li = document.createElement('li');
      if (entry.idx === game.winnerIdx) li.classList.add('is-winner');
      li.innerHTML = `
        <span class="rank"></span>
        <span class="name"></span>
        <span class="score"></span>
      `;
      $('.rank', li).textContent = entry.idx === game.winnerIdx ? '🏆' : `${rank + 1}.`;
      $('.name', li).textContent = entry.name;
      $('.score', li).textContent = entry.score;
      standingsEl.appendChild(li);
    });
  }

  // ---------- Screen switching ----------

  function showSetup() {
    setupState.names = [];
    setupState.doubleOut = true;
    setupDoubleOut.checked = true;
    renderSetup();
    setupScreen.hidden = false;
    gameScreen.hidden = true;
    winOverlay.hidden = true;
    menuSheet.hidden = true;
    if (checkoutHintEl) hideCheckoutHint();
  }

  function showGame() {
    setupScreen.hidden = true;
    gameScreen.hidden = false;
    setMultiplier(1);
    renderGame();
  }

  // Initial render
  if (game) {
    showGame();
  } else {
    showSetup();
  }
}
