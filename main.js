const BASE_URL = 'https://api.kulturbytes.de/api/events';
const API_PREFIX = 'data-';

const PARAM_MAP = {
  limit: 'limit',
  tags: 'tags',
  venue: 'venue',
  city: 'city',
  start: 'start',
  end: 'end',
  categories: 'categories',
};

const CATEGORIES = [
  { id: 1, label: 'Kultur' },
  { id: 2, label: 'Bildung' },
  { id: 3, label: 'Sport' },
  { id: 4, label: 'Freizeit' },
  { id: 5, label: 'Familie' },
  { id: 6, label: 'Gesellschaft' },
];

class UranusWidget extends HTMLElement {
  #config = {};
  #events = [];
  #page = 1;
  #requestCursors = [];
  #hasNext = true;
  #loading = false;
  #error = null;
  #root = null;
  #selectedCategories = [];
  #summary = null;
  #detailUuid = null;
  #detailData = null;

  get #totalPages() {
    if (!this.#summary) return 0;
    return Math.ceil(this.#summary.total_event_count / this.#config.limit);
  }

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
    this.#root.adoptedStyleSheets = [styles];
  }

  connectedCallback() {
    this.#parseConfig();
    window.addEventListener('popstate', () => this.#onUrlChange());
    this.#onUrlChange();
  }

  /**
   * Erzeugt die Deep-Link-URL mit gesetztem bzw. entferntem `event`-Parameter.
   * Pfad, Hash und alle übrigen Query-Parameter bleiben erhalten.
   */
  #detailUrl(uuid) {
    const url = new URL(window.location.href);
    if (uuid) url.searchParams.set('event', uuid);
    else url.searchParams.delete('event');
    return url.toString();
  }

  /**
   * Reagiert auf URL-Änderungen (initiales Laden sowie popstate).
   * Die URL ist die Quelle der Wahrheit für Liste vs. Detailansicht.
   */
  #onUrlChange() {
    const params = new URLSearchParams(location.search);
    const uuid = params.get('event');

    if (uuid) {
      this.#detailUuid = uuid;
      this.#detailData = null;
      this.#render();
      this.#loadDetail();
      return;
    }

    this.#detailUuid = null;
    this.#detailData = null;
    this.#render();

