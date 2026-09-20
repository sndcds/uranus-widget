# Uranus Widget in eine Website integrieren

Diese Anleitung richtet sich an Menschen mit HTML-, CSS- und JavaScript-Kenntnissen. Sie beschreibt die **Vue-Webkomponente aus `vue/`**. Auf der Website selbst werden weder ein Vue-Projekt noch Node.js benötigt: Das fertige JavaScript enthält die Laufzeit und die Standardgestaltung.

Geprüfter Repository-Stand: [`4c9c71b`, 26.08.2026](https://github.com/sndcds/uranus-widget/commit/4c9c71b16ecc5cb840a6b89138b60f1f264e856b). Die Angaben wurden mit Quellcode und ausgeliefertem Bundle abgeglichen. Die bestehenden Dateien `vue/README.md` und `vue/template.md` enthalten teilweise ältere Konfigurations- und Stylingangaben.

Die Dateien `main.js` und `index.html` im obersten Repository-Verzeichnis gehören zu einer anderen Implementierung mit `data-*`-Attributen. **Diese nicht zusammen mit `uranus-widget-vue.js` laden:** Beide registrieren denselben Elementnamen `<uranus-widget>`. Die folgende CSS-Referenz gilt für die Vue-Version.

## 1. Erforderliche Dateien

Für die hier beschriebene Einbindung werden eine JavaScript-Datei, eine Konfigurationsdatei und der HTML-Eintrag auf der Zielseite benötigt. Eine eigene CSS-Datei kommt für Designanpassungen hinzu.

| Datei | Bezugsquelle | Aufgabe |
| --- | --- | --- |
| `uranus-widget-vue.js` | [`vue/dist/uranus-widget-vue.js`](vue/dist/uranus-widget-vue.js) | Fertiges Widget einschließlich Vue, Standard-CSS und eingebetteter Assets. |
| `config.json` | Neu anlegen; Beispiel weiter unten | API-Adresse, Sprache, Veranstaltungsauswahl, Kartenvariante und Theme-Pfade. |
| `theme.css` | Neu anlegen; Beispiel weiter unten | Optionale eigene Farben, Schriften, Abstände und Layoutregeln. |
| HTML-Eintrag | Bestehende Website bzw. CMS-Inhaltselement | Lädt das JavaScript und legt die Position des Widgets fest. |

Das Repository kann über **Code → Download ZIP** auf GitHub heruntergeladen und entpackt werden. Für den Betrieb wird nur das fertige Bundle aus `vue/dist/` benötigt. `vue/src/`, `node_modules`, die Build-Konfiguration und die Demo-HTML-Dateien müssen nicht auf den Webserver kopiert werden. Veranstaltungsdaten und Veranstaltungsbilder werden zur Laufzeit geladen.

Beispiel für die Ablage auf einer normalen Website:

```text
Öffentliches Webverzeichnis/
├── veranstaltungen.html
└── assets/
    └── uranus-widget/
        ├── uranus-widget-vue.js
        ├── config.json
        └── theme.css
```

## 2. Dateien bearbeiten und ihre Inhalte verstehen

### `uranus-widget-vue.js`

Diese Datei registriert das HTML-Element `<uranus-widget>`, lädt Daten und Konfiguration und erzeugt Übersicht, Filter, Karten und Detailansicht. Sie enthält auch die Standard-CSS-Regeln. Für eine normale Integration die Datei unverändert hochladen; Farben und Filter werden in den folgenden Dateien eingestellt. Bei einem Update wird das Bundle ersetzt. Es gibt für diese Einbindung keine zusätzlich benötigte `style.css` und keinen zusätzlichen Vue-CDN-Aufruf.

### `config.json`

Diese Datei enthält die Einstellungen als gültiges JSON: doppelte Anführungszeichen, keine Kommentare und kein Komma nach dem letzten Eintrag. `apiBaseUrl` bezeichnet die API-Basis inklusive `/api`, `language` die Sprache der Bedienoberfläche, `styles` die zu ladenden CSS-Dateien, `event_card` die Kartendarstellung und `filter` die Vorauswahl der Veranstaltungen. Eine Portal-ID muss vom Betreiber des gewünschten Veranstaltungsportals übernommen werden. Beispiel:

```json
{
  "apiBaseUrl": "https://api.kulturbytes.de/api",
  "language": "de",
  "styles": ["/assets/uranus-widget/theme.css"],
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

**Vor dem Einsatz den Portal-Platzhalter ersetzen.** Die Demo enthält eine konkrete Portal-ID; diese nur übernehmen, wenn tatsächlich deren Veranstaltungen angezeigt werden sollen. Ob die verwendete API Abfragen ohne Portal erlaubt, ist eine Eigenschaft der API und wird vom Widget nicht festgelegt.

| Einstellung | Bedeutung und Bearbeitung |
| --- | --- |
| `apiBaseUrl` | Für Kulturbytes `https://api.kulturbytes.de/api`, ohne abschließenden Schrägstrich. Unbedingt explizit setzen: Im aktuellen Code gibt es keinen entsprechenden Standardwert. |
| `language` | `de`, `da`, `en` oder `es`; Standard `de`. Übersetzt die Bedienoberfläche. Veranstaltungsinhalte werden dadurch nicht automatisch übersetzt; die Detailabfrage verwendet derzeit fest `lang=de`. |
| `styles` | **Array** von CSS-URLs, auch bei nur einer Datei. `[]` verwendet ausschließlich das Standarddesign. Dateien werden in der angegebenen Reihenfolge eingefügt. |
| `filter.portal` | Kennung des Veranstaltungsportals. |
| `filter.limit` | Positive ganze Zahl: Veranstaltungen pro Abruf, Standard `12`. Weitere Einträge werden über „Mehr laden“ ergänzt. |
| `filter.categories` | Array numerischer Kategorie-IDs, z. B. `[1, 5]`; `[]` bedeutet keine Kategorie-Vorauswahl. |
| `filter.city` | Optionaler Stadtfilter, z. B. `"Flensburg"`; wird an die API weitergereicht. |
| `filter.start`, `filter.end` | Optionaler Zeitraum in der Form `"2026-10-01"` bzw. `"2026-12-31"`. Ein festes Enddatum muss später gepflegt werden. |
| `filter.tags`, `filter.venue` | Optionale Tag- bzw. Veranstaltungsortfilter. Werte und Datentypen müssen der angeschlossenen Filter-API entsprechen; das Widget reicht JSON-Werte weiter. |
| `event_card.variant` | `standard`: Bild, Datum, Titel, Ort, Typen, Preis-/Statushinweise; `compact`: Bild, Datum, Titel, Ort; `minimal`: Datum und Titel ohne Bild. Fehlende oder unbekannte Variante ergibt `standard`. |
| `event_card.image.ratio` | Zuschnitt der angeforderten Kartenbilder; `"16:9"` oder z. B. `"4/3"`. Standard `"16:9"`. |
| `event_card.image.width` | Angeforderte Bildbreite in Pixeln; Standard `480`. Das ist nicht die CSS-Anzeigebreite. |
| `event_card.image.quality` | Angeforderte Bildqualität von `0` bis `100`; Standard `80`. |
| `event_card.image.type` | Angefordertes Bildformat; Standard `"webp"`. Weitere Formate hängen vom Bilddienst ab. |

Kategorie-IDs: **1 Kultur, 2 Bildung, 3 Sport, 4 Freizeit, 5 Familie, 6 Gesellschaft**.

Die Bildparameter betreffen die Karten der Übersicht. Das tatsächlich sichtbare Seitenverhältnis steuern zusätzlich die CSS-Variablen `--uw-event-image-ratio-desktop` und `--uw-event-image-ratio-mobile`. Für einen durchgehend gleichen Ausschnitt beide Ebenen auf denselben Wert einstellen.

Zur Konfiguration stehen außerdem die HTML-Attribute `limit`, `start`, `end`, `portal`, `tags`, `venue`, `city` und `categories` zur Verfügung. Die dort gesetzten Werte überschreiben die entsprechenden Werte in `filter`. Für Kategorien ist das JSON-Array vorzuziehen, damit auch die anfängliche Auswahl der Filter-Chips stimmt. `language`, `styles`, `apiBaseUrl` und `event_card` über die JSON-Datei konfigurieren; sie sind keine deklarierten HTML-Attribute dieser Version.

Bei einer Einbindung per JavaScript kann stattdessen die DOM-Property `element.config` mit einem Objekt belegt werden. Sie ersetzt die externe Konfigurationsquelle und muss vor der Initialisierung gesetzt sein. Für die hier beschriebene Dateieinbindung reicht `config-url`.

Für die verwendete verschachtelte Konfiguration gilt bei der Initialisierung: **HTML-Filterattribute vor JSON-Werten vor Standardwerten**. Die interaktive Auswahl und bestimmte URL-Parameter können anschließend Abfragen verändern. Deshalb alte Beispiele mit Filtern auf oberster JSON-Ebene nicht mit diesem Schema mischen. `styles-` und `styles--` in der mitgelieferten Demo sind keine wirksamen Optionen; nur `styles` wird verwendet.

### `theme.css`

Diese Datei enthält das eigene Design. Das Widget lädt sie über `styles` und fügt sie **in seinen Shadow DOM** ein. Darin bezeichnet `:host` das äußere `<uranus-widget>`-Element. Normale Regeln im Stylesheet der Website wie `.uw-card { ... }` erreichen die internen Elemente nicht. Ein bloßes `<link>` im Seitenkopf oder WordPress „Zusätzliches CSS“ ersetzt daher das Laden über `styles` nicht.

Ein vollständiger Einstieg für `theme.css`:

```css
:host {
  --uw-font-family: Arial, Helvetica, sans-serif;
  --uw-color-text: #243344;
  --uw-color-page: #ffffff;
  --uw-color-page-hover: #edf3fa;
  --uw-color-page-border: #d5dfea;
  --uw-color-input-border: #b8c6d6;
  --uw-color-card: #ffffff;
  --uw-color-card-border: #d5dfea;
  --uw-color-card-hover: #f3f7fc;
  --uw-color-card-text: #243344;
  --uw-color-card-text-hover: #164a7b;
  --uw-color-primary: #164a7b;
  --uw-color-primary-hover: #103659;
  --uw-color-button-bg: #164a7b;
  --uw-color-button-bg-hover: #103659;
  --uw-color-button-text: #ffffff;
  --uw-color-button-text-hover: #ffffff;
  --uw-radius: 8px;
  --uw-radius-chip: 999px;
  --uw-event-image-width: 240px;
  --uw-event-image-ratio-desktop: 16 / 9;
  --uw-event-image-ratio-mobile: 16 / 9;
}

.uw-widget {
  max-width: 1100px;
}

.uw-list {
  gap: 1.25rem;
}

.uw-button {
  border-radius: var(--uw-radius);
}

.uw-filter__search-input {
  color: var(--uw-color-text);
}

.uw-event-card__title {
  font-size: 1.4rem;
  font-weight: 700;
}

@media (max-width: 800px) {
  .uw-event-card__title {
    font-size: 1.2rem;
  }
}
```

Alternativ eine Datei aus `vue/demo/` kopieren: `theme-rendsburg.css`, `theme-blaupause.css` oder `theme-playful.css`. Diese Themes enthalten zum Teil ältere Selektoren; für Anpassungen die Referenz unten verwenden. Angegebene Schriftfamilien müssen auf der Website verfügbar sein oder werden durch die im Font-Stack genannten Ersatzschriften ersetzt.

### HTML-Datei bzw. CMS-Seiteninhalt

Der HTML-Eintrag bestimmt den Anzeigeort. Das Script registriert die Webkomponente, `config-url` gibt ihre Konfigurationsdatei an. Es ist kein manueller Initialisierungsaufruf erforderlich. Auf einer normalen Website das Script einmal im `<head>` mit `defer` und das Element an der gewünschten Stelle im `<body>` ergänzen:

```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Veranstaltungen</title>
  <script src="/assets/uranus-widget/uranus-widget-vue.js" defer></script>
</head>
<body>
  <main>
    <h1>Veranstaltungen</h1>
    <uranus-widget
      config-url="/assets/uranus-widget/config.json"
    ></uranus-widget>
  </main>
</body>
</html>
```

Bei vorhandenen Seiten nur Script und Widget-Element übernehmen, nicht noch einmal `html`, `head` oder `body` einfügen. Das Script genau einmal pro Seite laden. Für diese Integration ein Widget pro Seite vorsehen: Detailansichten verwenden gemeinsam den URL-Parameter `event` und die Browser-History.

## 3. Pfade, Upload und Funktionsprüfung

1. Die drei Dateien in das öffentliche Verzeichnis `/assets/uranus-widget/` des Webservers hochladen, beispielsweise per SFTP oder Hosting-Dateimanager.
2. Portal-ID und Theme-Pfad in `config.json` anpassen.
3. HTML-Eintrag wie oben ergänzen.
4. Die Seite über HTTP(S) öffnen. Ein Doppelklick auf eine lokale HTML-Datei mit `file://` ist für die `fetch`-Abfragen ungeeignet.
5. In den Browser-Entwicklerwerkzeugen prüfen, ob Script, JSON, CSS und API-Abfragen erfolgreich geladen werden.
6. Suche, Kategorien, „Mehr laden“, Detailansicht, Browser-Zurück und die schmale Ansicht prüfen.

**Pfade beziehen sich auf die Webseite.** Sowohl `config-url` als auch Einträge in `styles` werden relativ zur URL der einbindenden Seite aufgelöst, nicht relativ zur JavaScript- oder JSON-Datei. `/assets/uranus-widget/theme.css` ist deshalb auf unterschiedlich tief verschachtelten Unterseiten zuverlässiger als `./theme.css`. Bei einer Installation unter einem URL-Unterverzeichnis den öffentlichen Präfix ergänzen, z. B. `/meine-site/assets/uranus-widget/theme.css`.

Da Theme-CSS als Text in ein `<style>`-Element kopiert wird, auch für darin enthaltene `url(...)`-Verweise auf Bilder oder Schriften vollständige bzw. mit `/` beginnende öffentliche Pfade verwenden.

Konfiguration und Theme möglichst auf derselben Domain wie die Website bereitstellen. Bei fremden Domains müssen deren Server die Browserabfragen per CORS erlauben; das gilt auch für die API. Falls die Website eine Content Security Policy setzt, müssen die tatsächlich verwendeten Script-, Daten-, Bild- und Style-Quellen einschließlich der injizierten Styles zugelassen sein.

## 4. Vollständige CSS-Variablen-Referenz

Die folgenden Tabellen erfassen alle 42 CSS-Variablen im Basis-CSS und den drei mitgelieferten Themes: 37 mit `--uw-` und fünf mit `--rd-`. **„Ohne Standardwert“** bedeutet, dass das Basis-CSS die Variable verwendet, aber nicht definiert. Solche Werte im eigenen Theme explizit setzen. Nicht jede im Repository deklarierte Variable wird tatsächlich ausgewertet.

### Wirksame Variablen des Basis-CSS

| Variable | Standard | Wirkung |
| --- | --- | --- |
| `--uw-font-family` | `inherit` | Schriftfamilie des Widget-Inhalts. |
| `--uw-color-page` | `#fff` | Hintergrund von Eingabe, Select, Filter-Chips und Detail-Infobox; nicht automatisch der gesamte Widget-Hintergrund. |
| `--uw-color-input-border` | `#ddd` | Rahmen von Eingabe, Select und Chips. |
| `--uw-color-card` | `#fff` | Karten- und Bildplatzhalter-Hintergrund. |
| `--uw-color-card-border` | `#ddd` | Rahmen von Karten, Detail-Infobox und Linkbereich. |
| `--uw-color-card-hover` | `#f4f4f4` | Kartenhintergrund bei Hover. |
| `--uw-color-card-text` | `#1a1a1a` | Grundtext der Karten. |
| `--uw-color-card-text-hover` | `#1a73e8` | Vererbte Kartentextfarbe bei Hover. |
| `--uw-color-card-placeholder` | `#dddddd` | Textfarbe des Bildplatzhalters. |
| `--uw-color-text` | `#1a1a1a` | Allgemeine Textfarbe, Detailtitel, Beschreibung, Selects und inaktive Chips. |
| `--uw-color-text-muted` | `#777` | Gedämpfte Metadaten, Untertitel, Veranstalter und Ladehinweis beim Nachladen. |
| `--uw-color-text-subtle` | `#888` | Lade-/Leerzustände und Bildnachweis. |
| `--uw-color-primary` | `#1a73e8` | Aktive Chips, Links, Detaildatum, Preishinweise und Karten-Fokusrahmen. |
| `--uw-color-primary-hover` | `#1558b0` | Hover aktiver Chips. |
| `--uw-color-danger` | `#d32f2f` | Fehlermeldungen und Hintergrund von Statushinweisen. |
| `--uw-color-button-bg` | `#101010` | Button-Hintergrund. |
| `--uw-color-button-bg-hover` | `#434343` | Button-Hintergrund bei Hover. |
| `--uw-color-button-text` | `#ffffff` | Button-Text sowie Text aktiver Filter-Chips. |
| `--uw-color-button-text-hover` | `#ffffff` | Button-Text bei Hover. |
| `--uw-color-static-chip-bg` | `#333` | Hintergrund der Veranstaltungstyp-Chips in Karte und Detail. |
| `--uw-color-static-chip-text` | `#fff` | Text dieser Veranstaltungstyp-Chips. |
| `--uw-radius` | `0` | Rundung von Karten, Eingaben, Selects, Detailbild/-Infobox, Status und Typ-Chips. Buttons haben im Basis-CSS separat `3px`. |
| `--uw-radius-chip` | `999px` | Rundung der interaktiven Kategorie-Chips. |
| `--uw-event-image-width` | `240px` | Breite der Kartenbildspalte oberhalb von 800px Viewportbreite. |
| `--uw-event-image-ratio-desktop` | `16 / 9` | Seitenverhältnis der Kartenbildfläche oberhalb von 800px. |
| `--uw-event-image-ratio-mobile` | `16 / 9` | Seitenverhältnis der Kartenbildfläche bis einschließlich 800px. |
| `--uw-color-page-hover` | Ohne Standardwert | Hover-Fläche inaktiver Chips und der derzeit nicht eingeblendeten Pagination. |
| `--uw-color-page-border` | Ohne Standardwert | Trennlinien weiterer Termine/Veranstalter sowie Rahmen der derzeit nicht eingeblendeten Pagination. |

### Theme-abhängige und derzeit ungenutzte Variablen

| Variable | Definition / Wert | Wirkung im geprüften Stand |
| --- | --- | --- |
| `--uw-radius-pill` | Basis: `999px` | Im Basis-CSS ungenutzt; wird in `theme-blaupause.css` und `theme-playful.css` verwendet. Für Basis-Kategorie-Chips stattdessen `--uw-radius-chip` ändern. |
| `--uw-color-page-border-strong` | Blaupause: `#c8d6ea`; Playful: `#ffb26b` | In Blaupause für Eingabe-/Chiprahmen verwendet; in Playful nur deklariert. |
| `--uw-font-heading` | Blaupause: `"Playfair Display", Georgia, "Times New Roman", serif` | Überschriftenschrift in diesem Theme. |
| `--uw-font-accent` | Blaupause: `"Epilogue", "Outfit", system-ui, sans-serif` | Akzent-/Metaschrift in diesem Theme. |
| `--uw-accent-soft` | Blaupause: `#eaf2fe` | Helle Akzentflächen in diesem Theme. |
| `--uw-accent-line` | Blaupause: `#c9dcf9` | Akzentrahmen in diesem Theme. |
| `--uw-color-text-input` | Basis: `#fff` | Deklariert, aber von keiner mitgelieferten CSS-Regel verwendet. Eingabetext über `.uw-input` oder `.uw-filter__search-input` gestalten. |
| `--uw-text-input` | Rendsburg: `#fff` | Deklariert, aber ungenutzt. |
| `--uw-text-input-border` | Rendsburg: `#ddd` | Deklariert, aber ungenutzt. Wirksamer Rahmenwert: `--uw-color-input-border`. |

### Zusätzliche Variablen des Rendsburg-Themes

Diese Variablen werden nur in `theme-rendsburg.css` definiert. Ihre Werte lassen sich dort oder in einer anschließend geladenen eigenen CSS-Datei auf `:host` überschreiben.

| Variable | Theme-Standard | Wirkung im geprüften Stand |
| --- | --- | --- |
| `--rd-color-medium-bg` | `#5D80A6` | Hintergrund der Veranstaltungstyp-Chips in Karte und Detail. |
| `--rd-color-dark-blue` | `#1C4780` | Textfarbe von Kopfzeile und Filterbereich, soweit von den Kindern geerbt. |
| `--rd-color-nav-bg` | `#EAEDEF` | Deklariert, aber ungenutzt. |
| `--rd-color-accent-1` | `#C53B5E` | Deklariert, aber ungenutzt. |
| `--rd-color-accent-2` | `#8A7EA9` | Deklariert, aber ungenutzt. |

Farben werden teilweise auch direkt in Klassenregeln gesetzt, z. B. weißer Text bei Statushinweisen. Für solche Details die betreffende Klasse überschreiben. Eine Änderung von `--uw-color-primary` passt außerdem nicht automatisch die separat definierten Button-Farben an.

## 5. Vollständige Klassen-Referenz

Die Klassen werden im eigenen, über `styles` geladenen CSS überschrieben. Die Tabellen nennen die Klassen vollständig; Klassen mit einem gemeinsamen Zweck sind in einer Zeile zusammengefasst. Einige Klassen sind reine Ansatzpunkte ohne eigene Basisregeln. Zusätzliche Inhalte erscheinen nur, wenn die Veranstaltungsdaten sie enthalten.

Später geladene Regeln gewinnen bei gleicher Priorität und Spezifität. Gegen eine Basisregel wie `.uw-card:hover` muss entsprechend ein Hover-Selektor verwendet werden. Selektoren mit höherer Spezifität, Inline-Styles oder `!important` können diese Reihenfolge überstimmen.

### Rahmen, Überschrift und Zustände

| Klasse | Gestaltbarer Bereich |
| --- | --- |
| `.uw-widget` | Gesamtinhalt: Breite, Schriftgröße, Zeilenhöhe, Abstände, eigener Hintergrund. |
| `.uw-widget__header` | Kopfzeile mit Titel und Anzahl. |
| `.uw-widget__title` | Überschrift der Übersicht. |
| `.uw-widget__count` | Veranstaltungsanzahl. |
| `.uw-title` | Gemeinsame Titelgestaltung; aktuell beim Detailtitel. |
| `.uw-container` | Container der Ergebnisliste. |
| `.uw-container__loading` | Ladehinweis während des Nachladens. |
| `.uw-list` | Kartenliste und Abstand zwischen Karten. |
| `.uw-load-more` | Bereich um den „Mehr laden“-Button. |
| `.uw-is-loading` | Initialer Ladezustand. |
| `.uw-is-error` | Fehlermeldungen. |
| `.uw-is-empty` | Leere Ergebnisliste. |
| `.uw-fade-enter-active`, `.uw-fade-leave-active` | Vue-Übergänge zwischen Listen-Zuständen: Dauer und Art der Animation. |
| `.uw-fade-enter-from`, `.uw-fade-leave-to` | Anfangs-/Enddarstellung dieser Übergänge, standardmäßig transparent. |

`uw-fade` ist der Name des Vue-Übergangs und keine dauerhaft gesetzte CSS-Klasse. Vue setzt zusätzlich vorübergehend `.uw-fade-enter-to` und `.uw-fade-leave-from`; dafür sind keine eigenen Basisregeln vorhanden.

### Filter, Eingaben, Buttons und Chips

| Klasse | Gestaltbarer Bereich |
| --- | --- |
| `.uw-filter` | Gesamte Filterleiste. |
| `.uw-filter__search` | Suchformular aus Eingabe und Button. |
| `.uw-input` | Allgemeine Eingabefeld-Gestaltung. |
| `.uw-filter__search-input` | Suchfeld speziell. |
| `.uw-filter__search-button` | Suchbutton speziell. |
| `.uw-filter__selects` | Gemeinsamer Container für Typ- und Zeitraum-Auswahl. |
| `.uw-select` | Beide Auswahlfelder; mit `:disabled` auch der Ladezustand. |
| `.uw-button` | Alle Buttons einschließlich Zurück-, Such-, Nachladen- und bestimmter Link-Buttons. |
| `.uw-button--big` | Große Buttons, z. B. „Mehr laden“ und „Zurück“. |
| `.uw-chips` | Allgemeiner Chip-Container, auch bei Veranstaltungstypen. |
| `.uw-chip` | Grundgestaltung aller Chips. |
| `.uw-chip--active` | Ausgewählter interaktiver Chip. |
| `.uw-chip-static` | Nicht interaktiver Typ-Chip. |
| `.uw-filter__chips` | Kategorie-Chip-Gruppe im Filter. |
| `.uw-filter__chip` | Kategorie-Chip im Filter. |
| `.uw-filter__chip--active` | Ausgewählter Kategorie-Chip im Filter. |

### Veranstaltungskarten

| Klasse | Gestaltbarer Bereich |
| --- | --- |
| `.uw-card` | Grundkarte: Rahmen, Padding, Layout, Hintergrund, Hover und `:focus-visible`. |
| `.uw-card__content` | Textbereich der Karte. |
| `.uw-card__placeholder` | Ersatzfläche bei fehlendem Bild. |
| `.uw-card__title` | Basistitel der Standardkarte. |
| `.uw-card__meta` | Basis für Datum und Ort der Standardkarte. |
| `.uw-card__status` | Basis für Statushinweise wie „Abgesagt“. |
| `.uw-event-card` | Alle Veranstaltungskarten; responsive Anordnung. |
| `.uw-event-card--compact` | Nur Karten der Variante `compact`. |
| `.uw-event-card--minimal` | Nur Karten der Variante `minimal`. |
| `.uw-event-card__content` | Inhalt und vertikale Anordnung der Karte. |
| `.uw-event-card__image` | Bildcontainer der Standard-/Compact-Karte. |
| `.uw-event-card__ai-label` | Kennzeichnung für KI-Bilder. |
| `.uw-event-card__date` | Datum und Uhrzeit. |
| `.uw-event-card__title` | Veranstaltungstitel aller Varianten. |
| `.uw-event-card__meta` | Veranstaltungsort/Stadt. |
| `.uw-event-card__chips` | Gruppe der Veranstaltungstypen in der Standardkarte. |
| `.uw-event-card__type-chip` | Einzelner Veranstaltungstyp in der Standardkarte. |
| `.uw-event-card__price` | Preisangabe wie „Kostenlos“ oder „Spende“. |
| `.uw-event-card__status` | Statushinweis in der Standardkarte. |

Die Standardkarte besitzt **keine** Klasse `.uw-event-card--standard`. Für gezielte Regeln kann `.uw-event-card:not(.uw-event-card--compact):not(.uw-event-card--minimal)` verwendet werden. Das eigentliche Kartenbild lässt sich mit `.uw-event-card__image > img:not(.uw-event-card__ai-label)` auswählen, ohne zugleich die KI-Kennzeichnung zu verändern.

### Detailansicht

| Klasse | Gestaltbarer Bereich |
| --- | --- |
| `.uw-detail__container` | Äußerer Detailbereich einschließlich Lade-/Fehlerzustand. |
| `.uw-event-detail` | Artikel mit vollständiger Veranstaltungsdarstellung. |
| `.uw-event-detail__toolbar` | Bereich des externen Kulturbytes-Links. |
| `.uw-event-detail__kulturbytes` | Kulturbytes-Link/Button. |
| `.uw-event-detail__kulturbytes-logo` | Logo im Kulturbytes-Link, einschließlich enthaltenem SVG. |
| `.uw-event-detail__image` | Bildbereich einschließlich Bildnachweis. |
| `.uw-event-detail__image-frame` | Rahmen und Größenbegrenzung des Detailbildes. |
| `.uw-event-detail__image-ai-label` | KI-Kennzeichnung am Detailbild. |
| `.uw-event-detail__image-credit` | Bildnachweis. |
| `.uw-event-detail__header` | Veranstaltungsdaten oberhalb der Beschreibung. |
| `.uw-event-detail__date` | Datum und Uhrzeit. |
| `.uw-event-detail__venue` | Veranstaltungsort und Adresse. |
| `.uw-detail__title` | Titel; sitzt gemeinsam mit `.uw-title` auf dem Element. |
| `.uw-detail__subtitle` | Untertitel. |
| `.uw-event-detail__types` | Gruppe der Veranstaltungstypen. |
| `.uw-event-detail__type-chip` | Einzelner Veranstaltungstyp. |
| `.uw-detail__description`, `.uw-event-detail__description` | Beschreibungstext; beide Klassen sitzen auf demselben Element. |
| `.uw-event-detail__details` | Infobox mit Preis, Tickets und Teilnahmeinformationen. |
| `.uw-event-detail__detail` | Einzelne Zeile der Infobox; enthält `dt` und `dd`. |
| `.uw-event-detail__detail--action` | Zeile mit Ticket-Button. |
| `.uw-detail__links` | Weiterführende Links. |
| `.uw-detail__link` | Einzelner weiterführender Link. |
| `.uw-detail__link-icon` | Icon eines Links; Größe und SVG-Darstellung. Die Farbe kann zusätzlich inline gesetzt sein. |
| `.uw-event-detail__dates` | Bereich weiterer Termine. |
| `.uw-event-detail__dates-title` | Überschrift weiterer Termine. |
| `.uw-event-detail__dates-list` | Liste weiterer Termine. |
| `.uw-event-detail__date-item` | Einzelner zusätzlicher Termin. |
| `.uw-event-detail__date-item-date` | Datum des zusätzlichen Termins. |
| `.uw-event-detail__date-item-venue` | Ort des zusätzlichen Termins. |
| `.uw-event-detail__organizer` | Veranstalter-Hinweis am Ende. |

Innerhalb der Beschreibung können beispielsweise `.uw-event-detail__description p`, `a`, `ul`, `ol` und `h2` gestaltet werden. Für das Hauptbild `.uw-event-detail__image-frame > img:not(.uw-event-detail__image-ai-label)` verwenden.

### Vorhandene Klassen ohne Wirkung in der normalen aktuellen Ansicht

| Klasse | Status |
| --- | --- |
| `.uw-card__subtitle`, `.uw-card__text` | Im Basis-CSS vorhanden, werden von den aktuellen Karten-Templates nicht ausgegeben. |
| `.uw-event-card__subtitle`, `.uw-event-card__summary` | Im Basis-CSS und teilweise in Themes vorhanden, werden von keiner der drei aktuellen Kartenvarianten ausgegeben. |
| `.uw-pagination` | Pagination-Komponente vorhanden, im aktuellen Haupttemplate aber nicht eingebunden; die Übersicht verwendet „Mehr laden“. |
| `.uw-pagination__button` | Buttons dieser ungenutzten Pagination. |
| `.uw-pagination__button--prev`, `.uw-pagination__button--next` | Zurück-/Weiter-Button dieser Pagination. |
| `.uw-pagination__info` | Seiteninformation dieser Pagination. |
| `.uw-detail__image`, `.uw-detail__meta` | Ältere Selektoren in Demo-Themes; keine entsprechenden Elemente im aktuellen Template. Stattdessen aktuelle `.uw-event-detail__…`-Klassen verwenden. |
| `.top` | Nur im Quelltext `EventDetail.vue`: gemeinsame obere Zeile für Zurück-Button und Kulturbytes-Link. Im mitgelieferten Bundle dieses Commits noch nicht enthalten; kein verlässlicher Ansatzpunkt für dessen Gestaltung. Nach einem eigenen Build z. B. über `.uw-event-detail .top` ansprechen. |

Die vorhandenen responsiven Regeln orientieren sich an der **Viewportbreite**, nicht an der Breite der CMS-Inhaltsspalte: Veranstaltungskarten wechseln bis 800px zur vertikalen Darstellung, zusätzliche Basiskarten-Regeln greifen bis 600px, Detail-Infozeilen bis 480px. Bei Einbindung in schmale Spalten eigene Layoutregeln ergänzen.

## 6. Einbindung in TYPO3

### Dateien hochladen

Die folgenden Beispiele verwenden den öffentlichen Ordner `/fileadmin/uranus-widget/`. Bei einer Composer-Installation liegt er typischerweise physisch unter `public/fileadmin/uranus-widget/`. Entscheidend ist die im Browser erreichbare URL.

Im Backend das Dateimodul öffnen, den Ordner `uranus-widget` unter `fileadmin` anlegen und `uranus-widget-vue.js`, `config.json` und `theme.css` hochladen. Je nach TYPO3-Version heißt das Modul „Dateiliste/Filelist“ oder „Media“. Uploads erfolgen dort über die Upload-Funktion bzw. Drag-and-drop. Falls Dateitypen oder Ordner für das eigene Konto nicht freigegeben sind, die Dateien per SFTP oder über den regulären Projekt-Deploymentweg bereitstellen lassen. [TYPO3-Dateiverwaltung](https://docs.typo3.org/m/typo3/tutorial-editors/main/en-us/MediaModule/Index.html)

In `config.json` den Theme-Pfad anpassen:

```json
"styles": ["/fileadmin/uranus-widget/theme.css"]
```

Diese Zeile ersetzt die `styles`-Zeile der vollständigen Konfiguration aus Abschnitt 2; sie ist allein keine vollständige JSON-Datei.

### JavaScript in TYPO3 laden

Im **bereits eingebundenen TypoScript-Setup** des Sitepackages bzw. Seitentemplates ergänzen. Das Beispiel setzt voraus, dass das vorhandene `PAGE`-Objekt `page` heißt:

```typoscript
page.includeJSFooter.uranusWidget = fileadmin/uranus-widget/uranus-widget-vue.js
page.includeJSFooter.uranusWidget.defer = 1
```

`includeJSFooter` fügt das Script vor dem schließenden `body`-Tag ein. Den Eintrag auf den benötigten Seiten bzw. Seitenzweig beschränken, wenn das Projekt dies vorsieht. Das Widget-Theme weiter über `config.json` laden. [TYPO3-Referenz zu PAGE und JavaScript-Einbindung](https://docs.typo3.org/m/typo3/reference-typoscript/main/en-us/TopLevelObjects/Page/Index.html)

### Widget auf der Seite platzieren

Auf der gewünschten Seite ein Inhaltselement **„Reines HTML / Plain HTML“** anlegen und Folgendes eintragen:

```html
<uranus-widget
  config-url="/fileadmin/uranus-widget/config.json"
></uranus-widget>
```

Dieser Inhaltselementtyp gibt HTML direkt aus. Ist er für die Redaktion nicht verfügbar, kann die Integration im Fluid-Template oder in einem projektspezifischen Inhaltselement erfolgen. [TYPO3: HTML-Inhaltselement](https://docs.typo3.org/c/typo3/cms-fluid-styled-content/main/en-us/ContentElements/Html/Index.html)

Für eine einzelne Seite ist alternativ der komplette Eintrag im HTML-Inhaltselement möglich:

```html
<script src="/fileadmin/uranus-widget/uranus-widget-vue.js" defer></script>
<uranus-widget
  config-url="/fileadmin/uranus-widget/config.json"
></uranus-widget>
```

Dabei den zusätzlichen TypoScript-Script-Eintrag weglassen. Anschließend speichern, TYPO3-Frontend-Caches leeren und die öffentliche Seite prüfen. Redaktionsrechte allein reichen je nach Projekt nicht für Dateiupload, HTML-Inhaltselement und TypoScript-Zugriff; die Erstinstallation übernimmt dann die zuständige Administration.

## 7. Einbindung in WordPress

### Variante A: Dateien hochladen und HTML-Block verwenden

Die drei Dateien per SFTP oder Hosting-Dateimanager in einen neuen öffentlichen Ordner hochladen:

```text
wp-content/
└── widgets/
    └── uranus-widget/
        ├── uranus-widget-vue.js
        ├── config.json
        └── theme.css
```

Das Beispiel verwendet die übliche WordPress-Verzeichnisstruktur. Bei abweichender Content-URL oder Unterverzeichnis-Installation die tatsächlichen öffentlichen URLs einsetzen. In `config.json` die `styles`-Zeile ersetzen:

```json
"styles": ["/wp-content/widgets/uranus-widget/theme.css"]
```

In der gewünschten Seite einen Block **„Individuelles HTML / Custom HTML“** ergänzen:

```html
<script src="/wp-content/widgets/uranus-widget/uranus-widget-vue.js" defer></script>
<uranus-widget
  config-url="/wp-content/widgets/uranus-widget/config.json"
></uranus-widget>
```

Speichern und die öffentliche Seite prüfen. WordPress kann nicht erlaubtes HTML beim Speichern entfernen; JavaScript im Inhalt erfordert entsprechende Rechte (`unfiltered_html`). Wenn Script oder Custom Element entfernt werden, Variante B verwenden. In Multisite ist `unfiltered_html` grundsätzlich den Super-Admins vorbehalten. [WordPress: Custom HTML](https://wordpress.org/documentation/article/custom-html/), [Rollen und Berechtigungen](https://wordpress.org/documentation/article/roles-and-capabilities/)

### Variante B: Kleines WordPress-Plugin mit Shortcode

Diese Variante lädt das Script über WordPress und erzeugt den Widget-Tag serverseitig. Redakteurinnen und Redakteure fügen anschließend nur `[uranus_widget]` ein. Das folgende Plugin ist ein **Integrationsbeispiel dieser Anleitung**, kein bereits mitgeliefertes Repository-Plugin.

Lokal diesen Ordner erstellen:

```text
uranus-widget-embed/
├── uranus-widget-embed.php
└── assets/
    ├── uranus-widget-vue.js
    ├── config.json
    └── theme.css
```

Die PHP-Datei `uranus-widget-embed.php` neu anlegen. Sie meldet das Plugin an, lädt das Bundle im Frontend und registriert den Shortcode:

```php
<?php
/**
 * Plugin Name: Uranus Widget Einbindung
 * Description: Bindet das Uranus Widget über [uranus_widget] ein.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script(
        'uranus-widget-embed',
        plugins_url('assets/uranus-widget-vue.js', __FILE__),
        array(),
        (string) filemtime(__DIR__ . '/assets/uranus-widget-vue.js'),
        true
    );
});

add_shortcode('uranus_widget', function () {
    $config_url = plugins_url('assets/config.json', __FILE__);
    return '<uranus-widget config-url="'
        . esc_url($config_url)
        . '"></uranus-widget>';
});
```

Das Script wird hier einfachheitshalber auf allen Frontend-Seiten im Footer geladen. Dadurch funktioniert der Shortcode auch in unterschiedlichen Inhaltskontexten; das Script startet ohne Widget-Element keine Veranstaltungsabfrage. Bei einer projektspezifischen Beschränkung kann die Ladefunktion zusätzlich eine passende Seitenbedingung erhalten. WordPress verwaltet die Script-Einbindung mit `wp_enqueue_script`; Shortcodes geben ihr HTML als Rückgabewert zurück. [WordPress: Scripts einbinden](https://developer.wordpress.org/reference/functions/wp_enqueue_script/), [Shortcode-Grundlagen](https://developer.wordpress.org/plugins/shortcodes/basic-shortcodes/)

Die Datei `assets/config.json` enthält die vollständige Konfiguration aus Abschnitt 2. Bei einer Standardinstallation wird darin die Theme-Zeile geändert zu:

```json
"styles": ["/wp-content/plugins/uranus-widget-embed/assets/theme.css"]
```

Der PHP-Code ermittelt die Script- und Konfigurations-URL automatisch. Der CSS-Pfad in der statischen JSON-Datei muss dagegen an die tatsächliche Installation angepasst werden, gegebenenfalls als vollständige HTTPS-URL.

Den Ordner `uranus-widget-embed` als ZIP-Datei packen, sodass er im ZIP enthalten ist. In WordPress unter **Plugins → Installieren → Plugin hochladen** die ZIP-Datei hochladen, installieren und aktivieren. Alternativ den Ordner per SFTP unter `wp-content/plugins/` ablegen und dann aktivieren. Dafür wird ein Konto mit Plugin-Installationsrechten benötigt; in Multisite erfolgt die Bereitstellung über die Netzwerkadministration. [WordPress-Berechtigungen](https://wordpress.org/documentation/article/roles-and-capabilities/)

Auf der Zielseite einen **Shortcode-Block** mit diesem Inhalt einfügen:

```text
[uranus_widget]
```

Kein zusätzliches Script aus Variante A einfügen. Danach veröffentlichte Seite und gegebenenfalls WordPress-/Hosting-Caches prüfen. Auch hier gehört das Widget-CSS in `assets/theme.css` und wird über `styles` geladen.

## 8. Typische Fehler und spätere Änderungen

| Beobachtung | Prüfen / beheben |
| --- | --- |
| Widget bleibt vollständig leer | Script-URL, Browserkonsole und Erhalt des `<uranus-widget>`-Tags im ausgelieferten HTML prüfen. |
| Fehler zur Registrierung des Custom Elements | Bundle mehrfach eingebunden oder alte `main.js` zusätzlich geladen. Genau eine Implementierung laden. |
| Konfiguration wird nicht geladen | `config-url` direkt im Browser öffnen; Statuscode und gültiges JSON prüfen. Eine CMS-Fehlerseite kann auch mit HTTP 200 als HTML zurückkommen. |
| Abfrage geht an die eigene Website statt Kulturbytes | `apiBaseUrl` fehlt oder ist falsch. Vollständige API-Basis eintragen. |
| Veranstaltungen fehlen | Portal-ID, Zeitraum, Filter und API-Antwort prüfen. Auch URL-Parameter wie `start`, `end`, `tags`, `venue` oder `limit` können Abfragen beeinflussen. |
| CSS wirkt nicht | `styles` ist ein Array; CSS-Datei wurde erfolgreich geladen; Regeln befinden sich im Shadow DOM; Selektor trifft ein tatsächlich ausgegebenes Element. |
| Chip-Hover oder Trennlinien fehlen | `--uw-color-page-hover` und `--uw-color-page-border` explizit im Theme definieren. |
| Bilder werden unerwartet zugeschnitten | Verhältnis der Bildabfrage und beide CSS-Verhältnisse abgleichen. |
| CSS/JSON-Änderung bleibt unsichtbar | Browser-/Server-/CMS-Cache prüfen; gegebenenfalls URLs versionieren, z. B. `theme.css?v=2` und `config.json?v=2`, dann neu laden. |
| Änderungen an `vue/src/` wirken nicht | Website lädt das fertige Bundle. Nach Quellcodeänderungen neu bauen und die neue Datei hochladen. |

Für reine Design- und Filteränderungen genügt es, `theme.css` bzw. `config.json` zu bearbeiten und erneut hochzuladen. Danach die Seite neu laden; die Dateien werden nicht automatisch während einer laufenden Sitzung erneut eingelesen.

Nur für Änderungen an Funktionen oder Templates ist ein eigener Build nötig. Im Repository:

```sh
cd vue
npm install
npm run build
```

Das Ergebnis ist gemäß `vite.config.js` **`vue/dist/uranus-widget-vue.js`**. Nach dem Build diese Datei auf dem Webserver ersetzen. Bei einem Versionswechsel außerdem eigene Klassenregeln gegen die neue Version prüfen.

Die Beispiele wurden anhand des Repository-Codes und der verlinkten CMS-Dokumentation erstellt. Eine Ausführung in einer konkreten TYPO3- oder WordPress-Installation war nicht Bestandteil dieser Prüfung.
