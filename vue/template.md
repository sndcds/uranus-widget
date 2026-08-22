# Uranus Widget — Styling-Übersicht

Das Widget rendert sich in einen **Shadow DOM**. Alle folgenden Klassen und Variablen
werden **nur innerhalb des Shadow Roots** angewandt und kollidieren daher nicht mit dem
äußeren Seiten-Layout.

Du kannst das Aussehen auf zwei Ebenen anpassen:

1. **CSS-Variablen auf `:host`** (Präfix `--uw-`) — schnell, zentral, für Farben/Radii/Schrift.
2. **Konkrete Klassen (BEM, Präfix `.uw-`)** — für Layout-Feinheiten und Zustände.

---

## 1. Style-Rangfolge

Die Kaskade im Shadow Root ist **eine geladene Liste in fester Reihenfolge** (spätere Regeln
gewinnen) und die externe Einbindung geschieht am Schluss:

```
1. Internes Standard-CSS  (src/styles/index.css — eingebettet in den Bundle)
2. Externe Typen (classes) aus config["styles"], in angegebener Reihenfolge
   → später aufgeführte Dateien gewinnen gegen frühere
```

Konkret:

| Stufe | Quelle | Beispiel |
|-------|--------|----------|
| Basis | Tokens auf `:host` (`--uw-*`) | Farben, Radii, Schrift |
| Default | Interne `.uw-*`-Regeln | Layout, Abstände, Zustände |
| Override | Externe CSS-Dateien (via `config.styles`) | Beliebige `.uw-*`-Regeln oder erneut `--uw-*` auf `:host` |

**Wichtig:**
- Um eine interne Regel zu **überschreiben**, genügt gleichbenannte, gleichspezifische
  Regel nach dem Laden — später gewinnt. Halte externe Selektoren möglichst auf gleicher
  Spezifität (eine Klasse) und wirf bei hartnäckigen Kollisionen mit `!important`, also
  sparsam.
- Externe Dateien werden **nach** dem internen CSS in den Shadow Root geladen, dürfen daher
  problemlos `--uw-*`-Variablen neu setzen oder `.uw-*`-Klassen anpassen.
- **Responsive Regeln** (`@media` in `event.css`/`media.css`) können ebenfalls über externe
  Media-Queries überlagert werden — vorausgesetzt sie werden danach geladen.

---

## 2. Design-Tokens (CSS-Variablen auf `:host`)

Alle Variablen tragen den Prefix `--uw-`, um klar zu zeigen, dass sie zum Widget gehören und
nicht mit dem Host-Seiten-Design kollidieren.

| Variable | Beschreibung | Default |
|----------|--------------|---------|
| `--uw-font-family` | Text-Schriftfamilie | `inherit` |
| `--uw-radius` | Standard-Eckenrundung | `0` |
| `--uw-radius-pill` | Pill-Eckenrundung (Chips) | `999px` |
| `--uw-color-page` | Feld-/Kartenhintergrund hell | `#ffffff` |
| `--uw-color-page-hover` | Hover auf neutralen Flächen | `#eaeaea` |
| `--uw-color-page-border` | Rahmengrundfarbe | `#eaeaea` |
| `--uw-color-page-border-strong` | Kräftigere Rahmen / Fokus | `#d5d5d5` |
| `--uw-color-card` | Event-Karten-Hintergrund | `#f1f1f1` |
| `--uw-color-card-hover` | Karten-Hover | `#e4e4e4` |
| `--uw-color-card-text` | Karten-Text | `#1a1a1a` |
| `--uw-color-card-text-hover` | Karten-Text-Hover | `#1a73e8` |
| `--uw-color-card-placeholder` | „Kein Bild“-Text | `#dddddd` |
| `--uw-color-text` | Grundtext | `#1a1a1a` |
| `--uw-color-text-muted` | Sekundärtext | `#777777` |
| `--uw-color-text-subtle` | Zustandstext (Laden/leer) | `#888888` |
| `--uw-color-primary` | Akzentfarbe (Buttons, aktive Chips, Links) | `#1a73e8` |
| `--uw-color-primary-hover` | Akzent-Hover | `#1558b0` |
| `--uw-color-danger` | Fehlerfarbe | `#d32f2f` |
| `--uw-color-button-bg` | Button-Hintergrund | `#101010` |
| `--uw-color-button-bg-hover` | Button-Hover | `#434343` |
| `--uw-color-button-text` | Button-Text | `#ffffff` |
| `--uw-color-button-text-hover` | Button-Text-Hover | `#ffffff` |