    if (!this.#loading) {
      this.#wireFilterBar();
      this.#renderPagination();
      this.#renderEvents();
      if (!this.#events.length) {
        this.#loadEvents();
        this.#loadSummary();
      }
    }
  }

  #parseConfig() {
    const cfg = {};
    for (const attr of this.attributes) {
      if (!attr.name.startsWith(API_PREFIX)) continue;
      const key = attr.name.slice(API_PREFIX.length).replace(/-./g, c => c[1].toUpperCase());
      let val = attr.value.trim();
      if (key === 'limit') val = parseInt(val, 10) || 12;
      else if (key === 'categories' && val) val = val.split(',').map(s => s.trim());
      else if ((key === 'tags' || key === 'languages') && val) val = val.split(',').map(s => s.trim());
      cfg[key] = val;
    }
    if (!cfg.limit) cfg.limit = 12;
    this.#config = cfg;
  }

  #buildUrl(cursor) {
    const params = new URLSearchParams();
    params.set('limit', this.#config.limit);
    if (this.#selectedCategories.length > 0) {
      params.set('categories', this.#selectedCategories.join(','));
    }
    for (const [key, val] of Object.entries(this.#config)) {
      if (key === 'limit') continue;
      if (val === undefined || val === null || val === '') continue;
      const apiKey = PARAM_MAP[key];
      if (!apiKey) continue;
      params.set(apiKey, Array.isArray(val) ? val.join(',') : val);
    }
    if (cursor) {
      params.set('last_event_date_uuid', cursor.date_uuid);
      params.set('last_event_start_at', cursor.start_at);
    }
    return `${BASE_URL}?${params.toString()}`;
  }

  #buildSummaryUrl() {
    const params = new URLSearchParams();
    if (this.#selectedCategories.length > 0) {
      params.set('categories', this.#selectedCategories.join(','));
    }
    for (const [key, val] of Object.entries(this.#config)) {
      if (key === 'limit') continue;
      if (val === undefined || val === null || val === '') continue;
      const apiKey = PARAM_MAP[key];
      if (!apiKey) continue;
      params.set(apiKey, Array.isArray(val) ? val.join(',') : val);
    }
    return `${BASE_URL.replace('/events', '/events/type-summary')}?${params.toString()}`;
  }

  async #loadSummary() {
    try {
      const url = this.#buildSummaryUrl();
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      if (json.status !== 200 || !json.data) return;
      this.#summary = json.data;
      this.#renderPagination();
    } catch {
    }
  }

  #toggleCategory(id) {
    const idx = this.#selectedCategories.indexOf(id);
    if (idx === -1) {
      this.#selectedCategories.push(id);
    } else {
      this.#selectedCategories.splice(idx, 1);
    }
    this.#page = 1;
    this.#requestCursors = [];
    this.#hasNext = true;
    this.#events = [];
    this.#summary = null;
    this.#render();
    this.#loadEvents();
    this.#loadSummary();
  }

  async #loadEvents(direction) {
    if (this.#loading) return;
    this.#loading = true;
    this.#error = null;
    this.#updateUI();

    try {
      let cursor = null;

      if (direction === 'next') {
        cursor = this.#requestCursors[this.#page - 1] || null;
      } else if (direction === 'prev') {
        this.#requestCursors.pop();
        this.#page--;
        cursor = this.#requestCursors[this.#page - 1] || null;
        this.#events = [];
      }

      const url = this.#buildUrl(cursor);
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();

      if (json.status !== 200 || !json.data) {
        throw new Error('Ungültige API-Antwort');
      }

      const events = json.data.events || [];
      const lastUuid = json.data.last_event_date_uuid;
      const lastStart = json.data.last_event_start_at;

      this.#events = events;
      this.#hasNext = events.length === this.#config.limit && !!lastUuid;

      if (lastUuid) {
        this.#requestCursors.push({ date_uuid: lastUuid, start_at: lastStart });
      }

      if (direction === 'next') {
        this.#page++;
      }

      this.#renderEvents();
    } catch (err) {
      this.#error = err.message;
      this.#render();
    } finally {
      this.#loading = false;
      this.#updateUI();
    }
  }

  #goToNext() {
    this.#loadEvents('next');
  }

  #goToPrev() {
    this.#loadEvents('prev');
  }

  async #openDetail(e) {
    this.#detailUuid = e.uuid;
    this.#detailData = null;
    history.pushState(null, '', this.#detailUrl(e.uuid));
    this.#render();
    this.#loadDetail();
  }

  #closeDetail() {
    history.replaceState(null, '', this.#detailUrl(null));
    this.#detailUuid = null;
    this.#detailData = null;
    this.#render();
    if (!this.#loading) {
      this.#wireFilterBar();
      this.#renderPagination();
      this.#renderEvents();
    }
    this.#loadEvents();
    this.#loadSummary();
  }

  async #loadDetail() {
    try {
      const res = await fetch(`https://api.kulturbytes.de/api/event/${this.#detailUuid}?lang=de`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status !== 200 || !json.data) throw new Error('Ungültige Antwort');
      this.#detailData = json.data;
      this.#renderDetail();
    } catch (err) {
      this.#root.querySelector('.detail-container').innerHTML = `<div class="error">Fehler beim Laden: ${this.#escapeHtml(err.message)}</div>`;
    }
  }

  #render() {
    if (this.#detailUuid) {
      this.#root.innerHTML = `
        <div class="widget">
          <button class="btn-back">← Zurück zur Übersicht</button>
          <div class="detail-container">
            ${this.#detailData ? '' : '<div class="loading">Lade Details...</div>'}
          </div>
        </div>
      `;
      this.#root.querySelector('.btn-back')?.addEventListener('click', () => this.#closeDetail());
      if (this.#detailData) this.#renderDetail();
      return;
    }

    this.#root.innerHTML = `
      <div class="widget">
        <div class="widget-header">
          <h2 class="widget-title">Events</h2>
          ${this.#summary ? `<span class="event-count">${this.#summary.total_event_count} Events</span>` : ''}
        </div>
        <div class="filter-bar">
          ${CATEGORIES.map(c => `
            <button class="filter-chip${this.#selectedCategories.includes(c.id) ? ' active' : ''}" data-cat="${c.id}">${c.label}</button>
          `).join('')}
        </div>
        <div class="events-container" part="events">
          ${this.#loading ? '<div class="loading">Lade Events...</div>' : ''}
          ${this.#error ? `<div class="error">${this.#escapeHtml(this.#error)}</div>` : ''}
          ${!this.#loading && !this.#error ? '<div class="events-list"></div>' : ''}
        </div>
        ${!this.#loading && !this.#error ? `
          <div class="pagination"></div>
        ` : ''}
      </div>
    `;

    if (!this.#loading && !this.#error) {
      this.#wireFilterBar();
      this.#renderPagination();
      this.#renderEvents();
    }
  }

  #wireFilterBar() {
    for (const btn of this.#root.querySelectorAll('.filter-chip')) {
      btn.addEventListener('click', () => {
        this.#toggleCategory(parseInt(btn.dataset.cat, 10));
      });
    }
  }

  #renderPagination() {
    const el = this.#root.querySelector('.pagination');
    if (!el) return;
    const total = this.#totalPages;
    if (total <= 1) {
      el.innerHTML = '';
      return;
    }

    el.innerHTML = `
      <button class="btn-prev"${this.#page <= 1 ? ' disabled' : ''}>←</button>
      <span class="page-info">SEITE ${this.#page} VON ${total}</span>
      <button class="btn-next"${!this.#hasNext ? ' disabled' : ''}>→</button>
    `;

    el.querySelector('.btn-prev')?.addEventListener('click', () => this.#goToPrev());
    el.querySelector('.btn-next')?.addEventListener('click', () => this.#goToNext());
  }

  #renderEvents() {
    const list = this.#root.querySelector('.events-list');
    if (!list) return;

    if (this.#events.length === 0) {
      list.innerHTML = '<div class="empty">Keine Events gefunden.</div>';
      return;
    }

    list.innerHTML = this.#events.map(e => `
      <div class="event-card" data-uuid="${e.uuid}">
        <div class="event-image">
          ${e.image_path
            ? `<img src="${this.#escapeHtml(e.image_path)}/?ratio=1:1&width=480" alt="${this.#escapeHtml(e.title)}" loading="lazy">`
            : '<div class="image-placeholder">Kein Bild</div>'}
        </div>
        <div class="event-content">
          <h3 class="event-title">${this.#escapeHtml(e.title)}</h3>
          ${e.subtitle ? `<p class="event-subtitle">${this.#escapeHtml(e.subtitle)}</p>` : ''}
          <p class="event-meta">
            ${this.#formatDate(e)}${e.venue_name ? ` &middot; ${this.#escapeHtml(e.venue_name)}` : ''}${e.venue_city ? `, ${this.#escapeHtml(e.venue_city)}` : ''}
          </p>
          ${e.summary ? `<p class="event-summary">${this.#escapeHtml(e.summary.substring(0, 300))}${e.summary.length > 300 ? '…' : ''}</p>` : ''}
        </div>
      </div>
    `).join('');

    for (const card of list.querySelectorAll('.event-card')) {
      const uuid = card.dataset.uuid;
      const event = this.#events.find(e => e.uuid === uuid);
      if (event) card.addEventListener('click', () => this.#openDetail(event));
    }
  }

  #renderDetail() {
    const container = this.#root.querySelector('.detail-container');
    if (!container || !this.#detailData) return;
    const d = this.#detailData;
    const venue = d.further_dates?.[0];
    const dateStr = this.#formatDetailDate(venue);

    container.innerHTML = `
      <div class="detail">
        ${d.images?.main?.url ? `<div class="detail-image"><img src="${this.#escapeHtml(d.images.main.url)}/?ratio=16:9&width=900" alt="${this.#escapeHtml(d.title)}"></div>` : ''}
        <div class="detail-body">
          <h2 class="detail-title">${this.#escapeHtml(d.title)}</h2>
          ${d.subtitle ? `<p class="detail-subtitle">${this.#escapeHtml(d.subtitle)}</p>` : ''}
          <div class="detail-meta">
            ${dateStr ? `<p><strong>Datum & Uhrzeit:</strong> ${dateStr}</p>` : ''}
            ${venue?.venue_name || d.org_name ? `<p><strong>Ort:</strong> ${this.#escapeHtml(venue?.venue_name || d.org_name)}${venue?.venue_city ? `, ${this.#escapeHtml(venue.venue_city)}` : ''}</p>` : ''}
          </div>
          ${d.description ? `<div class="detail-description">${this.#renderDescription(d.description)}</div>` : ''}
          <div class="detail-links">
            ${d.source_link ? `<a href="${this.#escapeHtml(d.source_link)}" target="_blank" rel="noopener">${d.source_link.startsWith('http') ? 'Veranstaltungslink' : this.#escapeHtml(d.source_link)}</a>` : ''}
            ${d.org_web_link ? `<a href="${this.#escapeHtml(d.org_web_link)}" target="_blank" rel="noopener">Webseite des Veranstalters</a>` : ''}
            ${d.event_links?.map(l => l.url ? `<a href="${this.#escapeHtml(l.url)}" target="_blank" rel="noopener">${this.#escapeHtml(l.label || l.type || l.url)}</a>` : '').filter(Boolean).join('') || ''}
          </div>
        </div>
      </div>
    `;
  }

  #renderDescription(text) {
    return text
      .split('\n')
      .map(line => line.trim() ? `<p>${this.#escapeHtml(line)}</p>` : '')
      .join('');
  }

  #formatDetailDate(venue) {
    if (!venue) return '';
    const parts = [];
    if (venue.start_date) {
      parts.push(this.#formatDateStr(venue.start_date));
      if (venue.start_time) parts[parts.length - 1] += `, ${venue.start_time}`;
    }
    if (venue.end_date && venue.end_date !== venue.start_date) {
      parts.push(`– ${this.#formatDateStr(venue.end_date)}`);
      if (venue.end_time) parts[parts.length - 1] += `, ${venue.end_time}`;
    } else if (venue.end_time && venue.end_time !== venue.start_time) {
      parts.push(`– ${venue.end_time}`);
    }
    return parts.join(' ');
  }

  #updateUI() {
    const container = this.#root.querySelector('.events-container');
    if (!container) return;
    if (this.#loading) {
      container.innerHTML = '<div class="loading">Lade Events...</div>';
      return;
    }
    if (this.#error) {
      container.innerHTML = `<div class="error">${this.#escapeHtml(this.#error)}</div>`;
      return;
    }
    if (!container.querySelector('.events-list')) {
      container.innerHTML = '<div class="events-list"></div>';
    }
    this.#renderEvents();
    this.#renderPagination();
  }

  #formatDate(e) {
    const parts = [];
    if (e.start_date) {
      parts.push(this.#formatDateStr(e.start_date));
      if (e.start_time) parts[parts.length - 1] += `, ${e.start_time}`;
    }
    if (e.end_date && e.end_date !== e.start_date) {
      parts.push(`– ${this.#formatDateStr(e.end_date)}`);
      if (e.end_time) parts[parts.length - 1] += `, ${e.end_time}`;
    } else if (e.end_time && e.end_time !== e.start_time) {
      parts.push(`– ${e.end_time}`);
    }
    return parts.join(' ');
  }

  #formatDateStr(str) {
    try {
      const d = new Date(str + 'T00:00:00');
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return str;
    }
  }

  #escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

const styles = new CSSStyleSheet();
styles.replaceSync(`
  :host {
    display: block;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: #1a1a1a;
    max-width: 900px;
    margin: 0 auto;
  }

  .widget {
    padding: 16px;
  }

  .widget-header {
    margin-bottom: 16px;
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .widget-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .event-count {
    font-size: 0.9rem;
    color: #777;
  }

  .events-container {
    min-height: 120px;
  }

  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .filter-chip {
    padding: 6px 16px;
    border: 1px solid #ccc;
    border-radius: 20px;
    background: #fff;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }

  .filter-chip:hover {
    background: #f0f0f0;
  }

  .filter-chip.active {
    background: #1a73e8;
    color: #fff;
    border-color: #1a73e8;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .event-card {
    display: flex;
    gap: 16px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
    cursor: pointer;
    transition: box-shadow 0.2s;
  }

  .event-card:hover {
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }

  .event-image {
    flex: 0 0 150px;
    width: 150px;
    height: 150px;
    overflow: hidden;
  }

  .event-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 0.85rem;
  }

  .event-content {
    flex: 1;
    padding: 12px 12px 12px 0;
    min-width: 0;
  }

  .event-title {
    margin: 0 0 4px;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .event-subtitle {
    margin: 0 0 6px;
    font-size: 0.95rem;
    color: #555;
  }

  .event-meta {
    margin: 0 0 8px;
    font-size: 0.85rem;
    color: #777;
  }

  .event-summary {
    margin: 0;
    font-size: 0.9rem;
    color: #444;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .loading,
  .error,
  .empty {
    padding: 40px 0;
    text-align: center;
    color: #888;
  }

  .error {
    color: #d32f2f;
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;
  }

  .pagination button,
  .page-info {
    font-size: 0.9rem;
  }

  .pagination button {
    padding: 6px 16px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fafafa;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
  }

  .pagination button:hover:not(:disabled) {
    background: #eaeaea;
  }

  .pagination button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .page-info {
    color: #555;
    font-weight: 500;
    min-width: 140px;
    text-align: center;
  }

  .btn-back {
    display: inline-block;
    margin-bottom: 16px;
    padding: 8px 20px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fafafa;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .btn-back:hover {
    background: #eaeaea;
  }

  .detail-image {
    margin-bottom: 20px;
    border-radius: 8px;
    overflow: hidden;
  }

  .detail-image img {
    width: 100%;
    display: block;
  }

  .detail-body {
    max-width: 100%;
  }

  .detail-title {
    margin: 0 0 4px;
    font-size: 1.375rem;
    font-weight: 700;
  }

  .detail-subtitle {
    margin: 0 0 12px;
    font-size: 1rem;
    color: #555;
  }

  .detail-meta {
    margin-bottom: 16px;
    font-size: 0.9rem;
    color: #444;
  }

  .detail-meta p {
    margin: 0 0 4px;
  }

  .detail-description {
    margin-bottom: 20px;
    font-size: 0.95rem;
    line-height: 1.6;
    color: #333;
  }

  .detail-description p {
    margin: 0 0 8px;
  }

  .detail-links {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .detail-links a {
    color: #1a73e8;
    text-decoration: none;
  }

  .detail-links a:hover {
    text-decoration: underline;
  }

  @media (max-width: 600px) {
    .event-card {
      flex-direction: column;
    }
    .event-image {
      flex: 0 0 auto;
      width: 100%;
      height: 200px;
    }
    .event-content {
      padding: 0 12px 12px;
    }
  }
`);

customElements.define('uranus-widget', UranusWidget);
