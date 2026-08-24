<script setup>
import { computed, inject } from 'vue'
import {
  formatShortDate,
  markdownToHtml,
} from '../lib/format'
import { useEventTypes } from '../composables/useEventTypes'
import { priceKey } from '../composables/useEventCard'

/**
 * Einspaltige Event-Detailansicht.
 *
 * Reihenfolge (vertikal):
 *   Bild → Datum/Uhrzeit → Venue → Titel → Subtitle → Event-Typen →
 *   Beschreibung → Details (Preis, Ticket, Teilnahme) → Weitere Termine
 *
 * Verwendet ausschließlich vorhandene Utilities/Komposables für Datum, i18n,
 * Markdown und Event-Typ-Labels. Keine parallele Formatierungslogik.
 */
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  data: {
    type: Object,
    default: null
  },
  links: {
    type: Array,
    default: () => []
  }
})

defineEmits(['close'])

const t = inject('t', (k) => k)
const locale = inject('locale', 'de-DE')
const lang = inject('lang', { value: 'de' })
const apiBaseUrl = inject('apiBaseUrl', '')

// apiBaseUrl kann als reaktive Ref (provide) oder als String übergeben werden
const apiBase = computed(() => {
  if (apiBaseUrl && typeof apiBaseUrl === 'object' && 'value' in apiBaseUrl) {
    return apiBaseUrl.value || ''
  }
  return apiBaseUrl || ''
})

// ---- Daten aus den vorhandenen Event-Strukturen -----------------------------
const date = computed(() => props.data?.date)
const furtherDates = computed(() =>
    Array.isArray(props.data?.further_dates)
        ? props.data.further_dates
        : []
)

const title = computed(() => props.data?.title || '')
const subtitle = computed(() => props.data?.subtitle || '')

// Hauptbild: nur wenn vorhanden (nie ein leerer Bereich) + inkl. Maßen
const mainImage = computed(() => props.data?.images?.main || null)

// Bild-URL: maximal 800px breit, Seitenverhältnis bleibt erhalten,
// wenn wir KEIN ratio vorgeben (~> API liefert Original-Proportionen).
const imageUrl = computed(() => {
  const img = mainImage.value
  if (!img?.url) return ''
  const width = Math.min(Number(img.width) || 800, 800)
  return `${img.url}/?width=${width}`
})

// ---- Datum/Uhrzeit (vorhandene Utility), Venue-Adresse ----------------------
const dateStr = computed(() =>
    date.value ? formatShortDate(date.value, locale.value) : ''
)

const venueName = computed(() => date.value?.venue_name || '')
const venueAddress = computed(() => {
  const d = date.value
  if (!d) return ''

  const street = [d.venue_street, d.venue_house_number]
      .filter(Boolean)
      .join(' ')
  const cityLine = [d.venue_postal_code, d.venue_city]
      .filter(Boolean)
      .join(' ')

  return [street, cityLine].filter(Boolean).join(', ')
})

// ---- Event-Typen (lokalisierte Labels über das geteilte Lookup) -------------
const { label: typeLabel } = useEventTypes(
    () => apiBase.value,
    () => lang.value || 'de'
)

const typeIds = computed(() =>
    (Array.isArray(props.data?.event_types) ? props.data.event_types : [])
        .map((et) => et?.type_id ?? (et?.id ?? null))
        .filter((id) => id != null)
)

// ---- Beschreibung (vorhandene Markdown-Lösung) ------------------------------
const descriptionHtml = computed(() =>
    props.data?.description
        ? markdownToHtml(props.data.description)
        : ''
)

// ---- Preis, Ticket, Teilnahme ----------------------------------------------
const priceLabel = computed(() => {
  const key = priceKey(props.data)
  if (key) return t(key)

  const priceType = props.data?.price_type
  if (['regular_price', 'tiered_prices'].includes(priceType)) {
    return t('eventCard.priceEntry')
  }
  return ''
})

const ticketLink = computed(() => props.data?.ticket_link || '')
const participationInfo = computed(() => props.data?.participation_info || '')
</script>

<template>
  <div class="uw-detail__container">
    <div v-if="loading" class="uw-is-loading">{{ t('detail.loading') }}</div>
    <div v-else-if="error" class="uw-is-error">{{ t('detail.error', { error }) }}</div>

    <article v-else-if="data" class="uw-event-detail">
      <!-- 1. Hauptbild -->
      <figure v-if="imageUrl" class="uw-event-detail__image">
        <img :src="imageUrl" :alt="title || ''">
      </figure>

      <!-- 2.-6. Kopf: Datum, Venue, Titel, Subtitle, Event-Typen -->
      <header class="uw-event-detail__header">
        <p v-if="dateStr" class="uw-event-detail__date">
          {{ dateStr }}
        </p>

        <address v-if="venueName" class="uw-event-detail__venue">
          {{ venueName }}<template v-if="venueAddress">, {{ venueAddress }}</template>
        </address>

        <h2 class="uw-detail__title">{{ title }}</h2>

        <p v-if="subtitle" class="uw-detail__subtitle">{{ subtitle }}</p>

        <p v-if="typeIds.length" class="uw-event-detail__types">
          <span
              v-for="(id, i) in typeIds"
              :key="`${id}-${i}`"
              class="uw-filter__chip uw-chip-static"
          >{{ typeLabel(id) || `Typ ${id}` }}</span>
        </p>
      </header>

      <!-- 7. Beschreibung -->
      <div
          v-if="descriptionHtml"
          class="uw-detail__description uw-event-detail__description"
          v-html="descriptionHtml"
      ></div>

      <!-- 8.-10. Details: Preis, Ticket, Teilnahme -->
      <dl v-if="priceLabel || ticketLink || participationInfo" class="uw-event-detail__details">
        <div v-if="priceLabel" class="uw-event-detail__detail">
          <dt>{{ t('detail.price') }}</dt>
          <dd>{{ priceLabel }}</dd>
        </div>

        <div v-if="ticketLink" class="uw-event-detail__detail">
          <dt>{{ t('detail.ticketLabel') }}</dt>
          <dd>
            <a
                class="uw-button"
                :href="ticketLink"
                target="_blank"
                rel="noopener noreferrer"
            >{{ t('detail.ticketLink') }}</a>
          </dd>
        </div>

        <div v-if="participationInfo" class="uw-event-detail__detail">
          <dt>{{ t('detail.participation') }}</dt>
          <dd>{{ participationInfo }}</dd>
        </div>
      </dl>

      <!-- Weitere Links (Veranstalter/Webseite) - bestehende Funktionalität -->
      <div v-if="links.length" class="uw-detail__links">
        <a
            v-for="link in links"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener"
        >{{ link.label }}</a>
      </div>

      <!-- 11. Weitere Termine -->
      <section v-if="furtherDates.length" class="uw-event-detail__dates">
        <h3 class="uw-event-detail__dates-title">{{ t('detail.dates') }}</h3>
        <ul class="uw-event-detail__dates-list">
          <li
              v-for="fd in furtherDates"
              :key="fd.uuid || `${fd.start_date}-${fd.start_time}`"
              class="uw-event-detail__date-item"
          >
            <span class="uw-event-detail__date-item-date">{{ formatShortDate(fd, locale.value) }}</span>
            <span v-if="fd.venue_name" class="uw-event-detail__date-item-venue">{{ fd.venue_name }}</span>
          </li>
        </ul>
      </section>
    </article>
  </div>
</template>
