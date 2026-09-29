const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { seedProducts, seedCategories } = require('./seedData');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// In-memory catalog state fallback
let inMemoryProducts = [...seedProducts];
let inMemoryCategories = [...seedCategories];

// Mongoose Schema (Used if MongoDB Atlas is connected)
const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  originalPrice: Number,
  category: { type: String, required: true },
  badge: String,
  stock: { type: Number, default: 0 },
  rating: { type: Number, default: 4.5 },
  numReviews: { type: Number, default: 0 },
  image: String,
  tags: [String],
  specs: Object,
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

let ProductModel = null;
let isMongoConnected = false;

// Attempt MongoDB Connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 })
    .then(() => {
      console.log('✅ Connected to MongoDB Atlas for Catalog Service');
      ProductModel = mongoose.model('Product', productSchema);
      isMongoConnected = true;
    })
    .catch((err) => {
      console.warn('⚠️  MongoDB connection deferred. Operating in High-Performance In-Memory Mode.');
    });
}

// Request Logger
app.use((req, res, next) => {
  console.log(`[CATALOG SERVICE] ${req.method} ${req.originalUrl}`);
  next();
});

// Health Endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'ShopiTry Product Catalog Service',
    status: 'HEALTHY',
    mongoConnected: isMongoConnected,
    totalProducts: isMongoConnected ? 'DB Active' : inMemoryProducts.length,
    timestamp: new Date().toISOString()
  });
});

// Categories list endpoint
app.get('/api/catalog/categories', (req, res) => {
  res.json({
    status: 'success',
    data: inMemoryCategories
  });
});

// Get Products with Filter, Search, Pagination & Sorting
app.get('/api/catalog/products', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, featured } = req.query;

    let items = isMongoConnected ? await ProductModel.find().lean() : [...inMemoryProducts];

    // Filter by Category
    if (category && category !== 'All') {
      items = items.filter(p => p.category.toLowerCase() === category.toLowerCase() || p.tags.includes(category.toLowerCase()));
    }

    // Filter by Search Query
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Filter by Price
    if (minPrice) {
      items = items.filter(p => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      items = items.filter(p => p.price <= parseFloat(maxPrice));
    }

    // Filter Featured
    if (featured === 'true') {
      items = items.filter(p => p.isFeatured === true);
    }

    // Sorting
    if (sort === 'price-low') {
      items.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      items.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      items.sort((a, b) => b.rating - a.rating);
    } else {
      // Default: newest
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({
      status: 'success',
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch catalog products', details: error.message });
  }
});

// Get Single Product by ID or Slug
app.get('/api/catalog/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let product;

    if (isMongoConnected) {
      product = await ProductModel.findOne({ $or: [{ id }, { slug: id }] });
    } else {
      product = inMemoryProducts.find(p => p.id === id || p.slug === id);
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found in catalog.' });
    }

    res.json({ status: 'success', data: product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product details', details: error.message });
  }
});

// Admin: Create Product
app.post('/api/catalog/products', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin privilege required to create products.' });
    }

    const { name, price, category, description, image, stock, badge } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required.' });
    }

    const newProduct = {
      id: `prod_${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: description || 'High performance AetherCart tech product.',
      price: parseFloat(price),
      originalPrice: price * 1.15,
      category,
      badge: badge || 'New',
      stock: parseInt(stock || 25, 10),
      rating: 5.0,
      numReviews: 1,
      image: image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
      tags: [category.toLowerCase()],
      specs: { warranty: '2 Years Manufacturer Warranty' },
      isFeatured: true,
      createdAt: new Date().toISOString()
    };

    if (isMongoConnected) {
      const createdDoc = await ProductModel.create(newProduct);
      return res.status(201).json({ status: 'success', data: createdDoc });
    } else {
      inMemoryProducts.unshift(newProduct);
      return res.status(201).json({ status: 'success', data: newProduct });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product', details: error.message });
  }
});

// Admin: Update Product
app.put('/api/catalog/products/:id', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin privilege required to update products.' });
    }

    const { id } = req.params;
    const updateData = req.body;

    if (isMongoConnected) {
      const updated = await ProductModel.findOneAndUpdate({ id }, updateData, { new: true });
      if (!updated) return res.status(404).json({ error: 'Product not found.' });
      return res.json({ status: 'success', data: updated });
    } else {
      const index = inMemoryProducts.findIndex(p => p.id === id);
      if (index === -1) return res.status(404).json({ error: 'Product not found.' });

      inMemoryProducts[index] = { ...inMemoryProducts[index], ...updateData };
      return res.json({ status: 'success', data: inMemoryProducts[index] });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

// Admin: Delete Product
app.delete('/api/catalog/products/:id', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin privilege required to delete products.' });
    }

    const { id } = req.params;

    if (isMongoConnected) {
      await ProductModel.deleteOne({ id });
    } else {
      inMemoryProducts = inMemoryProducts.filter(p => p.id !== id);
    }

    res.json({ status: 'success', message: `Product ${id} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`📦 AETHERCART CATALOG SERVICE RUNNING ON PORT ${PORT}`);
  console.log(`=======================================================`);
});