Zusätzlich gibt es **optionale Auszeichnungs-Tokens**, die vom Basis-CSS nicht gesetzt,
aber von den mitgelieferten Themes (z. B. `theme-blaupause.css`) auf `:host` definiert
werden. Eigene Themes können sie frei setzen oder neue benannte Tokens ergänzen:

| Variable | Beschreibung | Beispiel-Default (Theme) |
|----------|--------------|---------------------------|
| `--uw-font-heading` | Serif-/Display-Schrift für Überschriften | `"Playfair Display", Georgia, "Times New Roman", serif` |
| `--uw-font-accent` | Schrift für Labels/Meta/Aktionen | `"Epilogue", system-ui, sans-serif` |
| `--uw-accent-soft` | Helle Akzent-/Flächenfarbe (Banner, Meta) | `#eaf2fe` |
| `--uw-accent-line` | Dezente Akzent-Linie/Umrandung | `#c9dcf9` |

Die internen Klassendateien **verwenden ausschließlich diese Variablen** — es gibt keine
hartkodierten Farben mehr. Möchtest du nur Farbe/Radius ändern, brauchst du keine einzige
Klassen-Regel, sondern nur diese Variablen auf `:host`.

---

## 3. BEM-Konvention

- **Block**: `.uw-*` (z. B. `.uw-card`, `.uw-filter`)
- **Element**: `__element` (z. B. `.uw-filter__chip`)
- **Modifier**: `--modifier` (z. B. `.uw-filter__chip--active`, `.uw-button--big`)
- **Zustände** (`:hover`, `:focus`, `:disabled`): als Pseudo-Klassen an der jeweiligen Regel.

BEM flach halten: keine verschachtelten Element-Blocks wie `.uw-filter__search-input`
(als eigenes Element innerhalb `.uw-filter`), keine Modifier-Ketten.

---

## 4. Klassen-Übersicht

### A. Listen-Seite

#### Rahmen & Kopf
| Klasse | Gestaltet |
|--------|-----------|
| `.uw-widget` | Gesamt-Container: Schrift, Zeilenhöhe, Textfarbe, max. Breite, Zentrierung |
| `.uw-widget__header` | Kopfzeile (Titel + Zähler), Flex-Layout, Abstand |
| `.uw-widget__title` | Überschrift „Events“: Größe, Gewicht, Margin |
| `.uw-widget__count` | Event-Zähler: gedämpfte Schriftfarbe, Größe |

#### Filterleiste
| Klasse | Gestaltet |
|--------|-----------|
| `.uw-filter` | Filterleiste: Flex, Umbruch, Ausrichtung, Abstand |
| `.uw-filter__search` | Suchblock (Input + Button): Flex, Mindestbreite |
| `.uw-filter__search-input` | Suchfeld: Rahmen, Radius, Hintergrund, Schrift |
| `.uw-filter__search-input:focus` | Fokus-Zustand des Suchfelds |
| `.uw-filter__search-button` | Such-Button: Akzent-Hintergrund, Border, Radius, Schrift |
| `.uw-filter__search-button:hover` | Hover-Zustand des Such-Buttons |
| `.uw-select` | `<select>` (Event-Typ & Zeitraum): Größe, Rahmen, Radius, Hintergrund, Schrift, Cursor |
| `.uw-select:focus` | Fokus-Zustand der Selects |
| `.uw-select:disabled` | Select im Ladezustand (gedimmt, Warte-Cursor) |
| `.uw-filter__chips` | Container der Kategorie-Chips (row/wrap, Abstand) |
| `.uw-filter__chip` | Kategorie-Chip (inaktiv): Pill, Rahmen, Hintergrund, Schrift |
| `.uw-filter__chip:hover` | Hover-Zustand der Chips |
| `.uw-filter__chip--active` | Aktiver Chip: Akzent-Hintergrund, Text-/Border-Farbe |
| `.uw-filter__chip--active:hover` | Hover auf aktivem Chip |

