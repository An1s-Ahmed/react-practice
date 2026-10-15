import { createContext, useContext, useState } from 'react'
import { getCart, getProducts, saveCart } from '../utils/storage'
import { useBackendData } from './BackendDataContext'
const CartContext = createContext(null)
export function CartProvider({ children }) {
  const { revision } = useBackendData()
  const [cart, setCart] = useState(getCart)
  function commit(next) { const clean = next.filter((item) => item.quantity > 0); setCart(clean); saveCart(clean) }
  function addItem(productId, quantity = 1) { const product = getProducts().find((entry) => entry.id === productId); if (!product) return 'Product not found.'; const entry = cart.find((item) => item.productId === productId); const requested = (entry?.quantity || 0) + quantity; if (requested > product.stock) return `Only ${product.stock} available in stock.`; commit(entry ? cart.map((item) => item.productId === productId ? { ...item, quantity: requested } : item) : [...cart, { productId, quantity }]); return '' }
  function updateQuantity(productId, amount) { const product = getProducts().find((entry) => entry.id === productId); const quantity = Math.max(0, Math.min(Number(amount) || 0, product?.stock || 0)); commit(cart.map((item) => item.productId === productId ? { ...item, quantity } : item)) }
  function removeItem(productId) { commit(cart.filter((item) => item.productId !== productId)) }
  const items = cart.map((item) => { const product = getProducts().find((entry) => entry.id === item.productId); return product ? { ...item, name: product.name, price: product.price, image: product.image, stock: product.stock } : null }).filter(Boolean)
  return <CartContext.Provider value={{ items, count: items.reduce((sum, item) => sum + item.quantity, 0), subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0), addItem, updateQuantity, removeItem, clearCart: () => commit([]), revision }}>{children}</CartContext.Provider>
}
export const useCart = () => useContext(CartContext)