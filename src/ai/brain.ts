import { journey, profile, projects, skills } from '../data'

/**
 * Cerveau de l'IA du site.
 * - Mode "démo" (par défaut, partout) : réponses locales par intentions, aucun serveur, aucune donnée envoyée.
 * - Mode "Ollama" : uniquement quand le site tourne en local (localhost) ET qu'Ollama répond avec au moins un modèle.
 *   On ne sonde jamais le localhost des visiteurs d'un site en ligne.
 */

export const AI_NAME = 'SAMI'

export type Msg = { role: 'user' | 'assistant'; content: string; action?: { label: string; href: string; download?: boolean } }

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

type Intent = { keys: string[]; answer: () => Omit<Msg, 'role'> }

const list = (a: string[]) => a.join(', ')

const intents: Intent[] = [
  {
    keys: ['bonjour', 'salut', 'hello', 'coucou', 'yo', 'hey', 'bonsoir'],
    answer: () => ({
      content: `Bonjour ! Je suis ${AI_NAME}, l’IA personnelle de Samy. Posez-moi vos questions sur son parcours, ses projets, ses compétences ou son stage.`,
    }),
  },
  {
    keys: ['qui es tu', 'tu es qui', 'sami', 'jarvis', 'ollama', 'ia perso', 'projet d ia', 'intelligence artificielle', 'ia', 'llm', 'ton createur', 'comment tu marche', 'assistant'],
    answer: () => ({
      content: `Je suis ${AI_NAME}, la version « vitrine » du projet en cours de Samy : une IA personnelle type Jarvis, qui tourne en local grâce à Ollama (des modèles de langage open-source directement sur sa machine, sans cloud). Ici, sur le site, je réponds en mode démo à partir de ce que Samy m’a appris sur lui.`,
    }),
  },
  {
    keys: ['qui est samy', 'presente', 'parle moi de', 'profil', 'samy', 'lui', 'il est'],
    answer: () => ({
      content: `Samy Rachad est étudiant en 2ᵉ année de cycle préparatoire intégré au CESI de Pau. Il adore concevoir des projets et suivre l’avancée des nouvelles technologies, en particulier l’intelligence artificielle et la cybersécurité. En ce moment, il développe sa propre IA personnelle type Jarvis avec Ollama — c’est un peu moi !`,
    }),
  },
  {
    keys: ['stage', 'dispo', 'disponible', 'quand', 'date', 'periode', 'alternance', 'recrut', 'embauch'],
    answer: () => ({
      content: `Samy recherche un ${profile.internship.label.toLowerCase()}, du ${profile.internship.from} au ${profile.internship.to}, en développement, IA ou cybersécurité. Il est basé à ${profile.city}.`,
      action: { label: 'Écrire à Samy', href: `mailto:${profile.email}` },
    }),
  },
  {
    keys: ['projet', 'realisation', 'portfolio', 'fait quoi', 'travaux', 'construit'],
    answer: () => ({
      content: `Ses projets : ${projects.map((p) => `${p.title} (${p.kind.toLowerCase()})`).join(' · ')}. Demandez-moi des détails sur l’un d’eux !`,
    }),
  },
  {
    keys: ['virio', 'phishing', 'arnaque', 'extension', 'cyber', 'securite'],
    answer: () => ({
      content:
        'Virio est une extension Chrome anti-phishing gratuite : elle détecte et bloque en temps réel les faux sites (amendes, colis, banques) au moment du clic, grâce à un score de risque et à des listes de menaces publiques. Samy a aussi conçu le site de présentation virio.fr.',
      action: { label: 'Voir virio.fr', href: 'https://virio.fr' },
    }),
  },
  {
    keys: ['meteo', 'weather', 'stm32', 'embarque', 'capteur', 'nucleo'],
    answer: () => ({
      content:
        'Worldwide Weather Watcher est une station météo embarquée pour navire, sur STM32 Nucleo-L476RG : température, humidité, pression, luminosité et GPS, mesures horodatées, code LED d’état et plusieurs modes de fonctionnement. Projet réalisé au CESI, en C.',
      action: { label: 'Voir le code', href: 'https://github.com/samyr13/Projet-Worldwide-Weather-Watcher' },
    }),
  },
  {
    keys: ['seyf', 'construction', 'site vitrine'],
    answer: () => ({
      content: 'Seyf Construction est le site vitrine d’une entreprise générale de construction (bâtiment, travaux publics, génie civil), avec la mise en avant des réalisations.',
      action: { label: 'Voir le site', href: 'https://seyfconstruction.com' },
    }),
  },
  {
    keys: ['arcade', 'jeu', 'plus ou moins', 'sapin'],
    answer: () => ({
      content: 'C Arcade regroupe de petits jeux console écrits en C : « Plus ou moins » et un sapin de Noël généré à la hauteur choisie.',
      action: { label: 'Voir le code', href: 'https://github.com/samyr13/c-arcade' },
    }),
  },
  {
    keys: ['competence', 'langage', 'techno', 'stack', 'sait faire', 'python', 'javascript', 'c++', 'php', 'sql', 'linux', 'outil'],
    answer: () => ({ content: skills.map((s) => `${s.cat} : ${list(s.items)}`).join('\n') }),
  },
  {
    keys: ['etude', 'ecole', 'cesi', 'formation', 'bac', 'parcours', 'diplome', 'experience'],
    answer: () => ({
      content: journey
        .filter((j) => !j.highlight)
        .map((j) => `${j.when} — ${j.title} (${j.where})`)
        .join('\n'),
    }),
  },
  {
    keys: ['cv', 'curriculum', 'resume'],
    answer: () => ({ content: 'Voici le CV de Samy, en PDF.', action: { label: 'Télécharger le CV', href: profile.cv, download: true } }),
  },
  {
    keys: ['contact', 'mail', 'email', 'joindre', 'ecrire', 'linkedin', 'telephone'],
    answer: () => ({
      content: `Le plus simple : par email à ${profile.email}. Samy répond vite.`,
      action: { label: 'Envoyer un email', href: `mailto:${profile.email}` },
    }),
  },
  {
    keys: ['github', 'code', 'repo', 'depot'],
    answer: () => ({ content: 'Tout le code de Samy est public sur GitHub.', action: { label: 'github.com/samyr13', href: profile.github } }),
  },
  {
    keys: ['passion', 'aime', 'interet', 'hobby', 'loisir', 'sport', 'motivation'],
    answer: () => ({
      content:
        'Samy adore concevoir des projets et suivre l’avancée des nouvelles technologies : IA, cybersécurité, systèmes. Il aime comprendre comment les outils fonctionnent et transformer un vrai problème en solution concrète. À côté, il fait du sport et aide des collégiens comme tuteur.',
    }),
  },
  {
    keys: ['blague', 'drole', 'rigole', 'humour'],
    answer: () => ({
      content: 'Pourquoi les développeurs confondent Halloween et Noël ? Parce que OCT 31 = DEC 25. 🎃🎄',
    }),
  },
  {
    keys: ['merci', 'super', 'top', 'genial', 'cool', 'parfait'],
    answer: () => ({ content: 'Avec plaisir ! Si Samy vous intéresse pour un stage, il sera ravi d’en discuter.' }),
  },
]

