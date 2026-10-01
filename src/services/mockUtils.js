// Helpers shared by the offline mock APIs.

export class MockApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'MockApiError'
    this.status = status
  }
}

const LATENCY_MS = [350, 800]

// Resolve after a realistic delay, honouring AbortController like fetch does.
export function respond(producer, signal, latency = LATENCY_MS) {
  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException('The operation was aborted.', 'AbortError')
    if (signal?.aborted) return reject(abortError())
    const [min, max] = latency
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

export function paginate(list, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize))
  const current = Math.min(Math.max(page, 1), totalPages)
  return {
    page: current,
    total_pages: list.length ? totalPages : 0,
    total_results: list.length,
    results: list.slice((current - 1) * pageSize, current * pageSize),
  }
}

// Small deterministic PRNG (mulberry32) so generated data is stable per seed.
export function seededRandom(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
