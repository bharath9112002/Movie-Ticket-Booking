// Offline stand-in for the TMDB API, used when no TMDB key is configured.
// Responses mirror TMDB's shapes so the UI doesn't care which source it talks to.
// The catalogue is fictional; posters are generated SVGs so nothing needs the network.

export const PAGE_SIZE = 12
const LATENCY_MS = [350, 800]

// Same ids TMDB uses, so genre filters behave identically.
const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 53, name: 'Thriller' },
]

const POSTER_COLORS = {
  28: ['#e50914', '#3a0306'],
  12: ['#f97316', '#3b1402'],
  16: ['#f59e0b', '#3f2503'],
  35: ['#a855f7', '#26093f'],
  80: ['#64748b', '#0f172a'],
  18: ['#14b8a6', '#042f2c'],
  14: ['#8b5cf6', '#1e0b46'],
  36: ['#b45309', '#2b1603'],
  27: ['#7f1d1d', '#050505'],
  10402: ['#ec4899', '#3d0621'],
  9648: ['#6366f1', '#0f0e33'],
  10749: ['#f43f5e', '#420915'],
  878: ['#3b82f6', '#06163a'],
  53: ['#475569', '#020617'],
}

// [title, genre ids, language, runtime, rating, votes, release date, popularity, tagline, overview]
const CATALOGUE = [
  ['Iron Monsoon', [28, 53], 'ta', 162, 7.8, 4210, '2025-01-14', 98, 'When the storm hits, so does he.', 'A retired naval commando returns to the port city of Thoothukudi when a smuggling cartel takes his brother hostage during the fiercest monsoon in decades.'],
  ['The Quiet Orbit', [878, 18], 'en', 141, 8.2, 9870, '2024-11-08', 95, 'Alone is only a distance.', 'A lone engineer aboard a failing research station must choose between repairing the ship that keeps her alive and answering a signal no one else can hear.'],
  ['Kaadhal Kavithai', [10749, 18], 'ta', 136, 7.4, 1830, '2024-02-14', 71, 'Some verses are written in silence.', 'Two poets who have only ever met through anonymous letters discover they have been rivals at the same Chennai literary festival for years.'],
  ['Midnight Circuit', [53, 80], 'hi', 128, 7.1, 2650, '2024-08-23', 77, 'Every signal leaves a trace.', 'A Mumbai traffic-control analyst notices the city lights are spelling out coordinates — and that each set marks the scene of a crime yet to happen.'],
  ['Little Big Paws', [16, 10751, 35], 'en', 96, 7.6, 5320, '2024-06-21', 88, 'Small paws. Huge adventure.', 'A clumsy shelter puppy and a streetwise pigeon team up to find the girl who promised to come back for him.'],
  ['Vettai Returns', [28, 80], 'ta', 158, 6.9, 3120, '2025-04-11', 91, 'The hunt was never over.', 'A decorated encounter specialist is pulled out of retirement when the gangster he thought he had buried resurfaces in Madurai.'],
  ['Echoes of the Backwaters', [18, 9648], 'ml', 131, 8.4, 2040, '2024-09-13', 69, 'The river remembers everything.', 'A houseboat captain in Alleppey begins receiving messages from a passenger who drowned twenty years ago.'],
  ['Quantum Heist', [878, 28, 53], 'en', 149, 7.3, 8110, '2025-03-07', 93, 'Steal it before it exists.', 'A crew of physicists plans the impossible robbery: taking a prototype from a vault in the few seconds before it is invented.'],
  ['Rang De Dosti', [35, 18], 'hi', 124, 6.8, 1490, '2024-03-22', 64, 'Friendship comes in every colour.', 'Four college friends reunite for a wedding in Jaipur and discover that the old pranks are much harder to pull off at forty.'],
  ['Garuda', [28, 12, 14], 'te', 171, 7.5, 3870, '2025-01-10', 97, 'Rise above.', 'A village blacksmith inherits a mythical bow and must protect his kingdom from an army that marches out of legend.'],
  ['The Last Lighthouse', [18, 36], 'en', 133, 7.9, 4460, '2023-10-27', 58, 'Keep the light burning.', 'In 1941, a lighthouse keeper and his daughter shelter a downed pilot whose presence could get them all killed.'],
  ['Mazhai Kuruvi', [10751, 18], 'ta', 118, 8.0, 1270, '2023-12-22', 55, 'Every child deserves a song.', 'A young girl from a hill village sets out to win a singing competition in Coimbatore so she can buy her grandmother a hearing aid.'],
  ['Neon Samurai', [16, 28, 878], 'ja', 112, 7.7, 6240, '2024-07-19', 84, 'Honour, rewired.', 'In a neon-soaked future Osaka, an android ronin hunts the corporation that deleted her master.'],
  ['Seoul After Dark', [80, 53], 'ko', 127, 7.2, 5580, '2024-05-03', 79, 'Nobody sleeps in this city.', 'A night-shift taxi driver becomes the only witness to a murder, and every passenger after that seems to know it.'],
  ['Haunted Haveli', [27, 35], 'hi', 119, 5.9, 2230, '2023-10-31', 61, 'Check in. Freak out.', 'A struggling YouTuber rents a "cursed" mansion for views, only to find the ghosts are far more interested in going viral than he is.'],
  ['Kannada Kesari', [28, 18], 'kn', 152, 7.0, 1680, '2024-10-11', 73, 'Pride has a roar.', 'A wrestler from Mysuru fights his way to the national championship while battling the federation that banned his father.'],
  ['Le Petit Café', [10749, 35], 'fr', 104, 7.3, 2890, '2024-04-12', 57, 'Love, served warm.', 'A grumpy Parisian café owner and the food critic who destroyed her reputation are forced to cater the same wedding.'],
  ['Sombras del Sur', [9648, 53], 'es', 122, 7.4, 3010, '2024-01-26', 60, 'The truth casts long shadows.', 'A journalist returns to her Andalusian hometown to investigate a disappearance the whole village insists never happened.'],
  ['Dragon Hills', [12, 14, 10751], 'en', 118, 6.7, 7420, '2024-12-20', 90, 'Every legend starts somewhere.', 'Three siblings spending the winter with their grandfather find a sleeping dragon beneath the frozen lake.'],
  ['Thunivu Kaadu', [12, 53], 'ta', 139, 7.1, 1940, '2025-02-28', 86, 'The forest decides who leaves.', 'A wildlife photographer and a forest ranger are stranded in the Nilgiris with poachers closing in.'],
  ['Bollywood Beats', [10402, 10749, 35], 'hi', 147, 6.5, 2110, '2023-11-10', 52, 'Dance like the whole world is watching.', 'A small-town choreographer gets one shot at a Bollywood film when the star\'s dancer quits the night before the shoot.'],
  ['The Silent Verdict', [80, 18], 'en', 138, 8.1, 6630, '2024-02-02', 72, 'Justice has no voice.', 'A deaf juror is the only one who noticed what the witness really said — and the only one who can stop an innocent man going to prison.'],
  ['Pushpa Vanam', [28, 80], 'te', 165, 6.6, 4050, '2024-12-06', 94, 'Flower. Fire. Forest.', 'A red-sandalwood labourer rises through the smuggling ranks, making powerful enemies in the police and the syndicate alike.'],
  ['Moonlit Kyoto', [10749, 18], 'ja', 109, 7.9, 3340, '2023-09-15', 49, 'Some promises last a lifetime.', 'A widowed calligrapher forms an unlikely bond with a young musician who busks outside her shop every full moon.'],
  ['Operation Himalaya', [28, 36, 53], 'hi', 156, 7.6, 3780, '2025-01-24', 89, 'Higher than duty.', 'Based on untold stories, an army unit undertakes a high-altitude rescue mission during the harshest winter on record.'],
  ['Robo Kutty', [16, 35, 10751], 'ta', 101, 7.2, 980, '2024-04-14', 63, 'Small bot. Big heart.', 'A Chennai schoolboy builds a robot from scrap for a science fair, and it decides its first job is to fix his family.'],
  ['Deep Blue Below', [27, 878, 53], 'en', 115, 6.3, 5210, '2024-08-09', 76, 'Something is waiting at the bottom.', 'A deep-sea mining crew drills into a trench that has been sealed for a reason.'],
  ['Manjummel Memories', [18, 12], 'ml', 135, 8.3, 2780, '2024-02-22', 70, 'Friends don\'t leave friends behind.', 'A group of friends on a trip to Kodaikanal must mount their own rescue when one of them falls into a notorious cave.'],
  ['Berlin Protocol', [53, 28], 'de', 124, 6.9, 2460, '2023-11-24', 54, 'Trust no signal.', 'A disgraced intelligence officer has one night in Berlin to prove the leak came from inside her own agency.'],
  ['Il Maestro', [10402, 18], 'it', 128, 7.8, 1920, '2024-03-08', 50, 'The final performance is the hardest.', 'An ageing conductor losing his hearing prepares an orchestra of teenagers for the concert that will end his career.'],
]

