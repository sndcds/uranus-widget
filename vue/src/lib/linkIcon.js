/**
 * Zentrale Link-Konfiguration.
 *
 * Ordnet den Link-Typen (aus `event_links[].type`, `source_link`,
 * `org_web_link`) das passende, im Projekt vorhandene Icon-Asset unter
 * `src/assets/icons` sowie die zentrale Icon-Farbe zu.
 *
 * Es werden KEINE neuen Icons eingeführt — unbekannte Typen fallen auf
 * das generische Link-Icon. Die Farbe wird zentral an einer Stelle
 * gepflegt und von EventDetail sowie den Event Cards gemeinsam genutzt.
 *
 * Hinweis zur Farbe: Icons mit `fill="currentColor"` übernehmen die Farbe
 * automatisch (präferierte Variante). Icons ohne currentColor-Unterstützung
 * behalten ihre eingebettete Markenfarbe.
 */
import iconWeb from '../assets/icons/web.svg'
import iconPdf from '../assets/icons/pdf.svg'
import iconLink from '../assets/icons/link-45deg.svg'
import iconBandcamp from '../assets/icons/bandcamp.svg'
import iconDeezer from '../assets/icons/deezer.svg'
import iconFacebook from '../assets/icons/facebook.svg'
import iconGithub from '../assets/icons/github.svg'
import iconGitlab from '../assets/icons/gitlab.svg'
import iconInstagram from '../assets/icons/instagram.svg'
import iconKulturbytes from '../assets/icons/kulturbytes.svg'
import iconMastodon from '../assets/icons/mastodon.svg'
import iconPippa from '../assets/icons/pippa.svg'
import iconSoundcloud from '../assets/icons/soundcloud.svg'
import iconSpotify from '../assets/icons/spotify.svg'
import iconTwitterX from '../assets/icons/twitter-x.svg'
import iconUranus from '../assets/icons/uranus.svg'
import iconVimeo from '../assets/icons/vimeo.svg'
import iconYoutube from '../assets/icons/youtube.svg'

const DEFAULT_LINK_COLOR = '#333333'
const DEFAULT_LINK_STYLE = { path: iconLink, color: DEFAULT_LINK_COLOR }

/**
 * Zentrale Zuordnung Link-Typ -> { path, color }.
 * @type {Record<string, { path: string, color: string }>}
 */
export const LINK_ICONS = {
  facebook: { path: iconFacebook, color: '#1877F2' },
  instagram: { path: iconInstagram, color: '#405DE6' },
  mastodon: { path: iconMastodon, color: '#6364FF' },
  bandcamp: { path: iconBandcamp, color: '#239FC2' },
  pdf: { path: iconPdf, color: '#F40F02' },
  spotify: { path: iconSpotify, color: '#1DB954' },
  vimeo: { path: iconVimeo, color: '#1AB7EA' },
  youtube: { path: iconYoutube, color: '#FF0000' },
  'twitter-x': { path: iconTwitterX, color: '#000000' },
  deezer: { path: iconDeezer, color: '#A238FF' },
  web: { path: iconWeb, color: '#333333' },
  github: { path: iconGithub, color: '#333333' },
  gitlab: { path: iconGitlab, color: '#FC6D26' },
  soundcloud: { path: iconSoundcloud, color: '#FF5500' },
  uranus: { path: iconUranus, color: '#6D26FC' },
  kulturbytes: { path: iconKulturbytes, color: '#F20D5E' },
  pippa: { path: iconPippa, color: DEFAULT_LINK_COLOR },
}

/** Alias-Zuordnung (beispielsweise "artist_website" -> Web-Icon). */
const LINK_ALIASES = {
  website: 'web',
  artist_website: 'web',
  homepage: 'web',
  source: 'web',
  twitter: 'twitter-x',
}

/**
 * Liefert { path, color } für einen Link-Typ (Fallback: generisches
 * Link-Icon neutral gefärbt).
 *
 * @param {string} [type]  Link-Typ, z. B. 'web', 'pdf', 'youtube'.
 * @returns {{ path: string, color: string }}
 */
export function resolveLinkStyle(type) {
  const key = String(type || '').toLowerCase()
  return LINK_ICONS[key] || LINK_ICONS[LINK_ALIASES[key]] || DEFAULT_LINK_STYLE
}

/**
 * Liefert die passende Icon-URL für einen Link-Typ.
 * Komfort-Wrapper um { styles }.path.
 *
 * @param {string} [type]
 * @returns {string}
 */
export function resolveLinkIcon(type) {
  return resolveLinkStyle(type).path
}