#### Liste & Zustände
| Klasse | Gestaltet |
|--------|-----------|
| `.uw-container` | Listen-Wrapper: relative Position, Mindesthöhe |
| `.uw-container__loading` | „Lädt…“-Indikator beim Nachladen (absolut oben rechts) |
| `.uw-list` | Abfolge der Karten (vertikale Flex-Liste, Abstand) |
| `.uw-is-loading` | Zentraler Ladezustand |
| `.uw-is-error` | Zentraler Fehlerzustand (Fehlerfarbe) |
| `.uw-is-empty` | Zentraler Leerzustand („Keine Events gefunden“) |
| `.uw-load-more` | Wrapper des „Mehr laden“-Buttons (strukturell, ohne eigene Farbe/Abstands-Regel) |

#### Event-Karte
| Klasse | Gestaltet |
|--------|-----------|
| `.uw-card` | Basis-Kartenblock: Flex, Rahmen, Radius, Überlauf, Hintergrund, Textfarbe, Cursor |
| `.uw-card:hover` | Karten-Hover: Hintergrund-/Textfarbe |
| `.uw-card__content` | Textbereich rechts neben dem Bild (Flex, Padding, min-width) |
| `.uw-card__placeholder` | „Kein Bild“-Box: zentrierter Text, Hintergrund, Platzhalter-Farbe |
| `.uw-event-card` | Event-Karte: Karten-Hintergrund |
| `.uw-event-card__content` | Innerer Text-Stapel (Spalten-Layout) |
| `.uw-event-card__image` | Bildfläche: feste Breite/Höhe, Überlauf-Schnitt |
| `.uw-event-card__image img` | Bild selbst: Füllen, `object-fit: cover` |
| `.uw-event-card__date` | Datum-Zeile: Größe, Gewicht, Margin |
| `.uw-event-card__title` | Event-Titel: Größe, Gewicht, Margin |
| `.uw-event-card__subtitle` | Untertitel: Schriftgröße, Margin |
| `.uw-event-card__meta` | Ort/Stadt: kleine Schrift, Margin |
| `.uw-event-card__summary` | Beschreibung: Zeilen-Clipping (max. 3 Zeilen), Größe |

#### Buttons
| Klasse | Gestaltet |
|--------|-----------|
| `.uw-button` | Generischer Button: Größe, Radius, Hintergrund, Textfarbe, Cursor, Übergang |
| `.uw-button:hover` | Hover-Zustand |
| `.uw-button--big` | Große Button-Variante (Schrift + Padding) |

---

### B. Detail-Seite

| Klasse | Gestaltet |
|--------|-----------|
| `.uw-detail__container` | Detail-Wrapper (strukturell, ohne eigene Style-Regel) |
| `.uw-detail__image` | Großes Titelbild: Abstand, Radius, Überlauf-Schnitt |
| `.uw-detail__image img` | Detail-Bild: volle Breite, Block-Display |
| `.uw-detail__body` | Textblock unter dem Bild, max. Breite |
| `.uw-detail__title` | Detail-Titel: Größe, Gewicht, Margin |
| `.uw-detail__subtitle` | Untertitel: Größe, Margin, Textfarbe |
| `.uw-detail__meta` | Metadaten (Datum/Uhrzeit, Ort): kleine Schrift, Textfarbe, Abstand |
| `.uw-detail__meta p` | Einzelne Meta-Zeile (Abstände) |
| `.uw-detail__description` | Beschreibungstext: Größe, Zeilenhöhe, Textfarbe, Abstand |
| `.uw-detail__description p` | Absätze der Beschreibung |
| `.uw-detail__links` | Linkliste (Veranstaltungslink, Webseite …): Spalten-Flex, Abstand |
| `.uw-detail__links a` | Einzelner Link: Akzentfarbe, ohne Unterstreichung |
| `.uw-detail__links a:hover` | Link-Hover: Unterstreichung |

Zurück-Button: `.uw-button`, `.uw-button--big`. Zustände: `.uw-is-loading`, `.uw-is-error`.

---

## 5. Praktische Hinweise

- **Minimale Einbindung**: Ohne `config.styles` und ohne Variable-Overrides erscheint das
  Widget im internen, neutralen Default-Look.
- **Nur Theme umschalten** → Variablen setzen, keine Datei nötig:

  ```css
  :host {
    --uw-color-primary: #2e7d32;
    --uw-radius: 12px;
  }
  ```

- **Layout anpassen** → externe CSS-Datei in `config.styles` listen und `.uw-*`-Klassen
  überschreiben (Beispieldatei: `demo/theme.css`).
- **Dead/veraltete Klassennamen** werden nach Möglichkeit entfernt und nicht dokumentiert.
  Maßgeblich ist immer, welche Klassen in den `.vue`-Templates gerendert werden.
