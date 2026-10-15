import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider, useCart } from './context/CartContext'
import { BackendDataProvider, useBackendData } from './context/BackendDataContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { ProductCard } from './components/ProductCard'
import { ProductForm } from './components/ProductForm'
import { CartItem } from './components/CartItem'
import { OrderSummary } from './components/OrderSummary'
import { TrackingTimeline } from './components/TrackingTimeline'
import { ErrorText } from './components/Shared'
import { canChangeStatus, ORDER_STATUSES } from './utils/order'
import { dateText, money } from './utils/helpers'
import { getCategories, getOrders, getProducts, getUsers, saveCategories, saveOrders, saveProducts, saveUsers } from './utils/storage'
import { apiRequest } from './utils/api'
import './index.css'
import './App.css'

function Title({ label, children, action }) { return <div className="page-title"><div>{label && <p className="eyebrow">{label}</p>}<h1>{children}</h1></div>{action}</div> }
function Field({ label, ...props }) { return <label className="field"><span>{label}</span><input {...props} /></label> }
function Empty({ children }) { return <div className="empty-state">{children}</div> }
function Stat({ label, value }) { return <div className="stat"><span>{label}</span><strong>{value}</strong></div> }
function Status({ children }) { return <span className="status">{children}</span> }
function Home() { return <><section className="hero container"><div className="hero-copy"><p className="eyebrow">EVERYDAY GOODS, MADE SIMPLE</p><h1>Good finds for your everyday.</h1><p>Thoughtfully selected essentials, ready when you are.</p><Link className="button" to="/products">Shop products</Link></div><img src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1100&q=85" alt="Home accessories arranged on a table" /></section><section className="container section"><div className="section-heading"><div><p className="eyebrow">THE COLLECTION</p><h2>Popular products</h2></div><Link to="/products">Browse all products</Link></div><div className="product-grid">{getProducts().slice(0, 3).map((product) => <ProductCard key={product.id} product={product} />)}</div></section></> }
function AuthPanel({ title, intro, children, alternate }) { return <main className="auth-wrap"><section className="auth-panel"><h1>{title}</h1><p className="muted">{intro}</p>{children}<p className="auth-alternate">{alternate}</p></section></main> }
function Login() { const { login } = useAuth(); const navigate = useNavigate(); const [error, setError] = useState(''); async function submit(event) { event.preventDefault(); const form = new FormData(event.currentTarget); const result = await login(form.get('email'), form.get('password')); if (result.error) setError(result.error); else navigate(result.user.role === 'admin' ? '/admin' : '/dashboard') }; return <AuthPanel title="Welcome back" intro="Sign in to continue." alternate={<>New here? <Link to="/register">Create an account</Link></>}><form className="form-stack" onSubmit={submit}><Field label="Email" name="email" type="email" required /><Field label="Password" name="password" type="password" required /><ErrorText>{error}</ErrorText><button className="button">Sign in</button></form></AuthPanel> }
function Register() { const { register } = useAuth(); const navigate = useNavigate(); const [error, setError] = useState(''); async function submit(event) { event.preventDefault(); const form = new FormData(event.currentTarget); const result = await register({ name: form.get('name'), email: form.get('email'), password: form.get('password'), confirmPassword: form.get('confirmPassword') }); if (result.error) setError(result.error); else navigate(result.user.role === 'admin' ? '/admin' : '/dashboard') }; return <AuthPanel title="Create an account" intro="A few details and you are ready to shop." alternate={<>Already registered? <Link to="/login">Sign in</Link></>}><form className="form-stack" onSubmit={submit}><Field label="Name" name="name" required /><Field label="Email" name="email" type="email" required /><Field label="Password" name="password" type="password" minLength="6" required /><Field label="Confirm password" name="confirmPassword" type="password" minLength="6" required /><ErrorText>{error}</ErrorText><button className="button">Create account</button></form></AuthPanel> }
function Products() { const categories = getCategories(); const products = getProducts(); const [params, setParams] = useSearchParams(); const query = params.get('q') || ''; const category = params.get('category') || ''; const sort = params.get('sort') || 'name-asc'; const visible = useMemo(() => products.filter((item) => (!category || item.categoryId === category) && `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : sort === 'name-desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)), [products, category, query, sort]); function set(key, value) { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); setParams(next, { replace: true }) }; return <main className="container page"><Title label="SHOP">Products</Title><div className="filters"><Field label="Search products" value={query} onChange={(e) => set('q', e.target.value)} placeholder="Name or description" /><label className="field"><span>Category</span><select value={category} onChange={(e) => set('category', e.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="field"><span>Sort by</span><select value={sort} onChange={(e) => set('sort', e.target.value)}><option value="name-asc">Name A-Z</option><option value="name-desc">Name Z-A</option><option value="price-asc">Price Low to High</option><option value="price-desc">Price High to Low</option></select></label></div>{visible.length ? <div className="product-grid">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <Empty>No matching products found.</Empty>}</main> }
function Categories() { return <main className="container page"><Title label="BROWSE">Categories</Title><div className="category-grid">{getCategories().map((item) => <Link className="category-row" key={item.id} to={`/products?category=${item.id}`}><strong>{item.name}</strong><span>{item.description}</span><span>Browse products →</span></Link>)}</div></main> }
function ProductDetails() { const { id } = useParams(); const product = getProducts().find((item) => item.id === id); const category = getCategories().find((item) => item.id === product?.categoryId); const { addItem } = useCart(); const [quantity, setQuantity] = useState(1); const [message, setMessage] = useState(''); if (!product) return <main className="container page"><Empty>Product not found. <Link to="/products">Return to products</Link></Empty></main>; function add() { const result = addItem(product.id, quantity); setMessage(result || 'Added to cart.') }; return <main className="container page"><div className="detail-grid"><img className="detail-image" src={product.image || 'https://placehold.co/800x600?text=Product'} alt={product.name} /><div><p className="eyebrow">{category?.name || 'Uncategorized'}</p><h1>{product.name}</h1><p>{product.description}</p><p className="detail-price">{money(product.price)}</p><p className={product.stock ? 'stock' : 'out-stock'}>{product.stock ? `${product.stock} in stock` : 'Out of Stock'}</p>{product.stock > 0 && <div className="purchase-row"><label className="field"><span>Quantity</span><input type="number" min="1" max={product.stock} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))} /></label><button className="button" onClick={add}>Add to Cart</button></div>}<p className="muted" role="status">{message}</p></div></div></main> }
function Dashboard() { const { user } = useAuth(); const { count } = useCart(); const orders = getOrders().filter((o) => o.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); return <main className="container page"><Title label="YOUR ACCOUNT">Welcome, {user.name}</Title><div className="stats-grid"><Stat label="Your orders" value={orders.length} /><Stat label="Items in cart" value={count} /></div><div className="section-heading"><h2>Recent orders</h2><Link to="/orders">View all</Link></div>{orders.length ? <OrderTable orders={orders.slice(0, 3)} /> : <Empty>You have not placed an order yet. <Link to="/products">Explore products</Link></Empty>}<div className="quick-links"><Link to="/products">Shop products</Link><Link to="/cart">View cart</Link><Link to="/orders">My orders</Link><Link to="/profile">Edit profile</Link></div></main> }
function Cart() { const { items, subtotal, updateQuantity, removeItem } = useCart(); return <main className="container page"><Title label="YOUR BAG">Shopping cart</Title>{items.length ? <div className="cart-layout"><div className="cart-list">{items.map((item) => <CartItem key={item.productId} item={item} onUpdate={updateQuantity} onRemove={removeItem} />)}</div><OrderSummary subtotal={subtotal}><Link className="button full-button" to="/checkout">Continue to checkout</Link><Link className="text-link" to="/products">Continue shopping</Link></OrderSummary></div> : <Empty>Your cart is empty. <Link to="/products">Continue shopping</Link></Empty>}</main> }
function Checkout() { const { items, subtotal, clearCart } = useCart(); const { user } = useAuth(); const navigate = useNavigate(); const [error, setError] = useState(''); if (!items.length) return <main className="container page"><Title>Checkout</Title><Empty>Your cart is empty. <Link to="/products">Shop products</Link></Empty></main>; async function submit(event) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); try { const order = await apiRequest('/orders', { method: 'POST', body: JSON.stringify({ customerName: data.fullName, email: data.email, phone: data.phone, address: data.address, city: data.city, postalCode: data.postalCode, items }) }); saveOrders([...getOrders(), order]); saveProducts(await apiRequest('/products')); clearCart(); navigate(`/order-success/${order.id}`) } catch (requestError) { setError(requestError.message) } }; return <main className="container page"><Title label="SECURE CHECKOUT">Delivery details</Title><div className="checkout-grid"><form className="form-panel form-stack" onSubmit={submit}><Field label="Full name" name="fullName" defaultValue={user.name} required /><Field label="Email" name="email" type="email" defaultValue={user.email} required /><Field label="Phone" name="phone" type="tel" required /><Field label="Address" name="address" required /><div className="two-fields"><Field label="City" name="city" required /><Field label="Postal code" name="postalCode" required /></div><ErrorText>{error}</ErrorText><button className="button">Place Order</button><p className="muted small">Payment is simulated. No payment details are collected.</p></form><OrderSummary subtotal={subtotal}><div className="order-lines">{items.map((item) => <div key={item.productId}><span>{item.name} × {item.quantity}</span><strong>{money(item.price * item.quantity)}</strong></div>)}</div></OrderSummary></div></main> }
function OrderSuccess() { const { id } = useParams(); const { user } = useAuth(); const order = getOrders().find((o) => o.id === id && o.userId === user.id); if (!order) return <main className="container page"><Empty>Order not found. <Link to="/orders">View orders</Link></Empty></main>; return <main className="container page success-page"><p className="success-mark">✓</p><h1>Order Successfully Placed</h1><p>Order ID: <strong>{order.id}</strong></p><p>Tracking Number: <strong>{order.trackingNumber}</strong></p><p>Status: <strong>{order.status}</strong></p><OrderSummary subtotal={order.total}><OrderLines order={order} /></OrderSummary><div className="button-row"><Link className="button" to="/products">Continue Shopping</Link><Link className="button button-secondary" to={`/orders/${order.id}`}>View Order</Link></div></main> }
function Orders() { const { user } = useAuth(); const orders = getOrders().filter((o) => o.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); return <main className="container page"><Title label="YOUR ACCOUNT">My orders</Title>{orders.length ? <OrderTable orders={orders} /> : <Empty>No orders yet. <Link to="/products">Start shopping</Link></Empty>}</main> }
function OrderTable({ orders }) { return <div className="table-wrap"><table><thead><tr><th>Order ID</th><th>Tracking number</th><th>Date</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>{orders.map((o) => <tr key={o.id}><td>{o.id}</td><td>{o.trackingNumber}</td><td>{dateText(o.createdAt)}</td><td>{money(o.total)}</td><td><Status>{o.status}</Status></td><td><Link to={`/orders/${o.id}`}>Track order</Link></td></tr>)}</tbody></table></div> }
function OrderLines({ order }) { return <div className="order-lines">{order.items.map((item, i) => <div key={`${item.productId}-${i}`}><span>{item.productName} × {item.quantity}</span><strong>{money(item.subtotal)}</strong></div>)}</div> }
function OrderDetails() { const { id } = useParams(); const { user } = useAuth(); const order = getOrders().find((o) => o.id === id && o.userId === user.id); if (!order) return <main className="container page"><Empty>Order not found. <Link to="/orders">Return to your orders</Link></Empty></main>; return <main className="container page"><Title label={order.trackingNumber}>Order {order.id}</Title><div className="order-detail-grid"><section className="content-panel"><h2>Items</h2><OrderLines order={order} /><hr /><strong>Total {money(order.total)}</strong><h2>Shipping information</h2><p>{order.customerName}<br />{order.address}<br />{order.city}, {order.postalCode}<br />{order.email}<br />{order.phone}</p></section><section className="content-panel"><h2>Tracking · <Status>{order.status}</Status></h2><TrackingTimeline history={order.trackingHistory} currentStatus={order.status} /></section></div></main> }
function Profile() { const { user, updateProfile } = useAuth(); const [error, setError] = useState(''); const [message, setMessage] = useState(''); async function submit(event) { event.preventDefault(); const d = new FormData(event.currentTarget); const result = await updateProfile({ name: d.get('name'), email: d.get('email') }); setError(result.error || ''); setMessage(result.error ? '' : 'Profile updated.') }; return <main className="container page narrow"><Title label="YOUR ACCOUNT">Profile</Title><form className="form-panel form-stack" onSubmit={submit}><Field label="Name" name="name" defaultValue={user.name} required /><Field label="Email" name="email" type="email" defaultValue={user.email} required /><div className="profile-meta"><span>Role</span><strong>{user.role}</strong><span>Created</span><strong>{dateText(user.createdAt)}</strong></div><ErrorText>{error}</ErrorText><p className="success-text">{message}</p><button className="button">Save changes</button></form></main> }
function AdminDashboard() {
  const { user } = useAuth()
  const users = getUsers()
  const products = getProducts()
  const orders = getOrders()
  const paidOrders = orders.filter((order) => order.status !== 'Cancelled')
  const sales = paidOrders.reduce((sum, order) => sum + order.total, 0)
  const averageOrder = paidOrders.length ? sales / paidOrders.length : 0
  const activeOrders = orders.filter((order) => !['Delivered', 'Cancelled'].includes(order.status)).length
  const cancelledRate = orders.length ? orders.filter((order) => order.status === 'Cancelled').length / orders.length * 100 : 0
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  const lowStock = products.filter((product) => product.stock <= 5)
  const chartMonths = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - 6 + index)
    return date
  })
  const monthlySales = chartMonths.map((month) => orders.reduce((sum, order) => {
    const date = new Date(order.createdAt)
    return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth() && order.status !== 'Cancelled'
      ? sum + order.total
      : sum
  }, 0))
  const chartMax = Math.max(...monthlySales, 1)
  const chartPoints = monthlySales.map((amount, index) => `${24 + index * 92},${185 - amount / chartMax * 140}`).join(' ')
  const statusCounts = [
    { label: 'Completed', count: orders.filter((order) => order.status === 'Delivered').length, color: 'completed', hex: '#00b979' },
    { label: 'Processing', count: orders.filter((order) => ['Order Placed', 'Order Confirmed', 'Processing', 'Packed'].includes(order.status)).length, color: 'processing', hex: '#009d9a' },
    { label: 'In transit', count: orders.filter((order) => ['Shipped', 'Out for Delivery'].includes(order.status)).length, color: 'transit', hex: '#2589e8' },
    { label: 'Cancelled', count: orders.filter((order) => order.status === 'Cancelled').length, color: 'cancelled', hex: '#e39a00' },
  ].filter((item) => item.count > 0)
  let statusProgress = 0
  const statusGradient = statusCounts.map((item) => {
    const start = statusProgress
    statusProgress += item.count / Math.max(orders.length, 1) * 100
    return `${item.hex} ${start}% ${statusProgress}%`
  }).join(', ')
  const initials = user?.name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'AD'

  return <main className="admin-page">
    <div className="admin-page-heading"><div><p className="admin-kicker">STORE OVERVIEW</p><h1>eCommerce</h1><p>Track your sales performance and store activity.</p></div></div>
    <section className="admin-metrics" aria-label="Store metrics">
      <article className="admin-metric metric-green"><div><span>Total sales</span><i aria-hidden="true">$</i></div><strong>{money(sales)}</strong><small>From non-cancelled orders</small><svg viewBox="0 0 220 36" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,29 26,25 52,28 78,18 106,21 132,14 160,18 188,7 220,10" /></svg></article>
      <article className="admin-metric metric-teal"><div><span>Average order value</span><i aria-hidden="true">▣</i></div><strong>{money(averageOrder)}</strong><small>Across {paidOrders.length} valid orders</small><svg viewBox="0 0 220 36" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,25 28,29 54,20 80,23 108,15 134,20 162,12 190,16 220,9" /></svg></article>
      <article className="admin-metric metric-blue"><div><span>Active orders</span><i aria-hidden="true">↗</i></div><strong>{activeOrders}</strong><small>Awaiting delivery or completion</small><svg viewBox="0 0 220 36" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,27 28,20 54,23 80,13 108,17 134,9 162,15 190,8 220,12" /></svg></article>
      <article className="admin-metric metric-amber"><div><span>Cancellation rate</span><i aria-hidden="true">↻</i></div><strong>{cancelledRate.toFixed(1)}%</strong><small>{orders.filter((order) => order.status === 'Cancelled').length} cancelled of {orders.length} orders</small><svg viewBox="0 0 220 36" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,11 28,17 54,12 80,23 108,18 134,25 162,21 190,29 220,25" /></svg></article>
    </section>

    <section className="admin-analytics">
      <article className="admin-panel admin-sales-panel"><div className="admin-panel-heading"><div><h2>Sales overview</h2><p>Monthly revenue for the last seven months</p></div><Link to="/admin/orders">All orders <span aria-hidden="true">→</span></Link></div>
        {orders.length ? <div className="admin-chart"><div className="admin-chart-ylabels"><span>{money(chartMax)}</span><span>{money(chartMax / 2)}</span><span>$0</span></div><svg role="img" aria-label="Monthly revenue for the last seven months" viewBox="0 0 600 210" preserveAspectRatio="none"><defs><linearGradient id="adminSalesFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#00b979" stopOpacity=".22" /><stop offset="100%" stopColor="#00b979" stopOpacity="0" /></linearGradient></defs><path d={`M ${chartPoints.split(' ').join(' L ')} L 576,196 L 24,196 Z`} fill="url(#adminSalesFill)" /><polyline points={chartPoints} fill="none" stroke="#00b979" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /></svg><div className="admin-chart-xlabels">{chartMonths.map((month) => <span key={`${month.getFullYear()}-${month.getMonth()}`}>{month.toLocaleDateString(undefined, { month: 'short' })}</span>)}</div></div> : <div className="admin-chart-empty">Sales activity will appear after your first order.</div>}
      </article>
      <article className="admin-panel admin-status-panel"><div className="admin-panel-heading"><div><h2>Order status</h2><p>Distribution of current orders</p></div></div>{orders.length ? <><div className="admin-status-ring" style={{ '--status-gradient': `conic-gradient(${statusGradient})` }}><div><strong>{orders.length}</strong><span>Orders</span></div></div><div className="admin-status-list">{statusCounts.map((item) => <div key={item.label}><span className={`admin-status-dot ${item.color}`} />{item.label}<strong>{item.count}</strong></div>)}</div></> : <div className="admin-chart-empty">Order statuses will appear here.</div>}</article>
    </section>

    <section className="admin-panel admin-recent-panel"><div className="admin-panel-heading"><div><h2>Recent orders</h2><p>Latest customer orders</p></div><Link to="/admin/orders">Manage orders <span aria-hidden="true">→</span></Link></div>{recentOrders.length ? <OrderTable orders={recentOrders} /> : <Empty>No orders have been placed.</Empty>}</section>
    <section className="admin-panel admin-low-stock-panel"><div className="admin-panel-heading"><div><h2>Low-stock products</h2><p>Items with five units or fewer remaining</p></div><Link to="/admin/products">Manage products <span aria-hidden="true">→</span></Link></div>{lowStock.length ? <div className="table-wrap"><table><thead><tr><th>Product</th><th>Stock</th><th>Action</th></tr></thead><tbody>{lowStock.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.stock}</td><td><Link to={`/admin/products/${product.id}/edit`}>Update stock</Link></td></tr>)}</tbody></table></div> : <Empty>All products are sufficiently stocked.</Empty>}</section>
    <div className="admin-dashboard-footnote">{users.length} customers · {products.length} products · <Link to="/admin/users">Manage customers</Link></div>
  </main>
}

function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initials = user?.name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'AD'
  function signOut() {
    logout()
    navigate('/')
  }

  return <div className="admin-layout">
    <aside className="admin-sidebar">
      <Link className="admin-brand" to="/admin"><span className="admin-brand-mark">ϟ</span><span>fieldstore<small>ADMIN CONSOLE</small></span></Link>
      <p className="admin-nav-label">OVERVIEW</p>
      <nav className="admin-nav"><NavLink to="/admin" end><span aria-hidden="true">▦</span>Dashboard</NavLink></nav>
      <p className="admin-nav-label">COMMERCE</p>
      <nav className="admin-nav"><NavLink to="/admin/orders"><span aria-hidden="true">▤</span>Orders</NavLink><NavLink to="/admin/products"><span aria-hidden="true">□</span>Products</NavLink><NavLink to="/admin/categories"><span aria-hidden="true">◫</span>Categories</NavLink></nav>
      <p className="admin-nav-label">PEOPLE</p>
      <nav className="admin-nav"><NavLink to="/admin/users"><span aria-hidden="true">♙</span>Customers</NavLink></nav>
      <p className="admin-nav-label">STOREFRONT</p>
      <nav className="admin-nav"><a href="/" target="_blank" rel="noreferrer"><span aria-hidden="true">↗</span>Preview website</a></nav>
      <p className="admin-nav-label">ACCOUNT</p>
      <nav className="admin-nav"><button className="admin-nav-logout" onClick={signOut}><span aria-hidden="true">⇥</span>Log out</button></nav>
      <div className="admin-sidebar-user"><span className="admin-avatar">{initials}</span><span><strong>{user?.name || 'Administrator'}</strong><small>Admin</small></span><button aria-label="Log out" title="Log out" onClick={signOut}>↗</button></div>
    </aside>
    <div className="admin-main"><header className="admin-toolbar"><Link className="admin-search-link" to="/admin/orders"><span aria-hidden="true">⌕</span>Search orders and customers...</Link><div className="admin-toolbar-actions"><a className="admin-preview-link" href="/" target="_blank" rel="noreferrer">Preview website</a><Link className="admin-new-order" to="/admin/products/new"><span aria-hidden="true">＋</span> New product</Link><span className="admin-toolbar-divider" /><span className="admin-avatar admin-toolbar-avatar" title={user?.name}>{initials}</span></div></header><Outlet /></div>
  </div>
}
function AdminProducts() {
	const { id } = useParams()
	const edit = Boolean(id)
	const navigate = useNavigate()
	const [products, setProducts] = useState([])
	const [query, setQuery] = useState('')
	const [category, setCategory] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(true)
	const existing = products.find((product) => product.id === id)

	useEffect(() => {
		apiRequest('/products')
			.then((items) => {
				setProducts(items)
				if (items.length) saveProducts(items)
			})
			.catch((requestError) => setError(requestError.message))
			.finally(() => setLoading(false))
	}, [])

	async function save(values) {
		try {
			const saved = await apiRequest(edit ? `/products/${id}` : '/products', {
				method: edit ? 'PUT' : 'POST',
				body: JSON.stringify(values),
			})
			const updated = edit
				? products.map((product) => product.id === id ? saved : product)
				: [...products, saved]
			setProducts(updated)
			saveProducts(updated)
			navigate('/admin/products')
		} catch (requestError) {
			setError(requestError.message)
		}
	}

	async function remove(product) {
		if (!window.confirm(`Delete ${product.name}?`)) return
		try {
			await apiRequest(`/products/${product.id}`, { method: 'DELETE' })
			const updated = products.filter((item) => item.id !== product.id)
			setProducts(updated)
			saveProducts(updated)
		} catch (requestError) {
			setError(requestError.message)
		}
	}

	if (loading) return <main className="container page"><p>Loading products...</p></main>
	if (edit && !existing) return <main className="container page"><ErrorText>{error || 'Product not found.'}</ErrorText><Link to="/admin/products">Return to products</Link></main>
	if (location.pathname.endsWith('/new') || edit) return <main className="container page narrow"><Title label="PRODUCTS">{edit ? 'Edit product' : 'Add product'}</Title><ProductForm initial={existing} onSave={save} error={error} /></main>

	const visible = products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()) && (!category || product.categoryId === category))
	return <main className="container page"><Title label="ADMIN" action={<Link className="button" to="/admin/products/new">Add product</Link>}>Products</Title><div className="filters"><Field label="Search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Product name" /><label className="field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{getCategories().map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><ErrorText>{error}</ErrorText><div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>{visible.map((product) => <tr key={product.id}><td>{product.name}</td><td>{getCategories().find((item) => item.id === product.categoryId)?.name || '—'}</td><td>{money(product.price)}</td><td>{product.stock}</td><td><Link to={`/admin/products/${product.id}/edit`}>Edit</Link><button className="link-button danger-link" onClick={() => remove(product)}>Delete</button></td></tr>)}</tbody></table></div>{!visible.length && <Empty>No products found.</Empty>}</main>
}
function AdminCategories() {
	const { id } = useParams()
	const edit = Boolean(id)
	const navigate = useNavigate()
	const [categories, setCategories] = useState(getCategories())
	const [error, setError] = useState('')
	const existing = categories.find((category) => category.id === id)
	const formView = location.pathname.endsWith('/new') || edit

	async function submit(event) {
		event.preventDefault()
		const data = new FormData(event.currentTarget)
		const values = { name: data.get('name').trim(), description: data.get('description') }
		try {
			const saved = await apiRequest(edit ? `/categories/${id}` : '/categories', {
				method: edit ? 'PUT' : 'POST',
				body: JSON.stringify(values),
			})
			const updated = edit ? categories.map((category) => category.id === id ? saved : category) : [...categories, saved]
			saveCategories(updated)
			setCategories(updated)
			navigate('/admin/categories')
		} catch (requestError) {
			setError(requestError.message)
		}
	}

	async function remove(category) {
		if (getProducts().some((product) => product.categoryId === category.id)) {
			setError('This category still has products assigned to it.')
			return
		}
		if (!window.confirm(`Delete ${category.name}?`)) return
		try {
			await apiRequest(`/categories/${category.id}`, { method: 'DELETE' })
			const updated = categories.filter((item) => item.id !== category.id)
			saveCategories(updated)
			setCategories(updated)
		} catch (requestError) {
			setError(requestError.message)
		}
	}

	if (edit && !existing) return <main className="container page"><Empty>Category not found.</Empty></main>
	if (formView) return <main className="container page narrow"><Title label="CATEGORIES">{edit ? 'Edit category' : 'New category'}</Title><form className="form-panel form-stack" onSubmit={submit}><Field label="Name" name="name" defaultValue={existing?.name || ''} required /><label className="field"><span>Description</span><textarea name="description" rows="4" defaultValue={existing?.description || ''} /></label><ErrorText>{error}</ErrorText><button className="button">Save category</button></form></main>
	return <main className="container page"><Title label="ADMIN" action={<Link className="button" to="/admin/categories/new">Add category</Link>}>Categories</Title><ErrorText>{error}</ErrorText><div className="table-wrap"><table><thead><tr><th>Name</th><th>Description</th><th>Created</th><th>Actions</th></tr></thead><tbody>{categories.map((category) => <tr key={category.id}><td>{category.name}</td><td>{category.description}</td><td>{dateText(category.createdAt)}</td><td><Link to={`/admin/categories/${category.id}/edit`}>Edit</Link><button className="link-button danger-link" onClick={() => remove(category)}>Delete</button></td></tr>)}</tbody></table></div></main>
}
function AdminUsers() {
	const { user: current } = useAuth()
	const [users, setUsers] = useState(getUsers())
	const [error, setError] = useState('')

	async function change(id, role) {
		try {
			const updatedUser = await apiRequest(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) })
			const updated = users.map((user) => user.id === id ? updatedUser : user)
			saveUsers(updated)
			setUsers(updated)
		} catch (requestError) {
			setError(requestError.message)
		}
	}

	return <main className="container page"><Title label="ADMIN">Users</Title><ErrorText>{error}</ErrorText><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Change role</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td>{dateText(user.createdAt)}</td><td><select aria-label={`Role for ${user.name}`} disabled={user.id === current.id} value={user.role} onChange={(event) => change(user.id, event.target.value)}><option value="user">user</option><option value="admin">admin</option></select></td></tr>)}</tbody></table></div>{!users.length && <Empty>No registered users yet.</Empty>}</main>
}
function AdminOrders() { const [query, setQuery] = useState(''); const [status, setStatus] = useState(''); const orders = getOrders().filter((o) => (!status || o.status === status) && `${o.id} ${o.trackingNumber} ${o.customerName} ${o.email}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); return <main className="container page"><Title label="ADMIN">Orders</Title><div className="filters"><Field label="Search orders" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Order, tracking, or customer" /><label className="field"><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label></div>{orders.length ? <div className="table-wrap"><table><thead><tr><th>Order ID</th><th>Customer</th><th>Tracking number</th><th>Date</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>{orders.map((o) => <tr key={o.id}><td>{o.id}</td><td>{o.customerName}</td><td>{o.trackingNumber}</td><td>{dateText(o.createdAt)}</td><td>{money(o.total)}</td><td><Status>{o.status}</Status></td><td><Link to={`/admin/orders/${o.id}`}>View</Link></td></tr>)}</tbody></table></div> : <Empty>No matching orders.</Empty>}</main> }
function AdminOrderDetails() {
	const { id } = useParams()
	const [orders, setOrders] = useState(getOrders())
	const order = orders.find((item) => item.id === id)
	const [status, setStatus] = useState(order?.status || 'Order Placed')
	const [message, setMessage] = useState('')

	if (!order) return <main className="container page"><Empty>Order not found. <Link to="/admin/orders">Return to orders</Link></Empty></main>

	async function update() {
		if (status === 'Cancelled' && order.status !== 'Cancelled' && !window.confirm('Cancel this order?')) return
		if (status === order.status) return setMessage('Choose a different status first.')
		if (!canChangeStatus(order.status, status)) return setMessage('This order cannot move from its current status to the selected status.')
		try {
			const updatedOrder = await apiRequest(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
			const updated = orders.map((item) => item.id === id ? updatedOrder : item)
			saveOrders(updated)
			setOrders(updated)
			setMessage('Order status updated.')
		} catch (requestError) {
			setMessage(requestError.message)
		}
	}

	return <main className="container page"><Title label={order.trackingNumber}>Order {order.id}</Title><div className="order-detail-grid"><section className="content-panel"><h2>Customer</h2><p>{order.customerName}<br />{order.email}<br />{order.phone}<br />{order.address}<br />{order.city}, {order.postalCode}</p><h2>Order items</h2><OrderLines order={order} /><hr /><strong>Total {money(order.total)}</strong><div className="status-editor"><label className="field"><span>Order status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>{ORDER_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label><button className="button" onClick={update}>Update Status</button><p className="muted" role="status">{message}</p></div></section><section className="content-panel"><h2>Tracking history</h2><TrackingTimeline history={order.trackingHistory} currentStatus={order.status} /></section></div></main>
}
function Layout() { const isAdmin = useLocation().pathname.startsWith('/admin'); return <div className={isAdmin ? 'app-theme admin-theme' : 'app-theme'}>{isAdmin ? <Outlet /> : <><Navbar /><Outlet /><Footer /></>}</div> }
function ReloadStoreRoutes() { const { revision } = useBackendData(); return <StoreRoutes key={revision} /> }
function StoreRoutes() { return <Routes><Route element={<Layout />}><Route index element={<Home />} /><Route path="login" element={<Login />} /><Route path="register" element={<Register />} /><Route path="products" element={<Products />} /><Route path="products/:id" element={<ProductDetails />} /><Route path="categories" element={<Categories />} /><Route element={<ProtectedRoute />}><Route path="dashboard" element={<Dashboard />} /><Route path="cart" element={<Cart />} /><Route path="checkout" element={<Checkout />} /><Route path="order-success/:id" element={<OrderSuccess />} /><Route path="orders" element={<Orders />} /><Route path="orders/:id" element={<OrderDetails />} /><Route path="profile" element={<Profile />} /><Route path="admin" element={<AdminRoute />}><Route element={<AdminLayout />}><Route index element={<AdminDashboard />} /><Route path="products" element={<AdminProducts />} /><Route path="products/new" element={<AdminProducts />} /><Route path="products/:id/edit" element={<AdminProducts />} /><Route path="categories" element={<AdminCategories />} /><Route path="categories/new" element={<AdminCategories />} /><Route path="categories/:id/edit" element={<AdminCategories />} /><Route path="users" element={<AdminUsers />} /><Route path="orders" element={<AdminOrders />} /><Route path="orders/:id" element={<AdminOrderDetails />} /></Route></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes> }
export default function StoreApp() { return <BrowserRouter><AuthProvider><BackendDataProvider><CartProvider><ReloadStoreRoutes /></CartProvider></BackendDataProvider></AuthProvider></BrowserRouter> }
