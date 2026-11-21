import Lenis from 'lenis'

/** État global lu dans les boucles rAF : aucune re-render React. */
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches

export const pointer = {
  x: innerWidth / 2,
  y: innerHeight * 0.4,
  lastMove: -1e9,
  /** > 0 quand le pointeur survole un élément [data-smile] */
  smile: 0,
  /** élément [data-cursor] survolé (pour le curseur) */
  hover: '' as string,
}

const listeners = new Set<() => void>()
/** Réveille les boucles endormies (Memoji, curseur) */
export const onWake = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export const wake = () => listeners.forEach((fn) => fn())

addEventListener(
  'pointermove',
  (e) => {
    if (e.pointerType === 'touch') return
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.lastMove = performance.now()
    wake()
  },
  { passive: true },
)

addEventListener(
  'pointerover',
  (e) => {
    const t = e.target as Element | null
    pointer.smile = t?.closest?.('[data-smile]') ? 1 : 0
    pointer.hover = (t?.closest?.('[data-cursor]') as HTMLElement | null)?.dataset.cursor ?? ''
    wake()
  },
  { passive: true },
)
document.addEventListener('pointerleave', () => {
  pointer.smile = 0
  pointer.hover = ''
  wake()
})

export let lenis: Lenis | null = null
export function initScroll() {
  if (reducedMotion || lenis) return lenis
  lenis = new Lenis({ autoRaf: true, lerp: 0.085, smoothWheel: true, anchors: { offset: 0 } })
  lenis.on('scroll', wake)
  return lenis
}
addEventListener('scroll', wake, { passive: true })

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { duration: 1.4 })
  else el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
}

/* ---------------- Petits stores partagés (lus par la boucle rAF sans re-render) ---------------- */
type Listener = () => void
function createStore<T extends object>(init: T) {
  let state = init
  const ls = new Set<Listener>()
  return {
    get: () => state,
    set: (patch: Partial<T>) => {
      state = { ...state, ...patch }
      ls.forEach((l) => l())
      wake()
    },
    subscribe: (l: Listener) => {
      ls.add(l)
      return () => {
        ls.delete(l)
      }
    },
  }
}

/** IA du site : ouverte ? en train de parler ? */
export const aiStore = createStore({ open: false, talking: false })
export function openAI() {
  if (aiStore.get().open) return
  lenis?.stop()
  aiStore.set({ open: true })
}
export function closeAI() {
  lenis?.start()
  aiStore.set({ open: false, talking: false })
}

/** Easter eggs */
export const EGGS = ['konami', 'shades', 'jarvis'] as const
export type Egg = (typeof EGGS)[number]
const readFound = (): Egg[] => {
  try {
    return JSON.parse(localStorage.getItem('eggs') || '[]')
  } catch {
    return []
  }
}
export const eggStore = createStore({ found: readFound(), spinAt: -1e9, shades: false, toast: '' })
let toastTimer = 0
export function findEgg(egg: Egg, message: string) {
  const s = eggStore.get()
  const found = s.found.includes(egg) ? s.found : [...s.found, egg]
  try {
    localStorage.setItem('eggs', JSON.stringify(found))
  } catch {
    /* stockage indisponible : pas grave */
  }
  eggStore.set({ found, toast: `${message} · ${found.length}/${EGGS.length} easter eggs` })
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => eggStore.set({ toast: '' }), 3600)
}
