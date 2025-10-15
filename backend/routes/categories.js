const express = require('express');
const Category = require('../models/Category');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all categories with product counts
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    // Get product counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ 
          category: category.name,
          status: 'active'
        });
        return {
          ...category.toObject(),
          productCount
        };
      })
    );

    res.json(categoriesWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single category with detailed info
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get products in this category
    const products = await Product.find({ 
      category: category.name,
      status: 'active'
    }).select('name sku stock status');

    const productCount = await Product.countDocuments({ 
      category: category.name,
      status: 'active'
    });

    const lowStockProducts = await Product.countDocuments({
      category: category.name,
      status: 'active',
      $expr: { $lt: ['$stock.quantity', '$stock.minStock'] }
    });

    res.json({
      ...category.toObject(),
      products,
      productCount,
      lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new category (Admin/Manager only)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Admin or Manager role required.' 
      });
    }

    const categoryData = {
      ...req.body,
      createdBy: req.user.id
    };

    const category = new Category(categoryData);
    await category.save();

    await category.populate('createdBy', 'name email');
    
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Update category (Admin/Manager only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Admin or Manager role required.' 
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category name already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Delete category (Admin only) - Soft delete
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin role required.' 
      });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ 
      category: (await Category.findById(req.params.id)).name 
    });
    
    if (productCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing products. Please reassign products first.' 
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add subcategory to category
router.post('/:id/subcategories', auth, async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Admin or Manager role required.' 
      });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.subCategories.push(req.body);
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update subcategory
router.put('/:id/subcategories/:subId', auth, async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Admin or Manager role required.' 
      });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const subCategory = category.subCategories.id(req.params.subId);
    if (!subCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    Object.assign(subCategory, req.body);
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete subcategory
router.delete('/:id/subcategories/:subId', auth, async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Admin or Manager role required.' 
      });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.subCategories.pull({ _id: req.params.subId });
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get category statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    
    const stats = await Promise.all(
      categories.map(async (category) => {
        const totalProducts = await Product.countDocuments({ 
          category: category.name 
        });
        
        const activeProducts = await Product.countDocuments({ 
          category: category.name,
          status: 'active'
        });
        
        const lowStockProducts = await Product.countDocuments({
          category: category.name,
          status: 'active',
          $expr: { $lt: ['$stock.quantity', '$stock.minStock'] }
        });

        const outOfStockProducts = await Product.countDocuments({
          category: category.name,
          status: 'active',
          'stock.quantity': 0
        });

        return {
          category: category.name,
          totalProducts,
          activeProducts,
          lowStockProducts,
          outOfStockProducts,
          subCategories: category.subCategories.length
        };
      })
    );

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;