import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useSyncExternalStore } from 'react'
import { EGGS, eggStore, findEgg, openAI } from '../lib/runtime'

/**
 * Easter eggs :
 * 1. Code Konami (↑ ↑ ↓ ↓ ← → ← → B A) → l'avatar fait un salto
 * 2. Triple-clic sur le logo → lunettes de soleil (voir Nav)
 * 3. Taper « jarvis » n'importe où → l'IA s'active
 * + un message pour les curieux dans la console
 */
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a']

export function toggleShades() {
  const on = !eggStore.get().shades
  eggStore.set({ shades: on })
  if (on) findEgg('shades', '😎 Mode stylé activé')
}

export function EasterEggs() {
  const toast = useSyncExternalStore(eggStore.subscribe, () => eggStore.get().toast)

  useEffect(() => {
    let k = 0
    let typed = ''
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input,textarea,[contenteditable]')) return
      const key = e.key.toLowerCase()
      k = key === KONAMI[k] ? k + 1 : key === KONAMI[0] ? 1 : 0
      if (k === KONAMI.length) {
        k = 0
        eggStore.set({ spinAt: performance.now() })
        findEgg('konami', '🎮 Code Konami : salto !')
      }
      if (key.length === 1) {
        typed = (typed + key).slice(-6)
        if (typed === 'jarvis') {
          typed = ''
          openAI()
          findEgg('jarvis', '🤖 Mot de passe accepté')
        }
      }
    }
    addEventListener('keydown', onKey)

    console.log(
      '%c samy.rachad %c Tu lis la console ? On devrait travailler ensemble 👀\n%c3 easter eggs sont cachés sur ce site. Indice : les vieux codes de jeux vidéo, un logo qui aime les clics, et un célèbre assistant d’Iron Man.',
      'background:#ff7a2f;color:#0a0807;font-weight:700;padding:4px 8px;border-radius:6px',
      'color:#ff7a2f;font-weight:600',
      'color:#9b9088',
    )
    return () => removeEventListener('keydown', onKey)
  }, [])

  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-[80] -translate-x-1/2">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-full border border-ember/40 bg-ink-2/95 px-5 py-2.5 font-mono text-[12.5px] whitespace-nowrap text-bone shadow-[0_10px_40px_-10px_rgba(255,122,47,0.4)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Compteur discret pour le footer */
export function EggCounter() {
  const found = useSyncExternalStore(eggStore.subscribe, () => eggStore.get().found)
  return (
    <span title="Indice : regardez dans la console 👀">
      Easter eggs {found.length}/{EGGS.length}
    </span>
  )
}
