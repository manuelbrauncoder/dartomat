// Reine Funktionen für 301-Regeln. Mutieren das übergebene Game-Objekt.

export const TURN_DARTS = 3;

export function isValidDart(dart) {
  if (!dart) return false;
  const { multiplier, value } = dart;
  if (![1, 2, 3].includes(multiplier)) return false;
  if (value === 0) return multiplier === 1;
  if (value === 25) return multiplier === 1 || multiplier === 2;
  return Number.isInteger(value) && value >= 1 && value <= 20;
}

export function dartPoints(dart) {
  return dart.multiplier * dart.value;
}

export function formatDart(dart) {
  if (!dart) return '';
  if (dart.value === 0) return 'Miss';
  if (dart.value === 25) return dart.multiplier === 2 ? 'D-Bull' : 'Bull';
  if (dart.multiplier === 1) return String(dart.value);
  if (dart.multiplier === 2) return `D${dart.value}`;
  return `T${dart.value}`;
}

function checkOutcome(game, prevScore, points, dart) {
  const newScore = prevScore - points;
  if (newScore < 0) return { bust: true, won: false, newScore };
  if (game.doubleOut) {
    if (newScore === 1) return { bust: true, won: false, newScore };
    if (newScore === 0) {
      const isDouble = dart.multiplier === 2;
      return isDouble ? { bust: false, won: true, newScore } : { bust: true, won: false, newScore };
    }
    return { bust: false, won: false, newScore };
  }
  if (newScore === 0) return { bust: false, won: true, newScore };
  return { bust: false, won: false, newScore };
}

export function applyDart(game, dart) {
  if (game.winnerIdx !== null) return { applied: false, reason: 'won' };
  if (!isValidDart(dart)) return { applied: false, reason: 'invalid' };

  const playerIdx = game.currentPlayerIdx;
  const player = game.players[playerIdx];
  const points = dartPoints(dart);
  const scoreBefore = player.score;
  const turnDartsBefore = game.currentTurnDarts.slice();

  const { bust, won, newScore } = checkOutcome(game, scoreBefore, points, dart);

  let turnEnded = false;
  const dartRecord = { multiplier: dart.multiplier, value: dart.value, points };

  if (bust) {
    turnEnded = true;
    // Bust verwirft die gesamte Aufnahme: vorherige Würfe dieser Aufnahme werden ebenfalls zurückgegeben.
    const partial = turnDartsBefore.reduce((sum, d) => sum + d.points, 0);
    player.score = scoreBefore + partial;
    game.currentTurnDarts = [];
    game.currentPlayerIdx = (playerIdx + 1) % game.players.length;
  } else {
    player.score = newScore;
    const nextTurn = [...turnDartsBefore, dartRecord];
    if (won) {
      turnEnded = true;
      game.winnerIdx = playerIdx;
      game.currentTurnDarts = nextTurn;
    } else if (nextTurn.length >= TURN_DARTS) {
      turnEnded = true;
      game.currentTurnDarts = [];
      game.currentPlayerIdx = (playerIdx + 1) % game.players.length;
    } else {
      game.currentTurnDarts = nextTurn;
    }
  }

  game.history.push({
    type: 'dart',
    playerIdx,
    dart: dartRecord,
    scoreBefore,
    turnDartsBefore,
    turnEnded,
    bust,
    won,
  });

  return { applied: true, bust, won, turnEnded };
}

export function undoLast(game) {
  const entry = game.history.pop();
  if (!entry) return false;
  game.players[entry.playerIdx].score = entry.scoreBefore;
  game.currentTurnDarts = entry.turnDartsBefore.slice();
  game.currentPlayerIdx = entry.playerIdx;
  if (entry.won) game.winnerIdx = null;
  return true;
}
