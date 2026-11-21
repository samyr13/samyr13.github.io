import { useState } from 'react'
import { Icon } from '../components/Chrome'
import { EggCounter } from '../components/EasterEggs'
import { Magnetic, Reveal, SplitTitle } from '../components/ui/motion'
import { profile } from '../data'
import { cn } from '../lib/cn'
import { scrollToId } from '../lib/runtime'

/** Anneau de texte qui tourne autour du Memoji (CSS transform, mis en pause hors écran par le navigateur) */
function Ring() {
  const text = 'Disponible pour un stage · Avril → Juillet 2027 · '
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full animate-[spin_28s_linear_infinite]" aria-hidden>
      <defs>
        <path id="ring" d="M100,100 m-84,0 a84,84 0 1,1 168,0 a84,84 0 1,1 -168,0" />
      </defs>
      <text className="fill-bone/45 font-mono" fontSize="9">
        <textPath href="#ring" textLength="526" lengthAdjust="spacing">{text.toUpperCase()}</textPath>
      </text>
    </svg>
  )
}

export function Contact() {
  const [copied, setCopied] = useState(false)
  const copy = () =>
    navigator.clipboard?.writeText(profile.email).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  const btn =
    'inline-flex items-center gap-3 rounded-full px-6 py-3.5 font-wide text-[14px] font-semibold transition-colors duration-300'
  return (
    <section
      id="contact"
      data-memoji="0.5,0.3,0.68,1"
      data-memoji-m="0.5,0.24,0.72,1"
      className="relative flex min-h-[100svh] flex-col overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(60%_70%_at_50%_100%,rgba(255,122,47,0.16),transparent_70%)]"
      />
      {/* anneau centré sur l'ancre du Memoji (30 % de la hauteur) */}
      <div className="pointer-events-none absolute top-[30svh] left-1/2 aspect-square w-[min(80vw,43vh)] -translate-x-1/2 -translate-y-1/2">
        <Ring />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col items-center justify-end px-6 pt-[56svh] pb-10 text-center md:px-10">
        <p className="mb-5 font-mono text-[12px] tracking-[0.18em] text-ember uppercase">(06) Contact</p>
        <SplitTitle
          as="h2"
          text="Un stage ? Parlons-en."
          accent={['Parlons-en.']}
          className="font-wide justify-center text-[clamp(2.6rem,7vw,8rem)] leading-[0.92] font-semibold tracking-[-0.03em]"
        />
        <Reveal delay={0.15}>
          <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-dust">
            {profile.internship.label}, du {profile.internship.from} au {profile.internship.to}. Je suis disponible pour échanger quand vous voulez.
          </p>
        </Reveal>
        <Reveal delay={0.25} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <button onClick={copy} data-smile data-cursor="link" className={cn(btn, 'bg-ember text-ink hover:bg-ember-2')}>
              <Icon.mail className="h-5 w-5" />
              <span className="relative">
                <span className={cn('transition-opacity', copied && 'opacity-0')}>{profile.email}</span>
                <span className={cn('absolute inset-0 opacity-0 transition-opacity', copied && 'opacity-100')}>Adresse copiée ✓</span>
              </span>
            </button>
          </Magnetic>
          <Magnetic>
            <a href={profile.cv} download data-smile data-cursor="link" className={cn(btn, 'border border-bone/20 hover:border-ember hover:text-ember')}>
              <Icon.download className="h-5 w-5" /> Télécharger mon CV
            </a>
          </Magnetic>
          <Magnetic>
            <a href={profile.github} target="_blank" rel="noreferrer" data-smile data-cursor="link" className={cn(btn, 'border border-bone/20 hover:border-ember hover:text-ember')}>
              <Icon.github className="h-5 w-5" /> GitHub
            </a>
          </Magnetic>
          {profile.linkedin && (
            <Magnetic>
              <a href={profile.linkedin} target="_blank" rel="noreferrer" data-smile data-cursor="link" className={cn(btn, 'border border-bone/20 hover:border-ember hover:text-ember')}>
                <Icon.linkedin className="h-5 w-5" /> LinkedIn
              </a>
            </Magnetic>
          )}
        </Reveal>

        <footer className="mt-[8svh] flex w-full flex-col items-center justify-between gap-4 border-t hairline pt-6 font-mono text-[11px] tracking-[0.12em] text-dust uppercase md:flex-row">
          <span>© {new Date().getFullYear()} Samy Rachad · {profile.city}</span>
          <span>Conçu &amp; développé par Samy Rachad · <EggCounter /></span>
          <button onClick={() => scrollToId('top')} data-cursor="link" className="transition-colors hover:text-ember">
            Retour en haut ↑
          </button>
        </footer>
      </div>
    </section>
  )
}
