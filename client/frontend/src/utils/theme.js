import { APCAcontrast, sRGBtoY } from 'apca-w3'
import { hex2rgba, rgba2hex, rgb2hsl, hsl2rgb } from './colors'

export const STUDIO_ACCENT_PRESETS = [
  { name: 'Sage', value: '#589284' },
  { name: 'Steel', value: '#5b82a6' },
  { name: 'Ochre', value: '#b89356' },
  { name: 'Terracotta', value: '#b86f5c' },
  { name: 'Iris', value: '#8673a8' },
  { name: 'Moss', value: '#6d9658' }
]

export const STUDIO_BASE_TONES = [
  {
    value: 'tone-graphite',
    label: 'Graphite (warm)',
    backdrop: '#161618',
    sidebar: '#121214',
    surface: '#1f1f23',
    sunken: '#101012',
    border: 'rgba(255, 255, 255, 0.08)'
  },
  {
    value: 'tone-slate',
    label: 'Slate (cool)',
    backdrop: '#13171d',
    sidebar: '#0f1318',
    surface: '#1a2028',
    sunken: '#0c1015',
    border: 'rgba(195, 215, 240, 0.09)'
  },
  {
    value: 'tone-midnight',
    label: 'Midnight',
    backdrop: '#0c0f17',
    sidebar: '#080b11',
    surface: '#131824',
    sunken: '#07090e',
    border: 'rgba(180, 198, 235, 0.09)'
  }
]

export function normalizeHex(hex, fallback = '#589284') {
  if (typeof hex !== 'string') return fallback
  const trimmed = hex.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase()
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return '#' + trimmed.toLowerCase()
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1]
    const g = trimmed[2]
    const b = trimmed[3]
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return fallback
}

// taken from apca-w3 sources and slightly modified to make it work in this context
function alphaBlend(rgbaFG = [0, 0, 0, 1.0], rgbBG = [0, 0, 0], isInt = true) {
  rgbaFG[3] = Math.max(Math.min(rgbaFG[3], 1.0), 0.0)
  const compBlend = 1.0 - rgbaFG[3]
  const rgbOut = [0, 0, 0]

  for (let i = 0; i < 3; i++) {
    rgbOut[i] = rgbBG[i] * compBlend + rgbaFG[i] * rgbaFG[3]
    if (isInt) rgbOut[i] = Math.min(Math.round(rgbOut[i]), 255)
  }
  return rgbOut
}

export function contrast(color1, color2) {
  if (typeof color1 === 'string') color1 = hex2rgba(color1)
  if (typeof color2 === 'string') color2 = hex2rgba(color2)
  const y1 = sRGBtoY(alphaBlend(color1, color2))
  const y2 = sRGBtoY(color2)
  const c = APCAcontrast(y1, y2)
  return c < 0 ? c * -1 : c
}

function adjustLightness(hex, delta, satScale = 1) {
  const rgba = hex2rgba(normalizeHex(hex))
  const hsl = rgb2hsl([rgba[0], rgba[1], rgba[2]])
  let l = hsl[2]
  if (delta > 0) {
    l = Math.min(0.9, l + (1 - l) * delta)
  } else {
    l = Math.max(0.08, l * (1 + delta))
  }
  const s = Math.max(0, Math.min(1, hsl[1] * satScale))
  const rgb = hsl2rgb([hsl[0], s, l]).map(v => Math.round(Math.max(0, Math.min(255, v))))
  return rgba2hex([rgb[0], rgb[1], rgb[2]])
}

export function calculateAccentSteps(hex) {
  const base = normalizeHex(hex)
  const rgba = hex2rgba(base)
  const lighter = adjustLightness(base, 0.42, 0.92)
  const light = adjustLightness(base, 0.22, 0.96)
  const dark = adjustLightness(base, -0.18, 1)
  const darker = adjustLightness(base, -0.35, 1.02)
  const subtle = rgba2hex([rgba[0], rgba[1], rgba[2], 0.15])
  const muted = rgba2hex([rgba[0], rgba[1], rgba[2], 0.24])
  const border = rgba2hex([rgba[0], rgba[1], rgba[2], 0.4])
  const textOnAccent = contrast('#f4f6f8', base) >= contrast('#141618', base) ? '#f4f6f8' : '#141618'

  return {
    lighter,
    light,
    base,
    dark,
    darker,
    subtle,
    muted,
    border,
    textOnAccent
  }
}

function deriveContrast(base, config) {
  if (!Array.isArray(config.options)) {
    console.error('contrast derivation options missing or invalid')
    return ''
  }

  const selected = config.options
    .map(opt => {
      if (config.foreground) {
        return [opt, contrast(opt, base)]
      } else {
        return [opt, contrast(base, opt)]
      }
    })
    .reduce(
      (a, b) => {
        if (a[1] >= b[1]) {
          return a
        }
        return b
      },
      [undefined, 0]
    )

  return `${config.var}: ${selected[0]};`
}

function deriveOpacity(base, config) {
  const opacity = Number(config.opacity)
  const rgba = hex2rgba(normalizeHex(base))
  rgba[3] = opacity
  return `${config.var}: ${rgba2hex(rgba)};`
}

function deriveHueShift(base, config) {
  const hs = Number(config.hueShift) || 0
  const hsl = rgb2hsl(hex2rgba(normalizeHex(base)))
  hsl[0] = ((hsl[0] * 360 + hs) % 360) / 360
  return `${config.var}: ${rgba2hex(hsl2rgb(hsl))};`
}

function deriveLightness(base, config) {
  const delta = Number(config.delta) || 0
  const satScale = config.satScale !== undefined ? Number(config.satScale) : 1
  return `${config.var}: ${adjustLightness(base, delta, satScale)};`
}

export function deriveColor(base, config) {
  if (!config.var) console.error('color derivation missing target variable')

  switch (config.type) {
    case 'contrast':
      return deriveContrast(base, config)
    case 'opacity':
      return deriveOpacity(base, config)
    case 'hueShift':
      return deriveHueShift(base, config)
    case 'lightness':
      return deriveLightness(base, config)
    default:
      console.error(`unknown color derivation: ${config.type}`)
  }
}
