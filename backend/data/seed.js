const bcrypt = require('bcryptjs')
const Category = require('../models/Category')
const Product = require('../models/Product')
const User = require('../models/User')

const categories = [
  { name: 'Home', description: 'Useful pieces for a comfortable home.' },
  { name: 'Accessories', description: 'Everyday objects to take along.' },
  { name: 'Kitchen', description: 'Thoughtful tools for daily cooking.' },
]

const products = [
  { name: 'Stoneware vase', description: 'A hand-finished vase with a soft matte surface.', price: 34, image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=80', category: 'Home', stock: 12 },
  { name: 'Canvas tote', description: 'A durable everyday bag made from sturdy natural canvas.', price: 22, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80', category: 'Accessories', stock: 18 },
  { name: 'Oak serving board', description: 'A compact board for snacks and small gatherings.', price: 46, image: 'https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=900&q=80', category: 'Kitchen', stock: 7 },
  { name: 'Cotton throw', description: 'A soft woven layer for the sofa or the end of the bed.', price: 58, image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80', category: 'Home', stock: 5 },
]

async function seedStoreData() {
  if (await Category.countDocuments() === 0) await Category.insertMany(categories)
  if (await Product.countDocuments() === 0) {
    const savedCategories = await Category.find()
    const categoryIds = new Map(savedCategories.map((category) => [category.name, category.id]))
    await Product.insertMany(products.map(({ category, ...product }) => ({ ...product, categoryId: categoryIds.get(category) })))
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    const existingAdmin = await User.findOne({ email: adminEmail })
    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin'
        await existingAdmin.save()
      }
    } else {
      await User.create({
        name: process.env.ADMIN_NAME || 'Store Admin',
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: 'admin',
      })
    }
  }
}

module.exports = seedStoreData