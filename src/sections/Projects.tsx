import { motion, useScroll, useTransform } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../components/Chrome'
import { Reveal, SplitTitle, TiltCard } from '../components/ui/motion'
import { projects, type Project } from '../data'
import { openAI } from '../lib/runtime'
import { Label } from './About'

/* Visuels codés pour les projets sans capture (aucune image à charger) */
function WeatherVisual() {
  const rows = [
    ['TEMP', '18.4 °C'],
    ['HUMIDITÉ', '72 %'],
    ['PRESSION', '1013 hPa'],
    ['LUMIÈRE', '640 lx'],
    ['GPS', '43.30N 0.37W'],
  ]
  return (
    <div className="relative flex h-full w-full flex-col justify-between bg-[radial-gradient(120%_80%_at_80%_0%,#2a1a10,#0d0b0a_60%)] p-6 font-mono text-[12px] text-bone/80">
      <div className="flex items-center justify-between text-dust">
        <span>STM32 · NUCLEO-L476RG</span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#9be3a0]" /> MODE STANDARD
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between border-b border-line pb-2">
            <span className="text-dust">{k}</span>
            <span className="text-ember-2">{v}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-ash">BME280 · I2C 0x76 — mesure horodatée · exemple d’affichage</p>
    </div>
  )
}
/* Visuel du projet IA : terminal Ollama + onde de voix (CSS transform uniquement) */
function AIVisual() {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[radial-gradient(90%_80%_at_70%_30%,#3a1a0a,#0d0b0a_65%)] p-6 font-mono text-[12px]">
      <div className="flex items-center justify-between text-dust">
        <span>~/ia-perso</span>
        <span className="flex items-center gap-2 text-ember">
          <span className="h-2 w-2 animate-pulse rounded-full bg-ember" /> EN COURS
        </span>
      </div>
      <div className="flex h-20 items-center justify-center gap-[5px]">
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className="w-[4px] origin-center rounded-full bg-gradient-to-t from-ember-deep to-ember-2"
            style={{ height: '100%', animation: `wave 1.4s ease-in-out ${(i % 7) * -0.17 - i * 0.03}s infinite` }}
          />
        ))}
      </div>
      <div className="space-y-1 text-bone/85">
        <p><span className="text-dust">$</span> ollama serve</p>
        <p><span className="text-ember">›</span> Bonjour Samy. Que puis-je faire pour vous ?</p>
      </div>
      <style>{`@keyframes wave{0%,100%{transform:scaleY(.15)}50%{transform:scaleY(1)}}`}</style>
    </div>
  )
}

function ArcadeVisual() {
  return (
    <div className="flex h-full w-full flex-col bg-[#0c0a09] p-6 font-mono text-[12.5px] leading-relaxed">
      <div className="mb-4 flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </div>
      <p className="text-dust">$ ./plus_ou_moins</p>
      <p>Devinez le nombre (1 – 100) : <span className="text-ember-2">50</span></p>
      <p className="text-ember">→ Plus petit !</p>
      <p>Devinez le nombre (1 – 100) : <span className="text-ember-2">25</span></p>
      <p className="text-ember">→ Plus grand !</p>
      <p>Devinez le nombre (1 – 100) : <span className="text-ember-2">37</span></p>
      <p className="text-[#9be3a0]">✓ Trouvé en 3 coups.</p>
      <p className="mt-auto text-dust">
        $ <span className="inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-bone/80" />
      </p>
    </div>
  )
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <article className="group flex h-full flex-col">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <span className="font-wide text-[clamp(2.2rem,3vw,3.2rem)] leading-none font-semibold text-bone/90">{p.index}</span>
        <div className="text-right">
          <p className="font-wide text-[15px] font-semibold">{p.title}</p>
          <p className="font-mono text-[11px] tracking-[0.12em] text-dust uppercase">{p.kind}</p>
        </div>
      </div>
      <TiltCard className="aspect-[16/10] w-full">
        <div className="absolute inset-0 rounded-[28px] border hairline bg-ink-2" />
        {p.image ? (
          <img
            src={p.image}
            srcSet={`${p.image.replace('.webp', '-720.webp')} 720w, ${p.image} 1200w`}
            sizes="(min-width: 1024px) min(40vw, 640px), 92vw"
            alt={`Aperçu du projet ${p.title}`}
            loading="lazy"
            decoding="async"
            width={1200}
            height={750}
            className={`absolute inset-0 h-full w-full rounded-[28px] ${p.fit === 'contain' ? 'bg-[#0b0d12] object-contain' : 'object-cover object-top'} transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.04]`}
          />
        ) : (
          <div className="absolute inset-0 overflow-hidden rounded-[28px]">{p.visual === 'weather' ? <WeatherVisual /> : p.visual === 'ai' ? <AIVisual /> : <ArcadeVisual />}</div>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-bone/10 ring-inset" />
      </TiltCard>
      <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-dust">{p.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {p.tags.map((t) => (
          <span key={t} className="rounded-full border hairline px-3 py-1 font-mono text-[11px] text-bone/75">
            {t}
          </span>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-5">
        {p.demo && (
          <button
            onClick={openAI}
            data-cursor="link"
            data-smile
            className="group/l inline-flex items-center gap-2 rounded-full bg-ember px-4 py-2 font-wide text-[13px] font-semibold tracking-[0.04em] text-ink uppercase transition-colors hover:bg-ember-2"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink" /> Lui parler
          </button>
        )}
        {p.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            data-cursor="link"
            data-smile
            className="group/l inline-flex items-center gap-1.5 font-wide text-[13px] font-semibold tracking-[0.06em] uppercase transition-colors hover:text-ember"
          >
            {l.label}
            <Icon.arrow className="h-4 w-4 transition-transform duration-300 group-hover/l:translate-x-0.5 group-hover/l:-translate-y-0.5" />
          </a>
        ))}
      </div>
    </article>
  )
}

