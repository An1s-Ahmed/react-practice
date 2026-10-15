let users = []
let products = []
let categories = []
let orders = []

function readCart() {
  try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
}

export const getUsers = () => users
export const saveUsers = (value) => { users = value; return users }
export const getProducts = () => products
export const saveProducts = (value) => { products = value; return products }
export const getCategories = () => categories
export const saveCategories = (value) => { categories = value; return categories }
export const getOrders = () => orders
export const saveOrders = (value) => { orders = value; return orders }
export const getCart = readCart
export const saveCart = (value) => { localStorage.setItem('cart', JSON.stringify(value)); return value }