import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

document.querySelector('#app').innerHTML = `
<main class="layout">
  <section class="panel camera-panel">
    <div class="panel-header">
      <h1>Fleming Left-Hand Rule Coach</h1>
      <p>Match your left thumb, index, and middle finger to the vector diagram.</p>
    </div>
    <div class="camera-stack">
      <video id="camera" autoplay playsinline muted></video>
      <canvas id="overlay"></canvas>
    </div>
    <div class="controls">
      <button id="startButton" type="button">Start Camera</button>
      <button id="mirrorButton" type="button">Mirror Preview: Off</button>
      <button id="calibrateButton" type="button">Calibrate Pose</button>
      <p id="status" class="status">Waiting to start camera...</p>
    </div>
    <p id="calibrationNote" class="calibration-note">Calibration: default reference frame.</p>
    <p class="perspective-note">Perspective correction: camera view is transformed to your viewpoint before scoring.</p>
    <ul class="legend">
      <li><span class="dot field"></span>Index finger: Magnetic field (B)</li>
      <li><span class="dot current"></span>Middle finger: Current (I)</li>
      <li><span class="dot force"></span>Thumb: Force / motion (F)</li>
    </ul>
  </section>

  <section class="panel vector-panel">
    <div class="panel-header">
      <h2>Reference 3D Orientation</h2>
      <p>Hold your left hand so each finger points the same way as these vectors.</p>
    </div>
    <div id="scene"></div>
    <p class="tip">Blue (B) right, Green (I) up, Red (F) away from you. Drag inside the 3D panel to rotate.</p>
  </section>
</main>
`

const video = document.querySelector('#camera')
const overlay = document.querySelector('#overlay')
const overlayCtx = overlay.getContext('2d')
const statusEl = document.querySelector('#status')
const startButton = document.querySelector('#startButton')
const mirrorButton = document.querySelector('#mirrorButton')
const calibrateButton = document.querySelector('#calibrateButton')
const calibrationNoteEl = document.querySelector('#calibrationNote')
const sceneHost = document.querySelector('#scene')

let handLandmarker = null
let stream = null
let rafId = null
let mirrorPreview = false

const calibrationMatrix = new THREE.Matrix4().identity()
const calibrationInverse = new THREE.Matrix4().identity()
let lastMeasuredVectors = null

const targetVectors = {
  // Fleming left-hand rule: F aligns with I x B.
  thumb: new THREE.Vector3(0, 0, -1),
  index: new THREE.Vector3(1, 0, 0),
  middle: new THREE.Vector3(0, 1, 0),
}

const renderVectors = {
  thumb: new THREE.Vector3(),
  index: new THREE.Vector3(),
  middle: new THREE.Vector3(),
}

const calibratedVectors = {
  thumb: new THREE.Vector3(),
  index: new THREE.Vector3(),
  middle: new THREE.Vector3(),
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
sceneHost.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = null

const camera3d = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
camera3d.position.set(2.6, 2.1, 4.5)
camera3d.lookAt(0, 0, 0)

const controls = new OrbitControls(camera3d, renderer.domElement)
controls.target.set(0, 0, 0)
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.enablePan = false
controls.minDistance = 2.2
controls.maxDistance = 8
controls.update()

const lightA = new THREE.DirectionalLight(0xffffff, 1.1)
lightA.position.set(3, 5, 4)
scene.add(lightA)
scene.add(new THREE.AmbientLight(0xffffff, 0.35))

const grid = new THREE.GridHelper(5, 10, 0xa7b0bf, 0x33445c)
grid.position.y = -1.5
scene.add(grid)

const axis = new THREE.AxesHelper(1.6)
scene.add(axis)

const makeArrow = (dir, color, label) => {
  const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1.35, color, 0.24, 0.15)
  arrow.cone.material.transparent = true
  arrow.cone.material.opacity = 0.95
  arrow.line.material.transparent = true
  arrow.line.material.opacity = 0.95

  const tag = makeTextSprite(label, color)
  tag.position.copy(dir.clone().multiplyScalar(1.55))

  scene.add(arrow)
  scene.add(tag)

  return { arrow, tag }
}

const makeTextSprite = (text, color) => {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'rgba(255, 255, 255, 0.0)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.font = 'bold 44px "Helvetica Neue", Helvetica, sans-serif'
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
  ctx.fillText(text, 20, 72)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(1.2, 0.48, 1)
  return sprite
}


const refArrows = {
  index: makeArrow(targetVectors.index, 0x2d9cdb, 'B'),
  middle: makeArrow(targetVectors.middle, 0x27ae60, 'I'),
  thumb: makeArrow(targetVectors.thumb, 0xeb5757, 'F'),
}

