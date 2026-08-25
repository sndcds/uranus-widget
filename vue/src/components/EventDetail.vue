<script setup>
import { computed, inject, nextTick, ref, watch } from 'vue'
import {
  formatShortDate,
  formatPrice,
  markdownToHtml,
} from '../lib/format'
import { aiLabelImage } from '../lib/eventImage'
import { useEventTypes } from '../composables/useEventTypes'
import { priceKey } from '../composables/useEventCard'

/**
 * Einspaltige Event-Detailansicht.
 *
 * Reihenfolge (vertikal):
 *   Bild (+ Copyright, AI-Label) → Datum/Uhrzeit → Venue → Titel → Subtitle →
 *   Event-Typen → Beschreibung → Details (Preis, Einlasskasse, Vorverkaufs­
 *   gebühr, Alter, Teilnahme, Ticket) → Links → Weitere Termine →
 *   Veranstalter-Hinweis
 *
 * Verwendet ausschließlich vorhandene Utilities/Komposables für Datum, i18n,
 * Markdown, Event-Typ-Labels, Preisformatierung, AI-Label und Link-Icons.
 * Keine parallele Mapping-/Formatierungslogik.
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

const apiBase = computed(() => {
  if (apiBaseUrl && typeof apiBaseUrl === 'object' && 'value' in apiBaseUrl) {
    return apiBaseUrl.value || ''
  }
  return apiBaseUrl || ''
})

// ---- Daten aus den vorhandenen Event-/Image-Strukturen ----------------------
const date = computed(() => props.data?.date)
const furtherDates = computed(() =>
    Array.isArray(props.data?.further_dates)
        ? props.data.further_dates
        : []
)

const title = computed(() => props.data?.title || '')
const subtitle = computed(() => props.data?.subtitle || '')

const mainImage = computed(() => props.data?.images?.main || null)

const imageUrl = computed(() => {
  const img = mainImage.value
  if (!img?.url) return ''
  const width = Math.min(Number(img.width) || 800, 800)
  return `${img.url}/?width=${width}`
})

// Copyright-/Credits-Zeile unter dem Bild (nur wenn vorhanden)
const imageCredit = computed(() => {
  const name = mainImage.value?.copyright
  return name ? t('detail.imageBy', { name }) : ''
})

// AI-Label: nur wenn ai_label vorhanden und !== 'none'
const aiLabel = computed(() =>
    aiLabelImage(mainImage.value?.ai_label)
)

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

// ---- Preis & Ticket ---------------------------------------------------------
const priceValue = computed(() => {
  if (!props.data) return ''

  const key = priceKey(props.data)
  if (key) return t(key)

  const d = props.data
  if (d.min_price != null || d.max_price != null) {
    const price = formatPrice(
        locale.value,
        d.min_price,
        d.max_price,
        d.currency
    )
    if (price) return price
  }

  if (['regular_price', 'tiered_prices'].includes(d.price_type)) {
    return t('eventCard.priceEntry')
  }
  return ''
})

const ticketFlags = computed(() =>
    Array.isArray(props.data?.ticket_flags) ? props.data.ticket_flags : []
)

const hasOnSiteTickets = computed(() =>
    ticketFlags.value.includes('on_site_ticket_sales')
)

const hasPresaleFee = computed(() =>
    ticketFlags.value.includes('presale_fee_applies')
)

const ageLabel = computed(() => {
  const minAge = props.data?.min_age
  const maxAge = props.data?.max_age

  if (minAge == null && maxAge == null) return ''
  if (minAge != null && maxAge != null) {
    return t('detail.ageRange', { min: minAge, max: maxAge })
  }
  if (minAge != null) return t('detail.ageFrom', { min: minAge })
  return t('detail.ageUntil', { max: maxAge })
})

const ticketLink = computed(() => props.data?.ticket_link || '')
const participationInfo = computed(() => props.data?.participation_info || '')

// ---- Veranstalter -----------------------------------------------------------
const organizerName = computed(() => props.data?.org_name || '')
const organizerWebLink = computed(() => props.data?.org_web_link || '')

// ---- Fokus-Management -------------------------------------------------------
// Nach dem Laden der Detaildaten wird der Fokus auf die Überschrift gesetzt
// (programmatisch fokussierbar via tabindex="-1"), damit Tastatur- und
// Screenreader-Nutzer*innen den Wechsel zur Detailansicht mitbekommen.
const titleEl = ref(null)

watch(() => props.data, async (data) => {
  if (!data) return
  await nextTick()
  titleEl.value?.focus({ preventScroll: true })
})
</script>

<template>
  <div class="uw-detail__container">
    <div v-if="loading" class="uw-is-loading">{{ t('detail.loading') }}</div>
    <div v-else-if="error" class="uw-is-error">{{ t('detail.error', { error }) }}</div>

    <article v-else-if="data" class="uw-event-detail">
      <!-- 1. Hauptbild + Copyright + AI-Label -->
      <figure v-if="imageUrl" class="uw-event-detail__image">
        <div class="uw-event-detail__image-frame">
          <img :src="imageUrl" :alt="title || ''">
          <img
              v-if="aiLabel"
              class="uw-event-detail__image-ai-label"
              :src="aiLabel"
              alt=""
          >
        </div>
        <figcaption v-if="imageCredit" class="uw-event-detail__image-credit">
          {{ imageCredit }}
        </figcaption>
      </figure>

      <!-- 2.-6. Kopf: Datum, Venue, Titel, Subtitle, Event-Typen -->
      <header class="uw-event-detail__header">
        <p v-if="dateStr" class="uw-event-detail__date">
          {{ dateStr }}
        </p>

        <address v-if="venueName" class="uw-event-detail__venue">
          {{ venueName }}<template v-if="venueAddress">, {{ venueAddress }}</template>
        </address>

        <h2 ref="titleEl" tabindex="-1" class="uw-detail__title">{{ title }}</h2>

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

      <!-- 8.-10. Details: Preis, Einlasskasse, Vorverkaufsgebühr, Alter, Teilnahme, Ticket -->
      <dl
          v-if="priceValue || hasOnSiteTickets || hasPresaleFee || ageLabel || participationInfo || ticketLink"
          class="uw-event-detail__details"
      >
        <div
            v-if="priceValue"
            class="uw-event-detail__detail"
        >
          <dt>{{ t('detail.price') }}</dt>
          <dd>{{ priceValue }}</dd>
        </div>

        <div
            v-if="hasOnSiteTickets"
            class="uw-event-detail__detail"
        >
          <dt>{{ t('detail.ticketLabel') }}</dt>
          <dd>{{ t('detail.onSiteTickets') }}</dd>
        </div>

        <div
            v-if="hasPresaleFee"
            class="uw-event-detail__detail"
        >
          <dt>{{ t('detail.ticketLabel') }}</dt>
          <dd>{{ t('detail.presaleFee') }}</dd>
        </div>

        <div
            v-if="ageLabel"
            class="uw-event-detail__detail"
        >
          <dt>{{ t('detail.participation') }}</dt>
          <dd>{{ ageLabel }}</dd>
        </div>

        <div
            v-if="participationInfo"
            class="uw-event-detail__detail"
        >
          <dt>{{ t('detail.participation') }}</dt>
          <dd>{{ participationInfo }}</dd>
        </div>

        <div
            v-if="ticketLink"
            class="uw-event-detail__detail uw-event-detail__detail--action"
        >
          <dt></dt>
          <dd>
            <a
                class="uw-button"
                :href="ticketLink"
                target="_blank"
                rel="noopener noreferrer"
            >{{ t('detail.ticketLink') }}</a>
          </dd>
        </div>
      </dl>

      <!-- Links (mit Icon + zentraler Farbe) -->
      <div v-if="links.length" class="uw-detail__links">
        <a
            v-for="link in links"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="uw-detail__link"
        >
          <span
              v-if="link.icon"
              class="uw-detail__link-icon"
              :style="link.color
                  ? { '--uw-link-icon': `url('${link.icon}')`, color: link.color }
                  : undefined"
              aria-hidden="true"
          ></span>
          <span>{{ link.label }}</span>
        </a>
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

      <!-- 12. Veranstalter-Hinweis -->
      <footer v-if="organizerName" class="uw-event-detail__organizer">
        {{ t('detail.organizerBy') }}
        <a
            v-if="organizerWebLink"
            :href="organizerWebLink"
            target="_blank"
            rel="noopener noreferrer"
        >{{ organizerName }}</a>
        <span v-else>{{ organizerName }}</span>
      </footer>
    </article>
  </div>
</template>
