// Page numbers to show around the current page, with '…' gaps.
function pageWindow(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1])
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p))

  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push(`gap-${p}`)
    result.push(p)
  })
  return result
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        ‹ <span className="page-word">Prev</span>
      </button>

      {pageWindow(page, totalPages).map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="page-gap" aria-hidden="true">…</span>
        ) : (
          <button
            key={p}
            type="button"
            className={`page-btn page-num${p === page ? ' is-active' : ''}`}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Page ${p}`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        <span className="page-word">Next</span> ›
      </button>
    </nav>
  )
}
