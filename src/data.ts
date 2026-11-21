export const profile = {
  firstName: 'Samy',
  lastName: 'Rachad',
  email: 'samy.rachad@viacesi.fr',
  github: 'https://github.com/samyr13',
  githubHandle: 'samyr13',
  // Renseigne ton URL LinkedIn ici : le lien s'affiche automatiquement partout.
  linkedin: '',
  cv: '/Samy-Rachad-CV.pdf',
  city: 'Pau (64)',
  internship: { label: 'Stage de 12 semaines', from: '5 avril 2027', to: '2 juillet 2027' },
}


export const about =
  "Étudiant en 2ᵉ année de cycle préparatoire intégré au CESI de Pau, j'adore concevoir des projets et suivre l'avancée des nouvelles technologies. Mon terrain de jeu : le développement, l'intelligence artificielle et la cybersécurité. En ce moment, je développe ma propre IA personnelle, type Jarvis, qui tourne en local grâce à Ollama — c'est d'ailleurs elle que vous voyez sur ce site."

export const facts = [
  { k: 'Formation', v: 'CESI Pau', d: 'Cycle prépa intégré · 2ᵉ année' },
  { k: 'Stage recherché', v: '12 semaines', d: '5 avril → 2 juillet 2027' },
  { k: 'Projet en cours', v: 'IA perso', d: 'Type Jarvis · en local avec Ollama' },
]

export type Project = {
  id: string
  index: string
  title: string
  kind: string
  year: string
  summary: string
  tags: string[]
  image?: string
  /** 'contain' pour les bannières très larges */
  fit?: 'contain'
  visual?: 'weather' | 'arcade' | 'ai'
  /** affiche un bouton qui ouvre l'IA du site */
  demo?: boolean
  status?: string
  links: { label: string; href: string }[]
}

export const projects: Project[] = [
  {
    id: 'ia-perso',
    index: '01',
    title: 'IA personnelle',
    kind: 'Assistant type Jarvis · en cours',
    year: '2026',
    status: 'En cours',
    summary:
      "Mon projet du moment : une IA personnelle façon Jarvis, propulsée par des modèles de langage open-source qui tournent en local grâce à Ollama — sans cloud, sur ma machine. L'avatar de ce site en est la version vitrine : cliquez dessus pour lui parler.",
    tags: ['Ollama', 'LLM local', 'IA générative', 'En cours'],
    visual: 'ai',
    demo: true,
    links: [],
  },
  {
    id: 'virio-ext',
    index: '02',
    title: 'Virio',
    kind: 'Extension anti-phishing',
    year: '2026',
    summary:
      "Extension Chrome gratuite qui détecte et bloque en temps réel les faux sites (amendes, colis, banques) au moment du clic, grâce à un score de risque et à des listes de menaces publiques.",
    tags: ['JavaScript', 'Python', 'Cybersécurité', 'Analyse d’URL'],
    image: '/projects/virio.webp',
    fit: 'contain',
    links: [
      { label: 'virio.fr', href: 'https://virio.fr' },
      { label: 'GitHub', href: 'https://github.com/samyr13/Virio-WebSite' },
    ],
  },
  {
    id: 'virio-site',
    index: '03',
    title: 'Virio — le site',
    kind: 'Site de présentation',
    year: '2026',
    summary:
      "Le site qui raconte l'arnaque en quatre écrans et présente l'extension : du SMS piégé au blocage, avec une démo, les chiffres et les signes à repérer.",
    tags: ['HTML', 'CSS', 'JavaScript', 'PHP'],
    image: '/projects/virio-story.webp',
    links: [
      { label: 'virio.fr', href: 'https://virio.fr' },
      { label: 'GitHub', href: 'https://github.com/samyr13/Virio-WebSite' },
    ],
  },
  {
    id: 'seyf',
    index: '04',
    title: 'Seyf Construction',
    kind: 'Site vitrine',
    year: '2026',
    summary:
      "Site vitrine d'une entreprise générale de construction : bâtiment, travaux publics et génie civil, avec la mise en avant des réalisations.",
    tags: ['Site vitrine', 'Web', 'Responsive'],
    image: '/projects/seyf.webp',
    links: [{ label: 'seyfconstruction.com', href: 'https://seyfconstruction.com' }],
  },
  {
    id: 'www',
    index: '05',
    title: 'Worldwide Weather Watcher',
    kind: 'Système embarqué · CESI',
    year: '2026',
    summary:
      "Station météo embarquée pour navire sur STM32 Nucleo-L476RG : température, humidité, pression, luminosité et GPS, horodatage de chaque mesure, code LED d'état et modes de fonctionnement.",
    tags: ['C', 'STM32', 'I2C', 'BME280', 'GPS'],
    visual: 'weather',
    links: [{ label: 'GitHub', href: 'https://github.com/samyr13/Projet-Worldwide-Weather-Watcher' }],
  },
  {
    id: 'arcade',
    index: '06',
    title: 'C Arcade',
    kind: 'Mini-jeux en C',
    year: '2026',
    summary:
      "Petits jeux en console écrits en C : « Plus ou moins » (trouver un nombre secret entre 1 et 100) et un sapin de Noël généré à la hauteur choisie, boules placées au hasard.",
    tags: ['C', 'C++', 'Console', 'Algorithmique'],
    visual: 'arcade',
    links: [{ label: 'GitHub', href: 'https://github.com/samyr13/c-arcade' }],
  },
]

