import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Runs `fetcher(signal)` whenever `key` changes; aborts stale requests.
 * Returns { status: 'loading' | 'success' | 'error', data, error, reload }.
 * A response only counts for the key it was fetched with, so switching keys
 * shows 'loading' immediately instead of stale data.
 */
export default function useAsync(fetcher, key) {
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const [reloadCount, setReloadCount] = useState(0)
  const requestKey = `${key}|${reloadCount}`
  const [response, setResponse] = useState({ key: null })

  useEffect(() => {
    const controller = new AbortController()
    fetcherRef.current(controller.signal)
      .then((data) => setResponse({ key: requestKey, status: 'success', data }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResponse({ key: requestKey, status: 'error', error })
      })
    return () => controller.abort()
  }, [requestKey])

  const reload = useCallback(() => setReloadCount((n) => n + 1), [])
  const state = response.key === requestKey ? response : { status: 'loading' }
  return { ...state, reload }
}
