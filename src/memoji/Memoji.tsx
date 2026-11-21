import { useEffect, useRef } from 'react'
import { aiStore, eggStore, finePointer, onWake, openAI, pointer, reducedMotion } from '../lib/runtime'
import type { Avatar, AvatarState } from './avatar'

/**
 * Le Memoji de Samy qui suit la souris ET le scroll — et qui se transforme en IA quand on clique dessus.
 * - Tête 3D Three.js en primitives : rotation continue (aucun saut d'image).
 * - Position/échelle interpolées entre les ancres [data-memoji="x,y,scale,opacity[,x2]"] des sections.
 * - Mode IA : l'avatar se place à côté du chat, se transforme (anneaux, scanner…) et parle.
 * - Une seule boucle rAF qui s'endort quand tout est stable ; rendu WebGL uniquement quand la pose change.
 * - Three.js est chargé en différé, créé quand le navigateur est libre, shaders compilés en asynchrone.
 */

/** x2 (optionnel) : la tête glisse de x à x2 pendant que la section est épinglée */
type Anchor = { start: number; end: number; x: number; y: number; s: number; o: number; x2: number; top: number; span: number }

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const smooth = (t: number) => t * t * (3 - 2 * t)

export function Memoji() {
  const layerRef = useRef<HTMLDivElement>(null)
  const posRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const layer = layerRef.current!
    const posEl = posRef.current!
    const canvas = canvasRef.current!
    const bubble = bubbleRef.current!
    let avatar: Avatar | null = null
    let disposed = false

    // ---------- Mesures (uniquement au resize) ----------
    let vw = innerWidth
    let vh = innerHeight
    let mobile = vw < 768
    let base = 300
    let dpr = Math.min(devicePixelRatio || 1, 1.5)
    let anchors: Anchor[] = []
    const measure = () => {
      vw = innerWidth
      vh = innerHeight
      mobile = vw < 768
      base = Math.round(mobile ? Math.min(vw * 0.62, 280) : Math.min(vw * 0.3, vh * 0.52, 470))
      posEl.style.width = posEl.style.height = `${base}px`
      posEl.style.marginLeft = posEl.style.marginTop = `${-base / 2}px`
      avatar?.resize(base, dpr)
      dirty = true
      const sy = scrollY
      anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-memoji]')).map((el) => {
        const r = el.getBoundingClientRect()
        const top = r.top + sy
        const spec = (mobile && el.dataset.memojiM) || el.dataset.memoji || '0.5,0.5,1,1'
        const [x, y, s, o = 1, x2 = NaN] = spec.split(',').map(Number)
        const start = top - vh * 0.2
        const end = Math.max(start, top + r.height - vh * 0.8)
        return { start, end, x, y, s, o, x2, top, span: Math.max(1, r.height - vh) }
      })
      wakeUp()
    }

    // ---------- État animé (aucune allocation dans la boucle) ----------
    let px = vw * 0.5, py = vh * 0.5, ps = 0.85, po = 0
    let vYaw = 0, vPitch = 0
    let nextBlink = performance.now() + 2500
    let lastT = performance.now()
    let raf = 0
    let running = false
    let idleTimer = 0
    let dirty = true
    let slowFrames = 0
    let overHead = false
    let bubbleOn = false
    let layerFront = false
    const st: AvatarState = { yaw: 0, pitch: 0, smile: 0, blink: 0, talk: 0, ai: 0, spin: 0, shades: 0, t: 0 }
    const written = { x: 1e9, y: 1e9, s: 1e9, o: 1e9 }
    const drawn = { yaw: 1e9, pitch: 1e9, smile: 1e9, blink: 1e9, talk: 1e9, ai: 1e9, spin: 1e9, shades: 1e9 }

    const target = { x: 0.5, y: 0.5, s: 1, o: 1 }
    const setHold = (a: Anchor, sy: number) => {
      target.x = a.x2 === a.x2 ? a.x + (a.x2 - a.x) * clamp((sy - a.top) / a.span, 0, 1) : a.x
      target.y = a.y
      target.s = a.s
      target.o = a.o
    }
    const computeTarget = () => {
      if (aiStore.get().open) {
        // à côté du chat
        target.x = mobile ? 0.5 : 0.3
        target.y = mobile ? 0.17 : 0.5
        target.s = mobile ? 0.62 : 1.18
        target.o = 1
        return
      }
      const sy = scrollY
      const n = anchors.length
      if (!n) return
      if (sy <= anchors[0].end) return setHold(anchors[0], sy)
      for (let i = 0; i < n; i++) {
        const a = anchors[i]
        if (sy >= a.start && sy <= a.end) return setHold(a, sy)
        const b = anchors[i + 1]
        if (b && sy > a.end && sy < b.start) {
          const t = smooth(clamp((sy - a.end) / (b.start - a.end), 0, 1))
          const ax = a.x2 === a.x2 ? a.x2 : a.x
          target.x = ax + (b.x - ax) * t
          target.y = a.y + (b.y - a.y) * t
          target.s = a.s + (b.s - a.s) * t
          target.o = a.o + (b.o - a.o) * t
          return
        }
      }
      setHold(anchors[n - 1], sy)
    }

    const tick = (now: number) => {
      const dtMs = now - lastT
      const dt = Math.min(dtMs / 1000, 1 / 30)
      lastT = now
      const aiOpen = aiStore.get().open
      const talking = aiStore.get().talking
      const eggs = eggStore.get()
      computeTarget()

      // résolution adaptative : si la machine peine (< ~45 fps soutenus), on baisse le pixel ratio
      if (dtMs > 22 && dtMs < 200) slowFrames++
      else slowFrames = Math.max(0, slowFrames - 1)
      if (slowFrames > 45 && dpr > 1) {
        dpr = 1
        slowFrames = 0
        avatar?.resize(base, dpr)
        dirty = true
      }

      // position / échelle : lissage exponentiel (Lenis lisse déjà le scroll)
      const kp = 1 - Math.exp(-dt * (aiOpen ? 6 : 7.5))
      const tx = target.x * vw, ty = target.y * vh
      px += (tx - px) * kp
      py += (ty - py) * kp
      ps += (target.s - ps) * kp
      po += (target.o - po) * (1 - Math.exp(-dt * 5))

      // l'avatar passe devant le voile du chat quand l'IA est ouverte
      if (aiOpen !== layerFront) {
        layerFront = aiOpen
        layer.style.zIndex = aiOpen ? '56' : '20'
      }

      // direction du regard
      const idle = !finePointer || now - pointer.lastMove > 4500
      const size = base * ps
      let yawT: number, pitchT: number
      if (idle) {
        const t = now / 1000
        yawT = Math.sin(t * 0.42) * 0.5 + Math.sin(t * 0.17) * 0.2
        pitchT = Math.sin(t * 0.31 + 1.3) * 0.3
        if (aiOpen) { yawT = 0.35 + yawT * 0.25; pitchT *= 0.4 } // regarde vers le chat
      } else {
        yawT = clamp((pointer.x - px) / (vw * 0.32), -1, 1)
        pitchT = clamp((pointer.y - py) / (vh * 0.4), -1, 1)
      }
      if (reducedMotion) { yawT *= 0.4; pitchT *= 0.4 }
      const k = 60, c = 2 * Math.sqrt(k) * 0.85
      vYaw += ((yawT - st.yaw) * k - vYaw * c) * dt
      vPitch += ((pitchT - st.pitch) * k - vPitch * c) * dt
      st.yaw += vYaw * dt
      st.pitch += vPitch * dt

      // survol de la tête → curseur main + bulle "parle-moi"
      const dxh = pointer.x - px, dyh = pointer.y - py, rr = size * 0.4
      const over = finePointer && !idle && !aiOpen && dxh * dxh + dyh * dyh < rr * rr && po > 0.5
      if (over !== overHead) {
        overHead = over
        document.documentElement.style.cursor = over ? 'pointer' : ''
      }
      const showBubble = !aiOpen && po > 0.5 && (over || (scrollY < vh * 0.3 && now > 2500 && now < 14000))
      if (showBubble !== bubbleOn) {
        bubbleOn = showBubble
        bubble.style.opacity = showBubble ? '1' : '0'
        bubble.style.transform = showBubble ? 'translate3d(0,0,0) scale(1)' : 'translate3d(0,8px,0) scale(.92)'
      }

      // sourire / parole / transformation IA
      const smileT = (pointer.smile || over) && !aiOpen ? 1 : 0
      st.smile += (smileT - st.smile) * (1 - Math.exp(-dt * 10))
      const talkT = talking ? 0.35 + 0.65 * Math.abs(Math.sin(now / 95) * Math.sin(now / 160 + 1)) : 0
      st.talk += (talkT - st.talk) * (1 - Math.exp(-dt * 18))
      const aiT = aiOpen ? 1 : 0
      st.ai += (aiT - st.ai) * (1 - Math.exp(-dt * (aiOpen ? 2.6 : 4)))
      if (Math.abs(aiT - st.ai) < 0.002) st.ai = aiT
      st.t = now / 1000

      // easter eggs : tour sur soi-même, lunettes de soleil
      const sp = (now - eggs.spinAt) / 1100
      st.spin = sp >= 0 && sp < 1 ? smooth(smooth(sp)) : 0
      const shT = eggs.shades ? 1 : 0
      st.shades += (shT - st.shades) * (1 - Math.exp(-dt * 7))
      if (Math.abs(shT - st.shades) < 0.002) st.shades = shT

      // clignement des yeux
      let blinking = false
      if (!reducedMotion && now >= nextBlink) {
        const p = (now - nextBlink) / 170
        if (p >= 1) {
          st.blink = 0
          nextBlink = now + 2600 + Math.random() * 3200
        } else {
          st.blink = Math.sin(p * Math.PI)
          blinking = true
        }
      }

      // rendu WebGL uniquement si la pose a changé (en mode IA, les anneaux tournent en continu)
      if (
        avatar && po > 0.01 &&
        (dirty || st.ai > 0.01 || Math.abs(st.yaw - drawn.yaw) > 0.0008 || Math.abs(st.pitch - drawn.pitch) > 0.0008 ||
          Math.abs(st.smile - drawn.smile) > 0.004 || st.blink !== drawn.blink || Math.abs(st.talk - drawn.talk) > 0.004 ||
          st.spin !== drawn.spin || Math.abs(st.shades - drawn.shades) > 0.002)
      ) {
        // pose() renvoie true si une transition interne est en cours → on continue à rendre
        const fading = avatar.pose(st)
        avatar.render()
        drawn.yaw = st.yaw; drawn.pitch = st.pitch; drawn.smile = st.smile; drawn.blink = st.blink
        drawn.talk = st.talk; drawn.ai = st.ai; drawn.spin = st.spin; drawn.shades = st.shades
        dirty = fading
      }

      // écritures DOM groupées, uniquement si ça bouge
      if (
        Math.abs(px - written.x) > 0.05 || Math.abs(py - written.y) > 0.05 ||
        Math.abs(ps - written.s) > 0.0005 || Math.abs(po - written.o) > 0.002
      ) {
        posEl.style.transform = `translate3d(${px.toFixed(2)}px,${py.toFixed(2)}px,0) scale(${ps.toFixed(4)})`
        posEl.style.opacity = po.toFixed(3)
        posEl.style.visibility = po < 0.01 ? 'hidden' : 'visible'
        written.x = px; written.y = py; written.s = ps; written.o = po
      }

      // sommeil quand tout est stable (et pas en mode "regard libre" / IA / animation)
      const settled =
        !idle && !blinking && !dirty && st.ai === 0 && st.spin === 0 && st.talk < 0.002 &&
        (st.shades === 0 || st.shades === 1) &&
        Math.abs(tx - px) < 0.1 && Math.abs(ty - py) < 0.1 && Math.abs(target.s - ps) < 0.001 &&
        Math.abs(target.o - po) < 0.003 && Math.abs(vYaw) + Math.abs(vPitch) < 0.002 &&
        Math.abs(yawT - st.yaw) + Math.abs(pitchT - st.pitch) < 0.004 && Math.abs(smileT - st.smile) < 0.01
      const hidden = po < 0.01 && target.o < 0.01 && !aiOpen
      if (settled || hidden) {
        running = false
        clearTimeout(idleTimer)
        idleTimer = window.setTimeout(wakeUp, hidden ? 4600 : Math.max(200, Math.min(4600, nextBlink - performance.now())))
        return
      }
      raf = requestAnimationFrame(tick)
    }

    function wakeUp() {
      if (running || disposed || document.visibilityState === 'hidden') return
      running = true
      lastT = performance.now()
      raf = requestAnimationFrame(tick)
    }

    // clic sur la tête → transformation en IA
    const onClick = (e: MouseEvent) => {
      if (aiStore.get().open || po < 0.5) return
      const size = base * ps
      const dx = e.clientX - px, dy = e.clientY - py
      if (dx * dx + dy * dy < (size * 0.4) ** 2) {
        const t = e.target as Element
        if (t.closest('a,button,input,textarea')) return
        openAI()
      }
    }
    addEventListener('click', onClick)

    const stopOff = onWake(wakeUp)
    const onVis = () => {
      if (document.visibilityState === 'hidden') { cancelAnimationFrame(raf); running = false }
      else wakeUp()
    }
    document.addEventListener('visibilitychange', onVis)

    let resizeRaf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRaf)
      resizeRaf = requestAnimationFrame(measure)
    })
    ro.observe(document.body)
    measure()
    computeTarget()
    px = target.x * vw
    py = target.y * vh

    const idle = (fn: () => void) =>
      'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 300)
    // Three.js chargé en différé, créé quand le navigateur est libre, shaders compilés en asynchrone
    import('./avatar')
      .then(({ createAvatar }) =>
        idle(async () => {
          if (disposed) return
          const a = createAvatar(canvas)
          a.resize(base, dpr)
          await a.warmup().catch(() => {})
          if (disposed) return a.dispose()
          avatar = a
          if (import.meta.env.DEV) (window as unknown as { __avatar: Avatar }).__avatar = a
          dirty = true
          wakeUp()
        }),
      )
      .catch(() => {})

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      cancelAnimationFrame(resizeRaf)
      clearTimeout(idleTimer)
      ro.disconnect()
      stopOff()
      removeEventListener('click', onClick)
      document.removeEventListener('visibilitychange', onVis)
      document.documentElement.style.cursor = ''
      avatar?.dispose()
      avatar = null
    }
  }, [])

  return (
    <div ref={layerRef} aria-hidden className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      <div ref={posRef} className="absolute top-0 left-0 opacity-0" style={{ willChange: 'transform, opacity' }}>
        {/* halo chaud (dégradé pré-calculé, pas de filter: blur) */}
        <div
          className="absolute -inset-[55%] -z-10"
          style={{
            background:
              'radial-gradient(closest-side, rgba(255,122,47,0.3), rgba(255,122,47,0.1) 45%, rgba(255,122,47,0.03) 70%, transparent)',
          }}
        />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        {/* bulle d'invitation */}
        <div className="absolute -top-[3%] left-1/2 -translate-x-1/2">
        <div
          ref={bubbleRef}
          className="origin-bottom rounded-2xl border border-ember/40 bg-ink-2/95 px-3.5 py-2 font-mono text-[11px] leading-tight whitespace-nowrap text-bone opacity-0 transition-[opacity,transform] duration-500 ease-out-expo"
          style={{ transform: 'translate3d(0,8px,0) scale(.92)' }}
        >
          <span className="text-ember">●</span> Clique-moi, je suis l’IA de Samy
        </div>
        </div>
      </div>
    </div>
  )
}
