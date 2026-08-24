/**
 * Link-Icon-Auflösung.
 *
 * Ordnet den Link-Typen (aus `event_links[].type`, `source_link`,
 * `org_web_link`) die passenden, im Projekt bereits vorhandenen
 * Icon-Assets unter `src/assets/icons` zu. Es werden KEINE neuen Icons
 * eingeführt — unbekannte Typen fallen auf das generische Link-Icon.
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

/** Direkte Zuordnung Link-Typ -> Icon-Asset. */
const LINK_ICONS = {
  web: iconWeb,
  website: iconWeb,
  artist_website: iconWeb,
  homepage: iconWeb,
  source: iconWeb,
  pdf: iconPdf,
  bandcamp: iconBandcamp,
  deezer: iconDeezer,
  facebook: iconFacebook,
  github: iconGithub,
  gitlab: iconGitlab,
  instagram: iconInstagram,
  kulturbytes: iconKulturbytes,
  mastodon: iconMastodon,
  pippa: iconPippa,
  soundcloud: iconSoundcloud,
  spotify: iconSpotify,
  'twitter-x': iconTwitterX,
  twitter: iconTwitterX,
  uranus: iconUranus,
  vimeo: iconVimeo,
  youtube: iconYoutube,
}

/**
 * Liefert die passende Icon-URL für einen Link-Typ.
 *
 * @param {string} [type]  Link-Typ, z. B. 'web', 'pdf', 'youtube'.
 * @returns {string}       Resolved Icon-Asset-URL (Fallback: Link-Icon).
 */
export function resolveLinkIcon(type) {
  const key = String(type || '').toLowerCase()
  return LINK_ICONS[key] || iconLink
}
