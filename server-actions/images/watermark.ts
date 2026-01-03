import sharp from "sharp"

function escapeSvgText(value: string) {
  return value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case "&":
        return "&amp;"
      case "'":
        return "&apos;"
      case "\"":
        return "&quot;"
      default:
        return char
    }
  })
}

export async function applyWatermark({
  base64,
  mediaType,
  text,
}: {
  base64: string
  mediaType: string
  text: string
}) {
  const imageBuffer = Buffer.from(base64, "base64")
  const image = sharp(imageBuffer)
  const metadata = await image.metadata()

  if (!metadata.width || !metadata.height) {
    return { base64, mediaType }
  }

  const fontSize = Math.max(Math.round(Math.min(metadata.width, metadata.height) * 0.04), 14)
  const padding = Math.round(fontSize * 0.6)
  const safeText = escapeSvgText(text)

  const watermarkSvg = `
    <svg width="${metadata.width}" height="${metadata.height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .mark { fill: rgba(255,255,255,0.7); font-size: ${fontSize}px; font-family: Arial, sans-serif; }
        .shadow { fill: rgba(0,0,0,0.35); font-size: ${fontSize}px; font-family: Arial, sans-serif; }
      </style>
      <text x="${metadata.width - padding}" y="${metadata.height - padding}" text-anchor="end" class="shadow">${safeText}</text>
      <text x="${metadata.width - padding}" y="${metadata.height - padding}" text-anchor="end" class="mark">${safeText}</text>
    </svg>
  `

  const composed = await image
    .composite([{ input: Buffer.from(watermarkSvg), gravity: "southeast" }])
    .toBuffer()

  return {
    base64: composed.toString("base64"),
    mediaType,
  }
}
