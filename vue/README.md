# Uranus Widget (Vue3)

Vue3-basiertes Events-Widget als **Web Component** (`<uranus-widget>`), das sich ohne Bundle-Abhängigkeiten in jede Website einbinden lässt.

## Aufbau

```
vue/
├── index.html          # Dev-Demo für `vite dev`
├── vite.config.js      # Vite-Konfiguration (IIFE-Library-Build)
├── src/
│   ├── main.js         # registeriert das Custom Element
│   └── UranusWidget.vue# Vue3-SFC mit der gesamten Logik
└── demo/embed.html     # Beispiel: Einbindung auf einer Website
```

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

```html
<script src="uranus-widget-vue.iife.js" defer></script>

<uranus-widget
  limit="12"
  city="Glücksburg"
  start="2026-07-01"
  end="2026-12-31"
></uranus-widget>
```

## Konfigurierbare Attribute

| Attribut       | Beschreibung                        | Beispiel            |
|----------------|-------------------------------------|---------------------|
| `limit`        | Events pro Seite                    | `12`                |
| `tags`         | Kommagetrennte Tags                 | `Klimapark,Energie` |
| `venue`        | Venue-Name                          | `artefact`          |
| `city`         | Stadt                               | `Glücksburg`        |
| `start`        | Startdatum (ISO)                    | `2026-07-01`        |
| `end`          | Enddatum (ISO)                      | `2026-12-31`        |
| `categories`   | Kommagetrennte Kategorie-IDs        | `2,4`               |

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
