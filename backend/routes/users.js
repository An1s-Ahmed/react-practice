const express = require('express')
const mongoose = require('mongoose')
const User = require('../models/User')
const requireAuth = require('../middleware/requireAuth')
const requireAdmin = require('../middleware/requireAdmin')

const router = express.Router()

router.get('/', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    res.json(await User.find().sort({ createdAt: -1 }))
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/role', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user id.' })
    if (!['user', 'admin'].includes(req.body.role)) return res.status(400).json({ message: 'Invalid role.' })
    if (req.params.id === req.user.id) return res.status(400).json({ message: 'You cannot change your own role.' })
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true, runValidators: true })
    if (!user) return res.status(404).json({ message: 'User not found.' })
    res.json(user)
  } catch (error) {
    next(error)
  }
})

module.exports = router