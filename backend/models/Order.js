const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  }],
  total: { type: Number, required: true, min: 0 },
  status: { type: String, default: 'Order Placed' },
  trackingNumber: { type: String, required: true, unique: true },
  trackingHistory: [{ status: String, date: String, time: String }],
}, { timestamps: true })

orderSchema.set('toJSON', {
  transform(_document, value) {
    value.id = value._id.toString()
    delete value._id
    delete value.__v
    return value
  },
})

module.exports = mongoose.model('Order', orderSchema)