const FIRST_NAMES = ['Arjun', 'Priya', 'Karthik', 'Meera', 'Rahul', 'Ananya', 'Vikram', 'Divya', 'Sam', 'Elena', 'Kenji', 'Hana', 'Lucas', 'Sofia', 'Omar', 'Lakshmi', 'Rohan', 'Kavya', 'Min-jun', 'Chloé']
const LAST_NAMES = ['Kumar', 'Menon', 'Raja', 'Iyer', 'Verma', 'Reddy', 'Singh', 'Nair', 'Carter', 'Rossi', 'Tanaka', 'Kim', 'Moreau', 'García', 'Haddad', 'Pillai', 'Das', 'Rao', 'Weber', 'Park']
const ROLES = ['Lead', 'Detective', 'The Mentor', 'Sister', 'The Rival', 'Captain', 'Best Friend', 'Villain', 'Mother', 'The Stranger']

const genreName = (id) => GENRES.find((g) => g.id === id)?.name ?? ''

function svgDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const escapeXml = (s) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`)

// Break a title into lines of at most ~12 characters for the poster.
function titleLines(title) {
  const lines = []
  title.split(' ').forEach((word) => {
    const last = lines[lines.length - 1]
    if (last && (last + ' ' + word).length <= 12) lines[lines.length - 1] = `${last} ${word}`
    else lines.push(word)
  })
  return lines.slice(0, 3)
}

function makePoster(id, title, genreId) {
  const [from, to] = POSTER_COLORS[genreId] ?? ['#52525b', '#18181b']
  const lines = titleLines(title)
  const startY = 360 - (lines.length - 1) * 26
  const text = lines
    .map((line, i) => `<text x="171" y="${startY + i * 52}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="800" fill="#fff">${escapeXml(line.toUpperCase())}</text>`)
    .join('')
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 342 513">
      <defs>
        <linearGradient id="g${id}" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>
        <radialGradient id="r${id}" cx="0.5" cy="0.3" r="0.6"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="342" height="513" fill="url(#g${id})"/>
      <circle cx="171" cy="170" r="150" fill="url(#r${id})"/>
      <text x="171" y="230" text-anchor="middle" font-family="Georgia, serif" font-size="190" font-weight="700" fill="#fff" fill-opacity="0.16">${escapeXml(title.charAt(0))}</text>
      ${text}
      <rect x="131" y="470" width="80" height="3" rx="1.5" fill="#fff" fill-opacity="0.6"/>
    </svg>`,
  )
}

function makeBackdrop(id, genreId) {
  const [from, to] = POSTER_COLORS[genreId] ?? ['#52525b', '#18181b']
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
      <defs><linearGradient id="b${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${to}"/><stop offset="0.6" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
      <rect width="1280" height="720" fill="url(#b${id})"/>
      <circle cx="980" cy="260" r="320" fill="#fff" fill-opacity="0.07"/>
      <circle cx="1100" cy="520" r="180" fill="#fff" fill-opacity="0.05"/>
    </svg>`,
  )
}

