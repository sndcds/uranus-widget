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
 * Farbe: Die Icons werden inline (SVG-Quelltext) gerendert und über
 * `fill="currentColor"` bzw. die CSS-Regel `fill: currentColor` eingefärbt.
 * Die Farbe stammt dabei ausschließlich aus dieser Konfiguration (`color`).
 * Icons mit eingebetteten Mehrfarben (`style="fill:…"`) behalten ihre
 * Markenfarbe, die identisch zur zentralen Farbe ist.
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

import iconWebRaw from '../assets/icons/web.svg?raw'
import iconPdfRaw from '../assets/icons/pdf.svg?raw'
import iconLinkRaw from '../assets/icons/link-45deg.svg?raw'
import iconBandcampRaw from '../assets/icons/bandcamp.svg?raw'
import iconDeezerRaw from '../assets/icons/deezer.svg?raw'
import iconFacebookRaw from '../assets/icons/facebook.svg?raw'
import iconGithubRaw from '../assets/icons/github.svg?raw'
import iconGitlabRaw from '../assets/icons/gitlab.svg?raw'
import iconInstagramRaw from '../assets/icons/instagram.svg?raw'
import iconKulturbytesRaw from '../assets/icons/kulturbytes.svg?raw'
import iconMastodonRaw from '../assets/icons/mastodon.svg?raw'
import iconPippaRaw from '../assets/icons/pippa.svg?raw'
import iconSoundcloudRaw from '../assets/icons/soundcloud.svg?raw'
import iconSpotifyRaw from '../assets/icons/spotify.svg?raw'
import iconTwitterXRaw from '../assets/icons/twitter-x.svg?raw'
import iconUranusRaw from '../assets/icons/uranus.svg?raw'
import iconVimeoRaw from '../assets/icons/vimeo.svg?raw'
import iconYoutubeRaw from '../assets/icons/youtube.svg?raw'

const DEFAULT_LINK_COLOR = '#333333'
const DEFAULT_LINK_STYLE = {
  path: iconLink,
  color: DEFAULT_LINK_COLOR,
  svg: iconLinkRaw,
}

/**
 * Zentrale Zuordnung Link-Typ -> { path, color, svg }.
 * `path` ist die Asset-URL, `svg` der Inline-Quelltext für das gerenderte
 * Icon, `color` die zentral gepflegte Icon-Farbe.
 * @type {Record<string, { path: string, color: string, svg: string }>}
 */
export const LINK_ICONS = {
  facebook: { path: iconFacebook, color: '#1877F2', svg: iconFacebookRaw },
  instagram: { path: iconInstagram, color: '#405DE6', svg: iconInstagramRaw },
  mastodon: { path: iconMastodon, color: '#6364FF', svg: iconMastodonRaw },
  bandcamp: { path: iconBandcamp, color: '#239FC2', svg: iconBandcampRaw },
  pdf: { path: iconPdf, color: '#F40F02', svg: iconPdfRaw },
  spotify: { path: iconSpotify, color: '#1DB954', svg: iconSpotifyRaw },
  vimeo: { path: iconVimeo, color: '#1AB7EA', svg: iconVimeoRaw },
  youtube: { path: iconYoutube, color: '#FF0000', svg: iconYoutubeRaw },
  'twitter-x': { path: iconTwitterX, color: '#000000', svg: iconTwitterXRaw },
  deezer: { path: iconDeezer, color: '#A238FF', svg: iconDeezerRaw },
  web: { path: iconWeb, color: '#333333', svg: iconWebRaw },
  github: { path: iconGithub, color: '#333333', svg: iconGithubRaw },
  gitlab: { path: iconGitlab, color: '#FC6D26', svg: iconGitlabRaw },
  soundcloud: { path: iconSoundcloud, color: '#FF5500', svg: iconSoundcloudRaw },
  uranus: { path: iconUranus, color: '#6D26FC', svg: iconUranusRaw },
  kulturbytes: { path: iconKulturbytes, color: '#F20D5E', svg: iconKulturbytesRaw },
  pippa: { path: iconPippa, color: DEFAULT_LINK_COLOR, svg: iconPippaRaw },
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
 * Liefert { path, color, svg } für einen Link-Typ
 * (Fallback: generisches Link-Icon neutral gefärbt).
 *
 * @param {string} [type]  Link-Typ, z. B. 'web', 'pdf', 'youtube'.
 * @returns {{ path: string, color: string, svg: string }}
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