export const suggestions = ['Qui est Samy ?', 'Son projet d’IA ?', 'Quand est son stage ?', 'Ses compétences', 'Le CV']

export function demoAnswer(q: string): Omit<Msg, 'role'> {
  const n = ` ${norm(q).replace(/[^a-z0-9+ ]/g, ' ')} `
  let best: Intent | null = null
  let bestScore = 0
  for (const it of intents) {
    let score = 0
    for (const k of it.keys) if (n.includes(k.length <= 3 ? ` ${k} ` : k)) score += k.length
    if (score > bestScore) {
      bestScore = score
      best = it
    }
  }
  if (best) return best.answer()
  return {
    content:
      'Je n’ai pas encore la réponse à ça dans ma version démo. Essayez : son projet d’IA, ses projets, ses compétences, son stage ou son CV. Et pour une vraie conversation, écrivez directement à Samy !',
    action: { label: 'Écrire à Samy', href: `mailto:${profile.email}` },
  }
}

/* ---------------- Ollama (local uniquement) ---------------- */
const OLLAMA = 'http://localhost:11434'
const isLocalSite = () => ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)

export async function detectOllama(): Promise<string | null> {
  if (!isLocalSite()) return null
  try {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 800)
    const r = await fetch(`${OLLAMA}/api/tags`, { signal: ctrl.signal })
    clearTimeout(to)
    if (!r.ok) return null
    const { models = [] } = (await r.json()) as { models?: { name: string }[] }
    if (!models.length) return null
    const pref = ['llama3', 'mistral', 'qwen', 'gemma', 'phi']
    const pick = pref.map((p) => models.find((m) => m.name.startsWith(p))).find(Boolean) ?? models[0]
    return pick.name
  } catch {
    return null
  }
}

const systemPrompt = () =>
  [
    `Tu es ${AI_NAME}, l'IA personnelle de Samy Rachad, intégrée à son portfolio. Réponds en français, en vouvoyant, de façon brève (3 phrases max), chaleureuse et précise.`,
    `Ne réponds qu'à partir des faits suivants ; si tu ne sais pas, dis-le et propose d'écrire à Samy (${profile.email}).`,
    `Samy : étudiant en 2e année de cycle préparatoire intégré au CESI de Pau. Adore concevoir des projets et suivre l'avancée des nouvelles technologies (IA, cybersécurité).`,
    `Projet en cours : une IA personnelle type Jarvis qui tourne en local grâce à Ollama (c'est toi).`,
    `Stage recherché : ${profile.internship.label}, du ${profile.internship.from} au ${profile.internship.to}.`,
    `Projets : ${projects.map((p) => `${p.title} — ${p.summary}`).join(' | ')}`,
    `Compétences : ${skills.map((s) => `${s.cat}: ${list(s.items)}`).join(' | ')}`,
    `Parcours : ${journey.map((j) => `${j.when} ${j.title} (${j.where})`).join(' | ')}`,
    `Liens : GitHub ${profile.github}, CV disponible sur le site.`,
  ].join('\n')

export async function* ollamaChat(model: string, history: Msg[], signal: AbortSignal) {
  const r = await fetch(`${OLLAMA}/api/chat`, {
    method: 'POST',
    signal,
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: 'system', content: systemPrompt() }, ...history.map(({ role, content }) => ({ role, content }))],
    }),
  })
  if (!r.ok || !r.body) throw new Error('ollama')
  const reader = r.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let i
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 1)
      if (!line) continue
      const j = JSON.parse(line) as { message?: { content?: string }; done?: boolean }
      if (j.message?.content) yield j.message.content
    }
  }
}
