import * as THREE from 'https://esm.sh/three@0.164.1';
import { OrbitControls } from 'https://esm.sh/three@0.164.1/examples/jsm/controls/OrbitControls.js';
import katex from 'https://esm.sh/katex@0.16.10';
// --- Simulation State ---
let f = 30;         // Focal Length (cm)
let doVal = 60;     // Object Distance (cm)
let ho = 15;        // Object Height (cm)
let ds = 60;        // Screen Distance (cm)
let screenMode = 'auto'; // 'auto' or 'manual'
let objectType = 'slide'; // 'candle' or 'slide'
let showRays = true;
let showLabels = true;
let autoRotate = false;
let currentOptics = null;
// --- Three.js Globals ---
let scene, camera, renderer, controls, container;
// Group nodes for dynamic translation/updates
let axisGroup;
let benchGroup;
let lensGroup;
let candleGroup;
let objectOutlineGroup;
let screenGroup;
let virtualCandleGroup;
let raysGroup;
let labelsGroup;
let focalPointsGroup;
// Dynamic materials and lights
let flamePointLight;
let screenTexture, screenCanvas;
let lensMesh;
// Raycasting / Dragging State
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Raycast to Z=0 plane
const intersectionPoint = new THREE.Vector3();
let isDraggingCandle = false;
let isDraggingScreen = false;
const activePointers = new Set();
let dragPointerId = null;
// Presets data mapping
const presets = {
  diminished: { f: 30, do: 75, ho: 15, mode: 'auto' },
  samesize:   { f: 30, do: 60, ho: 15, mode: 'auto' },
  magnified:  { f: 30, do: 45, ho: 15, mode: 'auto' },
  infinity:   { f: 30, do: 30, ho: 15, mode: 'auto' },
  virtual:    { f: 30, do: 15, ho: 15, mode: 'auto' }
};
// --- Initialization ---
function init() {
  container = document.getElementById('canvas-container');
  
  // 1. Scene Setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.FogExp2(0xffffff, 0.002);
  // 2. Camera Setup
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(-90, 45, 110);
  // 3. Renderer Setup (Enable stencil buffer explicitly for virtual image portal effect)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, stencil: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  // 4. Orbit Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minPolarAngle = 0.05;
  controls.maxPolarAngle = Math.PI - 0.05;
  controls.minDistance = 30;
  controls.maxDistance = 300;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };
  controls.target.set(0, 0, 0);
  // 5. Lighting Setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambientLight);
  // Main directional light casting soft shadows
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(40, 80, 50);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 250;
  const d = 100;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);
  // Subtle blue fill light from the opposite direction
  const fillLight = new THREE.DirectionalLight(0x3b82f6, 0.4);
  fillLight.position.set(-60, 20, -50);
  scene.add(fillLight);
  // 6. Offscreen Canvas for Screen Projection
  screenCanvas = document.createElement('canvas');
  screenCanvas.width = 512;
  screenCanvas.height = 512;
  screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.generateMipmaps = false;
  screenTexture.minFilter = THREE.LinearFilter;
  screenTexture.magFilter = THREE.LinearFilter;
  screenTexture.anisotropy = 1;
  // 7. Instantiate Groups
  axisGroup = new THREE.Group();
  benchGroup = new THREE.Group();
  lensGroup = new THREE.Group();
  candleGroup = new THREE.Group();
  objectOutlineGroup = new THREE.Group();
  screenGroup = new THREE.Group();
  virtualCandleGroup = new THREE.Group();
  raysGroup = new THREE.Group();
  labelsGroup = new THREE.Group();
  focalPointsGroup = new THREE.Group();
  scene.add(axisGroup);
  scene.add(benchGroup);
  scene.add(lensGroup);
  scene.add(candleGroup);
  scene.add(objectOutlineGroup);
  scene.add(screenGroup);
  scene.add(virtualCandleGroup);
  scene.add(raysGroup);
  scene.add(labelsGroup);
  scene.add(focalPointsGroup);
  // 8. Build Static Scene Elements
  buildPrincipalAxis();
  buildBench();
  buildLens();
  buildCandle();
  buildObjectOutline();
  buildScreen();
  buildVirtualCandle();
  // 9. Attach Event Listeners
  setupUIEventListeners();
  setup3DInteractionListeners();
  window.addEventListener('resize', onWindowResize);
  // 10. Initial Run
  updateSimulation();
  animate(0);
}
// --- Procedural 3D Model Building ---
// A helper to create text labels as flat canvas sprites with wide padding
function createTextSprite(text, color = '#94a3b8') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.font = 'bold 48px Outfit, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  // Maintain 4:1 aspect ratio (width: 22, height: 5.5)
  sprite.scale.set(22, 5.5, 1);
  return sprite;
}

function createSlideLetterMesh(color = '#1d4ed8', dotted = false) {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = 512;
  sourceCanvas.height = 768;
  const sourceCtx = sourceCanvas.getContext('2d');
  sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
  sourceCtx.font = 'bold 520px Outfit, Arial, sans-serif';
  sourceCtx.textAlign = 'center';
  sourceCtx.textBaseline = 'alphabetic';

  const metrics = sourceCtx.measureText('F');
  const ascent = metrics.actualBoundingBoxAscent || 390;
  const descent = metrics.actualBoundingBoxDescent || 0;
  const left = metrics.actualBoundingBoxLeft || metrics.width / 2;
  const right = metrics.actualBoundingBoxRight || metrics.width / 2;
  const baselineX = sourceCanvas.width / 2;
  const baselineY = sourceCanvas.height / 2 + ascent / 2;
  if (dotted) {
    sourceCtx.strokeStyle = color;
    sourceCtx.lineWidth = 30;
    sourceCtx.lineJoin = 'round';
    sourceCtx.setLineDash([18, 16]);
    sourceCtx.strokeText('F', baselineX, baselineY);
  } else {
    sourceCtx.fillStyle = color;
    sourceCtx.fillText('F', baselineX, baselineY);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const marginX = 10;
  const marginY = 0;
  const sourceX = baselineX - left;
  const sourceY = baselineY - ascent;
  const sourceW = left + right;
  const sourceH = ascent + descent;
  ctx.drawImage(
    sourceCanvas,
    sourceX,
    sourceY,
    sourceW,
    sourceH,
    marginX,
    marginY,
    canvas.width - marginX * 2,
    canvas.height - marginY * 2
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: dotted ? 0.75 : 1,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.rotation.y = Math.PI / 2;
  mesh.position.x = 0.42;
  return mesh;
}

function createSlideSurfaceTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(248, 250, 252, 0.94)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function applyLensStencil(material) {
  material.stencilWrite = true;
  material.stencilRef = 1;
  material.stencilFunc = THREE.EqualStencilFunc;
  material.stencilFail = THREE.KeepStencilOp;
  material.stencilZFail = THREE.KeepStencilOp;
  material.stencilZPass = THREE.KeepStencilOp;
  return material;
}

function createDashedOutline(geometry, color) {
  const material = applyLensStencil(new THREE.LineDashedMaterial({
    color,
    transparent: true,
    opacity: 0.75,
    dashSize: 0.9,
    gapSize: 0.55,
    depthTest: true
  }));
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 16), material);
  outline.computeLineDistances();
  outline.renderOrder = 2;
  return outline;
}

function buildPrincipalAxis() {
  const axisGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-125, 0, 0),
    new THREE.Vector3(155, 0, 0)
  ]);
  const axisMat = new THREE.LineDashedMaterial({
    color: 0x334155,
    transparent: true,
    opacity: 0.55,
    dashSize: 2.2,
    gapSize: 1.6
  });
  const axis = new THREE.Line(axisGeom, axisMat);
  axis.computeLineDistances();
  axisGroup.add(axis);

  const labelSprite = createTextSprite('Principal Axis', '#334155');
  labelSprite.scale.set(18, 4.5, 1);
  labelSprite.position.set(112, 4, 0);
  axisGroup.add(labelSprite);
}

