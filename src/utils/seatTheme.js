// Seat-tier accent colours, most premium first (tiers arrive back-row-first).
// Tiers are also named in section headers and the legend, so colour is never the only cue.
const TIER_COLORS = ['#f5b942', '#2dd4bf', '#60a5fa']

export const tierColor = (index) => TIER_COLORS[index % TIER_COLORS.length]

/** { tierName: colour } for a seat map's tiers. */
export const tierColorMap = (tiers) => Object.fromEntries(tiers.map((t, i) => [t.name, tierColor(i)]))
