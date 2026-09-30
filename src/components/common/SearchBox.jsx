import { useCallback, useEffect, useRef, useState } from 'react'

const SEARCH_DELAY = 400

// Search input that reports its (trimmed) value after the user stops typing.
// `value` is the committed search (usually from the URL).
export default function SearchBox({ value, onSearch, placeholder, label }) {
  const [text, setText] = useState(value)
  const lastSubmitted = useRef(value)

  const submit = useCallback(
    (next) => {
      lastSubmitted.current = next
      onSearch(next)
    },
    [onSearch],
  )

  // Keep the box in sync when `value` changes from elsewhere (back button, reset),
  // without clobbering text typed after the last debounced submit.
  useEffect(() => {
    if (value !== lastSubmitted.current) {
      lastSubmitted.current = value
      setText(value)
    }
  }, [value])

  useEffect(() => {
    const next = text.trim()
    if (next === lastSubmitted.current) return
    const timer = setTimeout(() => submit(next), SEARCH_DELAY)
    return () => clearTimeout(timer)
  }, [text, submit])

  return (
    <div className="search-box">
      <span className="search-icon" aria-hidden="true">🔍</span>
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            submit(text.trim())
          }
        }}
        placeholder={placeholder}
        aria-label={label}
      />
    </div>
  )
}
