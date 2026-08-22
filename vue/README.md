# Uranus Widget (Vue3)

Vue3-basiertes Events-Widget als **Web Component** (`<uranus-widget>`), das sich ohne Bundle-Abhängigkeiten in jede Website einbinden lässt.

## Aufbau

Die Codepbasis ist modular aufgebaut: eigene Components für die einzelnen Ansichten (Übersicht, Detail), getrennte CSS-Dateien sowie ein Composable für die komplette API-/Daten-Logik.

```
vue/
├── index.html                # Dev-Demo für `vite dev`
├── vite.config.js            # Vite-Konfiguration (Library-Build als Custom Element)
├── src/
│   ├── main.js               # registeriert das Custom Element
│   ├── UranusWidget.vue      # Root-Component: komponiert Ansichten und lädt Styles
│   ├── components/
│   │   ├── WidgetHeader.vue  # Titel + Event-Gesamtzahl
│   │   ├── FilterBar.vue     # Kategorie-Filter-Chips (v-model:selectedCategories)
│   │   ├── EventsList.vue    # Übersicht: Liste / leer / Laden / Fehler
│   │   ├── EventCard.vue     # einzelne Event-Karte (Klick → Detail)
│   │   ├── Pagination.vue    # Seitensteuerung ← Seite X von Y →
│   │   └── EventDetail.vue   # Detailansicht (Bild, Datum, Ort, Beschreibung, Links)
│   ├── composables/
│   │   ├── useEventsApi.js     # API-Logik (Events, Detail, Filter, Pagination)
│   │   ├── useWidgetConfig.js  # Konfig-Ladung (Props, JSON, externer Pfad)
│   │   └── useStyles.js        # lädt externes CSS in den Shadow Root
│   ├── lib/
│   │   ├── constants.js      # BASE_URL, PARAM_MAP, CATEGORIES
│   │   └── format.js         # Datums-/HTML-Helfer
│   └── styles/
│       ├── index.css         # bündelt alle Style-Module (im Shadow DOM injiziert)
│       ├── base.css          # CSS-Variablen, Layout, Lade-/Fehler-Zustände
│       ├── filter.css        # FilterBar
│       ├── events.css        # Karten, Liste, Pagination
│       ├── detail.css        # Detailansicht
│       └── media.css         # responsive Regeln
├── demo/
│   ├── embed.html            # Beispiel: Einbindung auf einer Website
│   ├── config.json           # Beispiel: externe Konfigurationsdatei
│   └── theme.css             # Beispiel: externes Theme-CSS
```

## Neue Views / Funktionen erweitern

- **Neue Ansicht**: Component unter `src/components/` anlegen und in `UranusWidget.vue` per Ansichts-Kondition (z. B. `v-if="view === 'planner'"`) einblenden.
- **Kompakte Styles**: Neues CSS-Modul unter `src/styles/` anlegen und in `src/styles/index.css` per `@import` aufnehmen. Alle Styles landen global im Shadow Root des Custom Elements — Kind-Components brauchen keinen eigenen `<style>`-Block.
- **Neue Daten-/API-Funktion**: Im Composable `useEventsApi.js` bündeln und in `UranusWidget.vue` zurückgeben.

## Build

```bash
cd vue
npm install
npm run build
```

Ergebnis in `dist/`:
- `dist/uranus-widget-vue.iife.js` — das komplette Widget als standalone IIFE-Bundle (Vue-Runtime inklusive)
- `dist/style.css` — optionale Basis-Styles (die SFC-Styles werden automatisch in den Shadow DOM injiziert)

## Einbindung auf einer Website

### Variante A — Externe Konfigurationsdatei (empfohlen)

Das Widget lädt seine Konfiguration aus einer externen JSON-Datei. Im Tag steht nur noch der relative Pfad zu dieser Datei — Konfigurationen lassen sich so unkompliziert extern bearbeiten und austauschen, ohne den Einbinde-Code anzufassen.

```html
<script src="uranus-widget-vue.js" defer></script>

<uranus-widget config-url="./config.json"></uranus-widget>
```

`config.json` (Beispiel):

```json
{
  "limit": 12,
  "city": "Glücksburg",
  "tags": "Klimapark,Energie",
  "start": "2026-07-01",
  "end": "2026-12-31",
  "categories": "2,4",
  "language": "de",
  "styles": ["./theme.css"]
}
```

- Der Pfad ist **relativ zur einbindenden Seite**, wird aber auch absolut (`/assets/config.json`) unterstützt.
- Ist die Datei nicht erreichbar oder ungültig, zeigt das Widget eine Fehlermeldung statt des Event-Bereichs.

### Variante B — Direkt über Attribute

```html
<uranus-widget
  limit="12"
  city="Glücksburg"
  start="2026-07-01"
  end="2026-12-31"
></uranus-widget>
```

## Konfigurierbare Optionen

| Schlüssel    | Typ          | Beschreibung                     | Beispiel            |
|--------------|--------------|----------------------------------|---------------------|
| `limit`      | number       | Events pro Seite                 | `12`                |
| `tags`       | string       | Kommagetrennte Tags              | `Klimapark,Energie` |
| `venue`      | string       | Venue-Name                       | `artefact`          |
| `city`       | string       | Stadt                            | `Glücksburg`        |
| `start`      | string       | Startdatum (ISO)                 | `2026-07-01`        |
| `end`        | string       | Enddatum (ISO)                   | `2026-12-31`        |
| `categories` | string       | Kommagetrennte Kategorie-IDs     | `2,4`               |
| `language`   | string       | Sprache der Oberfläche (de, da, en, es) | `de`         |
| `styles`     | string/array | Externe CSS-Dateien zum Überschreiben | `"./theme.css"` oder `["./a.css","./b.css"]` |

