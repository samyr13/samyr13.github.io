import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer,
  type Material,
  type MeshStandardMaterialParameters,
} from 'three'

/**
 * Avatar 3D "façon Memoji" de Samy (tête ronde), construit en primitives : aucun modèle ni image à télécharger.
 * - rotation continue de la tête vers la souris, pupilles, clignement, sourire, parole
 * - mode IA : visage sombre lumineux, yeux qui brillent, anneaux HUD, scanner, particules (masqués hors mode IA)
 * - ~20 draw calls, boucles de cheveux en InstancedMesh (1 draw call)
 * - éclairage : hémisphère + 1 lumière clé + 1 contre-jour orange, sans ombres
 * - rendu à la demande : render() n'est appelé que lorsque la pose change
 */

const C = {
  skin: '#cf9671',
  skinShade: '#b27752',
  hair: '#33221a',
  hairLight: '#4a3226',
  fade: '#5b4033',
  brow: '#3a271e',
  iris: '#5a3420',
  lip: '#6e3428',
  ember: '#ff7a2f',
}

export type AvatarState = {
  yaw: number
  pitch: number
  smile: number
  blink: number
  /** ouverture de bouche quand l'IA parle (0..1) */
  talk: number
  /** transformation IA (0..1) */
  ai: number
  /** tour sur soi-même (easter egg, 0..1) */
  spin: number
  /** lunettes de soleil (easter egg, 0..1) */
  shades: number
  /** temps en secondes (anneaux, particules) */
  t: number
}

export type Avatar = ReturnType<typeof createAvatar>

