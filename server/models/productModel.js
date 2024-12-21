const mongoose = require('mongoose');

// Define Product Schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    default:10
  },
  imageURL: {
    type: String,
    required: true,
  },
  discount:{
    type : Number, 
    default: 0
  },
  category: {
    type: String,
    required: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true, // This field links the product to an admin (seller)
  }
});

module.exports = mongoose.model('Product', productSchema);
