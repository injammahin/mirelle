// One-tap Instagram / TikTok Story export (1080×1920).
// The artwork floats in the middle over a soft, blurred, colour-matched backdrop made from itself.
import { mulberry32 } from './random'

const W = 1080
const H = 1920

function grain(ctx, alpha = 0.05) {
  const t = document.createElement('canvas')
  t.width = t.height = 256
  const tc = t.getContext('2d')
  const id = tc.createImageData(256, 256)
  const rng = mulberry32(42)
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 128 + (rng() - 0.5) * 255
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v
    id.data[i + 3] = 255
  }
  tc.putImageData(id, 0, 0)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.globalCompositeOperation = 'overlay'
  ctx.fillStyle = ctx.createPattern(t, 'repeat')
  ctx.fillRect(0, 0, W, H)
  ctx.restore()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** src: canvas of the finished artwork.  opts.tilt (deg), opts.radius (0..1 of short side) */
export function makeStory(src, { tilt = 0, radius = 0.012, fill = 0.84 } = {}) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  ctx.imageSmoothingQuality = 'high'

  // 1. backdrop: the artwork itself, enlarged and deeply blurred (downscale/upscale = smooth blur everywhere)
  const tiny = document.createElement('canvas')
  tiny.width = 36
  tiny.height = 64
  const tc = tiny.getContext('2d')
  tc.imageSmoothingQuality = 'high'
  const k0 = Math.max(tiny.width / src.width, tiny.height / src.height) * 1.25
  tc.drawImage(src, (tiny.width - src.width * k0) / 2, (tiny.height - src.height * k0) / 2, src.width * k0, src.height * k0)
  ctx.drawImage(tiny, -40, -40, W + 80, H + 80)
  ctx.filter = 'blur(28px)'
  ctx.drawImage(c, 0, 0)
  ctx.filter = 'none'
  // soften + gently darken toward the edges so the artwork pops
  ctx.fillStyle = 'rgba(255,248,238,0.16)'
  ctx.fillRect(0, 0, W, H)
  const v = ctx.createRadialGradient(W / 2, H * 0.47, W * 0.25, W / 2, H / 2, H * 0.72)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(20,12,8,0.38)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, W, H)
  grain(ctx, 0.07)

  // 2. artwork, centred inside the Story safe area, with a layered soft shadow
  const maxW = W * fill
  const maxH = H * 0.72
  const k = Math.min(maxW / src.width, maxH / src.height)
  const aw = src.width * k
  const ah = src.height * k
  const r = Math.min(aw, ah) * radius
  ctx.save()
  ctx.translate(W / 2, H * 0.49)
  ctx.rotate((tilt * Math.PI) / 180)
  for (const [blur, y, a] of [
    [90, 50, 0.35],
    [24, 12, 0.3],
  ]) {
    ctx.save()
    ctx.shadowColor = `rgba(25,15,8,${a})`
    ctx.shadowBlur = blur
    ctx.shadowOffsetY = y
    ctx.fillStyle = '#000'
    roundRect(ctx, -aw / 2, -ah / 2, aw, ah, r)
    ctx.fill()
    ctx.restore()
  }
  ctx.save()
  roundRect(ctx, -aw / 2, -ah / 2, aw, ah, r)
  ctx.clip()
  ctx.drawImage(src, -aw / 2, -ah / 2, aw, ah)
  ctx.restore()
  ctx.restore()
  return c
}
