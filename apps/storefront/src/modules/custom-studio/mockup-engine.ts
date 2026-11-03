/**
 * Nizamlar Baskı — Canlı Kumaş Gölgelendirme ve Dinamik Vektör Mockup SVG Motoru
 * nizamlar-web/assets/js/live-preview.js saf mantığından React/TS için port edilmiştir.
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").trim()
  const val = parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16
  )
  return {
    r: (val >> 16) & 255,
    g: (val >> 8) & 255,
    b: val & 255,
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  )
}

export function generateFabricShades(baseHex: string) {
  const { r, g, b } = hexToRgb(baseHex || "#202020")
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b
  const isLight = luminance > 140

  const lightFactor = isLight ? 0.18 : 0.28
  const lightHex = rgbToHex(
    r + (255 - r) * lightFactor,
    g + (255 - g) * lightFactor,
    b + (255 - b) * lightFactor
  )

  const darkFactor = isLight ? 0.82 : 0.68
  const darkHex = rgbToHex(r * darkFactor, g * darkFactor, b * darkFactor)

  const ribFactor = isLight ? 0.88 : 0.78
  const ribHex = rgbToHex(r * ribFactor, g * ribFactor, b * ribFactor)

  const creaseStroke = isLight ? "rgba(0, 0, 0, 0.13)" : "rgba(255, 255, 255, 0.08)"
  const stitchStroke = isLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.06)"
  const highlightStroke = isLight ? "rgba(255, 255, 255, 0.40)" : "rgba(255, 255, 255, 0.08)"
  const shadowOpacity = isLight ? 0.14 : luminance < 40 ? 0.32 : 0.24

  return {
    baseHex,
    lightHex,
    darkHex,
    ribHex,
    isLight,
    creaseStroke,
    stitchStroke,
    highlightStroke,
    shadowOpacity,
  }
}

export function generateProductSvgString(
  productId: string,
  view: "front" | "back",
  colorHex: string,
  specText: string = "240 GSM PENYE"
): string {
  const shades = generateFabricShades(colorHex || "#202020")
  const spec = specText || "240 GSM PENYE"

  const defsContent = `
    <defs>
      <filter id="fabricTexture" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
        <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0.12 0" in="noise" result="coloredNoise" />
        <feComposite operator="in" in2="SourceGraphic" result="textured" />
        <feBlend mode="multiply" in="textured" in2="SourceGraphic" />
      </filter>
      <filter id="fleeceTexture" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" result="fleeceNoise" />
        <feColorMatrix type="matrix" values="0.2 0.2 0.2 0 0  0.2 0.2 0.2 0 0  0.2 0.2 0.2 0 0  0 0 0 0.18 0" in="fleeceNoise" result="fleeceOverlay" />
        <feComposite operator="in" in2="SourceGraphic" />
        <feBlend mode="overlay" in2="SourceGraphic" />
      </filter>
      <linearGradient id="fabricGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${shades.lightHex}" />
        <stop offset="42%" stop-color="${shades.baseHex}" />
        <stop offset="100%" stop-color="${shades.darkHex}" />
      </linearGradient>
      <radialGradient id="studioLight" cx="50%" cy="40%" r="58%">
        <stop offset="0%" stop-color="#3d4046" stop-opacity="0.85" />
        <stop offset="50%" stop-color="#282a2e" stop-opacity="0.92" />
        <stop offset="100%" stop-color="#161719" stop-opacity="1" />
      </radialGradient>
    </defs>
    <rect width="600" height="680" fill="#18191b" rx="16" />
    <rect width="600" height="680" fill="url(#studioLight)" rx="16" />
  `

  const badgeSvg = `
    <g transform="translate(30, 30)">
      <rect width="140" height="26" rx="4" fill="rgba(22,23,24,0.85)" stroke="rgba(178,148,96,0.3)" stroke-width="1" />
      <circle cx="14" cy="13" r="3.5" fill="#b29460" />
      <text x="26" y="17" font-family="monospace" font-size="8.5" fill="#f3efe7" font-weight="600" letter-spacing="0.5">${spec.toUpperCase()}</text>
    </g>
  `

  let bodyContent = ""

  if (productId === "tisort") {
    const isBack = view === "back"
    const collarSvg = isBack
      ? `
      <path id="collarRibBack" d="M 235 90 Q 300 115 365 90 Q 300 95 235 90 Z" fill="${shades.ribHex}" />
      <text x="300" y="112" font-family="monospace" font-size="7" fill="#b29460" font-weight="600" text-anchor="middle" letter-spacing="1">NİZAMLAR LAB / 100% COTTON</text>
    `
      : `
      <path id="collarRib" d="M 235 90 Q 300 145 365 90 Q 300 135 235 90 Z" fill="${shades.ribHex}" />
      <path d="M 238 93 Q 300 142 362 93" fill="none" stroke="#b29460" stroke-width="0.8" opacity="0.35" stroke-dasharray="2,2" />
    `

    bodyContent = `
      <ellipse cx="300" cy="635" rx="210" ry="24" fill="#090a0b" opacity="0.65" filter="blur(8px)" />
      <g id="tshirtBody">
        <path id="garmentBodyPath" d="M 235 90 L 105 175 L 140 260 L 195 225 L 190 235 L 190 590 L 410 590 L 410 235 L 405 225 L 460 260 L 495 175 L 365 90 Z" 
              fill="url(#fabricGrad)" filter="url(#fabricTexture)" />
        <path d="M 190 230 C 185 300 195 480 188 590" fill="none" stroke="${shades.creaseStroke}" stroke-width="2" />
        <path d="M 410 230 C 415 300 405 480 412 590" fill="none" stroke="${shades.creaseStroke}" stroke-width="2" />
        <path d="M 215 150 Q 230 350 220 585" fill="none" stroke="rgba(0,0,0,${shades.shadowOpacity})" stroke-width="12" filter="blur(6px)" />
        <path d="M 385 150 Q 370 350 380 585" fill="none" stroke="rgba(0,0,0,${shades.shadowOpacity})" stroke-width="12" filter="blur(6px)" />
        <path d="M 250 200 Q 300 240 350 200" fill="none" stroke="${shades.highlightStroke}" stroke-width="18" filter="blur(10px)" />
        <path d="M 105 175 L 140 260" fill="none" stroke="${shades.stitchStroke}" stroke-width="1" />
        <path d="M 495 175 L 460 260" fill="none" stroke="${shades.stitchStroke}" stroke-width="1" />
        <line x1="190" y1="580" x2="410" y2="580" stroke="${shades.stitchStroke}" stroke-width="1" stroke-dasharray="4,2" />
        ${collarSvg}
      </g>
    `
  } else if (productId === "hoodie") {
    bodyContent = `
      <ellipse cx="300" cy="640" rx="220" ry="22" fill="#080809" opacity="0.7" filter="blur(8px)" />
      <g id="hoodieBody">
        <path d="M 210 120 C 180 30 420 30 390 120 C 360 85 240 85 210 120 Z" fill="${shades.darkHex}" filter="url(#fleeceTexture)" />
        <path d="M 210 120 L 80 200 L 125 310 L 180 260 L 175 270 L 175 600 L 425 600 L 425 270 L 420 260 L 475 310 L 520 200 L 390 120 Z" 
              fill="url(#fabricGrad)" filter="url(#fleeceTexture)" />
        <rect x="175" y="565" width="250" height="35" fill="${shades.ribHex}" stroke="${shades.stitchStroke}" stroke-width="1.5" />
        <path d="M 210 390 L 390 390 L 405 520 L 195 520 Z" fill="url(#fabricGrad)" filter="url(#fleeceTexture)" stroke="${shades.stitchStroke}" stroke-width="1.5" />
        <line x1="210" y1="390" x2="195" y2="520" stroke="rgba(0,0,0,0.3)" stroke-width="2" />
        <line x1="390" y1="390" x2="405" y2="520" stroke="rgba(0,0,0,0.3)" stroke-width="2" />
      </g>
    `
  } else {
    // canta (Tote bag)
    bodyContent = `
      <ellipse cx="300" cy="620" rx="200" ry="20" fill="#090a0b" opacity="0.6" filter="blur(8px)" />
      <path d="M 230 200 C 230 60 370 60 370 200" fill="none" stroke="${shades.ribHex}" stroke-width="18" stroke-linecap="round" />
      <path d="M 230 200 C 230 60 370 60 370 200" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1" stroke-dasharray="3,3" />
      <path d="M 160 200 L 440 200 L 420 580 L 180 580 Z" fill="url(#fabricGrad)" filter="url(#fabricTexture)" />
      <line x1="160" y1="210" x2="440" y2="210" stroke="rgba(0,0,0,0.15)" stroke-width="2" />
      <line x1="160" y1="214" x2="440" y2="214" stroke="${shades.stitchStroke}" stroke-width="1" stroke-dasharray="4,2" />
    `
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 680" width="100%" height="100%">${defsContent}${bodyContent}${badgeSvg}</svg>`
}
