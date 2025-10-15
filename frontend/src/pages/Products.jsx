import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Inventory as InventoryIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/products';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });
  
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    status: ''
  });

  const navigate = useNavigate();

  const categories = [
    'Safety Valves',
    'Control Valves', 
    'Check Valves',
    'Steam Traps',
    'Strainers & Separators',
    'Complete Systems',
    'Specialty Valves'
  ];

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productsAPI.getAll(filters);
      setProducts(response.data.products || []);
    } catch (error) {
      setError('Failed to load products');
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleDelete = async () => {
    if (!deleteDialog.product) return;
    
    try {
      await productsAPI.delete(deleteDialog.product._id);
      setDeleteDialog({ open: false, product: null });
      loadProducts(); // Reload products
    } catch (error) {
      setError('Failed to delete product');
    }
  };

  const calculateProductProfit = (product) => {
  const cost = product.pricing.cost || 0;
  const sellingPrice = product.pricing.sellingPrice || 0;
  
  if (cost === 0) return { absolute: 0, margin: 0 };
  
  const absolute = sellingPrice - cost;
  const margin = (absolute / cost) * 100;
  
  return {
    absolute,
    margin: Math.max(margin, 0) // Ensure non-negative for display
  };
};

// Enhanced stock status function
const getStockStatus = (product) => {
  const quantity = product.stock.quantity;
  const minStock = product.stock.minStock;

  if (quantity === 0) {
    return { 
      label: 'Out of Stock', 
      color: 'error',
      description: 'No stock available'
    };
  } else if (quantity <= minStock) {
    return { 
      label: 'Low Stock', 
      color: 'warning',
      description: `Only ${quantity} left`
    };
  } else {
    return { 
      label: 'In Stock', 
      color: 'success',
      description: 'Good stock level'
    };
  }
};

  if (loading && products.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Products Inventory
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/add-product')}
        >
          Add Product
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search Products"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by name, SKU..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Category"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="out_of_stock">Out of Stock</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No products found
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {Object.values(filters).some(f => f) 
                ? 'Try adjusting your filters' 
                : 'Get started by adding your first product'
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
  {products.map((product) => {
    const stockStatus = getStockStatus(product);
    const profit = calculateProductProfit(product);
    
    return (
      <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
        <Card 
          sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 3,
            },
            border: stockStatus.color === 'error' ? '1px solid #f44336' : 
                    stockStatus.color === 'warning' ? '1px solid #ff9800' : '1px solid #e0e0e0'
          }}
        >
          {/* Stock Status Indicator Bar */}
          <Box 
            sx={{ 
              height: 4,
              backgroundColor: 
                stockStatus.color === 'error' ? '#f44336' :
                stockStatus.color === 'warning' ? '#ff9800' : '#4caf50',
              width: '100%'
            }} 
          />

          <CardContent sx={{ flexGrow: 1, p: 2 }}>
            {/* Header with Name and Status */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Typography 
                variant="h6" 
                component="h2"
                sx={{
                  fontWeight: 600,
                  fontSize: '1rem',
                  lineHeight: 1.3,
                  pr: 1
                }}
              >
                {product.name}
              </Typography>
              <Chip
                label={stockStatus.label}
                color={stockStatus.color}
                size="small"
                variant="filled"
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  minWidth: 80
                }}
              />
            </Box>

            {/* SKU and Category */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                SKU: {product.sku}
              </Typography>
              <Chip
                label={product.category}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 20 }}
              />
            </Box>

            {/* Description */}
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                mb: 2,
                minHeight: 40,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {product.description}
            </Typography>

            {/* Specifications Summary */}
            {product.specifications && (
              <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Grid container spacing={0.5}>
                  {product.specifications.size && (
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        Size: 
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 0.5 }}>
                        {product.specifications.size}
                      </Typography>
                    </Grid>
                  )}
                  {product.specifications.material && (
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        Material: 
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 0.5 }}>
                        {product.specifications.material}
                      </Typography>
                    </Grid>
                  )}
                  {product.specifications.rating && (
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        Rating: 
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 0.5 }}>
                        {product.specifications.rating}
                      </Typography>
                    </Grid>
                  )}
                  {product.specifications.IBR_approved && (
                    <Grid item xs={6}>
                      <Chip
                        label="IBR Approved"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontSize: '0.6rem', height: 18 }}
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

            {/* Stock Information */}
            <Box sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Current Stock
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: stockStatus.color === 'error' ? 'error.main' :
                          stockStatus.color === 'warning' ? 'warning.main' : 'success.main'
                  }}
                >
                  {product.stock.quantity} {product.stock.unit}
                </Typography>
              </Box>
              
              {/* Stock Progress Bar */}
              <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 6 }}>
                <Box
                  sx={{
                    height: 6,
                    backgroundColor:
                      stockStatus.color === 'error' ? '#f44336' :
                      stockStatus.color === 'warning' ? '#ff9800' : '#4caf50',
                    borderRadius: 1,
                    width: `${Math.min((product.stock.quantity / (product.stock.minStock * 2)) * 100, 100)}%`,
                    transition: 'width 0.3s ease'
                  }}
                />
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                <Typography variant="caption" color="textSecondary">
                  Min: {product.stock.minStock}
                </Typography>
                {product.stock.quantity <= product.stock.minStock && (
                  <Typography variant="caption" color="warning.main" sx={{ fontWeight: 500 }}>
                    {product.stock.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Pricing Information */}
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'primary.50', borderRadius: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Selling Price
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  ₹{product.pricing.sellingPrice?.toLocaleString()}
                </Typography>
              </Box>
              {profit.margin > 0 && (
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="textSecondary">
                    Profit Margin
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600,
                      color: profit.margin >= 20 ? 'success.main' : 
                            profit.margin >= 10 ? 'warning.main' : 'error.main'
                    }}
                  >
                    {profit.margin.toFixed(1)}%
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Action Buttons */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
              <Box display="flex" alignItems="center">
                <Typography 
                  variant="caption" 
                  color="textSecondary"
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <InventoryIcon sx={{ fontSize: 16 }} />
                  Last updated: {new Date(product.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
              
              <Box display="flex" gap={0.5}>
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => navigate(`/add-product`, { state: { product } })}
                  sx={{ 
                    bgcolor: 'primary.50',
                    '&:hover': { bgcolor: 'primary.100' }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => setDeleteDialog({ open: true, product })}
                  sx={{ 
                    bgcolor: 'error.50',
                    '&:hover': { bgcolor: 'error.100' }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  })}
</Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, product: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.product?.name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, product: null })}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;