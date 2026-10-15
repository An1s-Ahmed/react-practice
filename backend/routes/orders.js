const express = require('express')
const mongoose = require('mongoose')
const Order = require('../models/Order')
const Product = require('../models/Product')
const requireAuth = require('../middleware/requireAuth')
const requireAdmin = require('../middleware/requireAdmin')

const router = express.Router()
const statuses = ['Order Placed', 'Order Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']

function nextStatusAllowed(current, next) {
  if (!statuses.includes(next)) return false
  if (current === 'Cancelled' || current === 'Delivered') return current === next
  return true
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user.id }
    res.json(await Order.find(filter).sort({ createdAt: -1 }))
  } catch (error) {
    next(error)
  }
})

router.post('/', requireAuth, async (req, res) => {
  const session = await mongoose.startSession()
  try {
    let createdOrder
    await session.withTransaction(async () => {
      const inputItems = Array.isArray(req.body.items) ? req.body.items : []
      if (!inputItems.length) throw Object.assign(new Error('Your cart is empty.'), { status: 400 })

      const productIds = inputItems.map((item) => item.productId)
      if (productIds.some((id) => !mongoose.isValidObjectId(id))) throw Object.assign(new Error('A cart product is invalid.'), { status: 400 })
      const products = await Product.find({ _id: { $in: productIds } }).session(session)
      if (products.length !== new Set(productIds).size) throw Object.assign(new Error('A product is no longer available.'), { status: 409 })

      const items = inputItems.map((item) => {
        const product = products.find((entry) => entry.id === item.productId)
        const quantity = Number(item.quantity)
        if (!Number.isInteger(quantity) || quantity < 1 || product.stock < quantity) {
          throw Object.assign(new Error(`${product.name} does not have enough stock.`), { status: 409 })
        }
        return { product, quantity, productId: product.id, productName: product.name, price: product.price, subtotal: product.price * quantity }
      })

      for (const item of items) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.product._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session },
        )
        if (!updated) throw Object.assign(new Error(`${item.productName} no longer has enough stock.`), { status: 409 })
      }

      const now = new Date()
      const date = now.toISOString().slice(0, 10)
      const trackingNumber = `TRK-${date.replaceAll('-', '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
      const [order] = await Order.create([{
        userId: req.user.id,
        customerName: req.body.customerName,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        city: req.body.city,
        postalCode: req.body.postalCode,
        items: items.map(({ quantity, productId, productName, price, subtotal }) => ({ productId, productName, price, quantity, subtotal })),
        total: items.reduce((sum, item) => sum + item.subtotal, 0),
        status: 'Order Placed',
        trackingNumber,
        trackingHistory: [{ status: 'Order Placed', date, time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
      }], { session })
      createdOrder = order
    })
    res.status(201).json(createdOrder)
  } catch (error) {
    res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to place the order.' })
  } finally {
    await session.endSession()
  }
})

router.patch('/:id/status', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid order id.' })
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found.' })
    if (!nextStatusAllowed(order.status, req.body.status)) return res.status(400).json({ message: 'That status change is not allowed.' })
    if (req.body.status !== order.status) {
      const now = new Date()
      order.status = req.body.status
      order.trackingHistory.push({ status: order.status, date: now.toISOString().slice(0, 10), time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
      await order.save()
    }
    res.json(order)
  } catch (error) {
    next(error)
  }
})

module.exports = router