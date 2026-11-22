import { motion } from 'motion/react'
import { Icon } from '../components/Chrome'
import { Magnetic, Marquee, Reveal, SplitTitle } from '../components/ui/motion'
import { langColors, profile, repos, skills, softSkills } from '../data'
import { Label } from './About'

/** Compétences : liste typographique, pas de bulles. Survol = ligne qui s'allume. */
export function Skills() {
  return (
    <section
      id="competences"
      data-memoji="0.15,0.66,0.62,1"
      data-memoji-m="0.84,0.905,0.32,1"
      className="relative mx-auto max-w-[1600px] px-6 py-32 md:px-10 lg:pl-28"
    >
      <div className="grid gap-12 lg:grid-cols-[30%_1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Label n="04">Compétences</Label>
          <SplitTitle
            text="Ma boîte à outils."
            accent={['outils.']}
            className="font-wide text-[clamp(2.4rem,4.4vw,4.8rem)] leading-[0.95] font-semibold tracking-[-0.02em]"
          />
        </div>
        <ul className="border-t hairline">
          {skills.map((s, i) => (
            <motion.li
                key={s.cat}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
                className="group relative grid grid-cols-[3rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-3 border-b hairline py-7 md:grid-cols-[4rem_minmax(0,0.9fr)_minmax(0,1.3fr)]">
                <span className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 bg-gradient-to-r from-ember/[0.07] to-transparent transition-transform duration-500 ease-out-expo group-hover:scale-y-100" />
                <span className="relative font-mono text-[12px] text-ash transition-colors group-hover:text-ember">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-wide relative text-[clamp(1.3rem,2vw,2rem)] font-semibold tracking-[-0.01em] transition-transform duration-500 ease-out-expo group-hover:translate-x-2">
                  {s.cat}
                </h3>
                <p className="relative col-start-2 text-[15px] text-dust md:col-start-auto md:text-right">
                  {s.items.map((it, k) => (
                    <span key={it} className="inline-block whitespace-nowrap transition-colors duration-300 group-hover:text-bone">
                      {it}
                      {k < s.items.length - 1 && <span className="mx-2 text-ash">/</span>}
                    </span>
                  ))}
                </p>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="mt-24 -mx-6 md:-mx-10 lg:-ml-28">
        <Marquee duration={38}>
          {softSkills.map((s) => (
            <span key={s} className="font-wide flex items-center text-[clamp(2rem,4.5vw,4.6rem)] font-semibold tracking-[-0.02em] text-bone/[0.14]">
              <span className="px-8">{s}</span>
              <span className="text-ember/70">✳</span>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}

export function Github() {
  const total = (l: Record<string, number>) => Object.values(l).reduce((a, b) => a + b, 0)
  return (
    <section
      id="github"
      data-memoji="0.8,0.48,0.78,1"
      data-memoji-m="0.84,0.905,0.32,1"
      className="relative mx-auto max-w-[1600px] px-6 py-32 md:px-10 lg:pl-28"
    >
      <div className="lg:w-[60%]">
        <Label n="05">GitHub</Label>
        <SplitTitle
          text="Le code, en public."
          accent={['public.']}
          className="font-wide text-[clamp(2.4rem,4.8vw,5.2rem)] leading-[0.95] font-semibold tracking-[-0.02em]"
        />
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-dust">
            Tous mes projets sont sur GitHub : le code, les README et l’historique. Répartition réelle des langages par dépôt.
          </p>
        </Reveal>

        <div className="mt-12 overflow-hidden rounded-[28px] border hairline bg-ink-2/60">
          <div className="flex items-center justify-between border-b hairline px-6 py-4">
            <span className="flex items-center gap-3 font-mono text-[13px]">
              <Icon.github className="h-5 w-5" /> {profile.githubHandle}
            </span>
            <span className="font-mono text-[11px] tracking-[0.14em] text-dust uppercase">{repos.length} dépôts publics</span>
          </div>
          {repos.map((r, i) => {
            const t = total(r.langs)
            return (
              <Reveal key={r.name} delay={i * 0.08}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="link"
                  className="group block border-b hairline px-6 py-6 transition-colors last:border-b-0 hover:bg-ink-3/60"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="font-wide text-[17px] font-semibold transition-colors group-hover:text-ember">{r.name}</p>
                      <p className="mt-1 text-[14px] text-dust">{r.desc}</p>
                    </div>
                    <Icon.arrow className="mt-1 h-5 w-5 shrink-0 text-dust transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ember" />
                  </div>
                  <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-line">
                    {Object.entries(r.langs).map(([k, v]) => (
                      <motion.span
                        key={k}
                        title={`${k} ${((v / t) * 100).toFixed(1)} %`}
                        style={{ width: `${(v / t) * 100}%`, background: langColors[k] ?? '#6b625b' }}
                        className="h-full origin-left"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-dust">
                    {Object.entries(r.langs)
                      .filter(([, v]) => v / t > 0.01)
                      .map(([k, v]) => (
                        <span key={k} className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: langColors[k] ?? '#6b625b' }} />
                          {k} {((v / t) * 100).toFixed(1)} %
                        </span>
                      ))}
                  </div>
                </a>
              </Reveal>
            )
          })}
        </div>
        <Reveal delay={0.1} className="mt-10">
          <Magnetic>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              data-cursor="link"
              data-smile
              className="inline-flex items-center gap-3 rounded-full bg-bone px-7 py-4 font-wide text-[14px] font-semibold text-ink transition-colors hover:bg-ember"
            >
              <Icon.github className="h-5 w-5" /> Voir mon GitHub
              <Icon.arrow className="h-4 w-4" />
            </a>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  )
}
