// Tiny synthesized sound design for the letter opening (no audio files to download).
// Only ever plays after the user taps, so browsers allow it.
let ctx = null
const KEY = 'mirelle:sound'
export const soundOn = () => {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}
export const setSound = (on) => {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
}
const ac = () => {
  if (!soundOn()) return null
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}
function noise(c, dur, { type = 'bandpass', freq = 2000, q = 1, gain = 0.4, attack = 0.002, curve = 'exp' } = {}) {
  const len = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  const g = c.createGain()
  const t = c.currentTime
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(gain, t + attack)
  if (curve === 'exp') g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  else g.gain.linearRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(c.destination)
  src.start()
}
/** wax seal snapping */
export function crack() {
  const c = ac()
  if (!c) return
  noise(c, 0.09, { type: 'highpass', freq: 1800, gain: 0.55 })
  setTimeout(() => noise(c, 0.06, { type: 'bandpass', freq: 900, q: 2, gain: 0.35 }), 40)
}
/** paper sliding / flap opening */
export function rustle(dur = 0.7) {
  const c = ac()
  if (!c) return
  noise(c, dur, { type: 'bandpass', freq: 3200, q: 0.6, gain: 0.12, attack: dur * 0.35, curve: 'lin' })
}
/** soft magical chime */
export function chime() {
  const c = ac()
  if (!c) return
  ;[1318.5, 1760, 2093, 2637].forEach((fr, i) => {
    const o = c.createOscillator()
    const g = c.createGain()
    const t = c.currentTime + i * 0.09
    o.type = 'sine'
    o.frequency.value = fr
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.06, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4)
    o.connect(g).connect(c.destination)
    o.start(t)
    o.stop(t + 1.5)
  })
}
export const buzz = (ms = 18) => {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* ignore */
  }
}
