const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  specifications: {
    size: String,
    rating: String,
    material: String,
    pressure: String,
    temperature: String,
    IBR_approved: Boolean
  },
  stock: {
    quantity: {
      type: Number,
      default: 0
    },
    minStock: {
      type: Number,
      default: 10
    },
    unit: {
      type: String,
      default: 'pcs'
    }
  },
  pricing: {
    cost: Number,
    sellingPrice: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  supplier: {
    name: String,
    contact: String
  },
  images: [String],
  documents: [String],
  status: {
    type: String,
    enum: ['active', 'discontinued', 'out_of_stock'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for search functionality
productSchema.index({ name: 'text', description: 'text', sku: 'text' });

module.exports = mongoose.model('Product', productSchema);