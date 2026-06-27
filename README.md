# Dartomat

Kleine Web-App zum Mitzählen von 301-Dartspielen. Plain HTML/CSS/JS, kein Build-Step.

## Starten

ES Modules brauchen einen HTTP-Server — `file://` funktioniert nicht. Im Projektordner einen der folgenden Server starten und dann die angezeigte URL im Browser öffnen.

```bash
# Python (vorinstalliert auf macOS)
python3 -m http.server 8000
```

```bash
# Node (npx, falls installiert)
npx serve .
```

Danach: <http://localhost:8000> öffnen.

## Bedienung

1. **Spieler hinzufügen:** Name eingeben → „Hinzufügen". Reihenfolge per ▲/▼ ändern, Spieler per ✕ entfernen. Zuletzt verwendete Namen erscheinen als Chips.
2. **Double-Out:** Toggle auf dem Setup-Screen (Standard: an). Auch im Spiel im Menü (⋯) jederzeit umschaltbar.
3. **Spiel starten:** Button „Spiel starten" (mind. 1 Spieler).
4. **Würfe eingeben:** Multiplikator wählen (Single/Double/Triple), dann Zahl tippen. `25` = Bull, `50` = Double-Bull, `Miss` = 0 Punkte. Der Multiplikator springt nach jedem Wurf zurück auf Single. Nach 3 Darts wechselt automatisch der Spieler.
5. **Korrigieren:** ↶ oben rechts macht den letzten Wurf rückgängig (auch über Bust und Spielerwechsel hinweg).
6. **Menü (⋯):** Double-Out umschalten, Neues Spiel mit gleichen Spielern, Spiel abbrechen.
7. **Checkout-Tipp:** Liegt der aktuelle Spieler im Checkout-Bereich, erscheint zwischen Punktestand und Aufnahme ein Vorschlag (z. B. `T20 · T19 · D12`). Der Tipp passt sich nach jedem Wurf und beim Umschalten von Double-Out an; bei unmöglichen Restpunkten steht „Kein Checkout möglich".

Der Spielstand wird automatisch im Browser gespeichert (LocalStorage) — ein Reload führt das laufende Spiel weiter.

## Struktur

```
index.html
styles.css
js/
  main.js       Bootstrap
  state.js      LocalStorage + Game-Factory
  game301.js    Regel-Engine (applyDart, undoLast, formatDart)
  checkout.js   Checkout-Empfehlungen (Chart + Solver)
  ui.js         DOM-Rendering & Event-Handling
```
