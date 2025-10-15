import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  MenuItem,
  Tabs,
  Tab,
  Breadcrumbs,
  Link
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Category as CategoryIcon,
  SubdirectoryArrowRight as SubcategoryIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { categoriesAPI } from '../services/categories';
import AddCategory from './AddCategory';
import AddSubcategory from './AddSubcategory';
import EditCategory from './EditCategory';
import EditSubcategory from './EditSubcategory';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, category: null });
  const [deleteSubcategoryDialog, setDeleteSubcategoryDialog] = useState({ 
    open: false, 
    subcategory: null, 
    category: null 
  });
  const [stats, setStats] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  
  // Add dialogs state
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addSubcategoryOpen, setAddSubcategoryOpen] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editSubcategoryOpen, setEditSubcategoryOpen] = useState(false);
  
  // Selected items for editing
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'active'
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
    loadStats();
  }, [filters]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await categoriesAPI.getAll();
      let filteredCategories = response.data || [];

      // Apply filters
      if (filters.search) {
        filteredCategories = filteredCategories.filter(category =>
          category.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          category.description.toLowerCase().includes(filters.search.toLowerCase()) ||
          category.subCategories?.some(subCat => 
            subCat.name.toLowerCase().includes(filters.search.toLowerCase())
          )
        );
      }

      if (filters.status) {
        filteredCategories = filteredCategories.filter(category => 
          category.isActive === (filters.status === 'active')
        );
      }

      setCategories(filteredCategories);
    } catch (error) {
      setError('Failed to load categories');
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await categoriesAPI.getStats();
      setStats(response.data || []);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleDelete = async () => {
    if (!deleteDialog.category) return;
    
    try {
      await categoriesAPI.delete(deleteDialog.category._id);
      setDeleteDialog({ open: false, category: null });
      loadCategories();
      loadStats();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleDeleteSubcategory = async () => {
    if (!deleteSubcategoryDialog.category || !deleteSubcategoryDialog.subcategory) return;
    
    try {
      await categoriesAPI.deleteSubcategory(
        deleteSubcategoryDialog.category._id,
        deleteSubcategoryDialog.subcategory._id
      );
      setDeleteSubcategoryDialog({ open: false, subcategory: null, category: null });
      loadCategories();
      loadStats();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete subcategory');
    }
  };

  // Add handlers
  const handleCategoryAdded = () => {
    setAddCategoryOpen(false);
    loadCategories();
    loadStats();
  };

  const handleSubcategoryAdded = () => {
    setAddSubcategoryOpen(false);
    loadCategories();
    loadStats();
  };

  // Edit handlers
  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setEditCategoryOpen(true);
  };

  const handleEditSubcategory = (subcategory, category) => {
    setSelectedSubcategory({ ...subcategory, parentCategoryId: category._id });
    setSelectedCategory(category);
    setEditSubcategoryOpen(true);
  };

  const handleCategoryUpdated = () => {
    setEditCategoryOpen(false);
    setSelectedCategory(null);
    loadCategories();
    loadStats();
  };

  const handleSubcategoryUpdated = () => {
    setEditSubcategoryOpen(false);
    setSelectedSubcategory(null);
    setSelectedCategory(null);
    loadCategories();
    loadStats();
  };

  // Close handlers
  const handleAddCategoryClose = () => {
    setAddCategoryOpen(false);
  };

  const handleAddSubcategoryClose = () => {
    setAddSubcategoryOpen(false);
  };

  const handleEditCategoryClose = () => {
    setEditCategoryOpen(false);
    setSelectedCategory(null);
  };

  const handleEditSubcategoryClose = () => {
    setEditSubcategoryOpen(false);
    setSelectedSubcategory(null);
    setSelectedCategory(null);
  };

  const getCategoryStats = (categoryName) => {
    return stats.find(stat => stat.category === categoryName) || {};
  };

  const toggleCategoryStatus = async (category) => {
    try {
      await categoriesAPI.update(category._id, {
        ...category,
        isActive: !category.isActive
      });
      loadCategories();
    } catch (error) {
      setError('Failed to update category status');
    }
  };

  if (loading && categories.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/"
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Typography color="text.primary">Categories</Typography>
      </Breadcrumbs>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Valve Categories Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAddSubcategoryOpen(true)}
          >
            Add Subcategory
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddCategoryOpen(true)}
          >
            Add Category
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 1 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="All Categories" />
            {/* <Tab label="Active" />
            <Tab label="Inactive" /> */}
          </Tabs>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Search Categories & Subcategories"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by name, description..."
              />
            </Grid>
            {/* <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="">All Status</MenuItem>
              </TextField>
            </Grid> */}
          </Grid>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CategoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No categories found
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {Object.values(filters).some(f => f) 
                ? 'Try adjusting your filters' 
                : 'Get started by adding your first category'
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {categories.map((category) => {
            const categoryStats = getCategoryStats(category.name);
            return (
              <Grid item xs={12} sm={6} md={4} key={category._id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: category.isActive ? '1px solid #e0e0e0' : '1px solid #ffcdd2',
                  opacity: category.isActive ? 1 : 0.7
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6" component="h2">
                        {category.name}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={category.isActive ? 'Active' : 'Inactive'}
                          color={category.isActive ? 'success' : 'default'}
                          size="small"
                          onClick={() => toggleCategoryStatus(category)}
                          style={{ cursor: 'pointer' }}
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" paragraph sx={{ minHeight: 40 }}>
                      {category.description}
                    </Typography>

                    {category.image && (
                      <Box sx={{ mb: 2, textAlign: 'center' }}>
                        <img 
                          src={category.image} 
                          alt={category.name}
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '100px', 
                            objectFit: 'contain',
                            borderRadius: '4px'
                          }}
                        />
                      </Box>
                    )}

                    {/* Subcategories */}
                    {category.subCategories && category.subCategories.length > 0 && (
                      <Box mb={2}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" color="textSecondary">
                            Subcategories ({category.subCategories.length})
                          </Typography>
                        </Box>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {category.subCategories.slice(0, 4).map((subCat) => (
                            <Chip
                              key={subCat._id}
                              label={subCat.name}
                              size="small"
                              variant="outlined"
                              icon={<SubcategoryIcon />}
                              onClick={() => handleEditSubcategory(subCat, category)}
                              onDelete={(e) => {
                                e.stopPropagation();
                                setDeleteSubcategoryDialog({ 
                                  open: true, 
                                  subcategory: subCat, 
                                  category: category 
                                });
                              }}
                              clickable
                              deleteIcon={<DeleteIcon />}
                            />
                          ))}
                          {category.subCategories.length > 4 && (
                            <Chip
                              label={`+${category.subCategories.length - 4} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Specifications Preview */}
                    {category.subCategories?.some(subCat => subCat.specifications) && (
                      <Box mb={2}>
                        <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                          Common Specifications:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {category.subCategories.slice(0, 3).map((subCat) => (
                            subCat.specifications?.commonMaterials?.slice(0, 2).map((material, index) => (
                              <Chip
                                key={`${subCat._id}-${material}-${index}`}
                                label={material}
                                size="small"
                                variant="filled"
                                color="primary"
                              />
                            ))
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Statistics */}
                    <Box sx={{ backgroundColor: 'grey.50', p: 1, borderRadius: 1, mb: 2 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" align="center">
                            <strong>{categoryStats.activeProducts || 0}</strong>
                          </Typography>
                          <Typography variant="caption" display="block" align="center" color="textSecondary">
                            Products
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" align="center">
                            <strong>{categoryStats.lowStockProducts || 0}</strong>
                          </Typography>
                          <Typography variant="caption" display="block" align="center" color="textSecondary">
                            Low Stock
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" align="center">
                            <strong>{category.subCategories?.length || 0}</strong>
                          </Typography>
                          <Typography variant="caption" display="block" align="center" color="textSecondary">
                            Subcategories
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" align="center">
                            <strong>{categoryStats.outOfStockProducts || 0}</strong>
                          </Typography>
                          <Typography variant="caption" display="block" align="center" color="textSecondary">
                            Out of Stock
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                      <Typography variant="caption" color="textSecondary">
                        Created by: {category.createdBy?.name || 'Unknown'}
                      </Typography>
                      
                      <Box>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEditCategory(category)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, category })}
                          disabled={categoryStats.activeProducts > 0}
                        >
                          <DeleteIcon />
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

      {/* Add Category Dialog */}
      <AddCategory
        open={addCategoryOpen}
        onClose={handleAddCategoryClose}
        onCategoryAdded={handleCategoryAdded}
        currentUser={{ id: 'current-user-id' }}
      />

      {/* Add Subcategory Dialog */}
      <AddSubcategory
        open={addSubcategoryOpen}
        onClose={handleAddSubcategoryClose}
        onSubcategoryAdded={handleSubcategoryAdded}
      />

      {/* Edit Category Dialog */}
      <EditCategory
        open={editCategoryOpen}
        onClose={handleEditCategoryClose}
        onCategoryUpdated={handleCategoryUpdated}
        category={selectedCategory}
        currentUser={{ id: 'current-user-id' }}
      />

      {/* Edit Subcategory Dialog */}
      <EditSubcategory
        open={editSubcategoryOpen}
        onClose={handleEditSubcategoryClose}
        onSubcategoryUpdated={handleSubcategoryUpdated}
        subcategory={selectedSubcategory}
      />

      {/* Delete Category Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, category: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          {deleteDialog.category && (
            <Typography>
              {getCategoryStats(deleteDialog.category.name).activeProducts > 0 ? (
                `Cannot delete "${deleteDialog.category.name}" because it has ${getCategoryStats(deleteDialog.category.name).activeProducts} active products. Please reassign products first.`
              ) : (
                `Are you sure you want to delete "${deleteDialog.category.name}"? This action cannot be undone.`
              )}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, category: null })}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={deleteDialog.category && getCategoryStats(deleteDialog.category.name).activeProducts > 0}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Subcategory Confirmation Dialog */}
      <Dialog
        open={deleteSubcategoryDialog.open}
        onClose={() => setDeleteSubcategoryDialog({ open: false, subcategory: null, category: null })}
      >
        <DialogTitle>Confirm Delete Subcategory</DialogTitle>
        <DialogContent>
          {deleteSubcategoryDialog.subcategory && (
            <Typography>
              Are you sure you want to delete "{deleteSubcategoryDialog.subcategory.name}" from "{deleteSubcategoryDialog.category.name}"? This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteSubcategoryDialog({ open: false, subcategory: null, category: null })}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteSubcategory} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories;