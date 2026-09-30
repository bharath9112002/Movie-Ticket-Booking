// One-off generator for the offline demo catalogue.
// Pulls real posters and facts (runtime, release date, director, cast, plot) from
// Wikipedia/Wikidata, saves posters into public/demo/posters and writes
// src/data/demoMovies.json. Genres, languages and ratings are curated below.
//
//   node scripts/fetch-demo-movies.mjs
//
// Posters are copyrighted artwork shown under fair use on Wikipedia; keep this
// catalogue for local demos, not for redistribution.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const POSTER_DIR = path.join(ROOT, 'public', 'demo', 'posters')
const OUT_FILE = path.join(ROOT, 'src', 'data', 'demoMovies.json')
const HEADERS = { 'User-Agent': 'CineBook-demo-data-script/1.0 (local student project)' }

// TMDB genre ids: 28 Action, 12 Adventure, 16 Animation, 35 Comedy, 80 Crime, 18 Drama,
// 10751 Family, 14 Fantasy, 36 History, 27 Horror, 10749 Romance, 878 Sci-Fi, 53 Thriller.
// [Wikipedia article, original language, genres, rating out of 10 (approximate audience score)]
const FILMS = [
  ['Jailer (2023 Tamil film)', 'ta', [28, 35, 53], 7.0],
  ['Leo (2023 Indian film)', 'ta', [28, 53, 80], 7.2],
  ['Vikram (2022 film)', 'ta', [28, 53], 8.3],
  ['Amaran (2024 film)', 'ta', [28, 18, 36], 8.2],
  ['Maharaja (2024 film)', 'ta', [53, 28, 18], 8.4],
  ['Jai Bhim (film)', 'ta', [18, 80], 8.7],
  ['96 (film)', 'ta', [10749, 18], 8.5],
  ['Ponniyin Selvan: I', 'ta', [28, 12, 36], 7.5],
  ['RRR (film)', 'te', [28, 18, 36], 7.8],
  ['Pushpa 2: The Rule', 'te', [28, 80, 18], 6.3],
  ['Kalki 2898 AD', 'te', [878, 28, 14], 7.0],
  ['Baahubali 2: The Conclusion', 'te', [28, 12, 14], 8.2],
  ['Jawan (film)', 'hi', [28, 53], 7.0],
  ['Pathaan (film)', 'hi', [28, 53], 5.9],
  ['Stree 2', 'hi', [27, 35], 7.0],
  ['12th Fail', 'hi', [18], 8.8],
  ['Sita Ramam', 'te', [10749, 18, 36], 8.5],
  ['3 Idiots', 'hi', [35, 18], 8.4],
  ['Manjummel Boys', 'ml', [12, 53, 18], 8.2],
  ['Premalu', 'ml', [10749, 35], 7.8],
  ['Drishyam (2013 film)', 'ml', [80, 18, 53], 8.3],
  ['Kantara (film)', 'kn', [28, 53, 14], 8.2],
  ['K.G.F: Chapter 2', 'kn', [28, 80, 18], 8.2],
  ['Oppenheimer (film)', 'en', [18, 36], 8.3],
  ['Dune: Part Two', 'en', [878, 12], 8.5],
  ['Interstellar (film)', 'en', [878, 12, 18], 8.7],
  ['Inception', 'en', [878, 28, 12], 8.8],
  ['Spider-Man: Across the Spider-Verse', 'en', [16, 28, 12], 8.5],
  ['Inside Out 2', 'en', [16, 10751, 35], 7.6],
  ['Parasite (2019 film)', 'ko', [53, 18, 35], 8.5],
  ['Your Name', 'ja', [16, 10749, 14], 8.4],
  ['Spirited Away', 'ja', [16, 14, 10751], 8.6],
]

const CAST_LIMIT = 8

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const REQUEST_GAP_MS = 1200 // stay well inside Wikimedia's rate limits

async function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: HEADERS })
    if (res.ok) return res.json()
    if (attempt >= 5) throw new Error(`HTTP ${res.status} for ${url}`)
    const retryAfter = Number(res.headers.get('retry-after')) || 5 * attempt
    await sleep(retryAfter * 1000)
  }
}

const wikiApi = (params) =>
  getJson(`https://en.wikipedia.org/w/api.php?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`)

