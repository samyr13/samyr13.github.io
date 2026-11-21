import { useEffect } from 'react'
import { Cursor, Nav, SocialRail } from './components/Chrome'
import { Memoji } from './memoji/Memoji'
import { initScroll } from './lib/runtime'
import { Hero } from './sections/Hero'
import { About, Journey } from './sections/About'
import { Projects } from './sections/Projects'
import { Github, Skills } from './sections/Skills'
import { Contact } from './sections/Contact'
import { AIChat } from './ai/AIChat'
import { EasterEggs } from './components/EasterEggs'

export default function App() {
  useEffect(() => {
    const lenis = initScroll()
    // Moniteur FPS uniquement en développement
    if (import.meta.env.DEV) {
      import('stats.js').then(({ default: Stats }) => {
        const stats = new Stats()
        stats.dom.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:9999;opacity:.85'
        document.body.appendChild(stats.dom)
        const loop = () => {
          stats.update()
          requestAnimationFrame(loop)
        }
        requestAnimationFrame(loop)
      })
    }
    return () => lenis?.destroy()
  }, [])

  return (
    <div className="grain">
      <Nav />
      <SocialRail />
      <Memoji />
      <main className="relative">
        <Hero />
        <About />
        <Journey />
        <Projects />
        <Skills />
        <Github />
        <Contact />
      </main>
      <AIChat />
      <EasterEggs />
      <Cursor />
    </div>
  )
}
