export const ORDER_STATUSES = ['Order Placed', 'Order Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']
export function canChangeStatus(current, next) {
  if (current === 'Cancelled' && next !== 'Cancelled') return false
  if (current === 'Delivered' && next !== 'Delivered') return false
  return ORDER_STATUSES.includes(next)
}