export function createAvatar(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const hemi = new HemisphereLight('#fff6ee', '#6a4634', 2.1)
  const key = new DirectionalLight('#fff3e8', 2.4)
  key.position.set(-2.5, 3, 4)
  const rim = new DirectionalLight(C.ember, 2.6)
  rim.position.set(3.5, 1.5, -3)
  scene.add(hemi, key, rim)

  const camera = new PerspectiveCamera(28, 1, 0.1, 50)
  camera.position.set(0, 0.05, 7.2)

  // ---------- matériaux / géométries (libérés dans dispose) ----------
  const geos: BufferGeometry[] = []
  const mats: Material[] = []
  const G = <T extends BufferGeometry>(g: T) => (geos.push(g), g)
  const M = (color: string, roughness = 0.6, extra: MeshStandardMaterialParameters = {}) => {
    const m = new MeshStandardMaterial({ color, roughness, metalness: 0, ...extra })
    mats.push(m)
    return m
  }
  const glow = (color: string, opacity = 1) => {
    const m = new MeshBasicMaterial({ color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false })
    mats.push(m)
    return m
  }
  const sphere = G(new SphereGeometry(1, 48, 32))
  const sphereLo = G(new SphereGeometry(1, 16, 12))

  const skin = M(C.skin, 0.55)
  const skinShade = M(C.skinShade, 0.6)
  const hairM = M('#ffffff', 0.85)
  const fadeM = M(C.fade, 0.95)
  const browM = M(C.brow, 0.8)
  const white = M('#f7f3ef', 0.25)
  const irisM = M(C.iris, 0.3)
  const black = M('#0b0706', 0.2)
  const shine = M('#ffffff', 0.1, { emissive: new Color('#ffffff'), emissiveIntensity: 1 })
  const lipM = M(C.lip, 0.5)
  const teethM = M('#fbf8f4', 0.35)
  const lensM = M('#0c0a0a', 0.08, { metalness: 0.6 })

  const mesh = (geo: BufferGeometry, mat: Material, parent: Object3D, p: [number, number, number], s: [number, number, number] = [1, 1, 1], r: [number, number, number] = [0, 0, 0]) => {
    const m = new Mesh(geo, mat)
    m.position.set(...p)
    m.scale.set(...s)
    m.rotation.set(...r)
    parent.add(m)
    return m
  }

  // pivot au niveau du cou → la rotation ressemble à un vrai mouvement de tête
  const root = new Group()
  root.position.y = -0.95
  scene.add(root)
  const head = new Group()
  head.position.y = 0.95
  root.add(head)

  // ---------- tête ----------
  mesh(sphere, skin, head, [0, -0.02, 0], [0.98, 1.06, 0.95])
  for (const sx of [-1, 1]) {
    mesh(sphere, skin, head, [sx * 0.93, -0.02, -0.06], [0.2, 0.29, 0.13], [0, sx * 0.35, 0])
    mesh(sphere, skinShade, head, [sx * 0.97, -0.02, -0.02], [0.1, 0.17, 0.07], [0, sx * 0.35, 0])
  }

  // ---------- cheveux : dégradé court sur les côtés + boucles sur le dessus ----------
  const fadeGeo = G(new SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, 1.42))
  mesh(fadeGeo, fadeM, head, [0, 0.02, -0.03], [1.0, 1.07, 0.955], [-0.42, 0, 0])

  const curlsData: { p: [number, number, number]; r: number }[] = []
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const N = 340
  for (let i = 0; i < N; i++) {
    const t = i / N
    const polar = Math.acos(1 - t * 0.8) // calotte supérieure
    const az = i * 2.39996
    const x = Math.sin(polar) * Math.cos(az)
    let y = Math.cos(polar)
    let z = Math.sin(polar) * Math.sin(az)
    const a = -0.38 // calotte inclinée vers l'arrière : la frange s'arrête sur le front
    const y2 = y * Math.cos(a) - z * Math.sin(a)
    const z2 = y * Math.sin(a) + z * Math.cos(a)
    y = y2
    z = z2
    if (!(y > 0.5 || (z > 0.45 && y > 0.36))) continue // côtés et arrière restent en dégradé court
    const lift = 1.02 + rnd() * 0.08 + (y > 0.8 ? 0.06 : 0)
    curlsData.push({ p: [x * lift * 0.99, y * lift * 1.06 + 0.04, z * lift * 0.95], r: 0.12 + rnd() * 0.07 })
  }
  const curls = new InstancedMesh(sphereLo, hairM, curlsData.length)
  const dummy = new Object3D()
  const col = new Color()
  const c1 = new Color(C.hair)
  const c2 = new Color(C.hairLight)
  curlsData.forEach((c, i) => {
    dummy.position.set(...c.p)
    dummy.scale.setScalar(c.r)
    dummy.rotation.set(rnd() * 3, rnd() * 3, 0)
    dummy.updateMatrix()
    curls.setMatrixAt(i, dummy.matrix)
    curls.setColorAt(i, col.copy(c1).lerp(c2, rnd()))
  })
  curls.instanceMatrix.needsUpdate = true
  if (curls.instanceColor) curls.instanceColor.needsUpdate = true
  head.add(curls)

  // ---------- visage ----------
  const face = new Group()
  head.add(face)

  const capsule = G(new CapsuleGeometry(0.038, 0.2, 4, 10))
  const brows = [-1, 1].map((sx) => mesh(capsule, browM, face, [sx * 0.33, 0.36, 0.83], [1, 1, 0.8], [0, sx * 0.25, Math.PI / 2 + sx * 0.12]))

  const eyes = [-1, 1].map((sx) => {
    const g = new Group()
    g.position.set(sx * 0.32, 0.1, 0.8)
    g.rotation.y = sx * 0.28
    face.add(g)
    mesh(sphere, white, g, [0, 0, 0], [0.165, 0.175, 0.1])
    const look = new Group()
    g.add(look)
    mesh(sphere, irisM, look, [0, 0, 0.075], [0.105, 0.11, 0.04])
    mesh(sphere, black, look, [0, 0, 0.1], [0.055, 0.058, 0.025])
    mesh(sphere, shine, look, [0.035, 0.04, 0.118], [0.022, 0.022, 0.01])
    return { g, look }
  })

  // nez
  mesh(sphere, skin, face, [0, -0.08, 0.95], [0.12, 0.11, 0.1])
  mesh(sphere, skinShade, face, [0, -0.13, 0.94], [0.1, 0.05, 0.08])

  // moustache fine (arc)
  const stache = G(new TorusGeometry(0.5, 0.022, 6, 28, 0.6))
  mesh(stache, browM, face, [0, -0.735, 0.915], [1, 1, 1], [0, 0, Math.PI / 2 - 0.3])

  // bouche : trait souriant (neutre) + bouche ouverte (sourire / parole)
  const smileArc = G(new TorusGeometry(0.22, 0.026, 6, 24, 1.1))
  const mouthLine = mesh(smileArc, lipM, face, [0, -0.2, 0.9], [1, 0.75, 1], [0, 0, -Math.PI / 2 - 0.55])
  const halfDisc = G(new CircleGeometry(0.22, 32, Math.PI, Math.PI))
  const mouthOpen = new Group()
  mouthOpen.position.set(0, -0.345, 0.915)
  mouthOpen.rotation.x = -0.25
  face.add(mouthOpen)
  mesh(halfDisc, lipM, mouthOpen, [0, 0, 0], [1.08, 1.15, 1])
  mesh(halfDisc, teethM, mouthOpen, [0, 0, 0.005], [0.92, 0.42, 1])
  mouthOpen.scale.set(0.001, 0.001, 1)

  // ---------- easter egg : lunettes de soleil ----------
  const shades = new Group()
  face.add(shades)
  for (const sx of [-1, 1]) mesh(sphere, lensM, shades, [sx * 0.32, 0.1, 0.9], [0.2, 0.15, 0.05], [0, sx * 0.28, 0])
  mesh(capsule, lensM, shades, [0, 0.14, 0.95], [0.6, 0.5, 0.6], [0, 0, Math.PI / 2])
  shades.visible = false

  // ---------- mode IA ----------
  const ai = new Group()
  ai.visible = false
  head.add(ai)
  const fresnelM = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uA: { value: 0 }, uC: { value: new Color(C.ember) } },
    vertexShader: `varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform float uA;uniform vec3 uC;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-max(dot(vN,vV),0.),3.4);gl_FragColor=vec4(uC*f*1.3,f*uA*.85);}`,
  })
  mats.push(fresnelM)
  mesh(sphere, fresnelM, ai, [0, -0.02, 0], [1.02, 1.1, 0.99])
  const ringMats = [glow(C.ember, 0.9), glow('#ffb36b', 0.6), glow(C.ember, 0.45)]
  const rings = [
    mesh(G(new TorusGeometry(1.5, 0.009, 6, 120, Math.PI * 1.6)), ringMats[0], ai, [0, 0, 0], [1, 1, 1], [1.25, 0, 0]),
    mesh(G(new TorusGeometry(1.68, 0.006, 6, 140, Math.PI * 1.15)), ringMats[1], ai, [0, 0, 0], [1, 1, 1], [1.45, 0.4, 0]),
    mesh(G(new TorusGeometry(1.32, 0.005, 6, 100, Math.PI * 0.7)), ringMats[2], ai, [0, 0, 0], [1, 1, 1], [1.7, -0.5, 0]),
  ]
  const scanM = glow('#ffd2a8', 0.8)
  const scan = mesh(G(new TorusGeometry(1, 0.006, 6, 90)), scanM, ai, [0, 0, 0], [1, 1, 1], [Math.PI / 2, 0, 0])
  const PN = 90
  const pts = new Float32Array(PN * 3)
  for (let i = 0; i < PN; i++) {
    const th = rnd() * Math.PI * 2
    const ph = Math.acos(rnd() * 2 - 1)
    const r = 1.35 + rnd() * 0.35
    pts[i * 3] = r * Math.sin(ph) * Math.cos(th)
    pts[i * 3 + 1] = r * Math.cos(ph) * 0.9
    pts[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
  }
  const pGeo = G(new BufferGeometry())
  pGeo.setAttribute('position', new BufferAttribute(pts, 3))
  const pMat = new PointsMaterial({ color: '#ffb36b', size: 0.045, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false })
  mats.push(pMat)
  const particles = new Points(pGeo, pMat)
  ai.add(particles)

  // couleurs de départ / d'arrivée de la transformation
  const tint = [
    { m: skin, from: new Color(C.skin), to: new Color('#2a1a13') },
    { m: skinShade, from: new Color(C.skinShade), to: new Color('#140c08') },
    { m: hairM, from: new Color('#ffffff'), to: new Color('#5a3a2c') },
    { m: fadeM, from: new Color(C.fade), to: new Color('#24160f') },
    { m: white, from: new Color('#f7f3ef'), to: new Color('#120b08') },
    { m: browM, from: new Color(C.brow), to: new Color('#2a1a12') },
    { m: lipM, from: new Color(C.lip), to: new Color('#2a1a12') },
  ]
  const emberC = new Color(C.ember)
  for (const t of tint) t.m.emissive = emberC.clone()
  irisM.emissive = new Color('#ff9a4d')
  black.emissive = new Color('#fff1e0')
  let lastAi = -1
  const applyAI = (v: number) => {
    if (Math.abs(v - lastAi) < 0.001) return
    lastAi = v
    for (const t of tint) {
      t.m.color.lerpColors(t.from, t.to, v * 0.9)
      t.m.emissiveIntensity = 0.05 * v
    }
    browM.emissiveIntensity = lipM.emissiveIntensity = 1.2 * v
    irisM.emissiveIntensity = 2.6 * v
    black.emissiveIntensity = 1.6 * v
    fresnelM.uniforms.uA.value = v
    ringMats[0].opacity = 0.9 * v
    ringMats[1].opacity = 0.6 * v
    ringMats[2].opacity = 0.45 * v
    scanM.opacity = 0.8 * v
    pMat.opacity = 0.9 * v
    ai.visible = v > 0.01
    ai.scale.setScalar(0.85 + 0.15 * v)
  }

  // ---------- API ----------
  let w = 0
  const resize = (cssPx: number, dpr: number) => {
    renderer.setPixelRatio(dpr)
    if (cssPx !== w) {
      w = cssPx
      renderer.setSize(w, w, false)
      camera.aspect = 1
      camera.updateProjectionMatrix()
    }
  }

  /** Applique l'état (tout est continu : aucune transition interne, renvoie toujours false) */
  const pose = (s: AvatarState): boolean => {
    root.rotation.y = s.yaw * 0.55 + s.spin * Math.PI * 2
    root.rotation.x = s.pitch * 0.32
    root.rotation.z = -s.yaw * 0.05
    for (const e of eyes) {
      e.look.position.set(s.yaw * 0.035, -s.pitch * 0.03, 0)
      e.g.scale.y = Math.max(0.06, (1 - s.blink) * (1 - s.smile * 0.28))
    }
    brows[0].position.y = brows[1].position.y = 0.36 + s.smile * 0.05 + s.ai * 0.02
    const open = Math.max(s.smile, s.talk * 0.75)
    mouthOpen.scale.set(Math.max(0.001, Math.max(s.smile, s.talk * 0.55)), Math.max(0.001, open), 1)
    mouthLine.scale.set(1 - open, (1 - open) * 0.75, 1)
    mouthLine.visible = open < 0.95

    shades.visible = s.shades > 0.01
    if (shades.visible) shades.position.y = (1 - s.shades) * 1.6

    applyAI(s.ai)
    if (ai.visible) {
      rings[0].rotation.z = s.t * 0.6
      rings[1].rotation.z = -s.t * 0.45
      rings[2].rotation.z = s.t * 0.9
      const sy = Math.sin(s.t * 1.6) * 0.95
      scan.position.y = sy
      const r = Math.sqrt(Math.max(0.02, 1 - sy * sy)) * 1.02
      scan.scale.set(r, r, 1)
      particles.rotation.y = s.t * 0.18
      particles.rotation.x = Math.sin(s.t * 0.2) * 0.2
    }
    return false
  }

  const render = () => renderer.render(scene, camera)
  /** compile les shaders en parallèle (KHR_parallel_shader_compile), variantes IA et lunettes comprises */
  const warmup = () => {
    ai.visible = true
    shades.visible = true
    return renderer.compileAsync(scene, camera).finally(() => {
      ai.visible = false
      shades.visible = false
    })
  }

  const dispose = () => {
    geos.forEach((g) => g.dispose())
    mats.forEach((m) => m.dispose())
    curls.dispose()
    renderer.dispose()
  }

  return { resize, pose, render, warmup, dispose, renderer }
}