Die Optionen sind identisch mit den Widget-Attributen (Variant B). Sie können sowohl in der JSON-Datei als auch direkt als Attribut gesetzt werden. Wird beides angegeben, hat eine **extern geladene JSON-Datei** Vorrang; das `config`-Prop (Programm-Einbindung) überschreibt beide.

## Eigene Styles (externes CSS)

Über die Option `styles` in der `config.json` lässt sich beliebiges eigenes CSS einbinden — z. B. um das Design des Widgets an eine Website anzupassen. Es wird **nach** dem internen Standard-CSS in den Shadow Root geladen und überschreibt dadurch gleichnamige Klassen. Wird kein `styles` angegeben, greift automatisch das interne Standard-CSS.

```json
{
  "city": "Glücksburg",
  "styles": ["./custom/theme.css"]
}
```

Der Pfad bezieht sich — wie bei `config-url` — auf die einbindende Seite. `styles` akzeptiert einen einzelnen Pfad (`"./theme.css"`) oder ein Array mehrerer Dateien. Dateien werden in der angegebenen Reihenfolge geladen (spätere gewinnen).

### Klassen-Referenz (BEM, `uw-`-Präfix)

Diese Klassen sind die stabile, öffentliche Schnittstelle zum Styling. Die **detaillierte Übersicht** findest du in [`template.md`](./template.md). Das schnellste Theming passiert über die **CSS-Variablen auf `:host`** (Präfix `--uw-`):

| Variable (auf `:host`) | Beschreibung |
|------------------------|--------------|
| `--uw-font-family` | Schriftfamilie |
| `--uw-color-text` / `--uw-color-text-muted` / `--uw-color-text-subtle` | Textfarben |
| `--uw-color-page` / `--uw-color-page-hover` / `--uw-color-page-border` / `--uw-color-page-border-strong` | Seiten/Feld-Flächen & Rahmen |
| `--uw-color-card` / `--uw-color-card-hover` / `--uw-color-card-text` / `--uw-color-card-text-hover` / `--uw-color-card-placeholder` | Karten-Flächen, -Text und Platzhalter |
| `--uw-color-primary` / `--uw-color-primary-hover` | Akzentfarbe (Chips, Links, Buttons) |
| `--uw-color-danger` | Fehlerfarbe |
| `--uw-color-button-bg` / `--uw-color-button-text` / `--uw-color-button-bg-hover` / `--uw-color-button-text-hover` | Buttons |
| `--uw-radius` / `--uw-radius-pill` | Eckenrundung |

Optionale Auszeichnungs-Tokens (gesetzt von mitgelieferten Themes, nicht vom Basis-CSS):
`--uw-font-heading` (Display-Serif für Überschriften), `--uw-font-accent` (Labels/Meta),
`--uw-accent-soft` (helle Akzentfläche), `--uw-accent-line` (dezente Akzentlinie).

Konkrete Layout-Klassen:

| Klasse | Element |
|--------|---------|
| `.uw-widget` / `.uw-widget__header` / `.uw-widget__title` / `.uw-widget__count` | Rahmen & Kopfbereich |
| `.uw-filter` / `.uw-filter__search` / `.uw-filter__search-input` / `.uw-filter__search-button` / `.uw-filter__chips` / `.uw-filter__chip` / `.uw-filter__chip--active` / `.uw-select` | Filterleiste |
| `.uw-container` / `.uw-container__loading` / `.uw-list` | Listenansicht & Zustände |
| `.uw-card` / `.uw-card__content` / `.uw-card__placeholder` / `.uw-event-card` / `__image` / `__title` / `__subtitle` / `__date` / `__meta` / `__summary` | Event-Karte |
| `.uw-button` / `.uw-button--big` | Buttons |
| `.uw-detail__image` / `__body` / `__title` / `__subtitle` / `__meta` / `__description` / `__links` | Detailansicht |
| `.uw-is-loading` / `.uw-is-error` / `.uw-is-empty` | Zustände (Laden, Fehler, leer) |

**Beispiel** — `theme.css`:

```css
:host {
  --uw-color-primary: #2e7d32;
  --uw-radius: 12px;
}

.uw-widget {
  max-width: 1100px;
  background: #fffdf5;
}

.uw-event-card { flex-direction: column; }
.uw-event-card__image { width: 100%; height: 180px; }
```



## Funktionen

- API-Abruf von `https://api.kulturbytes.de/api/events` mit den konfigurierten Parametern
- Cursor-basierte Paginierung (`last_event_date_uuid` + `last_event_start_at`)
- Seiteninfo unten: `← SEITE X VON Y →` (Y = `total_event_count / limit`)
- Gesamtzahl über `api/events/type-summary`
- Kategorie-Mehrfachfilter (Kultur, Bildung, Sport, Freizeit, Familie, Gesellschaft)
- Detailansicht: Klick auf eine Karte lädt `api/event/{uuid}?lang=de` und zeigt Bild, Titel, Untertitel, Datum/Uhrzeit, Ort, Beschreibung und Links
- Eigene URL pro Detailseite (`?event={uuid}`), Browser-Zurück/Weiter via History API — Direktaufruf rendert direkt die Detailansicht

## Dev

```bash
cd vue
npm run dev   # Vite-Server
```

Wichtig: Die Vite-Config definiert `process.env.NODE_ENV`, damit das IIFE-Bundle im Browser ohne `process`-Global auskommt.