function buildBench() {
  const tableGeom = new THREE.BoxGeometry(150, 2, 72);
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.7,
    metalness: 0.05
  });
  const table = new THREE.Mesh(tableGeom, tableMat);
  table.position.set(-72, -26, 0);
  table.receiveShadow = true;
  benchGroup.add(table);

  const grid = new THREE.GridHelper(150, 15, 0x94a3b8, 0xe2e8f0);
  grid.position.set(-72, -24.9, 0);
  benchGroup.add(grid);

  const rodGeom = new THREE.CylinderGeometry(0.55, 0.55, 145);
  rodGeom.rotateZ(Math.PI / 2);
  const rodMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.8,
    roughness: 0.2
  });
  const rod = new THREE.Mesh(rodGeom, rodMat);
  rod.position.set(-72, -23.5, 0);
  rod.castShadow = true;
  benchGroup.add(rod);
}

function setMaterialLensExclusion(material, shouldExcludeLens) {
  if (!material.userData.objectLensDefaults) {
    material.userData.objectLensDefaults = {
      transparent: material.transparent,
      opacity: material.opacity
    };
  }
  const defaults = material.userData.objectLensDefaults;
  material.stencilWrite = shouldExcludeLens;
  material.stencilRef = 1;
  material.stencilFunc = shouldExcludeLens ? THREE.NotEqualStencilFunc : THREE.AlwaysStencilFunc;
  material.stencilFail = THREE.KeepStencilOp;
  material.stencilZFail = THREE.KeepStencilOp;
  material.stencilZPass = THREE.KeepStencilOp;
  material.transparent = shouldExcludeLens ? true : defaults.transparent;
  material.opacity = defaults.opacity;
  material.needsUpdate = true;
}

function configureObjectLensVisibility(shouldShowOutlineOnlyThroughLens) {
  candleGroup.traverse((child) => {
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => setMaterialLensExclusion(material, shouldShowOutlineOnlyThroughLens));
    child.renderOrder = shouldShowOutlineOnlyThroughLens ? 3 : 0;
  });
  objectOutlineGroup.visible = shouldShowOutlineOnlyThroughLens;
}

function isObjectBetweenCameraAndLens() {
  const lensCenter = new THREE.Vector3(0, 0, 0);
  const objectCenter = new THREE.Vector3(-doVal, objectType === 'slide' ? 0 : getObjectRayHeight() / 2, 0);
  const cameraToLens = lensCenter.clone().sub(camera.position);
  const lensDistance = cameraToLens.length();
  if (lensDistance < 0.01) return false;

  const viewDir = cameraToLens.normalize();
  const cameraToObject = objectCenter.clone().sub(camera.position);
  const objectProjection = cameraToObject.dot(viewDir);
  if (objectProjection <= 0 || objectProjection >= lensDistance) return false;

  const closestPoint = camera.position.clone().addScaledVector(viewDir, objectProjection);
  const objectViewOffset = closestPoint.distanceTo(objectCenter);
  return objectViewOffset < 22;
}

function updateViewDependentVisibility(optics) {
  if (!optics) return;
  const lookingThroughLens = !isObjectBetweenCameraAndLens();
  const showObjectOutlineThroughLens = lookingThroughLens && !optics.isInfinity && (optics.isVirtual || doVal > f);
  configureObjectLensVisibility(showObjectOutlineThroughLens);
  if (optics.isVirtual && !optics.isInfinity) {
    virtualCandleGroup.visible = lookingThroughLens;
  } else {
    virtualCandleGroup.visible = false;
  }
}

function isMagnifiedRealImage(optics) {
  return optics.isReal && !optics.isInfinity && doVal < 2 * f;
}

function getSlideLetterTopHeight() {
  return ho * 0.34;
}

function getObjectRayHeight() {
  return objectType === 'slide' ? getSlideLetterTopHeight() : ho;
}

function getScreenLayout(optics) {
  if (!isMagnifiedRealImage(optics)) {
    const boardHeight = 56;
    return {
      scale: boardHeight / 30,
      centerY: 0,
      boardHeight,
      pixelsPerCm: screenCanvas.height / boardHeight
    };
  }

  const imageHeight = Math.abs(optics.hi);
  const boardHeight = Math.min(Math.max(imageHeight * 1.8 + 24, 72), 130);
  const scale = boardHeight / 30;
  const centerY = optics.hi < 0
    ? boardHeight / 2 + optics.hi - 4
    : optics.hi - boardHeight / 2 + 4;
  const pixelsPerCm = screenCanvas.height / boardHeight;

  return { scale, centerY, boardHeight, pixelsPerCm };
}

function buildLens() {
  // 1. Lens glass double convex shape (a sphere squashed flat along the X axis)
  const sphereGeom = new THREE.SphereGeometry(22, 36, 36);
  sphereGeom.scale(0.12, 1, 1); // squash along X axis to form lens profile
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    transmission: 0.95,      // Highly transmissive glass
    opacity: 0.6,
    transparent: true,
    roughness: 0.05,
    metalness: 0.05,
    ior: 1.52,               // Glass index of refraction
    thickness: 3.5,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const lensStencilMat = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    stencilWrite: true,
    stencilRef: 1,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.ReplaceStencilOp
  });
  const lensStencil = new THREE.Mesh(sphereGeom.clone(), lensStencilMat);
  lensStencil.renderOrder = -10;
  lensGroup.add(lensStencil);

  lensMesh = new THREE.Mesh(sphereGeom, lensMat);
  lensMesh.position.y = 0;
  lensMesh.renderOrder = 1;
  lensGroup.add(lensMesh);
  // 2. Lens holder frame (metallic ring)
  const ringGeom = new THREE.TorusGeometry(22, 0.7, 16, 100);
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.2 });
  const ring = new THREE.Mesh(ringGeom, metalMat);
  ring.rotateY(Math.PI / 2);
  ring.castShadow = true;
  lensGroup.add(ring);
  // 3. Holder post below the lens
  const postGeom = new THREE.CylinderGeometry(0.5, 0.5, 4);
  const post = new THREE.Mesh(postGeom, metalMat);
  post.position.set(0, -23.0, 0);
  post.castShadow = true;
  lensGroup.add(post);
  // 4. Base stand slider
  const baseGeom = new THREE.BoxGeometry(4, 1.5, 6);
  const base = new THREE.Mesh(baseGeom, metalMat);
  base.position.set(0, -24.2, 0);
  base.castShadow = true;
  lensGroup.add(base);
  // Lens Center Point Indicator label (Royal Blue for contrast)
  const labelSprite = createTextSprite('Lens (O)', '#1d4ed8');
  labelSprite.position.set(0, 26, 0);
  lensGroup.add(labelSprite);
}
function buildCandle() {
  // 1. Metallic sliding base
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    emissive: 0x111827,
    emissiveIntensity: 0.18,
    metalness: 0.65,
    roughness: 0.26
  });
  const baseGeom = new THREE.BoxGeometry(5, 1.5, 7);
  const base = new THREE.Mesh(baseGeom, metalMat);
  base.name = 'base';
  base.position.y = -24.2;
  base.castShadow = true;
  candleGroup.add(base);
  // 2. Heavy stand vertical post (height will adjust)
  const postGeom = new THREE.CylinderGeometry(0.4, 0.4, 1); // will scale Y dynamically
  const post = new THREE.Mesh(postGeom, metalMat);
  post.name = 'post';
  post.castShadow = true;
  candleGroup.add(post);
  // 3. Candle Wax Body (Cylinder)
  const waxGeom = new THREE.CylinderGeometry(1.5, 1.5, 1); // height scale dynamic
  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xff5555,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.24,
    roughness: 0.48,
    bumpScale: 0.05
  });
  const wax = new THREE.Mesh(waxGeom, waxMat);
  wax.name = 'wax';
  wax.castShadow = true;
  candleGroup.add(wax);
  // 4. Metallic wick
  const wickGeom = new THREE.CylinderGeometry(0.1, 0.1, 1);
  const wickMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    emissive: 0x111827,
    emissiveIntensity: 0.12,
    roughness: 0.72
  });
  const wick = new THREE.Mesh(wickGeom, wickMat);
  wick.name = 'wick';
  wick.castShadow = true;
  candleGroup.add(wick);
  // 5. Glowing Candle Flame
  // Squashed sphere to look like a teardrop
  const flameGeom = new THREE.SphereGeometry(1.2, 16, 16);
  flameGeom.scale(0.8, 1.8, 0.8);
  flameGeom.translate(0, 0.8, 0); // pivot at bottom
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xffb020,
    transparent: true,
    opacity: 1
  });
  const flame = new THREE.Mesh(flameGeom, flameMat);
  flame.name = 'flame';
  candleGroup.add(flame);
  // 6. Point Light centered inside the flame
  flamePointLight = new THREE.PointLight(0xffaa33, 3.3, 135, 1.0);
  flamePointLight.castShadow = true;
  flamePointLight.shadow.bias = -0.005;
  flamePointLight.shadow.mapSize.width = 512;
  flamePointLight.shadow.mapSize.height = 512;
  candleGroup.add(flamePointLight);
  // Object Label (Dark red for contrast)
  const labelSprite = createTextSprite('Object (Candle)', '#b91c1c');
  labelSprite.name = 'label';
  labelSprite.userData.text = 'Object (Candle)';
  candleGroup.add(labelSprite);

  const slideMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createSlideSurfaceTexture(),
    emissive: 0xffffff,
    emissiveIntensity: 0.08,
    roughness: 0.24,
    metalness: 0.02,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide
  });
  const slidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1, 14), slideMat);
  slidePanel.name = 'slidePanel';
  slidePanel.castShadow = true;
  candleGroup.add(slidePanel);

  const slideBorderMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const slideTop = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.35, 15), slideBorderMat);
  slideTop.name = 'slideTop';
  candleGroup.add(slideTop);
  const slideBottom = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.35, 15), slideBorderMat);
  slideBottom.name = 'slideBottom';
  candleGroup.add(slideBottom);
  const slideLeft = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1, 0.35), slideBorderMat);
  slideLeft.name = 'slideLeft';
  candleGroup.add(slideLeft);
  const slideRight = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1, 0.35), slideBorderMat);
  slideRight.name = 'slideRight';
  candleGroup.add(slideRight);

  const slideLetter = createSlideLetterMesh('#1d4ed8');
  slideLetter.name = 'slideLetter';
  slideLetter.scale.set(7, 14, 1);
  candleGroup.add(slideLetter);
}