// Poster URL + Wikidata id for every title in one request. Posters are non-free
// images, which PageImages skips unless pilicense=any.
async function fetchPosters(titles) {
  const data = await wikiApi({
    action: 'query',
    titles: titles.join('|'),
    redirects: '1',
    prop: 'pageimages|pageprops',
    piprop: 'original',
    pilicense: 'any',
    ppprop: 'wikibase_item',
  })
  // Map each requested title through normalisation/redirects to its page.
  const alias = new Map()
  for (const step of [...(data.query.normalized ?? []), ...(data.query.redirects ?? [])]) alias.set(step.from, step.to)
  const resolve = (t) => (alias.has(t) ? resolve(alias.get(t)) : t)
  const pages = new Map(data.query.pages.map((p) => [p.title, p]))
  return titles.map((t) => {
    const page = pages.get(resolve(t))
    if (!page || page.missing) return { error: 'article not found' }
    return { title: page.title, poster: page.original?.source, qid: page.pageprops?.wikibase_item }
  })
}

// Full plain-text article, used to find the Plot section.
async function fetchText(title) {
  const data = await wikiApi({ action: 'query', titles: title, prop: 'extracts', explaintext: '1', exsectionformat: 'wiki' })
  return data.query.pages[0]?.extract ?? ''
}

// Lead-section wikitext, for the infobox's release date and running time.
async function fetchInfobox(title) {
  const data = await wikiApi({ action: 'parse', page: title, prop: 'wikitext', section: '0' })
  return data.parse?.wikitext ?? ''
}

const infoboxField = (wikitext, name) =>
  wikitext.match(new RegExp(`\\|\\s*${name}\\s*=([\\s\\S]*?)\\n\\s*(\\||\\}\\})`, 'i'))?.[1] ?? ''

// First full {{Film date|YYYY|MM|DD}} in the infobox: the main release.
function infoboxReleaseDate(wikitext) {
  const m = infoboxField(wikitext, 'released').match(/\{\{\s*film date\s*\|\s*(\d{4})\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})/i)
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : null
}

function infoboxRuntime(wikitext) {
  const field = infoboxField(wikitext, 'runtime')
  const duration = field.match(/\{\{\s*duration\s*\|([^}]*)\}\}/i)
  if (duration) {
    const h = Number(duration[1].match(/h\s*=\s*(\d+)/)?.[1] ?? 0)
    const m = Number(duration[1].match(/m\s*=\s*(\d+)/)?.[1] ?? 0)
    if (h || m) return h * 60 + m
  }
  const minutes = field.match(/(\d{2,3})\s*(?:&nbsp;|\s)*(?:min|minutes)/i)
  return minutes ? Number(minutes[1]) : null
}

// Opening of the Plot section (falls back to the intro), about 250–450 characters.
function synopsis(text) {
  const plot = text.match(/\n==\s*(Plot|Synopsis|Premise|Story)\s*==\n+([\s\S]*?)(\n==|$)/)
  const source = (plot ? plot[2] : text.split('\n==')[0]).trim()
  const sentences = source
    .split(/\n+/)
    .filter((p) => p.trim().length > 40)
    .slice(0, 2)
    .join(' ')
    .match(/[^.!?]+[.!?]+(\s|$)/g) ?? [source]
  let out = ''
  for (const s of sentences) {
    if (out.length >= 250 || (out && (out + s).length > 450)) break
    out += s
  }
  return out.trim()
}

async function wikidataEntities(ids, props = 'claims') {
  const out = {}
  for (let i = 0; i < ids.length; i += 50) {
    const data = await getJson(
      `https://www.wikidata.org/w/api.php?${new URLSearchParams({
        action: 'wbgetentities',
        ids: ids.slice(i, i + 50).join('|'),
        props,
        languages: 'en',
        format: 'json',
      })}`,
    )
    Object.assign(out, data.entities)
  }
  return out
}

// Non-deprecated claim values, preferred-rank ones first.
const claimValues = (entity, prop) =>
  (entity.claims?.[prop] ?? [])
    .filter((c) => c.mainsnak.snaktype === 'value' && c.rank !== 'deprecated')
    .sort((a, b) => (b.rank === 'preferred') - (a.rank === 'preferred'))
    .map((c) => c.mainsnak.datavalue.value)

function runtimeMinutes(entity) {
  const UNIT_TO_MIN = { Q7727: 1, Q11574: 1 / 60, Q25235: 60 }
  for (const v of claimValues(entity, 'P2047')) {
    const factor = UNIT_TO_MIN[v.unit.split('/').pop()]
    if (factor) return Math.round(Number(v.amount) * factor)
  }
  return null
}

