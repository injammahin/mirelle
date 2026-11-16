// "Living" tilt: phone motion sensor on mobile, mouse position on desktop.
// Returns smooth spring values (degrees) plus glare position, and handles iOS's motion permission.
import { useEffect, useRef, useState } from 'react'
import { useSpring, useTransform } from 'framer-motion'

const MAX = 14 // degrees of tilt the paper follows

export function useTilt(enabled = true) {
  const rx = useSpring(0, { stiffness: 90, damping: 16, mass: 0.6 })
  const ry = useSpring(0, { stiffness: 90, damping: 16, mass: 0.6 })
  const iosPerm = typeof window !== 'undefined' && typeof window.DeviceOrientationEvent?.requestPermission === 'function'
  const [needsPermission, setNeeds] = useState(iosPerm)
  const [sensor, setSensor] = useState(false) // true once real motion data arrives
  const base = useRef(null)

  useEffect(() => {
    if (!enabled) {
      rx.set(0)
      ry.set(0)
      return
    }
    const clamp = (v) => Math.max(-MAX, Math.min(MAX, v))
    const onOri = (e) => {
      if (e.beta == null || e.gamma == null) return
      // relative to how the phone was held when the page opened, so any holding angle feels neutral
      if (!base.current) base.current = { b: e.beta, g: e.gamma }
      // slowly drift the neutral point toward the current hold (no "stuck" tilt after shifting grip)
      base.current.b += (e.beta - base.current.b) * 0.004
      base.current.g += (e.gamma - base.current.g) * 0.004
      rx.set(clamp(-(e.beta - base.current.b) * 0.8))
      ry.set(clamp((e.gamma - base.current.g) * 0.8))
      if (!sensor) setSensor(true)
    }
    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return
      const x = e.clientX / window.innerWidth - 0.5
      const y = e.clientY / window.innerHeight - 0.5
      ry.set(x * MAX * 1.4)
      rx.set(-y * MAX * 1.1)
    }
    window.addEventListener('deviceorientation', onOri)
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('deviceorientation', onOri)
      window.removeEventListener('pointermove', onMove)
    }
  }, [enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  const enable = async () => {
    try {
      const r = await window.DeviceOrientationEvent.requestPermission()
      if (r === 'granted') setNeeds(false)
    } catch {
      setNeeds(false)
    }
  }

  // light: glare moves opposite to the tilt, like a real lamp reflecting on paper
  const gx = useTransform(ry, [-MAX, MAX], [85, 15])
  const gy = useTransform(rx, [-MAX, MAX], [10, 90])
  const glare = useTransform([gx, gy], ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,252,240,0.55), rgba(255,252,240,0.12) 32%, rgba(255,252,240,0) 60%)`)
  const sheen = useTransform(ry, [-MAX, MAX], ['-40%', '140%'])
  // shadow slides away from the light
  const sx = useTransform(ry, [-MAX, MAX], [18, -18])
  const sy = useTransform(rx, [-MAX, MAX], [-10, 26])

  return { rx, ry, glare, sheen, sx, sy, needsPermission, enable, sensor }
}
