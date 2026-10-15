const express = require('express')
const mongoose = require('mongoose')
const Product = require('../models/Product')
const Category = require('../models/Category')
const requireAuth = require('../middleware/requireAuth')
const requireAdmin = require('../middleware/requireAdmin')

const router = express.Router()
const fields = ['name', 'description', 'price', 'image', 'categoryId', 'stock']

function productData(body) {
  return Object.fromEntries(fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]))
}

router.get('/', async (_req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 })
    res.json(products)
  } catch (error) {
    next(error)
  }
})

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const values = productData(req.body)
    if (!await Category.exists({ _id: values.categoryId })) return res.status(400).json({ message: 'Choose an existing category.' })
    const product = await Product.create(values)
    res.status(201).json(product)
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message })
    next(error)
  }
})

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid product id.' })
    const values = productData(req.body)
    if (values.categoryId && !await Category.exists({ _id: values.categoryId })) return res.status(400).json({ message: 'Choose an existing category.' })
    const product = await Product.findByIdAndUpdate(req.params.id, values, {
      new: true,
      runValidators: true,
    })
    if (!product) return res.status(404).json({ message: 'Product not found.' })
    res.json(product)
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message })
    next(error)
  }
})

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid product id.' })
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found.' })
    res.json({ message: 'Product deleted.' })
  } catch (error) {
    next(error)
  }
})

module.exports = router