const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()
const emailPattern = /^\S+@\S+\.\S+$/

function createToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function authResponse(user) {
  return { token: createToken(user), user: user.toJSON() }
}

router.post('/register', async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : ''

    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required.' })
    if (!emailPattern.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' })
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' })

    const existing = await User.exists({ email })
    if (existing) return res.status(409).json({ message: 'An account with that email already exists.' })

    const passwordHash = await bcrypt.hash(password, 12)
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    const role = adminEmail && email === adminEmail ? 'admin' : 'user'
    const user = await User.create({ name, email, passwordHash, role })
    return res.status(201).json(authResponse(user))
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with that email already exists.' })
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    const user = await User.findOne({ email }).select('+passwordHash')

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' })
    }

    return res.json(authResponse(user))
  } catch (error) {
    next(error)
  }
})

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toJSON() }))

router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required.' })
    if (!emailPattern.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' })

    req.user.name = name
    req.user.email = email
    await req.user.save()
    return res.json({ user: req.user.toJSON() })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That email is already in use.' })
    next(error)
  }
})

module.exports = router