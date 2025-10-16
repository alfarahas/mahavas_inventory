import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://mahavas-inventory.onrender.com',
      'https://mahavas-inventory-frontend.onrender.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// Import routes using dynamic imports
const authRoutes = (await import('./routes/auth.js')).default;
const productsRoutes = (await import('./routes/products.js')).default;
const categoriesRoutes = (await import('./routes/categories.js')).default;

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

// FIXED: 404 handler for API routes - use * instead of parameter syntax
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    message: 'API route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Serve React app for all other routes (production only)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
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