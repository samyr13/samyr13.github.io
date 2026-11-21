import { motion } from 'motion/react'
import { EmberField } from '../components/EmberField'
import { profile } from '../data'
import { AI_NAME } from '../ai/brain'
import { openAI, reducedMotion, scrollToId } from '../lib/runtime'

const EASE = [0.16, 1, 0.3, 1] as const

function Line({ children, delay, className }: { children: string; delay: number; className?: string }) {
  return (
    <span className="block overflow-hidden pb-[0.06em]">
      <motion.span
        className={`block ${className ?? ''}`}
        initial={{ y: reducedMotion ? 0 : '105%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 1.2, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  )
}

export function Hero() {
  return (
    <section
      id="top"
      data-memoji="0.5,0.54,1.02,1"
      data-memoji-m="0.5,0.47,1.05,1"
      className="relative h-[100svh] min-h-[620px] overflow-hidden"
    >
      <div className="absolute inset-0">
        <EmberField />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />

      <div className="font-wide relative mx-auto grid h-full max-w-[1600px] grid-rows-[1fr_auto_1fr] items-center px-6 md:px-10 lg:grid-cols-[1fr_minmax(0,33vw)_1fr] lg:grid-rows-1 lg:px-28">
        {/* gauche : nom */}
        <div className="self-end pb-2 lg:self-center lg:pb-0">
          <Line delay={0.15} className="text-[clamp(1.1rem,1.8vw,1.9rem)] font-light text-ember">
            Salut ! Moi c’est
          </Line>
          <h1 className="mt-1 text-[clamp(3rem,6.4vw,7.4rem)] leading-[0.9] font-semibold tracking-[-0.02em] uppercase">
            <Line delay={0.25}>{profile.firstName}</Line>
            <Line delay={0.35}>{profile.lastName}</Line>
          </h1>
        </div>

        <div className="h-[min(62vw,280px)] lg:h-auto" />

        {/* droite : rôle */}
        <motion.div
          className="self-start text-right lg:self-center lg:pl-6 lg:text-left"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.5 }}
        >
          <p className="text-[clamp(1.1rem,1.8vw,1.9rem)] font-light text-ember">Passionné par les</p>
          <p className="mt-1 text-[clamp(2rem,3.5vw,4.6rem)] leading-[0.95] font-semibold uppercase [font-variation-settings:'wdth'_80]">
            Nouvelles
            <br />
            technologies
          </p>
          <p className="mt-2 text-[clamp(1.1rem,1.8vw,1.9rem)] font-light text-bone/80">
            &amp; le développement d’<span className="text-ember">IA</span>
          </p>
          <p className="mt-5 font-mono text-[12px] tracking-wide text-dust uppercase">
            CESI Pau · Stage {profile.internship.from.split(' ').slice(1).join(' ')} → {profile.internship.to.split(' ').slice(1).join(' ')}
          </p>
          <button
            onClick={openAI}
            data-cursor="link"
            data-smile
            className="group mt-6 inline-flex items-center gap-2.5 rounded-full border border-ember/50 py-2 pr-4 pl-3 font-mono text-[12px] text-ember transition-colors hover:bg-ember hover:text-ink"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ember group-hover:bg-ink" />
            Parler à {AI_NAME}, mon IA →
          </button>
        </motion.div>
      </div>

      <motion.button
        onClick={() => scrollToId('apropos')}
        data-cursor="link"
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col md:flex items-center gap-3 font-mono text-[11px] tracking-[0.2em] text-dust uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 1 }}
      >
        Défiler
        <span className="relative h-10 w-px overflow-hidden bg-bone/15">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[drip_2.2s_var(--ease-out-quart)_infinite] bg-ember" />
        </span>
      </motion.button>
      <style>{`@keyframes drip{0%{transform:translateY(-100%)}100%{transform:translateY(220%)}}`}</style>
    </section>
  )
}
