require('dotenv').config()

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const authRoutes = require('./routes/auth')
const productRoutes = require('./routes/products')
const categoryRoutes = require('./routes/categories')
const userRoutes = require('./routes/users')
const orderRoutes = require('./routes/orders')
const seedStoreData = require('./data/seed')

const app = express()
const port = Number(process.env.PORT) || 5000

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  throw new Error('Set MONGODB_URI and JWT_SECRET in backend/.env before starting the server.')
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '10kb' }))
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/users', userRoutes)
app.use('/api/orders', orderRoutes)
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'An unexpected server error occurred.' })
})

mongoose.connect(process.env.MONGODB_URI)
  .then(seedStoreData)
  .then(() => app.listen(port, () => console.log(`API listening on port ${port}`)))
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  })