const measuredArrows = {
  index: makeArrow(targetVectors.index, 0x7bd3ff, 'b'),
  middle: makeArrow(targetVectors.middle, 0x8de7b6, 'i'),
  thumb: makeArrow(targetVectors.thumb, 0xff9f9f, 'f'),
}

Object.values(measuredArrows).forEach(({ arrow, tag }) => {
  arrow.line.material.opacity = 0.55
  arrow.cone.material.opacity = 0.55
  tag.material.opacity = 0.7
})

const resizeScene = () => {
  const { clientWidth, clientHeight } = sceneHost
  renderer.setSize(clientWidth, clientHeight)
  camera3d.aspect = clientWidth / clientHeight
  camera3d.updateProjectionMatrix()
}

const updateOverlaySize = () => {
  overlay.width = video.videoWidth
  overlay.height = video.videoHeight
}

window.addEventListener('resize', resizeScene)
resizeScene()

const toSceneVector = (landmarks, mcp, tip) => {
  const from = landmarks[mcp]
  const to = landmarks[tip]
  return new THREE.Vector3(to.x - from.x, -(to.y - from.y), -(to.z - from.z)).normalize()
}

const toUserPerspective = (vector) => {
  // User and front camera face each other: rotate 180 degrees around Y (x,z flip).
  return vector.set(-vector.x, vector.y, -vector.z)
}

const makeHandBasisMatrix = (vectors) => {
  const x = vectors.index.clone().normalize()
  const y = vectors.middle.clone().normalize()
  const z = x.clone().cross(y).normalize()

  if (!Number.isFinite(z.lengthSq()) || z.lengthSq() < 0.001) {
    return null
  }

  const yOrtho = z.clone().cross(x).normalize()
  const basis = new THREE.Matrix4().makeBasis(x, yOrtho, z)
  return basis
}

const applyCalibration = (vectors) => {
  calibratedVectors.thumb.copy(vectors.thumb).applyMatrix4(calibrationMatrix).normalize()
  calibratedVectors.index.copy(vectors.index).applyMatrix4(calibrationMatrix).normalize()
  calibratedVectors.middle.copy(vectors.middle).applyMatrix4(calibrationMatrix).normalize()
  return calibratedVectors
}

const scoreAlignment = (measured, target) => {
  const dot = THREE.MathUtils.clamp(measured.dot(target), -1, 1)
  return {
    dot,
    angleDeg: THREE.MathUtils.radToDeg(Math.acos(dot)),
  }
}

const evaluateHand = (vectors) => {
  const thumbAlign = scoreAlignment(vectors.thumb, targetVectors.thumb)
  const indexAlign = scoreAlignment(vectors.index, targetVectors.index)
  const middleAlign = scoreAlignment(vectors.middle, targetVectors.middle)

  const orthogonality = Math.max(
    Math.abs(vectors.thumb.dot(vectors.index)),
    Math.abs(vectors.thumb.dot(vectors.middle)),
    Math.abs(vectors.index.dot(vectors.middle)),
  )

  const isAligned =
    thumbAlign.angleDeg < 35 &&
    indexAlign.angleDeg < 35 &&
    middleAlign.angleDeg < 35 &&
    orthogonality < 0.42

  const confidence = Math.max(0, (thumbAlign.dot + indexAlign.dot + middleAlign.dot) / 3)

  return {
    isAligned,
    confidence,
    thumbAlign,
    indexAlign,
    middleAlign,
  }
}

const drawLandmarks = (landmarks) => {
  overlayCtx.clearRect(0, 0, overlay.width, overlay.height)

  const fingerTips = [4, 8, 12]
  const fingerMcps = [2, 5, 9]
  const colors = ['#eb5757', '#2d9cdb', '#27ae60']

  landmarks.forEach((point) => {
    const x = point.x * overlay.width
    const y = point.y * overlay.height
    overlayCtx.fillStyle = 'rgba(235, 247, 255, 0.45)'
    overlayCtx.beginPath()
    overlayCtx.arc(x, y, 4, 0, Math.PI * 2)
    overlayCtx.fill()
  })

  fingerTips.forEach((tip, i) => {
    const mcp = fingerMcps[i]
    const start = landmarks[mcp]
    const end = landmarks[tip]
    overlayCtx.strokeStyle = colors[i]
    overlayCtx.lineWidth = 5
    overlayCtx.beginPath()
    overlayCtx.moveTo(start.x * overlay.width, start.y * overlay.height)
    overlayCtx.lineTo(end.x * overlay.width, end.y * overlay.height)
    overlayCtx.stroke()
  })
}

const renderScene = () => {
  controls.update()
  renderer.render(scene, camera3d)
  requestAnimationFrame(renderScene)
}

