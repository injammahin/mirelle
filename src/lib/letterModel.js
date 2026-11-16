// Builds a real-size 3D letter scene (GLB) in the browser for AR.
// Base pose = opened (what iPhone Quick Look shows); an animation clip plays the opening on Android/web.
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { ENVELOPES } from './share'

const W = 0.22 // envelope 22 × 14 cm
const D = 0.14
const FLAP = D * 0.6
const LIFT = 0.15 // letter floats 15 cm above the table

const tex = (canvas) => {
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h })
const shade = (hex, k) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return `rgb(${c.map((v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)).join(',')})`
}

function grain(ctx, w, h, a) {
  const id = ctx.getImageData(0, 0, w, h)
  for (let i = 0; i < id.data.length; i += 4) {
    const n = (Math.random() - 0.5) * a
    id.data[i] += n
    id.data[i + 1] += n
    id.data[i + 2] += n
  }
  ctx.putImageData(id, 0, 0)
}

function envelopeTexture(col, liner) {
  const c = cv(1024, 652)
  const x = c.getContext('2d')
  const w = c.width
  const h = c.height
  const g = x.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, shade(col, 0.1))
  g.addColorStop(1, shade(col, -0.06))
  x.fillStyle = g
  x.fillRect(0, 0, w, h)
  // inside of the open envelope (liner) shows where the flap was
  x.fillStyle = liner === 'gold' ? shade(col, 0.5) : liner === 'plain' ? shade(col, -0.15) : '#fbf7f0'
  x.beginPath()
  x.moveTo(0, 0)
  x.lineTo(w, 0)
  x.lineTo(w / 2, h * 0.55)
  x.fill()
  if (liner === 'gold') {
    x.fillStyle = '#c9a24a'
    for (let yy = 12; yy < h * 0.55; yy += 22) for (let xx = 12; xx < w; xx += 22) if (yy < h * 0.55 * (1 - Math.abs(xx - w / 2) / (w / 2))) x.fillRect(xx, yy, 3, 3)
  }
  // pockets + fold lines
  x.fillStyle = shade(col, 0.06)
  x.beginPath()
  x.moveTo(0, h)
  x.lineTo(w / 2, h * 0.48)
  x.lineTo(w, h)
  x.fill()
  x.strokeStyle = shade(col, -0.22)
  x.lineWidth = 2
  x.beginPath()
  x.moveTo(0, 0)
  x.lineTo(w / 2, h * 0.52)
  x.lineTo(w, 0)
  x.moveTo(0, h)
  x.lineTo(w / 2, h * 0.48)
  x.lineTo(w, h)
  x.stroke()
  grain(x, w, h, 14)
  return tex(c)
}

function flapTexture(col, gold) {
  const c = cv(512, 300)
  const x = c.getContext('2d')
  const g = x.createLinearGradient(0, 0, 0, c.height)
  g.addColorStop(0, shade(col, 0.08))
  g.addColorStop(1, shade(col, -0.05))
  x.fillStyle = g
  x.fillRect(0, 0, c.width, c.height)
  if (gold) {
    const gg = x.createLinearGradient(0, 0, c.width, 0)
    ;['#a87a2e', '#f6e2a6', '#fff6d8', '#d4ab55', '#8a5e1e'].forEach((s, i) => gg.addColorStop(i / 4, s))
    x.strokeStyle = gg
    x.lineWidth = 10
    x.beginPath()
    x.moveTo(0, 4)
    x.lineTo(c.width / 2, c.height - 4)
    x.lineTo(c.width, 4)
    x.stroke()
  }
  grain(x, c.width, c.height, 12)
  return tex(c)
}

