import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring } from 'motion/react'
import { profile } from '../data'
import { finePointer, onWake, openAI, pointer, scrollToId } from '../lib/runtime'
import { cn } from '../lib/cn'
import { AI_NAME } from '../ai/brain'
import { toggleShades } from './EasterEggs'

/* ---------------- Icônes ---------------- */
export const Icon = {
  github: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  ),
  linkedin: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  ),
  cv: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  ),
  mail: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  arrow: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  ),
  download: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className} aria-hidden>
      <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" />
    </svg>
  ),
}

const links = [
  { id: 'apropos', label: 'À propos' },
  { id: 'projets', label: 'Projets' },
  { id: 'competences', label: 'Compétences' },
  { id: 'contact', label: 'Contact' },
]

/* ---------------- Navigation ---------------- */
export function Nav() {
  const [copied, setCopied] = useState(false)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 })
  const copy = () => {
    navigator.clipboard?.writeText(profile.email).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="pointer-events-none absolute inset-0 -bottom-10 bg-gradient-to-b from-ink via-ink/70 to-transparent" />
      <nav className="relative mx-auto flex h-20 max-w-[1600px] items-center justify-between px-5 md:px-10">
        <div className="flex items-center gap-4">
          {/* triple-clic = easter egg (lunettes de soleil) */}
          <button
            onClick={(e) => (e.detail === 3 ? toggleShades() : e.detail === 1 && scrollToId('top'))}
            className="font-wide text-[15px] font-bold tracking-tight select-none"
            data-cursor="link"
          >
            samy<span className="text-ember">.</span>rachad
          </button>
          <button
            onClick={openAI}
            data-cursor="link"
            data-smile
            className="group hidden items-center gap-2 rounded-full border border-ember/40 py-1.5 pr-3.5 pl-3 font-mono text-[11.5px] text-ember transition-colors hover:bg-ember hover:text-ink sm:flex"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-ember/70 group-hover:bg-ink/60" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-ember group-hover:bg-ink" />
            </span>
            Parler à {AI_NAME}
          </button>
        </div>
        <button
          onClick={copy}
          data-cursor="link"
          className="absolute left-1/2 hidden -translate-x-1/2 font-mono text-[13px] text-bone/80 transition-colors hover:text-ember lg:block"
          aria-label={`${profile.email} — copier l’adresse`}
        >
          <span className="relative inline-block">
            <span className={cn('transition-opacity duration-300', copied && 'opacity-0')}>{profile.email}</span>
            <span className={cn('absolute inset-0 text-center text-ember opacity-0 transition-opacity duration-300', copied && 'opacity-100')}>
              Copié ✓
            </span>
          </span>
        </button>
        <ul className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  scrollToId(l.id)
                }}
                data-cursor="link"
                className="group relative font-wide text-[13px] font-semibold tracking-[0.08em] uppercase"
              >
                {l.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-full origin-right scale-x-0 bg-ember transition-transform duration-500 ease-out-expo group-hover:origin-left group-hover:scale-x-100" />
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={openAI}
            className="rounded-full bg-ember px-4 py-2 font-wide text-[12px] font-semibold tracking-[0.06em] text-ink uppercase sm:hidden"
          >
            IA
          </button>
          <a
            href={profile.cv}
            download
            data-smile
            data-cursor="link"
            className="rounded-full border border-bone/20 px-4 py-2 font-wide text-[12px] font-semibold tracking-[0.08em] uppercase transition-colors hover:border-ember hover:text-ember"
          >
            CV
          </a>
        </div>
      </nav>
      <motion.div style={{ scaleX: progress }} className="absolute inset-x-0 top-0 h-[2px] origin-left bg-ember" />
    </header>
  )
}

/* ---------------- Rail social (gauche, comme la référence) ---------------- */
export function SocialRail() {
  const items = [
    { href: profile.github, label: 'GitHub', icon: Icon.github },
    ...(profile.linkedin ? [{ href: profile.linkedin, label: 'LinkedIn', icon: Icon.linkedin }] : []),
    { href: profile.cv, label: 'Télécharger mon CV', icon: Icon.cv, download: true },
    { href: `mailto:${profile.email}`, label: 'Email', icon: Icon.mail },
  ]
  return (
    <aside className="fixed bottom-8 left-6 z-40 hidden flex-col items-center gap-6 md:flex lg:left-10">
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target={it.download ? undefined : '_blank'}
          rel="noreferrer"
          download={it.download || undefined}
          aria-label={it.label}
          title={it.label}
          data-cursor="link"
          data-smile
          className="text-bone/70 transition-[color,transform] duration-300 hover:-translate-y-0.5 hover:text-ember"
        >
          <it.icon className="h-[22px] w-[22px]" />
        </a>
      ))}
      <span className="h-16 w-px bg-gradient-to-b from-bone/30 to-transparent" />
    </aside>
  )
}

/* ---------------- Curseur (point + anneau, transform uniquement) ---------------- */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!finePointer) return
    let rx = pointer.x, ry = pointer.y, rs = 1, raf = 0, running = false, shown = false
    const loop = () => {
      const target = pointer.hover ? 2.1 : 1
      rx += (pointer.x - rx) * 0.2
      ry += (pointer.y - ry) * 0.2
      rs += (target - rs) * 0.18
      dot.current!.style.transform = `translate3d(${pointer.x}px,${pointer.y}px,0)`
      ring.current!.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0) scale(${rs.toFixed(3)})`
      if (Math.abs(pointer.x - rx) + Math.abs(pointer.y - ry) < 0.2 && Math.abs(target - rs) < 0.002) {
        running = false
        return
      }
      raf = requestAnimationFrame(loop)
    }
    const off = onWake(() => {
      if (!shown && pointer.lastMove > 0) {
        shown = true
        dot.current!.style.opacity = ring.current!.style.opacity = '1'
      }
      if (!running && document.visibilityState === 'visible') {
        running = true
        raf = requestAnimationFrame(loop)
      }
    })
    return () => {
      off()
      cancelAnimationFrame(raf)
    }
  }, [])
  if (!finePointer) return null
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
      <div ref={dot} className="absolute top-0 left-0 -mt-[3px] -ml-[3px] h-1.5 w-1.5 rounded-full bg-ember opacity-0" />
      <div ref={ring} className="absolute top-0 left-0 -mt-4 -ml-4 h-8 w-8 rounded-full border border-ember/50 opacity-0 transition-opacity duration-300" />
    </div>
  )
}