const updateMeasuredArrows = (vectors) => {
  measuredArrows.thumb.arrow.setDirection(vectors.thumb)
  measuredArrows.index.arrow.setDirection(vectors.index)
  measuredArrows.middle.arrow.setDirection(vectors.middle)

  measuredArrows.thumb.tag.position.copy(vectors.thumb.clone().multiplyScalar(1.55))
  measuredArrows.index.tag.position.copy(vectors.index.clone().multiplyScalar(1.55))
  measuredArrows.middle.tag.position.copy(vectors.middle.clone().multiplyScalar(1.55))
}

const setStatus = (text, state = 'neutral') => {
  statusEl.textContent = text
  statusEl.dataset.state = state
}

const setMirrorPreview = (enabled) => {
  mirrorPreview = enabled
  const transform = enabled ? 'scaleX(-1)' : 'scaleX(1)'
  video.style.transform = transform
  overlay.style.transform = transform
  mirrorButton.textContent = `Mirror Preview: ${enabled ? 'On' : 'Off'}`
}

const calibrateFromCurrentHand = () => {
  if (!lastMeasuredVectors) {
    calibrationNoteEl.textContent = 'Calibration failed: show your left hand first.'
    return
  }

  const basis = makeHandBasisMatrix(lastMeasuredVectors)
  if (!basis) {
    calibrationNoteEl.textContent = 'Calibration failed: spread index and middle finger more clearly.'
    return
  }

  calibrationInverse.copy(basis).invert()
  calibrationMatrix.copy(calibrationInverse)
  calibrationNoteEl.textContent = 'Calibration applied. Keep matching your fingers to the 3D vectors.'
}

const loop = async () => {
  if (!handLandmarker || video.readyState < 2) {
    rafId = requestAnimationFrame(loop)
    return
  }

  const nowMs = performance.now()
  const result = handLandmarker.detectForVideo(video, nowMs)

  overlayCtx.clearRect(0, 0, overlay.width, overlay.height)

  if (!result.landmarks?.length) {
    setStatus('Show your left hand in frame so thumb, index, and middle are visible.', 'neutral')
    rafId = requestAnimationFrame(loop)
    return
  }

  const handIndex = result.handednesses.findIndex(
    (set) => set[0]?.categoryName?.toLowerCase() === 'left',
  )

  if (handIndex === -1) {
    setStatus('Right hand detected. Please use your left hand.', 'warn')
    rafId = requestAnimationFrame(loop)
    return
  }

  const landmarks = result.landmarks[handIndex]
  drawLandmarks(landmarks)

  renderVectors.thumb.copy(toUserPerspective(toSceneVector(landmarks, 2, 4)))
  renderVectors.index.copy(toUserPerspective(toSceneVector(landmarks, 5, 8)))
  renderVectors.middle.copy(toUserPerspective(toSceneVector(landmarks, 9, 12)))

  lastMeasuredVectors = {
    thumb: renderVectors.thumb.clone(),
    index: renderVectors.index.clone(),
    middle: renderVectors.middle.clone(),
  }

  const normalizedVectors = applyCalibration(renderVectors)
  updateMeasuredArrows(normalizedVectors)
  const evaluation = evaluateHand(normalizedVectors)

  if (evaluation.isAligned) {
    setStatus(
      `Correct orientation! Confidence: ${(evaluation.confidence * 100).toFixed(0)}%`,
      'good',
    )
  } else {
    setStatus(
      `Adjust hand: thumb ${evaluation.thumbAlign.angleDeg.toFixed(0)}°, index ${evaluation.indexAlign.angleDeg.toFixed(0)}°, middle ${evaluation.middleAlign.angleDeg.toFixed(0)}° from target.`,
      'warn',
    )
  }

  rafId = requestAnimationFrame(loop)
}

const initMediaPipe = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
  )

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
  })
}

const startCamera = async () => {
  if (stream) {
    return
  }

  startButton.disabled = true
  setStatus('Initializing MediaPipe and requesting camera access...', 'neutral')

  try {
    if (!handLandmarker) {
      await initMediaPipe()
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    })

    video.srcObject = stream
    await video.play()
    updateOverlaySize()

    setStatus('Camera started. Match your hand to the 3D reference vectors.', 'neutral')
    rafId = requestAnimationFrame(loop)
  } catch (error) {
    console.error(error)
    setStatus('Unable to access camera or load MediaPipe model. Check browser permissions.', 'error')
    startButton.disabled = false
  }
}

startButton.addEventListener('click', startCamera)
mirrorButton.addEventListener('click', () => {
  setMirrorPreview(!mirrorPreview)
})
calibrateButton.addEventListener('click', calibrateFromCurrentHand)

setMirrorPreview(false)

renderScene()

window.addEventListener('beforeunload', () => {
  if (rafId) {
    cancelAnimationFrame(rafId)
  }
  stream?.getTracks().forEach((track) => track.stop())
})
