import api from './api';

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (categoryData) => api.post('/categories', categoryData),
  update: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  delete: (id) => api.delete(`/categories/${id}`),
  getStats: () => api.get('/categories/stats/summary'),
  
  // Subcategory operations
  addSubcategory: (categoryId, subcategoryData) => 
    api.post(`/categories/${categoryId}/subcategories`, subcategoryData),
  updateSubcategory: (categoryId, subcategoryId, subcategoryData) => 
    api.put(`/categories/${categoryId}/subcategories/${subcategoryId}`, subcategoryData),
  deleteSubcategory: (categoryId, subcategoryId) => 
    api.delete(`/categories/${categoryId}/subcategories/${subcategoryId}`)
};