function buildObjectOutline() {
  const baseGeom = new THREE.BoxGeometry(5, 1.5, 7);
  const base = createDashedOutline(baseGeom, 0xb91c1c);
  base.name = 'base';
  base.position.y = -24.2;
  objectOutlineGroup.add(base);

  const postGeom = new THREE.CylinderGeometry(0.4, 0.4, 1);
  const post = createDashedOutline(postGeom, 0xb91c1c);
  post.name = 'post';
  objectOutlineGroup.add(post);

  const waxGeom = new THREE.CylinderGeometry(1.5, 1.5, 1);
  const wax = createDashedOutline(waxGeom, 0xb91c1c);
  wax.name = 'wax';
  objectOutlineGroup.add(wax);

  const wickGeom = new THREE.CylinderGeometry(0.1, 0.1, 1);
  const wick = createDashedOutline(wickGeom, 0xb91c1c);
  wick.name = 'wick';
  objectOutlineGroup.add(wick);

  const flameGeom = new THREE.SphereGeometry(1.2, 16, 16);
  flameGeom.scale(0.8, 1.8, 0.8);
  flameGeom.translate(0, 0.8, 0);
  const flame = createDashedOutline(flameGeom, 0xf97316);
  flame.name = 'flame';
  objectOutlineGroup.add(flame);

  const slidePanel = createDashedOutline(new THREE.BoxGeometry(0.7, 1, 14), 0x2563eb);
  slidePanel.name = 'slidePanel';
  objectOutlineGroup.add(slidePanel);
  const slideLetter = createSlideLetterMesh('#2563eb', true);
  slideLetter.name = 'slideLetter';
  slideLetter.scale.set(7, 14, 1);
  applyLensStencil(slideLetter.material);
  objectOutlineGroup.add(slideLetter);

  objectOutlineGroup.visible = false;
}