export const skills = [
  { cat: 'Programmation', items: ['Python', 'C', 'C++', 'JavaScript'] },
  { cat: 'Développement web', items: ['HTML', 'CSS', 'PHP', 'Node.js'] },
  { cat: 'Systèmes & réseaux', items: ['Linux (WSL)', 'Apache', 'HTTP', 'Administration réseau'] },
  { cat: 'Cybersécurité', items: ['Détection de phishing', 'Analyse d’URL', 'Analyse de domaines'] },
  { cat: 'Données & IA', items: ['SQL', 'IA générative avancée'] },
  { cat: 'Méthode & outils', items: ['Git', 'GitHub', 'Génie logiciel', 'Gestion de projet'] },
]

export const softSkills = [
  'Curiosité',
  'Travail en équipe',
  'Esprit critique',
  'Adaptabilité',
  'Communication',
  'Gestion du temps',
]

export const journey = [
  {
    when: '2027',
    title: 'Stage de 12 semaines',
    where: 'Recherché · 5 avril → 2 juillet',
    text: "Je cherche une équipe où contribuer à des projets concrets en développement, cybersécurité ou IA.",
    highlight: true,
  },
  {
    when: 'En ce moment',
    title: 'Projet perso : mon IA type Jarvis',
    where: 'Ollama · modèles de langage en local',
    text: "Concevoir un assistant personnel qui tourne sur ma propre machine : c'est le projet qui m'occupe le plus en ce moment.",
  },
  {
    when: 'Depuis 2025',
    title: 'CESI — Cycle préparatoire intégré',
    where: 'Pau · mineure informatique',
    text: "Pédagogie par projets : travail en équipe, analyse du besoin, conception jusqu'à la livraison.",
  },
  {
    when: 'Depuis 2025',
    title: 'Tuteur collège',
    where: 'Association Parcours Jeunes · Établissement Jeanne d’Albret',
    text: "Aide aux devoirs et explication des notions adaptée au niveau de chaque élève.",
  },
  {
    when: '2022 – 2025',
    title: 'Baccalauréat technologique',
    where: 'Lycée Saint Cricq',
    text: 'Bases scientifiques et technologiques, premiers projets.',
  },
  {
    when: '2022',
    title: 'Stage d’observation — Service informatique',
    where: 'Euralis',
    text: "Découverte des métiers de l'informatique en entreprise, dont la sécurité des systèmes d'information.",
  },
]

// Données réelles issues de l'API GitHub (octets par langage)
export const repos: { name: string; desc: string; url: string; langs: Record<string, number> }[] = [
  {
    name: 'Virio-WebSite',
    desc: 'Site de l’extension anti-phishing Virio.',
    url: 'https://github.com/samyr13/Virio-WebSite',
    langs: { HTML: 134303, CSS: 55347, JavaScript: 46823, Python: 13360, PHP: 1287 },
  },
  {
    name: 'Projet-Worldwide-Weather-Watcher',
    desc: 'Station météo embarquée sur STM32.',
    url: 'https://github.com/samyr13/Projet-Worldwide-Weather-Watcher',
    langs: { C: 374916, 'Linker Script': 5279, Shell: 3374 },
  },
  {
    name: 'c-arcade',
    desc: 'Mini-jeux en console écrits en C.',
    url: 'https://github.com/samyr13/c-arcade',
    langs: { C: 958, 'C++': 890 },
  },
]

export const langColors: Record<string, string> = {
  HTML: '#ff7a2f',
  CSS: '#ffb36b',
  JavaScript: '#f4d58d',
  Python: '#8fb3ff',
  PHP: '#b79cff',
  C: '#f4ede6',
  'C++': '#ff9d7a',
  'Linker Script': '#6b625b',
  Shell: '#9be3a0',
}
