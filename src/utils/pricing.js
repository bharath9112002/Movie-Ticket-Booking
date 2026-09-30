export const BOOKING_FEE_PER_TICKET = 30

// Selected seats grouped by tier (in tier order) plus the price breakdown.
export function priceBreakdown(selectedSeats, tiers) {
  const groups = tiers
    .map((tier) => {
      const seats = selectedSeats
        .filter((s) => s.tier === tier.name)
        .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
      return { tier: tier.name, price: tier.price, seats, subtotal: seats.length * tier.price }
    })
    .filter((g) => g.seats.length)
  const tickets = groups.reduce((sum, g) => sum + g.subtotal, 0)
  const fee = selectedSeats.length * BOOKING_FEE_PER_TICKET
  return { groups, tickets, fee, total: tickets + fee }
}