function buildScreen() {
  // 1. Invisible base anchor. The screen floats freely, so no stand is needed.
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xdde2eb, metalness: 0.85, roughness: 0.2 });
  const baseGeom = new THREE.BoxGeometry(5, 1.5, 7);
  const base = new THREE.Mesh(baseGeom, metalMat);
  base.name = 'base';
  base.visible = false;
  base.position.y = -24.2;
  base.castShadow = true;
  screenGroup.add(base);
  // 2. Vertical stand post
  const postGeom = new THREE.CylinderGeometry(0.4, 0.4, 8);
  const post = new THREE.Mesh(postGeom, metalMat);
  post.name = 'post';
  post.visible = false;
  post.position.y = -19.5;
  post.castShadow = true;
  screenGroup.add(post);
  // 3. Screen frame (white outer bezel to represent a clean white screen setup)
  const frameGeom = new THREE.BoxGeometry(1.2, 32, 32);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });
  const frame = new THREE.Mesh(frameGeom, frameMat);
  frame.name = 'frame';
  frame.position.y = 0;
  frame.castShadow = true;
  screenGroup.add(frame);
  // 4. White projector board face (Plane is rotated so it faces the lens at X=0)
  const boardGeom = new THREE.PlaneGeometry(30, 30);
  const boardMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.38,
    map: screenTexture,
    roughness: 0.82,
    metalness: 0.02,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    side: THREE.DoubleSide
  });
  const board = new THREE.Mesh(boardGeom, boardMat);
  board.name = 'board';
  board.position.set(-0.9, 0, 0); // Offset towards the lens to avoid frame z-fighting
  board.rotation.y = -Math.PI / 2; // Rotate -90 degrees on Y to face the lens
  board.renderOrder = 3;
  board.receiveShadow = true;
  screenGroup.add(board);
  // Screen Label (Dark slate for contrast)
  const labelSprite = createTextSprite('Screen', '#0f172a');
  labelSprite.name = 'label';
  screenGroup.add(labelSprite);
}
function buildVirtualCandle() {
  // Virtual image, visible only through the lens stencil.
  const virtualMetalMat = applyLensStencil(new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.3
  }));
  const virtualWaxMat = applyLensStencil(new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.6
  }));
  const virtualWickMat = applyLensStencil(new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.9
  }));
  const virtualFlameMat = applyLensStencil(new THREE.MeshBasicMaterial({
    color: 0xffa500,
    transparent: true,
    opacity: 0.95
  }));
  [virtualMetalMat, virtualWaxMat, virtualWickMat, virtualFlameMat].forEach((material) => {
    material.depthTest = true;
    material.depthWrite = true;
  });
  const baseGeom = new THREE.BoxGeometry(5, 1.5, 7);
  const base = new THREE.Mesh(baseGeom, virtualMetalMat);
  base.name = 'base';
  base.position.y = -24.2;
  base.renderOrder = 0;
  virtualCandleGroup.add(base);

  const postGeom = new THREE.CylinderGeometry(0.4, 0.4, 1);
  const post = new THREE.Mesh(postGeom, virtualMetalMat);
  post.name = 'post';
  post.renderOrder = 0;
  virtualCandleGroup.add(post);

  const waxGeom = new THREE.CylinderGeometry(1.5, 1.5, 1);
  const wax = new THREE.Mesh(waxGeom, virtualWaxMat);
  wax.name = 'wax';
  wax.renderOrder = 0;
  virtualCandleGroup.add(wax);

  const wickGeom = new THREE.CylinderGeometry(0.1, 0.1, 1);
  const wick = new THREE.Mesh(wickGeom, virtualWickMat);
  wick.name = 'wick';
  wick.renderOrder = 0;
  virtualCandleGroup.add(wick);

  const flameGeom = new THREE.SphereGeometry(1.2, 16, 16);
  flameGeom.scale(0.8, 1.8, 0.8);
  flameGeom.translate(0, 0.8, 0);
  const flame = new THREE.Mesh(flameGeom, virtualFlameMat);
  flame.name = 'flame';
  flame.renderOrder = 0;
  virtualCandleGroup.add(flame);

  const slideMat = applyLensStencil(new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    map: createSlideSurfaceTexture(),
    roughness: 0.35,
    metalness: 0.02,
    side: THREE.DoubleSide
  }));
  const slidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1, 14), slideMat);
  slidePanel.name = 'slidePanel';
  slidePanel.renderOrder = 0;
  virtualCandleGroup.add(slidePanel);

  const slideLetter = createSlideLetterMesh('#1d4ed8');
  slideLetter.name = 'slideLetter';
  applyLensStencil(slideLetter.material);
  slideLetter.material.depthTest = true;
  slideLetter.material.depthWrite = true;
  slideLetter.renderOrder = 0;
  virtualCandleGroup.add(slideLetter);

  // Virtual image label (Dark purple for contrast)
  const labelSprite = createTextSprite('Virtual Image', '#6b21a8');
  labelSprite.name = 'label';
  // Sprite stencil properties so it is also masked by the lens viewport
  applyLensStencil(labelSprite.material);
  labelSprite.renderOrder = 2;
  virtualCandleGroup.add(labelSprite);
}
// --- Physics Calculations & UI Sync ---
function calculateOptics() {
  let di, m, hi;
  let isReal = false;
  let isVirtual = false;
  let isInfinity = false;
  // Prevent divide by zero when doVal == f
  if (Math.abs(doVal - f) < 0.1) {
    di = 10000; // Infinity approximation
    m = -Infinity;
    hi = -Infinity;
    isInfinity = true;
  } else {
    // 1/f = 1/do + 1/di => di = (f * do) / (do - f)
    di = (f * doVal) / (doVal - f);
    m = -di / doVal;
    hi = m * getObjectRayHeight();
    
    if (di > 0) {
      isReal = true;
    } else {
      isVirtual = true;
      di = Math.abs(di); // positive distance for visualization
    }
  }
  return { di, m, hi, isReal, isVirtual, isInfinity };
}
function updateSimulation() {
  const optics = calculateOptics();
  currentOptics = optics;
  // 1. Sync screen distance state if auto-focus is active
  if (screenMode === 'auto') {
    if (optics.isReal && !optics.isInfinity) {
      ds = optics.di;
    } else {
      ds = 100; // default screen place if no real image
    }
    // Update the slider to match
    document.getElementById('ds-slider').value = Math.round(ds);
    document.getElementById('ds-val').innerText = Math.round(ds);
  }
  // 2. Position the Candle Mesh Group
  // Candle lies on the left side (negative X coordinates)
  candleGroup.position.x = -doVal;
  objectOutlineGroup.position.x = -doVal;
  updateViewDependentVisibility(optics);
  
  // Re-scale object parts based on ho (Object Height)
  const waxHeight = ho - 4; // Wax occupies most of ho
  const objectRayHeight = getObjectRayHeight();
  const waxMesh = candleGroup.getObjectByName('wax');
  const baseMesh = candleGroup.getObjectByName('base');
  const postMesh = candleGroup.getObjectByName('post');
  const wickMesh = candleGroup.getObjectByName('wick');
  const flameMesh = candleGroup.getObjectByName('flame');
  const labelSprite = candleGroup.getObjectByName('label');
  const slidePanel = candleGroup.getObjectByName('slidePanel');
  const slideTop = candleGroup.getObjectByName('slideTop');
  const slideBottom = candleGroup.getObjectByName('slideBottom');
  const slideLeft = candleGroup.getObjectByName('slideLeft');
  const slideRight = candleGroup.getObjectByName('slideRight');
  const slideLetter = candleGroup.getObjectByName('slideLetter');
  const candleVisible = objectType === 'candle';
  const slideVisible = objectType === 'slide';
  [baseMesh, waxMesh, postMesh, wickMesh, flameMesh].forEach((mesh) => {
    mesh.visible = candleVisible;
  });
  flamePointLight.visible = candleVisible;
  [slidePanel, slideTop, slideBottom, slideLeft, slideRight, slideLetter].forEach((mesh) => {
    mesh.visible = slideVisible;
  });

  // Wax scale & position
  waxMesh.scale.set(1, waxHeight, 1);
  waxMesh.position.y = waxHeight / 2; // Bottom starts at Y=0
  // Post scale & position (holds candle up to Y=0)
  postMesh.scale.set(1, 23.5, 1);
  postMesh.position.y = -11.75;
  // Wick position
  wickMesh.position.set(0, waxHeight + 0.5, 0);
  // Flame position (exactly at ho)
  flameMesh.position.set(0, waxHeight + 1.0, 0);
  flamePointLight.position.set(0, waxHeight + 1.5, 0);
  // Label position
  const labelText = objectType === 'slide' ? 'Object (Slide)' : 'Object (Candle)';
  if (labelSprite.userData.text !== labelText) {
    labelSprite.material.map.dispose();
    labelSprite.material.dispose();
    candleGroup.remove(labelSprite);
    const replacementLabel = createTextSprite(labelText, '#b91c1c');
    replacementLabel.name = 'label';
    replacementLabel.userData.text = labelText;
    replacementLabel.position.set(0, objectRayHeight + 5, 0);
    candleGroup.add(replacementLabel);
  } else {
    labelSprite.position.set(0, objectRayHeight + 5, 0);
  }
  updateViewDependentVisibility(optics);

  slidePanel.scale.set(1, ho, 1);
  slidePanel.position.y = 0;
  slideTop.position.set(0, ho / 2, 0);
  slideBottom.position.set(0, -ho / 2, 0);
  slideLeft.scale.set(1, ho, 1);
  slideLeft.position.set(0, 0, -7);
  slideRight.scale.set(1, ho, 1);
  slideRight.position.set(0, 0, 7);
  slideLetter.scale.set(Math.max(ho * 0.34, 4), Math.max(getSlideLetterTopHeight() * 2, 8), 1);
  slideLetter.position.set(0.42, 0, 0);

  const outlineWaxMesh = objectOutlineGroup.getObjectByName('wax');
  const outlineBaseMesh = objectOutlineGroup.getObjectByName('base');
  const outlinePostMesh = objectOutlineGroup.getObjectByName('post');
  const outlineWickMesh = objectOutlineGroup.getObjectByName('wick');
  const outlineFlameMesh = objectOutlineGroup.getObjectByName('flame');
  const outlineSlidePanel = objectOutlineGroup.getObjectByName('slidePanel');
  const outlineSlideLetter = objectOutlineGroup.getObjectByName('slideLetter');
  [outlineBaseMesh, outlineWaxMesh, outlinePostMesh, outlineWickMesh, outlineFlameMesh].forEach((mesh) => {
    mesh.visible = candleVisible;
  });
  [outlineSlidePanel, outlineSlideLetter].forEach((mesh) => {
    mesh.visible = slideVisible;
  });
  outlineWaxMesh.scale.set(1, waxHeight, 1);
  outlineWaxMesh.position.y = waxHeight / 2;
  outlinePostMesh.scale.set(1, 23.5, 1);
  outlinePostMesh.position.y = -11.75;
  outlineWickMesh.position.set(0, waxHeight + 0.5, 0);
  outlineFlameMesh.position.set(0, waxHeight + 1.0, 0);
  outlineSlidePanel.scale.set(1, ho, 1);
  outlineSlidePanel.position.y = 0;
  outlineSlideLetter.scale.set(Math.max(ho * 0.34, 4), Math.max(getSlideLetterTopHeight() * 2, 8), 1);
  outlineSlideLetter.position.set(0.42, 0, 0);
  // 3. Position the Screen Mesh Group
  // Screen lies on the right side (positive X coordinates)
  const screenLayout = getScreenLayout(optics);
  screenGroup.position.x = ds;
  screenGroup.visible = !optics.isVirtual;
  const screenBase = screenGroup.getObjectByName('base');
  const screenPost = screenGroup.getObjectByName('post');
  const screenFrame = screenGroup.getObjectByName('frame');
  const screenBoard = screenGroup.getObjectByName('board');
  const screenLabel = screenGroup.getObjectByName('label');
  screenBase.visible = false;
  screenPost.visible = false;
  screenFrame.position.y = screenLayout.centerY;
  screenFrame.scale.set(1, screenLayout.scale, screenLayout.scale);
  screenBoard.position.set(-0.9, screenLayout.centerY, 0);
  screenBoard.scale.set(screenLayout.scale, screenLayout.scale, 1);
  screenLabel.position.set(0, screenLayout.centerY + 16 * screenLayout.scale + 5, 0);
  // 4. Update Focal Point Markers and Sprites
  focalPointsGroup.clear();
  
  const ptGeom = new THREE.SphereGeometry(0.7, 16, 16);
  const fMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 }); // Cyan-blue for focus
  const ffMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Red for 2F
  if (showLabels) {
    // Front F1 (-f)
    const f1 = new THREE.Mesh(ptGeom, fMat);
    f1.position.set(-f, -23.5, 0);
    focalPointsGroup.add(f1);
    const f1Sprite = createTextSprite('F', '#1d4ed8');
    f1Sprite.position.set(-f, -21, 0);
    focalPointsGroup.add(f1Sprite);
    // Front 2F1 (-2f)
    const ff1 = new THREE.Mesh(ptGeom, ffMat);
    ff1.position.set(-2 * f, -23.5, 0);
    focalPointsGroup.add(ff1);
    const ff1Sprite = createTextSprite('2F', '#b91c1c');
    ff1Sprite.position.set(-2 * f, -21, 0);
    focalPointsGroup.add(ff1Sprite);
    // Rear F2 (f)
    const f2 = new THREE.Mesh(ptGeom, fMat);
    f2.position.set(f, -23.5, 0);
    focalPointsGroup.add(f2);
    const f2Sprite = createTextSprite('F\'', '#1d4ed8');
    f2Sprite.position.set(f, -21, 0);
    focalPointsGroup.add(f2Sprite);
    // Rear 2F2 (2f)
    const ff2 = new THREE.Mesh(ptGeom, ffMat);
    ff2.position.set(2 * f, -23.5, 0);
    focalPointsGroup.add(ff2);
    const ff2Sprite = createTextSprite('2F\'', '#b91c1c');
    ff2Sprite.position.set(2 * f, -21, 0);
    focalPointsGroup.add(ff2Sprite);
  }
  // 5. Update Virtual Image Candle Mesh
  if (optics.isVirtual && !optics.isInfinity) {
    virtualCandleGroup.visible = true;
    
    // Position virtual candle behind the lens (left side, X = -|di|)
    virtualCandleGroup.position.x = -optics.di;
    
    const vHi = optics.hi; // Virtual height is positive (upright)
    const vWaxHeight = vHi - 4;
    
    const vBaseMesh = virtualCandleGroup.getObjectByName('base');
    const vWaxMesh = virtualCandleGroup.getObjectByName('wax');
    const vPostMesh = virtualCandleGroup.getObjectByName('post');
    const vWickMesh = virtualCandleGroup.getObjectByName('wick');
    const vFlameMesh = virtualCandleGroup.getObjectByName('flame');
    const vSlidePanel = virtualCandleGroup.getObjectByName('slidePanel');
    const vSlideLetter = virtualCandleGroup.getObjectByName('slideLetter');
    const vLabelSprite = virtualCandleGroup.getObjectByName('label');
    const virtualCandleVisible = objectType === 'candle';
    const virtualSlideVisible = objectType === 'slide';
    
    [vBaseMesh, vWaxMesh, vPostMesh, vWickMesh, vFlameMesh].forEach((mesh) => {
      mesh.visible = virtualCandleVisible;
    });
    [vSlidePanel, vSlideLetter].forEach((mesh) => {
      mesh.visible = virtualSlideVisible;
    });
    
    vWaxMesh.scale.set(1, Math.max(vWaxHeight, 1), 1);
    vWaxMesh.position.y = Math.max(vWaxHeight, 1) / 2;
    
    vPostMesh.scale.set(1, 23.5, 1);
    vPostMesh.position.y = -11.75;
    
    vWickMesh.position.set(0, Math.max(vWaxHeight, 1) + 0.5, 0);
    vFlameMesh.position.set(0, Math.max(vWaxHeight, 1) + 1.0, 0);
    
    // Scale the virtual candle based on magnification
    const magScale = Math.min(optics.m, 4); // cap visual scale of mesh
    vWaxMesh.scale.x = magScale;
    vWaxMesh.scale.z = magScale;
    vFlameMesh.scale.set(0.8 * magScale, 1.8 * magScale, 0.8 * magScale);
    
    vSlidePanel.scale.set(magScale, ho * magScale, magScale);
    vSlidePanel.position.y = 0;
    vSlideLetter.scale.set(
      Math.max(ho * 0.34 * magScale, 4),
      Math.max(getSlideLetterTopHeight() * 2 * magScale, 8),
      1
    );
    vSlideLetter.position.set(0.42 * magScale, 0, 0);
    
    const labelY = virtualSlideVisible ? (ho * magScale) / 2 + 6 : vHi + 6;
    vLabelSprite.position.set(0, labelY, 0);
    document.querySelector('.virtual-ray-item').style.display = 'flex';
  } else {
    virtualCandleGroup.visible = false;
    document.querySelector('.virtual-ray-item').style.display = 'none';
  }
  // 6. Draw Light Rays
  updateRays(optics);
  // 7. Update Projection Image on Screen Canvas
  updateScreenTexture(optics);
  // 8. Update UI text displays and metrics
  updateHTMLDashboard(optics);
  updateViewDependentVisibility(optics);
}
// A helper to draw thick cylinder rays (glowing neon tubes) in 3D
function createCylinderSegment(p1, p2, radius, material) {
  const direction = new THREE.Vector3().subVectors(p2, p1);
  const length = direction.length();
  
  const geom = new THREE.CylinderGeometry(radius, radius, length, 8);
  geom.rotateX(Math.PI / 2); // align with Z-axis
  
  const mesh = new THREE.Mesh(geom, material);
  const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  mesh.position.copy(midPoint);
  mesh.lookAt(p2);
  
  return mesh;
}