// Deterministic "random" pick so cast lists are stable.
const pickFrom = (list, seed) => list[seed % list.length]

function makeCredits(id) {
  const person = (n) => `${pickFrom(FIRST_NAMES, id * 7 + n * 3)} ${pickFrom(LAST_NAMES, id * 11 + n * 5)}`
  return {
    cast: Array.from({ length: 8 }, (_, n) => ({
      credit_id: `mock-${id}-cast-${n}`,
      name: person(n),
      character: pickFrom(ROLES, id + n),
      profile_path: null,
    })),
    crew: [{ credit_id: `mock-${id}-dir`, job: 'Director', name: person(20) }],
  }
}

const MOVIES = CATALOGUE.map(
  ([title, genreIds, language, runtime, rating, votes, releaseDate, popularity, tagline, overview], i) => {
    const id = 1001 + i
    return {
      id,
      title,
      original_title: title,
      genre_ids: genreIds,
      genres: genreIds.map((gid) => ({ id: gid, name: genreName(gid) })),
      original_language: language,
      runtime,
      vote_average: rating,
      vote_count: votes,
      release_date: releaseDate,
      popularity,
      tagline,
      overview,
      poster_path: makePoster(id, title, genreIds[0]),
      backdrop_path: makeBackdrop(id, genreIds[0]),
      credits: makeCredits(id),
      release_dates: { results: [] },
    }
  },
)

class MockApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'MockApiError'
    this.status = status
  }
}

// Resolve after a realistic delay, honouring AbortController like fetch does.
function respond(producer, signal) {
  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException('The operation was aborted.', 'AbortError')
    if (signal?.aborted) return reject(abortError())
    const [min, max] = LATENCY_MS
    const timer = setTimeout(() => {
      try {
        resolve(structuredClone(producer()))
      } catch (err) {
        reject(err)
      }
    }, min + Math.random() * (max - min))
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(abortError())
    })
  })
}

function paginate(list, page) {
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const current = Math.min(Math.max(page, 1), totalPages)
  return {
    page: current,
    total_pages: list.length ? totalPages : 0,
    total_results: list.length,
    results: list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
  }
}

function applyFilters(list, { genre, language, minRating, sort = 'popularity.desc', query }) {
  const q = query?.trim().toLowerCase()
  const filtered = list.filter(
    (m) =>
      (!q || m.title.toLowerCase().includes(q)) &&
      (!genre || m.genre_ids.includes(Number(genre))) &&
      (!language || m.original_language === language) &&
      (!minRating || m.vote_average >= Number(minRating)),
  )
  const [field, direction] = sort.split('.')
  const key = {
    popularity: (m) => m.popularity,
    vote_average: (m) => m.vote_average,
    primary_release_date: (m) => m.release_date,
  }[field] ?? ((m) => m.popularity)
  return filtered.sort((a, b) => {
    const diff = key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0
    return direction === 'asc' ? diff : -diff
  })
}

// List endpoints return summaries, like TMDB (no runtime, credits or tagline).
const summary = ({ runtime: _r, credits: _c, tagline: _t, genres: _g, release_dates: _d, ...rest }) => rest

export const getGenres = () => respond(() => GENRES)

export const discoverMovies = ({ page = 1, ...filters }, { signal } = {}) =>
  respond(() => {
    const data = paginate(applyFilters(MOVIES, filters), page)
    return { ...data, results: data.results.map(summary) }
  }, signal)

// Unlike TMDB, the mock search can combine the query with filters and sorting.
export const searchMovies = ({ query, page = 1, ...filters }, { signal } = {}) =>
  respond(() => {
    const data = paginate(applyFilters(MOVIES, { ...filters, query }), page)
    return { ...data, results: data.results.map(summary) }
  }, signal)

export const getMovieDetails = (id, { signal } = {}) =>
  respond(() => {
    const movie = MOVIES.find((m) => m.id === Number(id))
    if (!movie) throw new MockApiError('The requested movie could not be found.', 404)
    return movie
  }, signal)

export const getRuntime = (id) => getMovieDetails(id).then((m) => m.runtime || null)
