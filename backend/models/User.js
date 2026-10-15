const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true, collection: 'user' })

userSchema.set('toJSON', {
  transform(_document, value) {
    value.id = value._id.toString()
    delete value._id
    delete value.passwordHash
    delete value.__v
    return value
  },
})

module.exports = mongoose.model('User', userSchema)