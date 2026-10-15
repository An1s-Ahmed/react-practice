const express = require('express')
const Category = require('../models/Category')
const Product = require('../models/Product')
const requireAuth = require('../middleware/requireAuth')
const requireAdmin = require('../middleware/requireAdmin')

const router = express.Router()

router.get('/', async (_req, res, next) => {
  try {
    res.json(await Category.find().sort({ name: 1 }))
  } catch (error) {
    next(error)
  }
})

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    if (!name) return res.status(400).json({ message: 'Category name is required.' })
    const category = await Category.create({ name, description: req.body.description || '' })
    res.status(201).json(category)
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A category with this name already exists.' })
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message })
    next(error)
  }
})

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, {
      name: typeof req.body.name === 'string' ? req.body.name.trim() : '',
      description: req.body.description || '',
    }, { new: true, runValidators: true })
    if (!category) return res.status(404).json({ message: 'Category not found.' })
    res.json(category)
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A category with this name already exists.' })
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message })
    next(error)
  }
})

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (await Product.exists({ categoryId: req.params.id })) return res.status(409).json({ message: 'This category still has products assigned to it.' })
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) return res.status(404).json({ message: 'Category not found.' })
    res.json({ message: 'Category deleted.' })
  } catch (error) {
    next(error)
  }
})

module.exports = router