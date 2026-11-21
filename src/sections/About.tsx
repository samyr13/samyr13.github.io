import { motion, useScroll, useSpring } from 'motion/react'
import { useRef } from 'react'
import { Reveal, ScrollText, SplitTitle } from '../components/ui/motion'
import { about, facts, journey } from '../data'
import { cn } from '../lib/cn'

export function Label({ n, children }: { n: string; children: string }) {
  return (
    <div className="mb-8 flex items-center gap-3 font-mono text-[12px] tracking-[0.18em] text-dust uppercase">
      <span className="text-ember">({n})</span>
      <span className="h-px w-10 bg-line" />
      {children}
    </div>
  )
}

export function About() {
  return (
    <section
      id="apropos"
      data-memoji="0.77,0.5,0.95,1"
      data-memoji-m="0.8,0.16,0.42,0"
      className="relative mx-auto flex min-h-[110vh] max-w-[1600px] items-center px-6 py-32 md:px-10 lg:pl-28"
    >
      <div className="w-full lg:w-[58%]">
        <Label n="01">À propos</Label>
        <ScrollText
          text={about}
          className="font-wide text-[clamp(1.6rem,2.75vw,3.1rem)] leading-[1.12] font-medium tracking-[-0.015em]"
        />
        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border hairline bg-line sm:grid-cols-3">
          {facts.map((f, i) => (
            <Reveal key={f.k} delay={i * 0.08} className="bg-ink p-6">
              <p className="font-mono text-[11px] tracking-[0.16em] text-dust uppercase">{f.k}</p>
              <p className="font-wide mt-3 text-2xl font-semibold">{f.v}</p>
              <p className="mt-1 text-sm text-dust">{f.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Journey() {
  const ref = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.75', 'end 0.6'] })
  const line = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })
  return (
    <section
      id="parcours"
      data-memoji="0.2,0.55,0.72,1"
      data-memoji-m="0.8,0.12,0.4,0"
      className="relative mx-auto max-w-[1600px] px-6 py-32 md:px-10 lg:pl-28"
    >
      <div className="lg:ml-[38%]">
        <Label n="02">Parcours</Label>
        <SplitTitle
          text="D’où je viens, où je vais."
          accent={['vais.']}
          className="font-wide mb-16 text-[clamp(2.4rem,5vw,5.4rem)] leading-[0.95] font-semibold tracking-[-0.02em]"
        />
        <div className="relative">
          <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-px bg-line" />
          <motion.span aria-hidden style={{ scaleY: line }} className="absolute top-2 bottom-2 left-[7px] w-px origin-top bg-ember" />
        <ol ref={ref} className="relative">
          {journey.map((j, i) => (
            <li key={i} className="relative pb-14 pl-12 last:pb-0">
              <span
                className={cn(
                  'absolute top-[9px] left-0 h-[15px] w-[15px] rounded-full border-2 border-ink',
                  j.highlight ? 'bg-ember shadow-[0_0_0_4px_rgba(255,122,47,0.18)]' : 'bg-ash',
                )}
              />
              <Reveal>
                <p className={cn('font-mono text-[12px] tracking-[0.16em] uppercase', j.highlight ? 'text-ember' : 'text-dust')}>
                  {j.when}
                </p>
                <h3 className="font-wide mt-2 text-[clamp(1.35rem,2vw,2rem)] font-semibold tracking-[-0.01em]">{j.title}</h3>
                <p className="mt-1 text-[15px] text-ember-2/80">{j.where}</p>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-dust">{j.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
        </div>
      </div>
    </section>
  )
}
