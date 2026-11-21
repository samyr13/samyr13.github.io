import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useRef, type ReactNode, type PointerEvent } from 'react'
import { cn } from '../../lib/cn'
import { finePointer, reducedMotion } from '../../lib/runtime'

const EASE = [0.16, 1, 0.3, 1] as const

/** Apparition douce au scroll (opacity + translateY uniquement) */
export function Reveal({ children, className, delay = 0, y = 28 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reducedMotion ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/** Titre dont chaque mot remonte depuis un masque */
export function SplitTitle({ text, className, as = 'h2', delay = 0, accent }: { text: string; className?: string; as?: 'h1' | 'h2' | 'h3' | 'p'; delay?: number; accent?: string[] }) {
  const Tag = motion[as]
  const words = text.split(' ')
  return (
    <Tag
      className={cn('flex flex-wrap', className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ staggerChildren: 0.06, delayChildren: delay }}
    >
      {words.map((w, i) => (
        <span key={i} className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] pr-[0.26em] last:pr-0">
          <motion.span
            className={cn('inline-block', accent?.includes(w) && 'text-ember')}
            variants={{
              hidden: { y: reducedMotion ? 0 : '110%', opacity: reducedMotion ? 0 : 1 },
              show: { y: '0%', opacity: 1, transition: { duration: 1, ease: EASE } },
            }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

/** Paragraphe dont les mots s'allument au fil du scroll */
export function ScrollText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const words = text.split(' ')
  return (
    <p ref={ref} className={cn('flex flex-wrap', className)}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {w}
        </Word>
      ))}
    </p>
  )
}
function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.2, 1])
  return (
    <motion.span style={{ opacity: reducedMotion ? 1 : opacity }} className="mr-[0.28em] inline-block">
      {children}
    </motion.span>
  )
}

/** Bouton magnétique (translate uniquement, ressort) */
export function Magnetic({ children, className, strength = 0.35 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, { stiffness: 220, damping: 18, mass: 0.6 })
  const y = useSpring(0, { stiffness: 220, damping: 18, mass: 0.6 })
  const rect = useRef<DOMRect | null>(null)
  const enter = () => (rect.current = ref.current!.getBoundingClientRect())
  const move = (e: PointerEvent) => {
    if (!finePointer || !rect.current) return
    const r = rect.current
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const leave = () => {
    x.set(0)
    y.set(0)
  }
  return (
    <motion.div ref={ref} style={{ x, y }} onPointerEnter={enter} onPointerMove={move} onPointerLeave={leave} className={cn('inline-block', className)}>
      {children}
    </motion.div>
  )
}

/** Carte avec inclinaison 3D + reflet qui suit le pointeur */
export function TiltCard({ children, className, max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const rect = useRef<DOMRect | null>(null)
  const rx = useSpring(0, { stiffness: 160, damping: 18 })
  const ry = useSpring(0, { stiffness: 160, damping: 18 })
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const shineX = useTransform(gx, (v) => `${v - 50}%`)
  const shineY = useTransform(gy, (v) => `${v - 50}%`)
  const shineO = useSpring(0, { stiffness: 200, damping: 30 })
  const enter = () => {
    rect.current = ref.current!.getBoundingClientRect()
    shineO.set(1)
  }
  const move = (e: PointerEvent) => {
    if (!finePointer || !rect.current) return
    const r = rect.current
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * max * 2)
    rx.set(-(py - 0.5) * max * 2)
    gx.set(px * 100)
    gy.set(py * 100)
  }
  const leave = () => {
    rx.set(0)
    ry.set(0)
    shineO.set(0)
  }
  return (
    <div style={{ perspective: 1100 }} className={className}>
      <motion.div
        ref={ref}
        onPointerEnter={enter}
        onPointerMove={move}
        onPointerLeave={leave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="relative h-full overflow-hidden rounded-[28px]"
      >
        {children}
        <motion.div
          aria-hidden
          style={{ x: shineX, y: shineY, opacity: shineO }}
          className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,179,107,0.16),transparent_45%)]"
        />
      </motion.div>
    </div>
  )
}

/** Bandeau défilant infini (animation CSS transform, pause au survol) */
export function Marquee({ children, className, duration = 40, reverse = false }: { children: ReactNode; className?: string; duration?: number; reverse?: boolean }) {
  return (
    <div className={cn('group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]', className)}>
      <div
        className="flex w-max shrink-0 animate-marquee group-hover:[animation-play-state:paused]"
        style={{ ['--marquee-duration' as string]: `${duration}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}
