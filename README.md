# Uranus Widget – Veranstaltungskalender für Websites

**Veranstaltungen aus der Kulturbytes-API als Liste oder responsives Kachel-Grid in die eigene Website einbinden.** Uranus Widget ist eine Web Component auf Basis von Vue 3: ein JavaScript-Bundle, ein HTML-Element und eine JSON-Konfiguration. Geeignet für TYPO3, WordPress und Websites mit eigenem HTML.

*Embeddable event calendar widget for TYPO3, WordPress and HTML websites. Built with Vue 3 and Web Components, with responsive event grids and CSS themes.*

[Schnellstart](#schnellstart) · [Liste & Kacheln](#liste-oder-kachel-grid) · [Design anpassen](#design-anpassen) · [Dokumentation](#dokumentation) · [CC0-Lizenz](LICENSE)

## Was das Widget bietet

| Funktion | Beschreibung |
| --- | --- |
| Zwei Listenlayouts | Klassische Zeilen oder ein Grid, das seine Spaltenzahl an die verfügbare Breite anpasst. |
| Drei Kartenvarianten | `standard` mit Veranstaltungsinfos, `compact` mit weniger Angaben und `minimal` ohne Bild. |
| Suche und Filter | Volltextsuche, Kategorien, Veranstaltungstyp und Zeitraum; Vorauswahl über die Konfiguration. |
| Weitere Veranstaltungen | Ergebnisse schrittweise über „Mehr laden“ ergänzen. |
| Event-Details | Beschreibung, Bilder, Termine, Veranstaltungsort und weiterführende Links. |
| Teilbare Event-Links | Detailansicht über URL-Parameter öffnen; Browser-Zurück und -Vorwärts werden unterstützt. |
| Passender Scrollpunkt | Beim Öffnen von Details zum Widget-Anfang springen, mit einstellbarem Abstand für feste Kopfzeilen. |
| Eigenes Erscheinungsbild | CSS-Variablen und `uw-`-Klassen über externe Theme-Dateien anpassen. |
| Vier Oberflächensprachen | Deutsch, Englisch, Dänisch und Spanisch. |

Das Widget läuft im Shadow DOM und kapselt seine Styles. Die Zielwebsite benötigt keine eigene Vue-Installation; Vue und das Basis-CSS sind im gebauten Bundle enthalten. Veranstaltungsdaten werden zur Laufzeit aus der konfigurierten API geladen.

## Schnellstart

### 1. Widget bauen

Für den Build werden Node.js und npm benötigt:

```bash
git clone https://github.com/sndcds/uranus-widget.git
cd uranus-widget/vue
npm ci
npm run build
```

Das Ergebnis ist **`vue/dist/uranus-widget-vue.js`**. Das generierte Bundle wird nicht im Repository versioniert. Zum Betrieb auf dem Webserver ist kein Node.js erforderlich.

### 2. Konfiguration anlegen

Die Bundle-Datei und eine `config.json` zum Beispiel unter `/assets/uranus-widget/` auf dem Webserver ablegen:

```json
{
  "apiBaseUrl": "https://api.kulturbytes.de/api",
  "language": "de",
  "styles": [],
  "event_list": {
    "layout": "list"
  },
  "event_card": {
    "variant": "standard",
    "image": {
      "ratio": "16:9",
      "width": 480,
      "quality": 80,
      "type": "webp"
    }
  },
  "filter": {
    "portal": "HIER-DIE-PORTAL-UUID-EINTRAGEN",
    "categories": [],
    "limit": 12
  }
}
```

Die Portal-UUID durch die Kennung des gewünschten Veranstaltungsportals ersetzen. `apiBaseUrl` explizit setzen. Weitere Filter wie `city`, `start` und `end` stehen in der [Integrationsanleitung](ANLEITUNG.md).

### 3. In die Website einfügen

```html
<script src="/assets/uranus-widget/uranus-widget-vue.js" defer></script>

<uranus-widget
  config-url="/assets/uranus-widget/config.json"
></uranus-widget>
```

Das Script einmal pro Seite laden und ein Widget pro Seite vorsehen: Detailansichten verwenden den URL-Parameter `event` und die Browser-History gemeinsam. Relative Konfigurations- und Theme-Pfade beziehen sich auf die einbindende Seite.

**TYPO3:** Das Element lässt sich in einem HTML-Inhaltselement oder Fluid-Template platzieren. Für Dateien unter `fileadmin` die Pfade entsprechend anpassen. [Zur TYPO3-Anleitung](ANLEITUNG.md#6-einbindung-in-typo3)

**WordPress:** Script und Element können über einen individuellen HTML-Block oder ein eigenes Plugin eingebunden werden. [Zur WordPress-Anleitung](ANLEITUNG.md#7-einbindung-in-wordpress)

## Liste oder Kachel-Grid

In der Konfiguration die gewünschte Darstellung wählen:

| `event_list.layout` | Darstellung |
| --- | --- |
| `"list"` | Veranstaltungen als Zeilen untereinander. Standard bei fehlender oder unbekannter Einstellung. |
| `"grid"` | Kacheln mit Bild über dem Inhalt, automatisch auf passende Spalten verteilt. |

Für das Grid den entsprechenden Abschnitt der `config.json` ändern:

```json
"event_list": {
  "layout": "grid"
}
```

Kacheln sind mindestens **360 Pixel** breit. Das Grid richtet sich nach der tatsächlichen Widget-Breite, also auch nach einer schmalen Inhaltsspalte innerhalb einer großen Website. Freier Platz wird gleichmäßig verteilt. Unterhalb von 360 Pixeln passt sich eine einzelne Kachel der verfügbaren Breite an.

Das Grid verwendet die Farben, Rahmen und Hover-Zustände der Liste. Das Basisdesign kommt ohne Schatten aus. Alle drei `event_card.variant`-Varianten funktionieren in beiden Layouts.

## Design anpassen

Eine eigene CSS-Datei in der Konfiguration ergänzen:

```json
"styles": ["/assets/uranus-widget/theme.css"]
```

Die Datei wird nach den Basis-Styles in den Shadow DOM geladen. Gleich spezifische Regeln können die Vorgaben überschreiben. Beispiel für `theme.css`:

```css
:host {
  --uw-font-family: inherit;
  --uw-color-primary: #245c45;
  --uw-color-card: #ffffff;
  --uw-color-card-border: #d8dfda;
  --uw-radius: 0;
  --uw-grid-min-width: 360px;
  --uw-grid-gap: 1.5rem;
  --uw-tile-image-ratio: 16 / 9;
  --uw-scroll-offset: 100px;
}

.uw-list--grid {
  row-gap: 2rem;
}

.uw-event-card--tile {
  padding: 1rem;
}

.uw-event-card--tile .uw-event-card__title {
  font-size: 1.4rem;
}
```

`.uw-list--grid` gestaltet das Grid, `.uw-event-card--tile` die einzelne Kachel. Die bestehenden Klassen für Bilder, Titel und weitere Karteninhalte bleiben verwendbar. Für das Grid gelten standardmäßig `360px` Mindestbreite, `2rem` Abstand und `16 / 9` Bildseitenverhältnis. Den angeforderten Bildzuschnitt separat über `event_card.image.ratio` einstellen.

`--uw-scroll-offset` lässt beim Öffnen einer Detailansicht Platz für eine feste Kopfzeile; der Standard ist `0px`. CSS-Variablen können auch auf `uranus-widget` im CSS der Website gesetzt werden. Interne Klassenregeln gehören in die über `styles` eingebundene Theme-Datei.

## Lokal ansehen und weiterentwickeln

Nach dem Build im Verzeichnis `vue/` einen lokalen Webserver starten, beispielsweise mit Python:

```bash
python3 -m http.server 8080
```

Die Demo ist unter `http://localhost:8080/demo/embed.html` erreichbar. Sie verwendet `vue/demo/config.json`; dort Portal, Layout und Theme einstellen. Die Veranstaltungsdaten kommen dabei aus der konfigurierten API.

Für Änderungen am Quellcode den Build erneut ausführen oder in einem zweiten Terminal im Verzeichnis `vue/` beobachten lassen:

```bash
npm run build -- --watch
```

| Pfad | Inhalt |
| --- | --- |
| `vue/src/UranusWidget.vue` | Hauptkomponente und Wechsel zwischen Liste und Detailansicht. |
| `vue/src/components/` | Filter, Ergebnisliste, Kartenvarianten und Event-Details. |
| `vue/src/composables/` | API-Abfragen, Konfiguration, Sprachen und Theme-Ladung. |
| `vue/src/styles/` | Basis-Styles und Layoutregeln; das Kachel-Grid liegt in `grid.css`. |
| `vue/demo/` | Einbindungsbeispiel, Beispielkonfiguration und Themes. |

Die Dateien `main.js` und `index.html` im Projektstamm gehören zu einer älteren, separaten Implementierung. Für die hier beschriebene Version den Code unter `vue/` verwenden; beide Implementierungen registrieren denselben Elementnamen.

## Dokumentation

- [Integrationsanleitung](ANLEITUNG.md): Einrichtung, Konfiguration, TYPO3, WordPress und Fehlerbehebung.
- [Styling-Referenz](vue/template.md): CSS-Variablen, Klassen und Theme-Struktur.
- [Vue-Projektdokumentation](vue/README.md): Komponenten, Kartenvarianten und Erweiterungen.
- [Issues](https://github.com/sndcds/uranus-widget/issues): Fehler melden und Erweiterungen vorschlagen.

## Lizenz

Das Repository steht unter [CC0 1.0 Universal](LICENSE).
