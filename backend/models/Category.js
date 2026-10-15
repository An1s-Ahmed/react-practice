const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: '', trim: true },
}, { timestamps: true })

categorySchema.set('toJSON', {
  transform(_document, value) {
    value.id = value._id.toString()
    delete value._id
    delete value.__v
    return value
  },
})

module.exports = mongoose.model('Category', categorySchema)