/** letterCanvas: rendered letter · deco: share design · sealImg: wax seal image (HTMLImageElement) */
export async function buildLetterModel({ letterCanvas, deco, sealImg }) {
  const col = (ENVELOPES[deco.envelope] || ENVELOPES.ivory).body
  const scene = new THREE.Scene()
  const root = new THREE.Group()
  root.name = 'mirelle'
  scene.add(root)

  // envelope body (thin card)
  // USDZ (iPhone Quick Look) only accepts one material per mesh, so each textured face is its own plane.
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, 0.004, D), new THREE.MeshStandardMaterial({ color: shade(col, -0.12), roughness: 0.9 }))
  body.position.y = 0.002
  body.name = 'envelope'
  root.add(body)
  const top = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: envelopeTexture(col, deco.liner), roughness: 0.85 }))
  top.rotation.x = -Math.PI / 2
  top.position.y = 0.0041
  top.name = 'envelopeTop'
  root.add(top)

  // flap, hinged on the far edge
  const hinge = new THREE.Group()
  hinge.name = 'flap'
  hinge.position.set(0, 0.0042, -D / 2)
  const fg = new THREE.BufferGeometry()
  fg.setAttribute('position', new THREE.Float32BufferAttribute([-W / 2, 0, 0, W / 2, 0, 0, 0, 0, FLAP], 3))
  fg.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0.5, 0], 2))
  fg.setIndex([0, 2, 1])
  fg.computeVertexNormals()
  // two single-sided faces (USDZ has no double-sided materials): outside paper, and the liner seen once it opens
  hinge.add(new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: flapTexture(col, deco.flap === 'scallop'), roughness: 0.85 })))
  const fgBack = fg.clone()
  fgBack.setIndex([0, 1, 2])
  fgBack.computeVertexNormals()
  const linerCol = deco.liner === 'gold' ? shade(col, 0.5) : deco.liner === 'plain' ? shade(col, -0.15) : '#fbf7f0'
  const back = new THREE.Mesh(fgBack, new THREE.MeshStandardMaterial({ color: linerCol, roughness: 0.9 }))
  back.position.y = -0.0003
  hinge.add(back)
  const OPEN = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(-168))
  const CLOSED = new THREE.Quaternion()
  hinge.quaternion.copy(OPEN)
  root.add(hinge)

  // seal poses: sealed = on the flap tip; opened = tumbled onto the table beside the envelope
  const SEAL_ON = new THREE.Vector3(0, 0.0085, -D / 2 + FLAP - 0.004)
  const SEAL_END = new THREE.Vector3(W / 2 + 0.035, 0.003, D / 2 - 0.01)
  if (sealImg) {
    const sc = cv(512, 512)
    sc.getContext('2d').drawImage(sealImg, 0, 0, 512, 512)
    const seal = new THREE.Group()
    seal.name = 'seal'
    seal.position.copy(SEAL_END)
    seal.rotation.y = -0.4
    seal.add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.006, 48), new THREE.MeshStandardMaterial({ color: '#7a1a26', roughness: 0.4 })))
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.024, 48), new THREE.MeshStandardMaterial({ map: tex(sc), roughness: 0.35, metalness: 0.05, transparent: true, alphaTest: 0.3 }))
    face.rotation.x = -Math.PI / 2
    face.position.y = 0.0031
    seal.add(face)
    root.add(seal)
  }

  // the letter: thin paper floating above, leaning gently toward the viewer
  const lw = 0.16
  const lh = (lw * letterCanvas.height) / letterCanvas.width
  const letter = new THREE.Group()
  letter.name = 'letter'
  letter.add(new THREE.Mesh(new THREE.BoxGeometry(lw, lh, 0.0008), new THREE.MeshStandardMaterial({ color: '#f7f2e8', roughness: 0.9 })))
  const page = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), new THREE.MeshStandardMaterial({ map: tex(letterCanvas), roughness: 0.82 }))
  page.position.z = 0.00041
  letter.add(page)
  const FINAL = new THREE.Vector3(0, LIFT + lh / 2 - 0.04, 0.0)
  const START = new THREE.Vector3(0, 0.03, 0.01)
  letter.position.copy(FINAL)
  letter.rotation.x = -0.18
  root.add(letter)

  // opening animation (Android / 3D preview); base pose stays "opened" for iPhone
  const v = (q) => [q.x, q.y, q.z, q.w]
  const P = (a) => a.toArray()
  const SEAL_UP = new THREE.Vector3(W / 4, 0.07, 0)
  const tracks = [
    new THREE.QuaternionKeyframeTrack('flap.quaternion', [0, 0.7, 1.6], [...v(CLOSED), ...v(CLOSED), ...v(OPEN)]),
    new THREE.VectorKeyframeTrack('letter.position', [0, 1.8, 3.4, 4.2], [...P(START), ...P(START), ...P(FINAL), ...P(FINAL)]),
    new THREE.VectorKeyframeTrack('letter.scale', [0, 1.8, 3.4], [0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 1, 1, 1]),
  ]
  if (sealImg) {
    const spin = (deg) => new THREE.Quaternion().setFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(deg), -0.4, THREE.MathUtils.degToRad(deg * 0.6)))
    tracks.push(
      new THREE.VectorKeyframeTrack('seal.position', [0, 0.1, 0.4, 0.75, 4.2], [...P(SEAL_ON), ...P(SEAL_ON), ...P(SEAL_UP), ...P(SEAL_END), ...P(SEAL_END)]),
      new THREE.QuaternionKeyframeTrack('seal.quaternion', [0, 0.1, 0.4, 0.75], [...v(spin(0)), ...v(spin(0)), ...v(spin(200)), ...v(spin(360))]),
    )
  }
  const clip = new THREE.AnimationClip('open', 4.2, tracks)

  const exporter = new GLTFExporter()
  const glb = await exporter.parseAsync(scene, { binary: true, animations: [clip], maxTextureSize: 2048 })
  return URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' }))
}
