import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Chip,
  Divider
} from '@mui/material';
import { categoriesAPI } from '../services/categories';

const EditSubcategory = ({ open, onClose, onSubcategoryUpdated, subcategory }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    specifications: {
      commonSizes: [],
      commonMaterials: [],
      pressureRatings: [],
      temperatureRange: ''
    }
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [materialInput, setMaterialInput] = useState('');
  const [pressureInput, setPressureInput] = useState('');

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  useEffect(() => {
    if (subcategory) {
      setFormData({
        name: subcategory.name || '',
        description: subcategory.description || '',
        categoryId: subcategory.parentCategoryId || '',
        specifications: {
          commonSizes: subcategory.specifications?.commonSizes || [],
          commonMaterials: subcategory.specifications?.commonMaterials || [],
          pressureRatings: subcategory.specifications?.pressureRatings || [],
          temperatureRange: subcategory.specifications?.temperatureRange || ''
        }
      });
    }
  }, [subcategory]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddSize = () => {
    if (sizeInput.trim() && !formData.specifications.commonSizes.includes(sizeInput.trim())) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          commonSizes: [...prev.specifications.commonSizes, sizeInput.trim()]
        }
      }));
      setSizeInput('');
    }
  };

  const handleRemoveSize = (sizeToRemove) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        commonSizes: prev.specifications.commonSizes.filter(size => size !== sizeToRemove)
      }
    }));
  };

  const handleAddMaterial = () => {
    if (materialInput.trim() && !formData.specifications.commonMaterials.includes(materialInput.trim())) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          commonMaterials: [...prev.specifications.commonMaterials, materialInput.trim()]
        }
      }));
      setMaterialInput('');
    }
  };

  const handleRemoveMaterial = (materialToRemove) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        commonMaterials: prev.specifications.commonMaterials.filter(material => material !== materialToRemove)
      }
    }));
  };

  const handleAddPressure = () => {
    if (pressureInput.trim() && !formData.specifications.pressureRatings.includes(pressureInput.trim())) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          pressureRatings: [...prev.specifications.pressureRatings, pressureInput.trim()]
        }
      }));
      setPressureInput('');
    }
  };

  const handleRemovePressure = (pressureToRemove) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        pressureRatings: prev.specifications.pressureRatings.filter(pressure => pressure !== pressureToRemove)
      }
    }));
  };

  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'size') {
        handleAddSize();
      } else if (type === 'material') {
        handleAddMaterial();
      } else if (type === 'pressure') {
        handleAddPressure();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await categoriesAPI.updateSubcategory(
        formData.categoryId,
        subcategory._id,
        {
          name: formData.name,
          description: formData.description,
          specifications: formData.specifications
        }
      );
      onSubcategoryUpdated();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update subcategory');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ 
      name: '', 
      description: '', 
      categoryId: '',
      specifications: {
        commonSizes: [],
        commonMaterials: [],
        pressureRatings: [],
        temperatureRange: ''
      }
    });
    setSizeInput('');
    setMaterialInput('');
    setPressureInput('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="h2" fontWeight="bold">
          Edit Subcategory
        </Typography>
        {subcategory && (
          <Typography variant="body2" color="textSecondary">
            Editing: {subcategory.name}
          </Typography>
        )}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth required>
              <InputLabel>Parent Category *</InputLabel>
              <Select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                label="Parent Category *"
                disabled={categoriesLoading}
              >
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Subcategory Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Description *"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  multiline
                  rows={3}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
                Specifications
              </Typography>
              
              <Grid container spacing={3}>
                {/* Common Sizes */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                      Common Sizes
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        placeholder="Add size (e.g., 1/2', 2')"
                        onKeyPress={(e) => handleKeyPress(e, 'size')}
                      />
                      <Button 
                        onClick={handleAddSize} 
                        variant="outlined" 
                        size="small"
                        disabled={!sizeInput.trim()}
                        sx={{ minWidth: '80px' }}
                      >
                        ADD
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: '40px' }}>
                      {formData.specifications.commonSizes.map((size) => (
                        <Chip
                          key={size}
                          label={size}
                          onDelete={() => handleRemoveSize(size)}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>

                {/* Common Materials */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                      Common Materials
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={materialInput}
                        onChange={(e) => setMaterialInput(e.target.value)}
                        placeholder="Add material (e.g., Stainless Steel, Brass)"
                        onKeyPress={(e) => handleKeyPress(e, 'material')}
                      />
                      <Button 
                        onClick={handleAddMaterial} 
                        variant="outlined" 
                        size="small"
                        disabled={!materialInput.trim()}
                        sx={{ minWidth: '80px' }}
                      >
                        ADD
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: '40px' }}>
                      {formData.specifications.commonMaterials.map((material) => (
                        <Chip
                          key={material}
                          label={material}
                          onDelete={() => handleRemoveMaterial(material)}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>

                {/* Pressure Ratings */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                      Pressure Ratings
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={pressureInput}
                        onChange={(e) => setPressureInput(e.target.value)}
                        placeholder="Add rating (e.g., 150 PSI, 300#)"
                        onKeyPress={(e) => handleKeyPress(e, 'pressure')}
                      />
                      <Button 
                        onClick={handleAddPressure} 
                        variant="outlined" 
                        size="small"
                        disabled={!pressureInput.trim()}
                        sx={{ minWidth: '80px' }}
                      >
                        ADD
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: '40px' }}>
                      {formData.specifications.pressureRatings.map((pressure) => (
                        <Chip
                          key={pressure}
                          label={pressure}
                          onDelete={() => handleRemovePressure(pressure)}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>

                {/* Temperature Range */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                      Temperature Range
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      name="specifications.temperatureRange"
                      value={formData.specifications.temperatureRange}
                      onChange={handleChange}
                      placeholder="e.g., -20°F to 400°F"
                      variant="outlined"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            variant="outlined"
            sx={{ minWidth: '100px' }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !formData.name.trim() || !formData.description.trim() || !formData.categoryId}
            sx={{ minWidth: '100px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Subcategory'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditSubcategory;