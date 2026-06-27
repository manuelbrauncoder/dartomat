import { formatDart } from './game301.js';

// Bogey numbers: no 3-dart double-out checkout exists.
const BOGEY_3 = new Set([159, 162, 163, 165, 166, 168, 169]);

const IMPOSSIBLE_LABEL = 'Kein Checkout möglich';

// Pro-style routes for common 3-dart double-out finishes (override solver tie-breaks).
const CURATED_3 = {
  170: 'T20 T20 D25',
  167: 'T20 T19 D25',
  164: 'T20 T18 D25',
  161: 'T20 T17 D25',
  160: 'T20 T20 D20',
  158: 'T20 T20 D19',
  157: 'T20 T19 D20',
  156: 'T20 T20 D18',
  155: 'T20 T19 D19',
  154: 'T20 T18 D20',
  153: 'T20 T19 D18',
  152: 'T20 T20 D16',
  151: 'T20 T17 D20',
  150: 'T20 T18 D18',
  149: 'T20 T19 D16',
  148: 'T20 T16 D20',
  147: 'T20 T17 D18',
  146: 'T20 T18 D16',
  145: 'T20 T15 D20',
  144: 'T20 T20 D12',
  143: 'T20 T17 D16',
  142: 'T20 T14 D20',
  141: 'T20 T15 D18',
  140: 'T20 T20 D10',
  139: 'T19 T14 D20',
  138: 'T20 T18 D12',
  137: 'T20 T19 D10',
  136: 'T20 T20 D8',
  135: 'T20 T17 D12',
  134: 'T20 T14 D16',
  133: 'T20 T19 D8',
  132: 'T20 T20 D6',
  131: 'T20 T13 D16',
  130: 'T20 T20 D5',
  129: 'T19 T16 D12',
  128: 'T18 T14 D16',
  127: 'T20 T17 D8',
  126: 'T19 T19 D6',
  125: 'T20 T19 D4',
  124: 'T20 T16 D8',
  123: 'T19 T16 D9',
  122: 'T20 T18 D4',
  121: 'T20 T19 D12',
  120: 'T20 S20 D20',
  119: 'T19 T20 D11',
  118: 'T20 T18 D2',
  117: 'T20 T17 D10',
  116: 'T20 T16 D4',
  115: 'T20 T19 D2',
  114: 'T20 T14 D12',
  113: 'T20 T17 D6',
  112: 'T20 T12 D16',
  111: 'T20 T13 D14',
  110: 'T20 S10 D20',
  109: 'T20 S9 D20',
  108: 'T20 S8 D20',
  107: 'T19 T10 D10',
  106: 'T20 S6 D20',
  105: 'T20 S5 D20',
  104: 'T20 S4 D20',
  103: 'T19 S10 D20',
  102: 'T20 S2 D20',
  101: 'T20 S1 D20',
  100: 'T20 D20',
  99: 'T19 S10 D16',
  98: 'T20 D19',
  97: 'T19 D20',
  96: 'T20 D18',
  95: 'T19 D19',
  94: 'T20 D17',
  93: 'T19 D18',
  92: 'T20 D16',
  91: 'T19 D17',
  90: 'T20 D15',
  89: 'T19 D16',
  88: 'T20 D14',
  87: 'T19 D15',
  86: 'T20 D13',
  85: 'T19 D14',
  84: 'T20 D12',
  83: 'T19 D13',
  82: 'T20 D11',
  81: 'T19 D12',
  80: 'T20 D10',
  79: 'T19 D11',
  78: 'T20 D9',
  77: 'T19 D10',
  76: 'T20 D8',
  75: 'T19 D9',
  74: 'T20 D7',
  73: 'T19 D8',
  72: 'T20 D6',
  71: 'T19 D7',
  70: 'T20 D5',
  69: 'T19 D6',
  68: 'T20 D4',
  67: 'T19 D5',
  66: 'T20 D3',
  65: 'T19 D4',
  64: 'T20 D2',
  63: 'T19 D3',
  62: 'T20 D1',
  61: 'T19 D2',
  60: 'S20 D20',
};

function parseToken(token) {
  const t = token.trim().toUpperCase();
  if (t === 'BULL' || t === '25') return { multiplier: 1, value: 25 };
  if (t === 'D25' || t === '50') return { multiplier: 2, value: 25 };
  const m = t.match(/^([TDS])(\d{1,2})$/);
  if (!m) return null;
  const mult = m[1] === 'T' ? 3 : m[1] === 'D' ? 2 : 1;
  const value = Number(m[2]);
  if (value < 1 || value > 20) return null;
  return { multiplier: mult, value };
}

function parseRoute(str) {
  return str
    .split(/\s+/)
    .map(parseToken)
    .filter(Boolean);
}

function dartPoints(dart) {
  return dart.multiplier * dart.value;
}

function buildAllSegments() {
  const segments = [];
  for (let value = 1; value <= 20; value++) {
    segments.push({ multiplier: 1, value });
    segments.push({ multiplier: 2, value });
    segments.push({ multiplier: 3, value });
  }
  segments.push({ multiplier: 1, value: 25 });
  segments.push({ multiplier: 2, value: 25 });
  segments.sort((a, b) => dartPoints(b) - dartPoints(a));
  return segments;
}

const ALL_SEGMENTS = buildAllSegments();

function isFinishingDouble(dart, doubleOut) {
  if (!doubleOut) return true;
  return dart.multiplier === 2;
}

function maxFinishable(doubleOut, dartsLeft) {
  if (dartsLeft <= 0) return 0;
  if (doubleOut) {
    if (dartsLeft === 1) return 50;
    if (dartsLeft === 2) return 110; // T20 + D25
    return 170;
  }
  return Math.min(180, 60 * dartsLeft);
}

function solve(score, dartsLeft, doubleOut) {
  if (score <= 0 || dartsLeft <= 0) return null;
  if (doubleOut && score === 1) return null;

  function search(remaining, left) {
    if (remaining === 0) return left === 0 ? [] : null;
    if (left <= 0 || remaining < 0) return null;
    if (doubleOut && remaining === 1) return null;

    if (left === 1) {
      for (const dart of ALL_SEGMENTS) {
        if (dartPoints(dart) !== remaining) continue;
        if (!isFinishingDouble(dart, doubleOut)) continue;
        return [dart];
      }
      return null;
    }

    for (const dart of ALL_SEGMENTS) {
      const pts = dartPoints(dart);
      if (pts >= remaining) continue;
      if (doubleOut && remaining - pts === 1) continue;
      const tail = search(remaining - pts, left - 1);
      if (tail) return [dart, ...tail];
    }
    return null;
  }

  return search(score, dartsLeft);
}

function bestRoute(score, doubleOut, maxDarts) {
  for (let d = 1; d <= maxDarts; d++) {
    const route = solve(score, d, doubleOut);
    if (route) return route;
  }
  return null;
}

// Build 3-dart double-out chart: curated overrides + shortest-route solver fill.
const CHECKOUT_CHART = {};
for (let score = 2; score <= 170; score++) {
  if (BOGEY_3.has(score)) continue;
  if (CURATED_3[score]) {
    CHECKOUT_CHART[score] = parseRoute(CURATED_3[score]);
    continue;
  }
  const route = bestRoute(score, true, 3);
  if (route) CHECKOUT_CHART[score] = route;
}

function routeLabel(route) {
  return route.map((d) => formatDart(d)).join(' · ');
}

export function recommendCheckout({ score, dartsLeft, doubleOut }) {
  const hidden = { status: 'hidden', route: null, label: '' };

  if (!Number.isInteger(score) || score <= 0) return hidden;
  if (!Number.isInteger(dartsLeft) || dartsLeft <= 0) return hidden;

  const max = maxFinishable(doubleOut, dartsLeft);
  if (score > max) return hidden;

  if (doubleOut && score === 1) {
    return { status: 'impossible', route: null, label: IMPOSSIBLE_LABEL };
  }

  let route = null;
  if (doubleOut && dartsLeft === 3 && CHECKOUT_CHART[score]) {
    route = CHECKOUT_CHART[score];
  } else {
    route = solve(score, dartsLeft, doubleOut);
  }

  if (!route) {
    return { status: 'impossible', route: null, label: IMPOSSIBLE_LABEL };
  }

  return { status: 'ok', route, label: routeLabel(route) };
}

// Sanity checks (dev): recommendCheckout({ score: 170, dartsLeft: 3, doubleOut: true })
// → T20 · T20 · D-Bull; 169 → impossible; 61/2 darts → T19 · D2