function createRayArrowhead(position, direction, color, radius) {
  const arrowLength = Math.max(radius * 6, 2.8);
  const arrowRadius = Math.max(radius * 2.4, 1.0);
  const geom = new THREE.ConeGeometry(arrowRadius, arrowLength, 16);
  geom.rotateX(Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.95
  });
  const arrow = new THREE.Mesh(geom, material);
  arrow.position.copy(position);
  arrow.lookAt(position.clone().add(direction));
  return arrow;
}

function addRayArrowheads(points, color, radius) {
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segment = new THREE.Vector3().subVectors(p2, p1);
    const length = segment.length();
    if (length < 8) continue;

    const dir = segment.clone().normalize();
    const arrowOffset = Math.min(length * 0.55, 12);
    const arrowPos = p1.clone().addScaledVector(dir, arrowOffset);
    raysGroup.add(createRayArrowhead(arrowPos, dir, color, radius));
  }
}

function drawThickRay(points, color, isDashed = false, radius = 0.35, showArrowheads = true) {
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: isDashed ? 0.45 : 0.85
  });
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i+1];
    
    const direction = new THREE.Vector3().subVectors(p2, p1);
    const length = direction.length();
    if (length < 0.05) continue;
    if (isDashed) {
      const segmentLen = 2.5;
      const gapLen = 2.0;
      const step = segmentLen + gapLen;
      const segmentCount = Math.floor(length / step);
      const dirNormalized = direction.clone().normalize();
      
      for (let s = 0; s < segmentCount; s++) {
        const startPt = p1.clone().addScaledVector(dirNormalized, s * step);
        const endPt = p1.clone().addScaledVector(dirNormalized, Math.min(s * step + segmentLen, length));
        const cyl = createCylinderSegment(startPt, endPt, radius, material);
        raysGroup.add(cyl);
      }
    } else {
      const cyl = createCylinderSegment(p1, p2, radius, material);
      raysGroup.add(cyl);
    }
  }
  if (!isDashed && showArrowheads) {
    addRayArrowheads(points, color, radius);
  }
}
function updateRays(optics) {
  raysGroup.clear();
  if (!showRays) return;
  // Ray source point: candle flame, or top of the letter F on the slide.
  const pStart = new THREE.Vector3(-doVal, getObjectRayHeight(), 0);
  const rayEndLimit = 150; // max length on right
  const rayRadius = 0.4;   // thicker rays (neon beams)
  // Color mappings
  const colParallel = 0x06b6d4; // Cyan
  const colCentral = 0xca8a04;  // Saturated Yellow/Gold
  const colFocal = 0xdb2777;    // Saturated Pink/Magenta
  const colVirtual = 0x4f46e5;  // Indigo/Purple for virtual extensions
  // LENS APERTURE RADIUS IS 22
  const lensApertureLimit = 22;
  const objectRayHeight = getObjectRayHeight();
  // 1. Parallel Ray Check: hits lens at the active object's top point
  const parallelRayHitsLens = Math.abs(objectRayHeight) <= lensApertureLimit;
  // 2. Central Ray Check: passes through (0,0) so it always hits
  const centralRayHitsLens = true;
  const focalRayLensHeight = optics.isReal ? optics.hi : 0;
  // 3. Focal Ray Check: hits the lens where the ray crosses the lens plane.
  const focalRayHitsLens = optics.isReal && Math.abs(focalRayLensHeight) <= lensApertureLimit;
  // Draw Parallel Ray
  if (parallelRayHitsLens) {
    const pLensPar = new THREE.Vector3(0, objectRayHeight, 0);
    
    if (optics.isInfinity) {
      const pF2 = new THREE.Vector3(f, 0, 0);
      const dirPar = new THREE.Vector3().subVectors(pF2, pLensPar).normalize();
      const pEndPar = pLensPar.clone().addScaledVector(dirPar, rayEndLimit);
      drawThickRay([pStart, pLensPar, pEndPar], colParallel, false, rayRadius);
    } else if (optics.isReal) {
      const pImg = new THREE.Vector3(optics.di, optics.hi, 0);
      const pF2 = new THREE.Vector3(f, 0, 0);
      const dirPar = new THREE.Vector3().subVectors(pImg, pLensPar).normalize();
      const pEndPar = pLensPar.clone().addScaledVector(dirPar, rayEndLimit);
      drawThickRay([pStart, pLensPar, pImg, pEndPar], colParallel, false, rayRadius);
    } else if (optics.isVirtual) {
      const pImgVirtual = new THREE.Vector3(-optics.di, optics.hi, 0);
      const pF2 = new THREE.Vector3(f, 0, 0);
      const dirPar = new THREE.Vector3().subVectors(pF2, pLensPar).normalize();
      const pEndPar = pLensPar.clone().addScaledVector(dirPar, rayEndLimit);
      
      drawThickRay([pLensPar, pEndPar], colParallel, false, rayRadius);
      drawThickRay([pStart, pLensPar], colParallel, false, rayRadius);
      drawThickRay([pImgVirtual, pLensPar], colVirtual, true, rayRadius);
    }
  }
  // Draw Central Ray
  if (centralRayHitsLens) {
    const pCenter = new THREE.Vector3(0, 0, 0);
    
    if (optics.isInfinity) {
      const dirCenter = new THREE.Vector3().subVectors(pCenter, pStart).normalize();
      const pEndCenter = pStart.clone().addScaledVector(dirCenter, rayEndLimit + doVal);
      drawThickRay([pStart, pCenter, pEndCenter], colCentral, false, rayRadius);
    } else if (optics.isReal) {
      const pImg = new THREE.Vector3(optics.di, optics.hi, 0);
      const dirCenter = new THREE.Vector3().subVectors(pImg, pCenter).normalize();
      const pEndCenter = pCenter.clone().addScaledVector(dirCenter, rayEndLimit);
      drawThickRay([pStart, pCenter, pImg, pEndCenter], colCentral, false, rayRadius);
    } else if (optics.isVirtual) {
      const pImgVirtual = new THREE.Vector3(-optics.di, optics.hi, 0);
      const dirCenter = new THREE.Vector3().subVectors(pCenter, pStart).normalize();
      const pEndCenter = pStart.clone().addScaledVector(dirCenter, rayEndLimit + doVal);
      
      drawThickRay([pCenter, pEndCenter], colCentral, false, rayRadius);
      drawThickRay([pStart, pCenter], colCentral, false, rayRadius);
      drawThickRay([pImgVirtual, pStart], colVirtual, true, rayRadius);
    }
  }
  // Draw Focal Ray
  if (focalRayHitsLens) {
    if (optics.isReal) {
      const pImg = new THREE.Vector3(optics.di, optics.hi, 0);
      const pLensFoc = new THREE.Vector3(0, focalRayLensHeight, 0);
      const pEndFoc = new THREE.Vector3(rayEndLimit, focalRayLensHeight, 0);
      drawThickRay([pStart, pLensFoc, pImg, pEndFoc], colFocal, false, rayRadius);
    }
  }
}
function updateScreenTexture(optics) {
  const ctx = screenCanvas.getContext('2d');
  const screenLayout = getScreenLayout(optics);
  const cx = screenCanvas.width / 2;
  const axisY = screenCanvas.height / 2 + screenLayout.centerY * screenLayout.pixelsPerCm;
  
  // Clean paper white board background (Pure White)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
  // Render projection if image is real
  if (optics.isReal && !optics.isInfinity) {
    // Blur calculation based on screen distance error (slightly lower sensitivity for clearer views)
    const distToFocus = Math.abs(ds - optics.di);
    const blurAmount = Math.max(0, Math.min((distToFocus - 0.4) * 0.45, 18)); 
    ctx.save();
    
    // Apply canvas CSS blur filter if defocus is visible
    if (blurAmount > 0.7) {
      ctx.filter = `brightness(1.18) contrast(1.16) blur(${blurAmount}px)`;
    } else {
      ctx.filter = 'brightness(1.18) contrast(1.16)';
    }
    const cy = axisY;
    const scale = screenLayout.pixelsPerCm;
    const pM = Math.abs(optics.m);
    const imageY = (objectHeightCm) => cy - (optics.m * objectHeightCm) * scale;

    if (objectType === 'slide') {
      const topY = imageY(ho / 2);
      const bottomY = imageY(-ho / 2);
      const slideTop = Math.min(topY, bottomY);
      const slideHeight = Math.abs(bottomY - topY);
      const slideWidth = Math.max(80 * pM, 42);
      const letterHalfHeight = getSlideLetterTopHeight();
      const letterHalfWidth = slideWidth * 0.28;
      const imageX = (objectX) => cx + (optics.m < 0 ? -1 : 1) * objectX;
      const drawProjectedRect = (x1, y1, x2, y2) => {
        const points = [
          [imageX(x1), imageY(y1)],
          [imageX(x2), imageY(y1)],
          [imageX(x2), imageY(y2)],
          [imageX(x1), imageY(y2)]
        ];
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.closePath();
        ctx.fill();
      };

      ctx.fillStyle = 'rgba(248, 250, 252, 1)';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = Math.max(3 * pM, 2);
      ctx.fillRect(cx - slideWidth / 2, slideTop, slideWidth, slideHeight);
      ctx.strokeRect(cx - slideWidth / 2, slideTop, slideWidth, slideHeight);

      ctx.fillStyle = '#1d4ed8';
      const stemLeft = -letterHalfWidth;
      const stemRight = -letterHalfWidth * 0.48;
      const topBarRight = letterHalfWidth;
      const midBarRight = letterHalfWidth * 0.72;
      const topBarBottom = letterHalfHeight * 0.66;
      const midBarTop = letterHalfHeight * 0.2;
      const midBarBottom = -letterHalfHeight * 0.08;
      drawProjectedRect(stemLeft, letterHalfHeight, stemRight, -letterHalfHeight);
      drawProjectedRect(stemLeft, letterHalfHeight, topBarRight, topBarBottom);
      drawProjectedRect(stemLeft, midBarTop, midBarRight, midBarBottom);
      ctx.restore();
      screenTexture.needsUpdate = true;
      return;
    }

    const waxTopY = imageY(Math.max(ho - 4, 1));
    const wickTopY = imageY(Math.max(ho - 2.2, 1));
    const flameImageY = imageY(ho);
    const direction = Math.sign(flameImageY - cy) || 1;

    // Draw the inverted candle body. Each vertical position is the lens image
    // of the matching object height, so the flame lands on the ray intersection.
    ctx.fillStyle = '#ef4444'; // Solid red body
    const cWidth = Math.max(14 * pM, 5);
    ctx.fillRect(cx - cWidth / 2, cy, cWidth, waxTopY - cy);
    
    // Wax body vertical highlight strip
    ctx.fillStyle = '#fecaca';
    ctx.fillRect(cx - cWidth / 4, cy, cWidth / 6, waxTopY - cy);

    // Draw candle wick
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(3 * pM, 1.5);
    ctx.beginPath();
    ctx.moveTo(cx, waxTopY);
    ctx.lineTo(cx, wickTopY);
    ctx.stroke();

    // Draw realistic blue flame base for extra contrast and clarity
    ctx.fillStyle = 'rgba(37, 99, 235, 0.95)';
    ctx.beginPath();
    ctx.arc(cx, wickTopY, 5 * pM, 0, Math.PI * 2);
    ctx.fill();

    // Draw glowing fire flame
    const fCenterY = flameImageY;
    const fHeight = Math.max(4 * pM * scale, 8);
    const fWidth = Math.max(1.8 * pM * scale, 4);
    // Glowing flame gradient
    const grad = ctx.createRadialGradient(cx, fCenterY, 2, cx, fCenterY, fHeight * 0.85);
    grad.addColorStop(0, '#ffffff');             // Hot white center
    grad.addColorStop(0.2, '#fef08a');           // Yellow core
    grad.addColorStop(0.5, '#f97316');           // Orange flame halo
    grad.addColorStop(1, 'rgba(220, 38, 38, 0)'); // Red transparent boundary
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, fCenterY);
    ctx.quadraticCurveTo(cx - fWidth, fCenterY - direction * fHeight * 0.55, cx, fCenterY - direction * fHeight);
    ctx.quadraticCurveTo(cx + fWidth, fCenterY - direction * fHeight * 0.55, cx, fCenterY);
    ctx.fill();
    ctx.restore();
  } else {
    // If virtual image or parallel rays, no real image hits the screen.
    // However, light still refracts through the lens creating a broad, diffuse orange beam.
    // Blur is huge (spot is giant and faint)
    const cx = 256;
    const cy = 256;
    let spotSize = 140;
    if (optics.isVirtual) {
      // The closer do is to f, the narrower the diverging cone hits the screen
      spotSize = Math.max(240 - optics.di * 1.5, 80);
    }
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, spotSize);
    grad.addColorStop(0, 'rgba(249, 115, 22, 0.22)');
    grad.addColorStop(0.5, 'rgba(239, 68, 68, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, spotSize, 0, Math.PI * 2);
    ctx.fill();
  }
  // Flag texture update
  screenTexture.needsUpdate = true;
}
function updateHTMLDashboard(optics) {
  // 1. Sliders display values
  document.getElementById('f-val').innerText = f;
  document.getElementById('do-val').innerText = doVal;
  document.getElementById('ho-val').innerText = ho;
  document.getElementById('ds-val').innerText = Math.round(ds);
  // 2. Math Equation section (Dynamic KaTeX Rendering)
  katex.render("\\frac{1}{f} = \\frac{1}{d_o} + \\frac{1}{d_i}", document.getElementById('math-lens-eqn'));
  let lensCalcLatex = "";
  if (optics.isInfinity) {
    lensCalcLatex = `\\frac{1}{d_i} = \\frac{1}{${f}} - \\frac{1}{${doVal}} = 0 \\implies d_i = \\infty\\text{ cm}`;
  } else {
    const formattedDi = optics.isReal ? optics.di.toFixed(2) : `-${optics.di.toFixed(2)}`;
    lensCalcLatex = `\\frac{1}{d_i} = \\frac{1}{${f}} - \\frac{1}{${doVal}} \\implies d_i = ${formattedDi}\\text{ cm}`;
  }
  katex.render(lensCalcLatex, document.getElementById('math-lens-calc'));
  // Magnification
  katex.render("m = -\\frac{d_i}{d_o} = \\frac{h_i}{h_o}", document.getElementById('math-mag-eqn'));
  let magCalcLatex = "";
  if (optics.isInfinity) {
    magCalcLatex = `m = -\\frac{\\infty}{${doVal}} = -\\infty`;
  } else {
    const formattedDi = optics.isReal ? optics.di.toFixed(2) : `-${optics.di.toFixed(2)}`;
    magCalcLatex = `m = -\\frac{${formattedDi}}{${doVal}} = ${optics.m.toFixed(2)}\\text{x}`;
  }
  katex.render(magCalcLatex, document.getElementById('math-mag-calc'));
  // 3. Image Characteristics section
  const typeEl = document.getElementById('img-type');
  const orientEl = document.getElementById('img-orient');
  const scaleEl = document.getElementById('img-scale');
  const noteEl = document.getElementById('screen-status-note');
  const explanationEl = document.getElementById('explanation-text');
  if (optics.isInfinity) {
    typeEl.innerText = 'NO IMAGE (AT INFINITY)';
    typeEl.className = 'indicator-value type-none';
    orientEl.innerText = 'N/A (PARALLEL)';
    scaleEl.innerText = 'N/A';
    
    noteEl.className = 'status-note blurred';
    noteEl.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Rays are parallel. Screen shows diffuse light.';
    
    explanationEl.innerHTML = `When the object is placed exactly at the focal point (<strong>d<sub>o</sub> = f</strong>), the refracted light rays emerge perfectly parallel to each other. They never intersect, meaning <strong>no image is formed</strong> (or is formed at infinity).`;
  } else if (optics.isVirtual) {
    typeEl.innerText = 'VIRTUAL IMAGE';
    typeEl.className = 'indicator-value type-virtual';
    orientEl.innerText = 'UPRIGHT (ERECT)';
    
    let magWord = 'MAGNIFIED';
    if (Math.abs(optics.m) < 1.0) magWord = 'DIMINISHED';
    scaleEl.innerText = `${magWord} (${Math.abs(optics.m).toFixed(2)}x)`;
    noteEl.className = 'status-note blurred';
    noteEl.innerHTML = '<i class="fa-solid fa-eye"></i> Screen removed. Look through the lens to see the virtual image.';
    explanationEl.innerHTML = `When the object is inside the focal point (<strong>d<sub>o</sub> < f</strong>), the refracted rays on the right side diverge. The human eye traces them backward to form a <strong>virtual, upright, and magnified</strong> image on the same side of the lens. Since the rays do not physically meet, the screen is removed; look through the lens to observe the image.`;
  } else {
    // Real image
    typeEl.innerText = 'REAL IMAGE';
    typeEl.className = 'indicator-value type-real';
    orientEl.innerText = 'INVERTED (UPSIDE DOWN)';
    let magWord = 'MAGNIFIED';
    const absM = Math.abs(optics.m);
    if (Math.abs(absM - 1.0) < 0.05) {
      magWord = 'SAME SIZE';
    } else if (absM < 1.0) {
      magWord = 'DIMINISHED';
    }
    scaleEl.innerText = `${magWord} (${absM.toFixed(2)}x)`;
    // Screen alignment checklist
    const distToFocus = Math.abs(ds - optics.di);
    if (distToFocus < 1.5) {
      noteEl.className = 'status-note';
      noteEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Screen is in focus! Image is sharp.';
    } else {
      noteEl.className = 'status-note blurred';
      noteEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Screen is out of focus by ${distToFocus.toFixed(1)} cm. Drag screen to ${optics.di.toFixed(0)} cm.`;
    }
    let detailText = '';
    if (doVal > 2 * f) {
      detailText = 'When the object is beyond 2F (<strong>d<sub>o</sub> > 2f</strong>), the converging lens forms a <strong>real, inverted, and diminished</strong> image between F and 2F on the other side. This is how camera lenses operate.';
    } else if (Math.abs(doVal - 2 * f) < 0.2) {
      detailText = 'When the object is exactly at 2F (<strong>d<sub>o</sub> = 2f</strong>), the image forms at 2F on the other side. It is a <strong>real, inverted, and same size</strong> image (Magnification m = -1.0).';
    } else {
      detailText = 'When the object is between F and 2F (<strong>f < d<sub>o</sub> < 2f</strong>), the image forms beyond 2F. It is a <strong>real, inverted, and magnified</strong> image. This is the setup used in film projectors.';
    }
    explanationEl.innerHTML = detailText;
  }
}
// --- Event Listeners and Dynamic Responding ---
function setupUIEventListeners() {
  // Collapsible Control Panels
  const sidebar = document.querySelector('.control-panel');
  const panelToggleButton = document.getElementById('toggle-sidebar');
  const panelToggleIcon = document.querySelector('#toggle-sidebar i');
  const updatePanelToggleIcon = () => {
    const isCollapsed = sidebar.classList.contains('collapsed');
    panelToggleButton.classList.toggle('panel-collapsed', isCollapsed);
    panelToggleIcon.classList.toggle('fa-angle-down', isCollapsed);
    panelToggleIcon.classList.toggle('fa-angle-up', !isCollapsed);
  };
  if (window.matchMedia('(max-width: 768px)').matches) {
    sidebar.classList.add('collapsed');
  }
  updatePanelToggleIcon();
  panelToggleButton.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    updatePanelToggleIcon();
  });
  const pageButtons = document.querySelectorAll('.panel-page-btn');
  const panelPages = document.querySelectorAll('.panel-page');
  pageButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const page = button.dataset.panelPage;
      pageButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
      panelPages.forEach((panelPage) => {
        panelPage.classList.toggle('active', panelPage.dataset.panelPageContent === page);
      });
    });
  });
  const interactionTip = document.getElementById('interaction-tip');
  document.getElementById('dismiss-interaction-tip')?.addEventListener('click', () => {
    interactionTip.classList.add('hidden');
  });
  // Range sliders
  document.getElementById('focal-slider').addEventListener('input', (e) => {
    f = parseInt(e.target.value);
    updateSimulation();
  });
  document.getElementById('do-slider').addEventListener('input', (e) => {
    doVal = parseInt(e.target.value);
    updateSimulation();
  });
  document.getElementById('ho-slider').addEventListener('input', (e) => {
    ho = parseFloat(e.target.value);
    updateSimulation();
  });
  document.getElementById('object-type-select').addEventListener('change', (e) => {
    objectType = e.target.value;
    updateSimulation();
  });
  document.getElementById('ds-slider').addEventListener('input', (e) => {
    ds = parseInt(e.target.value);
    updateSimulation();
  });
  // Screen Mode Selector
  const screenModeSelect = document.getElementById('screen-mode-select');
  const screenDistGroup = document.getElementById('screen-dist-group');
  screenModeSelect.addEventListener('change', (e) => {
    screenMode = e.target.value;
    if (screenMode === 'manual') {
      screenDistGroup.style.display = 'block';
    } else {
      screenDistGroup.style.display = 'none';
    }
    updateSimulation();
  });
  // Visual settings toggles
  document.getElementById('toggle-rays').addEventListener('change', (e) => {
    showRays = e.target.checked;
    updateSimulation();
  });
  document.getElementById('toggle-labels').addEventListener('change', (e) => {
    showLabels = e.target.checked;
    updateSimulation();
  });
  document.getElementById('toggle-auto-rotate').addEventListener('change', (e) => {
    autoRotate = e.target.checked;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.8;
  });
  // Preset Buttons
  const presetButtons = document.querySelectorAll('.btn-preset');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Manage active visual state
      presetButtons.forEach(b => b.classList.remove('active'));
      const activeBtn = e.currentTarget;
      activeBtn.classList.add('active');
      // Load preset parameters
      const pKey = activeBtn.getAttribute('data-preset');
      const p = presets[pKey];
      if (p) {
        f = p.f;
        doVal = p.do;
        ho = p.ho;
        screenMode = p.mode;
        
        // Sync HTML inputs
        document.getElementById('focal-slider').value = f;
        document.getElementById('do-slider').value = doVal;
        document.getElementById('ho-slider').value = ho;
        screenModeSelect.value = screenMode;
        screenDistGroup.style.display = 'none'; // Snap resets mode to auto
        // Compute correct initial screen placement
        const optics = calculateOptics();
        ds = optics.isReal && !optics.isInfinity ? optics.di : 100;
        document.getElementById('ds-slider').value = Math.round(ds);
        updateSimulation();
      }
    });
  });
}
function setup3DInteractionListeners() {
  const domElement = renderer.domElement;
  const updatePointerRay = (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  };
  const cancelObjectDrag = () => {
    isDraggingCandle = false;
    isDraggingScreen = false;
    dragPointerId = null;
    controls.enabled = true;
    document.body.style.cursor = 'default';
    domElement.style.cursor = 'default';
  };
  domElement.addEventListener('pointerdown', (e) => {
    activePointers.add(e.pointerId);
    if (activePointers.size > 1 || e.isPrimary === false) {
      cancelObjectDrag();
      return;
    }
    updatePointerRay(e);
    // Intersect draggable objects: Candle wax/body and Screen board/frame
    const dragTargets = screenGroup.visible ? [candleGroup, screenGroup] : [candleGroup];
    const intersects = raycaster.intersectObjects(dragTargets, true);
    if (intersects.length > 0) {
      // Find which parent group was clicked
      let obj = intersects[0].object;
      while (obj.parent && obj !== scene) {
        if (obj === candleGroup) {
          isDraggingCandle = true;
          dragPointerId = e.pointerId;
          controls.enabled = false; // lock camera rotation
          document.body.style.cursor = 'grabbing';
          break;
        }
        if (obj === screenGroup) {
          if (screenMode === 'manual') {
            isDraggingScreen = true;
            dragPointerId = e.pointerId;
            controls.enabled = false;
            document.body.style.cursor = 'grabbing';
          } else {
            // Toast / highlight notification warning they must be in manual screen mode
            const warningEl = document.getElementById('screen-status-note');
            warningEl.classList.add('pulse-warn');
            setTimeout(() => warningEl.classList.remove('pulse-warn'), 1000);
          }
          break;
        }
        obj = obj.parent;
      }
    }
  });
  domElement.addEventListener('pointermove', (e) => {
    if (activePointers.size > 1) {
      cancelObjectDrag();
      return;
    }
    if ((isDraggingCandle || isDraggingScreen) && e.pointerId !== dragPointerId) {
      return;
    }
    updatePointerRay(e);
    // If hovering draggable objects, change cursor
    if (!isDraggingCandle && !isDraggingScreen) {
      if (e.pointerType === 'touch') {
        domElement.style.cursor = 'default';
        return;
      }
      const dragTargets = screenGroup.visible ? [candleGroup, screenGroup] : [candleGroup];
      const intersects = raycaster.intersectObjects(dragTargets, true);
      if (intersects.length > 0) {
        let isDraggable = false;
        let obj = intersects[0].object;
        while (obj.parent && obj !== scene) {
          if (obj === candleGroup || (obj === screenGroup && screenMode === 'manual')) {
            isDraggable = true;
            break;
          }
          obj = obj.parent;
        }
        domElement.style.cursor = isDraggable ? 'grab' : 'default';
      } else {
        domElement.style.cursor = 'default';
      }
      return;
    }
    // Solve intersection with Z=0 plane (containing optical axis)
    if (raycaster.ray.intersectPlane(dragPlane, intersectionPoint)) {
      if (isDraggingCandle) {
        // Object distance is -X coordinate of candle
        let newDo = -intersectionPoint.x;
        newDo = Math.max(5, Math.min(100, newDo)); // clamp [5, 100]
        doVal = Math.round(newDo);
        
        // Sync HTML inputs
        document.getElementById('do-slider').value = doVal;
        document.getElementById('do-val').innerText = doVal;
        // Reset preset buttons highlight (as user is doing custom editing)
        document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
        updateSimulation();
      }
      else if (isDraggingScreen && screenMode === 'manual') {
        // Screen position is X coordinate of screen
        let newDs = intersectionPoint.x;
        newDs = Math.max(10, Math.min(150, newDs)); // clamp [10, 150]
        ds = Math.round(newDs);
        // Sync HTML inputs
        document.getElementById('ds-slider').value = ds;
        document.getElementById('ds-val').innerText = ds;
        updateSimulation();
      }
    }
  });
  const endPointer = (e) => {
    activePointers.delete(e.pointerId);
    if (e.pointerId === dragPointerId) {
      cancelObjectDrag();
    }
  };
  domElement.addEventListener('pointerup', endPointer);
  domElement.addEventListener('pointercancel', endPointer);
  domElement.addEventListener('lostpointercapture', endPointer);
  domElement.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'touch') {
      endPointer(e);
    }
  });
}
function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
// --- Animation Loop ---
function animate(time) {
  requestAnimationFrame(animate);
  // Subtle flame flickering micro-animation
  const timeSec = time * 0.003;
  
  const mainFlame = candleGroup.getObjectByName('flame');
  if (mainFlame) {
    const flicker = 1 + Math.sin(timeSec * 7) * 0.05 + Math.cos(timeSec * 13) * 0.03;
    mainFlame.scale.set(0.8 * flicker, 1.8 * flicker, 0.8 * flicker);
    flamePointLight.intensity = 3.3 * (0.9 + Math.sin(timeSec * 15) * 0.08);
  }
  // Flickering virtual hologram flame
  const virtualFlame = virtualCandleGroup.getObjectByName('flame');
  if (virtualFlame && virtualCandleGroup.visible) {
    const vFlicker = 1 + Math.sin(timeSec * 5) * 0.08 + Math.cos(timeSec * 11) * 0.04;
    // Scale must include optics.m scaling factor
    const optics = calculateOptics();
    const magScale = Math.min(optics.m, 4);
    virtualFlame.scale.set(0.8 * magScale * vFlicker, 1.8 * magScale * vFlicker, 0.8 * magScale * vFlicker);
  }
  controls.update();
  updateViewDependentVisibility(currentOptics);
  renderer.render(scene, camera);
}
// Start simulation on load
window.onload = init;
