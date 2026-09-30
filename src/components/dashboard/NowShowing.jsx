import { posterStyle } from '../../utils/posters'

// `movies` is a list of now-showing movies with `showsToday` and `occupancy` (0–100).
export default function NowShowing({ movies }) {
  return (
    <section className="now-showing fade-up" style={{ '--i': 7 }} aria-labelledby="now-showing-title">
      <div className="section-head">
        <h2 id="now-showing-title" className="section-title">Now showing</h2>
        <span className="panel-tag">{movies.length} movies in theatres</span>
      </div>
      <ul className="poster-row">
        {movies.map((m) => (
          <li key={m.id} className="poster-card">
            <div className="poster-art" style={posterStyle(m.genre)}>
              <span className="poster-letter" aria-hidden="true">{m.title.charAt(0)}</span>
              <span className="poster-lang">{m.language}</span>
            </div>
            <div className="poster-body">
              <p className="poster-title">{m.title}</p>
              <p className="poster-meta">
                {m.genre} · {m.showsToday} shows today
              </p>
              <div className="occupancy" aria-label={`${m.occupancy}% seats booked today`}>
                <div className="occupancy-bar">
                  <span style={{ width: `${m.occupancy}%` }} />
                </div>
                <span className="occupancy-value">{m.occupancy}%</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
