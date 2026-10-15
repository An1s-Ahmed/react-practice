export const money = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount) || 0)
export const dateText = (date) => date ? new Date(date).toLocaleDateString() : '—'
