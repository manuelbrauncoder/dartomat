const KEY_PLAYERS = 'dartomat.players.v1';
const KEY_GAME = 'dartomat.game.v1';
const RECENT_LIMIT = 16;

function safeParse(json) {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function loadRecentPlayers() {
  const data = safeParse(localStorage.getItem(KEY_PLAYERS));
  if (!Array.isArray(data)) return [];
  return data.filter((n) => typeof n === 'string').slice(0, RECENT_LIMIT);
}

export function rememberNames(names) {
  const previous = loadRecentPlayers();
  const merged = [];
  const seen = new Set();
  for (const list of [names, previous]) {
    for (const raw of list) {
      const name = String(raw || '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(name);
      if (merged.length >= RECENT_LIMIT) break;
    }
    if (merged.length >= RECENT_LIMIT) break;
  }
  localStorage.setItem(KEY_PLAYERS, JSON.stringify(merged));
}

export function loadGame() {
  return safeParse(localStorage.getItem(KEY_GAME));
}

export function saveGame(game) {
  if (!game) {
    localStorage.removeItem(KEY_GAME);
    return;
  }
  localStorage.setItem(KEY_GAME, JSON.stringify(game));
}

export function clearGame() {
  localStorage.removeItem(KEY_GAME);
}

function shuffled(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createGame({ names, doubleOut, startScore = 301 }) {
  return {
    mode: '301',
    startScore,
    doubleOut: !!doubleOut,
    players: shuffled(names).map((name, i) => ({
      id: `${Date.now().toString(36)}-${i}`,
      name,
      score: startScore,
    })),
    currentPlayerIdx: 0,
    currentTurnDarts: [],
    history: [],
    winnerIdx: null,
    createdAt: Date.now(),
  };
}
