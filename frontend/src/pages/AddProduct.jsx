import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { productsAPI } from '../services/products';
import { categoriesAPI } from '../services/categories';

const steps = ['Basic Information', 'Specifications', 'Pricing & Inventory'];

const AddProduct = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    sku: '',
    category: '',
    subCategory: '',
    description: '',
    
    // Specifications
    specifications: {
      size: '',
      rating: '',
      material: '',
      pressure: '',
      temperature: '',
      IBR_approved: false,
    },
    
    // Inventory & Pricing
    stock: {
      quantity: 0,
      minStock: 10,
      unit: 'pcs',
    },
    pricing: {
      cost: '',
      sellingPrice: '',
      currency: 'INR',
    },
    supplier: {
      name: '',
      contact: '',
    },
    status: 'active',
  });

  const navigate = useNavigate();
  const location = useLocation();
  const editingProduct = location.state?.product;

  useEffect(() => {
    if (editingProduct) {
      setFormData(editingProduct);
    }
    loadCategories();
  }, [editingProduct]);

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Auto-update status based on stock levels
  useEffect(() => {
    if (formData.stock.quantity <= 0) {
      setFormData(prev => ({
        ...prev,
        status: 'out_of_stock'
      }));
    } else if (formData.stock.quantity <= formData.stock.minStock) {
      // Keep current status if it's already set, otherwise set to active
      if (formData.status === 'out_of_stock') {
        setFormData(prev => ({
          ...prev,
          status: 'active'
        }));
      }
    }
  }, [formData.stock.quantity, formData.stock.minStock]);

  const getStockStatus = () => {
    const quantity = formData.stock.quantity;
    const minStock = formData.stock.minStock;

    if (quantity <= 0) {
      return { status: 'Out of Stock', color: 'error', icon: <WarningIcon /> };
    } else if (quantity <= minStock) {
      return { status: 'Low Stock', color: 'warning', icon: <WarningIcon /> };
    } else {
      return { status: 'In Stock', color: 'success', icon: <InventoryIcon /> };
    }
  };

  const calculateProfit = () => {
    const cost = parseFloat(formData.pricing.cost) || 0;
    const sellingPrice = parseFloat(formData.pricing.sellingPrice) || 0;
    
    if (cost === 0) return 0;
    
    const profit = sellingPrice - cost;
    const profitMargin = (profit / cost) * 100;
    
    return {
      absolute: profit,
      margin: profitMargin
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.name || !formData.sku || !formData.category || !formData.subCategory) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const productData = {
        ...formData,
        pricing: {
          ...formData.pricing,
          cost: parseFloat(formData.pricing.cost) || 0,
          sellingPrice: parseFloat(formData.pricing.sellingPrice) || 0,
        },
        stock: {
          ...formData.stock,
          quantity: parseInt(formData.stock.quantity) || 0,
          minStock: parseInt(formData.stock.minStock) || 10,
        }
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct._id, productData);
        setSuccess('Product updated successfully!');
      } else {
        await productsAPI.create(productData);
        setSuccess('Product created successfully!');
        resetForm();
        setActiveStep(0);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      subCategory: '',
      description: '',
      specifications: {
        size: '',
        rating: '',
        material: '',
        pressure: '',
        temperature: '',
        IBR_approved: false,
      },
      stock: {
        quantity: 0,
        minStock: 10,
        unit: 'pcs',
      },
      pricing: {
        cost: '',
        sellingPrice: '',
        currency: 'INR',
      },
      supplier: {
        name: '',
        contact: '',
      },
      status: 'active',
    });
  };

  const handleNext = () => {
    // Validate current step before proceeding
    if (activeStep === 0) {
      if (!formData.name || !formData.sku || !formData.category || !formData.subCategory) {
        setError('Please fill in all required fields');
        return;
      }
    }
    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getSubCategories = () => {
    const category = categories.find(cat => cat.name === formData.category);
    return category?.subCategories || [];
  };

  const stockStatus = getStockStatus();
  const profit = calculateProfit();

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/products')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {activeStep === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Product Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="SKU"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="Unique product identifier"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    select
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    sx={{width: '200px'}}
                  >
                    <MenuItem value="">Select Category</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category._id} value={category.name}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    select
                    label="Subcategory"
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    disabled={!formData.category}
                    sx={{width: '200px'}}
                  >
                    <MenuItem value="">Select Subcategory</MenuItem>
                    {getSubCategories().map((subCat) => (
                      <MenuItem key={subCat._id} value={subCat.name}>
                        {subCat.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Detailed product description"
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Size"
                    name="specifications.size"
                    value={formData.specifications.size}
                    onChange={handleChange}
                    placeholder="e.g., 2 inch, DN50"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Rating"
                    name="specifications.rating"
                    value={formData.specifications.rating}
                    onChange={handleChange}
                    placeholder="e.g., 150 PSI, PN16"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Material"
                    name="specifications.material"
                    value={formData.specifications.material}
                    onChange={handleChange}
                    placeholder="e.g., Stainless Steel, Cast Iron"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Pressure Rating"
                    name="specifications.pressure"
                    value={formData.specifications.pressure}
                    onChange={handleChange}
                    placeholder="e.g., 150-300 PSI"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Temperature Range"
                    name="specifications.temperature"
                    value={formData.specifications.temperature}
                    onChange={handleChange}
                    placeholder="e.g., -20°C to 150°C"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="specifications.IBR_approved"
                        checked={formData.specifications.IBR_approved}
                        onChange={handleChange}
                      />
                    }
                    label="IBR Approved"
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 2 && (
              <Grid container spacing={3}>
                {/* Inventory Status Card */}
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">Inventory Status</Typography>
                      <Chip
                        icon={stockStatus.icon}
                        label={stockStatus.status}
                        color={stockStatus.color}
                        variant="filled"
                      />
                    </Box>
                  </Paper>
                </Grid>

                {/* Stock Information */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Current Stock"
                    name="stock.quantity"
                    value={formData.stock.quantity}
                    onChange={handleChange}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Minimum Stock"
                    name="stock.minStock"
                    value={formData.stock.minStock}
                    onChange={handleChange}
                    inputProps={{ min: 0 }}
                    helperText="Low stock alert threshold"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    required
                    fullWidth
                    select
                    label="Stock Unit"
                    name="stock.unit"
                    value={formData.stock.unit}
                    onChange={handleChange}
                  >
                    <MenuItem value="pcs">Pieces</MenuItem>
                    <MenuItem value="kg">Kilograms</MenuItem>
                    <MenuItem value="meter">Meters</MenuItem>
                    <MenuItem value="set">Sets</MenuItem>
                    <MenuItem value="box">Boxes</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Pricing Information */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Cost Price (₹)"
                    name="pricing.cost"
                    value={formData.pricing.cost}
                    onChange={handleChange}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Selling Price (₹)"
                    name="pricing.sellingPrice"
                    value={formData.pricing.sellingPrice}
                    onChange={handleChange}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>

                {/* Profit Calculation */}
                {(formData.pricing.cost && formData.pricing.sellingPrice) && (
                  <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Profit Analysis
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Absolute Profit
                          </Typography>
                          <Typography
                            variant="h6"
                            color={profit.absolute >= 0 ? 'success.main' : 'error.main'}
                          >
                            ₹{profit.absolute.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Profit Margin
                          </Typography>
                          <Typography
                            variant="h6"
                            color={profit.margin >= 0 ? 'success.main' : 'error.main'}
                          >
                            {profit.margin.toFixed(1)}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Supplier Information */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Supplier Name"
                    name="supplier.name"
                    value={formData.supplier.name}
                    onChange={handleChange}
                    placeholder="Primary supplier name"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Supplier Contact"
                    name="supplier.contact"
                    value={formData.supplier.contact}
                    onChange={handleChange}
                    placeholder="Phone or email"
                  />
                </Grid>

                {/* Status */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Product Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      label="Product Status"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="discontinued">Discontinued</MenuItem>
                      <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              
              <Box>
                {activeStep < steps.length - 1 ? (
                  <Button variant="contained" onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={loading}
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </Button>
                )}
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddProduct;