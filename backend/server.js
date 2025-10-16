import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import categoriesRoutes from './routes/categories.js';

// ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Initialize Express
const app = express();

// Database connection function
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://mahavas-cluster:<db_password>@mahavas-cluster.ekh2ych.mongodb.net/?retryWrites=true&w=majority&appName=mahavas-cluster');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Connect to Database
connectDB();

// CORS Configuration
const corsOptions = {
  origin: [
    'https://mahavas-inventory.onrender.com',
    'https://mahavas-inventory-frontend.onrender.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Mahavas Precision Controls Inventory API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// FIXED: 404 handler for API routes - using a different approach
app.use('/api', (req, res, next) => {
  // This will only be reached if no other API routes matched
  res.status(404).json({ 
    message: 'API route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Serve React app for all other routes (production only)
if (process.env.NODE_ENV === 'production') {
  // FIXED: Use a more specific approach for React routing
  app.use((req, res, next) => {
    // If it's an API request that reached here, it's a 404
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ 
        message: 'API route not found',
        path: req.originalUrl
      });
    }
    
    // Otherwise, serve the React app
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      message: 'CORS policy: Origin not allowed'
    });
  }
  
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});