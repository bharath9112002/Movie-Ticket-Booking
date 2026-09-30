// Placeholder poster artwork: a gradient per genre until real posters exist.
const GENRE_GRADIENTS = {
  Action: ['#e50914', '#4a0508'],
  'Sci-Fi': ['#3b82f6', '#0b1a3d'],
  Romance: ['#ec4899', '#4a0a2b'],
  Thriller: ['#6366f1', '#14123a'],
  Animation: ['#f59e0b', '#4a2a04'],
  Drama: ['#14b8a6', '#063a35'],
  Comedy: ['#a855f7', '#2e0d4a'],
}

export const posterStyle = (genre) => {
  const [from, to] = GENRE_GRADIENTS[genre] ?? ['#52525b', '#18181b']
  return { background: `linear-gradient(160deg, ${from}, ${to})` }
}
