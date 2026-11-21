import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { aiStore, closeAI } from '../lib/runtime'
import { cn } from '../lib/cn'
import { AI_NAME, demoAnswer, detectOllama, ollamaChat, suggestions, type Msg } from './brain'

const EASE = [0.16, 1, 0.3, 1] as const

/** Panneau de discussion avec l'IA (l'avatar 3D se transforme et se place à côté) */
export function AIChat() {
  const open = useSyncExternalStore(aiStore.subscribe, () => aiStore.get().open)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [model, setModel] = useState<string | null | undefined>(undefined)
  const [voice, setVoice] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const typingRef = useRef(0)

  // à l'ouverture : message d'accueil + détection d'Ollama (local uniquement)
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 500)
    if (model === undefined) detectOllama().then(setModel)
    if (!msgs.length) say({ content: `Système en ligne. Je suis ${AI_NAME}, l’IA personnelle de Samy. Que voulez-vous savoir sur lui ?` }, 700)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  const close = () => {
    abortRef.current?.abort()
    clearInterval(typingRef.current)
    speechSynthesis?.cancel()
    setBusy(false)
    closeAI()
  }

  const speak = (text: string) => {
    if (!voice || !('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text.replace(/[*_#]/g, ''))
    u.lang = 'fr-FR'
    u.rate = 1.05
    u.pitch = 0.9
    speechSynthesis.cancel()
    speechSynthesis.speak(u)
  }

  /** Affiche une réponse en "tapant" (la bouche de l'avatar bouge pendant ce temps) */
  const say = (m: Omit<Msg, 'role'>, delay = 350) => {
    setBusy(true)
    setTimeout(() => {
      aiStore.set({ talking: true })
      setMsgs((p) => [...p, { role: 'assistant', content: '', action: m.action }])
      let i = 0
      clearInterval(typingRef.current)
      typingRef.current = window.setInterval(() => {
        i = Math.min(m.content.length, i + 3)
        setMsgs((p) => {
          const c = p.slice()
          c[c.length - 1] = { ...c[c.length - 1], content: m.content.slice(0, i) }
          return c
        })
        if (i >= m.content.length) {
          clearInterval(typingRef.current)
          aiStore.set({ talking: false })
          setBusy(false)
          speak(m.content)
        }
      }, 22)
    }, delay)
  }

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || busy) return
    setInput('')
    const history: Msg[] = [...msgs, { role: 'user', content: q }]
    setMsgs(history)
    if (!model) return say(demoAnswer(q))

    // vrai modèle local via Ollama (streaming)
    setBusy(true)
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setMsgs((p) => [...p, { role: 'assistant', content: '' }])
    aiStore.set({ talking: true })
    let full = ''
    try {
      for await (const chunk of ollamaChat(model, history.slice(-10), ctrl.signal)) {
        full += chunk
        setMsgs((p) => {
          const c = p.slice()
          c[c.length - 1] = { role: 'assistant', content: full }
          return c
        })
      }
      speak(full)
    } catch {
      if (!ctrl.signal.aborted) {
        setMsgs((p) => p.slice(0, -1))
        setModel(null)
        aiStore.set({ talking: false })
        setBusy(false)
        return say(demoAnswer(q))
      }
    }
    aiStore.set({ talking: false })
    setBusy(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* voile */}
          <motion.div
            key="veil"
            className="fixed inset-0 z-[55] bg-ink/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={close}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_50%_at_30%_50%,rgba(255,122,47,0.14),transparent_70%)]" />
            {/* grille HUD discrète */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,179,107,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,179,107,.6)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(50%_60%_at_30%_50%,#000,transparent)]" />
            <p className="absolute bottom-8 left-8 hidden font-mono text-[11px] tracking-[0.2em] text-ember/70 uppercase md:block">
              {AI_NAME} · {model ? `Ollama · ${model}` : 'mode démo'} · Échap pour fermer
            </p>
          </motion.div>

          {/* panneau */}
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={`Discuter avec ${AI_NAME}, l’IA de Samy`}
            data-lenis-prevent
            className="fixed z-[57] flex flex-col overflow-hidden border border-ember/25 bg-ink-2/95 shadow-[0_0_0_1px_rgba(255,122,47,0.05),0_30px_80px_-20px_rgba(0,0,0,0.8)] max-md:inset-x-3 max-md:top-[34svh] max-md:bottom-3 max-md:rounded-[24px] md:top-1/2 md:right-[6vw] md:h-[min(640px,80vh)] md:w-[min(460px,40vw)] md:-translate-y-1/2 md:rounded-[28px]"
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.98 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
          >
            <header className="flex items-center justify-between border-b border-ember/15 px-5 py-4">
              <div>
                <p className="font-wide flex items-center gap-2 text-[15px] font-semibold tracking-wide">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-ember/60" />
                    <span className="relative h-2 w-2 rounded-full bg-ember" />
                  </span>
                  {AI_NAME}
                </p>
                <p className="mt-0.5 font-mono text-[10.5px] tracking-[0.12em] text-dust uppercase">
                  {model ? `Connecté à Ollama · ${model}` : model === null ? 'Mode démo · la version complète tourne sous Ollama' : 'Initialisation…'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {'speechSynthesis' in window && (
                  <button
                    onClick={() => setVoice((v) => !v)}
                    className={cn('rounded-full px-3 py-1.5 font-mono text-[11px] transition-colors', voice ? 'bg-ember text-ink' : 'text-dust hover:text-bone')}
                    aria-pressed={voice}
                    title="Lire les réponses à voix haute"
                  >
                    {voice ? 'Voix on' : 'Voix off'}
                  </button>
                )}
                <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full text-dust transition-colors hover:bg-bone/10 hover:text-bone" aria-label="Fermer">
                  ✕
                </button>
              </div>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-5">
              {msgs.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-line',
                      m.role === 'user' ? 'rounded-br-md bg-ember text-ink' : 'rounded-bl-md border border-line bg-ink-3/70 text-bone',
                    )}
                  >
                    {m.content || <span className="inline-flex gap-1 py-1">{[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ember" style={{ animationDelay: `${d * 120}ms` }} />)}</span>}
                    {m.action && m.content && (
                      <a
                        href={m.action.href}
                        target={m.action.href.startsWith('http') ? '_blank' : undefined}
                        rel="noreferrer"
                        download={m.action.download || undefined}
                        className="mt-2.5 flex w-fit items-center gap-1.5 rounded-full border border-ember/40 px-3 py-1 font-mono text-[11.5px] text-ember transition-colors hover:bg-ember hover:text-ink"
                      >
                        {m.action.label} ↗
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-ember/15 px-4 pt-3 pb-4">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={busy}
                    className="shrink-0 rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-dust transition-colors hover:border-ember hover:text-ember disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send(input)
                }}
                className="flex items-center gap-2 rounded-full border border-line bg-ink/60 py-1.5 pr-1.5 pl-4 focus-within:border-ember/60"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Posez une question à ${AI_NAME}…`}
                  className="min-w-0 flex-1 bg-transparent text-[14.5px] text-bone placeholder:text-ash focus:outline-none"
                  aria-label="Votre message"
                  maxLength={400}
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ember text-ink transition-opacity disabled:opacity-30"
                  aria-label="Envoyer"
                >
                  ↑
                </button>
              </form>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