function Intro() {
  return (
    <div className="flex h-full flex-col justify-center">
      <Label n="03">Projets</Label>
      <SplitTitle
        text="Ce que j’ai construit."
        accent={['construit.']}
        className="font-wide text-[clamp(2.6rem,5.4vw,6rem)] leading-[0.92] font-semibold tracking-[-0.02em]"
      />
      <Reveal delay={0.2}>
        <p className="mt-8 max-w-md text-[16px] leading-relaxed text-dust">
          J’aime fonder des projets avec les nouvelles technologies. De la cybersécurité au système embarqué, des projets concrets menés seul ou en équipe — du besoin jusqu’à la mise en ligne.
        </p>
        <p className="mt-10 hidden items-center gap-3 font-mono text-[12px] tracking-[0.18em] text-ember uppercase lg:flex">
          Défilez <span className="h-px w-12 bg-ember" /> →
        </p>
      </Reveal>
    </div>
  )
}

/** Desktop : galerie horizontale épinglée pilotée par le scroll vertical. Mobile : pile verticale. */
export function Projects() {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)
  const [desktop, setDesktop] = useState(() => matchMedia('(min-width: 1024px)').matches)

  useLayoutEffect(() => {
    const mq = matchMedia('(min-width: 1024px)')
    const onMq = () => setDesktop(mq.matches)
    mq.addEventListener('change', onMq)
    const ro = new ResizeObserver(() => {
      if (track.current) setDist(Math.max(0, track.current.scrollWidth - innerWidth))
    })
    if (track.current) ro.observe(track.current)
    return () => {
      ro.disconnect()
      mq.removeEventListener('change', onMq)
    }
  }, [desktop])

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist])

  if (!desktop) {
    return (
      <section id="projets" data-memoji="0.84,0.12,0.4,0" data-memoji-m="0.84,0.905,0.32,1" className="relative px-6 py-28 md:px-10">
        <Intro />
        <div className="mt-16 flex flex-col gap-20">
          {projects.map((p) => (
            <Reveal key={p.id}>
              <ProjectCard p={p} />
            </Reveal>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section
      id="projets"
      ref={section}
      data-memoji="0.1,0.885,0.27,1,0.86"
      data-memoji-m="0.84,0.905,0.32,1"
      className="relative"
      style={{ height: `calc(100vh + ${dist}px)` }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden pb-[8vh]">
        <motion.div ref={track} style={{ x }} className="flex h-[74vh] items-stretch gap-[6vw] pr-[10vw] pl-28 will-change-transform">
          <div className="w-[min(34vw,520px)] shrink-0">
            <Intro />
          </div>
          {projects.map((p) => (
            <div key={p.id} className="flex w-[min(40vw,640px)] shrink-0 items-center">
              <ProjectCard p={p} />
            </div>
          ))}
        </motion.div>
        <ProgressBar progress={scrollYProgress} />
      </div>
    </section>
  )
}

function ProgressBar({ progress }: { progress: ReturnType<typeof useScroll>['scrollYProgress'] }) {
  return (
    <div className="absolute bottom-[11.5vh] left-28 right-[10vw] h-px bg-line">
      <motion.div style={{ scaleX: progress }} className="h-full origin-left bg-ember" />
    </div>
  )
}