// Earliest day-precision publication date as YYYY-MM-DD.
function releaseDate(entity) {
  const dates = claimValues(entity, 'P577')
    .filter((v) => v.precision >= 11)
    .map((v) => v.time.slice(1, 11))
    .sort()
  return dates[0] ?? null
}

function extension(url) {
  const ext = path.extname(new URL(url).pathname).toLowerCase()
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg'
}

const exists = (file) => fs.access(file).then(() => true, () => false)

// Downloads with backoff on rate limiting; skips files already saved by a previous run.
async function download(url, file) {
  if (await exists(file)) return
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: HEADERS })
    if (res.ok) return fs.writeFile(file, Buffer.from(await res.arrayBuffer()))
    if (res.status !== 429 || attempt >= 6) throw new Error(`poster HTTP ${res.status}`)
    await sleep((Number(res.headers.get('retry-after')) || 5 * attempt) * 1000)
  }
}

async function main() {
  await fs.mkdir(POSTER_DIR, { recursive: true })
  const problems = []
  const articles = []

  const found = await fetchPosters(FILMS.map(([title]) => title))
  for (const [i, [title, language, genreIds, rating]] of FILMS.entries()) {
    const article = found[i]
    if (article.error) problems.push(`${title}: ${article.error}`)
    else if (!article.poster) problems.push(`${title}: no poster image on the article`)
    else if (!article.qid) problems.push(`${title}: no Wikidata item`)
    else articles.push({ id: 1001 + i, language, genreIds, rating, ...article })
  }

  for (const a of articles) {
    await sleep(REQUEST_GAP_MS)
    a.text = await fetchText(a.title)
    await sleep(REQUEST_GAP_MS)
    a.wikitext = await fetchInfobox(a.title)
  }

  const films = await wikidataEntities(articles.map((a) => a.qid))
  const peopleIds = new Set()
  for (const a of articles) {
    const e = films[a.qid]
    a.directorIds = claimValues(e, 'P57').map((v) => v.id)
    // Cast members, or voice actors for animated films.
    const cast = claimValues(e, 'P161')
    a.castIds = (cast.length ? cast : claimValues(e, 'P725')).map((v) => v.id).slice(0, CAST_LIMIT)
    ;[...a.directorIds, ...a.castIds].forEach((id) => peopleIds.add(id))
  }
  const people = await wikidataEntities([...peopleIds], 'labels')
  const label = (id) => people[id]?.labels?.en?.value

  const currentYear = new Date().getFullYear()
  const movies = []
  for (const a of articles) {
    const e = films[a.qid]
    const date = infoboxReleaseDate(a.wikitext) ?? releaseDate(e)
    const runtime = infoboxRuntime(a.wikitext) ?? runtimeMinutes(e)
    const file = `${a.id}${extension(a.poster)}`
    await sleep(REQUEST_GAP_MS / 2)
    try {
      await download(a.poster, path.join(POSTER_DIR, file))
    } catch (err) {
      problems.push(`${a.title}: ${err.message}`)
      continue
    }
    const year = date ? Number(date.slice(0, 4)) : currentYear - 10
    // Recent, well-rated films rank as most popular.
    const popularity = Math.round(Math.max(10, 100 - (currentYear - year) * 6) * (a.rating / 10) * 10) / 10
    movies.push({
      id: a.id,
      title: a.title.replace(/\s*\((\d{4} )?(Indian |Tamil |Telugu )*film\)$/, ''),
      genre_ids: a.genreIds,
      original_language: a.language,
      runtime,
      vote_average: a.rating,
      // Stable pseudo vote count derived from the id.
      vote_count: 800 + ((a.id * 7919) % 9000),
      release_date: date,
      popularity,
      overview: synopsis(a.text),
      poster_file: file,
      directors: a.directorIds.map(label).filter(Boolean),
      cast: a.castIds.map(label).filter(Boolean),
      source: `https://en.wikipedia.org/wiki/${encodeURIComponent(a.title.replace(/ /g, '_'))}`,
    })
  }

  await fs.writeFile(OUT_FILE, JSON.stringify(movies, null, 2) + '\n')
  console.log(`Saved ${movies.length} movies to ${path.relative(ROOT, OUT_FILE)}`)
  for (const m of movies) {
    console.log(`  ${m.id} ${m.title} | ${m.release_date} | ${m.runtime}m | dir: ${m.directors.join(', ')} | cast: ${m.cast.length} | plot: ${m.overview.length} chars`)
  }
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`)
    problems.forEach((p) => console.log('  - ' + p))
    process.exitCode = 1
  }
}

main()
