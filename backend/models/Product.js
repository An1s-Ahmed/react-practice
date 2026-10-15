const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  categoryId: { type: String, required: true },
  stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
}, { timestamps: true })

productSchema.set('toJSON', {
  transform(_document, value) {
    value.id = value._id.toString()
    delete value._id
    delete value.__v
    return value
  },
})

module.exports = mongoose.model('Product', productSchema)